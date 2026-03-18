import { z } from "zod";

export const vendorTypeEnum = z.enum([
  "dj",
  "lighting",
  "barcode",
  "photography",
  "perfumes",
  "coffee_station",
  "cheese",
  "ac_generator",
  "bleachers",
  "instant_photography",
  "valet",
  "female_supplies",
  "family_services",
  "sweets_savories",
  "other",
]);

export const eventVendorProvidedByEnum = z.enum(["company", "client"]);
export const eventVendorStatusEnum = z.enum([
  "pending",
  "approved",
  "confirmed",
  "cancelled",
]);

export const createVendorSchema = z.object({
  name: z.string().min(2).max(150),
  type: vendorTypeEnum,
  contactPerson: z.string().max(150).optional(),
  phone: z.string().max(30).optional(),
  phone2: z.string().max(30).optional(),
  email: z.string().email().optional(),
  address: z.string().max(255).optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const updateVendorSchema = z.object({
  name: z.string().min(2).max(150).optional(),
  type: vendorTypeEnum.optional(),
  contactPerson: z.string().max(150).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  phone2: z.string().max(30).optional().nullable(),
  email: z.string().email().optional().nullable(),
  address: z.string().max(255).optional().nullable(),
  notes: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const createEventVendorSchema = z.object({
  eventId: z.number().int().positive(),
  vendorType: vendorTypeEnum,
  providedBy: eventVendorProvidedByEnum,
  vendorId: z.number().int().positive().optional().nullable(),
  companyNameSnapshot: z.string().max(150).optional(),
  notes: z.string().optional(),
  status: eventVendorStatusEnum.optional(),
});

export const updateEventVendorSchema = z.object({
  vendorType: vendorTypeEnum.optional(),
  providedBy: eventVendorProvidedByEnum.optional(),
  vendorId: z.number().int().positive().optional().nullable(),
  companyNameSnapshot: z.string().max(150).optional().nullable(),
  notes: z.string().optional().nullable(),
  status: eventVendorStatusEnum.optional(),
});
