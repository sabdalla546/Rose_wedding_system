import { z } from "zod";

export const createVenueSchema = z.object({
  name: z.string().min(2).max(150),
  city: z.string().max(100).optional(),
  area: z.string().max(100).optional(),
  address: z.string().max(255).optional(),
  phone: z.string().max(30).optional(),
  contactPerson: z.string().max(150).optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const updateVenueSchema = z.object({
  name: z.string().min(2).max(150).optional(),
  city: z.string().max(100).optional(),
  area: z.string().max(100).optional(),
  address: z.string().max(255).optional(),
  phone: z.string().max(30).optional(),
  contactPerson: z.string().max(150).optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type CreateVenueInput = z.infer<typeof createVenueSchema>;
export type UpdateVenueInput = z.infer<typeof updateVenueSchema>;
