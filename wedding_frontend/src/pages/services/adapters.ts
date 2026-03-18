import type {
  DecimalValue,
  EventServiceItem,
  EventServiceStatus,
  Service,
  ServiceCategory,
  ServicePricingType,
  ServicesResponse,
} from "@/pages/services/types";

export type TableService = Service & {
  categoryDisplay: string;
  pricingTypeDisplay: string;
  basePriceDisplay: string;
};

export type TableServicesResponse = {
  data: { services: TableService[] };
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

export const formatServiceCategory = (value: ServiceCategory) =>
  value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const formatPricingType = (value: ServicePricingType) =>
  value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const formatEventServiceStatus = (value: EventServiceStatus) =>
  value.charAt(0).toUpperCase() + value.slice(1);

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

export const getEventServiceDisplayName = (item: EventServiceItem) =>
  item.service?.name || item.serviceNameSnapshot || "-";

export function toTableServices(res?: ServicesResponse): TableServicesResponse {
  const services = (res?.data ?? []).map<TableService>((service) => ({
    ...service,
    categoryDisplay: formatServiceCategory(service.category),
    pricingTypeDisplay: formatPricingType(service.pricingType),
    basePriceDisplay: formatMoney(service.basePrice),
  }));

  return {
    data: { services },
    total: res?.meta?.total ?? services.length,
    totalPages: res?.meta?.pages ?? 1,
  };
}

export const SERVICE_CATEGORY_OPTIONS: Array<{
  value: ServiceCategory;
  label: string;
}> = [
  { value: "internal_setup", label: "Internal Setup" },
  { value: "external_service", label: "External Service" },
  { value: "flowers", label: "Flowers" },
  { value: "stage", label: "Stage" },
  { value: "entrance", label: "Entrance" },
  { value: "chairs", label: "Chairs" },
  { value: "tables", label: "Tables" },
  { value: "buffet", label: "Buffet" },
  { value: "lighting", label: "Lighting" },
  { value: "photography", label: "Photography" },
  { value: "audio", label: "Audio" },
  { value: "hospitality", label: "Hospitality" },
  { value: "female_supplies", label: "Female Supplies" },
  { value: "transport", label: "Transport" },
  { value: "other", label: "Other" },
];

export const SERVICE_PRICING_TYPE_OPTIONS: Array<{
  value: ServicePricingType;
  label: string;
}> = [
  { value: "fixed", label: "Fixed" },
  { value: "per_guest", label: "Per Guest" },
  { value: "per_unit", label: "Per Unit" },
  { value: "custom", label: "Custom" },
];

export const EVENT_SERVICE_STATUS_OPTIONS: Array<{
  value: EventServiceStatus;
  label: string;
}> = [
  { value: "draft", label: "Draft" },
  { value: "approved", label: "Approved" },
  { value: "confirmed", label: "Confirmed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "completed", label: "Completed" },
];
