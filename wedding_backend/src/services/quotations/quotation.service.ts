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
