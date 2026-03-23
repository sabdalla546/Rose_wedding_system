import { z } from "zod";

export const customerStatusEnum = z.enum(["active", "inactive"]);

const optionalNullableShortString = z.string().trim().max(30).nullable().optional();
const optionalNullableEmail = z.string().trim().email().nullable().optional();

export const createCustomerSchema = z.object({
  fullName: z.string().trim().min(2).max(150),
  mobile: z.string().trim().min(3).max(30),
  mobile2: optionalNullableShortString,
  email: optionalNullableEmail,
  notes: z.string().optional().nullable(),
  status: customerStatusEnum.optional(),
});

export const updateCustomerSchema = z.object({
  fullName: z.string().trim().min(2).max(150).optional(),
  mobile: z.string().trim().min(3).max(30).optional(),
  mobile2: optionalNullableShortString,
  email: optionalNullableEmail,
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
