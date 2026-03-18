import { Request, Response } from "express";
import { Op } from "sequelize";
import { ZodError } from "zod";
import { AuthRequest } from "../middleware/auth.middleware";
import { Vendor, EventVendor, Event, User } from "../models";
import {
  createVendorSchema,
  updateVendorSchema,
  createEventVendorSchema,
  updateEventVendorSchema,
} from "../validation/vendor.schemas";

export const createVendor = async (req: AuthRequest, res: Response) => {
  try {
    const data = createVendorSchema.parse(req.body);

    const vendor = await Vendor.create({
      name: data.name.trim(),
      type: data.type,
      contactPerson: data.contactPerson ?? null,
      phone: data.phone ?? null,
      phone2: data.phone2 ?? null,
      email: data.email ?? null,
      address: data.address ?? null,
      notes: data.notes ?? null,
      isActive: data.isActive ?? true,
      createdBy: req.user?.id ?? null,
      updatedBy: req.user?.id ?? null,
    });

    const created = await Vendor.findByPk(vendor.id, {
      include: [
        { model: User, as: "createdByUser", attributes: ["id", "fullName"] },
        { model: User, as: "updatedByUser", attributes: ["id", "fullName"] },
      ],
    });

    return res.status(201).json({
      message: "Vendor created successfully",
      data: created,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.errors });
    }
    return res.status(500).json({ message: req.t("common.unexpected_error") });
  }
};

export const getVendors = async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const search = String(req.query.search ?? "").trim();
  const type = String(req.query.type ?? "").trim();
  const isActive =
    typeof req.query.isActive !== "undefined"
      ? String(req.query.isActive) === "true"
      : undefined;

  const where: any = {};

  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { contactPerson: { [Op.like]: `%${search}%` } },
      { phone: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
    ];
  }

  if (type) where.type = type;
  if (typeof isActive === "boolean") where.isActive = isActive;

  const { count, rows } = await Vendor.findAndCountAll({
    where,
    include: [
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

export const getVendorById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ message: req.t("common.invalid_id") });
  }

  const vendor = await Vendor.findByPk(id, {
    include: [
      { model: User, as: "createdByUser", attributes: ["id", "fullName"] },
      { model: User, as: "updatedByUser", attributes: ["id", "fullName"] },
    ],
  });

  if (!vendor) {
    return res.status(404).json({ message: req.t("common.not_found") });
  }

  return res.json({ data: vendor });
};

export const updateVendor = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ message: req.t("common.invalid_id") });
    }

    const data = updateVendorSchema.parse(req.body);

    const vendor = await Vendor.findByPk(id);
    if (!vendor) {
      return res.status(404).json({ message: req.t("common.not_found") });
    }

    await vendor.update({
      name: data.name ?? vendor.name,
      type: data.type ?? vendor.type,
      contactPerson:
        typeof data.contactPerson !== "undefined"
          ? data.contactPerson
          : vendor.contactPerson,
      phone: typeof data.phone !== "undefined" ? data.phone : vendor.phone,
      phone2: typeof data.phone2 !== "undefined" ? data.phone2 : vendor.phone2,
      email: typeof data.email !== "undefined" ? data.email : vendor.email,
      address:
        typeof data.address !== "undefined" ? data.address : vendor.address,
      notes: typeof data.notes !== "undefined" ? data.notes : vendor.notes,
      isActive:
        typeof data.isActive !== "undefined" ? data.isActive : vendor.isActive,
      updatedBy: req.user?.id ?? null,
    });

    const updated = await Vendor.findByPk(id, {
      include: [
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

export const deleteVendor = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ message: req.t("common.invalid_id") });
  }

  const vendor = await Vendor.findByPk(id);
  if (!vendor) {
    return res.status(404).json({ message: req.t("common.not_found") });
  }

  await vendor.destroy();

  return res.json({ message: req.t("common.deleted_successfully") });
};

