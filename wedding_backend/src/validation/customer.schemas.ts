import { z } from "zod";

export const customerStatusEnum = z.enum(["active", "inactive"]);

const optionalName = z.string().trim().min(2).max(150).optional();
const optionalNullableName = z
  .string()
  .trim()
  .min(2)
  .max(150)
  .nullable()
  .optional();

const optionalNullableShortString = z.string().trim().max(30).nullable().optional();
const optionalNullableEmail = z.string().trim().email().nullable().optional();
const optionalNullableMediumString = z.string().trim().max(150).nullable().optional();

export const createCustomerSchema = z.object({
  fullName: z.string().trim().min(2).max(150),
  mobile: z.string().trim().min(3).max(30),
  mobile2: optionalNullableShortString,
  email: optionalNullableEmail,
  groomName: optionalName,
  brideName: optionalName,
  weddingDate: z.string().optional().nullable(),
  guestCount: z.number().int().positive().optional().nullable(),
  venueId: z.number().int().positive().optional().nullable(),
  venueNameSnapshot: optionalNullableMediumString,
  sourceLeadId: z.number().int().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: customerStatusEnum.optional(),
});

export const updateCustomerSchema = z.object({
  fullName: z.string().trim().min(2).max(150).optional(),
  mobile: z.string().trim().min(3).max(30).optional(),
  mobile2: optionalNullableShortString,
  email: optionalNullableEmail,
  groomName: optionalNullableName,
  brideName: optionalNullableName,
  weddingDate: z.string().optional().nullable(),
  guestCount: z.number().int().positive().optional().nullable(),
  venueId: z.number().int().positive().optional().nullable(),
  venueNameSnapshot: optionalNullableMediumString,
  notes: z.string().optional().nullable(),
  status: customerStatusEnum.optional(),
});

export const convertLeadToCustomerRealSchema = z.object({
  notes: z.string().optional(),
  customer: z
    .object({
      fullName: z.string().trim().min(2).max(150).optional(),
      mobile: z.string().trim().min(3).max(30).optional(),
      mobile2: optionalNullableShortString,
      email: optionalNullableEmail,
      groomName: optionalNullableName,
      brideName: optionalNullableName,
      weddingDate: z.string().optional().nullable(),
      guestCount: z.number().int().positive().optional().nullable(),
      venueId: z.number().int().positive().optional().nullable(),
      venueNameSnapshot: optionalNullableMediumString,
      notes: z.string().optional().nullable(),
      status: customerStatusEnum.optional(),
    })
    .optional(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type ConvertLeadToCustomerRealInput = z.infer<
  typeof convertLeadToCustomerRealSchema
>;