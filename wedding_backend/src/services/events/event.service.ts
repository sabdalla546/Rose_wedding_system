import { Op, Transaction } from "sequelize";
import { sequelize } from "../../config/database";
import { Appointment, Customer, Event, User, Venue } from "../../models";
import type { EventStatus } from "../../models/event.model";
import {
  ACTIVE_EVENT_STATUSES,
  TERMINAL_APPOINTMENT_STATUSES,
} from "../../constants/workflow-statuses";
import { markAppointmentConverted } from "../appointments/appointment.workflow.service";
import {
  recordWorkflowAction,
  recordWorkflowBlock,
  recordWorkflowTransition,
} from "../workflow/workflow.audit";
import {
  appointmentAlreadyConvertedError,
  invalidStatusTransitionError,
  WorkflowDomainError,
} from "../workflow/workflow.errors";
import {
  EVENT_TRANSITIONS,
  assertValidEventTransition,
  normalizeAppointmentStatus,
  normalizeEventStatus,
  resolveTransitionPath,
} from "../workflow/workflow.status";

export const eventInclude: any[] = [
  { model: Customer, as: "customer" },
  { model: Venue, as: "venue" },
  {
    model: Appointment,
    as: "sourceAppointment",
    include: [
      { model: Customer, as: "customer" },
      { model: Venue, as: "venue" },
    ],
  },
  { model: User, as: "createdByUser", attributes: ["id", "fullName"] },
  { model: User, as: "updatedByUser", attributes: ["id", "fullName"] },
];

export const normalizeNullableString = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

export const getSourceAppointmentDefaults = async (
  sourceAppointmentId?: number | null,
  transaction?: Transaction,
) => {
  if (!sourceAppointmentId) {
    return null;
  }

  return Appointment.findByPk(sourceAppointmentId, {
    transaction,
    include: [
      { model: Customer, as: "customer" },
      { model: Venue, as: "venue" },
    ],
  });
};

export const assertAppointmentCanConvertToEvent = async (
  sourceAppointmentId: number,
  excludeEventId?: number,
  transaction?: Transaction,
) => {
  const appointment = await getSourceAppointmentDefaults(
    sourceAppointmentId,
    transaction,
  );

  if (!appointment) {
    throw new WorkflowDomainError("Source appointment not found", 404);
  }

  const normalizedAppointmentStatus = normalizeAppointmentStatus(
    appointment.status,
  );

  if (TERMINAL_APPOINTMENT_STATUSES.has(normalizedAppointmentStatus)) {
    recordWorkflowBlock({
      entityName: "appointment",
      entityId: appointment.id,
      actionName: "appointment.convert_to_event",
      currentStatus: normalizedAppointmentStatus,
      attemptedBy: null,
      message: "Invalid appointment status transition",
      metadata: {
        sourceAppointmentId,
      },
      sourceRefs: {
        appointmentId: appointment.id,
        sourceAppointmentId: appointment.id,
      },
    });

    throw invalidStatusTransitionError(
      "Appointment cannot be converted from a terminal status",
    );
  }

  if (normalizedAppointmentStatus !== "attended") {
    recordWorkflowBlock({
      entityName: "appointment",
      entityId: appointment.id,
      actionName: "appointment.convert_to_event",
      currentStatus: normalizedAppointmentStatus,
      attemptedBy: null,
      message: "Invalid appointment status transition",
      metadata: {
        sourceAppointmentId,
        expectedStatus: "attended",
      },
      sourceRefs: {
        appointmentId: appointment.id,
        sourceAppointmentId: appointment.id,
      },
    });

    throw invalidStatusTransitionError(
      "Appointment must be attended before converting to event",
    );
  }

  const existingEvent = await Event.findOne({
    transaction,
    where: {
      sourceAppointmentId,
      ...(excludeEventId
        ? {
            id: {
              [Op.ne]: excludeEventId,
            },
          }
        : {}),
    },
  });

  if (existingEvent) {
    recordWorkflowBlock({
      entityName: "appointment",
      entityId: appointment.id,
      actionName: "appointment.convert_to_event",
      currentStatus: normalizedAppointmentStatus,
      attemptedBy: null,
      message: "Appointment already converted",
      metadata: {
        sourceAppointmentId,
        existingEventId: existingEvent.id,
      },
      sourceRefs: {
        appointmentId: appointment.id,
        sourceAppointmentId: appointment.id,
        eventId: existingEvent.id,
      },
    });

    throw appointmentAlreadyConvertedError();
  }

  return appointment;
};

