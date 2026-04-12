import type {
  DecimalValue,
  EventVendorLink,
  EventVendorProvidedBy,
  EventVendorStatus,
  Vendor,
  VendorTypeRecord,
  VendorSubService,
  VendorSubServicesResponse,
  VendorTypesResponse,
  VendorsResponse,
  VendorType,
} from "@/pages/vendors/types";

export type TableVendor = Vendor & {
  contactSummary: string;
  typeDisplay: string;
};

export type TableVendorType = VendorTypeRecord;

export type TableVendorSubService = VendorSubService & {
  vendorDisplay: string;
  typeDisplay: string;
  priceDisplay: string;
};

export type TableVendorsResponse = {
  data: { vendors: TableVendor[] };
  total: number;
  totalPages: number;
};

export type TableVendorTypesResponse = {
  data: { vendorTypes: TableVendorType[] };
  total: number;
  totalPages: number;
};

export type TableVendorSubServicesResponse = {
  data: { subServices: TableVendorSubService[] };
  total: number;
  totalPages: number;
};

export const formatVendorType = (value: VendorType) =>
  value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const getVendorTypeName = ({
  slug,
  vendorType,
  language = "en",
}: {
  slug?: VendorType | null;
  vendorType?: VendorTypeRecord | null;
  language?: string;
}) => {
  if (vendorType) {
    return language === "ar"
      ? vendorType.nameAr || vendorType.name
      : vendorType.name || vendorType.nameAr;
  }

  return slug ? formatVendorType(slug) : "-";
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

export const sumSelectedVendorSubServicePrices = (
  subServices: VendorSubService[],
  selectedIds: number[],
) => {
  let sum = 0;
  for (const id of selectedIds) {
    const sub = subServices.find((entry) => entry.id === id);
    if (!sub) continue;
    const amount = toNumberValue(sub.price);
    if (amount !== null) {
      sum += amount;
    }
  }
  return sum;
};

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

export function toTableVendorTypes(
  res?: VendorTypesResponse,
): TableVendorTypesResponse {
  const vendorTypes = res?.data ?? [];

  return {
    data: { vendorTypes },
    total: res?.meta?.total ?? vendorTypes.length,
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
      priceDisplay: formatMoney(subService.price),
    }),
  );

  return {
    data: { subServices },
    total: res?.meta?.total ?? subServices.length,
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
