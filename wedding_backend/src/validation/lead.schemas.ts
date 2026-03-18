import { z } from "zod";

export const leadStatusEnum = z.enum([
  "new",
  "contacted",
  "appointment_scheduled",
  "appointment_completed",
  "quotation_sent",
  "contract_pending",
  "converted",
  "lost",
  "cancelled",
]);

const optionalName = z.string().trim().min(2).max(150).optional();
const optionalNullableName = z
  .string()
  .trim()
  .min(2)
  .max(150)
  .optional()
  .nullable();

export const createLeadSchema = z.object({
  fullName: z.string().min(2).max(150),
  mobile: z.string().min(3).max(30),
  mobile2: z.string().max(30).optional(),
  email: z.string().email().optional(),

  groomName: optionalName,
  brideName: optionalName,

  weddingDate: z.string().min(1),
  guestCount: z.number().int().positive().optional(),
  venueId: z.number().int().positive().optional().nullable(),
  venueNameSnapshot: z.string().max(150).optional(),
  source: z.string().max(100).optional(),
  status: leadStatusEnum.optional(),
  notes: z.string().optional(),
});

export const updateLeadSchema = z.object({
  fullName: z.string().min(2).max(150).optional(),
  mobile: z.string().min(3).max(30).optional(),
  mobile2: z.string().max(30).optional(),
  email: z.string().email().optional().nullable(),

  groomName: optionalNullableName,
  brideName: optionalNullableName,

  weddingDate: z.string().optional(),
  guestCount: z.number().int().positive().optional().nullable(),
  venueId: z.number().int().positive().optional().nullable(),
  venueNameSnapshot: z.string().max(150).optional().nullable(),
  source: z.string().max(100).optional().nullable(),
  status: leadStatusEnum.optional(),
  notes: z.string().optional().nullable(),
  convertedToCustomer: z.boolean().optional(),
  convertedCustomerId: z.number().int().positive().optional().nullable(),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
