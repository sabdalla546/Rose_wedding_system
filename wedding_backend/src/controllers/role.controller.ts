import { Request, Response } from "express";
import { ZodError } from "zod";
import { Role, Permission, User } from "../models";
import { createRoleSchema, updateRoleSchema } from "../validation/role.schemas";

export const createRole = async (req: Request, res: Response) => {
  try {
    const data = createRoleSchema.parse(req.body);

    const existing = await Role.findOne({ where: { name: data.name } });
    if (existing) {
      return res.status(409).json({ message: req.t("roles.name_exists") });
    }

    const role = await Role.create({
      name: data.name,
      description: data.description,
    });

    if (data.permissionIds && data.permissionIds.length > 0) {
      const perms = await Permission.findAll({
        where: { id: data.permissionIds },
      });
      await (role as any).setPermissions(perms);
    }

    const created = await Role.findByPk(role.id, {
      include: [{ model: Permission }],
    });

    return res.status(201).json({
      message: req.t("roles.created"),
      data: created,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.errors });
    }
    return res.status(500).json({ message: req.t("common.unexpected_error") });
  }
};

export const getRoles = async (_req: Request, res: Response) => {
  const roles = await Role.findAll({
    include: [{ model: Permission }],
    order: [["id", "ASC"]],
  });

  return res.json({ data: roles });
};

export const getRoleById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ message: req.t("common.invalid_id") });
  }

  const role = await Role.findByPk(id, {
    include: [{ model: Permission }],
  });

  if (!role) {
    return res.status(404).json({ message: req.t("common.not_found") });
  }

  return res.json({ data: role });
};

export const updateRole = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ message: req.t("common.invalid_id") });
    }

    const data = updateRoleSchema.parse(req.body);

    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({ message: req.t("common.not_found") });
    }

    if (data.name && data.name !== role.name) {
      const exists = await Role.findOne({ where: { name: data.name } });
      if (exists) {
        return res.status(409).json({ message: req.t("roles.name_exists") });
      }
    }

    await role.update({
      name: data.name ?? role.name,
      description: data.description ?? role.description,
    });

    if (data.permissionIds) {
      const perms = await Permission.findAll({
        where: { id: data.permissionIds },
      });
      await (role as any).setPermissions(perms);
    }

    const updated = await Role.findByPk(id, {
      include: [{ model: Permission }],
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

export const deleteRole = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ message: req.t("common.invalid_id") });
  }

  const role = await Role.findByPk(id);
  if (!role) {
    return res.status(404).json({ message: req.t("common.not_found") });
  }

  const usersCount = await User.count({
    include: [{ model: Role, where: { id } }],
  });

  if (usersCount > 0) {
    return res.status(400).json({
      message: req.t("roles.cannot_delete_with_users"),
    });
  }

  await role.destroy();

  return res.json({ message: req.t("common.deleted_successfully") });
};
