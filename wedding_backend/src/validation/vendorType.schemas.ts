import { z } from "zod";

const slugPattern = /^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u;

export const createVendorTypeSchema = z.object({
  name: z.string().trim().min(1).max(150),
  nameAr: z.string().trim().min(1).max(150),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(150)
    .regex(slugPattern, "slug must contain only letters, numbers, and hyphens")
    .optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
});

export const updateVendorTypeSchema = z.object({
  name: z.string().trim().min(1).max(150).optional(),
  nameAr: z.string().trim().min(1).max(150).optional(),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(150)
    .regex(slugPattern, "slug must contain only letters, numbers, and hyphens")
    .optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
});
