import { z } from "zod";

export const confirmAppointmentSchema = z.object({
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const attendAppointmentSchema = z.object({
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const cancelAppointmentSchema = z.object({
  reason: z.string().trim().max(1000).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const rescheduleAppointmentSchema = z.object({
  appointmentDate: z.string().trim().min(1),
  startTime: z.string().trim().min(1),
  endTime: z.string().trim().min(1).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});
