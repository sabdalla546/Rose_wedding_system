import { z } from "zod";

export const serviceCategoryEnum = z.enum([
  "internal_setup",
  "external_service",
  "flowers",
  "stage",
  "entrance",
  "chairs",
  "tables",
  "buffet",
  "lighting",
  "photography",
  "audio",
  "hospitality",
  "female_supplies",
  "transport",
  "other",
]);

export const servicePricingTypeEnum = z.enum([
  "fixed",
  "per_guest",
  "per_unit",
  "custom",
]);

export const eventServiceStatusEnum = z.enum([
  "draft",
  "approved",
  "confirmed",
  "cancelled",
  "completed",
]);

export const createServiceSchema = z.object({
  name: z.string().min(2).max(150),
  code: z.string().max(50).optional(),
  category: serviceCategoryEnum,
  pricingType: servicePricingTypeEnum,
  basePrice: z.number().nonnegative().optional(),
  unitName: z.string().max(50).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const updateServiceSchema = z.object({
  name: z.string().min(2).max(150).optional(),
  code: z.string().max(50).optional().nullable(),
  category: serviceCategoryEnum.optional(),
  pricingType: servicePricingTypeEnum.optional(),
  basePrice: z.number().nonnegative().optional().nullable(),
  unitName: z.string().max(50).optional().nullable(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const createEventServiceSchema = z
  .object({
    eventId: z.number().int().positive(),
    serviceId: z.number().int().positive().optional().nullable(),
    serviceNameSnapshot: z.string().min(2).max(150).optional(),
    category: serviceCategoryEnum.optional(),
    quantity: z.number().positive().optional(),
    unitPrice: z.number().nonnegative().optional().nullable(),
    totalPrice: z.number().nonnegative().optional().nullable(),
    notes: z.string().optional(),
    status: eventServiceStatusEnum.optional(),
    sortOrder: z.number().int().min(0).optional(),
  })
  .refine((data) => !!data.serviceId || !!data.serviceNameSnapshot, {
    message: "Either serviceId or serviceNameSnapshot is required",
    path: ["serviceId"],
  });

export const updateEventServiceSchema = z.object({
  serviceId: z.number().int().positive().optional().nullable(),
  serviceNameSnapshot: z.string().min(2).max(150).optional().nullable(),
  category: serviceCategoryEnum.optional(),
  quantity: z.number().positive().optional(),
  unitPrice: z.number().nonnegative().optional().nullable(),
  totalPrice: z.number().nonnegative().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: eventServiceStatusEnum.optional(),
  sortOrder: z.number().int().min(0).optional(),
});
