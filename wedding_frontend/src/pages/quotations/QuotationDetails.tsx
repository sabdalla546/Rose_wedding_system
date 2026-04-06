import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import {
  ArrowRight,
  CheckCheck,
  Clock3,
  Download,
  Edit,
  FilePlus2,
  FileText,
  Trash2,
  XCircle,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { PageContainer } from "@/components/layout/page-container";
import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ConfirmDialog from "@/components/ui/confirmDialog";
import { useContracts } from "@/hooks/contracts/useContracts";
import { useDeleteQuotation } from "@/hooks/quotations/useDeleteQuotation";
import { useQuotationWorkflowAction } from "@/hooks/quotations/useQuotationWorkflowActions";
import { useQuotation } from "@/hooks/quotations/useQuotations";
import { useToast } from "@/hooks/use-toast";
import api, { getApiErrorMessage } from "@/lib/axios";
import {
  canCreateContractFromQuotation,
  getQuotationLockMessage,
  getQuotationWorkflowActions,
  type WorkflowActionDefinition,
} from "@/lib/workflow/workflow";
import { getEventDisplayTitle } from "@/pages/events/adapters";

import {
  formatMoney,
  getQuotationDisplayNumber,
  getQuotationItemDisplayName,
  toNumberValue,
} from "./adapters";
import { QuotationStatusBadge } from "./_components/quotationStatusBadge";
import type { QuotationItem } from "./types";

const isServiceSummaryItem = (item: QuotationItem) =>
  item.itemType === "service" && item.category === "service_summary";

const getQuotationRowKindLabel = (
  item: QuotationItem,
  t: (key: string, options?: Record<string, unknown>) => string,
) => {
  if (item.itemType === "vendor") {
    return t("quotations.vendor", { defaultValue: "شركة" });
  }

  if (isServiceSummaryItem(item)) {
    return t("quotations.totalServices", { defaultValue: "إجمالي الخدمات" });
  }

  return t("quotations.service", { defaultValue: "خدمة" });
};

const getQuotationItemPrice = (item: QuotationItem) =>
  item.totalPrice ?? item.unitPrice ?? 0;

function DetailItem({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
        {label}
      </p>
      <p className="text-sm text-[var(--lux-text)]">{value || "-"}</p>
    </div>
  );
}

function ItemKindBadge({
  item,
  t,
}: {
  item: QuotationItem;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  const isVendor = item.itemType === "vendor";
  const isSummary = isServiceSummaryItem(item);

  return (
    <span
      className="inline-flex rounded-full border px-3 py-1 text-xs font-semibold"
      style={{
        borderColor: isVendor || isSummary
          ? "var(--lux-gold-border)"
          : "var(--lux-row-border)",
        color: isVendor || isSummary
          ? "var(--lux-gold)"
          : "var(--lux-text-secondary)",
      }}
    >
      {getQuotationRowKindLabel(item, t)}
    </span>
  );
}

const getLocalizedQuotationWorkflowAction = (
  action: WorkflowActionDefinition,
  t: (key: string, options?: Record<string, unknown>) => string,
): Partial<
  Pick<
    WorkflowActionDefinition,
    "label" | "description" | "confirmTitle" | "confirmMessage"
  >
> => {
  switch (action.key) {
    case "send_quotation":
      return {
        label: t("quotations.sendQuotationAction", {
          defaultValue: "Send Quotation",
        }),
        description: t("quotations.sendQuotationActionHint", {
          defaultValue: "Mark the quotation as sent to the customer.",
        }),
      };
    case "approve_quotation":
      return {
        label: t("quotations.approveQuotationAction", {
          defaultValue: "Approve Quotation",
        }),
        description: t("quotations.approveQuotationActionHint", {
          defaultValue: "Make this quotation the approved commercial basis.",
        }),
      };
    case "reject_quotation":
      return {
        label: t("quotations.rejectQuotationAction", {
          defaultValue: "Reject Quotation",
        }),
        description: t("quotations.rejectQuotationActionHint", {
          defaultValue: "Record that the quotation was rejected.",
        }),
        confirmTitle: t("quotations.rejectQuotationConfirmTitle", {
          defaultValue: "Reject quotation?",
        }),
        confirmMessage: t("quotations.rejectQuotationConfirmMessage", {
          defaultValue: "This quotation will be marked as rejected.",
        }),
      };
    case "expire_quotation":
      return {
        label: t("quotations.expireQuotationAction", {
          defaultValue: "Expire Quotation",
        }),
        description: t("quotations.expireQuotationActionHint", {
          defaultValue: "Mark the quotation as expired.",
        }),
        confirmTitle: t("quotations.expireQuotationConfirmTitle", {
          defaultValue: "Expire quotation?",
        }),
        confirmMessage: t("quotations.expireQuotationConfirmMessage", {
          defaultValue: "This quotation will be marked as expired.",
        }),
      };
    case "supersede_quotation":
      return {
        label: t("quotations.supersedeQuotationAction", {
          defaultValue: "Supersede Quotation",
        }),
        description: t("quotations.supersedeQuotationActionHint", {
          defaultValue:
            "Retire this quotation in favor of a newer commercial version.",
        }),
        confirmTitle: t("quotations.supersedeQuotationConfirmTitle", {
          defaultValue: "Supersede quotation?",
        }),
        confirmMessage: t("quotations.supersedeQuotationConfirmMessage", {
          defaultValue:
            "This quotation will no longer be the active commercial option.",
        }),
      };
    default:
      return {};
  }
};

const QuotationDetailsPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id } = useParams();
  const { data: quotation, isLoading } = useQuotation(id);
  const { data: downstreamContractsResponse } = useContracts({
    currentPage: 1,
    itemsPerPage: 200,
    searchQuery: "",
    quotationId: id ?? "",
    eventId: "",
    status: "all",
    signedDateFrom: "",
    signedDateTo: "",
  });
  const deleteMutation = useDeleteQuotation();
  const workflowActionMutation = useQuotationWorkflowAction(
    quotation?.id,
    quotation?.eventId,
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [pendingWorkflowAction, setPendingWorkflowAction] =
    useState<WorkflowActionDefinition | null>(null);
  const dateLocale = i18n.language === "ar" ? ar : enUS;
  const sortedItems = [...(quotation?.items ?? [])].sort(
    (left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0),
  );
  const serviceItems = sortedItems.filter((item) => item.itemType === "service");
  const vendorItems = sortedItems.filter((item) => item.itemType === "vendor");
  const vendorTotalAmount = vendorItems.reduce((sum, item) => {
    return sum + (toNumberValue(getQuotationItemPrice(item)) ?? 0);
  }, 0);
  const pairedItems = Array.from(
    { length: Math.max(serviceItems.length, vendorItems.length) },
    (_, index) => ({
      serviceItem: serviceItems[index],
      vendorItem: vendorItems[index],
    }),
  );
  const downstreamContracts = [...(downstreamContractsResponse?.data ?? [])].sort(
    (left, right) => {
      const leftTime = new Date(left.signedDate).getTime();
      const rightTime = new Date(right.signedDate).getTime();

      if (leftTime !== rightTime) {
        return rightTime - leftTime;
      }

      return right.id - left.id;
    },
  );
  const latestDownstreamContract = downstreamContracts[0] ?? null;

  const handleDownloadPdf = async () => {
    if (!quotation || isDownloadingPdf) {
      return;
    }

    setIsDownloadingPdf(true);

    try {
      const response = await api.get(`/quotations/${quotation.id}/pdf`, {
        responseType: "blob",
      });

      const contentDisposition = response.headers["content-disposition"];
      const fileNameMatch = typeof contentDisposition === "string"
        ? contentDisposition.match(/filename="?([^"]+)"?/)
        : null;
      const fallbackName = `quotation-${quotation.id}.pdf`;
      const fileName = fileNameMatch?.[1] || fallbackName;
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("quotations.pdfDownloadSuccess", {
          defaultValue: "Quotation PDF downloaded successfully",
        }),
      });
    } catch (error) {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("quotations.pdfDownloadFailed", {
            defaultValue: "Failed to download quotation PDF",
          }),
        ),
      });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-sm text-[var(--lux-text-secondary)]">
          {t("common.loading", { defaultValue: "Loading..." })}
        </div>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-sm text-[var(--lux-text-secondary)]">
          {t("common.noResultsTitle", { defaultValue: "No results found" })}
        </div>
      </div>
    );
  }

  const quotationLockMessage = getQuotationLockMessage(quotation.status)
    ? t("quotations.lockedMessage", {
        defaultValue:
          "Commercial fields are read-only because this quotation is approved or superseded.",
      })
    : null;
  const canCreateContract = canCreateContractFromQuotation(quotation.status);
  const workflowActionIcons = {
    sent: <ArrowRight className="h-4 w-4" />,
    approved: <CheckCheck className="h-4 w-4" />,
    rejected: <XCircle className="h-4 w-4" />,
    expired: <Clock3 className="h-4 w-4" />,
    superseded: <ArrowRight className="h-4 w-4" />,
  } as const;
  const workflowActions = getQuotationWorkflowActions(quotation.status).map(
    (action) => {
      const localizedAction = {
        ...action,
        ...getLocalizedQuotationWorkflowAction(action, t),
      };

      return {
        ...localizedAction,
        icon: action.nextStatus
          ? workflowActionIcons[action.nextStatus as keyof typeof workflowActionIcons]
          : undefined,
        loading:
          workflowActionMutation.isPending &&
          action.nextStatus === workflowActionMutation.variables?.status,
        onClick: () => {
          if (localizedAction.confirmTitle || localizedAction.confirmMessage) {
            setPendingWorkflowAction(localizedAction);
            return;
          }

          if (action.nextStatus) {
            workflowActionMutation.mutate({
              status: action.nextStatus as typeof quotation.status,
            });
          }
        },
      };
    },
  );
  const nextSteps: WorkflowNextStepItem[] = [];
  const timelineItems: WorkflowTimelineItem[] = [
    {
      id: "prepared",
      title: t("quotations.timelinePrepared", {
        defaultValue: "Quotation prepared",
      }),
      description: t("quotations.timelinePreparedHint", {
        defaultValue: "The commercial document was created for this event.",
      }),
      timestamp: quotation.createdAt ?? quotation.issueDate,
      status: "done",
    },
  ];

  if (latestDownstreamContract) {
    nextSteps.push({
      id: "contract-open",
      title: t("quotations.contractLinkedNext", {
        defaultValue: "Continue from the linked contract",
      }),
      description: t("quotations.contractLinkedNextHint", {
        defaultValue:
          "This quotation already has a downstream contract. Continue commitment and execution follow-up there.",
      }),
      tone: "success",
      action: (
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(`/contracts/${latestDownstreamContract.id}`)}
        >
          <FileText className="h-4 w-4" />
          {t("quotations.openContract", {
            defaultValue: "Open Contract",
          })}
        </Button>
      ),
    });
    timelineItems.push({
      id: "contract-created",
      title: t("quotations.timelineContractCreated", {
        defaultValue: "Contract created from quotation",
      }),
      description: t("quotations.timelineContractCreatedHint", {
        defaultValue: "Downstream contract {{contract}} now carries the commitment workflow.",
        contract:
          latestDownstreamContract.contractNumber ||
          t("quotations.contractReference", {
            defaultValue: "Contract #{{id}}",
            id: latestDownstreamContract.id,
          }),
      }),
      timestamp:
        latestDownstreamContract.createdAt ?? latestDownstreamContract.signedDate,
      status: "done",
    });
  } else if (canCreateContract) {
    nextSteps.push({
      id: "create-contract",
      title: t("quotations.createContractNext", {
        defaultValue: "Create the contract",
      }),
      description: t("quotations.createContractNextHint", {
        defaultValue:
          "The quotation is approved, so the next operational step is to issue a contract from this commercial version.",
      }),
      tone: "default",
      action: (
        <Button
          type="button"
          onClick={() =>
            navigate(`/contracts/create?mode=from-quotation&quotationId=${quotation.id}`)
          }
        >
          <FilePlus2 className="h-4 w-4" />
          {t("quotations.createContract", {
            defaultValue: "Create Contract",
          })}
        </Button>
      ),
    });
  } else if (quotation.status === "sent") {
    nextSteps.push({
      id: "review-response",
      title: t("quotations.awaitingDecisionNext", {
        defaultValue: "Capture the customer decision",
      }),
      description: t("quotations.awaitingDecisionNextHint", {
        defaultValue:
          "Use the workflow actions above to approve, reject, expire, or supersede this quotation once the customer responds.",
      }),
      tone: "warning",
    });
  } else if (quotation.status === "draft") {
    nextSteps.push({
      id: "send-quotation",
      title: t("quotations.sendNext", {
        defaultValue: "Send the quotation",
      }),
      description: t("quotations.sendNextHint", {
        defaultValue:
          "This quotation is still a draft. Send it before it can move into approval or rejection.",
      }),
      tone: "warning",
    });
  }

  if (quotation.event) {
    timelineItems.push({
      id: "event-linked",
      title: t("quotations.timelineEventLinked", {
        defaultValue: "Linked to source event",
      }),
      description: getEventDisplayTitle(quotation.event),
      timestamp: quotation.event.createdAt ?? quotation.event.eventDate,
      status: "done",
    });
  }

  if (quotation.status !== "draft") {
    timelineItems.push({
      id: "status-update",
      title: t("quotations.timelineStatusUpdate", {
        defaultValue: "Commercial status updated",
      }),
      description: t("quotations.timelineStatusUpdateHint", {
        defaultValue: "Current status: {{status}}",
        status: t(`quotations.status.${quotation.status}`, {
          defaultValue: quotation.status,
        }),
      }),
      timestamp: quotation.updatedAt ?? quotation.issueDate,
      status:
        quotation.status === "rejected" || quotation.status === "expired"
          ? "warning"
          : "current",
    });
  }

  return (
    <ProtectedComponent permission="quotations.read">
      <PageContainer className="pb-4 pt-4 text-foreground">
        <div dir={i18n.dir()} className="mx-auto w-full max-w-6xl space-y-6">
          <button
            type="button"
            onClick={() => navigate("/quotations")}
            className="inline-flex items-center gap-2 text-sm text-[var(--lux-text-secondary)] transition-colors hover:text-[var(--lux-gold)]"
          >
            {"<-"}{" "}
            {t("quotations.backToQuotations", {
              defaultValue: "Back to Quotations",
            })}
          </button>

          <WorkflowEntityHeader
            eyebrow={t("quotations.workflowStage", {
              defaultValue: "Commercial Snapshot",
            })}
            title={getQuotationDisplayNumber(quotation)}
            description={
              quotation.event
                ? getEventDisplayTitle(quotation.event)
                : t("quotations.eventReference", {
                    defaultValue: "Event #{{id}}",
                    id: quotation.eventId,
                  })
            }
            status={<QuotationStatusBadge status={quotation.status} />}
            actions={
              <>
                <Button
                  variant="outline"
                  onClick={handleDownloadPdf}
                  disabled={isDownloadingPdf}
                >
                  <Download className="h-4 w-4" />
                  {isDownloadingPdf
                    ? t("common.processing", { defaultValue: "Processing..." })
                    : t("quotations.downloadPdf", {
                        defaultValue: "Download PDF",
                      })}
                </Button>
                <ProtectedComponent permission="contracts.create">
                  <Button
                    variant="secondary"
                    disabled={!canCreateContract}
                    title={
                      canCreateContract
                        ? undefined
                        : t("quotations.contractRequiresApprovedQuote", {
                            defaultValue:
                              "Only approved quotations can create a contract.",
                          })
                    }
                    onClick={() =>
                      navigate(
                        `/contracts/create?mode=from-quotation&quotationId=${quotation.id}`,
                      )
                    }
                  >
                    <FilePlus2 className="h-4 w-4" />
                    {t("quotations.createContract", {
                      defaultValue: "Create Contract",
                    })}
                  </Button>
                </ProtectedComponent>
                <ProtectedComponent permission="quotations.update">
                  <Button
                    disabled={Boolean(quotationLockMessage)}
                    title={quotationLockMessage ?? undefined}
                    onClick={() => navigate(`/quotations/edit/${quotation.id}`)}
                  >
                    <Edit className="h-4 w-4" />
                    {t("common.edit", { defaultValue: "Edit" })}
                  </Button>
                </ProtectedComponent>
                <ProtectedComponent permission="quotations.delete">
                  <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                    <Trash2 className="h-4 w-4" />
                    {t("common.delete", { defaultValue: "Delete" })}
                  </Button>
                </ProtectedComponent>
              </>
            }
          />

          <WorkflowLineageCard
            title={t("quotations.workflowLineage", {
              defaultValue: "Workflow Lineage",
            })}
            items={[
              {
                label: t("quotations.sourceEvent", {
                  defaultValue: "Source Event",
                }),
                value: (
                  <button
                    type="button"
                    onClick={() => navigate(`/events/${quotation.eventId}`)}
                    className="text-sm font-medium text-[var(--lux-gold)] hover:underline"
                  >
                    {quotation.event
                      ? getEventDisplayTitle(quotation.event)
                      : t("quotations.eventReference", {
                          defaultValue: "Event #{{id}}",
                          id: quotation.eventId,
                        })}
                  </button>
                ),
                helper: quotation.event?.eventDate
                  ? format(new Date(quotation.event.eventDate), "MMM d, yyyy", {
                      locale: dateLocale,
                    })
                  : undefined,
              },
              {
                label: t("quotations.customer", { defaultValue: "Customer" }),
                value:
                  quotation.event?.customer?.fullName ||
                  quotation.customer?.fullName ||
                  t("quotations.noCustomerAvailable", {
                    defaultValue: "No customer linked",
                  }),
                helper:
                  quotation.event?.venue?.name ||
                  quotation.event?.venueNameSnapshot ||
                  undefined,
              },
              {
                label: t("quotations.commercialTotals", {
                  defaultValue: "Commercial Totals",
                }),
                value: formatMoney(quotation.totalAmount),
                helper: `${t("quotations.subtotal", {
                  defaultValue: "Subtotal",
                })}: ${formatMoney(quotation.subtotal)} • ${t("quotations.discount", {
                  defaultValue: "Discount",
                })}: ${formatMoney(quotation.discountAmount)}`,
              },
              {
                label: t("quotations.downstreamCommitment", {
                  defaultValue: "Downstream Commitment",
                }),
                value: latestDownstreamContract ? (
                  <button
                    type="button"
                    onClick={() => navigate(`/contracts/${latestDownstreamContract.id}`)}
                    className="text-sm font-medium text-[var(--lux-gold)] hover:underline"
                  >
                    {latestDownstreamContract.contractNumber ||
                      t("quotations.contractReference", {
                        defaultValue: "Contract #{{id}}",
                        id: latestDownstreamContract.id,
                      })}
                  </button>
                ) : canCreateContract
                  ? t("quotations.readyToCreateContract", {
                      defaultValue: "Ready to create a contract from this quotation.",
                    })
                  : t("quotations.noDownstreamCommitment", {
                      defaultValue:
                        "Contract creation becomes available only after approval.",
                    }),
                helper: latestDownstreamContract
                  ? t(`contracts.status.${latestDownstreamContract.status}`, {
                      defaultValue: latestDownstreamContract.status,
                    })
                  : t(`quotations.status.${quotation.status}`, {
                      defaultValue: quotation.status,
                    }),
              },
            ]}
          />

          <ProtectedComponent permission="quotations.update">
            <WorkflowActionBar
              title={t("quotations.workflowActions", {
                defaultValue: "Workflow Actions",
              })}
              description={t("quotations.workflowActionsHint", {
                defaultValue:
                  "Move this quotation through the commercial lifecycle with explicit actions instead of editing status directly.",
              })}
              actions={workflowActions}
            />
          </ProtectedComponent>

          {quotationLockMessage ? (
            <WorkflowLockBanner
              title={t("quotations.lockedTitle", {
                defaultValue: "Quotation Locked",
              })}
              message={quotationLockMessage}
            />
          ) : null}

          <div className="grid gap-4 xl:grid-cols-2">
            <WorkflowNextStepPanel
              title={t("quotations.nextStepsTitle", {
                defaultValue: "Next Step Guidance",
              })}
              description={t("quotations.nextStepsHint", {
                defaultValue:
                  "The panel below highlights the most relevant follow-up based on the quotation's current workflow state.",
              })}
              items={nextSteps}
            />

            <WorkflowTimeline
              title={t("quotations.timelineTitle", {
                defaultValue: "Timeline & Action History",
              })}
              description={t("quotations.timelineHint", {
                defaultValue:
                  "This timeline uses the timestamps currently exposed by the backend and linked records.",
              })}
              partialHistoryLabel={t("quotations.timelinePartial", {
                defaultValue:
                  "Full audit history is not available yet, so status transitions are shown from the latest reliable timestamps only.",
              })}
              items={timelineItems}
              locale={dateLocale}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>
                  {t("quotations.headerInformation", {
                    defaultValue: "Quotation Header",
                  })}
                </CardTitle>
                <CardDescription>
                  {t("quotations.headerInformationHint", {
                    defaultValue:
                      "Core quotation dates, reference number, and commercial status.",
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <DetailItem
                  label={t("quotations.quotationNumber", {
                    defaultValue: "Quotation Number",
                  })}
                  value={getQuotationDisplayNumber(quotation)}
                />
                <DetailItem
                  label={t("quotations.issueDate", {
                    defaultValue: "Issue Date",
                  })}
                  value={format(new Date(quotation.issueDate), "MMM d, yyyy", {
                    locale: dateLocale,
                  })}
                />
                <DetailItem
                  label={t("quotations.validUntil", {
                    defaultValue: "Valid Until",
                  })}
                  value={
                    quotation.validUntil
                      ? format(new Date(quotation.validUntil), "MMM d, yyyy", {
                          locale: dateLocale,
                        })
                      : "-"
                  }
                />
                <DetailItem
                  label={t("quotations.statusLabel", {
                    defaultValue: "Status",
                  })}
                  value={t(`quotations.status.${quotation.status}`, {
                    defaultValue: quotation.status,
                  })}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  {t("quotations.relatedRecords", {
                    defaultValue: "Related Records",
                  })}
                </CardTitle>
                <CardDescription>
                  {t("quotations.relatedRecordsHint", {
                    defaultValue:
                      "Linked event and customer information for this quotation.",
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <DetailItem
                  label={t("quotations.event", { defaultValue: "Event" })}
                  value={
                    quotation.event
                      ? getEventDisplayTitle(quotation.event)
                      : t("quotations.eventReference", {
                          defaultValue: "Event #{{id}}",
                          id: quotation.eventId,
                        })
                  }
                />
                <DetailItem
                  label={t("quotations.customer", { defaultValue: "Customer" })}
                  value={
                    quotation.event?.customer?.fullName ||
                    quotation.customer?.fullName
                  }
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  {t("quotations.totals", { defaultValue: "Totals" })}
                </CardTitle>
                <CardDescription>
                  {t("quotations.totalsHint", {
                    defaultValue:
                      "Commercial summary for the quotation document.",
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <DetailItem
                  label={t("quotations.subtotal", { defaultValue: "Subtotal" })}
                  value={formatMoney(quotation.subtotal)}
                />
                <DetailItem
                  label={t("quotations.discount", { defaultValue: "Discount" })}
                  value={formatMoney(quotation.discountAmount)}
                />
                <DetailItem
                  label={t("quotations.totalAmount", {
                    defaultValue: "Total Amount",
                  })}
                  value={formatMoney(quotation.totalAmount)}
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                {t("quotations.itemsTitle", {
                  defaultValue: "Quotation Items",
                })}
              </CardTitle>
              <CardDescription>
                {t("quotations.itemsHint", {
                  defaultValue:
                    "Services and companies included in this quotation document.",
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--lux-row-border)] text-[var(--lux-text-muted)]">
                      <th className="px-3 py-3 text-start">
                        {t("quotations.serviceColumn", {
                          defaultValue: "Services",
                        })}
                      </th>
                      <th className="px-3 py-3 text-start">
                        {t("quotations.priceColumn", {
                          defaultValue: "Price",
                        })}
                      </th>
                      <th className="px-3 py-3 text-start">
                        {t("quotations.companyColumn", {
                          defaultValue: "Companies",
                        })}
                      </th>
                      <th className="px-3 py-3 text-start">
                        {t("quotations.priceColumn", {
                          defaultValue: "Price",
                        })}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pairedItems.map(({ serviceItem, vendorItem }, index) => (
                      <tr
                        key={`${serviceItem?.id ?? "service-none"}-${vendorItem?.id ?? "vendor-none"}-${index}`}
                        className="border-b border-[var(--lux-row-border)] align-top last:border-b-0"
                        style={{
                          background: serviceItem && isServiceSummaryItem(serviceItem)
                            ? "var(--lux-control-hover)"
                            : "transparent",
                        }}
                      >
                        <td className="px-3 py-3">
                          {serviceItem ? (
                            <div className="space-y-1">
                              <div className="font-medium text-[var(--lux-text)]">
                                {getQuotationItemDisplayName(serviceItem)}
                              </div>
                              <div className="text-xs text-[var(--lux-text-secondary)]">
                                <ItemKindBadge item={serviceItem} t={t} />
                              </div>
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-3 py-3 text-[var(--lux-text-secondary)]">
                          {serviceItem
                            ? formatMoney(getQuotationItemPrice(serviceItem))
                            : "-"}
                        </td>
                        <td className="px-3 py-3">
                          {vendorItem ? (
                            <div className="space-y-1">
                              <div className="font-medium text-[var(--lux-text)]">
                                {getQuotationItemDisplayName(vendorItem)}
                              </div>
                              <div className="text-xs text-[var(--lux-text-secondary)]">
                                <ItemKindBadge item={vendorItem} t={t} />
                              </div>
                            </div>
                          ) : serviceItem && isServiceSummaryItem(serviceItem) ? (
                            <div className="space-y-1">
                              <div className="font-medium text-[var(--lux-text)]">
                                {t("quotations.totalCompanies", {
                                  defaultValue: "إجمالي الشركات",
                                })}
                              </div>
                              <div className="text-xs text-[var(--lux-text-secondary)]">
                                <span
                                  className="inline-flex rounded-full border px-3 py-1 text-xs font-semibold"
                                  style={{
                                    borderColor: "var(--lux-gold-border)",
                                    color: "var(--lux-gold)",
                                  }}
                                >
                                  {t("quotations.totalCompanies", {
                                    defaultValue: "إجمالي الشركات",
                                  })}
                                </span>
                              </div>
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-3 py-3 text-[var(--lux-text-secondary)]">
                          {vendorItem
                            ? formatMoney(getQuotationItemPrice(vendorItem))
                            : serviceItem && isServiceSummaryItem(serviceItem)
                              ? formatMoney(vendorTotalAmount)
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 sm:max-w-sm sm:justify-self-end">
                <div className="flex items-center justify-between rounded-2xl border px-4 py-3">
                  <span className="text-sm text-[var(--lux-text-secondary)]">
                    {t("quotations.subtotal", { defaultValue: "Subtotal" })}
                  </span>
                  <span className="font-semibold text-[var(--lux-text)]">
                    {formatMoney(quotation.subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border px-4 py-3">
                  <span className="text-sm text-[var(--lux-text-secondary)]">
                    {t("quotations.discount", { defaultValue: "Discount" })}
                  </span>
                  <span className="font-semibold text-[var(--lux-text)]">
                    {formatMoney(quotation.discountAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border px-4 py-3">
                  <span className="text-sm text-[var(--lux-text-secondary)]">
                    {t("quotations.totalAmount", {
                      defaultValue: "Total Amount",
                    })}
                  </span>
                  <span className="font-semibold text-[var(--lux-heading)]">
                    {formatMoney(quotation.totalAmount)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("common.notes", { defaultValue: "Notes" })}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--lux-text-secondary)]">
                {quotation.notes ||
                  t("quotations.noNotes", {
                    defaultValue: "No notes added yet.",
                  })}
              </p>
            </CardContent>
          </Card>
        </div>
      </PageContainer>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={t("quotations.deleteTitle", {
          defaultValue: "Delete Quotation",
        })}
        message={t("quotations.deleteMessage", {
          defaultValue: "Are you sure you want to delete this quotation?",
        })}
        confirmLabel={t("common.delete", { defaultValue: "Delete" })}
        cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
        onConfirm={() =>
          deleteMutation.mutate({
            id: quotation.id,
            eventId: quotation.eventId,
            redirectToList: true,
          })
        }
        isPending={deleteMutation.isPending}
      />

      <ConfirmDialog
        open={Boolean(pendingWorkflowAction)}
        onOpenChange={(open) => !open && setPendingWorkflowAction(null)}
        title={
          pendingWorkflowAction?.confirmTitle ||
          t("quotations.confirmWorkflowAction", {
            defaultValue: "Confirm Quotation Action",
          })
        }
        message={
          pendingWorkflowAction?.confirmMessage ||
          pendingWorkflowAction?.description ||
          t("quotations.confirmWorkflowActionHint", {
            defaultValue: "This quotation will move to the selected workflow stage.",
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
            { status: pendingWorkflowAction.nextStatus as typeof quotation.status },
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

export default QuotationDetailsPage;
