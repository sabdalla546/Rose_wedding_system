import { z } from "zod";

export const appointmentStatusEnum = z.enum([
  "scheduled",
  "confirmed",
  "completed",
  "rescheduled",
  "cancelled",
  "no_show",
]);

export const appointmentTypeEnum = z.enum([
  "office_visit",
  "phone_call",
  "video_call",
  "venue_visit",
]);

const optionalNullableShortString = z.string().trim().max(30).nullable().optional();
const optionalNullableEmail = z.string().trim().email().nullable().optional();

export const createAppointmentSchema = z.object({
  customerId: z.number().int().positive(),
  appointmentDate: z.string().min(1),
  startTime: z.string().min(1).max(10),
  endTime: z.string().max(10).optional().nullable(),
  type: appointmentTypeEnum.optional(),
  notes: z.string().optional().nullable(),
  status: appointmentStatusEnum.optional(),
});

export const updateAppointmentSchema = z.object({
  customerId: z.number().int().positive().optional(),
  appointmentDate: z.string().optional(),
  startTime: z.string().max(10).optional(),
  endTime: z.string().max(10).optional().nullable(),
  type: appointmentTypeEnum.optional(),
  notes: z.string().optional().nullable(),
  status: appointmentStatusEnum.optional(),
});

const appointmentCustomerPayloadSchema = z.object({
  fullName: z.string().trim().min(2).max(150),
  mobile: z.string().trim().min(3).max(30),
  mobile2: optionalNullableShortString,
  email: optionalNullableEmail,
  notes: z.string().optional().nullable(),
});

export const createAppointmentWithCustomerSchema = z
  .object({
    customerId: z.number().int().positive().optional(),
    customer: appointmentCustomerPayloadSchema.optional(),
    appointment: z.object({
      appointmentDate: z.string().min(1),
      startTime: z.string().min(1).max(10),
      endTime: z.string().max(10).optional().nullable(),
      type: appointmentTypeEnum.optional(),
      notes: z.string().optional().nullable(),
      status: appointmentStatusEnum.optional(),
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
