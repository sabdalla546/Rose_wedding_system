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
  type: vendorTypeEnum,
  contactPerson: z.string().max(150).optional(),
  contactName: z.string().max(150).optional(),
  phone: z.string().max(30).optional(),
  mobile: z.string().max(30).optional(),
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
  notes: z.string().optional(),
  status: eventVendorStatusEnum.optional(),
});

export const updateEventVendorSchema = z.object({
  vendorType: vendorTypeEnum.optional(),
  providedBy: eventVendorProvidedByEnum.optional(),
  vendorId: z.number().int().positive().optional().nullable(),
  companyNameSnapshot: z.string().max(150).optional().nullable(),
  selectedSubServiceIds: z.array(z.number().int().positive()).optional(),
  notes: z.string().optional().nullable(),
  status: eventVendorStatusEnum.optional(),
});

export const createVendorSubServiceSchema = z.object({
  vendorType: vendorTypeEnum,
  name: z.string().min(2).max(150),
  code: z.string().max(50).optional(),
  description: z.string().optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const updateVendorSubServiceSchema = z.object({
  vendorType: vendorTypeEnum.optional(),
  name: z.string().min(2).max(150).optional(),
  code: z.string().max(50).optional().nullable(),
  description: z.string().optional().nullable(),
  sortOrder: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

const vendorPricingPlanShape = {
  vendorType: vendorTypeEnum,
  name: z.string().min(2).max(150),
  minSubServices: z.coerce.number().int().min(0),
  maxSubServices: z.coerce.number().int().min(0).optional().nullable(),
  price: z.coerce.number().min(0),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
};

export const createVendorPricingPlanSchema = z
  .object(vendorPricingPlanShape)
  .refine(
    (data) =>
      data.maxSubServices === null ||
      typeof data.maxSubServices === "undefined" ||
      data.maxSubServices >= data.minSubServices,
    {
      message: "maxSubServices must be greater than or equal to minSubServices",
      path: ["maxSubServices"],
    },
  );

export const updateVendorPricingPlanSchema = z
  .object({
    vendorType: vendorTypeEnum.optional(),
    name: z.string().min(2).max(150).optional(),
    minSubServices: z.coerce.number().int().min(0).optional(),
    maxSubServices: z.coerce.number().int().min(0).optional().nullable(),
    price: z.coerce.number().min(0).optional(),
    notes: z.string().optional().nullable(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) =>
      typeof data.minSubServices === "undefined" ||
      data.maxSubServices === null ||
      typeof data.maxSubServices === "undefined" ||
      data.maxSubServices >= data.minSubServices,
    {
      message: "maxSubServices must be greater than or equal to minSubServices",
      path: ["maxSubServices"],
    },
  );
