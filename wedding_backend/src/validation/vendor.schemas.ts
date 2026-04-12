import { z } from "zod";
import { vendorTypeValues } from "../models/vendor.model";

export const vendorTypeEnum = z.enum(vendorTypeValues);

export const eventVendorProvidedByEnum = z.enum(["company", "client"]);
export const eventVendorStatusEnum = z.enum([
  "pending",
  "approved",
  "confirmed",
  "cancelled",
]);

export const createVendorSchema = z.object({
  name: z.string().min(2).max(150),
  type: z.string().trim().min(1).max(150).optional(),
  typeId: z.number().int().positive().optional(),
  contactPerson: z.string().max(150).optional(),
  contactName: z.string().max(150).optional(),
  phone: z.string().max(30).optional(),
  mobile: z.string().max(30).optional(),
  phone2: z.string().max(30).optional(),
  email: z.string().email().optional(),
  address: z.string().max(255).optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
}).refine((data) => Boolean(data.typeId || data.type), {
  message: "type or typeId is required",
  path: ["typeId"],
});

export const updateVendorSchema = z.object({
  name: z.string().min(2).max(150).optional(),
  type: z.string().trim().min(1).max(150).optional(),
  typeId: z.number().int().positive().optional().nullable(),
  contactPerson: z.string().max(150).optional().nullable(),
  contactName: z.string().max(150).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  mobile: z.string().max(30).optional().nullable(),
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
  selectedSubServiceIds: z.array(z.number().int().positive()).optional(),
  agreedPrice: z.coerce.number().min(0).optional().nullable(),
  notes: z.string().optional(),
  status: eventVendorStatusEnum.optional(),
});

export const updateEventVendorSchema = z.object({
  vendorType: vendorTypeEnum.optional(),
  providedBy: eventVendorProvidedByEnum.optional(),
  vendorId: z.number().int().positive().optional().nullable(),
  companyNameSnapshot: z.string().max(150).optional().nullable(),
  selectedSubServiceIds: z.array(z.number().int().positive()).optional(),
  agreedPrice: z.coerce.number().min(0).optional().nullable(),
  notes: z.string().optional().nullable(),
  status: eventVendorStatusEnum.optional(),
});

export const createVendorSubServiceSchema = z.object({
  vendorId: z.number().int().positive(),
  vendorType: vendorTypeEnum.optional(),
  name: z.string().min(2).max(150),
  code: z.string().max(50).optional(),
  description: z.string().optional(),
  price: z.coerce.number().min(0),
  sortOrder: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const updateVendorSubServiceSchema = z.object({
  vendorId: z.number().int().positive().optional(),
  vendorType: vendorTypeEnum.optional(),
  name: z.string().min(2).max(150).optional(),
  code: z.string().max(50).optional().nullable(),
  description: z.string().optional().nullable(),
  price: z.coerce.number().min(0).optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});
