import type { ButtonProps } from "@/components/ui/button";
import type { Appointment, AppointmentStatus } from "@/pages/appointments/types";
import type { ContractStatus } from "@/pages/contracts/types";
import type { Event, EventStatus } from "@/pages/events/types";
import type { ExecutionBriefStatus } from "@/pages/execution/types";
import type { QuotationStatus } from "@/pages/quotations/types";

export type WorkflowEntityType =
  | "appointment"
  | "event"
  | "quotation"
  | "contract"
  | "execution";

export type WorkflowActionDefinition = {
  key: string;
  label: string;
  description: string;
  nextStatus?: string;
  variant?: ButtonProps["variant"];
  confirmTitle?: string;
  confirmMessage?: string;
};

export const formatWorkflowLabel = (value: string) =>
  value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const isAppointmentConverted = (
  status: AppointmentStatus | string | null | undefined,
) => status === "converted";

export const canConvertAppointmentToEvent = (
  appointment: Pick<Appointment, "status">,
) => appointment.status === "attended";

export const getAppointmentConversionState = (
  appointment: Pick<Appointment, "status">,
) => {
  if (appointment.status === "converted") {
    return {
      canConvert: false,
      message: "This appointment was already converted to an event.",
    };
  }

  if (appointment.status === "cancelled") {
    return {
      canConvert: false,
      message: "Cancelled appointments cannot be converted to events.",
    };
  }

  if (appointment.status === "no_show") {
    return {
      canConvert: false,
      message: "No-show appointments cannot be converted to events.",
    };
  }

  if (appointment.status !== "attended") {
    return {
      canConvert: false,
      message: "Mark the appointment as attended before converting it to an event.",
    };
  }

  return {
    canConvert: true,
    message: "This appointment is ready to convert into an event.",
  };
};

const EVENT_ACTIONS: Partial<Record<EventStatus, WorkflowActionDefinition[]>> = {
  draft: [
    {
      key: "move_to_designing",
      label: "Move to Designing",
      description: "Start design and planning work for this event.",
      nextStatus: "designing",
    },
    {
      key: "cancel_event",
      label: "Cancel Event",
      description: "Stop this event before commercial work starts.",
      nextStatus: "cancelled",
      variant: "destructive",
      confirmTitle: "Cancel event?",
      confirmMessage: "This event will be marked as cancelled.",
    },
  ],
  designing: [
    {
      key: "mark_quotation_pending",
      label: "Mark Quotation Pending",
      description: "Move the event into quotation preparation.",
      nextStatus: "quotation_pending",
    },
    {
      key: "cancel_event",
      label: "Cancel Event",
      description: "Stop this event before a quotation is issued.",
      nextStatus: "cancelled",
      variant: "destructive",
      confirmTitle: "Cancel event?",
      confirmMessage: "This event will be marked as cancelled.",
    },
  ],
  quotation_pending: [
    {
      key: "mark_quoted",
      label: "Mark Quoted",
      description: "Record that a quotation is ready for customer review.",
      nextStatus: "quoted",
    },
    {
      key: "cancel_event",
      label: "Cancel Event",
      description: "Stop this event before commercial approval.",
      nextStatus: "cancelled",
      variant: "destructive",
      confirmTitle: "Cancel event?",
      confirmMessage: "This event will be marked as cancelled.",
    },
  ],
  quoted: [
    {
      key: "confirm_event",
      label: "Confirm Event",
      description: "Mark the event as commercially confirmed.",
      nextStatus: "confirmed",
    },
    {
      key: "cancel_event",
      label: "Cancel Event",
      description: "Cancel this event after quotation review.",
      nextStatus: "cancelled",
      variant: "destructive",
      confirmTitle: "Cancel event?",
      confirmMessage: "This event will be marked as cancelled.",
    },
  ],
  confirmed: [
    {
      key: "start_event_execution",
      label: "Start Execution",
      description: "Move this event into live execution.",
      nextStatus: "in_progress",
    },
    {
      key: "cancel_event",
      label: "Cancel Event",
      description: "Cancel this confirmed event.",
      nextStatus: "cancelled",
      variant: "destructive",
      confirmTitle: "Cancel event?",
      confirmMessage: "This event will be marked as cancelled.",
    },
  ],
  in_progress: [
    {
      key: "complete_event",
      label: "Complete Event",
      description: "Mark execution as finished.",
      nextStatus: "completed",
    },
    {
      key: "cancel_event",
      label: "Cancel Event",
      description: "Cancel this event while execution is in progress.",
      nextStatus: "cancelled",
      variant: "destructive",
      confirmTitle: "Cancel event?",
      confirmMessage: "This event will be marked as cancelled.",
    },
  ],
};

