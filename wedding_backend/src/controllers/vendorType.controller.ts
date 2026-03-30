import { Request, Response } from "express";
import { Op } from "sequelize";
import { ZodError } from "zod";
import { AuthRequest } from "../middleware/auth.middleware";
import { User, Vendor, VendorType } from "../models";
import {
  createVendorTypeSchema,
  updateVendorTypeSchema,
} from "../validation/vendorType.schemas";

const userAuditInclude = [
  { model: User, as: "createdByUser", attributes: ["id", "fullName"] },
  { model: User, as: "updatedByUser", attributes: ["id", "fullName"] },
];

const slugifyVendorType = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");

const buildNextVendorTypeSlug = ({
  slug,
  name,
  nameAr,
}: {
  slug?: string;
  name?: string;
  nameAr?: string;
}) => {
  const candidate = slug ?? name ?? nameAr ?? "";
  const normalizedSlug = slugifyVendorType(candidate);

  return normalizedSlug || `vendor-type-${Date.now()}`;
};

const findVendorTypeBySlug = async ({
  slug,
  excludeId,
}: {
  slug: string;
  excludeId?: number;
}) =>
  VendorType.findOne({
    where: {
      slug,
      ...(excludeId ? { id: { [Op.ne]: excludeId } } : {}),
    },
  });

export const createVendorType = async (req: AuthRequest, res: Response) => {
  try {
    const data = createVendorTypeSchema.parse(req.body);
    const slug = buildNextVendorTypeSlug(data);
    const existingVendorType = await findVendorTypeBySlug({ slug });

    if (existingVendorType) {
      return res.status(400).json({
        message: "Vendor type slug already exists",
      });
    }

    const vendorType = await VendorType.create({
      name: data.name.trim(),
      nameAr: data.nameAr.trim(),
      slug,
      isActive: data.isActive ?? true,
      sortOrder: data.sortOrder ?? 0,
      createdBy: req.user?.id ?? null,
      updatedBy: req.user?.id ?? null,
    });

    const created = await VendorType.findByPk(vendorType.id, {
      include: userAuditInclude,
    });

    return res.status(201).json({
      message: "Vendor type created successfully",
      data: created,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.errors });
    }

    return res.status(500).json({ message: req.t("common.unexpected_error") });
  }
};

export const getVendorTypes = async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const search = String(req.query.search ?? "").trim();
  const isActive =
    typeof req.query.isActive !== "undefined"
      ? String(req.query.isActive) === "true"
      : undefined;
  const activeOnly = String(req.query.activeOnly ?? "") === "true";

  const where: any = {};

  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { nameAr: { [Op.like]: `%${search}%` } },
      { slug: { [Op.like]: `%${search}%` } },
    ];
  }

  if (activeOnly) {
    where.isActive = true;
  } else if (typeof isActive === "boolean") {
    where.isActive = isActive;
  }

  const { count, rows } = await VendorType.findAndCountAll({
    where,
    include: userAuditInclude,
    order: [
      ["sortOrder", "ASC"],
      ["id", "DESC"],
    ],
    limit,
    offset,
  });

  return res.json({
    data: rows,
    meta: {
      total: count,
      page,
      limit,
      pages: Math.ceil(count / limit),
    },
  });
};

export const getVendorTypeById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ message: req.t("common.invalid_id") });
  }

  const vendorType = await VendorType.findByPk(id, {
    include: userAuditInclude,
  });

  if (!vendorType) {
    return res.status(404).json({ message: req.t("common.not_found") });
  }

  return res.json({ data: vendorType });
};

export const updateVendorType = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ message: req.t("common.invalid_id") });
    }

    const data = updateVendorTypeSchema.parse(req.body);
    const vendorType = await VendorType.findByPk(id);

    if (!vendorType) {
      return res.status(404).json({ message: req.t("common.not_found") });
    }

    const slug =
      typeof data.slug !== "undefined" ||
      typeof data.name !== "undefined" ||
      typeof data.nameAr !== "undefined"
        ? buildNextVendorTypeSlug({
            slug: data.slug,
            name: data.name ?? vendorType.name,
            nameAr: data.nameAr ?? vendorType.nameAr,
          })
        : vendorType.slug;

    const existingVendorType = await findVendorTypeBySlug({
      slug,
      excludeId: vendorType.id,
    });

    if (existingVendorType) {
      return res.status(400).json({
        message: "Vendor type slug already exists",
      });
    }

    await vendorType.update({
      name: data.name?.trim() ?? vendorType.name,
      nameAr: data.nameAr?.trim() ?? vendorType.nameAr,
      slug,
      isActive:
        typeof data.isActive !== "undefined" ? data.isActive : vendorType.isActive,
      sortOrder:
        typeof data.sortOrder !== "undefined"
          ? data.sortOrder
          : vendorType.sortOrder,
      updatedBy: req.user?.id ?? null,
    });

    const updated = await VendorType.findByPk(id, {
      include: userAuditInclude,
    });

    return res.json({
      message: req.t("common.updated_successfully"),
      data: updated,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.errors });
    }

    return res.status(500).json({ message: req.t("common.unexpected_error") });
  }
};

export const deleteVendorType = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ message: req.t("common.invalid_id") });
  }

  const vendorType = await VendorType.findByPk(id);

  if (!vendorType) {
    return res.status(404).json({ message: req.t("common.not_found") });
  }

  const linkedVendorsCount = await Vendor.count({
    where: {
      [Op.or]: [{ typeId: vendorType.id }, { type: vendorType.slug }],
    },
  });

  if (linkedVendorsCount > 0) {
    return res.status(400).json({
      message: "Vendor type cannot be deleted because it is already used by vendors",
    });
  }

  await vendorType.destroy();

  return res.json({ message: req.t("common.deleted_successfully") });
};
