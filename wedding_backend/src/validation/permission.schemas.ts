import { z } from "zod";

export const createPermissionSchema = z.object({
  code: z.string().min(3), // مثال: "users.read"
  description: z.string().optional(),
});

export const updatePermissionSchema = z.object({
  code: z.string().min(3).optional(),
  description: z.string().optional(),
});

export type CreatePermissionInput = z.infer<typeof createPermissionSchema>;
export type UpdatePermissionInput = z.infer<typeof updatePermissionSchema>;