export const getEventWorkflowActions = (
  status: EventStatus | null | undefined,
) => (status ? EVENT_ACTIONS[status] ?? [] : []);

const QUOTATION_ACTIONS: Partial<
  Record<QuotationStatus, WorkflowActionDefinition[]>
> = {
  draft: [
    {
      key: "send_quotation",
      label: "Send Quotation",
      description: "Mark the quotation as sent to the customer.",
      nextStatus: "sent",
    },
    {
      key: "supersede_quotation",
      label: "Supersede Quotation",
      description: "Retire this quotation in favor of a newer commercial version.",
      nextStatus: "superseded",
      variant: "outline",
      confirmTitle: "Supersede quotation?",
      confirmMessage: "This quotation will no longer be the active commercial option.",
    },
  ],
  sent: [
    {
      key: "approve_quotation",
      label: "Approve Quotation",
      description: "Make this quotation the approved commercial basis.",
      nextStatus: "approved",
    },
    {
      key: "reject_quotation",
      label: "Reject Quotation",
      description: "Record that the quotation was rejected.",
      nextStatus: "rejected",
      variant: "destructive",
      confirmTitle: "Reject quotation?",
      confirmMessage: "This quotation will be marked as rejected.",
    },
    {
      key: "expire_quotation",
      label: "Expire Quotation",
      description: "Mark the quotation as expired.",
      nextStatus: "expired",
      variant: "outline",
      confirmTitle: "Expire quotation?",
      confirmMessage: "This quotation will be marked as expired.",
    },
    {
      key: "supersede_quotation",
      label: "Supersede Quotation",
      description: "Retire this quotation in favor of a newer commercial version.",
      nextStatus: "superseded",
      variant: "outline",
      confirmTitle: "Supersede quotation?",
      confirmMessage: "This quotation will no longer be the active commercial option.",
    },
  ],
};

export const getQuotationWorkflowActions = (
  status: QuotationStatus | null | undefined,
) => (status ? QUOTATION_ACTIONS[status] ?? [] : []);

const CONTRACT_ACTIONS: Partial<Record<ContractStatus, WorkflowActionDefinition[]>> = {
  draft: [
    {
      key: "issue_contract",
      label: "Issue Contract",
      description: "Issue this contract to the client.",
      nextStatus: "issued",
    },
    {
      key: "cancel_contract",
      label: "Cancel Contract",
      description: "Cancel this draft contract before signature.",
      nextStatus: "cancelled",
      variant: "destructive",
      confirmTitle: "Cancel contract?",
      confirmMessage: "This contract will be marked as cancelled.",
    },
  ],
  issued: [
    {
      key: "sign_contract",
      label: "Sign Contract",
      description: "Record that the contract has been signed.",
      nextStatus: "signed",
    },
    {
      key: "cancel_contract",
      label: "Cancel Contract",
      description: "Cancel this issued contract before activation.",
      nextStatus: "cancelled",
      variant: "destructive",
      confirmTitle: "Cancel contract?",
      confirmMessage: "This contract will be marked as cancelled.",
    },
  ],
  signed: [
    {
      key: "activate_contract",
      label: "Activate Contract",
      description: "Move this signed contract into the active commitment stage.",
      nextStatus: "active",
    },
  ],
  active: [
    {
      key: "complete_contract",
      label: "Complete Contract",
      description: "Mark this contract as fulfilled.",
      nextStatus: "completed",
    },
    {
      key: "terminate_contract",
      label: "Terminate Contract",
      description: "Terminate this active commitment.",
      nextStatus: "terminated",
      variant: "destructive",
      confirmTitle: "Terminate contract?",
      confirmMessage: "This contract will be marked as terminated.",
    },
  ],
};

export const getContractWorkflowActions = (
  status: ContractStatus | null | undefined,
) => (status ? CONTRACT_ACTIONS[status] ?? [] : []);

const EXECUTION_ACTIONS: Partial<
  Record<ExecutionBriefStatus, WorkflowActionDefinition[]>
