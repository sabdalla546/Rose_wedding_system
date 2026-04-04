import { z } from "zod";

export const createInventoryItemSchema = z.object({
  name: z.string().trim().min(1).max(150),
  quantity: z.coerce.number().int().min(0).default(0),
});

export const updateInventoryItemSchema = z.object({
  name: z.string().trim().min(1).max(150).optional(),
  quantity: z.coerce.number().int().min(0).optional(),
});

export type CreateInventoryItemInput = z.infer<
  typeof createInventoryItemSchema
>;
export type UpdateInventoryItemInput = z.infer<
  typeof updateInventoryItemSchema
>;
