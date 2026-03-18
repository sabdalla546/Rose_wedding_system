import { z } from "zod";

export const quotationStatusEnum = z.enum([
  "draft",
  "sent",
  "approved",
  "rejected",
  "expired",
  "converted_to_contract",
]);

export const quotationItemSchema = z.object({
  eventServiceId: z.number().int().positive().optional().nullable(),
  serviceId: z.number().int().positive().optional().nullable(),
  itemName: z.string().min(2).max(150),
  category: z.string().max(100).optional(),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  totalPrice: z.number().nonnegative().optional(),
  notes: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const createQuotationSchema = z.object({
  eventId: z.number().int().positive(),
  customerId: z.number().int().positive().optional().nullable(),
  leadId: z.number().int().positive().optional().nullable(),
  quotationNumber: z.string().max(100).optional(),
  issueDate: z.string().min(1),
  validUntil: z.string().optional(),
  discountAmount: z.number().nonnegative().optional(),
  notes: z.string().optional(),
  status: quotationStatusEnum.optional(),
  items: z.array(quotationItemSchema).min(1),
});

export const updateQuotationSchema = z.object({
  customerId: z.number().int().positive().optional().nullable(),
  leadId: z.number().int().positive().optional().nullable(),
  quotationNumber: z.string().max(100).optional().nullable(),
  issueDate: z.string().optional(),
  validUntil: z.string().optional().nullable(),
  discountAmount: z.number().nonnegative().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: quotationStatusEnum.optional(),
});

export const createQuotationFromEventSchema = z.object({
  eventId: z.number().int().positive(),
  quotationNumber: z.string().max(100).optional(),
  issueDate: z.string().min(1),
  validUntil: z.string().optional(),
  discountAmount: z.number().nonnegative().optional(),
  notes: z.string().optional(),
  eventServiceIds: z.array(z.number().int().positive()).optional(),
  status: quotationStatusEnum.optional(),
});

export const updateQuotationItemSchema = z.object({
  itemName: z.string().min(2).max(150).optional(),
  category: z.string().max(100).optional().nullable(),
  quantity: z.number().positive().optional(),
  unitPrice: z.number().nonnegative().optional(),
  totalPrice: z.number().nonnegative().optional().nullable(),
  notes: z.string().optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
});
