import type { Lead, LeadsResponse } from "@/pages/leads/types";

export type TableLead = Lead & {
  venueDisplay: string;
  contactSummary: string;
  sourceDisplay: string;
  canMarkLost: boolean;
  canConvert: boolean;
};

export type TableLeadsResponse = {
  data: { leads: TableLead[] };
  total: number;
  totalPages: number;
};

export function toTableLeads(res?: LeadsResponse): TableLeadsResponse {
  const leads = (res?.data ?? []).map<TableLead>((lead) => ({
    ...lead,
    venueDisplay:
      lead.venue?.name || lead.venueNameSnapshot || lead.venueId?.toString() || "-",
    contactSummary: [lead.mobile, lead.mobile2].filter(Boolean).join(" / "),
    sourceDisplay: lead.source?.trim() || "-",
    canMarkLost: !["lost", "cancelled", "converted"].includes(lead.status),
    canConvert:
      !lead.convertedToCustomer &&
      !lead.convertedCustomerId &&
      !["lost", "cancelled", "converted"].includes(lead.status),
  }));

  return {
    data: { leads },
    total: res?.meta?.total ?? leads.length,
    totalPages: res?.meta?.pages ?? 1,
  };
}

export const LEAD_STATUS_OPTIONS: Array<{
  value: TableLead["status"];
  label: string;
}> = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "appointment_scheduled", label: "Appointment Scheduled" },
  { value: "appointment_completed", label: "Appointment Completed" },
  { value: "quotation_sent", label: "Quotation Sent" },
  { value: "contract_pending", label: "Contract Pending" },
  { value: "converted", label: "Converted" },
  { value: "lost", label: "Lost" },
  { value: "cancelled", label: "Cancelled" },
];

export const LEAD_SOURCE_PLACEHOLDERS = [
  "Instagram",
  "WhatsApp",
  "Phone Call",
  "Referral",
  "Walk-in",
];

export const formatLeadStatus = (status: Lead["status"]) =>
  status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
