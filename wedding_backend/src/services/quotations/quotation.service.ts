import { Op } from "sequelize";
import {
  Customer,
  Event,
  EventService,
  EventVendor,
  EventVendorSubService,
  Quotation,
  QuotationItem,
  Service,
  User,
  Vendor,
  VendorPricingPlan,
  VendorSubService,
  Venue,
} from "../../models";
import type { QuotationStatus } from "../../models/quotation.model";
import {
  recordWorkflowAction,
  recordWorkflowBlock,
  recordWorkflowTransition,
} from "../workflow/workflow.audit";
import { CANCELLED_EVENT_STATUSES } from "../../constants/workflow-statuses";
import {
  cancelledEventQuotationError,
  invalidStatusTransitionError,
  WorkflowDomainError,
} from "../workflow/workflow.errors";
import {
  QUOTATION_TRANSITIONS,
  assertValidQuotationTransition,
  expandQuotationStatusesForQuery,
  normalizeQuotationStatus,
  resolveTransitionPath,
} from "../workflow/workflow.status";

export function buildVendorSummaryInclude() {
  return {
    model: Vendor,
    as: "vendor",
    attributes: ["id", "name", "type", "isActive"],
  };
}

export const quotationItemDetailInclude: any[] = [
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

export function buildQuotationInclude(): any[] {
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

export function sanitizeQuotationItemPayload(item: any) {
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

export function sanitizeQuotationPayload(quotation: any) {
  if (!quotation) {
    return quotation;
  }

  const plain = typeof quotation.toJSON === "function" ? quotation.toJSON() : quotation;

  if (Array.isArray(plain.items)) {
    plain.items = plain.items.map((item: any) => sanitizeQuotationItemPayload(item));
  }

  return plain;
}

export async function loadQuotationById(id: number) {
  return Quotation.findByPk(id, {
    include: buildQuotationInclude(),
  });
}

export async function assertEventCanCreateQuotation(eventId: number) {
  const event = await Event.findByPk(eventId);

  if (!event) {
    throw new WorkflowDomainError("Event not found", 404);
  }

  if (CANCELLED_EVENT_STATUSES.has(event.status)) {
    recordWorkflowBlock({
      entityName: "event",
      entityId: event.id,
      actionName: "quotation.create_from_event",
      currentStatus: event.status,
      attemptedBy: null,
      message: "Cannot create quotation for cancelled event",
      sourceRefs: {
        sourceAppointmentId: event.sourceAppointmentId ?? null,
        eventId: event.id,
      },
    });

    throw cancelledEventQuotationError();
  }

  return event;
}

export async function supersedeSiblingQuotationsForEvent(
  eventId: number,
  keepQuotationId: number,
  userId: number | null,
) {
  const siblings = await Quotation.findAll({
    where: {
      eventId,
      id: {
        [Op.ne]: keepQuotationId,
      },
      status: {
        [Op.in]: ["draft", "sent", "approved", "converted_to_contract"],
      },
    },
  });

  const quotationsToSupersede = siblings.filter(
    (quotation) => normalizeQuotationStatus(quotation.status) !== "superseded",
  );

  await Promise.all(
    quotationsToSupersede.map((quotation) => {
      const previousStatus = normalizeQuotationStatus(quotation.status);

      return quotation.update({
        status: "superseded",
        updatedBy: userId,
      }).then(() => {
        recordWorkflowTransition({
          entityName: "quotation",
          entityId: quotation.id,
          previousStatus,
          nextStatus: "superseded",
          actionName: "quotation.supersede",
          changedBy: userId,
          note: "Superseded by newer effective quotation",
          sourceRefs: {
            eventId,
            quotationId: quotation.id,
          },
          metadata: {
            eventId,
            keepQuotationId,
          },
        });
      });
    }),
  );

  return quotationsToSupersede.length;
}

type QuotationStatusActionInput = {
  quotation: Quotation;
  nextStatus: QuotationStatus;
  actionName: string;
  userId: number | null;
  note?: string | null;
  reason?: string | null;
};

const applyQuotationStatusAction = async ({
  quotation,
  nextStatus,
  actionName,
  userId,
  note = null,
  reason = null,
}: QuotationStatusActionInput) => {
  const previousStatus = quotation.status;
  assertValidQuotationTransition(previousStatus, nextStatus);

  await quotation.update({
    status: nextStatus,
    updatedBy: userId,
  });

  if (normalizeQuotationStatus(nextStatus) === "approved") {
    await supersedeSiblingQuotationsForEvent(
      quotation.eventId,
      quotation.id,
      userId,
    );
  }

  recordWorkflowTransition({
    entityName: "quotation",
    entityId: quotation.id,
    previousStatus: normalizeQuotationStatus(previousStatus),
    nextStatus: normalizeQuotationStatus(nextStatus),
    actionName,
    changedBy: userId,
    note,
    reason,
    sourceRefs: {
      eventId: quotation.eventId,
      quotationId: quotation.id,
    },
    metadata: {
      eventId: quotation.eventId,
    },
  });

  return quotation;
};

export const sendQuotation = (
  quotation: Quotation,
  userId: number | null,
  note?: string | null,
) =>
  applyQuotationStatusAction({
    quotation,
    nextStatus: "sent",
    actionName: "quotation.send",
    userId,
    note,
  });

export const approveQuotation = (
  quotation: Quotation,
  userId: number | null,
  note?: string | null,
) =>
  applyQuotationStatusAction({
    quotation,
    nextStatus: "approved",
    actionName: "quotation.approve",
    userId,
    note,
  });

export async function countEffectiveApprovedQuotationsForEvent(
  eventId: number,
  excludeQuotationId?: number,
) {
  return Quotation.count({
    where: {
      eventId,
      status: "approved",
      ...(excludeQuotationId
        ? {
            id: {
              [Op.ne]: excludeQuotationId,
            },
          }
        : {}),
    },
  });
}

export const rejectQuotation = (
  quotation: Quotation,
  userId: number | null,
  reason?: string | null,
  note?: string | null,
) =>
  applyQuotationStatusAction({
    quotation,
    nextStatus: "rejected",
    actionName: "quotation.reject",
    userId,
    note,
    reason,
  });

export const expireQuotation = (
  quotation: Quotation,
  userId: number | null,
  reason?: string | null,
  note?: string | null,
) =>
  applyQuotationStatusAction({
    quotation,
    nextStatus: "expired",
    actionName: "quotation.expire",
    userId,
    note,
    reason,
  });

export const supersedeQuotation = (
  quotation: Quotation,
  userId: number | null,
  reason?: string | null,
  note?: string | null,
) =>
  applyQuotationStatusAction({
    quotation,
    nextStatus: "superseded",
    actionName: "quotation.supersede",
    userId,
    note,
    reason,
  });

export const transitionQuotationToStatus = async ({
  quotation,
  targetStatus,
  userId,
  note,
  reason,
}: {
  quotation: Quotation;
  targetStatus: QuotationStatus;
  userId: number | null;
  note?: string | null;
  reason?: string | null;
}) => {
  const path = resolveTransitionPath(
    QUOTATION_TRANSITIONS,
    normalizeQuotationStatus(quotation.status),
    normalizeQuotationStatus(targetStatus),
  );

  for (const nextStatus of path) {
    if (nextStatus === "sent") {
      await sendQuotation(quotation, userId, note);
      continue;
    }

    if (nextStatus === "approved") {
      await approveQuotation(quotation, userId, note);
      continue;
    }

    if (nextStatus === "rejected") {
      await rejectQuotation(quotation, userId, reason, note);
      continue;
    }

    if (nextStatus === "expired") {
      await expireQuotation(quotation, userId, reason, note);
      continue;
    }

    if (nextStatus === "superseded") {
      await supersedeQuotation(quotation, userId, reason, note);
    }
  }

  return quotation;
};

const QUOTATION_LOCKED_STATUSES = new Set(["approved", "superseded"]);

export const assertQuotationHeaderEditable = (
  quotation: Quotation,
  payload: Partial<{
    quotationNumber: string | null;
    issueDate: string;
    validUntil: string | null;
    discountAmount: number | null;
    notes: string | null;
  }>,
  audit?: {
    userId: number | null;
    attemptedFields?: string[];
  },
) => {
  if (!QUOTATION_LOCKED_STATUSES.has(normalizeQuotationStatus(quotation.status))) {
    return;
  }

  const hasCommercialChange =
    typeof payload.quotationNumber !== "undefined"
    || typeof payload.issueDate !== "undefined"
    || typeof payload.validUntil !== "undefined"
    || typeof payload.discountAmount !== "undefined"
    || typeof payload.notes !== "undefined";

  if (hasCommercialChange) {
    if (audit) {
      recordWorkflowBlock({
        entityName: "quotation",
        entityId: quotation.id,
        actionName: "quotation.update_header",
        currentStatus: normalizeQuotationStatus(quotation.status),
        attemptedBy: audit.userId,
        message: "Cannot modify approved quotation commercial fields",
        sourceRefs: {
          eventId: quotation.eventId,
          quotationId: quotation.id,
        },
        metadata: {
          attemptedFields: audit.attemptedFields,
        },
      });
    }

    throw invalidStatusTransitionError(
      "Cannot modify approved quotation commercial fields",
    );
  }
};

export const assertQuotationItemsEditable = (
  quotation: Quotation,
  audit?: {
    userId: number | null;
    itemId?: number;
  },
) => {
  if (QUOTATION_LOCKED_STATUSES.has(normalizeQuotationStatus(quotation.status))) {
    if (audit) {
      recordWorkflowBlock({
        entityName: "quotation",
        entityId: quotation.id,
        actionName: "quotation.update_items",
        currentStatus: normalizeQuotationStatus(quotation.status),
        attemptedBy: audit.userId,
        message: "Cannot modify approved quotation commercial fields",
        sourceRefs: {
          eventId: quotation.eventId,
          quotationId: quotation.id,
        },
        metadata: {
          itemId: audit.itemId,
        },
      });
    }

    throw invalidStatusTransitionError(
      "Cannot modify approved quotation commercial fields",
    );
  }
};

export async function listQuotationsPage({
  page,
  limit,
  eventId,
  status,
  search,
  issueDateFrom,
  issueDateTo,
}: {
  page: number;
  limit: number;
  eventId?: number;
  status?: string;
  search?: string;
  issueDateFrom?: string;
  issueDateTo?: string;
}) {
  const where: any = {};

  if (eventId) where.eventId = eventId;
  if (status) where.status = { [Op.in]: expandQuotationStatusesForQuery(status) };

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

  return Quotation.findAndCountAll({
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
    offset: (page - 1) * limit,
  });
}

export const recordQuotationCreatedAction = ({
  quotation,
  userId,
  itemCount,
  sourceMode,
}: {
  quotation: Quotation;
  userId: number | null;
  itemCount: number;
  sourceMode: "manual" | "event_items";
}) =>
  recordWorkflowAction({
    entityName: "quotation",
    entityId: quotation.id,
    actionName: "quotation.create",
    actorId: userId,
    note:
      sourceMode === "event_items"
        ? "Created quotation from event items"
        : "Created quotation from provided commercial snapshot",
    sourceRefs: {
      eventId: quotation.eventId,
      quotationId: quotation.id,
    },
    metadata: {
      itemCount,
      sourceMode,
      customerId: quotation.customerId ?? null,
    },
  });
