export const APPOINTMENT_WORKFLOW_STATUSES = [
  "reserved",
  "attended",
  "cancelled",
  "converted",
  "no_show",
] as const;

export const APPOINTMENT_LEGACY_STATUSES = [
  "scheduled",
  "completed",
  "confirmed",
  "rescheduled",
] as const;

export const APPOINTMENT_STATUSES = [
  "reserved",
  "attended",
  "cancelled",
  "converted",
  "no_show",
  "scheduled",
  "completed",
  "confirmed",
  "rescheduled",
] as const;

export type AppointmentWorkflowStatus =
  (typeof APPOINTMENT_WORKFLOW_STATUSES)[number];
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export const EVENT_WORKFLOW_STATUSES = [
  "draft",
  "designing",
  "quotation_pending",
  "quoted",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
] as const;

export const EVENT_STATUSES = EVENT_WORKFLOW_STATUSES;
export type EventWorkflowStatus = (typeof EVENT_WORKFLOW_STATUSES)[number];
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const QUOTATION_WORKFLOW_STATUSES = [
  "draft",
  "sent",
  "approved",
  "rejected",
  "expired",
  "superseded",
] as const;

export const QUOTATION_LEGACY_STATUSES = ["converted_to_contract"] as const;

export const QUOTATION_STATUSES = [
  "draft",
  "sent",
  "approved",
  "rejected",
  "expired",
  "superseded",
  "converted_to_contract",
] as const;

export type QuotationWorkflowStatus =
  (typeof QUOTATION_WORKFLOW_STATUSES)[number];
export type QuotationStatus = (typeof QUOTATION_STATUSES)[number];

export const CONTRACT_WORKFLOW_STATUSES = [
  "draft",
  "issued",
  "signed",
  "active",
  "completed",
  "cancelled",
  "terminated",
] as const;

export const CONTRACT_STATUSES = CONTRACT_WORKFLOW_STATUSES;
export type ContractWorkflowStatus =
  (typeof CONTRACT_WORKFLOW_STATUSES)[number];
export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

export const EXECUTION_BRIEF_WORKFLOW_STATUSES = [
  "draft",
  "under_review",
  "approved",
  "handed_off",
  "in_progress",
  "completed",
  "cancelled",
] as const;

export const EXECUTION_BRIEF_LEGACY_STATUSES = ["handed_to_executor"] as const;

export const EXECUTION_BRIEF_STATUSES = [
  "draft",
  "under_review",
  "approved",
  "handed_off",
  "in_progress",
  "completed",
  "cancelled",
  "handed_to_executor",
] as const;

export type ExecutionBriefWorkflowStatus =
  (typeof EXECUTION_BRIEF_WORKFLOW_STATUSES)[number];
export type ExecutionBriefStatus = (typeof EXECUTION_BRIEF_STATUSES)[number];

export const APPOINTMENT_STATUS_ALIASES: Partial<
  Record<AppointmentStatus, AppointmentWorkflowStatus>
> = {
  scheduled: "reserved",
  confirmed: "reserved",
  rescheduled: "reserved",
  completed: "attended",
};

export const QUOTATION_STATUS_ALIASES: Partial<
  Record<QuotationStatus, QuotationWorkflowStatus>
> = {
  converted_to_contract: "superseded",
};

export const EXECUTION_BRIEF_STATUS_ALIASES: Partial<
  Record<ExecutionBriefStatus, ExecutionBriefWorkflowStatus>
> = {
  handed_to_executor: "handed_off",
};

export const ACTIVE_EVENT_STATUSES = [
  "draft",
  "designing",
  "quotation_pending",
  "quoted",
  "confirmed",
  "in_progress",
  "completed",
] as const;

export const CANCELLABLE_EVENT_STATUSES = new Set<EventWorkflowStatus>([
  "draft",
  "designing",
  "quotation_pending",
  "quoted",
  "confirmed",
  "in_progress",
]);

export const TERMINAL_APPOINTMENT_STATUSES = new Set<AppointmentWorkflowStatus>(
  ["cancelled", "no_show", "converted"],
);

export const CANCELLED_EVENT_STATUSES = new Set<EventWorkflowStatus>([
  "cancelled",
]);

export const PRE_FINAL_EXECUTION_STATUSES =
  new Set<ExecutionBriefWorkflowStatus>([
    "draft",
    "under_review",
    "approved",
    "handed_off",
  ]);
