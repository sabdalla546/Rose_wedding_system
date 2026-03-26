import {
  Customer,
  Event,
  EventService,
  EventVendor,
  Quotation,
  QuotationItem,
  Service,
  Vendor,
  VendorPricingPlan,
  Venue,
} from "../../../models";
import type { QuotationPdfData } from "../document.types";
import { DocumentServiceError } from "../document.types";
import { getCompanyProfile, normalizeDecimal } from "../document.utils";

const MANUAL_SERVICES_SUMMARY_CATEGORY = "service_summary";

function buildEventTitle(event?: any) {
  if (!event) {
    return null;
  }

  const explicitTitle = typeof event.title === "string" ? event.title.trim() : "";
  if (explicitTitle) {
    return explicitTitle;
  }

  const participants = [event.groomName, event.brideName]
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);

  if (participants.length > 0) {
    return participants.join(" / ");
  }

  return `Event #${event.id}`;
}

export async function buildQuotationPdfData(quotationId: number): Promise<QuotationPdfData> {
  const quotation = await Quotation.findByPk(quotationId, {
    include: [
      { model: Customer, as: "customer" },
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
          {
            model: EventVendor,
            as: "eventVendor",
            include: [
              { model: Vendor, as: "vendor" },
              {
                model: VendorPricingPlan,
                as: "pricingPlan",
                include: [{ model: Vendor, as: "vendor" }],
              },
            ],
          },
          { model: Vendor, as: "vendor" },
          {
            model: VendorPricingPlan,
            as: "pricingPlan",
            include: [{ model: Vendor, as: "vendor" }],
          },
        ],
      },
    ],
  });

  if (!quotation) {
    throw new DocumentServiceError(404, "Quotation not found");
  }

  const plainQuotation = quotation.toJSON() as any;
  const event = plainQuotation.event;
  const customer = plainQuotation.customer || event?.customer || null;

  return {
    company: getCompanyProfile(),
    quotation: {
      id: plainQuotation.id,
      quotationNumber:
        (typeof plainQuotation.quotationNumber === "string"
          && plainQuotation.quotationNumber.trim())
          ? plainQuotation.quotationNumber.trim()
          : String(plainQuotation.id),
      issueDate: plainQuotation.issueDate,
      validUntil: plainQuotation.validUntil ?? null,
      status: plainQuotation.status ?? null,
      notes: plainQuotation.notes ?? null,
      subtotal: normalizeDecimal(plainQuotation.subtotal),
      discountAmount: normalizeDecimal(plainQuotation.discountAmount),
      totalAmount: normalizeDecimal(plainQuotation.totalAmount),
    },
    customer: {
      fullName: customer?.fullName ?? null,
      mobile1: customer?.mobile ?? null,
      mobile2: customer?.mobile2 ?? null,
    },
    event: {
      title: buildEventTitle(event),
      eventDate: event?.eventDate ?? null,
      venueName: event?.venue?.name ?? event?.venueNameSnapshot ?? null,
    },
    items: Array.isArray(plainQuotation.items)
      ? plainQuotation.items.map((item: any) => ({
          itemType: item.itemType === "vendor" ? "vendor" : "service",
          itemName: item.itemName,
          category: item.category ?? null,
          quantity: normalizeDecimal(item.quantity ?? 1),
          unitPrice: normalizeDecimal(item.unitPrice ?? 0),
          totalPrice: normalizeDecimal(item.totalPrice ?? 0),
          notes: item.notes ?? null,
          isSummaryRow:
            item.itemType === "service"
            && item.category === MANUAL_SERVICES_SUMMARY_CATEGORY,
        }))
      : [],
  };
}
