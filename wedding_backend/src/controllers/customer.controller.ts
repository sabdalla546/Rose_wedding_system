import { Request, Response } from "express";
import { Op } from "sequelize";
import { ZodError } from "zod";
import { AuthRequest } from "../middleware/auth.middleware";
import { Customer, User } from "../models";
import {
  createCustomerSchema,
  updateCustomerSchema,
} from "../validation/customer.schemas";

const customerInclude = [
  { model: User, as: "createdByUser", attributes: ["id", "fullName"] },
  { model: User, as: "updatedByUser", attributes: ["id", "fullName"] },
];

export const createCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const data = createCustomerSchema.parse(req.body);

    const customer = await Customer.create({
      fullName: data.fullName.trim(),
      mobile: data.mobile.trim(),
      mobile2: data.mobile2?.trim() || null,
      email: data.email?.trim() || null,
      notes: data.notes ?? null,
      status: data.status ?? "active",
      createdBy: req.user?.id ?? null,
      updatedBy: req.user?.id ?? null,
    });

    const created = await Customer.findByPk(customer.id, {
      include: customerInclude,
    });

    return res.status(201).json({
      message: "Customer created successfully",
      data: created,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.errors });
    }

    return res.status(500).json({ message: req.t("common.unexpected_error") });
  }
};

export const getCustomers = async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const search = String(req.query.search ?? "").trim();
  const status = String(req.query.status ?? "").trim();

  const where: any = {};

  if (search) {
    where[Op.or] = [
      { fullName: { [Op.like]: `%${search}%` } },
      { mobile: { [Op.like]: `%${search}%` } },
      { mobile2: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
      { notes: { [Op.like]: `%${search}%` } },
    ];
  }

  if (status) {
    where.status = status;
  }

  const { count, rows } = await Customer.findAndCountAll({
    where,
    include: customerInclude,
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

export const getCustomerById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ message: req.t("common.invalid_id") });
  }

  const customer = await Customer.findByPk(id, {
    include: customerInclude,
  });

  if (!customer) {
    return res.status(404).json({ message: req.t("common.not_found") });
  }

  return res.json({ data: customer });
};

export const updateCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ message: req.t("common.invalid_id") });
    }

    const data = updateCustomerSchema.parse(req.body);
    const customer = await Customer.findByPk(id);

    if (!customer) {
      return res.status(404).json({ message: req.t("common.not_found") });
    }

    await customer.update({
      fullName:
        typeof data.fullName !== "undefined"
          ? data.fullName.trim()
          : customer.fullName,
      mobile:
        typeof data.mobile !== "undefined"
          ? data.mobile.trim()
          : customer.mobile,
      mobile2:
        typeof data.mobile2 !== "undefined"
          ? data.mobile2?.trim() || null
          : customer.mobile2,
      email:
        typeof data.email !== "undefined"
          ? data.email?.trim() || null
          : customer.email,
      notes: typeof data.notes !== "undefined" ? data.notes : customer.notes,
      status: data.status ?? customer.status,
      updatedBy: req.user?.id ?? null,
    });

    const updated = await Customer.findByPk(id, {
      include: customerInclude,
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

export const deleteCustomer = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ message: req.t("common.invalid_id") });
  }

  const customer = await Customer.findByPk(id);

  if (!customer) {
    return res.status(404).json({ message: req.t("common.not_found") });
  }

  await customer.destroy();

  return res.json({ message: req.t("common.deleted_successfully") });
};
