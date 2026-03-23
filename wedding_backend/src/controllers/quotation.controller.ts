import { Request, Response } from "express";
import { Op } from "sequelize";
import { ZodError } from "zod";
import { AuthRequest } from "../middleware/auth.middleware";
import {
  Quotation,
  QuotationItem,
  Event,
  EventService,
  Service,
  Customer,
  Venue,
  User,
} from "../models";
import {
  createQuotationSchema,
  updateQuotationSchema,
  createQuotationFromEventSchema,
  updateQuotationItemSchema,
} from "../validation/quotation.schemas";

function round3(value: number) {
  return Number(value.toFixed(3));
}

function computeQuotationTotals(subtotal: number, discountAmount?: number | null) {
  const roundedSubtotal = round3(Number(subtotal || 0));
  const discount = round3(Number(discountAmount || 0));
  const totalAmount = round3(Math.max(0, roundedSubtotal - discount));

  return {
    subtotal: roundedSubtotal,
    discountAmount: discount,
    totalAmount,
  };
}

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

function sanitizeQuotationItemPayload(item: any) {
  if (!item) {
    return item;
  }

  const plain = typeof item.toJSON === "function" ? item.toJSON() : item;
  delete plain.quantity;
  delete plain.unitPrice;
  delete plain.totalPrice;

  if (plain.eventService) {
    plain.eventService = sanitizeEventServicePayload(plain.eventService);
  }

  if (plain.service) {
    plain.service = sanitizeServicePayload(plain.service);
  }

  return plain;
}

function sanitizeQuotationPayload(quotation: any) {
  if (!quotation) {
    return quotation;
  }

  const plain = typeof quotation.toJSON === "function" ? quotation.toJSON() : quotation;

  if (Array.isArray(plain.items)) {
    plain.items = plain.items.map((item: any) => sanitizeQuotationItemPayload(item));
  }

  return plain;
}

const quotationInclude: any = [
  {
    model: Event,
    as: "event",
    include: [
      { model: Customer, as: "customer" },
      { model: Venue, as: "venue" },
    ],
  },
  {
    model: QuotationItem,
    as: "items",
    separate: true,
    order: [
      ["sortOrder", "ASC"],
      ["id", "ASC"],
    ],
  },
];

export const createQuotation = async (req: AuthRequest, res: Response) => {
  try {
    const data = createQuotationSchema.parse(req.body);

    const event = await Event.findByPk(data.eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const totals = computeQuotationTotals(data.subtotal, data.discountAmount);

    const quotation = await Quotation.create({
      eventId: data.eventId,
      customerId: event.customerId ?? null,
      quotationNumber: data.quotationNumber ?? null,
      issueDate: data.issueDate,
      validUntil: data.validUntil ?? null,
      subtotal: totals.subtotal,
      discountAmount: totals.discountAmount,
      totalAmount: totals.totalAmount,
      notes: data.notes ?? null,
      status: data.status ?? "draft",
      createdBy: req.user?.id ?? null,
      updatedBy: req.user?.id ?? null,
    });

    await QuotationItem.bulkCreate(
      data.items.map((item) => ({
        quotationId: quotation.id,
        eventServiceId: item.eventServiceId ?? null,
        serviceId: item.serviceId ?? null,
        itemName: item.itemName,
        category: item.category ?? null,
        notes: item.notes ?? null,
        sortOrder: item.sortOrder ?? 0,
        createdBy: req.user?.id ?? null,
        updatedBy: req.user?.id ?? null,
      })),
    );

    const created = await Quotation.findByPk(quotation.id, {
      include: quotationInclude,
    });

    return res.status(201).json({
      message: "Quotation created successfully",
      data: sanitizeQuotationPayload(created),
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.errors });
    }
    return res.status(500).json({ message: req.t("common.unexpected_error") });
  }
};

export const createQuotationFromEvent = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const data = createQuotationFromEventSchema.parse(req.body);

    const event = await Event.findByPk(data.eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const eventServices = await EventService.findAll({
      where: {
        eventId: event.id,
        id: {
          [Op.in]: data.eventServiceIds,
        },
        status: {
          [Op.notIn]: ["cancelled"],
        },
      },
      include: [{ model: Service, as: "service" }],
      order: [
        ["sortOrder", "ASC"],
        ["id", "ASC"],
      ],
    });

    if (!eventServices.length) {
      return res.status(400).json({
        message: "No event services found to build quotation",
      });
    }

    if (eventServices.length !== data.eventServiceIds.length) {
      return res.status(400).json({
        message: "Some selected event services are invalid for this event",
      });
    }

    const totals = computeQuotationTotals(data.subtotal, data.discountAmount);

    const quotation = await Quotation.create({
      eventId: event.id,
      customerId: event.customerId ?? null,
      quotationNumber: data.quotationNumber ?? null,
      issueDate: data.issueDate,
      validUntil: data.validUntil ?? null,
      subtotal: totals.subtotal,
      discountAmount: totals.discountAmount,
      totalAmount: totals.totalAmount,
      notes: data.notes ?? null,
      status: data.status ?? "draft",
      createdBy: req.user?.id ?? null,
      updatedBy: req.user?.id ?? null,
    });

    await QuotationItem.bulkCreate(
      eventServices.map((item) => ({
        quotationId: quotation.id,
        eventServiceId: item.id,
        serviceId: item.serviceId ?? null,
        itemName: item.serviceNameSnapshot,
        category: item.category ?? null,
        notes: item.notes ?? null,
        sortOrder: item.sortOrder ?? 0,
        createdBy: req.user?.id ?? null,
        updatedBy: req.user?.id ?? null,
      })),
    );

    const created = await Quotation.findByPk(quotation.id, {
      include: quotationInclude,
    });

    return res.status(201).json({
      message: "Quotation created from event services successfully",
      data: sanitizeQuotationPayload(created),
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.errors });
    }
    return res.status(500).json({ message: req.t("common.unexpected_error") });
  }
};

