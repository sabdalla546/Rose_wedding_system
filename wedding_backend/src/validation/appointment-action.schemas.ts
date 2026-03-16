import { z } from "zod";

export const confirmAppointmentSchema = z.object({
  notes: z.string().optional(),
});

export const completeAppointmentSchema = z.object({
  result: z.string().optional(),
  notes: z.string().optional(),
  nextStep: z.string().max(255).optional(),
});

export const cancelAppointmentSchema = z.object({
  notes: z.string().optional(),
  reason: z.string().max(255).optional(),
});

export const rescheduleAppointmentSchema = z.object({
  appointmentDate: z.string().min(1),
  appointmentStartTime: z.string().min(1).max(10),
  appointmentEndTime: z.string().max(10).optional().nullable(),
  assignedToUserId: z.number().int().positive().optional().nullable(),
  notes: z.string().optional(),
  nextStep: z.string().max(255).optional(),
});

export type ConfirmAppointmentInput = z.infer<typeof confirmAppointmentSchema>;
export type CompleteAppointmentInput = z.infer<
  typeof completeAppointmentSchema
>;
export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>;
export type RescheduleAppointmentInput = z.infer<
  typeof rescheduleAppointmentSchema
>;
