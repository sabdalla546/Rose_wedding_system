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
  Lead,
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

function computeItemTotal(
  quantity: number,
  unitPrice: number,
  totalPrice?: number | null,
) {
  if (typeof totalPrice === "number") return round3(totalPrice);
  return round3(quantity * unitPrice);
}

function computeQuotationTotals(
  items: Array<{ totalPrice: number }>,
  discountAmount?: number | null,
) {
  const subtotal = round3(
    items.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0),
  );
  const discount = round3(Number(discountAmount || 0));
  const totalAmount = round3(Math.max(0, subtotal - discount));
  return { subtotal, discountAmount: discount, totalAmount };
}

export const createQuotation = async (req: AuthRequest, res: Response) => {
  try {
    const data = createQuotationSchema.parse(req.body);

    const event = await Event.findByPk(data.eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (data.customerId) {
      const customer = await Customer.findByPk(data.customerId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
    }

    if (data.leadId) {
      const lead = await Lead.findByPk(data.leadId);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
    }

    const preparedItems = data.items.map((item) => ({
      eventServiceId: item.eventServiceId ?? null,
      serviceId: item.serviceId ?? null,
      itemName: item.itemName,
      category: item.category ?? null,
      quantity: round3(item.quantity),
      unitPrice: round3(item.unitPrice),
      totalPrice: computeItemTotal(
        item.quantity,
        item.unitPrice,
        item.totalPrice,
      ),
      notes: item.notes ?? null,
      sortOrder: item.sortOrder ?? 0,
    }));

    const totals = computeQuotationTotals(preparedItems, data.discountAmount);

    const quotation = await Quotation.create({
      eventId: data.eventId,
      customerId: data.customerId ?? event.customerId ?? null,
      // leadId: data.leadId ?? event.leadId ?? null,
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
      preparedItems.map((item) => ({
        quotationId: quotation.id,
        ...item,
        createdBy: req.user?.id ?? null,
        updatedBy: req.user?.id ?? null,
      })),
    );

    const created = await Quotation.findByPk(quotation.id, {
      include: [
        { model: Event, as: "event" },
        { model: Customer, as: "customer" },
        { model: Lead, as: "lead" },
        {
          model: QuotationItem,
          as: "items",
          separate: true,
          order: [
            ["sortOrder", "ASC"],
            ["id", "ASC"],
          ],
        },
      ],
    });

    return res.status(201).json({
      message: "Quotation created successfully",
      data: created,
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

    const eventServiceWhere: any = {
      eventId: event.id,
      status: {
        [Op.notIn]: ["cancelled"],
      },
    };

    if (data.eventServiceIds?.length) {
      eventServiceWhere.id = {
        [Op.in]: data.eventServiceIds,
      };
    }

    const eventServices = await EventService.findAll({
      where: eventServiceWhere,
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

    const preparedItems = eventServices.map((item) => ({
      eventServiceId: item.id,
      serviceId: item.serviceId ?? null,
      itemName: item.serviceNameSnapshot,
      category: item.category ?? null,
      quantity: round3(Number(item.quantity)),
      unitPrice: round3(Number(item.unitPrice ?? 0)),
      totalPrice: round3(Number(item.totalPrice ?? 0)),
      notes: item.notes ?? null,
      sortOrder: item.sortOrder ?? 0,
    }));

    const totals = computeQuotationTotals(preparedItems, data.discountAmount);

    const quotation = await Quotation.create({
      eventId: event.id,
      customerId: event.customerId ?? null,
      // leadId: event.leadId ?? null,
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
      preparedItems.map((item) => ({
        quotationId: quotation.id,
        ...item,
        createdBy: req.user?.id ?? null,
        updatedBy: req.user?.id ?? null,
      })),
    );

    const created = await Quotation.findByPk(quotation.id, {
      include: [
        { model: Event, as: "event" },
        { model: Customer, as: "customer" },
        { model: Lead, as: "lead" },
        {
          model: QuotationItem,
          as: "items",
          separate: true,
          order: [
            ["sortOrder", "ASC"],
            ["id", "ASC"],
          ],
        },
      ],
    });

    return res.status(201).json({
      message: "Quotation created from event services successfully",
      data: created,
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
  const customerId = Number(req.query.customerId) || undefined;
  const leadId = Number(req.query.leadId) || undefined;
  const status = String(req.query.status ?? "").trim();
  const search = String(req.query.search ?? "").trim();
  const issueDateFrom = String(req.query.issueDateFrom ?? "").trim();
  const issueDateTo = String(req.query.issueDateTo ?? "").trim();

  const where: any = {};

  if (eventId) where.eventId = eventId;
  if (customerId) where.customerId = customerId;
  if (leadId) where.leadId = leadId;
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
      { model: Event, as: "event" },
      { model: Customer, as: "customer" },
      { model: Lead, as: "lead" },
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
    data: rows,
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
      { model: Event, as: "event" },
      { model: Customer, as: "customer" },
      { model: Lead, as: "lead" },
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

  return res.json({ data: quotation });
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

    await quotation.update({
      customerId:
        typeof data.customerId !== "undefined"
          ? data.customerId
          : quotation.customerId,
      leadId:
        typeof data.leadId !== "undefined" ? data.leadId : quotation.leadId,
      quotationNumber:
        typeof data.quotationNumber !== "undefined"
          ? data.quotationNumber
          : quotation.quotationNumber,
      issueDate: data.issueDate ?? quotation.issueDate,
      validUntil:
        typeof data.validUntil !== "undefined"
          ? data.validUntil
          : quotation.validUntil,
      discountAmount:
        typeof data.discountAmount !== "undefined"
          ? data.discountAmount
          : quotation.discountAmount,
      notes: typeof data.notes !== "undefined" ? data.notes : quotation.notes,
      status: data.status ?? quotation.status,
      updatedBy: req.user?.id ?? null,
    });

    const items = await QuotationItem.findAll({
      where: { quotationId: quotation.id },
    });

    const totals = computeQuotationTotals(
      items.map((i) => ({ totalPrice: Number(i.totalPrice) })),
      typeof data.discountAmount !== "undefined"
        ? data.discountAmount
        : Number(quotation.discountAmount || 0),
    );

    await quotation.update({
      subtotal: totals.subtotal,
      discountAmount: totals.discountAmount,
      totalAmount: totals.totalAmount,
      updatedBy: req.user?.id ?? null,
    });

    const updated = await Quotation.findByPk(id, {
      include: [
        { model: Event, as: "event" },
        { model: Customer, as: "customer" },
        { model: Lead, as: "lead" },
        {
          model: QuotationItem,
          as: "items",
          separate: true,
          order: [
            ["sortOrder", "ASC"],
            ["id", "ASC"],
          ],
        },
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

    const quantity =
      typeof data.quantity === "number" ? data.quantity : Number(item.quantity);
    const unitPrice =
      typeof data.unitPrice === "number"
        ? data.unitPrice
        : Number(item.unitPrice);

    await item.update({
      itemName: data.itemName ?? item.itemName,
      category:
        typeof data.category !== "undefined" ? data.category : item.category,
      quantity: round3(quantity),
      unitPrice: round3(unitPrice),
      totalPrice: computeItemTotal(quantity, unitPrice, data.totalPrice),
      notes: typeof data.notes !== "undefined" ? data.notes : item.notes,
      sortOrder:
        typeof data.sortOrder !== "undefined" ? data.sortOrder : item.sortOrder,
      updatedBy: req.user?.id ?? null,
    });

    const quotation = await Quotation.findByPk(item.quotationId);
    if (quotation) {
      const items = await QuotationItem.findAll({
        where: { quotationId: quotation.id },
      });

      const totals = computeQuotationTotals(
        items.map((i) => ({ totalPrice: Number(i.totalPrice) })),
        Number(quotation.discountAmount || 0),
      );

      await quotation.update({
        subtotal: totals.subtotal,
        totalAmount: totals.totalAmount,
        updatedBy: req.user?.id ?? null,
      });
    }

    const updated = await QuotationItem.findByPk(id, {
      include: [
        { model: EventService, as: "eventService" },
        { model: Service, as: "service" },
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
