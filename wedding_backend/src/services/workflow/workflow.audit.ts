import { logger } from "../../config/logger";
import { buildWorkflowLineageSummary } from "./workflow.lineage";

type WorkflowTransitionAuditInput = {
  entityName: string;
  entityId: number;
  previousStatus: string;
  nextStatus: string;
  actionName?: string;
  changedBy: number | null;
  changedAt?: Date;
  note?: string | null;
  reason?: string | null;
  sourceRefs?: Parameters<typeof buildWorkflowLineageSummary>[0];
  metadata?: Record<string, unknown>;
};

type WorkflowActionAuditInput = {
  entityName: string;
  entityId: number;
  actionName: string;
  actorId: number | null;
  actedAt?: Date;
  note?: string | null;
  reason?: string | null;
  sourceRefs?: Parameters<typeof buildWorkflowLineageSummary>[0];
  metadata?: Record<string, unknown>;
};

const buildWorkflowAuditPayload = ({
  actionName,
  note,
  reason,
  metadata,
  sourceRefs,
}: Pick<WorkflowActionAuditInput, "actionName" | "note" | "reason" | "metadata" | "sourceRefs">) => ({
  actionName,
  note,
  reason,
  lineage: buildWorkflowLineageSummary(sourceRefs),
  metadata: metadata ?? undefined,
});

export const recordWorkflowTransition = ({
  entityName,
  entityId,
  previousStatus,
  nextStatus,
  actionName = `${entityName}.status_changed`,
  changedBy,
  changedAt = new Date(),
  note = null,
  reason = null,
  sourceRefs,
  metadata,
}: WorkflowTransitionAuditInput) => {
  logger.info("workflow.transition", {
    entityName,
    entityId,
    previousStatus,
    nextStatus,
    changedBy,
    changedAt: changedAt.toISOString(),
    ...buildWorkflowAuditPayload({
      actionName,
      note,
      reason,
      metadata,
      sourceRefs,
    }),
  });
};

type WorkflowBlockAuditInput = {
  entityName: string;
  entityId: number;
  actionName?: string;
  currentStatus?: string | null;
  attemptedBy: number | null;
  message: string;
  reason?: string | null;
  sourceRefs?: Parameters<typeof buildWorkflowLineageSummary>[0];
  metadata?: Record<string, unknown>;
};

export const recordWorkflowBlock = ({
  entityName,
  entityId,
  actionName = `${entityName}.blocked`,
  currentStatus = null,
  attemptedBy,
  message,
  reason = null,
  sourceRefs,
  metadata,
}: WorkflowBlockAuditInput) => {
  logger.warn("workflow.blocked", {
    entityName,
    entityId,
    currentStatus,
    attemptedBy,
    message,
    ...buildWorkflowAuditPayload({
      actionName,
      note: message,
      reason,
      metadata,
      sourceRefs,
    }),
  });
};

export const recordWorkflowAction = ({
  entityName,
  entityId,
  actionName,
  actorId,
  actedAt = new Date(),
  note = null,
  reason = null,
  sourceRefs,
  metadata,
}: WorkflowActionAuditInput) => {
  logger.info("workflow.action", {
    entityName,
    entityId,
    actedBy: actorId,
    actedAt: actedAt.toISOString(),
    ...buildWorkflowAuditPayload({
      actionName,
      note,
      reason,
      metadata,
      sourceRefs,
    }),
  });
};
