import { getEventDisplayTitle } from "@/pages/events/adapters";
import type {
  DecimalValue,
  Quotation,
  QuotationItem,
  QuotationItemType,
  QuotationStatus,
  QuotationsResponse,
} from "@/pages/quotations/types";

export type TableQuotation = Quotation & {
  quotationNumberDisplay: string;
  eventDisplay: string;
  customerLeadDisplay: string;
  subtotalDisplay: string;
  discountAmountDisplay: string;
  totalAmountDisplay: string;
};

export type TableQuotationsResponse = {
  data: { quotations: TableQuotation[] };
  total: number;
  totalPages: number;
};

export const toNumberValue = (value?: DecimalValue | null) => {
  if (value === null || typeof value === "undefined" || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const formatMoney = (value?: DecimalValue | null) => {
  const amount = toNumberValue(value);

  if (amount === null) {
    return "-";
  }

  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
};

export const safeMoney = (value?: DecimalValue | null) => formatMoney(value);

export const formatQuotationStatus = (value: QuotationStatus) =>
  value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const formatQuotationItemCategory = (value?: string | null) => {
  if (!value) {
    return "-";
  }

  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

export const getQuotationDisplayNumber = (
  quotation: Pick<Quotation, "id" | "quotationNumber">,
) => quotation.quotationNumber?.trim() || `QT-${quotation.id}`;

export const getQuotationPartyDisplay = (
  quotation: Pick<Quotation, "customer" | "lead" | "event">,
) =>
  quotation.event?.customer?.fullName ||
  quotation.customer?.fullName ||
  quotation.lead?.fullName ||
  "-";

export const isServiceItem = (
  item?: Pick<QuotationItem, "itemType"> | null,
): item is Pick<QuotationItem, "itemType"> & { itemType: "service" } =>
  (item?.itemType ?? "service") === "service";

export const isVendorItem = (
  item?: Pick<QuotationItem, "itemType"> | null,
): item is Pick<QuotationItem, "itemType"> & { itemType: "vendor" } =>
  item?.itemType === "vendor";

export const getQuotationItemLabel = (item: Partial<QuotationItem>) => {
  if (isVendorItem(item as Pick<QuotationItem, "itemType">)) {
    return (
      item.itemName ||
      item.eventVendor?.vendor?.name ||
      item.vendor?.name ||
      item.eventVendor?.companyNameSnapshot ||
      "Vendor"
    );
  }

  return (
    item.itemName ||
    item.eventService?.serviceNameSnapshot ||
    item.service?.name ||
    "Service"
  );
};

export const getQuotationItemDisplayName = (item: QuotationItem) =>
  getQuotationItemLabel(item);

export const getQuotationCompanyDisplayName = (item: Partial<QuotationItem>) => {
  if (!isVendorItem(item as Pick<QuotationItem, "itemType">)) {
    return "-";
  }

  return (
    item.itemName ||
    item.eventVendor?.vendor?.name ||
    item.vendor?.name ||
    item.eventVendor?.companyNameSnapshot ||
    "Vendor"
  );
};

export const getQuotationItemTypeLabel = (itemType: QuotationItemType) =>
  itemType === "vendor" ? "Vendor" : "Service";

export const computeQuotationItemTotal = (
  quantity?: DecimalValue | null,
  unitPrice?: DecimalValue | null,
  totalPrice?: DecimalValue | null,
) => {
  const quantityValue = toNumberValue(quantity) ?? 0;
  const unitPriceValue = toNumberValue(unitPrice) ?? 0;
  const explicitTotal = toNumberValue(totalPrice);

  if (explicitTotal !== null) {
    return Number(explicitTotal.toFixed(3));
  }

  return Number((quantityValue * unitPriceValue).toFixed(3));
};

export const computeQuotationTotals = ({
  items,
  subtotal,
  discountAmount,
}: {
  items?: Array<{
    quantity?: DecimalValue | null;
    unitPrice?: DecimalValue | null;
    totalPrice?: DecimalValue | null;
  }>;
  subtotal?: DecimalValue | null;
  discountAmount?: DecimalValue | null;
}) => {
  const subtotalValue = Array.isArray(items)
    ? Number(
        items
          .reduce((sum, item) => {
            return (
              sum +
              computeQuotationItemTotal(
                item.quantity,
                item.unitPrice,
                item.totalPrice,
              )
            );
          }, 0)
          .toFixed(3),
      )
    : Number((toNumberValue(subtotal) ?? 0).toFixed(3));
  const discount = Number((toNumberValue(discountAmount) ?? 0).toFixed(3));
  const totalAmount = Number(Math.max(0, subtotalValue - discount).toFixed(3));

  return {
    subtotal: subtotalValue,
    discountAmount: discount,
    totalAmount,
  };
};

export function toTableQuotations(
  res?: QuotationsResponse,
): TableQuotationsResponse {
  const quotations = (res?.data ?? []).map<TableQuotation>((quotation) => ({
    ...quotation,
    quotationNumberDisplay: getQuotationDisplayNumber(quotation),
    eventDisplay: quotation.event
      ? getEventDisplayTitle(quotation.event)
      : `Event #${quotation.eventId}`,
    customerLeadDisplay: getQuotationPartyDisplay(quotation),
    subtotalDisplay: formatMoney(quotation.subtotal),
    discountAmountDisplay: formatMoney(quotation.discountAmount),
    totalAmountDisplay: formatMoney(quotation.totalAmount),
  }));

  return {
    data: { quotations },
    total: res?.meta?.total ?? quotations.length,
    totalPages: res?.meta?.pages ?? 1,
  };
}

export const QUOTATION_STATUS_OPTIONS: Array<{
  value: QuotationStatus;
  label: string;
}> = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "expired", label: "Expired" },
  { value: "converted_to_contract", label: "Converted To Contract" },
];
