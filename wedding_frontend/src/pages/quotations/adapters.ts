import { getEventDisplayTitle } from "@/pages/events/adapters";
import type {
  DecimalValue,
  Quotation,
  QuotationItem,
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
  quotation: Pick<Quotation, "customer" | "lead">,
) => quotation.customer?.fullName || quotation.lead?.fullName || "-";

export const getQuotationItemDisplayName = (item: QuotationItem) =>
  item.itemName || item.service?.name || item.eventService?.serviceNameSnapshot || "-";

export const computeQuotationItemTotal = (
  quantity?: DecimalValue | null,
  unitPrice?: DecimalValue | null,
) => {
  const quantityValue = toNumberValue(quantity);
  const unitPriceValue = toNumberValue(unitPrice);

  if (
    quantityValue === null ||
    quantityValue <= 0 ||
    unitPriceValue === null ||
    unitPriceValue < 0
  ) {
    return null;
  }

  return Number((quantityValue * unitPriceValue).toFixed(3));
};

export const computeQuotationTotals = ({
  items,
  discountAmount,
}: {
  items: Array<{
    quantity?: DecimalValue | null;
    unitPrice?: DecimalValue | null;
    totalPrice?: DecimalValue | null;
  }>;
  discountAmount?: DecimalValue | null;
}) => {
  const subtotal = Number(
    items
      .reduce((sum, item) => {
        const total =
          toNumberValue(item.totalPrice) ??
          computeQuotationItemTotal(item.quantity, item.unitPrice) ??
          0;

        return sum + total;
      }, 0)
      .toFixed(3),
  );
  const discount = Number((toNumberValue(discountAmount) ?? 0).toFixed(3));
  const totalAmount = Number(Math.max(0, subtotal - discount).toFixed(3));

  return {
    subtotal,
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