export const findActiveEventBySourceAppointment = async (
  sourceAppointmentId: number,
  excludeEventId?: number,
) =>
  Event.findOne({
    where: {
      sourceAppointmentId,
      ...(excludeEventId
        ? {
            id: {
              [Op.ne]: excludeEventId,
            },
          }
        : {}),
      status: {
        [Op.in]: ACTIVE_EVENT_STATUSES,
      },
    },
  });

export const assertEventStatusTransition = (
  currentStatus: Event["status"],
  nextStatus?: Event["status"] | null,
) => assertValidEventTransition(currentStatus, nextStatus ?? undefined);

export const listEventsPage = async ({
  page,
  limit,
  status,
  customerId,
  venueId,
  dateFrom,
  dateTo,
  search,
}: {
  page: number;
  limit: number;
  status?: string;
  customerId?: number;
  venueId?: number;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}) => {
  const where: any = {};

  if (status) where.status = status;
  if (customerId) where.customerId = customerId;
  if (venueId) where.venueId = venueId;

  if (dateFrom || dateTo) {
    where.eventDate = {};
    if (dateFrom) where.eventDate[Op.gte] = dateFrom;
    if (dateTo) where.eventDate[Op.lte] = dateTo;
  }

  if (search) {
    const like = `%${search}%`;
    where[Op.or] = [
      { title: { [Op.like]: like } },
      { groomName: { [Op.like]: like } },
      { brideName: { [Op.like]: like } },
      { venueNameSnapshot: { [Op.like]: like } },
      { "$customer.fullName$": { [Op.like]: like } },
    ];
  }

  return Event.findAndCountAll({
    where,
    include: [
      { model: Customer, as: "customer" },
      { model: Venue, as: "venue" },
      { model: User, as: "createdByUser", attributes: ["id", "fullName"] },
      { model: User, as: "updatedByUser", attributes: ["id", "fullName"] },
    ],
    order: [
      ["eventDate", "ASC"],
      ["id", "DESC"],
    ],
    limit,
    offset: (page - 1) * limit,
  });
};

export const loadEventById = async (id: number) =>
  Event.findByPk(id, {
    include: eventInclude,
  });

type EventStatusActionInput = {
  event: Event;
  nextStatus: EventStatus;
  actionName: string;
  userId: number | null;
  note?: string | null;
  reason?: string | null;
  transaction?: Transaction;
};

const applyEventStatusAction = async ({
  event,
  nextStatus,
  actionName,
  userId,
  note = null,
  reason = null,
  transaction,
}: EventStatusActionInput) => {
  const previousStatus = event.status;
  assertValidEventTransition(previousStatus, nextStatus);

  await event.update(
    {
      status: nextStatus,
      updatedBy: userId,
    },
    { transaction },
  );

  recordWorkflowTransition({
    entityName: "event",
    entityId: event.id,
    previousStatus: normalizeEventStatus(previousStatus),
    nextStatus: normalizeEventStatus(nextStatus),
    actionName,
    changedBy: userId,
    note,
    reason,
    sourceRefs: {
      sourceAppointmentId: event.sourceAppointmentId ?? null,
      eventId: event.id,
    },
  });

  return event;
};

export const moveEventToDesigning = (
  event: Event,
  userId: number | null,
  note?: string | null,
  transaction?: Transaction,
) =>
  applyEventStatusAction({
    event,
    nextStatus: "designing",
    actionName: "event.move_to_designing",
    userId,
    note,
    transaction,
  });

export const markEventAsQuotationPending = (
  event: Event,
  userId: number | null,
  note?: string | null,
  transaction?: Transaction,
) =>
  applyEventStatusAction({
    event,
    nextStatus: "quotation_pending",
    actionName: "event.mark_quotation_pending",
    userId,
    note,
    transaction,
  });

export const markEventAsQuoted = (
  event: Event,
  userId: number | null,
  note?: string | null,
  transaction?: Transaction,
) =>
  applyEventStatusAction({
    event,
    nextStatus: "quoted",
    actionName: "event.mark_quoted",
    userId,
    note,
    transaction,
  });

export const confirmEvent = (
  event: Event,
  userId: number | null,
  note?: string | null,
  transaction?: Transaction,
) =>
  applyEventStatusAction({
    event,
    nextStatus: "confirmed",
    actionName: "event.confirm",
    userId,
    note,
    transaction,
  });

