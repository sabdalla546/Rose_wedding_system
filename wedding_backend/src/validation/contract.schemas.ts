import { z } from "zod";

export const contractStatusEnum = z.enum([
  "draft",
  "active",
  "completed",
  "cancelled",
  "terminated",
]);

export const paymentScheduleTypeEnum = z.enum([
  "deposit",
  "installment",
  "final",
]);
export const paymentScheduleStatusEnum = z.enum([
  "pending",
  "paid",
  "cancelled",
  "overdue",
]);

const financialNumberSchema = z.number().finite().nonnegative();

const baseContractItemSchema = z.object({
  itemType: z.enum(["service", "vendor"]).default("service"),
  quotationItemId: z.number().int().positive().optional().nullable(),
  eventServiceId: z.number().int().positive().optional().nullable(),
  serviceId: z.number().int().positive().optional().nullable(),
  eventVendorId: z.number().int().positive().optional().nullable(),
  vendorId: z.number().int().positive().optional().nullable(),
  pricingPlanId: z.number().int().positive().optional().nullable(),
  itemName: z.string().min(2).max(150),
  category: z.string().max(100).optional().nullable(),
  quantity: z.number().positive(),
  unitPrice: financialNumberSchema,
  totalPrice: financialNumberSchema.optional(),
  notes: z.string().optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
});

export const contractItemSchema = baseContractItemSchema.superRefine(
  (item, ctx) => {
    if (item.itemType === "vendor" && !item.eventVendorId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "eventVendorId is required for vendor contract items",
        path: ["eventVendorId"],
      });
    }
  },
);

export const paymentScheduleSchema = z.object({
  installmentName: z.string().min(2).max(150),
  scheduleType: paymentScheduleTypeEnum,
  dueDate: z.string().optional(),
  amount: z.number().nonnegative(),
  status: paymentScheduleStatusEnum.optional(),
  notes: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const createContractSchema = z.object({
  quotationId: z.number().int().positive().optional().nullable(),
  eventId: z.number().int().positive(),
  contractNumber: z.string().max(100).optional(),
  signedDate: z.string().min(1),
  eventDate: z.string().optional(),
  discountAmount: z.number().nonnegative().optional(),
  notes: z.string().optional(),
  status: contractStatusEnum.optional(),
  items: z.array(contractItemSchema).min(1),
  paymentSchedules: z.array(paymentScheduleSchema).optional(),
});

export const updateContractSchema = z.object({
  quotationId: z.number().int().positive().optional().nullable(),
  contractNumber: z.string().max(100).optional().nullable(),
  signedDate: z.string().optional(),
  eventDate: z.string().optional().nullable(),
  discountAmount: z.number().nonnegative().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: contractStatusEnum.optional(),
});

export const createContractFromQuotationSchema = z.object({
  quotationId: z.number().int().positive(),
  contractNumber: z.string().max(100).optional(),
  signedDate: z.string().min(1),
  eventDate: z.string().optional(),
  discountAmount: z.number().nonnegative().optional(),
  notes: z.string().optional(),
  status: contractStatusEnum.optional(),
  paymentSchedules: z.array(paymentScheduleSchema).optional(),
});

export const updateContractItemSchema = z.object({
  itemType: z.enum(["service", "vendor"]).optional(),
  quotationItemId: z.number().int().positive().optional().nullable(),
  eventServiceId: z.number().int().positive().optional().nullable(),
  serviceId: z.number().int().positive().optional().nullable(),
  eventVendorId: z.number().int().positive().optional().nullable(),
  vendorId: z.number().int().positive().optional().nullable(),
  pricingPlanId: z.number().int().positive().optional().nullable(),
  itemName: z.string().min(2).max(150).optional(),
  category: z.string().max(100).optional().nullable(),
  quantity: z.number().positive().optional(),
  unitPrice: financialNumberSchema.optional(),
  totalPrice: financialNumberSchema.optional().nullable(),
  notes: z.string().optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
}).superRefine((item, ctx) => {
  if (item.itemType === "vendor" && item.eventVendorId === null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "eventVendorId cannot be null for vendor contract items",
      path: ["eventVendorId"],
    });
  }
});

export const createPaymentScheduleSchema = z.object({
  contractId: z.number().int().positive(),
  installmentName: z.string().min(2).max(150),
  scheduleType: paymentScheduleTypeEnum,
  dueDate: z.string().optional(),
  amount: z.number().nonnegative(),
  status: paymentScheduleStatusEnum.optional(),
  notes: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const updatePaymentScheduleSchema = z.object({
  installmentName: z.string().min(2).max(150).optional(),
  scheduleType: paymentScheduleTypeEnum.optional(),
  dueDate: z.string().optional().nullable(),
  amount: z.number().nonnegative().optional(),
  status: paymentScheduleStatusEnum.optional(),
  notes: z.string().optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
});
