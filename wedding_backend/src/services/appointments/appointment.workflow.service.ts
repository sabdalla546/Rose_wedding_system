import { Transaction } from "sequelize";
import { sequelize } from "../../config/database";
import { Appointment, Event } from "../../models";
import {
  appointmentAlreadyConvertedError,
  appointmentEventAlreadyExistsError,
} from "../workflow/workflow.errors";
import {
  recordWorkflowAction,
  recordWorkflowBlock,
  recordWorkflowTransition,
} from "../workflow/workflow.audit";
import { assertValidAppointmentTransition } from "../workflow/workflow.status";

const normalizeOptionalText = (value?: string | null) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
};

export const confirmAppointmentWorkflow = async (
  appointment: Appointment,
  userId: number | null,
  note?: string | null,
  transaction?: Transaction,
) => {
  const ownsTransaction = !transaction;
  const activeTransaction = transaction ?? (await sequelize.transaction());

  try {
    const previousStatus = appointment.status;
    assertValidAppointmentTransition(previousStatus, "reserved");

    await appointment.update(
      {
        status: "reserved",
        updatedBy: userId,
        notes: normalizeOptionalText(note) ?? appointment.notes ?? null,
      },
      { transaction: activeTransaction },
    );

    recordWorkflowTransition({
      entityName: "appointment",
      entityId: appointment.id,
      previousStatus,
      nextStatus: "reserved",
      actionName: "appointment.confirmed",
      changedBy: userId,
      note: normalizeOptionalText(note),
      sourceRefs: {
        appointmentId: appointment.id,
      },
    });

    if (ownsTransaction) {
      await activeTransaction.commit();
    }

    return appointment;
  } catch (error) {
    if (ownsTransaction) {
      await activeTransaction.rollback();
    }
    throw error;
  }
};

export const markAppointmentConverted = async ({
  appointment,
  userId,
  note,
  transaction,
}: {
  appointment: Appointment;
  userId: number | null;
  note?: string | null;
  transaction?: Transaction;
}) => {
  const previousStatus = appointment.status;
  assertValidAppointmentTransition(previousStatus, "converted");

  await appointment.update(
    {
      status: "converted",
      updatedBy: userId,
    },
    { transaction },
  );

  recordWorkflowTransition({
    entityName: "appointment",
    entityId: appointment.id,
    previousStatus,
    nextStatus: "converted",
    actionName: "appointment.converted",
    changedBy: userId,
    note: normalizeOptionalText(note),
    sourceRefs: {
      appointmentId: appointment.id,
      sourceAppointmentId: appointment.id,
    },
  });

  return appointment;
};

