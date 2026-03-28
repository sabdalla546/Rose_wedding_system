import type { Customer, CustomersResponse } from "@/pages/customers/types";

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

export const formatCustomerStatus = (status: Customer["status"]) =>
  status.charAt(0).toUpperCase() + status.slice(1);