export const createEventVendor = async (req: AuthRequest, res: Response) => {
  try {
    const data = createEventVendorSchema.parse(req.body);

    const event = await Event.findByPk(data.eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (data.vendorId) {
      const vendor = await Vendor.findByPk(data.vendorId);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
    }

    const eventVendor = await EventVendor.create({
      eventId: data.eventId,
      vendorType: data.vendorType,
      providedBy: data.providedBy,
      vendorId: data.vendorId ?? null,
      companyNameSnapshot: data.companyNameSnapshot ?? null,
      notes: data.notes ?? null,
      status: data.status ?? "pending",
      createdBy: req.user?.id ?? null,
      updatedBy: req.user?.id ?? null,
    });

    const created = await EventVendor.findByPk(eventVendor.id, {
      include: [
        { model: Vendor, as: "vendor" },
        { model: Event, as: "event" },
        { model: User, as: "createdByUser", attributes: ["id", "fullName"] },
        { model: User, as: "updatedByUser", attributes: ["id", "fullName"] },
      ],
    });

    return res.status(201).json({
      message: "Event vendor created successfully",
      data: created,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.errors });
    }
    return res.status(500).json({ message: req.t("common.unexpected_error") });
  }
};

export const getEventVendors = async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const eventId = Number(req.query.eventId) || undefined;
  const vendorType = String(req.query.vendorType ?? "").trim();
  const providedBy = String(req.query.providedBy ?? "").trim();
  const status = String(req.query.status ?? "").trim();

  const where: any = {};

  if (eventId) where.eventId = eventId;
  if (vendorType) where.vendorType = vendorType;
  if (providedBy) where.providedBy = providedBy;
  if (status) where.status = status;

  const { count, rows } = await EventVendor.findAndCountAll({
    where,
    include: [
      { model: Vendor, as: "vendor" },
      { model: Event, as: "event" },
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

export const getEventVendorById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ message: req.t("common.invalid_id") });
  }

  const eventVendor = await EventVendor.findByPk(id, {
    include: [
      { model: Vendor, as: "vendor" },
      { model: Event, as: "event" },
      { model: User, as: "createdByUser", attributes: ["id", "fullName"] },
      { model: User, as: "updatedByUser", attributes: ["id", "fullName"] },
    ],
  });

  if (!eventVendor) {
    return res.status(404).json({ message: req.t("common.not_found") });
  }

  return res.json({ data: eventVendor });
};

export const updateEventVendor = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ message: req.t("common.invalid_id") });
    }

    const data = updateEventVendorSchema.parse(req.body);

    const eventVendor = await EventVendor.findByPk(id);
    if (!eventVendor) {
      return res.status(404).json({ message: req.t("common.not_found") });
    }

    if (typeof data.vendorId !== "undefined" && data.vendorId !== null) {
      const vendor = await Vendor.findByPk(data.vendorId);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
    }

    await eventVendor.update({
      vendorType: data.vendorType ?? eventVendor.vendorType,
      providedBy: data.providedBy ?? eventVendor.providedBy,
      vendorId:
        typeof data.vendorId !== "undefined"
          ? data.vendorId
          : eventVendor.vendorId,
      companyNameSnapshot:
        typeof data.companyNameSnapshot !== "undefined"
          ? data.companyNameSnapshot
          : eventVendor.companyNameSnapshot,
      notes: typeof data.notes !== "undefined" ? data.notes : eventVendor.notes,
      status: data.status ?? eventVendor.status,
      updatedBy: req.user?.id ?? null,
    });

    const updated = await EventVendor.findByPk(id, {
      include: [
        { model: Vendor, as: "vendor" },
        { model: Event, as: "event" },
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

export const deleteEventVendor = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ message: req.t("common.invalid_id") });
  }

  const eventVendor = await EventVendor.findByPk(id);
  if (!eventVendor) {
    return res.status(404).json({ message: req.t("common.not_found") });
  }

  await eventVendor.destroy();

  return res.json({ message: req.t("common.deleted_successfully") });
};