> = {
  draft: [
    {
      key: "submit_execution_review",
      label: "Submit for Review",
      description: "Move this execution brief into review.",
      nextStatus: "under_review",
    },
    {
      key: "cancel_execution",
      label: "Cancel Execution Brief",
      description: "Cancel this draft execution brief.",
      nextStatus: "cancelled",
      variant: "destructive",
      confirmTitle: "Cancel execution brief?",
      confirmMessage: "This execution brief will be marked as cancelled.",
    },
  ],
  under_review: [
    {
      key: "approve_execution",
      label: "Approve Execution Brief",
      description: "Approve the brief for handoff readiness.",
      nextStatus: "approved",
    },
    {
      key: "cancel_execution",
      label: "Cancel Execution Brief",
      description: "Cancel this execution brief before approval.",
      nextStatus: "cancelled",
      variant: "destructive",
      confirmTitle: "Cancel execution brief?",
      confirmMessage: "This execution brief will be marked as cancelled.",
    },
  ],
  approved: [
    {
      key: "handoff_execution",
      label: "Handoff Execution Brief",
      description: "Hand this brief off to the execution team.",
      nextStatus: "handed_off",
      confirmTitle: "Handoff execution brief?",
      confirmMessage: "This brief will become the handed-off operational reference.",
    },
  ],
  handed_off: [
    {
      key: "start_execution",
      label: "Start Execution",
      description: "Move execution into active progress.",
      nextStatus: "in_progress",
    },
  ],
  handed_to_executor: [
    {
      key: "start_execution",
      label: "Start Execution",
      description: "Move execution into active progress.",
      nextStatus: "in_progress",
    },
  ],
  in_progress: [
    {
      key: "complete_execution",
      label: "Complete Execution",
      description: "Mark execution as completed.",
      nextStatus: "completed",
    },
  ],
};

export const getExecutionWorkflowActions = (
  status: ExecutionBriefStatus | null | undefined,
) => (status ? EXECUTION_ACTIONS[status] ?? [] : []);

export const isQuotationLocked = (
  status: QuotationStatus | string | null | undefined,
) =>
  status === "approved" || status === "superseded" || status === "converted_to_contract";

export const getQuotationLockMessage = (
  status: QuotationStatus | string | null | undefined,
) =>
  isQuotationLocked(status)
    ? "Commercial fields are read-only because this quotation is approved or superseded."
    : null;

export const isContractLocked = (
  status: ContractStatus | string | null | undefined,
) => status === "signed" || status === "active" || status === "completed";

export const getContractLockMessage = (
  status: ContractStatus | string | null | undefined,
) =>
  isContractLocked(status)
    ? "Commitment fields are read-only because this contract is signed or active."
    : null;

export const isExecutionLocked = (
  status: ExecutionBriefStatus | string | null | undefined,
) =>
  status === "handed_off"
  || status === "handed_to_executor"
  || status === "in_progress"
  || status === "completed";

export const getExecutionLockMessage = (
  status: ExecutionBriefStatus | string | null | undefined,
) =>
  isExecutionLocked(status)
    ? "Operational structure is read-only because execution has been handed off."
    : null;

export const getAppointmentRelatedEvent = (
  appointment: Appointment & {
    convertedEvent?: { id: number; title?: string | null; status?: string | null } | null;
    sourcedEvents?: Array<{ id: number; title?: string | null; status?: string | null }> | null;
  },
) => appointment.convertedEvent ?? appointment.sourcedEvents?.[0] ?? null;

export const getEventCommercialSummary = (event: Event) => {
  switch (event.status) {
    case "draft":
      return "Event setup is still in draft.";
    case "designing":
      return "Design and scope planning are in progress.";
    case "quotation_pending":
      return "Commercial quotation work is pending.";
    case "quoted":
      return "A quotation has been prepared and is awaiting confirmation.";
    case "confirmed":
      return "The event is commercially confirmed and ready for execution planning.";
    case "in_progress":
      return "Execution is in progress.";
    case "completed":
      return "This event has been completed.";
    case "cancelled":
      return "This event was cancelled and downstream creation is blocked.";
    default:
      return null;
  }
};

export const canCreateContractFromQuotation = (
  status: QuotationStatus | string | null | undefined,
) => status === "approved";
