import {
  APPOINTMENT_STATUS_ALIASES,
  type AppointmentStatus,
  type AppointmentWorkflowStatus,
  CONTRACT_STATUSES,
  type ContractStatus,
  type ContractWorkflowStatus,
  CANCELLABLE_EVENT_STATUSES,
  EXECUTION_BRIEF_STATUS_ALIASES,
  type ExecutionBriefStatus,
  type ExecutionBriefWorkflowStatus,
  type EventStatus,
  type EventWorkflowStatus,
  QUOTATION_STATUS_ALIASES,
  type QuotationStatus,
  type QuotationWorkflowStatus,
} from "../../constants/workflow-statuses";
import { invalidStatusTransitionError } from "./workflow.errors";

export const APPOINTMENT_TRANSITIONS: Record<
  AppointmentWorkflowStatus,
  readonly AppointmentWorkflowStatus[]
> = {
  scheduled: ["completed", "cancelled", "no_show"],
  completed: ["converted"],
  cancelled: [],
  converted: [],
  no_show: [],
};

export const EVENT_TRANSITIONS: Record<
  EventWorkflowStatus,
  readonly EventWorkflowStatus[]
> = {
  draft: ["designing", "cancelled"],
  designing: ["quotation_pending", "cancelled"],
  quotation_pending: ["quoted", "cancelled"],
  quoted: ["confirmed", "cancelled"],
  confirmed: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export const QUOTATION_TRANSITIONS: Record<
  QuotationWorkflowStatus,
  readonly QuotationWorkflowStatus[]
> = {
  draft: ["sent", "superseded"],
  sent: ["approved", "rejected", "expired", "superseded"],
  approved: ["superseded"],
  rejected: [],
  expired: [],
  superseded: [],
};

export const CONTRACT_TRANSITIONS: Record<
  ContractWorkflowStatus,
  readonly ContractWorkflowStatus[]
> = {
  draft: ["issued", "cancelled"],
  issued: ["signed", "cancelled"],
  signed: ["active"],
  active: ["completed", "terminated"],
  completed: [],
  cancelled: [],
  terminated: [],
};

export const EXECUTION_BRIEF_TRANSITIONS: Record<
  ExecutionBriefWorkflowStatus,
  readonly ExecutionBriefWorkflowStatus[]
> = {
  draft: ["under_review", "cancelled"],
  under_review: ["approved", "cancelled"],
  approved: ["handed_off", "cancelled"],
  handed_off: ["in_progress", "cancelled"],
  in_progress: ["completed"],
  completed: [],
  cancelled: [],
};

export const normalizeAppointmentStatus = (
  status: AppointmentStatus,
): AppointmentWorkflowStatus =>
  APPOINTMENT_STATUS_ALIASES[status] ?? (status as AppointmentWorkflowStatus);

export const normalizeEventStatus = (status: EventStatus): EventWorkflowStatus =>
  status;

export const normalizeQuotationStatus = (
  status: QuotationStatus,
): QuotationWorkflowStatus =>
  QUOTATION_STATUS_ALIASES[status] ?? (status as QuotationWorkflowStatus);

export const normalizeContractStatus = (
  status: ContractStatus,
): ContractWorkflowStatus => status;

export const normalizeExecutionBriefStatus = (
  status: ExecutionBriefStatus,
): ExecutionBriefWorkflowStatus =>
  EXECUTION_BRIEF_STATUS_ALIASES[status]
  ?? (status as ExecutionBriefWorkflowStatus);

const assertValidTransition = <TWorkflowStatus extends string>({
  entityName,
  from,
  to,
  transitions,
}: {
  entityName: string;
  from: TWorkflowStatus;
  to?: TWorkflowStatus | null;
  transitions: Record<TWorkflowStatus, readonly TWorkflowStatus[]>;
}) => {
  if (!to || to === from) {
    return;
  }

  const allowedTransitions = transitions[from] ?? [];
  if (!allowedTransitions.includes(to)) {
    throw invalidStatusTransitionError(
      `Invalid ${entityName} status transition from ${from} to ${to}`,
    );
  }
};

export const assertValidAppointmentTransition = (
  from: AppointmentStatus,
  to?: AppointmentStatus | null,
) =>
  assertValidTransition({
    entityName: "appointment",
    from: normalizeAppointmentStatus(from),
    to: to ? normalizeAppointmentStatus(to) : undefined,
    transitions: APPOINTMENT_TRANSITIONS,
  });

export const assertValidEventTransition = (
  from: EventStatus,
  to?: EventStatus | null,
) =>
  assertValidTransition({
    entityName: "event",
    from: normalizeEventStatus(from),
    to: to ? normalizeEventStatus(to) : undefined,
    transitions: EVENT_TRANSITIONS,
  });

export const assertValidQuotationTransition = (
  from: QuotationStatus,
  to?: QuotationStatus | null,
) =>
  assertValidTransition({
    entityName: "quotation",
    from: normalizeQuotationStatus(from),
    to: to ? normalizeQuotationStatus(to) : undefined,
    transitions: QUOTATION_TRANSITIONS,
  });

export const assertValidContractTransition = (
  from: ContractStatus,
  to?: ContractStatus | null,
) =>
  assertValidTransition({
    entityName: "contract",
    from: normalizeContractStatus(from),
    to: to ? normalizeContractStatus(to) : undefined,
    transitions: CONTRACT_TRANSITIONS,
  });

export const assertValidExecutionBriefTransition = (
  from: ExecutionBriefStatus,
  to?: ExecutionBriefStatus | null,
) =>
  assertValidTransition({
    entityName: "execution brief",
    from: normalizeExecutionBriefStatus(from),
    to: to ? normalizeExecutionBriefStatus(to) : undefined,
    transitions: EXECUTION_BRIEF_TRANSITIONS,
  });

export const expandAppointmentStatusesForQuery = (status: string) => {
  const normalized = APPOINTMENT_STATUS_ALIASES[status as AppointmentStatus];
  if (normalized === "scheduled" || status === "scheduled") {
    return ["scheduled", "confirmed", "rescheduled"];
  }

  return [status];
};

export const expandQuotationStatusesForQuery = (status: string) => {
  if (status === "superseded" || status === "converted_to_contract") {
    return ["superseded", "converted_to_contract"];
  }

  return [status];
};

export const expandExecutionBriefStatusesForQuery = (status: string) => {
  if (status === "handed_off" || status === "handed_to_executor") {
    return ["handed_off", "handed_to_executor"];
  }

  return [status];
};

export const isContractTerminalForEdits = (status: ContractStatus) => {
  const normalized = normalizeContractStatus(status);
  return normalized === "signed" || normalized === "active" || normalized === "completed";
};

export const isEventCancellableStatus = (status: EventStatus) =>
  CANCELLABLE_EVENT_STATUSES.has(normalizeEventStatus(status));

export const isSupportedContractStatus = (status: string): status is ContractStatus =>
  (CONTRACT_STATUSES as readonly string[]).includes(status);
