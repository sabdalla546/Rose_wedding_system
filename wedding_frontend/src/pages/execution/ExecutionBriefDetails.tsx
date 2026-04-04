import { useState } from "react";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { ArrowRight, CheckCheck, Download, Link2, Play, XCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { PageContainer } from "@/components/layout/page-container";
import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import { FormFeedbackBanner } from "@/components/shared/form-feedback-banner";
import { WorkflowActionBar } from "@/components/workflow/workflow-action-bar";
import { WorkflowEntityHeader } from "@/components/workflow/workflow-entity-header";
import { WorkflowLineageCard } from "@/components/workflow/workflow-lineage-card";
import { WorkflowLockBanner } from "@/components/workflow/workflow-lock-banner";
import {
  WorkflowNextStepPanel,
  type WorkflowNextStepItem,
} from "@/components/workflow/workflow-next-step-panel";
import { WorkflowTimeline, type WorkflowTimelineItem } from "@/components/workflow/workflow-timeline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ConfirmDialog from "@/components/ui/confirmDialog";
import { useExecutionBrief, useUpdateExecutionBrief, useUpdateExecutionServiceDetail, useUploadExecutionServiceDetailAttachment, useDeleteExecutionAttachment } from "@/hooks/execution";
import { useExecutionWorkflowAction } from "@/hooks/execution/useExecutionWorkflowActions";
import { useHasPermission } from "@/hooks/useHasPermission";
import {
  getExecutionLockMessage,
  getExecutionWorkflowActions,
  type WorkflowActionDefinition,
} from "@/lib/workflow/workflow";
import {
  getExecutionBriefDisplayNumber,
  getExecutionServiceDetailPreview,
  getExecutionTemplateLabel,
  resolveExecutionAttachmentUrl,
  resolveExecutionTemplateKey,
} from "@/pages/execution/adapters";
import { ExecutionServiceCard } from "@/features/events/components/execution/ExecutionServiceCard";

import { ExecutionStatusBadge } from "./_components/executionStatusBadge";
import type { ExecutionBriefStatus } from "./types";

const ExecutionBriefDetailsPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const canUpdateExecution = useHasPermission("events.update");
  const { data: brief, isLoading } = useExecutionBrief(id);
  const [pendingWorkflowAction, setPendingWorkflowAction] =
    useState<WorkflowActionDefinition | null>(null);
  const [expandedDetailId, setExpandedDetailId] = useState<number | null>(null);
  const dateLocale = i18n.language === "ar" ? ar : enUS;

  const workflowActionMutation = useExecutionWorkflowAction(
    brief?.id,
    brief?.eventId,
  );
  const updateBriefMutation = useUpdateExecutionBrief(brief?.id, {
    eventId: brief?.eventId,
  });
  const updateDetailMutation = useUpdateExecutionServiceDetail({
    briefId: brief?.id,
    eventId: brief?.eventId,
  });
  const uploadAttachmentMutation = useUploadExecutionServiceDetailAttachment({
    briefId: brief?.id,
    eventId: brief?.eventId,
  });
  const deleteAttachmentMutation = useDeleteExecutionAttachment({
    briefId: brief?.id,
    eventId: brief?.eventId,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-sm text-[var(--lux-text-secondary)]">
          {t("common.loading", { defaultValue: "Loading..." })}
        </div>
      </div>
    );
  }

  if (!brief) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-sm text-[var(--lux-text-secondary)]">
          {t("common.noResultsTitle", { defaultValue: "No results found" })}
        </div>
      </div>
    );
  }

  const lockMessage = getExecutionLockMessage(brief.status);
  const workflowActionIcons = {
    under_review: <ArrowRight className="h-4 w-4" />,
    approved: <CheckCheck className="h-4 w-4" />,
    handed_off: <Link2 className="h-4 w-4" />,
    in_progress: <Play className="h-4 w-4" />,
    completed: <CheckCheck className="h-4 w-4" />,
    cancelled: <XCircle className="h-4 w-4" />,
  } as const;
  const workflowActions = getExecutionWorkflowActions(brief.status).map(
    (action) => ({
      ...action,
      icon: action.nextStatus
        ? workflowActionIcons[action.nextStatus as keyof typeof workflowActionIcons]
        : undefined,
      loading:
        workflowActionMutation.isPending &&
        action.nextStatus === workflowActionMutation.variables?.status,
      onClick: () => {
        if (action.confirmTitle || action.confirmMessage) {
          setPendingWorkflowAction(action);
          return;
        }

        if (action.nextStatus) {
          workflowActionMutation.mutate({
            status: action.nextStatus as ExecutionBriefStatus,
          });
        }
      },
    }),
  );
  const totalAttachments = (brief.attachments?.length ?? 0) +
    (brief.serviceDetails?.reduce(
      (sum, detail) => sum + (detail.attachments?.length ?? 0),
      0,
    ) ?? 0);
  const isLocked = Boolean(lockMessage);
  const canEditExecution = canUpdateExecution && !isLocked;
  const nextSteps: WorkflowNextStepItem[] = [];
  const timelineItems: WorkflowTimelineItem[] = [
    {
      id: "created",
      title: t("execution.timelineCreated", {
        defaultValue: "Execution brief created",
      }),
      description: t("execution.timelineCreatedHint", {
        defaultValue: "The operational brief was initialized from the source workflow.",
      }),
      timestamp: brief.createdAt,
      status: "done",
    },
    {
      id: "status-update",
      title: t("execution.timelineStatusUpdate", {
        defaultValue: "Operational status updated",
      }),
      description: t("execution.timelineStatusUpdateHint", {
        defaultValue: "Current status: {{status}}",
        status: t(`execution.briefStatusOptions.${brief.status}`, {
          defaultValue: brief.status,
        }),
      }),
      timestamp: brief.updatedAt ?? brief.createdAt,
      status: brief.status === "cancelled" ? "warning" : "current",
    },
  ];

  if (brief.status === "draft") {
    nextSteps.push({
      id: "submit-review",
      title: t("execution.nextReviewTitle", {
        defaultValue: "Submit the brief for review",
      }),
      description: t("execution.nextReviewHint", {
        defaultValue:
          "This brief is still in draft. Move it into review once the service blocks and notes are ready.",
      }),
      tone: "warning",
    });
  }

  if (brief.status === "under_review") {
    nextSteps.push({
      id: "approve-brief",
      title: t("execution.nextApproveTitle", {
        defaultValue: "Approve the brief",
      }),
      description: t("execution.nextApproveHint", {
        defaultValue:
          "The brief is waiting on approval before it can be handed off to the execution team.",
      }),
      tone: "warning",
    });
  }

  if (brief.status === "approved") {
    nextSteps.push({
      id: "handoff-brief",
      title: t("execution.nextHandoffTitle", {
        defaultValue: "Handoff to execution",
      }),
      description: t("execution.nextHandoffHint", {
        defaultValue:
          "The brief is approved. Hand it off so the executor can start working from the operational reference.",
      }),
      tone: "default",
    });
  }

  if (brief.status === "handed_off" || brief.status === "handed_to_executor") {
    nextSteps.push({
      id: "start-work",
      title: t("execution.nextStartTitle", {
        defaultValue: "Start live execution",
      }),
      description: t("execution.nextStartHint", {
        defaultValue:
          "The brief has already been handed off. Use the workflow action above when live execution begins.",
      }),
      tone: "default",
    });
  }

  if (brief.status === "in_progress") {
    nextSteps.push({
      id: "complete-work",
      title: t("execution.nextCompleteTitle", {
        defaultValue: "Complete the execution brief",
      }),
      description: t("execution.nextCompleteHint", {
        defaultValue:
          "Execution is active. Mark it complete only after the delivery work is fully closed out.",
      }),
      tone: "default",
    });
  }

  if (brief.status === "completed") {
    nextSteps.push({
      id: "return-event",
      title: t("execution.nextEventTitle", {
        defaultValue: "Return to the source event",
      }),
      description: t("execution.nextEventHint", {
        defaultValue:
          "This brief is complete. Review the source event if you need to inspect the wider workflow context.",
      }),
      tone: "success",
      action: (
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(`/events/${brief.eventId}`)}
        >
          <Link2 className="h-4 w-4" />
          {t("execution.openSourceEvent", {
            defaultValue: "Open Source Event",
          })}
        </Button>
      ),
    });
  }

  if (brief.approvedByClientAt) {
    timelineItems.push({
      id: "approved",
      title: t("execution.timelineApproved", {
        defaultValue: "Approved by client",
      }),
      description: t("execution.timelineApprovedHint", {
        defaultValue: "The stored approval date is available on the execution brief.",
      }),
      timestamp: brief.approvedByClientAt,
      status: "done",
    });
  }

  if (brief.handedToExecutorAt) {
    timelineItems.push({
      id: "handed-off",
      title: t("execution.timelineHandedOff", {
        defaultValue: "Handed to executor",
      }),
      description: t("execution.timelineHandedOffHint", {
        defaultValue: "The handoff date is stored directly on the execution brief.",
      }),
      timestamp: brief.handedToExecutorAt,
      status: "done",
    });
  }

  return (
    <ProtectedComponent permission="events.read">
      <PageContainer className="pb-4 pt-4 text-foreground">
        <div dir={i18n.dir()} className="mx-auto w-full max-w-6xl space-y-6">
          <button
            type="button"
            onClick={() => navigate("/execution-briefs")}
            className="inline-flex items-center gap-2 text-sm text-[var(--lux-text-secondary)] transition-colors hover:text-[var(--lux-gold)]"
          >
            {"<-"} {t("execution.backToExecutionBriefs", {
              defaultValue: "Back to Execution Briefs",
            })}
          </button>

          <WorkflowEntityHeader
            eyebrow={t("execution.workflowStage", {
              defaultValue: "Operational Snapshot",
            })}
            title={getExecutionBriefDisplayNumber(brief)}
            description={`Event #${brief.eventId}`}
            status={<ExecutionStatusBadge status={brief.status} />}
            actions={
              <button
                type="button"
                onClick={() => navigate(`/events/${brief.eventId}`)}
                className="inline-flex items-center gap-2 rounded-[16px] border px-4 py-2 text-sm font-medium text-[var(--lux-text)] transition hover:border-[var(--lux-gold-border)] hover:text-[var(--lux-gold)]"
              >
                <Link2 className="h-4 w-4" />
                {t("execution.openSourceEvent", {
                  defaultValue: "Open Source Event",
                })}
              </button>
            }
          />

          <WorkflowLineageCard
            title={t("execution.workflowLineage", {
              defaultValue: "Workflow Lineage",
            })}
            items={[
              {
                label: t("execution.sourceEvent", {
                  defaultValue: "Source Event",
                }),
                value: (
                  <button
                    type="button"
                    onClick={() => navigate(`/events/${brief.eventId}`)}
                    className="text-sm font-medium text-[var(--lux-gold)] hover:underline"
                  >
                    Event #{brief.eventId}
                  </button>
                ),
                helper: typeof brief.event === "object" && brief.event && "title" in (brief.event as Record<string, unknown>)
                  ? String((brief.event as Record<string, unknown>).title ?? "")
                  : undefined,
              },
              {
                label: t("execution.sourceQuotation", {
                  defaultValue: "Source Quotation",
                }),
                value: brief.quotationId ? (
                  <button
                    type="button"
                    onClick={() => navigate(`/quotations/${brief.quotationId}`)}
                    className="text-sm font-medium text-[var(--lux-gold)] hover:underline"
                  >
                    Quotation #{brief.quotationId}
                  </button>
                ) : (
                  t("execution.noQuotationLinked", {
                    defaultValue: "No quotation linked",
                  })
                ),
              },
              {
                label: t("execution.sourceContract", {
                  defaultValue: "Source Contract",
                }),
                value: brief.contractId ? (
                  <button
                    type="button"
                    onClick={() => navigate(`/contracts/${brief.contractId}`)}
                    className="text-sm font-medium text-[var(--lux-gold)] hover:underline"
                  >
                    Contract #{brief.contractId}
                  </button>
                ) : (
                  t("execution.noContractLinked", {
                    defaultValue: "No contract linked",
                  })
                ),
              },
              {
                label: t("execution.operationalSummary", {
                  defaultValue: "Operational Summary",
                }),
                value: `${brief.serviceDetails?.length ?? 0} ${t("execution.blocks", {
                  defaultValue: "blocks",
                })}`,
                helper: `${totalAttachments} ${t("execution.attachmentsLabel", {
                  defaultValue: "attachments",
                })}`,
              },
            ]}
          />

          <ProtectedComponent permission="events.update">
            <WorkflowActionBar
              title={t("execution.workflowActions", {
                defaultValue: "Workflow Actions",
              })}
              description={t("execution.workflowActionsHint", {
                defaultValue:
                  "Move this execution brief through review, handoff, and live execution with explicit actions.",
              })}
              actions={workflowActions}
            />
          </ProtectedComponent>

          {!canUpdateExecution ? (
            <FormFeedbackBanner
              title={t("execution.readOnlyAccessTitle", {
                defaultValue: "Read-only execution access",
              })}
              message={t("execution.readOnlyAccessHint", {
                defaultValue:
                  "You can review this brief, but structural edits, uploads, and workflow actions require event update permission.",
              })}
            />
          ) : null}

          {lockMessage ? (
            <WorkflowLockBanner
              title={t("execution.lockedTitle", {
                defaultValue: "Execution Brief Locked",
              })}
              message={lockMessage}
            />
          ) : null}

          <div className="grid gap-4 xl:grid-cols-2">
            <WorkflowNextStepPanel
              title={t("execution.nextStepsTitle", {
                defaultValue: "Next Step Guidance",
              })}
              description={t("execution.nextStepsHint", {
                defaultValue:
                  "This panel calls out the next workflow decision based on the current execution brief status.",
              })}
              items={nextSteps}
            />

            <WorkflowTimeline
              title={t("execution.timelineTitle", {
                defaultValue: "Timeline & Action History",
              })}
              description={t("execution.timelineHint", {
                defaultValue:
                  "This history reflects the timestamps currently exposed on the execution brief record.",
              })}
              partialHistoryLabel={t("execution.timelinePartial", {
                defaultValue:
                  "Only a partial history is available today. Status changes without dedicated timestamps are shown from the latest record update.",
              })}
              items={timelineItems}
              locale={dateLocale}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>
                  {t("execution.summary", { defaultValue: "Summary" })}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-[var(--lux-text-secondary)]">
                <p>
                  {t("execution.createdAt", { defaultValue: "Created At" })}:{" "}
                  {brief.createdAt
                    ? format(new Date(brief.createdAt), "MMM d, yyyy", {
                        locale: dateLocale,
                      })
                    : "-"}
                </p>
                <p>
                  {t("common.updatedAt", { defaultValue: "Updated At" })}:{" "}
                  {brief.updatedAt
                    ? format(new Date(brief.updatedAt), "MMM d, yyyy", {
                        locale: dateLocale,
                      })
                    : "-"}
                </p>
                <p>
                  {t("execution.serviceDetails", {
                    defaultValue: "Service Details",
                  })}: {brief.serviceDetails?.length ?? 0}
                </p>
                <p>
                  {t("execution.attachmentsLabel", {
                    defaultValue: "Attachments",
                  })}: {totalAttachments}
                </p>
              </CardContent>
            </Card>

            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>{t("common.notes", { defaultValue: "Notes" })}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
                    {t("execution.generalNotes", { defaultValue: "General Notes" })}
                  </p>
                  <p className="whitespace-pre-wrap text-sm text-[var(--lux-text-secondary)]">
                    {brief.generalNotes || "-"}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
                    {t("execution.clientNotes", { defaultValue: "Client Notes" })}
                  </p>
                  <p className="whitespace-pre-wrap text-sm text-[var(--lux-text-secondary)]">
                    {brief.clientNotes || "-"}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
                    {t("execution.designerNotes", { defaultValue: "Designer Notes" })}
                  </p>
                  <p className="whitespace-pre-wrap text-sm text-[var(--lux-text-secondary)]">
                    {brief.designerNotes || "-"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--lux-heading)]">
                {t("execution.serviceDetails", {
                  defaultValue: "Execution Service Details",
                })}
              </h2>
              {canEditExecution ? (
                <button
                  type="button"
                  onClick={() =>
                    updateBriefMutation.mutate({
                      generalNotes: brief.generalNotes ?? null,
                      clientNotes: brief.clientNotes ?? null,
                      designerNotes: brief.designerNotes ?? null,
                    })
                  }
                  className="text-sm text-[var(--lux-text-secondary)] underline-offset-4 hover:text-[var(--lux-gold)] hover:underline"
                >
                  {t("execution.refreshBrief", {
                    defaultValue: "Save Header Notes",
                  })}
                </button>
              ) : null}
            </div>

            {brief.serviceDetails?.length ? (
              !canEditExecution ? (
                <div className="grid gap-4 xl:grid-cols-2">
                  {brief.serviceDetails.map((detail) => (
                    <Card key={detail.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between gap-3">
                          <span>
                            {detail.serviceNameSnapshot ||
                              detail.service?.name ||
                              `Service #${detail.serviceId}`}
                          </span>
                          <span className="rounded-full border px-3 py-1 text-xs font-medium text-[var(--lux-text-secondary)]">
                            {t(`execution.statusOptions.${detail.status}`, {
                              defaultValue: detail.status,
                            })}
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-[var(--lux-text-secondary)]">
                          {getExecutionTemplateLabel(
                            resolveExecutionTemplateKey(detail),
                            t,
                          )}
                        </p>
                        <p className="text-sm text-[var(--lux-text-secondary)]">
                          {getExecutionServiceDetailPreview(detail, t)}
                        </p>
                        {detail.notes ? (
                          <p className="whitespace-pre-wrap text-sm text-[var(--lux-text-secondary)]">
                            {detail.notes}
                          </p>
                        ) : null}
                        {detail.attachments?.length ? (
                          <div className="flex flex-wrap gap-2">
                            {detail.attachments.map((attachment) => (
                              <a
                                key={attachment.id}
                                href={resolveExecutionAttachmentUrl(attachment) ?? "#"}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 rounded-[14px] border px-3 py-2 text-sm text-[var(--lux-text)] hover:border-[var(--lux-gold-border)] hover:text-[var(--lux-gold)]"
                              >
                                <Download className="h-4 w-4" />
                                {attachment.originalName}
                              </a>
                            ))}
                          </div>
                        ) : null}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 xl:grid-cols-2">
                  {brief.serviceDetails.map((detail) => (
                    <ExecutionServiceCard
                      key={detail.id}
                      detail={detail}
                      expanded={expandedDetailId === detail.id}
                      onToggle={() =>
                        setExpandedDetailId((current) =>
                          current === detail.id ? null : detail.id,
                        )
                      }
                      onSave={async (detailId, values) => {
                        await updateDetailMutation.mutateAsync({
                          id: detailId,
                          values,
                        });
                      }}
                      saving={updateDetailMutation.isPending}
                      onUploadAttachment={async (serviceDetailId, values) => {
                        await uploadAttachmentMutation.mutateAsync({
                          serviceDetailId,
                          values,
                        });
                      }}
                      uploadingAttachment={uploadAttachmentMutation.isPending}
                      onDeleteAttachment={async (attachmentId) => {
                        await deleteAttachmentMutation.mutateAsync(attachmentId);
                      }}
                      deletingAttachment={deleteAttachmentMutation.isPending}
                      readOnly={!canEditExecution}
                    />
                  ))}
                </div>
              )
            ) : (
              <Card>
                <CardContent className="py-8 text-sm text-[var(--lux-text-secondary)]">
                  {t("execution.noServiceDetails", {
                    defaultValue: "No execution service details have been initialized yet.",
                  })}
                </CardContent>
              </Card>
            )}
          </section>
        </div>
      </PageContainer>

      <ConfirmDialog
        open={Boolean(pendingWorkflowAction)}
        onOpenChange={(open) => !open && setPendingWorkflowAction(null)}
        title={
          pendingWorkflowAction?.confirmTitle ||
          t("execution.confirmWorkflowAction", {
            defaultValue: "Confirm Execution Action",
          })
        }
        message={
          pendingWorkflowAction?.confirmMessage ||
          pendingWorkflowAction?.description ||
          t("execution.confirmWorkflowActionHint", {
            defaultValue: "This execution brief will move to the selected workflow stage.",
          })
        }
        confirmLabel={
          pendingWorkflowAction?.label ||
          t("common.confirm", { defaultValue: "Confirm" })
        }
        cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
        onConfirm={() => {
          if (!pendingWorkflowAction?.nextStatus) {
            return;
          }

          workflowActionMutation.mutate(
            { status: pendingWorkflowAction.nextStatus as ExecutionBriefStatus },
            {
              onSettled: () => setPendingWorkflowAction(null),
            },
          );
        }}
        isPending={workflowActionMutation.isPending}
      />
    </ProtectedComponent>
  );
};

export default ExecutionBriefDetailsPage;
