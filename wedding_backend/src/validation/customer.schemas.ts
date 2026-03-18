import { z } from "zod";

export const customerStatusEnum = z.enum(["active", "inactive"]);
const optionalName = z.string().trim().min(2).max(150).optional();
const optionalNullableName = z
  .string()
  .trim()
  .min(2)
  .max(150)
  .optional()
  .nullable();

export const createCustomerSchema = z.object({
  fullName: z.string().min(2).max(150),
  mobile: z.string().min(3).max(30),
  mobile2: z.string().max(30).optional(),
  email: z.string().email().optional(),

  groomName: optionalName,
  brideName: optionalName,

  weddingDate: z.string().optional(),
  guestCount: z.number().int().positive().optional(),
  venueId: z.number().int().positive().optional().nullable(),
  venueNameSnapshot: z.string().max(150).optional(),
  sourceLeadId: z.number().int().positive().optional().nullable(),
  notes: z.string().optional(),
  status: customerStatusEnum.optional(),
});

export const updateCustomerSchema = z.object({
  fullName: z.string().min(2).max(150).optional(),
  mobile: z.string().min(3).max(30).optional(),
  mobile2: z.string().max(30).optional().nullable(),
  email: z.string().email().optional().nullable(),

  groomName: optionalNullableName,
  brideName: optionalNullableName,

  weddingDate: z.string().optional().nullable(),
  guestCount: z.number().int().positive().optional().nullable(),
  venueId: z.number().int().positive().optional().nullable(),
  venueNameSnapshot: z.string().max(150).optional().nullable(),
  notes: z.string().optional().nullable(),
  status: customerStatusEnum.optional(),
});

export const convertLeadToCustomerRealSchema = z.object({
  notes: z.string().optional(),
  customer: z
    .object({
      fullName: z.string().min(2).max(150).optional(),
      mobile: z.string().min(3).max(30).optional(),
      mobile2: z.string().max(30).optional().nullable(),
      email: z.string().email().optional().nullable(),

      groomName: optionalNullableName,
      brideName: optionalNullableName,

      weddingDate: z.string().optional().nullable(),
      guestCount: z.number().int().positive().optional().nullable(),
      venueId: z.number().int().positive().optional().nullable(),
      venueNameSnapshot: z.string().max(150).optional().nullable(),
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
