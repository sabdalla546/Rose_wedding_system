import type {
  DecimalValue,
  EventVendorLink,
  EventVendorProvidedBy,
  EventVendorStatus,
  Vendor,
  VendorPricingPlan,
  VendorPricingPlansResponse,
  VendorSubService,
  VendorSubServicesResponse,
  VendorsResponse,
  VendorType,
} from "@/pages/vendors/types";

export type TableVendor = Vendor & {
  contactSummary: string;
  typeDisplay: string;
};

export type TableVendorSubService = VendorSubService & {
  vendorDisplay: string;
  typeDisplay: string;
};

export type TableVendorPricingPlan = VendorPricingPlan & {
  vendorDisplay: string;
  typeDisplay: string;
  subServiceRangeDisplay: string;
  priceDisplay: string;
};

export type TableVendorsResponse = {
  data: { vendors: TableVendor[] };
  total: number;
  totalPages: number;
};

export type TableVendorSubServicesResponse = {
  data: { subServices: TableVendorSubService[] };
  total: number;
  totalPages: number;
};

export type TableVendorPricingPlansResponse = {
  data: { pricingPlans: TableVendorPricingPlan[] };
  total: number;
  totalPages: number;
};

export const formatVendorType = (value: VendorType) =>
  value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

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

export const formatVendorPricingRange = (
  minSubServices: number,
  maxSubServices?: number | null,
) =>
  maxSubServices === null || typeof maxSubServices === "undefined"
    ? `${minSubServices}+`
    : `${minSubServices} - ${maxSubServices}`;

export const formatProvidedBy = (value: EventVendorProvidedBy) =>
  value.charAt(0).toUpperCase() + value.slice(1);

export const formatEventVendorStatus = (value: EventVendorStatus) =>
  value.charAt(0).toUpperCase() + value.slice(1);

export const getEventVendorDisplayName = (link: EventVendorLink) =>
  link.resolvedCompanyName || link.vendor?.name || link.companyNameSnapshot || "-";

export function toTableVendors(res?: VendorsResponse): TableVendorsResponse {
  const vendors = (res?.data ?? []).map<TableVendor>((vendor) => ({
    ...vendor,
    contactSummary: [vendor.phone, vendor.phone2].filter(Boolean).join(" / "),
    typeDisplay: formatVendorType(vendor.type),
  }));

  return {
    data: { vendors },
    total: res?.meta?.total ?? vendors.length,
    totalPages: res?.meta?.pages ?? 1,
  };
}

export function toTableVendorSubServices(
  res?: VendorSubServicesResponse,
): TableVendorSubServicesResponse {
  const subServices = (res?.data ?? []).map<TableVendorSubService>(
    (subService) => ({
      ...subService,
      vendorDisplay: subService.vendor?.name || "-",
      typeDisplay: formatVendorType(
        subService.vendor?.type ?? subService.vendorType,
      ),
    }),
  );

  return {
    data: { subServices },
    total: res?.meta?.total ?? subServices.length,
    totalPages: res?.meta?.pages ?? 1,
  };
}

export function toTableVendorPricingPlans(
  res?: VendorPricingPlansResponse,
): TableVendorPricingPlansResponse {
  const pricingPlans = (res?.data ?? []).map<TableVendorPricingPlan>((plan) => ({
    ...plan,
    vendorDisplay: plan.vendor?.name || "-",
    typeDisplay: formatVendorType(plan.vendor?.type ?? plan.vendorType),
    subServiceRangeDisplay: formatVendorPricingRange(
      plan.minSubServices,
      plan.maxSubServices,
    ),
    priceDisplay: formatMoney(plan.price),
  }));

  return {
    data: { pricingPlans },
    total: res?.meta?.total ?? pricingPlans.length,
    totalPages: res?.meta?.pages ?? 1,
  };
}

export const VENDOR_TYPE_OPTIONS: Array<{
  value: VendorType;
  label: string;
}> = [
  { value: "dj", label: "DJ" },
  { value: "lighting", label: "Lighting" },
  { value: "barcode", label: "Barcode" },
  { value: "photography", label: "Photography" },
  { value: "perfumes", label: "Perfumes" },
  { value: "coffee_station", label: "Coffee Station" },
  { value: "cheese", label: "Cheese" },
  { value: "ac_generator", label: "AC Generator" },
  { value: "bleachers", label: "Bleachers" },
  { value: "instant_photography", label: "Instant Photography" },
  { value: "valet", label: "Valet" },
  { value: "female_supplies", label: "Female Supplies" },
  { value: "family_services", label: "Family Services" },
  { value: "sweets_savories", label: "Sweets & Savories" },
  { value: "other", label: "Other" },
];

export const EVENT_VENDOR_PROVIDED_BY_OPTIONS: Array<{
  value: EventVendorProvidedBy;
  label: string;
}> = [
  { value: "company", label: "Company" },
  { value: "client", label: "Client" },
];

export const EVENT_VENDOR_STATUS_OPTIONS: Array<{
  value: EventVendorStatus;
  label: string;
}> = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "confirmed", label: "Confirmed" },
  { value: "cancelled", label: "Cancelled" },
];
