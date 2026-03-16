import { Request, Response } from "express";
import { Op } from "sequelize";
import { ZodError } from "zod";
import { AuthRequest } from "../middleware/auth.middleware";
import { Customer, Venue, Lead, User } from "../models";
import {
  createCustomerSchema,
  updateCustomerSchema,
} from "../validation/customer.schemas";

export const createCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const data = createCustomerSchema.parse(req.body);

    if (data.venueId) {
      const venue = await Venue.findByPk(data.venueId);
      if (!venue) {
        return res.status(404).json({ message: "Venue not found" });
      }
    }

    if (data.sourceLeadId) {
      const lead = await Lead.findByPk(data.sourceLeadId);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }

      const existing = await Customer.findOne({
        where: { sourceLeadId: data.sourceLeadId },
      });

      if (existing) {
        return res.status(409).json({
          message: "Customer already exists for this lead",
        });
      }
    }

    const customer = await Customer.create({
      fullName: data.fullName.trim(),
      mobile: data.mobile.trim(),
      mobile2: data.mobile2 ?? null,
      email: data.email ?? null,
      weddingDate: data.weddingDate ?? null,
      guestCount: data.guestCount ?? null,
      venueId: data.venueId ?? null,
      venueNameSnapshot: data.venueNameSnapshot ?? null,
      sourceLeadId: data.sourceLeadId ?? null,
      notes: data.notes ?? null,
      status: data.status ?? "active",
      createdBy: req.user?.id ?? null,
      updatedBy: req.user?.id ?? null,
    });

    const created = await Customer.findByPk(customer.id, {
      include: [
        { model: Venue, as: "venue" },
        { model: Lead, as: "sourceLead" },
        { model: User, as: "createdByUser", attributes: ["id", "fullName"] },
        { model: User, as: "updatedByUser", attributes: ["id", "fullName"] },
      ],
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
  const venueId = Number(req.query.venueId) || undefined;
  const weddingDateFrom = String(req.query.weddingDateFrom ?? "").trim();
  const weddingDateTo = String(req.query.weddingDateTo ?? "").trim();

  const where: any = {};

  if (search) {
    where[Op.or] = [
      { fullName: { [Op.like]: `%${search}%` } },
      { mobile: { [Op.like]: `%${search}%` } },
      { mobile2: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
      { venueNameSnapshot: { [Op.like]: `%${search}%` } },
    ];
  }

  if (status) where.status = status;
  if (venueId) where.venueId = venueId;

  if (weddingDateFrom || weddingDateTo) {
    where.weddingDate = {};
    if (weddingDateFrom) where.weddingDate[Op.gte] = weddingDateFrom;
    if (weddingDateTo) where.weddingDate[Op.lte] = weddingDateTo;
  }

  const { count, rows } = await Customer.findAndCountAll({
    where,
    include: [
      { model: Venue, as: "venue" },
      { model: Lead, as: "sourceLead" },
      { model: User, as: "createdByUser", attributes: ["id", "fullName"] },
      { model: User, as: "updatedByUser", attributes: ["id", "fullName"] },
    ],
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
    include: [
      { model: Venue, as: "venue" },
      { model: Lead, as: "sourceLead" },
      { model: User, as: "createdByUser", attributes: ["id", "fullName"] },
      { model: User, as: "updatedByUser", attributes: ["id", "fullName"] },
    ],
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

    if (typeof data.venueId !== "undefined" && data.venueId !== null) {
      const venue = await Venue.findByPk(data.venueId);
      if (!venue) {
        return res.status(404).json({ message: "Venue not found" });
      }
    }

    await customer.update({
      fullName: data.fullName ?? customer.fullName,
      mobile: data.mobile ?? customer.mobile,
      mobile2:
        typeof data.mobile2 !== "undefined" ? data.mobile2 : customer.mobile2,
      email: typeof data.email !== "undefined" ? data.email : customer.email,
      weddingDate:
        typeof data.weddingDate !== "undefined"
          ? data.weddingDate
          : customer.weddingDate,
      guestCount:
        typeof data.guestCount !== "undefined"
          ? data.guestCount
          : customer.guestCount,
      venueId:
        typeof data.venueId !== "undefined" ? data.venueId : customer.venueId,
      venueNameSnapshot:
        typeof data.venueNameSnapshot !== "undefined"
          ? data.venueNameSnapshot
          : customer.venueNameSnapshot,
      notes: typeof data.notes !== "undefined" ? data.notes : customer.notes,
      status: data.status ?? customer.status,
      updatedBy: req.user?.id ?? null,
    });

    const updated = await Customer.findByPk(id, {
      include: [
        { model: Venue, as: "venue" },
        { model: Lead, as: "sourceLead" },
        { model: User, as: "createdByUser", attributes: ["id", "fullName"] },
        { model: User, as: "updatedByUser", attributes: ["id", "fullName"] },
      ],
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
