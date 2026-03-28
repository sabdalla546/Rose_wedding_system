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

export const appointmentTypePublicEnum = z.enum([
  "New Appointment 1",
  "New Appointment 2",
  "New Appointment 3",
  "Details Appointment 1",
  "Details Appointment 2",
  "Details Appointment 3",
  "Office Visit",
]);

// Accept both legacy DB codes and new public Arabic values.
export const appointmentTypeInputSchema = z.union([
  appointmentTypeEnum,
  appointmentTypePublicEnum,
]);

const optionalNullableShortString = z.string().trim().max(30).nullable().optional();
const optionalNullableEmail = z.string().trim().email().nullable().optional();
const optionalNullableDate = z.preprocess(
  (value) => {
    if (typeof value !== "string") {
      return value;
    }

    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  },
  z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid date")
    .nullable()
    .optional(),
);
const optionalNullableNonNegativeInt = z.preprocess(
  (value) => {
    if (value === "" || value === null || typeof value === "undefined") {
      return null;
    }

    return typeof value === "string" ? Number(value) : value;
  },
  z.number().int().min(0).nullable().optional(),
);
const optionalNullablePositiveInt = z.preprocess(
  (value) => {
    if (value === "" || value === null || typeof value === "undefined") {
      return null;
    }

    return typeof value === "string" ? Number(value) : value;
  },
  z.number().int().positive().nullable().optional(),
);
const optionalNullableNationalId = z
  .preprocess(
    (value) => {
      if (typeof value !== "string") {
        return value;
      }

      const trimmed = value.trim();
      return trimmed === "" ? null : trimmed;
    },
    z.string().regex(/^\d{12}$/).nullable().optional(),
  );
const optionalNullableAddress = z.preprocess(
  (value) => {
    if (typeof value !== "string") {
      return value;
    }

    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  },
  z.string().max(255).nullable().optional(),
);

export const createAppointmentSchema = z.object({
  customerId: z.number().int().positive(),
  appointmentDate: z.string().min(1),
  startTime: z.string().min(1).max(10),
  endTime: z.string().max(10).optional().nullable(),
  type: appointmentTypeInputSchema.optional(),
  weddingDate: optionalNullableDate,
  guestCount: optionalNullableNonNegativeInt,
  venueId: optionalNullablePositiveInt,
  notes: z.string().optional().nullable(),
  status: appointmentStatusEnum.optional(),
});

export const updateAppointmentSchema = z.object({
  customerId: z.number().int().positive().optional(),
  appointmentDate: z.string().optional(),
  startTime: z.string().max(10).optional(),
  endTime: z.string().max(10).optional().nullable(),
  type: appointmentTypeInputSchema.optional(),
  weddingDate: optionalNullableDate,
  guestCount: optionalNullableNonNegativeInt,
  venueId: optionalNullablePositiveInt,
  notes: z.string().optional().nullable(),
  status: appointmentStatusEnum.optional(),
});

const appointmentCustomerPayloadSchema = z.object({
  fullName: z.string().trim().min(2).max(150),
  mobile: z.string().trim().min(3).max(30),
  mobile2: optionalNullableShortString,
  email: optionalNullableEmail,
  nationalId: optionalNullableNationalId,
  address: optionalNullableAddress,
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
      type: appointmentTypeInputSchema.optional(),
      weddingDate: optionalNullableDate,
      guestCount: optionalNullableNonNegativeInt,
      venueId: optionalNullablePositiveInt,
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
