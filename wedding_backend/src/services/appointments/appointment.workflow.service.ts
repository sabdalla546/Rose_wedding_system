import type { Transaction } from "sequelize";
import { Appointment } from "../../models";
import type { AppointmentStatus } from "../../models/appointment.model";
import { recordWorkflowTransition } from "../workflow/workflow.audit";
import { WorkflowDomainError } from "../workflow/workflow.errors";
import {
  assertValidAppointmentTransition,
  normalizeAppointmentStatus,
} from "../workflow/workflow.status";

type AppointmentStatusActionInput = {
  appointment: Appointment;
  nextStatus: AppointmentStatus;
  actionName: string;
  userId: number | null;
  note?: string | null;
  reason?: string | null;
  updates?: Partial<{
    appointmentDate: string;
    startTime: string;
    endTime: string | null;
    notes: string | null;
  }>;
  transaction?: Transaction;
};

export const loadAppointmentForWorkflow = async (
  id: number,
  transaction?: Transaction,
) => {
  const appointment = await Appointment.findByPk(id, { transaction });
  if (!appointment) {
    throw new WorkflowDomainError("Appointment not found", 404);
  }

  return appointment;
};

const applyAppointmentStatusAction = async ({
  appointment,
  nextStatus,
  actionName,
  userId,
  note = null,
  reason = null,
  updates,
  transaction,
}: AppointmentStatusActionInput) => {
  const previousStatus = appointment.status;
  assertValidAppointmentTransition(previousStatus, nextStatus);

  await appointment.update(
    {
      ...updates,
      status: nextStatus,
      updatedBy: userId,
    },
    { transaction },
  );

  recordWorkflowTransition({
    entityName: "appointment",
    entityId: appointment.id,
    previousStatus: normalizeAppointmentStatus(previousStatus),
    nextStatus: normalizeAppointmentStatus(nextStatus),
    actionName,
    changedBy: userId,
    note,
    reason,
    sourceRefs: {
      appointmentId: appointment.id,
    },
  });

  return appointment;
};

export const confirmAppointmentWorkflow = (
  appointment: Appointment,
  userId: number | null,
  note?: string | null,
) =>
  applyAppointmentStatusAction({
    appointment,
    nextStatus: "confirmed",
    actionName: "appointment.confirm",
    userId,
    note,
    updates: {
      notes: typeof note === "undefined" ? appointment.notes ?? null : note,
    },
  });

export const completeAppointmentWorkflow = (
  appointment: Appointment,
  userId: number | null,
  note?: string | null,
) =>
  applyAppointmentStatusAction({
    appointment,
    nextStatus: "completed",
    actionName: "appointment.complete",
    userId,
    note,
    updates: {
      notes: typeof note === "undefined" ? appointment.notes ?? null : note,
    },
  });

export const cancelAppointmentWorkflow = (
  appointment: Appointment,
  userId: number | null,
  reason?: string | null,
  note?: string | null,
) => {
  const mergedNote = [reason, note].filter(Boolean).join(" | ");

  return applyAppointmentStatusAction({
    appointment,
    nextStatus: "cancelled",
    actionName: "appointment.cancel",
    userId,
    note,
    reason,
    updates: {
      notes: mergedNote || appointment.notes || null,
    },
  });
};

export const markAppointmentNoShow = (
  appointment: Appointment,
  userId: number | null,
  note?: string | null,
) =>
  applyAppointmentStatusAction({
    appointment,
    nextStatus: "no_show",
    actionName: "appointment.mark_no_show",
    userId,
    note,
    updates: {
      notes: typeof note === "undefined" ? appointment.notes ?? null : note,
    },
  });

export const rescheduleAppointmentWorkflow = (
  appointment: Appointment,
  {
    appointmentDate,
    startTime,
    endTime,
    note,
    userId,
  }: {
    appointmentDate: string;
    startTime: string;
    endTime: string | null;
    note?: string | null;
    userId: number | null;
  },
) =>
  applyAppointmentStatusAction({
    appointment,
    nextStatus: "rescheduled",
    actionName: "appointment.reschedule",
    userId,
    note,
    updates: {
      appointmentDate,
      startTime,
      endTime,
      notes: typeof note === "undefined" ? appointment.notes ?? null : note,
    },
  });

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
}) =>
  applyAppointmentStatusAction({
    appointment,
    nextStatus: "converted",
    actionName: "appointment.convert",
    userId,
    note,
    transaction,
  });