export const getQuotations = async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const eventId = Number(req.query.eventId) || undefined;
  const status = String(req.query.status ?? "").trim();
  const search = String(req.query.search ?? "").trim();
  const issueDateFrom = String(req.query.issueDateFrom ?? "").trim();
  const issueDateTo = String(req.query.issueDateTo ?? "").trim();

  const where: any = {};

  if (eventId) where.eventId = eventId;
  if (status) where.status = status;

  if (search) {
    where[Op.or] = [
      { quotationNumber: { [Op.like]: `%${search}%` } },
      { notes: { [Op.like]: `%${search}%` } },
    ];
  }

  if (issueDateFrom || issueDateTo) {
    where.issueDate = {};
    if (issueDateFrom) where.issueDate[Op.gte] = issueDateFrom;
    if (issueDateTo) where.issueDate[Op.lte] = issueDateTo;
  }

  const { count, rows } = await Quotation.findAndCountAll({
    where,
    include: [
      {
        model: Event,
        as: "event",
        include: [
          { model: Customer, as: "customer" },
          { model: Venue, as: "venue" },
        ],
      },
      { model: User, as: "createdByUser", attributes: ["id", "fullName"] },
      { model: User, as: "updatedByUser", attributes: ["id", "fullName"] },
    ],
    order: [
      ["issueDate", "DESC"],
      ["id", "DESC"],
    ],
    limit,
    offset,
  });

  return res.json({
    data: rows.map((row) => sanitizeQuotationPayload(row)),
    meta: {
      total: count,
      page,
      limit,
      pages: Math.ceil(count / limit),
    },
  });
};

export const getQuotationById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ message: req.t("common.invalid_id") });
  }

  const quotation = await Quotation.findByPk(id, {
    include: [
      {
        model: Event,
        as: "event",
        include: [
          { model: Customer, as: "customer" },
          { model: Venue, as: "venue" },
        ],
      },
      {
        model: QuotationItem,
        as: "items",
        separate: true,
        order: [
          ["sortOrder", "ASC"],
          ["id", "ASC"],
        ],
        include: [
          { model: EventService, as: "eventService" },
          { model: Service, as: "service" },
        ],
      },
      { model: User, as: "createdByUser", attributes: ["id", "fullName"] },
      { model: User, as: "updatedByUser", attributes: ["id", "fullName"] },
    ],
  });

  if (!quotation) {
    return res.status(404).json({ message: req.t("common.not_found") });
  }

  return res.json({ data: sanitizeQuotationPayload(quotation) });
};

export const updateQuotation = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ message: req.t("common.invalid_id") });
    }

    const data = updateQuotationSchema.parse(req.body);

    const quotation = await Quotation.findByPk(id);
    if (!quotation) {
      return res.status(404).json({ message: req.t("common.not_found") });
    }

    const totals = computeQuotationTotals(
      typeof data.subtotal === "number"
        ? data.subtotal
        : Number(quotation.subtotal || 0),
      typeof data.discountAmount !== "undefined"
        ? data.discountAmount
        : Number(quotation.discountAmount || 0),
    );

    await quotation.update({
      quotationNumber:
        typeof data.quotationNumber !== "undefined"
          ? data.quotationNumber
          : quotation.quotationNumber,
      issueDate: data.issueDate ?? quotation.issueDate,
      validUntil:
        typeof data.validUntil !== "undefined"
          ? data.validUntil
          : quotation.validUntil,
      subtotal: totals.subtotal,
      discountAmount: totals.discountAmount,
      totalAmount: totals.totalAmount,
      notes: typeof data.notes !== "undefined" ? data.notes : quotation.notes,
      status: data.status ?? quotation.status,
      updatedBy: req.user?.id ?? null,
    });

    const updated = await Quotation.findByPk(id, {
      include: quotationInclude,
    });

    return res.json({
      message: req.t("common.updated_successfully"),
      data: sanitizeQuotationPayload(updated),
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.errors });
    }
    return res.status(500).json({ message: req.t("common.unexpected_error") });
  }
};

export const deleteQuotation = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ message: req.t("common.invalid_id") });
  }

  const quotation = await Quotation.findByPk(id);
  if (!quotation) {
    return res.status(404).json({ message: req.t("common.not_found") });
  }

  await quotation.destroy();

  return res.json({ message: req.t("common.deleted_successfully") });
};

export const updateQuotationItem = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ message: req.t("common.invalid_id") });
    }

    const data = updateQuotationItemSchema.parse(req.body);

    const item = await QuotationItem.findByPk(id);
    if (!item) {
      return res.status(404).json({ message: req.t("common.not_found") });
    }

    await item.update({
      itemName: data.itemName ?? item.itemName,
      category:
        typeof data.category !== "undefined" ? data.category : item.category,
      notes: typeof data.notes !== "undefined" ? data.notes : item.notes,
      sortOrder:
        typeof data.sortOrder !== "undefined" ? data.sortOrder : item.sortOrder,
      updatedBy: req.user?.id ?? null,
    });

    const updated = await QuotationItem.findByPk(id, {
      include: [
        { model: EventService, as: "eventService" },
        { model: Service, as: "service" },
      ],
    });

    return res.json({
      message: req.t("common.updated_successfully"),
      data: sanitizeQuotationItemPayload(updated),
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.errors });
    }
    return res.status(500).json({ message: req.t("common.unexpected_error") });
  }
};
