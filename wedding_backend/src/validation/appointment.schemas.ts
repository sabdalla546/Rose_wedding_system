import { z } from "zod";

export const appointmentStatusEnum = z.enum([
  "scheduled",
  "confirmed",
  "completed",
  "rescheduled",
  "cancelled",
  "no_show",
]);

export const appointmentMeetingTypeEnum = z.enum([
  "office_visit",
  "phone_call",
  "video_call",
  "venue_visit",
]);

export const createAppointmentSchema = z.object({
  leadId: z.number().int().positive(),
  appointmentDate: z.string().min(1),
  appointmentStartTime: z.string().min(1).max(10),
  appointmentEndTime: z.string().max(10).optional(),
  status: appointmentStatusEnum.optional(),
  meetingType: appointmentMeetingTypeEnum.optional(),
  assignedToUserId: z.number().int().positive().optional().nullable(),
  notes: z.string().optional(),
  result: z.string().optional(),
  nextStep: z.string().max(255).optional(),
});

export const updateAppointmentSchema = z.object({
  appointmentDate: z.string().optional(),
  appointmentStartTime: z.string().max(10).optional(),
  appointmentEndTime: z.string().max(10).optional().nullable(),
  status: appointmentStatusEnum.optional(),
  meetingType: appointmentMeetingTypeEnum.optional(),
  assignedToUserId: z.number().int().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
  result: z.string().optional().nullable(),
  nextStep: z.string().max(255).optional().nullable(),
});

export const createAppointmentWithLeadSchema = z.object({
  lead: z.object({
    fullName: z.string().min(2).max(150),
    mobile: z.string().min(3).max(30),
    mobile2: z.string().max(30).optional(),
    email: z.string().email().optional(),
    weddingDate: z.string().min(1),
    guestCount: z.number().int().positive().optional(),
    venueId: z.number().int().positive().optional().nullable(),
    venueNameSnapshot: z.string().max(150).optional(),
    source: z.string().max(100).optional(),
    notes: z.string().optional(),
  }),
  appointment: z.object({
    appointmentDate: z.string().min(1),
    appointmentStartTime: z.string().min(1).max(10),
    appointmentEndTime: z.string().max(10).optional(),
    meetingType: appointmentMeetingTypeEnum.optional(),
    assignedToUserId: z.number().int().positive().optional().nullable(),
    notes: z.string().optional(),
    result: z.string().optional(),
    nextStep: z.string().max(255).optional(),
  }),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
export type CreateAppointmentWithLeadInput = z.infer<
  typeof createAppointmentWithLeadSchema
>;
