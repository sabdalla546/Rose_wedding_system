import type {
  Customer,
  CustomerSource,
  CustomersResponse,
} from "@/pages/customers/types";

export type TableCustomer = Customer & {
  contactSummary: string;
  nationalIdDisplay: string;
  notesPreview: string;
};

export type TableCustomersResponse = {
  data: { customers: TableCustomer[] };
  total: number;
  totalPages: number;
};

export function toTableCustomers(
  res?: CustomersResponse,
): TableCustomersResponse {
  const customers = (res?.data ?? []).map<TableCustomer>((customer) => ({
    ...customer,
    contactSummary: [customer.mobile, customer.mobile2].filter(Boolean).join(" / "),
    nationalIdDisplay: customer.nationalId?.trim() || "-",
    notesPreview: customer.notes?.trim() || "-",
  }));

  return {
    data: { customers },
    total: res?.meta?.total ?? customers.length,
    totalPages: res?.meta?.pages ?? 1,
  };
}

export const CUSTOMER_STATUS_OPTIONS: Array<{
  value: Customer["status"];
  label: string;
}> = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export const CUSTOMER_SOURCE_OPTIONS = [
  { value: "facebook", label: "Facebook", labelAr: "فيسبوك" },
  { value: "instagram", label: "Instagram", labelAr: "إنستغرام" },
  { value: "tiktok", label: "TikTok", labelAr: "تيك توك" },
  { value: "google_search", label: "Google Search", labelAr: "بحث جوجل" },
  { value: "google_maps", label: "Google Maps", labelAr: "خرائط جوجل" },
  { value: "snapchat", label: "Snapchat", labelAr: "سناب شات" },
  { value: "whatsapp", label: "WhatsApp", labelAr: "واتساب" },
  { value: "friend_referral", label: "Friend Referral", labelAr: "إحالة من صديق" },
  { value: "family_referral", label: "Family Referral", labelAr: "إحالة من العائلة" },
  { value: "existing_customer", label: "Existing Customer", labelAr: "عميل حالي" },
  { value: "walk_in", label: "Walk-in", labelAr: "زيارة مباشرة" },
  { value: "advertisement", label: "Advertisement", labelAr: "إعلان" },
  { value: "exhibition", label: "Exhibition", labelAr: "معرض" },
  { value: "website", label: "Website", labelAr: "الموقع الإلكتروني" },
  { value: "other", label: "Other", labelAr: "أخرى" },
] as const satisfies Array<{
  value: CustomerSource;
  label: string;
  labelAr: string;
}>;

export const CUSTOMER_SOURCE_VALUES = CUSTOMER_SOURCE_OPTIONS.map(
  (option) => option.value,
) as [CustomerSource, ...CustomerSource[]];

export const getCustomerSourceLabel = (
  source?: CustomerSource | null,
  language: string = "en",
) => {
  if (!source) {
    return "-";
  }

  const option = CUSTOMER_SOURCE_OPTIONS.find((item) => item.value === source);

  if (!option) {
    return source;
  }

  return language === "ar" ? option.labelAr : option.label;
};

export const formatCustomerStatus = (status: Customer["status"]) =>
  status.charAt(0).toUpperCase() + status.slice(1);
