import { z } from "zod";

export const customerStatusEnum = z.enum(["active", "inactive"]);

const normalizeOptionalNullableString = (value: unknown) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
};

const optionalNullableShortString = z.preprocess(
  normalizeOptionalNullableString,
  z.string().max(30).nullable().optional(),
);

const optionalNullableEmail = z.preprocess(
  normalizeOptionalNullableString,
  z.string().email().nullable().optional(),
);

export const optionalNullableNationalId = z.preprocess(
  normalizeOptionalNullableString,
  z
    .string()
    .regex(/^\d{12}$/, "National ID must be exactly 12 digits")
    .nullable()
    .optional(),
);

export const optionalNullableAddress = z.preprocess(
  normalizeOptionalNullableString,
  z.string().max(255).nullable().optional(),
);

export const createCustomerSchema = z.object({
  fullName: z.string().trim().min(2).max(150),
  mobile: z.string().trim().min(3).max(30),
  mobile2: optionalNullableShortString,
  email: optionalNullableEmail,
  nationalId: optionalNullableNationalId,
  address: optionalNullableAddress,
  notes: z.string().optional().nullable(),
  status: customerStatusEnum.optional(),
});

export const updateCustomerSchema = z.object({
  fullName: z.string().trim().min(2).max(150).optional(),
  mobile: z.string().trim().min(3).max(30).optional(),
  mobile2: optionalNullableShortString,
  email: optionalNullableEmail,
  nationalId: optionalNullableNationalId,
  address: optionalNullableAddress,
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
      nationalId: optionalNullableNationalId,
      address: optionalNullableAddress,
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
