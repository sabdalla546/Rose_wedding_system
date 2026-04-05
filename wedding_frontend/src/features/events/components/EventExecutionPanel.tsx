import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ChevronDown,
  ClipboardList,
  FileText,
  Handshake,
  Loader2,
  Save,
  Sparkles,
} from "lucide-react";

import { SectionCard } from "@/components/shared/section-card";
import { FormFeedbackBanner } from "@/components/shared/form-feedback-banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EventEmptyState } from "@/pages/events/_components/EventDetailsPrimitives";
import { EventStatusBadge } from "@/pages/events/_components/eventStatusBadge";
import { useContracts } from "@/hooks/contracts/useContracts";
import { useEvent } from "@/hooks/events/useEvents";
import { useExecutionBriefByEvent } from "@/hooks/execution/useExecutionBriefs";
import { useHasPermission } from "@/hooks/useHasPermission";
import {
  useCreateExecutionBrief,
  useDeleteExecutionAttachment,
  useUpdateExecutionBrief,
  useUpdateExecutionServiceDetail,
  useUploadExecutionBriefAttachment,
  useUploadExecutionServiceDetailAttachment,
} from "@/hooks/execution/useExecutionMutations";
import { useQuotations } from "@/hooks/quotations/useQuotations";
import { getExecutionBriefStatusLabel } from "@/pages/execution/adapters";
import { getExecutionLockMessage } from "@/lib/workflow/workflow";
import type {
  ExecutionBriefStatus,
  ExecutionServiceDetailStatus,
  UploadExecutionAttachmentPayload,
} from "@/pages/execution/types";
import {
  AttachmentGallery,
  AttachmentUploader,
  ExecutionMetricCard,
  ServiceDetailEditorCard,
} from "./index";
import { cn } from "@/lib/utils";

type Props = {
  eventId: number | string;
};

type BriefFormState = {
  status: ExecutionBriefStatus;
  generalNotes: string;
  clientNotes: string;
  designerNotes: string;
  approvedByClientAt: string;
  handedToExecutorAt: string;
};

const textareaClassName =
  "min-h-[110px] w-full rounded-[22px] border px-4 py-3 text-sm text-[var(--lux-text)] placeholder:text-[var(--lux-text-muted)] outline-none transition-all focus:border-[var(--lux-gold-border)] focus:ring-2 focus:ring-[var(--lux-gold-glow)] read-only:cursor-default read-only:border-dashed read-only:border-[var(--lux-row-border)] read-only:bg-[var(--lux-row-surface)] read-only:text-[var(--lux-text-secondary)] read-only:focus:border-[var(--lux-control-border)] read-only:focus:ring-0";

const createBriefFormState = (
  brief?: {
    status?: ExecutionBriefStatus;
    generalNotes?: string | null;
    clientNotes?: string | null;
    designerNotes?: string | null;
    approvedByClientAt?: string | null;
    handedToExecutorAt?: string | null;
  } | null,
): BriefFormState => ({
  status: brief?.status ?? "draft",
  generalNotes: brief?.generalNotes ?? "",
  clientNotes: brief?.clientNotes ?? "",
  designerNotes: brief?.designerNotes ?? "",
  approvedByClientAt: brief?.approvedByClientAt
    ? brief.approvedByClientAt.slice(0, 10)
    : "",
  handedToExecutorAt: brief?.handedToExecutorAt
    ? brief.handedToExecutorAt.slice(0, 10)
    : "",
});

