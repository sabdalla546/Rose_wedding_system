import { Request, Response } from "express";
import { ZodError } from "zod";
import { Permission, Role } from "../models";
import {
  createPermissionSchema,
  updatePermissionSchema,
} from "../validation/permission.schemas";

export const createPermission = async (req: Request, res: Response) => {
  try {
    const data = createPermissionSchema.parse(req.body);

    const existing = await Permission.findOne({ where: { code: data.code } });
    if (existing) {
      return res
        .status(409)
        .json({ message: req.t("permissions.code_exists") });
    }

    const permission = await Permission.create({
      code: data.code,
      description: data.description,
    });

    return res.status(201).json({
      message: req.t("permissions.created"),
      data: permission,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.errors });
    }
    return res.status(500).json({ message: req.t("common.unexpected_error") });
  }
};

export const getPermissions = async (_req: Request, res: Response) => {
  const permissions = await Permission.findAll({
    order: [["code", "ASC"]],
  });

  return res.json({ data: permissions });
};

export const getPermissionById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ message: req.t("common.invalid_id") });
  }

  const permission = await Permission.findByPk(id);
  if (!permission) {
    return res.status(404).json({ message: req.t("common.not_found") });
  }

  return res.json({ data: permission });
};

export const updatePermission = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ message: req.t("common.invalid_id") });
    }

    const data = updatePermissionSchema.parse(req.body);

    const permission = await Permission.findByPk(id);
    if (!permission) {
      return res.status(404).json({ message: req.t("common.not_found") });
    }

    if (data.code && data.code !== permission.code) {
      const exists = await Permission.findOne({ where: { code: data.code } });
      if (exists) {
        return res
          .status(409)
          .json({ message: req.t("permissions.code_exists") });
      }
    }

    await permission.update({
      code: data.code ?? permission.code,
      description: data.description ?? permission.description,
    });

    return res.json({
      message: req.t("common.updated_successfully"),
      data: permission,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.errors });
    }
    return res.status(500).json({ message: req.t("common.unexpected_error") });
  }
};

export const deletePermission = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ message: req.t("common.invalid_id") });
  }

  const permission = await Permission.findByPk(id);
  if (!permission) {
    return res.status(404).json({ message: req.t("common.not_found") });
  }

  const rolesCount = await Role.count({
    include: [{ model: Permission, where: { id } }],
  });

  if (rolesCount > 0) {
    return res.status(400).json({
      message: req.t("permissions.cannot_delete_with_roles"),
    });
  }

  await permission.destroy();

  return res.json({ message: req.t("common.deleted_successfully") });
};
