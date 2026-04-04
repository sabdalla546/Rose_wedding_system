import { promises as fs } from "fs";
import path from "path";
import { Request, Response } from "express";
import { Op } from "sequelize";
import { ZodError } from "zod";

import { AuthRequest } from "../middleware/auth.middleware";
import { InventoryItem, User } from "../models";
import {
  createInventoryItemSchema,
  updateInventoryItemSchema,
} from "../validation/inventory.schemas";

const inventoryInclude = [
  { model: User, as: "createdByUser", attributes: ["id", "fullName"] },
  { model: User, as: "updatedByUser", attributes: ["id", "fullName"] },
];

const uploadsRoot = path.join(process.cwd(), "uploads");

const parseBooleanQuery = (value: unknown) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();

  if (["true", "1", "yes"].includes(normalized)) {
    return true;
  }

  if (["false", "0", "no"].includes(normalized)) {
    return false;
  }

  return undefined;
};

const getStoredImagePath = (file?: Express.Multer.File | null) => {
  if (!file) {
    return null;
  }

  return path.posix.join("uploads", "inventory", file.filename);
};

const resolveImageUrl = (req: Request, imagePath?: string | null) => {
  if (!imagePath) {
    return null;
  }

  const normalized = imagePath.replace(/\\/g, "/");
  const relativePath = normalized.startsWith("/")
    ? normalized
    : `/${normalized}`;

  return `${req.protocol}://${req.get("host")}${relativePath}`;
};

const resolveAbsoluteStoredFilePath = (relativePath?: string | null) => {
  if (!relativePath) {
    return null;
  }

  const absolutePath = path.resolve(process.cwd(), relativePath);
  const normalizedUploadsRoot = path.resolve(uploadsRoot) + path.sep;

  if (
    absolutePath !== path.resolve(uploadsRoot) &&
    !absolutePath.startsWith(normalizedUploadsRoot)
  ) {
    return null;
  }

  return absolutePath;
};

const removeStoredFileIfExists = async (relativePath?: string | null) => {
  const absolutePath = resolveAbsoluteStoredFilePath(relativePath);

  if (!absolutePath) {
    return;
  }

  try {
    await fs.unlink(absolutePath);
  } catch (error: any) {
    if (error?.code !== "ENOENT") {
      console.warn(`Failed to delete inventory image at ${absolutePath}`, error);
    }
  }
};

const serializeInventoryItem = (req: Request, inventoryItem: any) => {
  if (!inventoryItem) {
    return inventoryItem;
  }

  const plain =
    typeof inventoryItem.toJSON === "function"
      ? inventoryItem.toJSON()
      : inventoryItem;

  return {
    id: plain.id,
    name: plain.name,
    quantity: plain.quantity,
    imagePath: plain.imagePath ?? null,
    imageUrl: resolveImageUrl(req, plain.imagePath),
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    createdByUser: plain.createdByUser ?? null,
    updatedByUser: plain.updatedByUser ?? null,
  };
};

export const createInventoryItem = async (req: AuthRequest, res: Response) => {
  let uploadedImagePath = getStoredImagePath(req.file);
  let shouldDeleteUploadedImage = Boolean(uploadedImagePath);

  try {
    const data = createInventoryItemSchema.parse(req.body);

    const inventoryItem = await InventoryItem.create({
      name: data.name.trim(),
      quantity: data.quantity,
      imagePath: uploadedImagePath,
      createdBy: req.user?.id ?? null,
      updatedBy: req.user?.id ?? null,
    });

    shouldDeleteUploadedImage = false;

    const created = await InventoryItem.findByPk(inventoryItem.id, {
      include: inventoryInclude,
    });

    return res.status(201).json({
      message: "Inventory item created successfully",
      data: serializeInventoryItem(req, created),
    });
  } catch (err) {
    if (shouldDeleteUploadedImage) {
      await removeStoredFileIfExists(uploadedImagePath);
    }

    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.errors });
    }

    return res.status(500).json({ message: req.t("common.unexpected_error") });
  }
};

export const getInventoryItems = async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const search = String(req.query.search ?? "").trim();
  const inStock = parseBooleanQuery(req.query.inStock);
  const outOfStock = parseBooleanQuery(req.query.outOfStock);

  const where: any = {};

  if (search) {
    where.name = {
      [Op.like]: `%${search}%`,
    };
  }

  if (inStock === true && outOfStock !== true) {
    where.quantity = { [Op.gt]: 0 };
  } else if (outOfStock === true && inStock !== true) {
    where.quantity = 0;
  }

  const { count, rows } = await InventoryItem.findAndCountAll({
    where,
    include: inventoryInclude,
    order: [["id", "DESC"]],
    limit,
    offset,
  });

  return res.json({
    data: rows.map((row) => serializeInventoryItem(req, row)),
    meta: {
      total: count,
      page,
      limit,
      pages: Math.ceil(count / limit),
    },
  });
};

export const getInventoryItemById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ message: req.t("common.invalid_id") });
  }

  const inventoryItem = await InventoryItem.findByPk(id, {
    include: inventoryInclude,
  });

  if (!inventoryItem) {
    return res.status(404).json({ message: req.t("common.not_found") });
  }

  return res.json({ data: serializeInventoryItem(req, inventoryItem) });
};

export const updateInventoryItem = async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  const uploadedImagePath = getStoredImagePath(req.file);
  let shouldDeleteUploadedImage = Boolean(uploadedImagePath);

  try {
    if (!id) {
      if (shouldDeleteUploadedImage) {
        await removeStoredFileIfExists(uploadedImagePath);
      }

      return res.status(400).json({ message: req.t("common.invalid_id") });
    }

    const data = updateInventoryItemSchema.parse(req.body);
    const inventoryItem = await InventoryItem.findByPk(id);

    if (!inventoryItem) {
      if (shouldDeleteUploadedImage) {
        await removeStoredFileIfExists(uploadedImagePath);
      }

      return res.status(404).json({ message: req.t("common.not_found") });
    }

    const previousImagePath = inventoryItem.imagePath;

    await inventoryItem.update({
      name:
        typeof data.name !== "undefined" ? data.name.trim() : inventoryItem.name,
      quantity:
        typeof data.quantity !== "undefined"
          ? data.quantity
          : inventoryItem.quantity,
      imagePath:
        typeof uploadedImagePath === "string"
          ? uploadedImagePath
          : inventoryItem.imagePath,
      updatedBy: req.user?.id ?? null,
    });

    shouldDeleteUploadedImage = false;

    if (uploadedImagePath && previousImagePath && previousImagePath !== uploadedImagePath) {
      await removeStoredFileIfExists(previousImagePath);
    }

    const updated = await InventoryItem.findByPk(id, {
      include: inventoryInclude,
    });

    return res.json({
      message: req.t("common.updated_successfully"),
      data: serializeInventoryItem(req, updated),
    });
  } catch (err) {
    if (shouldDeleteUploadedImage) {
      await removeStoredFileIfExists(uploadedImagePath);
    }

    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.errors });
    }

    return res.status(500).json({ message: req.t("common.unexpected_error") });
  }
};

export const deleteInventoryItem = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ message: req.t("common.invalid_id") });
  }

  const inventoryItem = await InventoryItem.findByPk(id);

  if (!inventoryItem) {
    return res.status(404).json({ message: req.t("common.not_found") });
  }

  const imagePath = inventoryItem.imagePath;

  await inventoryItem.destroy();
  await removeStoredFileIfExists(imagePath);

  return res.json({ message: req.t("common.deleted_successfully") });
};