export const attendAppointmentWorkflow = async (
  appointment: Appointment,
  userId: number | null,
  note?: string | null,
) => {
  const transaction = await sequelize.transaction();

  try {
    if (appointment.status === "converted") {
      recordWorkflowBlock({
        entityName: "appointment",
        entityId: appointment.id,
        currentStatus: appointment.status,
        attemptedBy: userId,
        message: "Appointment already converted",
        actionName: "appointment.attend.blocked",
        sourceRefs: {
          appointmentId: appointment.id,
        },
      });

      throw appointmentAlreadyConvertedError();
    }

    const existingEvent = await Event.findOne({
      where: { sourceAppointmentId: appointment.id },
      transaction,
    });

    if (existingEvent) {
      recordWorkflowBlock({
        entityName: "appointment",
        entityId: appointment.id,
        currentStatus: appointment.status,
        attemptedBy: userId,
        message: "An event already exists for this appointment",
        actionName: "appointment.attend.blocked",
        sourceRefs: {
          appointmentId: appointment.id,
          eventId: existingEvent.id,
          sourceAppointmentId: appointment.id,
        },
      });

      throw appointmentEventAlreadyExistsError();
    }

    const previousStatus = appointment.status;
    assertValidAppointmentTransition(previousStatus, "attended");

    await appointment.update(
      {
        status: "attended",
        updatedBy: userId,
        notes: normalizeOptionalText(note) ?? appointment.notes ?? null,
      },
      { transaction },
    );

    recordWorkflowTransition({
      entityName: "appointment",
      entityId: appointment.id,
      previousStatus,
      nextStatus: "attended",
      actionName: "appointment.attended",
      changedBy: userId,
      note: normalizeOptionalText(note),
      sourceRefs: {
        appointmentId: appointment.id,
      },
    });

    const createdEvent = await Event.create(
      {
        customerId: appointment.customerId,
        sourceAppointmentId: appointment.id,
        eventDate: appointment.weddingDate ?? appointment.appointmentDate,
        guestCount: appointment.guestCount ?? null,
        venueId: appointment.venueId ?? null,
        notes: appointment.notes ?? normalizeOptionalText(note),
        status: "draft",
        createdBy: userId,
        updatedBy: userId,
      },
      { transaction },
    );

    recordWorkflowAction({
      entityName: "event",
      entityId: createdEvent.id,
      actionName: "event.created_from_appointment",
      actorId: userId,
      note: "Event draft created automatically when appointment was attended",
      sourceRefs: {
        appointmentId: appointment.id,
        sourceAppointmentId: appointment.id,
        eventId: createdEvent.id,
      },
      metadata: {
        trigger: "appointment.attended",
      },
    });

    await markAppointmentConverted({
      appointment,
      userId,
      note: "Appointment converted automatically after creating event draft",
      transaction,
    });

    recordWorkflowAction({
      entityName: "appointment",
      entityId: appointment.id,
      actionName: "appointment.attended_and_converted",
      actorId: userId,
      note: `Created event #${createdEvent.id} automatically from attended appointment`,
      sourceRefs: {
        appointmentId: appointment.id,
        sourceAppointmentId: appointment.id,
        eventId: createdEvent.id,
      },
      metadata: {
        eventId: createdEvent.id,
      },
    });

    await transaction.commit();

    return {
      appointment,
      event: createdEvent,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const completeAppointmentWorkflow = attendAppointmentWorkflow;

export const cancelAppointmentWorkflow = async (
  appointment: Appointment,
  userId: number | null,
  reason?: string | null,
  note?: string | null,
  transaction?: Transaction,
) => {
  const ownsTransaction = !transaction;
  const activeTransaction = transaction ?? (await sequelize.transaction());

  try {
    const previousStatus = appointment.status;
    assertValidAppointmentTransition(previousStatus, "cancelled");

    await appointment.update(
      {
        status: "cancelled",
        updatedBy: userId,
        notes: normalizeOptionalText(note) ?? appointment.notes ?? null,
      },
      { transaction: activeTransaction },
    );

    recordWorkflowTransition({
      entityName: "appointment",
      entityId: appointment.id,
      previousStatus,
      nextStatus: "cancelled",
      actionName: "appointment.cancelled",
      changedBy: userId,
      note: normalizeOptionalText(note),
      reason: normalizeOptionalText(reason),
      sourceRefs: {
        appointmentId: appointment.id,
      },
    });

    if (ownsTransaction) {
      await activeTransaction.commit();
    }

    return appointment;
  } catch (error) {
    if (ownsTransaction) {
      await activeTransaction.rollback();
    }
    throw error;
  }
};

export const rescheduleAppointmentWorkflow = async (
  appointment: Appointment,
  {
    appointmentDate,
    startTime,
    endTime,
    note,
    userId,
    transaction,
  }: {
    appointmentDate: string;
    startTime: string;
    endTime?: string | null;
    note?: string | null;
    userId: number | null;
    transaction?: Transaction;
  },
) => {
  const ownsTransaction = !transaction;
  const activeTransaction = transaction ?? (await sequelize.transaction());

  try {
    await appointment.update(
      {
        appointmentDate,
        startTime,
        endTime: endTime ?? null,
        status: "reserved",
        updatedBy: userId,
        notes: normalizeOptionalText(note) ?? appointment.notes ?? null,
      },
      { transaction: activeTransaction },
    );

    recordWorkflowAction({
      entityName: "appointment",
      entityId: appointment.id,
      actionName: "appointment.rescheduled",
      actorId: userId,
      note: normalizeOptionalText(note),
      sourceRefs: {
        appointmentId: appointment.id,
      },
      metadata: {
        appointmentDate,
        startTime,
        endTime: endTime ?? null,
      },
    });

    if (ownsTransaction) {
      await activeTransaction.commit();
    }

    return appointment;
  } catch (error) {
    if (ownsTransaction) {
      await activeTransaction.rollback();
    }
    throw error;
  }
};

export const markAppointmentNoShow = async (
  appointment: Appointment,
  userId: number | null,
  note?: string | null,
  transaction?: Transaction,
) => {
  const ownsTransaction = !transaction;
  const activeTransaction = transaction ?? (await sequelize.transaction());

  try {
    const previousStatus = appointment.status;
    assertValidAppointmentTransition(previousStatus, "no_show");

    await appointment.update(
      {
        status: "no_show",
        updatedBy: userId,
        notes: normalizeOptionalText(note) ?? appointment.notes ?? null,
      },
      { transaction: activeTransaction },
    );

    recordWorkflowTransition({
      entityName: "appointment",
      entityId: appointment.id,
      previousStatus,
      nextStatus: "no_show",
      actionName: "appointment.no_show",
      changedBy: userId,
      note: normalizeOptionalText(note),
      sourceRefs: {
        appointmentId: appointment.id,
      },
    });

    if (ownsTransaction) {
      await activeTransaction.commit();
    }

    return appointment;
  } catch (error) {
    if (ownsTransaction) {
      await activeTransaction.rollback();
    }
    throw error;
  }
};
