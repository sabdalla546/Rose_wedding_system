import { Request, Response } from "express";
import { Op } from "sequelize";
import { ZodError } from "zod";
import { AuthRequest } from "../middleware/auth.middleware";
import { Service, EventService, Event, User } from "../models";
import {
  createServiceSchema,
  updateServiceSchema,
  createEventServiceSchema,
  updateEventServiceSchema,
} from "../validation/service.schemas";

function calcTotalPrice(
  quantity?: number,
  unitPrice?: number | null,
  totalPrice?: number | null,
) {
  if (typeof totalPrice === "number") return totalPrice;
  if (typeof quantity === "number" && typeof unitPrice === "number") {
    return Number((quantity * unitPrice).toFixed(3));
  }
  return null;
}

export const createService = async (req: AuthRequest, res: Response) => {
  try {
    const data = createServiceSchema.parse(req.body);

    const service = await Service.create({
      name: data.name.trim(),
      code: data.code ?? null,
      category: data.category,
      pricingType: data.pricingType,
      basePrice: typeof data.basePrice === "number" ? data.basePrice : null,
      unitName: data.unitName ?? null,
      description: data.description ?? null,
      isActive: data.isActive ?? true,
      createdBy: req.user?.id ?? null,
      updatedBy: req.user?.id ?? null,
    });

    const created = await Service.findByPk(service.id, {
      include: [
        { model: User, as: "createdByUser", attributes: ["id", "fullName"] },
        { model: User, as: "updatedByUser", attributes: ["id", "fullName"] },
      ],
    });

    return res.status(201).json({
      message: "Service created successfully",
      data: created,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.errors });
    }
    return res.status(500).json({ message: req.t("common.unexpected_error") });
  }
};

export const getServices = async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const search = String(req.query.search ?? "").trim();
  const category = String(req.query.category ?? "").trim();
  const pricingType = String(req.query.pricingType ?? "").trim();
  const isActive =
    typeof req.query.isActive !== "undefined"
      ? String(req.query.isActive) === "true"
      : undefined;

  const where: any = {};

  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { code: { [Op.like]: `%${search}%` } },
      { description: { [Op.like]: `%${search}%` } },
    ];
  }

  if (category) where.category = category;
  if (pricingType) where.pricingType = pricingType;
  if (typeof isActive === "boolean") where.isActive = isActive;

  const { count, rows } = await Service.findAndCountAll({
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

export const getServiceById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ message: req.t("common.invalid_id") });
  }

  const service = await Service.findByPk(id, {
    include: [
      { model: User, as: "createdByUser", attributes: ["id", "fullName"] },
      { model: User, as: "updatedByUser", attributes: ["id", "fullName"] },
    ],
  });

  if (!service) {
    return res.status(404).json({ message: req.t("common.not_found") });
  }

  return res.json({ data: service });
};

export const updateService = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ message: req.t("common.invalid_id") });
    }

    const data = updateServiceSchema.parse(req.body);

    const service = await Service.findByPk(id);
    if (!service) {
      return res.status(404).json({ message: req.t("common.not_found") });
    }

    await service.update({
      name: data.name ?? service.name,
      code: typeof data.code !== "undefined" ? data.code : service.code,
      category: data.category ?? service.category,
      pricingType: data.pricingType ?? service.pricingType,
      basePrice:
        typeof data.basePrice !== "undefined"
          ? data.basePrice
          : service.basePrice,
      unitName:
        typeof data.unitName !== "undefined" ? data.unitName : service.unitName,
      description:
        typeof data.description !== "undefined"
          ? data.description
          : service.description,
      isActive:
        typeof data.isActive !== "undefined" ? data.isActive : service.isActive,
      updatedBy: req.user?.id ?? null,
    });

    const updated = await Service.findByPk(id, {
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

export const deleteService = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ message: req.t("common.invalid_id") });
  }

  const service = await Service.findByPk(id);
  if (!service) {
    return res.status(404).json({ message: req.t("common.not_found") });
  }

  await service.destroy();

  return res.json({ message: req.t("common.deleted_successfully") });
};

