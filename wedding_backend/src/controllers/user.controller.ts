import { Request, Response } from "express";
import { ZodError } from "zod";
import { User, Role } from "../models";
import { createUserSchema, updateUserSchema } from "../validation/user.schemas";
import { hashPassword } from "../utils/password";

export const createUser = async (req: Request, res: Response) => {
  try {
    const data = createUserSchema.parse(req.body);

    const existing = await User.findOne({ where: { email: data.email } });
    if (existing) {
      return res.status(409).json({ message: req.t("auth.email_exists") });
    }

    const passwordHash = await hashPassword(data.password);

    const user = await User.create({
      email: data.email,
      password: passwordHash,
      fullName: data.fullName,
      isActive: data.isActive ?? true,
    });

    if (data.roleIds && data.roleIds.length > 0) {
      const roles = await Role.findAll({ where: { id: data.roleIds } });
      await (user as any).setRoles(roles);
    }

    const userWithRoles = await User.findByPk(user.id, {
      attributes: ["id", "email", "fullName", "isActive"],
      include: [{ model: Role }],
    });

    return res.status(201).json({
      message: req.t("auth.user_created"),
      data: userWithRoles,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.errors });
    }
    return res.status(500).json({ message: req.t("common.unexpected_error") });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const { count, rows } = await User.findAndCountAll({
    attributes: ["id", "email", "fullName", "isActive", "createdAt"],
    include: [{ model: Role }],
    order: [["id", "DESC"]],
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

export const getUserById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ message: req.t("common.invalid_id") });
  }

  const user = await User.findByPk(id, {
    attributes: ["id", "email", "fullName", "isActive", "createdAt"],
    include: [{ model: Role }],
  });

  if (!user) {
    return res.status(404).json({ message: req.t("common.not_found") });
  }

  return res.json({ data: user });
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ message: req.t("common.invalid_id") });
    }

    const data = updateUserSchema.parse(req.body);

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: req.t("common.not_found") });
    }

    if (data.email && data.email !== user.email) {
      const exists = await User.findOne({ where: { email: data.email } });
      if (exists) {
        return res.status(409).json({ message: req.t("auth.email_exists") });
      }
    }

    let passwordHash: string | undefined;
    if (data.password) {
      passwordHash = await hashPassword(data.password);
    }

    await user.update({
      email: data.email ?? user.email,
      fullName: data.fullName ?? user.fullName,
      isActive:
        typeof data.isActive === "boolean" ? data.isActive : user.isActive,
      password: passwordHash ?? user.password,
    });

    if (data.roleIds) {
      const roles = await Role.findAll({ where: { id: data.roleIds } });
      await (user as any).setRoles(roles);
    }

    const updated = await User.findByPk(id, {
      attributes: ["id", "email", "fullName", "isActive"],
      include: [{ model: Role }],
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

export const deleteUser = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ message: req.t("common.invalid_id") });
  }

  const user = await User.findByPk(id);
  if (!user) {
    return res.status(404).json({ message: req.t("common.not_found") });
  }

  // paranoid: true => soft delete
  await user.destroy();

  return res.json({ message: req.t("common.deleted_successfully") });
};
