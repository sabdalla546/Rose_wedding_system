import { Request, Response } from "express";
import { Op } from "sequelize";
import { ZodError } from "zod";

import { Lead, Venue, User, Appointment, Customer } from "../models";
import { AuthRequest } from "../middleware/auth.middleware";
import { createLeadSchema, updateLeadSchema } from "../validation/lead.schemas";
import { markLeadLostSchema } from "../validation/lead-action.schemas";
import { convertLeadToCustomerRealSchema } from "../validation/customer.schemas";
export const createLead = async (req: AuthRequest, res: Response) => {
  try {
    const data = createLeadSchema.parse(req.body);

    if (data.venueId) {
      const venue = await Venue.findByPk(data.venueId);
      if (!venue) {
        return res.status(404).json({ message: "Venue not found" });
      }
    }

    const lead = await Lead.create({
      fullName: data.fullName.trim(),
      mobile: data.mobile.trim(),
      mobile2: data.mobile2 ?? null,
      email: data.email ?? null,
      weddingDate: data.weddingDate,
      guestCount: data.guestCount ?? null,
      venueId: data.venueId ?? null,
      venueNameSnapshot: data.venueNameSnapshot ?? null,
      source: data.source ?? null,
      status: data.status ?? "new",
      notes: data.notes ?? null,
      createdBy: req.user?.id ?? null,
      updatedBy: req.user?.id ?? null,
    });

    const created = await Lead.findByPk(lead.id, {
      include: [
        { model: Venue, as: "venue" },
        { model: User, as: "createdByUser", attributes: ["id", "fullName"] },
        { model: User, as: "updatedByUser", attributes: ["id", "fullName"] },
      ],
    });

    return res.status(201).json({
      message: "Lead created successfully",
      data: created,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.errors });
    }

    return res.status(500).json({ message: req.t("common.unexpected_error") });
  }
};

export const getLeads = async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const search = String(req.query.search ?? "").trim();

  const status = String(req.query.status ?? "").trim();
  const venueId = Number(req.query.venueId) || undefined;
  const source = String(req.query.source ?? "").trim();
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
  if (source) where.source = source;

  if (weddingDateFrom || weddingDateTo) {
    where.weddingDate = {};
    if (weddingDateFrom) where.weddingDate[Op.gte] = weddingDateFrom;
    if (weddingDateTo) where.weddingDate[Op.lte] = weddingDateTo;
  }

  const { count, rows } = await Lead.findAndCountAll({
    where,
    include: [
      { model: Venue, as: "venue" },
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

export const getLeadById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ message: req.t("common.invalid_id") });
  }

  const lead = await Lead.findByPk(id, {
    include: [
      { model: Venue, as: "venue" },
      {
        model: Appointment,
        as: "appointments",
        separate: true,
        order: [["id", "DESC"]],
      },
      {
        model: Customer,
        as: "customer",
        include: [{ model: Venue, as: "venue" }],
      },
      { model: User, as: "createdByUser", attributes: ["id", "fullName"] },
      { model: User, as: "updatedByUser", attributes: ["id", "fullName"] },
    ],
  });

  if (!lead) {
    return res.status(404).json({ message: req.t("common.not_found") });
  }

  return res.json({ data: lead });
};

export const updateLead = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ message: req.t("common.invalid_id") });
    }

    const data = updateLeadSchema.parse(req.body);

    const lead = await Lead.findByPk(id);

    if (!lead) {
      return res.status(404).json({ message: req.t("common.not_found") });
    }

    if (typeof data.venueId !== "undefined" && data.venueId !== null) {
      const venue = await Venue.findByPk(data.venueId);
      if (!venue) {
        return res.status(404).json({ message: "Venue not found" });
      }
    }

    await lead.update({
      fullName: data.fullName ?? lead.fullName,
      mobile: data.mobile ?? lead.mobile,
      mobile2:
        typeof data.mobile2 !== "undefined" ? data.mobile2 : lead.mobile2,
      email: typeof data.email !== "undefined" ? data.email : lead.email,
      weddingDate: data.weddingDate ?? lead.weddingDate,
      guestCount:
        typeof data.guestCount !== "undefined"
          ? data.guestCount
          : lead.guestCount,
      venueId:
        typeof data.venueId !== "undefined" ? data.venueId : lead.venueId,
      venueNameSnapshot:
        typeof data.venueNameSnapshot !== "undefined"
          ? data.venueNameSnapshot
          : lead.venueNameSnapshot,
      source: typeof data.source !== "undefined" ? data.source : lead.source,
      status: data.status ?? lead.status,
      notes: typeof data.notes !== "undefined" ? data.notes : lead.notes,
      convertedToCustomer:
        typeof data.convertedToCustomer === "boolean"
          ? data.convertedToCustomer
          : lead.convertedToCustomer,
      convertedCustomerId:
        typeof data.convertedCustomerId !== "undefined"
          ? data.convertedCustomerId
          : lead.convertedCustomerId,
      updatedBy: req.user?.id ?? null,
    });

    const updated = await Lead.findByPk(id, {
      include: [
        { model: Venue, as: "venue" },
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

export const deleteLead = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ message: req.t("common.invalid_id") });
  }

  const lead = await Lead.findByPk(id);

  if (!lead) {
    return res.status(404).json({ message: req.t("common.not_found") });
  }

  await lead.destroy();

  return res.json({ message: req.t("common.deleted_successfully") });
};

