import type { Customer, CustomersResponse } from "@/pages/customers/types";

export type TableCustomer = Customer & {
  venueDisplay: string;
  contactSummary: string;
  sourceLeadDisplay: string;
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
    venueDisplay:
      customer.venue?.name ||
      customer.venueNameSnapshot ||
      customer.venueId?.toString() ||
      "-",
    contactSummary: [customer.mobile, customer.mobile2]
      .filter(Boolean)
      .join(" / "),
    sourceLeadDisplay: customer.sourceLead?.fullName || "-",
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