export function EventExecutionPanel({ eventId }: Props) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  const canManageExecution = useHasPermission("events.update");

  const numericEventId =
    typeof eventId === "number" ? eventId : Number(eventId || 0);

  const { data: event, isLoading: eventLoading } = useEvent(String(eventId));
  const {
    data: executionBrief,
    isLoading: briefLoading,
    isError: briefError,
  } = useExecutionBriefByEvent(eventId);

  const createExecutionBriefMutation = useCreateExecutionBrief();
  const updateExecutionBriefMutation = useUpdateExecutionBrief(
    executionBrief?.id,
    { eventId },
  );
  const updateExecutionServiceDetailMutation = useUpdateExecutionServiceDetail({
    briefId: executionBrief?.id,
    eventId,
  });
  const uploadExecutionBriefAttachmentMutation =
    useUploadExecutionBriefAttachment({
      briefId: executionBrief?.id,
      eventId,
    });
  const uploadExecutionServiceDetailAttachmentMutation =
    useUploadExecutionServiceDetailAttachment({
      briefId: executionBrief?.id,
      eventId,
    });
  const deleteExecutionAttachmentMutation = useDeleteExecutionAttachment({
    briefId: executionBrief?.id,
    eventId,
  });

  const { data: quotationsResponse } = useQuotations({
    currentPage: 1,
    itemsPerPage: 100,
    searchQuery: "",
    eventId: String(eventId ?? ""),
    status: "all",
    issueDateFrom: "",
    issueDateTo: "",
  });

  const { data: contractsResponse } = useContracts({
    currentPage: 1,
    itemsPerPage: 200,
    searchQuery: "",
    quotationId: "",
    eventId: String(eventId ?? ""),
    status: "all",
    signedDateFrom: "",
    signedDateTo: "",
  });

  const quotations = useMemo(
    () =>
      [...(quotationsResponse?.data ?? [])].sort((left, right) => {
        const leftTime = new Date(left.issueDate).getTime();
        const rightTime = new Date(right.issueDate).getTime();

        if (leftTime !== rightTime) return rightTime - leftTime;
        return right.id - left.id;
      }),
    [quotationsResponse?.data],
  );

  const contracts = useMemo(
    () =>
      [...(contractsResponse?.data ?? [])].sort((left, right) => {
        const leftTime = new Date(left.signedDate).getTime();
        const rightTime = new Date(right.signedDate).getTime();

        if (leftTime !== rightTime) return rightTime - leftTime;
        return right.id - left.id;
      }),
    [contractsResponse?.data],
  );

  const latestQuotation = quotations[0] ?? null;
  const latestContract = contracts[0] ?? null;

  const [briefForm, setBriefForm] = useState<BriefFormState>(() =>
    createBriefFormState(null),
  );
  const [expandedDetailId, setExpandedDetailId] = useState<number | null>(null);
  const [isGeneralBriefCollapsed, setIsGeneralBriefCollapsed] = useState(false);

  useEffect(() => {
    setBriefForm(createBriefFormState(executionBrief));
  }, [executionBrief]);

  const serviceDetails = useMemo(
    () =>
      [...(executionBrief?.serviceDetails ?? [])].sort((left, right) => {
        if (left.sortOrder !== right.sortOrder) {
          return left.sortOrder - right.sortOrder;
        }

        return left.id - right.id;
      }),
    [executionBrief?.serviceDetails],
  );

  const briefAttachments =
    executionBrief?.attachments?.filter((item) => !item.serviceDetailId) ?? [];

  const attachmentsCount =
    (executionBrief?.attachments?.length ?? 0) +
    serviceDetails.reduce(
      (accumulator, item) => accumulator + (item.attachments?.length ?? 0),
      0,
    );

  const completedServiceDetailsCount = serviceDetails.filter(
    (item) => item.status === "ready" || item.status === "done",
  ).length;
  const briefLockMessage = executionBrief
    ? getExecutionLockMessage(executionBrief.status)
    : null;
  const canEditBrief = canManageExecution && !briefLockMessage;

  useEffect(() => {
    if (
      expandedDetailId !== null &&
      !serviceDetails.some((detail) => detail.id === expandedDetailId)
    ) {
      setExpandedDetailId(null);
    }
  }, [expandedDetailId, serviceDetails]);

  const handleCreateExecutionBrief = () => {
    if (!numericEventId) return;

    createExecutionBriefMutation.mutate({
      eventId: numericEventId,
      quotationId: latestQuotation?.id ?? null,
      contractId: latestContract?.id ?? null,
      initializeFromEventServices: true,
    });
  };

  const handleSaveBrief = async () => {
    if (!executionBrief?.id) return;

    await updateExecutionBriefMutation.mutateAsync({
      status: briefForm.status,
      generalNotes: briefForm.generalNotes.trim()
        ? briefForm.generalNotes.trim()
        : null,
      clientNotes: briefForm.clientNotes.trim()
        ? briefForm.clientNotes.trim()
        : null,
      designerNotes: briefForm.designerNotes.trim()
        ? briefForm.designerNotes.trim()
        : null,
      approvedByClientAt: briefForm.approvedByClientAt || null,
      handedToExecutorAt: briefForm.handedToExecutorAt || null,
    });
  };

  const handleSaveServiceDetail = async (
    detailId: number,
    values: {
      templateKey: string;
      status: ExecutionServiceDetailStatus;
      sortOrder: number;
      notes: string | null;
      executorNotes: string | null;
      detailsJson: Record<string, unknown> | null;
    },
  ) => {
    await updateExecutionServiceDetailMutation.mutateAsync({
      id: detailId,
      values,
    });
  };

  const handleUploadBriefAttachment = async (
    values: UploadExecutionAttachmentPayload,
  ) => {
    if (!executionBrief?.id) return;

    await uploadExecutionBriefAttachmentMutation.mutateAsync({
      briefId: executionBrief.id,
      values,
    });
  };

  const handleUploadServiceDetailAttachment = async (
    serviceDetailId: number,
    values: UploadExecutionAttachmentPayload,
  ) => {
    await uploadExecutionServiceDetailAttachmentMutation.mutateAsync({
      serviceDetailId,
      values,
    });
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    await deleteExecutionAttachmentMutation.mutateAsync(attachmentId);
  };

  if (eventLoading) {
    return (
      <EventEmptyState
        title={t("designerDetails.loadingEventTitle", {
          defaultValue: "Loading event...",
        })}
        description={t("designerDetails.loadingEventDescription", {
          defaultValue: "Please wait while the current event is being loaded.",
        })}
      />
    );
  }

  if (!event) {
    return (
      <EventEmptyState
        title={t("designerDetails.loadEventFailedTitle", {
          defaultValue: "Unable to load event",
        })}
        description={t("designerDetails.loadEventFailedDescription", {
          defaultValue:
            "We could not load the selected event. Please try another one.",
        })}
      />
    );
  }

  if (!latestContract) {
    return (
      <SectionCard className="space-y-5">
        <div className={cn("space-y-2", isRtl ? "text-right" : "text-left")}>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--lux-gold-border)] bg-[var(--lux-control-hover)] px-4 py-2 text-xs font-semibold text-[var(--lux-gold)]">
            <ClipboardList className="h-4 w-4" />
            {t("events.executionTab", { defaultValue: "Execution" })}
          </div>

          <h3 className="text-2xl font-semibold text-[var(--lux-heading)]">
            {t("execution.workspaceTitle", {
              defaultValue: "Execution Workspace",
            })}
          </h3>
          <p className="max-w-3xl text-sm leading-7 text-[var(--lux-text-secondary)]">
            {t("execution.workspaceDescription", {
              defaultValue:
                "Execution details are prepared after at least one contract is created for the event.",
            })}
          </p>
        </div>

        <EventEmptyState
          title={t("execution.noContractTitle", {
            defaultValue: "No contract found for this event",
          })}
          description={t("execution.noContractDescription", {
            defaultValue:
              "Create a contract first, then return here to generate execution details for the designer and executor.",
          })}
          action={
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)] px-4 py-2 text-sm text-[var(--lux-text-secondary)]">
              <Handshake className="h-4 w-4" />
              {t("execution.contractRequiredHint", {
                defaultValue: "Execution starts after contract creation",
              })}
            </div>
          }
        />
      </SectionCard>
    );
  }

  if (briefLoading) {
    return (
      <SectionCard className="space-y-4">
        <div className="flex items-center gap-3 text-[var(--lux-text-secondary)]">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>
            {t("execution.loadingBrief", {
              defaultValue: "Loading execution brief...",
            })}
          </span>
        </div>
      </SectionCard>
    );
  }

  if (!executionBrief || briefError) {
    return (
      <SectionCard className="space-y-6">
        <div className={cn("space-y-2", isRtl ? "text-right" : "text-left")}>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--lux-gold-border)] bg-[var(--lux-control-hover)] px-4 py-2 text-xs font-semibold text-[var(--lux-gold)]">
            <Sparkles className="h-4 w-4" />
            {t("events.executionTab", { defaultValue: "Execution" })}
          </div>

          <h3 className="text-2xl font-semibold text-[var(--lux-heading)]">
            {t("execution.createBriefTitle", {
              defaultValue: "Create execution brief",
            })}
          </h3>
          <p className="max-w-3xl text-sm leading-7 text-[var(--lux-text-secondary)]">
            {t("execution.createBriefDescription", {
              defaultValue:
                "Generate the first execution brief from the event services after the agreement is confirmed.",
            })}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <ExecutionMetricCard
            label={t("events.quotations", { defaultValue: "Quotations" })}
            value={quotations.length}
          />
          <ExecutionMetricCard
            label={t("events.contracts", { defaultValue: "Contracts" })}
            value={contracts.length}
          />
          <ExecutionMetricCard
            label={t("execution.readyToGenerate", {
              defaultValue: "Ready to generate",
            })}
            value={latestContract ? "Yes" : "No"}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={handleCreateExecutionBrief}
            disabled={!canManageExecution || createExecutionBriefMutation.isPending}
          >
            {createExecutionBriefMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ClipboardList className="h-4 w-4" />
            )}
            {createExecutionBriefMutation.isPending
              ? t("common.processing", { defaultValue: "Processing..." })
              : t("execution.createBriefAction", {
                  defaultValue: "Create execution brief",
                })}
          </Button>

          {latestContract ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)] px-4 py-2 text-sm text-[var(--lux-text-secondary)]">
              <FileText className="h-4 w-4" />
              {t("execution.usingLatestContract", {
                defaultValue: "Using latest contract",
              })}
              <span className="font-semibold text-[var(--lux-heading)]">
                #{latestContract.id}
              </span>
            </div>
          ) : null}
        </div>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-6">
      <SectionCard className="space-y-5">
        {!canManageExecution ? (
          <FormFeedbackBanner
            title={t("execution.readOnlyAccessTitle", {
              defaultValue: "Read-only execution access",
            })}
            message={t("execution.readOnlyAccessHint", {
              defaultValue:
                "You can review the execution brief here, but structural edits, uploads, and workflow changes require event update permission.",
            })}
          />
        ) : null}

        {briefLockMessage ? (
          <FormFeedbackBanner
            tone="warning"
            title={t("execution.lockedTitle", {
              defaultValue: "Execution brief locked",
            })}
            message={briefLockMessage}
          />
        ) : null}

        <div
          className={cn(
            "flex flex-col gap-4 xl:items-start xl:justify-between",
            "xl:flex-row",
          )}
        >
          <div className={cn("space-y-2", isRtl ? "text-right" : "text-left")}>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--lux-gold-border)] bg-[var(--lux-control-hover)] px-4 py-2 text-xs font-semibold text-[var(--lux-gold)]">
              <ClipboardList className="h-4 w-4" />
              {t("events.executionTab", { defaultValue: "Execution" })}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-2xl font-semibold text-[var(--lux-heading)]">
                {t("execution.briefReadyTitle", {
                  defaultValue: "Execution brief is ready",
                })}
              </h3>
              <EventStatusBadge status={event.status} />
            </div>

            <p className="max-w-3xl text-sm leading-7 text-[var(--lux-text-secondary)]">
              {t("execution.briefReadyDescription", {
                defaultValue:
                  "Edit the general execution brief, fill each service block, and upload visual references for the executor.",
              })}
            </p>
          </div>

          <div className="rounded-[22px] border border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)] px-4 py-3">
            <p className="text-xs font-semibold text-[var(--lux-text-muted)]">
              {t("execution.briefStatus", { defaultValue: "Brief status" })}
            </p>
            <p className="mt-2 text-sm font-semibold text-[var(--lux-heading)]">
              {getExecutionBriefStatusLabel(executionBrief.status, t)}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <ExecutionMetricCard
            label={t("execution.serviceBlocks", {
              defaultValue: "Service blocks",
            })}
            value={serviceDetails.length}
          />
          <ExecutionMetricCard
            label={t("execution.readyBlocks", {
              defaultValue: "Ready blocks",
            })}
            value={completedServiceDetailsCount}
          />
          <ExecutionMetricCard
            label={t("execution.attachments", {
              defaultValue: "Attachments",
            })}
            value={attachmentsCount}
          />
          <ExecutionMetricCard
            label={t("events.contracts", { defaultValue: "Contracts" })}
            value={contracts.length}
          />
        </div>
      </SectionCard>

      <SectionCard className="space-y-5">
        <div
          className={cn(
            "flex flex-col gap-4 sm:items-start sm:justify-between",
            isRtl ? "sm:flex-row-reverse" : "sm:flex-row",
          )}
        >
          <div className={cn("space-y-2", isRtl ? "text-right" : "text-left")}>
            <h4 className="text-lg font-semibold text-[var(--lux-heading)]">
              {t("execution.generalBriefSection", {
                defaultValue: "General brief details",
              })}
            </h4>
            <p className="text-sm text-[var(--lux-text-secondary)]">
              {t("execution.generalBriefHint", {
                defaultValue:
                  "These notes describe the event at a high level before filling service-specific execution blocks.",
              })}
            </p>
          </div>

          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              setIsGeneralBriefCollapsed((current) => !current)
            }
            className="min-w-[180px]"
          >
            {isGeneralBriefCollapsed
              ? t("execution.expandGeneralBrief", {
                  defaultValue: "Show general brief",
                })
              : t("execution.collapseGeneralBrief", {
                  defaultValue: "Hide general brief",
                })}
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                isGeneralBriefCollapsed ? "rotate-180" : "",
              )}
            />
          </Button>
        </div>

        {!isGeneralBriefCollapsed ? (
          <div
            dir={i18n.dir()}
            className={cn("space-y-5", isRtl ? "text-right" : "text-left")}
          >
            <div className="grid gap-4 md:grid-cols-3">
              <label className="space-y-2">
                <span className="text-sm font-medium text-[var(--lux-text)]">
                  {t("execution.briefStatus", { defaultValue: "Brief status" })}
                </span>
                <Select
                  value={briefForm.status}
                  disabled={!canEditBrief}
                  onValueChange={(value) =>
                    setBriefForm((current) => ({
                      ...current,
                      status: value as ExecutionBriefStatus,
                    }))
                  }
                >
                  <SelectTrigger
                    dir={i18n.dir()}
                    className={
                      isRtl
                        ? "text-right [&_span]:text-right"
                        : "text-left [&_span]:text-left"
                    }
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent dir={i18n.dir()}>
                    {(
                      [
                        "draft",
                        "under_review",
                        "approved",
                        "handed_to_executor",
                        "in_progress",
                        "completed",
                      ] as const
                    ).map((statusValue) => (
                      <SelectItem key={statusValue} value={statusValue}>
                        {getExecutionBriefStatusLabel(statusValue, t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-[var(--lux-text)]">
                  {t("execution.approvedByClientAt", {
                    defaultValue: "Approved by client on",
                  })}
                </span>
                <Input
                  type="date"
                  dir={i18n.dir()}
                  lang={isRtl ? "ar" : "en"}
                  className={isRtl ? "text-right" : "text-left"}
                  value={briefForm.approvedByClientAt}
                  readOnly={!canEditBrief}
                  onChange={(event) =>
                    setBriefForm((current) => ({
                      ...current,
                      approvedByClientAt: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-[var(--lux-text)]">
                  {t("execution.handedToExecutorAt", {
                    defaultValue: "Handed to executor on",
                  })}
                </span>
                <Input
                  type="date"
                  dir={i18n.dir()}
                  lang={isRtl ? "ar" : "en"}
                  className={isRtl ? "text-right" : "text-left"}
                  value={briefForm.handedToExecutorAt}
                  readOnly={!canEditBrief}
                  onChange={(event) =>
                    setBriefForm((current) => ({
                      ...current,
                      handedToExecutorAt: event.target.value,
                    }))
                  }
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-[var(--lux-text)]">
                  {t("execution.generalNotes", {
                    defaultValue: "General notes",
                  })}
                </span>
                <textarea
                  className={cn(
                    textareaClassName,
                    isRtl ? "text-right" : "text-left",
                  )}
                  value={briefForm.generalNotes}
                  readOnly={!canEditBrief}
                  placeholder={t("execution.generalNotesPlaceholder", {
                    defaultValue:
                      "Overall execution notes, wedding flow, and shared context...",
                  })}
                  onChange={(event) =>
                    setBriefForm((current) => ({
                      ...current,
                      generalNotes: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-[var(--lux-text)]">
                  {t("execution.clientNotes", {
                    defaultValue: "Client notes",
                  })}
                </span>
                <textarea
                  className={cn(
                    textareaClassName,
                    isRtl ? "text-right" : "text-left",
                  )}
                  value={briefForm.clientNotes}
                  readOnly={!canEditBrief}
                  placeholder={t("execution.clientNotesPlaceholder", {
                    defaultValue:
                      "Client preferences, approvals, and special requests...",
                  })}
                  onChange={(event) =>
                    setBriefForm((current) => ({
                      ...current,
                      clientNotes: event.target.value,
                    }))
                  }
                />
              </label>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-[var(--lux-text)]">
                {t("execution.designerNotes", {
                  defaultValue: "Designer notes",
                })}
              </span>
              <textarea
                className={cn(
                  textareaClassName,
                  isRtl ? "text-right" : "text-left",
                )}
                value={briefForm.designerNotes}
                readOnly={!canEditBrief}
                placeholder={t("execution.designerNotesPlaceholder", {
                  defaultValue:
                    "Internal design notes, execution intent, and setup direction...",
                })}
                onChange={(event) =>
                  setBriefForm((current) => ({
                    ...current,
                    designerNotes: event.target.value,
                  }))
                }
              />
            </label>

            <div
              className={cn(
                "flex items-center",
                isRtl ? "justify-start" : "justify-end",
              )}
            >
              {canEditBrief ? (
                <Button
                  onClick={handleSaveBrief}
                  disabled={updateExecutionBriefMutation.isPending}
                >
                  {updateExecutionBriefMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {updateExecutionBriefMutation.isPending
                    ? t("common.processing", {
                        defaultValue: "Processing...",
                      })
                    : t("common.saveChanges", {
                        defaultValue: "Save Changes",
                      })}
                </Button>
              ) : null}
            </div>

            <AttachmentUploader
              title={t("execution.briefAttachmentsUploader", {
                defaultValue: "Upload general event attachments",
              })}
              buttonLabel={t("execution.uploadAttachment", {
                defaultValue: "Upload attachment",
              })}
              pending={uploadExecutionBriefAttachmentMutation.isPending}
              readOnly={!canEditBrief}
              onUpload={handleUploadBriefAttachment}
            />

            <AttachmentGallery
              attachments={briefAttachments}
              title={t("execution.briefAttachments", {
                defaultValue: "General brief attachments",
              })}
              emptyText={t("execution.noBriefAttachments", {
                defaultValue: "No general attachments uploaded yet.",
              })}
              deleting={deleteExecutionAttachmentMutation.isPending}
              allowDelete={canEditBrief}
              onDelete={handleDeleteAttachment}
            />
          </div>
        ) : null}
      </SectionCard>

      <div className="space-y-5">
        <div className={cn("space-y-2", isRtl ? "text-right" : "text-left")}>
          <h4 className="text-lg font-semibold text-[var(--lux-heading)]">
            {t("execution.serviceDetailsEditor", {
              defaultValue: "Execution service details",
            })}
          </h4>
          <p className="text-sm text-[var(--lux-text-secondary)]">
            {t("execution.serviceDetailsEditorHint", {
              defaultValue:
                "Fill each service block with the detailed instructions and upload the visual references the executor needs.",
            })}
          </p>
          <p className="text-xs text-[var(--lux-text-muted)]">
            {t("execution.serviceBoardHint", {
              defaultValue:
                "Open a card to edit one execution block at a time while keeping the rest of the board visual and compact.",
            })}
          </p>
        </div>

        {serviceDetails.length ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {serviceDetails.map((detail) => (
              <ServiceDetailEditorCard
                key={detail.id}
                detail={detail}
                expanded={expandedDetailId === detail.id}
                onToggle={() =>
                  setExpandedDetailId((current) =>
                    current === detail.id ? null : detail.id,
                  )
                }
                saving={updateExecutionServiceDetailMutation.isPending}
                onSave={handleSaveServiceDetail}
                onUploadAttachment={handleUploadServiceDetailAttachment}
                uploadingAttachment={
                  uploadExecutionServiceDetailAttachmentMutation.isPending
                }
                onDeleteAttachment={handleDeleteAttachment}
                deletingAttachment={deleteExecutionAttachmentMutation.isPending}
                readOnly={!canEditBrief}
              />
            ))}
          </div>
        ) : (
          <EventEmptyState
            title={t("execution.noServiceDetailsTitle", {
              defaultValue: "No execution service details yet",
            })}
            description={t("execution.noServiceDetailsDescription", {
              defaultValue:
                "The brief exists, but no execution service blocks are available yet.",
            })}
            className="py-8"
          />
        )}
      </div>
    </div>
  );
}
