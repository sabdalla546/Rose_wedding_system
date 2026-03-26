import { z } from "zod";

export const quotationStatusEnum = z.enum([
  "draft",
  "sent",
  "approved",
  "rejected",
  "expired",
  "converted_to_contract",
]);

const financialNumberSchema = z.number().finite().nonnegative();

const baseQuotationItemSchema = z.object({
  itemType: z.enum(["service", "vendor"]).default("service"),
  eventServiceId: z.number().int().positive().optional().nullable(),
  serviceId: z.number().int().positive().optional().nullable(),
  eventVendorId: z.number().int().positive().optional().nullable(),
  vendorId: z.number().int().positive().optional().nullable(),
  pricingPlanId: z.number().int().positive().optional().nullable(),
  itemName: z.string().min(2).max(150),
  category: z.string().max(100).optional().nullable(),
  quantity: z.number().positive().optional(),
  unitPrice: financialNumberSchema.optional(),
  totalPrice: financialNumberSchema.optional(),
  notes: z.string().optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
});

export const quotationItemSchema = baseQuotationItemSchema.superRefine(
  (item, ctx) => {
    if (item.itemType === "vendor" && !item.eventVendorId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "eventVendorId is required for vendor quotation items",
        path: ["eventVendorId"],
      });
    }
  },
);

export const createQuotationSchema = z.object({
  eventId: z.number().int().positive(),
  quotationNumber: z.string().max(100).optional(),
  issueDate: z.string().min(1),
  validUntil: z.string().optional(),
  subtotal: z.number().nonnegative().optional(),
  discountAmount: z.number().nonnegative().optional(),
  notes: z.string().optional(),
  status: quotationStatusEnum.optional(),
  items: z.array(quotationItemSchema).min(1),
});

export const updateQuotationSchema = z.object({
  quotationNumber: z.string().max(100).optional().nullable(),
  issueDate: z.string().optional(),
  validUntil: z.string().optional().nullable(),
  subtotal: z.number().nonnegative().optional(),
  discountAmount: z.number().nonnegative().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: quotationStatusEnum.optional(),
});

export const createQuotationFromEventSchema = z
  .object({
    eventId: z.number().int().positive(),
    quotationNumber: z.string().max(100).optional(),
    issueDate: z.string().min(1),
    validUntil: z.string().optional(),
    subtotal: z.number().nonnegative().optional(),
    discountAmount: z.number().nonnegative().optional(),
    manualServicesTotal: z.number().nonnegative().optional(),
    notes: z.string().optional(),
    eventServiceIds: z.array(z.number().int().positive()).optional(),
    eventVendorIds: z.array(z.number().int().positive()).optional(),
    status: quotationStatusEnum.optional(),
  })
  .superRefine((data, ctx) => {
    const hasEventServices = Array.isArray(data.eventServiceIds)
      && data.eventServiceIds.length > 0;
    const hasEventVendors = Array.isArray(data.eventVendorIds)
      && data.eventVendorIds.length > 0;

    if (!hasEventServices && !hasEventVendors) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one event service or event vendor is required",
        path: ["eventServiceIds"],
      });
    }
  });

export const updateQuotationItemSchema = baseQuotationItemSchema
  .partial()
  .superRefine((item, ctx) => {
    if (item.itemType === "vendor" && item.eventVendorId === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "eventVendorId cannot be null for vendor quotation items",
        path: ["eventVendorId"],
      });
    }
  });