export const createEventService = async (req: AuthRequest, res: Response) => {
  try {
    const data = createEventServiceSchema.parse(req.body);

    const event = await Event.findByPk(data.eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    let service: Service | null = null;
    if (data.serviceId) {
      service = await Service.findByPk(data.serviceId);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
    }

    const quantity = typeof data.quantity === "number" ? data.quantity : 1;
    const unitPrice =
      typeof data.unitPrice === "number"
        ? data.unitPrice
        : typeof service?.basePrice === "number"
          ? Number(service.basePrice)
          : null;

    const eventService = await EventService.create({
      eventId: data.eventId,
      serviceId: data.serviceId ?? null,
      serviceNameSnapshot:
        data.serviceNameSnapshot ?? service?.name ?? "Unnamed Service",
      category: data.category ?? service?.category ?? "other",
      quantity,
      unitPrice,
      totalPrice: calcTotalPrice(quantity, unitPrice, data.totalPrice),
      notes: data.notes ?? null,
      status: data.status ?? "draft",
      sortOrder: data.sortOrder ?? 0,
      createdBy: req.user?.id ?? null,
      updatedBy: req.user?.id ?? null,
    });

    const created = await EventService.findByPk(eventService.id, {
      include: [
        { model: Service, as: "service" },
        { model: Event, as: "event" },
        { model: User, as: "createdByUser", attributes: ["id", "fullName"] },
        { model: User, as: "updatedByUser", attributes: ["id", "fullName"] },
      ],
    });

    return res.status(201).json({
      message: "Event service created successfully",
      data: created,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.errors });
    }
    return res.status(500).json({ message: req.t("common.unexpected_error") });
  }
};

export const getEventServices = async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const eventId = Number(req.query.eventId) || undefined;
  const category = String(req.query.category ?? "").trim();
  const status = String(req.query.status ?? "").trim();

  const where: any = {};

  if (eventId) where.eventId = eventId;
  if (category) where.category = category;
  if (status) where.status = status;

  const { count, rows } = await EventService.findAndCountAll({
    where,
    include: [
      { model: Service, as: "service" },
      { model: Event, as: "event" },
      { model: User, as: "createdByUser", attributes: ["id", "fullName"] },
      { model: User, as: "updatedByUser", attributes: ["id", "fullName"] },
    ],
    order: [
      ["sortOrder", "ASC"],
      ["id", "ASC"],
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

export const getEventServiceById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ message: req.t("common.invalid_id") });
  }

  const eventService = await EventService.findByPk(id, {
    include: [
      { model: Service, as: "service" },
      { model: Event, as: "event" },
      { model: User, as: "createdByUser", attributes: ["id", "fullName"] },
      { model: User, as: "updatedByUser", attributes: ["id", "fullName"] },
    ],
  });

  if (!eventService) {
    return res.status(404).json({ message: req.t("common.not_found") });
  }

  return res.json({ data: eventService });
};

export const updateEventService = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ message: req.t("common.invalid_id") });
    }

    const data = updateEventServiceSchema.parse(req.body);

    const eventService = await EventService.findByPk(id);
    if (!eventService) {
      return res.status(404).json({ message: req.t("common.not_found") });
    }

    let service: Service | null = null;
    const nextServiceId =
      typeof data.serviceId !== "undefined"
        ? data.serviceId
        : eventService.serviceId;

    if (nextServiceId) {
      service = await Service.findByPk(nextServiceId);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
    }

    const quantity =
      typeof data.quantity === "number"
        ? data.quantity
        : Number(eventService.quantity);

    const unitPrice =
      typeof data.unitPrice === "number"
        ? data.unitPrice
        : data.unitPrice === null
          ? null
          : service
            ? Number(service.basePrice ?? eventService.unitPrice)
            : eventService.unitPrice !== null
              ? Number(eventService.unitPrice)
              : null;

    await eventService.update({
      serviceId:
        typeof data.serviceId !== "undefined"
          ? data.serviceId
          : eventService.serviceId,
      serviceNameSnapshot:
        typeof data.serviceNameSnapshot !== "undefined"
          ? (data.serviceNameSnapshot ??
            service?.name ??
            eventService.serviceNameSnapshot)
          : (service?.name ?? eventService.serviceNameSnapshot),
      category: data.category ?? service?.category ?? eventService.category,
      quantity,
      unitPrice,
      totalPrice: calcTotalPrice(
        quantity,
        unitPrice,
        typeof data.totalPrice === "undefined" ? undefined : data.totalPrice,
      ),
      notes:
        typeof data.notes !== "undefined" ? data.notes : eventService.notes,
      status: data.status ?? eventService.status,
      sortOrder:
        typeof data.sortOrder !== "undefined"
          ? data.sortOrder
          : eventService.sortOrder,
      updatedBy: req.user?.id ?? null,
    });

    const updated = await EventService.findByPk(id, {
      include: [
        { model: Service, as: "service" },
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

export const deleteEventService = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ message: req.t("common.invalid_id") });
  }

  const eventService = await EventService.findByPk(id);
  if (!eventService) {
    return res.status(404).json({ message: req.t("common.not_found") });
  }

  await eventService.destroy();

  return res.json({ message: req.t("common.deleted_successfully") });
};
