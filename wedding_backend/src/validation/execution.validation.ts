import { z } from "zod";

export const executionBriefStatusEnum = z.enum([
  "draft",
  "under_review",
  "approved",
  "handed_to_executor",
  "in_progress",
  "completed",
]);

export const executionServiceDetailStatusEnum = z.enum([
  "pending",
  "draft",
  "ready",
  "in_progress",
  "done",
]);

export const createExecutionBriefSchema = z.object({
  eventId: z.coerce.number().int().positive(),
  quotationId: z.coerce.number().int().positive().optional().nullable(),
  contractId: z.coerce.number().int().positive().optional().nullable(),
  status: executionBriefStatusEnum.optional(),
  generalNotes: z.string().trim().optional().nullable(),
  clientNotes: z.string().trim().optional().nullable(),
  designerNotes: z.string().trim().optional().nullable(),
  initializeFromEventServices: z.boolean().optional().default(true),
});

export const updateExecutionBriefSchema = z.object({
  quotationId: z.coerce.number().int().positive().optional().nullable(),
  contractId: z.coerce.number().int().positive().optional().nullable(),
  status: executionBriefStatusEnum.optional(),
  generalNotes: z.string().trim().optional().nullable(),
  clientNotes: z.string().trim().optional().nullable(),
  designerNotes: z.string().trim().optional().nullable(),
  approvedByClientAt: z.string().datetime().optional().nullable(),
  handedToExecutorAt: z.string().datetime().optional().nullable(),
});

export const executionBriefIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const executionBriefByEventParamSchema = z.object({
  eventId: z.coerce.number().int().positive(),
});
export const executionServiceDetailIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const updateExecutionServiceDetailSchema = z.object({
  templateKey: z.string().trim().min(1).optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
  detailsJson: z.record(z.any()).nullable().optional(),
  notes: z.string().trim().optional().nullable(),
  executorNotes: z.string().trim().optional().nullable(),
  status: executionServiceDetailStatusEnum.optional(),
});

export const createExecutionAttachmentForBriefSchema = z.object({
  label: z.string().trim().optional().nullable(),
  sortOrder: z.coerce.number().int().min(0).optional(),
});

export const createExecutionAttachmentForServiceDetailSchema = z.object({
  label: z.string().trim().optional().nullable(),
  sortOrder: z.coerce.number().int().min(0).optional(),
});

export const executionAttachmentIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
