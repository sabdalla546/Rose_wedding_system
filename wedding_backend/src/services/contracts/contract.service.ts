import { Op } from "sequelize";
import {
  Contract,
  ContractItem,
  Customer,
  Event,
  EventService,
  EventVendor,
  EventVendorSubService,
  PaymentSchedule,
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

export const eventVendorDetailInclude = [
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
];

export const contractItemDetailInclude: any[] = [
  { model: QuotationItem, as: "quotationItem" },
  { model: EventService, as: "eventService" },
  { model: Service, as: "service" },
  {
    model: EventVendor,
    as: "eventVendor",
    include: eventVendorDetailInclude,
  },
  { model: Vendor, as: "vendor" },
  {
    model: VendorPricingPlan,
    as: "pricingPlan",
    include: [buildVendorSummaryInclude()],
  },
];

export function buildContractInclude(): any[] {
  return [
    { model: Quotation, as: "quotation" },
    {
      model: Event,
      as: "event",
      include: [
        { model: Customer, as: "customer" },
        { model: Venue, as: "venue" },
      ],
    },
    {
      model: ContractItem,
      as: "items",
      separate: true,
      order: [
        ["sortOrder", "ASC"],
        ["id", "ASC"],
      ],
      include: contractItemDetailInclude,
    },
    {
      model: PaymentSchedule,
      as: "paymentSchedules",
      separate: true,
      order: [
        ["sortOrder", "ASC"],
        ["id", "ASC"],
      ],
    },
    { model: User, as: "createdByUser", attributes: ["id", "fullName"] },
    { model: User, as: "updatedByUser", attributes: ["id", "fullName"] },
  ];
}

export async function loadContractById(id: number) {
  return Contract.findByPk(id, {
    include: buildContractInclude(),
  });
}

export async function listContractsPage({
  page,
  limit,
  quotationId,
  eventId,
  status,
  search,
  signedDateFrom,
  signedDateTo,
}: {
  page: number;
  limit: number;
  quotationId?: number;
  eventId?: number;
  status?: string;
  search?: string;
  signedDateFrom?: string;
  signedDateTo?: string;
}) {
  const where: any = {};

  if (quotationId) where.quotationId = quotationId;
  if (eventId) where.eventId = eventId;
  if (status) where.status = status;

  if (search) {
    where[Op.or] = [
      { contractNumber: { [Op.like]: `%${search}%` } },
      { notes: { [Op.like]: `%${search}%` } },
    ];
  }

  if (signedDateFrom || signedDateTo) {
    where.signedDate = {};
    if (signedDateFrom) where.signedDate[Op.gte] = signedDateFrom;
    if (signedDateTo) where.signedDate[Op.lte] = signedDateTo;
  }

  return Contract.findAndCountAll({
    where,
    include: [
      { model: Quotation, as: "quotation" },
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
      ["signedDate", "DESC"],
      ["id", "DESC"],
    ],
    limit,
    offset: (page - 1) * limit,
  });
}
