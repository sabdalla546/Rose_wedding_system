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
  customerId: z.number().int().positive(),
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

const appointmentCustomerPayloadSchema = z.object({
  fullName: z.string().min(2).max(150),
  mobile: z.string().min(3).max(30),
  mobile2: z.string().max(30).optional().nullable(),
  email: z.string().email().optional().nullable(),
  groomName: z.string().max(150).optional().nullable(),
  brideName: z.string().max(150).optional().nullable(),
  weddingDate: z.string().min(1).optional().nullable(),
  guestCount: z.number().int().positive().optional().nullable(),
  venueId: z.number().int().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const createAppointmentWithCustomerSchema = z
  .object({
    customerId: z.number().int().positive().optional(),
    customer: appointmentCustomerPayloadSchema.optional(),
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
  })
  .refine((data) => Boolean(data.customerId || data.customer), {
    message: "Either customerId or customer is required",
    path: ["customerId"],
  });

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
export type CreateAppointmentWithCustomerInput = z.infer<
  typeof createAppointmentWithCustomerSchema
>;
