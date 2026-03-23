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

function sanitizeServicePayload(service: any) {
  if (!service) {
    return service;
  }

  const plain = typeof service.toJSON === "function" ? service.toJSON() : service;
  delete plain.pricingType;
  delete plain.basePrice;
  delete plain.unitName;
  return plain;
}

function sanitizeEventServicePayload(eventService: any) {
  if (!eventService) {
    return eventService;
  }

  const plain =
    typeof eventService.toJSON === "function" ? eventService.toJSON() : eventService;

  delete plain.quantity;
  delete plain.unitPrice;
  delete plain.totalPrice;

  if (plain.service) {
    plain.service = sanitizeServicePayload(plain.service);
  }

  return plain;
}

export const createService = async (req: AuthRequest, res: Response) => {
  try {
    const data = createServiceSchema.parse(req.body);

    const service = await Service.create({
      name: data.name.trim(),
      code: data.code ?? null,
      category: data.category,
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
      data: sanitizeServicePayload(created),
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
    data: rows.map((row) => sanitizeServicePayload(row)),
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

  return res.json({ data: sanitizeServicePayload(service) });
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
      data: sanitizeServicePayload(updated),
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

    const eventService = await EventService.create({
      eventId: data.eventId,
      serviceId: data.serviceId ?? null,
      serviceNameSnapshot:
        data.serviceNameSnapshot ?? service?.name ?? "Unnamed Service",
      category: data.category ?? service?.category ?? "other",
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
      data: sanitizeEventServicePayload(created),
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
    data: rows.map((row) => sanitizeEventServicePayload(row)),
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

  return res.json({ data: sanitizeEventServicePayload(eventService) });
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

    await eventService.update({
      serviceId:
        typeof data.serviceId !== "undefined"
          ? data.serviceId
          : eventService.serviceId,
      serviceNameSnapshot:
        typeof data.serviceNameSnapshot !== "undefined"
          ? data.serviceNameSnapshot ?? service?.name ?? eventService.serviceNameSnapshot
          : service?.name ?? eventService.serviceNameSnapshot,
      category: data.category ?? service?.category ?? eventService.category,
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
      data: sanitizeEventServicePayload(updated),
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