export const markLeadLost = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ message: req.t("common.invalid_id") });
    }

    const data = markLeadLostSchema.parse(req.body);

    const lead = await Lead.findByPk(id, {
      include: [
        { model: Venue, as: "venue" },
        { model: User, as: "createdByUser", attributes: ["id", "fullName"] },
        { model: User, as: "updatedByUser", attributes: ["id", "fullName"] },
      ],
    });

    if (!lead) {
      return res.status(404).json({ message: req.t("common.not_found") });
    }

    if (lead.status === "converted") {
      return res.status(400).json({
        message: "Converted lead cannot be marked as lost",
      });
    }

    const mergedNotes = [data.reason, data.notes].filter(Boolean).join(" | ");

    await lead.update({
      status: "lost",
      notes: mergedNotes ? mergedNotes : lead.notes,
      updatedBy: req.user?.id ?? null,
    });

    const updated = await Lead.findByPk(id, {
      include: [
        { model: Venue, as: "venue" },
        {
          model: Appointment,
          as: "appointments",
          separate: true,
          order: [["id", "DESC"]],
        },
        { model: User, as: "createdByUser", attributes: ["id", "fullName"] },
        { model: User, as: "updatedByUser", attributes: ["id", "fullName"] },
      ],
    });

    return res.json({
      message: "Lead marked as lost successfully",
      data: updated,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.errors });
    }

    return res.status(500).json({ message: req.t("common.unexpected_error") });
  }
};
export const convertLeadToCustomer = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ message: req.t("common.invalid_id") });
    }

    const data = convertLeadToCustomerRealSchema.parse(req.body);

    const lead = await Lead.findByPk(id, {
      include: [
        { model: Venue, as: "venue" },
        {
          model: Appointment,
          as: "appointments",
          separate: true,
          order: [["id", "DESC"]],
        },
      ],
    });

    if (!lead) {
      return res.status(404).json({ message: req.t("common.not_found") });
    }

    if (lead.status === "lost" || lead.status === "cancelled") {
      return res.status(400).json({
        message: "Lost or cancelled lead cannot be converted",
      });
    }

    if (lead.convertedToCustomer || lead.convertedCustomerId) {
      return res.status(400).json({
        message: "Lead is already converted",
      });
    }

    const existingCustomer = await Customer.findOne({
      where: { sourceLeadId: lead.id },
    });

    if (existingCustomer) {
      return res.status(400).json({
        message: "A customer already exists for this lead",
      });
    }

    if (
      typeof data.customer?.venueId !== "undefined" &&
      data.customer?.venueId !== null
    ) {
      const venue = await Venue.findByPk(data.customer.venueId);
      if (!venue) {
        return res.status(404).json({ message: "Venue not found" });
      }
    } else if (lead.venueId) {
      const venue = await Venue.findByPk(lead.venueId);
      if (!venue) {
        return res.status(404).json({ message: "Lead venue not found" });
      }
    }

    const mergedCustomerNotes = [lead.notes, data.customer?.notes, data.notes]
      .filter(Boolean)
      .join(" | ");

    const customer = await Customer.create({
      fullName: data.customer?.fullName ?? lead.fullName,
      mobile: data.customer?.mobile ?? lead.mobile,
      mobile2:
        typeof data.customer?.mobile2 !== "undefined"
          ? data.customer.mobile2
          : lead.mobile2,
      email:
        typeof data.customer?.email !== "undefined"
          ? data.customer.email
          : lead.email,
      weddingDate:
        typeof data.customer?.weddingDate !== "undefined"
          ? data.customer.weddingDate
          : lead.weddingDate,
      guestCount:
        typeof data.customer?.guestCount !== "undefined"
          ? data.customer.guestCount
          : lead.guestCount,
      venueId:
        typeof data.customer?.venueId !== "undefined"
          ? data.customer.venueId
          : lead.venueId,
      venueNameSnapshot:
        typeof data.customer?.venueNameSnapshot !== "undefined"
          ? data.customer.venueNameSnapshot
          : lead.venueNameSnapshot,
      sourceLeadId: lead.id,
      notes: mergedCustomerNotes || null,
      status: data.customer?.status ?? "active",
      createdBy: req.user?.id ?? null,
      updatedBy: req.user?.id ?? null,
    });

    await lead.update({
      status: "converted",
      convertedToCustomer: true,
      convertedCustomerId: customer.id,
      updatedBy: req.user?.id ?? null,
    });

    const updatedLead = await Lead.findByPk(id, {
      include: [
        { model: Venue, as: "venue" },
        {
          model: Appointment,
          as: "appointments",
          separate: true,
          order: [["id", "DESC"]],
        },
        {
          model: Customer,
          as: "customer",
          include: [{ model: Venue, as: "venue" }],
        },
        { model: User, as: "createdByUser", attributes: ["id", "fullName"] },
        { model: User, as: "updatedByUser", attributes: ["id", "fullName"] },
      ],
    });

    return res.json({
      message: "Lead converted to customer successfully",
      data: {
        lead: updatedLead,
        customer,
      },
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.errors });
    }

    return res.status(500).json({ message: req.t("common.unexpected_error") });
  }
};
