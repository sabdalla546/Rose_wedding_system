import { z } from "zod";

const positiveInt = z.coerce
  .number({
    invalid_type_error: "Must be a number",
  })
  .int("Must be an integer")
  .positive("Must be greater than 0");

const nullablePositiveInt = z.union([positiveInt, z.null()]).optional();

const decimalNumber = z.coerce
  .number({
    invalid_type_error: "Must be a number",
  })
  .finite("Must be a valid number");

const nullableDecimalNumber = z.union([decimalNumber, z.null()]).optional();

const optionalTrimmedString = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (value === null || typeof value === "undefined") return undefined;
    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  });

export const contractAmendmentStatusSchema = z.enum([
  "draft",
  "approved",
  "applied",
  "rejected",
  "cancelled",
]);

export const contractAmendmentItemChangeTypeSchema = z.enum([
  "add_service",
  "remove_service",
]);

export const contractAmendmentItemStatusSchema = z.enum([
  "pending",
  "applied",
  "cancelled",
]);

export const createContractAmendmentSchema = z.object({
  contractId: positiveInt,
  reason: optionalTrimmedString,
  notes: optionalTrimmedString,
});

export const contractAmendmentIdParamSchema = z.object({
  id: positiveInt,
});

export const contractAmendmentItemIdParamSchema = z.object({
  id: positiveInt,
  itemId: positiveInt,
});

export const deleteContractAmendmentItemParamSchema = z.object({
  itemId: positiveInt,
});

export const contractAmendmentListQuerySchema = z.object({
  contractId: z.coerce.number().int().positive().optional(),
  eventId: z.coerce.number().int().positive().optional(),
  status: contractAmendmentStatusSchema.optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

const addServiceAmendmentItemSchema = z.object({
  changeType: z.literal("add_service"),

  targetContractItemId: z.union([z.null(), z.undefined()]).optional(),
  targetEventServiceId: z.union([z.null(), z.undefined()]).optional(),
  targetExecutionServiceDetailId: z.union([z.null(), z.undefined()]).optional(),

  serviceId: positiveInt,
  itemName: z
    .string()
    .trim()
    .min(1, "itemName is required")
    .max(150, "itemName is too long"),
  category: z
    .string()
    .trim()
    .min(1, "category is required")
    .max(100, "category is too long"),
  quantity: decimalNumber.refine((value) => value > 0, {
    message: "quantity must be greater than 0",
  }),
  unitPrice: decimalNumber.refine((value) => value >= 0, {
    message: "unitPrice must be greater than or equal to 0",
  }),
  totalPrice: nullableDecimalNumber,
  notes: optionalTrimmedString,
  sortOrder: z.coerce.number().int().min(0).optional(),
});

const removeServiceAmendmentItemSchema = z.object({
  changeType: z.literal("remove_service"),

  targetContractItemId: positiveInt,
  targetEventServiceId: nullablePositiveInt,
  targetExecutionServiceDetailId: nullablePositiveInt,

  serviceId: z.union([z.null(), z.undefined()]).optional(),
  itemName: optionalTrimmedString,
  category: optionalTrimmedString,
  quantity: nullableDecimalNumber,
  unitPrice: nullableDecimalNumber,
  totalPrice: nullableDecimalNumber,
  notes: optionalTrimmedString,
  sortOrder: z.coerce.number().int().min(0).optional(),
});

export const createContractAmendmentItemSchema = z
  .discriminatedUnion("changeType", [
    addServiceAmendmentItemSchema,
    removeServiceAmendmentItemSchema,
  ])
  .superRefine((value, ctx) => {
    if (value.changeType === "add_service") {
      const calculatedTotal = Number(value.quantity) * Number(value.unitPrice);

      if (
        typeof value.totalPrice !== "undefined" &&
        value.totalPrice !== null &&
        Math.abs(Number(value.totalPrice) - calculatedTotal) > 0.001
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["totalPrice"],
          message:
            "totalPrice must match quantity * unitPrice, or omit totalPrice",
        });
      }
    }
  });

export const updateContractAmendmentItemSchema = z
  .object({
    itemName: z.string().trim().min(1).max(150).optional(),
    category: z.string().trim().min(1).max(100).optional(),
    quantity: decimalNumber
      .refine((value) => value > 0, {
        message: "quantity must be greater than 0",
      })
      .optional(),
    unitPrice: decimalNumber
      .refine((value) => value >= 0, {
        message: "unitPrice must be greater than or equal to 0",
      })
      .optional(),
    totalPrice: nullableDecimalNumber,
    notes: optionalTrimmedString,
    sortOrder: z.coerce.number().int().min(0).optional(),
    status: contractAmendmentItemStatusSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (
      typeof value.quantity !== "undefined" &&
      typeof value.unitPrice !== "undefined" &&
      typeof value.totalPrice !== "undefined" &&
      value.totalPrice !== null
    ) {
      const calculatedTotal = Number(value.quantity) * Number(value.unitPrice);

      if (Math.abs(Number(value.totalPrice) - calculatedTotal) > 0.001) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["totalPrice"],
          message:
            "totalPrice must match quantity * unitPrice, or omit totalPrice",
        });
      }
    }
  });

export const approveContractAmendmentSchema = z.object({
  notes: optionalTrimmedString,
});

export const rejectContractAmendmentSchema = z.object({
  reason: z.string().trim().min(1, "reason is required").max(255),
  notes: optionalTrimmedString,
});

export const applyContractAmendmentSchema = z.object({
  notes: optionalTrimmedString,
});
