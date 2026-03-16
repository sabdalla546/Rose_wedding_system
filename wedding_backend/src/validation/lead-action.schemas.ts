import { z } from "zod";

export const markLeadLostSchema = z.object({
  notes: z.string().optional(),
  reason: z.string().max(255).optional(),
});

export const convertLeadToCustomerSchema = z.object({
  convertedCustomerId: z.number().int().positive().optional().nullable(),
  notes: z.string().optional(),
});

export type MarkLeadLostInput = z.infer<typeof markLeadLostSchema>;
export type ConvertLeadToCustomerInput = z.infer<
  typeof convertLeadToCustomerSchema
>;