export const startEventExecution = (
  event: Event,
  userId: number | null,
  note?: string | null,
  transaction?: Transaction,
) =>
  applyEventStatusAction({
    event,
    nextStatus: "in_progress",
    actionName: "event.start_execution",
    userId,
    note,
    transaction,
  });

export const completeEventWorkflow = (
  event: Event,
  userId: number | null,
  note?: string | null,
  transaction?: Transaction,
) =>
  applyEventStatusAction({
    event,
    nextStatus: "completed",
    actionName: "event.complete",
    userId,
    note,
    transaction,
  });

export const cancelEvent = (
  event: Event,
  userId: number | null,
  reason?: string | null,
  note?: string | null,
  transaction?: Transaction,
) =>
  applyEventStatusAction({
    event,
    nextStatus: "cancelled",
    actionName: "event.cancel",
    userId,
    note,
    reason,
    transaction,
  });

export const transitionEventToStatus = async ({
  event,
  targetStatus,
  userId,
  note,
  reason,
  transaction,
}: {
  event: Event;
  targetStatus: EventStatus;
  userId: number | null;
  note?: string | null;
  reason?: string | null;
  transaction?: Transaction;
}) => {
  const path = resolveTransitionPath(
    EVENT_TRANSITIONS,
    normalizeEventStatus(event.status),
    normalizeEventStatus(targetStatus),
  );

  for (const nextStatus of path) {
    if (nextStatus === "designing") {
      await moveEventToDesigning(event, userId, note, transaction);
      continue;
    }

    if (nextStatus === "quotation_pending") {
      await markEventAsQuotationPending(event, userId, note, transaction);
      continue;
    }

    if (nextStatus === "quoted") {
      await markEventAsQuoted(event, userId, note, transaction);
      continue;
    }

    if (nextStatus === "confirmed") {
      await confirmEvent(event, userId, note, transaction);
      continue;
    }

    if (nextStatus === "in_progress") {
      await startEventExecution(event, userId, note, transaction);
      continue;
    }

    if (nextStatus === "completed") {
      await completeEventWorkflow(event, userId, note, transaction);
      continue;
    }

    if (nextStatus === "cancelled") {
      await cancelEvent(event, userId, reason, note, transaction);
    }
  }

  return event;
};

export const convertAppointmentToEvent = async ({
  sourceAppointmentId,
  customerId,
  title,
  eventDate,
  venueId,
  venueNameSnapshot,
  groomName,
  brideName,
  guestCount,
  notes,
  status = "draft",
  userId,
}: {
  sourceAppointmentId: number;
  customerId: number;
  title?: string | null;
  eventDate: string;
  venueId?: number | null;
  venueNameSnapshot?: string | null;
  groomName?: string | null;
  brideName?: string | null;
  guestCount?: number | null;
  notes?: string | null;
  status?: EventStatus;
  userId: number | null;
}) =>
  sequelize.transaction(async (transaction) => {
    const appointment = await assertAppointmentCanConvertToEvent(
      sourceAppointmentId,
      undefined,
      transaction,
    );

    const event = await Event.create(
      {
        customerId,
        sourceAppointmentId,
        title: title ?? null,
        eventDate,
        venueId: venueId ?? null,
        venueNameSnapshot: venueNameSnapshot ?? null,
        groomName: groomName ?? null,
        brideName: brideName ?? null,
        guestCount: guestCount ?? null,
        notes: notes ?? null,
        status: "draft",
        createdBy: userId,
        updatedBy: userId,
      },
      { transaction },
    );

    await markAppointmentConverted({
      appointment,
      userId,
      note: `Converted to event #${event.id}`,
      transaction,
    });

    recordWorkflowAction({
      entityName: "appointment",
      entityId: appointment.id,
      actionName: "appointment.converted_to_event",
      actorId: userId,
      note: `Created event #${event.id} from appointment conversion`,
      sourceRefs: {
        appointmentId: appointment.id,
        sourceAppointmentId: appointment.id,
        eventId: event.id,
      },
      metadata: {
        eventStatus: status,
        customerId,
      },
    });

    if (status !== "draft") {
      await transitionEventToStatus({
        event,
        targetStatus: status,
        userId,
        transaction,
      });
    }

    return loadEventById(event.id);
  });
