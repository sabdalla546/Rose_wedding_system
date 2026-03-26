import { Request, Response } from "express";
import { Op } from "sequelize";
import { ZodError } from "zod";
import { AuthRequest } from "../middleware/auth.middleware";
import {
  Quotation,
  QuotationItem,
  Event,
  EventService,
  EventVendor,
  EventVendorSubService,
  VendorSubService,
  VendorPricingPlan,
  Vendor,
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
import { DocumentServiceError } from "../services/documents/document.types";
import { generateQuotationPdfDocument } from "../services/documents/quotation/quotationPdf.service";

class HttpError extends Error {
  public status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type QuotationItemType = "service" | "vendor";

type PreparedQuotationItem = {
  itemType: QuotationItemType;
  eventServiceId: number | null;
  serviceId: number | null;
  eventVendorId: number | null;
  vendorId: number | null;
  pricingPlanId: number | null;
  itemName: string;
  category: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes: string | null;
  sortOrder: number;
  createdBy: number | null;
  updatedBy: number | null;
};

type QuotationRequestItem = {
  itemType?: QuotationItemType;
  eventServiceId?: number | null;
  serviceId?: number | null;
  eventVendorId?: number | null;
  vendorId?: number | null;
  pricingPlanId?: number | null;
  itemName: string;
  category?: string | null;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
  notes?: string | null;
  sortOrder?: number;
};

type QuotationUpdateItem = Partial<QuotationRequestItem>;
const MANUAL_SERVICES_SUMMARY_NAME = "إجمالي الخدمات";
const MANUAL_SERVICES_SUMMARY_CATEGORY = "service_summary";

function round3(value: number) {
  return Number(value.toFixed(3));
}

function toNumberValue(value?: number | string | null) {
  if (value === null || typeof value === "undefined" || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function computeItemTotal(
  quantity: number,
  unitPrice: number,
  totalPrice?: number | null,
) {
  if (typeof totalPrice === "number") {
    return round3(totalPrice);
  }

  return round3(quantity * unitPrice);
}

function computeQuotationTotals(
  items: Array<{ totalPrice?: number | string | null }>,
  discountAmount?: number | null,
) {
  const subtotal = round3(
    items.reduce((sum, item) => {
      return sum + Number(item.totalPrice || 0);
    }, 0),
  );
  const discount = round3(Number(discountAmount || 0));
  const totalAmount = round3(Math.max(0, subtotal - discount));

  return {
    subtotal,
    discountAmount: discount,
    totalAmount,
  };
}

function normalizeIdList(ids?: number[]) {
  return [...new Set((ids ?? []).filter((value) => Number.isInteger(value) && value > 0))];
}

function buildVendorSummaryInclude() {
  return {
    model: Vendor,
    as: "vendor",
    attributes: ["id", "name", "type", "isActive"],
  };
}

const quotationItemDetailInclude: any[] = [
  { model: EventService, as: "eventService" },
  { model: Service, as: "service" },
  {
    model: EventVendor,
    as: "eventVendor",
    include: [
      buildVendorSummaryInclude(),
      {
        model: VendorPricingPlan,
        as: "pricingPlan",
        include: [buildVendorSummaryInclude()],
      },
      {
        model: EventVendorSubService,
        as: "selectedSubServices",
        include: [
          {
            model: VendorSubService,
            as: "vendorSubService",
            include: [buildVendorSummaryInclude()],
          },
        ],
      },
    ],
  },
  { model: Vendor, as: "vendor" },
  {
    model: VendorPricingPlan,
    as: "pricingPlan",
    include: [buildVendorSummaryInclude()],
  },
];

function buildQuotationInclude(): any[] {
  return [
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
      include: quotationItemDetailInclude,
    },
    { model: User, as: "createdByUser", attributes: ["id", "fullName"] },
    { model: User, as: "updatedByUser", attributes: ["id", "fullName"] },
  ];
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

  if (plain.service) {
    plain.service = sanitizeServicePayload(plain.service);
  }

  return plain;
}

function sanitizeVendorPayload(vendor: any) {
  if (!vendor) {
    return vendor;
  }

  return typeof vendor.toJSON === "function" ? vendor.toJSON() : vendor;
}

function sanitizePricingPlanPayload(pricingPlan: any) {
  if (!pricingPlan) {
    return pricingPlan;
  }

  const plain =
    typeof pricingPlan.toJSON === "function" ? pricingPlan.toJSON() : pricingPlan;

  if (plain.vendor) {
    plain.vendor = sanitizeVendorPayload(plain.vendor);
  }

  return plain;
}

function sanitizeEventVendorPayload(eventVendor: any) {
  if (!eventVendor) {
    return eventVendor;
  }

  const plain =
    typeof eventVendor.toJSON === "function" ? eventVendor.toJSON() : eventVendor;

  if (plain.vendor) {
    plain.vendor = sanitizeVendorPayload(plain.vendor);
  }

  if (plain.pricingPlan) {
    plain.pricingPlan = sanitizePricingPlanPayload(plain.pricingPlan);
  }

  if (Array.isArray(plain.selectedSubServices)) {
    plain.selectedSubServices = [...plain.selectedSubServices]
      .sort((left, right) => {
        if ((left.sortOrder ?? 0) !== (right.sortOrder ?? 0)) {
          return (left.sortOrder ?? 0) - (right.sortOrder ?? 0);
        }

        return (left.id ?? 0) - (right.id ?? 0);
      })
      .map((selectedSubService: any) => {
        if (selectedSubService.vendorSubService) {
          return {
            ...selectedSubService,
            vendorSubService: selectedSubService.vendorSubService,
          };
        }

        return { ...selectedSubService };
      });
  }

  return plain;
}

function sanitizeQuotationItemPayload(item: any) {
  if (!item) {
    return item;
  }

  const plain = typeof item.toJSON === "function" ? item.toJSON() : item;

  if (plain.eventService) {
    plain.eventService = sanitizeEventServicePayload(plain.eventService);
  }

  if (plain.service) {
    plain.service = sanitizeServicePayload(plain.service);
  }

  if (plain.eventVendor) {
    plain.eventVendor = sanitizeEventVendorPayload(plain.eventVendor);
  }

  if (plain.vendor) {
    plain.vendor = sanitizeVendorPayload(plain.vendor);
  }

  if (plain.pricingPlan) {
    plain.pricingPlan = sanitizePricingPlanPayload(plain.pricingPlan);
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

async function loadQuotationById(id: number) {
  return Quotation.findByPk(id, {
    include: buildQuotationInclude(),
  });
}

async function loadEventServiceForEvent(eventId: number, eventServiceId: number) {
  const eventService = await EventService.findOne({
    where: {
      id: eventServiceId,
      eventId,
    },
    include: [{ model: Service, as: "service" }],
  });

  if (!eventService) {
    throw new HttpError(400, "Invalid event service for this event");
  }

  return eventService;
}

async function loadServiceById(serviceId: number) {
  const service = await Service.findByPk(serviceId);

  if (!service) {
    throw new HttpError(400, "Service not found");
  }

  return service;
}

async function loadEventVendorForEvent(eventId: number, eventVendorId: number) {
  const eventVendor = await EventVendor.findOne({
    where: {
      id: eventVendorId,
      eventId,
    },
    include: quotationItemDetailInclude
      .filter((include) => include.as === "eventVendor")
      .flatMap((include) => include.include ?? []),
  });

  if (!eventVendor) {
    throw new HttpError(400, "Invalid event vendor for this event");
  }

  if (eventVendor.status === "cancelled") {
    throw new HttpError(400, "Cancelled event vendor cannot be used");
  }

  return eventVendor;
}

function getValidAgreedPrice(eventVendor: EventVendor) {
  const agreedPrice = toNumberValue(eventVendor.agreedPrice);

  if (agreedPrice === null) {
    throw new HttpError(400, "Selected event vendor must have a valid agreedPrice");
  }

  return round3(agreedPrice);
}

function buildQuotationItemFromEventService(
  eventService: EventService,
  userId: number | null,
  sortOrder: number,
): PreparedQuotationItem {
  const quantity = round3(toNumberValue(eventService.quantity) ?? 1);

  return {
    itemType: "service",
    eventServiceId: eventService.id,
    serviceId: eventService.serviceId ?? null,
    eventVendorId: null,
    vendorId: null,
    pricingPlanId: null,
    itemName: eventService.serviceNameSnapshot,
    category: eventService.category ?? null,
    quantity,
    unitPrice: 0,
    totalPrice: 0,
    notes: eventService.notes ?? null,
    sortOrder,
    createdBy: userId,
    updatedBy: userId,
  };
}

function buildQuotationItemFromEventVendor(
  eventVendor: EventVendor & {
    vendor?: Vendor | null;
  },
  userId: number | null,
  sortOrder: number,
): PreparedQuotationItem {
  const agreedPrice = getValidAgreedPrice(eventVendor);

  return {
    itemType: "vendor",
    eventServiceId: null,
    serviceId: null,
    eventVendorId: eventVendor.id,
    vendorId: eventVendor.vendorId ?? null,
    pricingPlanId: eventVendor.pricingPlanId ?? null,
    itemName:
      eventVendor.vendor?.name
      ?? eventVendor.companyNameSnapshot
      ?? "Vendor",
    category: eventVendor.vendorType ?? null,
    quantity: 1,
    unitPrice: agreedPrice,
    totalPrice: agreedPrice,
    notes: eventVendor.notes ?? null,
    sortOrder,
    createdBy: userId,
    updatedBy: userId,
  };
}

function buildManualServiceSummaryItem(
  manualServicesTotal: number,
  userId: number | null,
  sortOrder: number,
): PreparedQuotationItem {
  const amount = round3(Math.max(0, manualServicesTotal));

  return {
    itemType: "service",
    eventServiceId: null,
    serviceId: null,
    eventVendorId: null,
    vendorId: null,
    pricingPlanId: null,
    itemName: MANUAL_SERVICES_SUMMARY_NAME,
    category: MANUAL_SERVICES_SUMMARY_CATEGORY,
    quantity: 1,
    unitPrice: amount,
    totalPrice: amount,
    notes: null,
    sortOrder,
    createdBy: userId,
    updatedBy: userId,
  };
}

async function prepareQuotationItem(
  item: QuotationRequestItem,
  eventId: number,
  userId: number | null,
  fallbackSortOrder: number,
): Promise<PreparedQuotationItem> {
  const itemType = item.itemType ?? "service";
  const sortOrder =
    typeof item.sortOrder === "number" ? item.sortOrder : fallbackSortOrder;

  if (itemType === "vendor") {
    if (!item.eventVendorId) {
      throw new HttpError(400, "eventVendorId is required for vendor quotation items");
    }

    const eventVendor = (await loadEventVendorForEvent(
      eventId,
      item.eventVendorId,
    )) as EventVendor & {
      vendor?: Vendor | null;
    };

    return buildQuotationItemFromEventVendor(eventVendor, userId, sortOrder);
  }

  if (item.eventServiceId) {
    await loadEventServiceForEvent(eventId, item.eventServiceId);
  }

  if (item.serviceId) {
    await loadServiceById(item.serviceId);
  }

  const quantity = round3(item.quantity ?? 1);
  const unitPrice = round3(item.unitPrice ?? 0);

  return {
    itemType: "service",
    eventServiceId: item.eventServiceId ?? null,
    serviceId: item.serviceId ?? null,
    eventVendorId: null,
    vendorId: null,
    pricingPlanId: null,
    itemName: item.itemName,
    category: item.category ?? null,
    quantity,
    unitPrice,
    totalPrice: computeItemTotal(quantity, unitPrice, item.totalPrice),
    notes: item.notes ?? null,
    sortOrder,
    createdBy: userId,
    updatedBy: userId,
  };
}

async function recomputeQuotationHeader(
  quotation: Quotation,
  userId: number | null,
  discountAmount?: number | null,
) {
  const items = await QuotationItem.findAll({
    where: { quotationId: quotation.id },
  });

  const totals = computeQuotationTotals(
    items.map((item) => ({ totalPrice: item.totalPrice })),
    typeof discountAmount !== "undefined"
      ? discountAmount
      : Number(quotation.discountAmount || 0),
  );

  await quotation.update({
    subtotal: totals.subtotal,
    discountAmount: totals.discountAmount,
    totalAmount: totals.totalAmount,
    updatedBy: userId,
  });

  return totals;
}

export const createQuotation = async (req: AuthRequest, res: Response) => {
  try {
    const data = createQuotationSchema.parse(req.body);

    const event = await Event.findByPk(data.eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const preparedItems = await Promise.all(
      data.items.map((item, index) =>
        prepareQuotationItem(
          item as QuotationRequestItem,
          data.eventId,
          req.user?.id ?? null,
          index,
        ),
      ),
    );

    const totals = computeQuotationTotals(preparedItems, data.discountAmount);

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
      preparedItems.map((item) => ({
        quotationId: quotation.id,
        ...item,
      })),
    );

    const created = await loadQuotationById(quotation.id);

    return res.status(201).json({
      message: "Quotation created successfully",
      data: sanitizeQuotationPayload(created),
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.errors });
    }

    if (err instanceof HttpError) {
      return res.status(err.status).json({ message: err.message });
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

    const eventServiceIds = normalizeIdList(data.eventServiceIds);
    const eventVendorIds = normalizeIdList(data.eventVendorIds);
    const manualServicesTotal = round3(
      Math.max(0, toNumberValue(data.manualServicesTotal) ?? 0),
    );

    let eventServices: EventService[] = [];
    let eventVendors: Array<EventVendor & { vendor?: Vendor | null }> = [];

    if (eventServiceIds.length) {
      eventServices = await EventService.findAll({
        where: {
          eventId: event.id,
          id: { [Op.in]: eventServiceIds },
          status: { [Op.notIn]: ["cancelled"] },
        },
        include: [{ model: Service, as: "service" }],
        order: [
          ["sortOrder", "ASC"],
          ["id", "ASC"],
        ],
      });

      if (eventServices.length !== eventServiceIds.length) {
        throw new HttpError(
          400,
          "Some selected event services are invalid for this event",
        );
      }
    }

    if (eventVendorIds.length) {
      eventVendors = (await EventVendor.findAll({
        where: {
          eventId: event.id,
          id: { [Op.in]: eventVendorIds },
          status: { [Op.notIn]: ["cancelled"] },
        },
        include: [
          buildVendorSummaryInclude(),
          {
            model: VendorPricingPlan,
            as: "pricingPlan",
            include: [buildVendorSummaryInclude()],
          },
          {
            model: EventVendorSubService,
            as: "selectedSubServices",
            include: [
              {
                model: VendorSubService,
                as: "vendorSubService",
                include: [buildVendorSummaryInclude()],
              },
            ],
          },
        ],
        order: [["id", "ASC"]],
      })) as Array<EventVendor & { vendor?: Vendor | null }>;

      if (eventVendors.length !== eventVendorIds.length) {
        throw new HttpError(
          400,
          "Some selected event vendors are invalid for this event",
        );
      }

      eventVendors.forEach((eventVendor) => {
        getValidAgreedPrice(eventVendor);
      });
    }

    if (!eventServices.length && !eventVendors.length) {
      throw new HttpError(400, "No event items found to build quotation");
    }

    const preparedItems = [
      ...eventServices.map((item, index) =>
        buildQuotationItemFromEventService(item, req.user?.id ?? null, index),
      ),
      ...(manualServicesTotal > 0
        ? [
            buildManualServiceSummaryItem(
              manualServicesTotal,
              req.user?.id ?? null,
              eventServices.length,
            ),
          ]
        : []),
      ...eventVendors.map((item, index) =>
        buildQuotationItemFromEventVendor(
          item,
          req.user?.id ?? null,
          eventServices.length + (manualServicesTotal > 0 ? 1 : 0) + index,
        ),
      ),
    ].map((item, index) => ({
      ...item,
      sortOrder: index,
    }));

    const totals = computeQuotationTotals(preparedItems, data.discountAmount);

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
      preparedItems.map((item) => ({
        quotationId: quotation.id,
        ...item,
      })),
    );

    const created = await loadQuotationById(quotation.id);

    return res.status(201).json({
      message: "Quotation created from event items successfully",
      data: sanitizeQuotationPayload(created),
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.errors });
    }

    if (err instanceof HttpError) {
      return res.status(err.status).json({ message: err.message });
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

  const quotation = await loadQuotationById(id);

  if (!quotation) {
    return res.status(404).json({ message: req.t("common.not_found") });
  }

  return res.json({ data: sanitizeQuotationPayload(quotation) });
};

export const downloadQuotationPdf = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ message: req.t("common.invalid_id") });
    }

    const document = await generateQuotationPdfDocument(id);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${document.filename}"`,
    );
    res.setHeader("Content-Length", String(document.buffer.length));

    return res.send(document.buffer);
  } catch (err) {
    if (err instanceof DocumentServiceError) {
      return res.status(err.status).json({ message: err.message });
    }

    return res.status(500).json({ message: req.t("common.unexpected_error") });
  }
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

    const items = await QuotationItem.findAll({
      where: { quotationId: quotation.id },
    });

    const totals = computeQuotationTotals(
      items.map((item) => ({ totalPrice: item.totalPrice })),
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

    const updated = await loadQuotationById(id);

    return res.json({
      message: req.t("common.updated_successfully"),
      data: sanitizeQuotationPayload(updated),
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.errors });
    }

    if (err instanceof HttpError) {
      return res.status(err.status).json({ message: err.message });
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

    const data = updateQuotationItemSchema.parse(req.body) as QuotationUpdateItem;

    const item = await QuotationItem.findByPk(id);
    if (!item) {
      return res.status(404).json({ message: req.t("common.not_found") });
    }

    const quotation = await Quotation.findByPk(item.quotationId);
    if (!quotation) {
      return res.status(404).json({ message: req.t("common.not_found") });
    }

    const nextItemType = data.itemType ?? item.itemType;

    if (nextItemType === "vendor") {
      const nextEventVendorId =
        typeof data.eventVendorId !== "undefined"
          ? data.eventVendorId
          : item.eventVendorId;

      if (!nextEventVendorId) {
        throw new HttpError(400, "eventVendorId is required for vendor quotation items");
      }

      const eventVendor = (await loadEventVendorForEvent(
        quotation.eventId,
        nextEventVendorId,
      )) as EventVendor & {
        vendor?: Vendor | null;
      };

      if (
        typeof data.vendorId !== "undefined"
        && data.vendorId !== null
        && data.vendorId !== (eventVendor.vendorId ?? null)
      ) {
        throw new HttpError(400, "vendorId must match the selected event vendor");
      }

      if (
        typeof data.pricingPlanId !== "undefined"
        && data.pricingPlanId !== null
        && data.pricingPlanId !== (eventVendor.pricingPlanId ?? null)
      ) {
        throw new HttpError(
          400,
          "pricingPlanId must match the selected event vendor",
        );
      }

      const quantity =
        typeof data.quantity === "number"
          ? round3(data.quantity)
          : round3(Number(item.quantity || 1));
      const unitPrice =
        typeof data.unitPrice === "number"
          ? round3(data.unitPrice)
          : round3(Number(item.unitPrice || 0));

      await item.update({
        itemType: "vendor",
        eventServiceId: null,
        serviceId: null,
        eventVendorId: eventVendor.id,
        vendorId: eventVendor.vendorId ?? null,
        pricingPlanId: eventVendor.pricingPlanId ?? null,
        itemName: data.itemName ?? item.itemName,
        category:
          typeof data.category !== "undefined" ? data.category : item.category,
        quantity,
        unitPrice,
        totalPrice: computeItemTotal(quantity, unitPrice, data.totalPrice),
        notes: typeof data.notes !== "undefined" ? data.notes : item.notes,
        sortOrder:
          typeof data.sortOrder !== "undefined" ? data.sortOrder : item.sortOrder,
        updatedBy: req.user?.id ?? null,
      });
    } else {
      if (typeof data.eventServiceId !== "undefined" && data.eventServiceId) {
        await loadEventServiceForEvent(quotation.eventId, data.eventServiceId);
      }

      if (typeof data.serviceId !== "undefined" && data.serviceId) {
        await loadServiceById(data.serviceId);
      }

      const quantity =
        typeof data.quantity === "number"
          ? round3(data.quantity)
          : round3(Number(item.quantity || 1));
      const unitPrice =
        typeof data.unitPrice === "number"
          ? round3(data.unitPrice)
          : round3(Number(item.unitPrice || 0));

      await item.update({
        itemType: "service",
        eventServiceId:
          typeof data.eventServiceId !== "undefined"
            ? data.eventServiceId
            : item.eventServiceId,
        serviceId:
          typeof data.serviceId !== "undefined" ? data.serviceId : item.serviceId,
        eventVendorId: null,
        vendorId: null,
        pricingPlanId: null,
        itemName: data.itemName ?? item.itemName,
        category:
          typeof data.category !== "undefined" ? data.category : item.category,
        quantity,
        unitPrice,
        totalPrice: computeItemTotal(quantity, unitPrice, data.totalPrice),
        notes: typeof data.notes !== "undefined" ? data.notes : item.notes,
        sortOrder:
          typeof data.sortOrder !== "undefined" ? data.sortOrder : item.sortOrder,
        updatedBy: req.user?.id ?? null,
      });
    }

    await recomputeQuotationHeader(
      quotation,
      req.user?.id ?? null,
      Number(quotation.discountAmount || 0),
    );

    const updated = await QuotationItem.findByPk(id, {
      include: quotationItemDetailInclude,
    });

    return res.json({
      message: req.t("common.updated_successfully"),
      data: sanitizeQuotationItemPayload(updated),
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.errors });
    }

    if (err instanceof HttpError) {
      return res.status(err.status).json({ message: err.message });
    }

    return res.status(500).json({ message: req.t("common.unexpected_error") });
  }
};
