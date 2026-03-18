import type {
  EventVendorLink,
  EventVendorProvidedBy,
  EventVendorStatus,
  Vendor,
  VendorsResponse,
  VendorType,
} from "@/pages/vendors/types";

export type TableVendor = Vendor & {
  contactSummary: string;
  typeDisplay: string;
};

export type TableVendorsResponse = {
  data: { vendors: TableVendor[] };
  total: number;
  totalPages: number;
};

export const formatVendorType = (value: VendorType) =>
  value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const formatProvidedBy = (value: EventVendorProvidedBy) =>
  value.charAt(0).toUpperCase() + value.slice(1);

export const formatEventVendorStatus = (value: EventVendorStatus) =>
  value.charAt(0).toUpperCase() + value.slice(1);

export const getEventVendorDisplayName = (link: EventVendorLink) =>
  link.vendor?.name || link.companyNameSnapshot || "-";

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
