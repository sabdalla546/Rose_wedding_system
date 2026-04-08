import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import {
  ArrowRight,
  CheckCheck,
  Download,
  Edit,
  FileText,
  Plus,
  Slash,
  Trash2,
  XCircle,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useContract } from "@/hooks/contracts/useContracts";
import { useDeleteContract } from "@/hooks/contracts/useDeleteContract";
import { useContractWorkflowAction } from "@/hooks/contracts/useContractWorkflowActions";
import {
  useCreatePaymentSchedule,
  useDeletePaymentSchedule,
  useUpdatePaymentSchedule,
} from "@/hooks/contracts/usePaymentScheduleMutations";
import { useToast } from "@/hooks/use-toast";
import api, { getApiErrorMessage } from "@/lib/axios";
import {
  getContractLockMessage,
  getContractWorkflowActions,
  type WorkflowActionDefinition,
} from "@/lib/workflow/workflow";
import { getEventDisplayTitle } from "@/pages/events/adapters";
import { getQuotationDisplayNumber } from "@/pages/quotations/adapters";

import {
  computePaymentScheduleTotal,
  formatMoney,
  getContractDisplayNumber,
  getContractItemDisplayName,
  PAYMENT_SCHEDULE_STATUS_OPTIONS,
  PAYMENT_SCHEDULE_TYPE_OPTIONS,
  toNumberValue,
} from "./adapters";
import { ContractStatusBadge } from "./_components/contractStatusBadge";
import { PaymentScheduleStatusBadge } from "./_components/paymentScheduleStatusBadge";
import { ContractAmendmentsSection } from "./amendments/_components/ContractAmendmentsSection";
import type {
  ContractItem,
  PaymentSchedule,
  PaymentScheduleStatus,
  PaymentScheduleType,
} from "./types";

const isServiceSummaryItem = (item: ContractItem) =>
  item.itemType === "service" && item.category === "service_summary";

const getContractItemPrice = (item: ContractItem) =>
  item.totalPrice ?? item.unitPrice ?? 0;

type PaymentScheduleFormState = {
  installmentName: string;
  scheduleType: PaymentScheduleType;
  dueDate: string;
  amount: string;
  status: PaymentScheduleStatus;
  notes: string;
  sortOrder: string;
};

const textareaClassName =
  "min-h-[130px] w-full rounded-[22px] border px-4 py-3 text-sm text-[var(--lux-text)] placeholder:text-[var(--lux-text-muted)] outline-none transition-all focus:border-[var(--lux-gold-border)] focus:ring-2 focus:ring-[var(--lux-gold-glow)]";

const createDefaultPaymentScheduleState = (
  sortOrder = 0,
): PaymentScheduleFormState => ({
  installmentName: "",
  scheduleType: "deposit",
  dueDate: "",
  amount: "",
  status: "pending",
  notes: "",
  sortOrder: String(sortOrder),
});

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
  item: ContractItem;
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
      {isVendor
        ? t("contracts.vendor", { defaultValue: "Vendor" })
        : isSummary
          ? t("contracts.totalServices", { defaultValue: "Total Services" })
          : t("contracts.service", { defaultValue: "Service" })}
    </span>
  );
}

const getLocalizedContractWorkflowAction = (
  action: WorkflowActionDefinition,
  t: (key: string, options?: Record<string, unknown>) => string,
): Partial<
  Pick<
    WorkflowActionDefinition,
    "label" | "description" | "confirmTitle" | "confirmMessage"
  >
> => {
  switch (action.key) {
    case "issue_contract":
      return {
        label: t("contracts.issueContractAction", {
          defaultValue: "Issue Contract",
        }),
        description: t("contracts.issueContractActionHint", {
          defaultValue: "Issue this contract to the client.",
        }),
      };
    case "sign_contract":
      return {
        label: t("contracts.signContractAction", {
          defaultValue: "Sign Contract",
        }),
        description: t("contracts.signContractActionHint", {
          defaultValue: "Record that the contract has been signed.",
        }),
      };
    case "activate_contract":
      return {
        label: t("contracts.activateContractAction", {
          defaultValue: "Activate Contract",
        }),
        description: t("contracts.activateContractActionHint", {
          defaultValue: "Move this signed contract into the active commitment stage.",
        }),
      };
    case "complete_contract":
      return {
        label: t("contracts.completeContractAction", {
          defaultValue: "Complete Contract",
        }),
        description: t("contracts.completeContractActionHint", {
          defaultValue: "Mark this contract as fulfilled.",
        }),
      };
    case "cancel_contract":
      return {
        label: t("contracts.cancelContractAction", {
          defaultValue: "Cancel Contract",
        }),
        description: t("contracts.cancelContractActionHint", {
          defaultValue: "Cancel this contract before activation.",
        }),
        confirmTitle: t("contracts.cancelContractConfirmTitle", {
          defaultValue: "Cancel contract?",
        }),
        confirmMessage: t("contracts.cancelContractConfirmMessage", {
          defaultValue: "This contract will be marked as cancelled.",
        }),
      };
    case "terminate_contract":
      return {
        label: t("contracts.terminateContractAction", {
          defaultValue: "Terminate Contract",
        }),
        description: t("contracts.terminateContractActionHint", {
          defaultValue: "Terminate this active commitment.",
        }),
        confirmTitle: t("contracts.terminateContractConfirmTitle", {
          defaultValue: "Terminate contract?",
        }),
        confirmMessage: t("contracts.terminateContractConfirmMessage", {
          defaultValue: "This contract will be marked as terminated.",
        }),
      };
    default:
      return {};
  }
};

const ContractDetailsPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id } = useParams();
  const { data: contract, isLoading } = useContract(id);
  const deleteMutation = useDeleteContract();
  const dateLocale = i18n.language === "ar" ? ar : enUS;

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleDeleteCandidate, setScheduleDeleteCandidate] =
    useState<PaymentSchedule | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<PaymentSchedule | null>(
    null,
  );
  const [scheduleForm, setScheduleForm] = useState<PaymentScheduleFormState>(
    createDefaultPaymentScheduleState(),
  );
  const [scheduleError, setScheduleError] = useState("");
  const [pendingWorkflowAction, setPendingWorkflowAction] =
    useState<WorkflowActionDefinition | null>(null);
  const workflowActionMutation = useContractWorkflowAction(contract?.id, {
    eventId: contract?.eventId,
    quotationId: contract?.quotationId ?? undefined,
  });

  const createPaymentScheduleMutation = useCreatePaymentSchedule(
    contract?.id ?? undefined,
  );
  const updatePaymentScheduleMutation = useUpdatePaymentSchedule(
    contract?.id ?? undefined,
  );
  const deletePaymentScheduleMutation = useDeletePaymentSchedule(
    contract?.id ?? undefined,
  );

  const sortedPaymentSchedules = useMemo(
    () =>
      [...(contract?.paymentSchedules ?? [])].sort((left, right) => {
        if (left.sortOrder !== right.sortOrder) {
          return left.sortOrder - right.sortOrder;
        }

        return left.id - right.id;
      }),
    [contract?.paymentSchedules],
  );
  const scheduledTotal = useMemo(
    () => computePaymentScheduleTotal(sortedPaymentSchedules),
    [sortedPaymentSchedules],
  );
  const plannedRemaining = useMemo(() => {
    const contractTotal = toNumberValue(contract?.totalAmount) ?? 0;
    return Number(Math.max(0, contractTotal - scheduledTotal).toFixed(3));
  }, [contract?.totalAmount, scheduledTotal]);
  const sortedContractItems = useMemo(
    () =>
      [...(contract?.items ?? [])].sort(
        (left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0),
      ),
    [contract?.items],
  );
  const serviceItems = useMemo(
    () => sortedContractItems.filter((item) => item.itemType === "service"),
    [sortedContractItems],
  );
  const vendorItems = useMemo(
    () => sortedContractItems.filter((item) => item.itemType === "vendor"),
    [sortedContractItems],
  );
  const vendorTotalAmount = useMemo(
    () =>
      vendorItems.reduce((sum, item) => {
        return sum + (toNumberValue(getContractItemPrice(item)) ?? 0);
      }, 0),
    [vendorItems],
  );
  const pairedItems = useMemo(
    () =>
      Array.from(
        { length: Math.max(serviceItems.length, vendorItems.length) },
        (_, index) => ({
          serviceItem: serviceItems[index],
          vendorItem: vendorItems[index],
        }),
      ),
    [serviceItems, vendorItems],
  );

  useEffect(() => {
    if (!scheduleDialogOpen) {
      setEditingSchedule(null);
      setScheduleError("");
      setScheduleForm(createDefaultPaymentScheduleState(sortedPaymentSchedules.length));
      return;
    }

    if (!editingSchedule) {
      setScheduleForm(createDefaultPaymentScheduleState(sortedPaymentSchedules.length));
      return;
    }

    setScheduleForm({
      installmentName: editingSchedule.installmentName,
      scheduleType: editingSchedule.scheduleType,
      dueDate: editingSchedule.dueDate ?? "",
      amount: String(editingSchedule.amount),
      status: editingSchedule.status,
      notes: editingSchedule.notes ?? "",
      sortOrder: String(editingSchedule.sortOrder ?? 0),
    });
  }, [editingSchedule, scheduleDialogOpen, sortedPaymentSchedules.length]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-sm text-[var(--lux-text-secondary)]">
          {t("common.loading", { defaultValue: "Loading..." })}
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-sm text-[var(--lux-text-secondary)]">
          {t("common.noResultsTitle", { defaultValue: "No results found" })}
        </div>
      </div>
    );
  }

  const contractLockMessage = getContractLockMessage(contract.status)
    ? t("contracts.lockedMessage", {
        defaultValue:
          "Commitment fields are read-only because this contract is signed, active, or completed.",
      })
    : null;
  const workflowActionIcons = {
    issued: <ArrowRight className="h-4 w-4" />,
    signed: <CheckCheck className="h-4 w-4" />,
    active: <ArrowRight className="h-4 w-4" />,
    completed: <CheckCheck className="h-4 w-4" />,
    cancelled: <XCircle className="h-4 w-4" />,
    terminated: <Slash className="h-4 w-4" />,
  } as const;
  const workflowActions = getContractWorkflowActions(contract.status).map(
    (action) => {
      const localizedAction = {
        ...action,
        ...getLocalizedContractWorkflowAction(action, t),
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
              status: action.nextStatus as typeof contract.status,
            });
          }
        },
      };
    },
  );
  const nextSteps: WorkflowNextStepItem[] = [];
  const timelineItems: WorkflowTimelineItem[] = [
    {
      id: "created",
      title: t("contracts.timelineCreated", {
        defaultValue: "Contract record created",
      }),
      description: t("contracts.timelineCreatedHint", {
        defaultValue: "The commitment record was created from the commercial workflow.",
      }),
      timestamp: contract.createdAt ?? contract.signedDate,
      status: "done",
    },
    {
      id: "signature-date",
      title: t("contracts.timelineSignedDate", {
        defaultValue: "Contract signed date recorded",
      }),
      description: t("contracts.timelineSignedDateHint", {
        defaultValue: "This is the main commitment date currently stored on the contract.",
      }),
      timestamp: contract.signedDate,
      status: contract.status === "draft" ? "warning" : "done",
    },
  ];

  if (contract.status === "draft") {
    nextSteps.push({
      id: "issue-contract",
      title: t("contracts.nextIssueTitle", {
        defaultValue: "Issue the contract",
      }),
      description: t("contracts.nextIssueHint", {
        defaultValue:
          "This commitment is still in draft. Issue it before signature and activation can begin.",
      }),
      tone: "warning",
    });
  }

  if (contract.status === "issued") {
    nextSteps.push({
      id: "capture-signature",
      title: t("contracts.nextSignatureTitle", {
        defaultValue: "Capture the signature",
      }),
      description: t("contracts.nextSignatureHint", {
        defaultValue:
          "Use the workflow actions above once the client signs so the record can move into the committed stage.",
      }),
      tone: "warning",
    });
  }

  if (contract.status === "signed") {
    nextSteps.push({
      id: "activate-contract",
      title: t("contracts.nextActivateTitle", {
        defaultValue: "Activate the contract",
      }),
      description: t("contracts.nextActivateHint", {
        defaultValue:
          "The contract is signed. Activate it when the commitment becomes operationally live.",
      }),
      tone: "default",
    });
  }

  if (contract.status === "active") {
    nextSteps.push({
      id: "execution-follow-up",
      title: t("contracts.nextExecutionTitle", {
        defaultValue: "Continue into execution planning",
      }),
      description: t("contracts.nextExecutionHint", {
        defaultValue:
          "An active contract should now hand off into execution preparation from the source event workspace.",
      }),
      tone: "default",
      action: (
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(`/events/${contract.eventId}`)}
        >
          <FileText className="h-4 w-4" />
          {t("contracts.openSourceEvent", {
            defaultValue: "Open Source Event",
          })}
        </Button>
      ),
    });
  }

  if (plannedRemaining > 0) {
    nextSteps.push({
      id: "payment-schedule-gap",
      title: t("contracts.nextPaymentPlanTitle", {
        defaultValue: "Complete the payment schedule",
      }),
      description: t("contracts.nextPaymentPlanHint", {
        defaultValue:
          "There is still {{amount}} left to schedule across payment installments.",
        amount: formatMoney(plannedRemaining),
      }),
      tone: "warning",
    });
  }

  if (contract.quotation) {
    timelineItems.push({
      id: "quotation-linked",
      title: t("contracts.timelineQuotationLinked", {
        defaultValue: "Linked to approved quotation",
      }),
      description: getQuotationDisplayNumber(contract.quotation),
      timestamp: contract.quotation.updatedAt ?? contract.quotation.issueDate,
      status: "done",
    });
  }

  if (contract.status !== "draft") {
    timelineItems.push({
      id: "status-update",
      title: t("contracts.timelineStatusUpdate", {
        defaultValue: "Commitment status updated",
      }),
      description: t("contracts.timelineStatusUpdateHint", {
        defaultValue: "Current status: {{status}}",
        status: t(`contracts.status.${contract.status}`, {
          defaultValue: contract.status,
        }),
      }),
      timestamp: contract.updatedAt ?? contract.signedDate,
      status:
        contract.status === "cancelled" || contract.status === "terminated"
          ? "warning"
          : "current",
    });
  }

  const handleSavePaymentSchedule = () => {
    const amountValue = toNumberValue(scheduleForm.amount);
    const sortOrderValue = Number(scheduleForm.sortOrder || 0);

    if (!scheduleForm.installmentName.trim() || scheduleForm.installmentName.trim().length < 2) {
      setScheduleError(
        t("contracts.paymentScheduleNameInvalid", {
          defaultValue: "Installment name is required.",
        }),
      );
      return;
    }

    if (amountValue === null || amountValue < 0) {
      setScheduleError(
        t("contracts.paymentScheduleAmountInvalid", {
          defaultValue: "Amount must be zero or greater.",
        }),
      );
      return;
    }

    if (!Number.isInteger(sortOrderValue) || sortOrderValue < 0) {
      setScheduleError(
        t("contracts.paymentScheduleSortOrderInvalid", {
          defaultValue: "Sort order must be zero or greater.",
        }),
      );
      return;
    }

    setScheduleError("");

    if (editingSchedule) {
      updatePaymentScheduleMutation.mutate(
        {
          id: editingSchedule.id,
          values: {
            installmentName: scheduleForm.installmentName,
            scheduleType: scheduleForm.scheduleType,
            dueDate: scheduleForm.dueDate,
            amount: scheduleForm.amount,
            status: scheduleForm.status,
            notes: scheduleForm.notes,
            sortOrder: scheduleForm.sortOrder,
          },
        },
        {
          onSuccess: () => setScheduleDialogOpen(false),
        },
      );
      return;
    }

    createPaymentScheduleMutation.mutate(
      {
        contractId: contract.id,
        installmentName: scheduleForm.installmentName,
        scheduleType: scheduleForm.scheduleType,
        dueDate: scheduleForm.dueDate,
        amount: scheduleForm.amount,
        status: scheduleForm.status,
        notes: scheduleForm.notes,
        sortOrder: scheduleForm.sortOrder,
      },
      {
        onSuccess: () => setScheduleDialogOpen(false),
      },
    );
  };

  const handleDownloadPdf = async () => {
    if (!contract || isDownloadingPdf) {
      return;
    }

    setIsDownloadingPdf(true);

    try {
      const response = await api.get(`/contracts/${contract.id}/pdf`, {
        responseType: "blob",
      });

      const contentDisposition = response.headers["content-disposition"];
      const fileNameMatch = typeof contentDisposition === "string"
        ? contentDisposition.match(/filename="?([^"]+)"?/)
        : null;
      const fallbackName = `contract-${contract.id}.pdf`;
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
        description: t("contracts.pdfDownloadSuccess", {
          defaultValue: "Contract PDF downloaded successfully",
        }),
      });
    } catch (error) {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("contracts.pdfDownloadFailed", {
            defaultValue: "Failed to download contract PDF",
          }),
        ),
      });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <ProtectedComponent permission="contracts.read">
      <PageContainer className="pb-4 pt-4 text-foreground">
        <div dir={i18n.dir()} className="mx-auto w-full max-w-6xl space-y-6">
          <button
            type="button"
            onClick={() => navigate("/contracts")}
            className="inline-flex items-center gap-2 text-sm text-[var(--lux-text-secondary)] transition-colors hover:text-[var(--lux-gold)]"
          >
            {"<-"}{" "}
            {t("contracts.backToContracts", {
              defaultValue: "Back to Contracts",
            })}
          </button>

          <WorkflowEntityHeader
            eyebrow={t("contracts.workflowStage", {
              defaultValue: "Commitment Snapshot",
            })}
            title={getContractDisplayNumber(contract)}
            description={
              contract.event
                ? getEventDisplayTitle(contract.event)
                : t("contracts.eventReference", {
                    defaultValue: "Event #{{id}}",
                    id: contract.eventId,
                  })
            }
            status={<ContractStatusBadge status={contract.status} />}
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
                    : t("contracts.downloadPdf", {
                        defaultValue: "Download PDF",
                      })}
                </Button>

                <ProtectedComponent permission="contracts.update">
                  <Button
                    disabled={Boolean(contractLockMessage)}
                    title={contractLockMessage ?? undefined}
                    onClick={() => navigate(`/contracts/edit/${contract.id}`)}
                  >
                    <Edit className="h-4 w-4" />
                    {t("common.edit", { defaultValue: "Edit" })}
                  </Button>
                </ProtectedComponent>

                <ProtectedComponent permission="contracts.delete">
                  <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                    <Trash2 className="h-4 w-4" />
                    {t("common.delete", { defaultValue: "Delete" })}
                  </Button>
                </ProtectedComponent>
              </>
            }
          />

          <WorkflowLineageCard
            title={t("contracts.workflowLineage", {
              defaultValue: "Workflow Lineage",
            })}
            items={[
              {
                label: t("contracts.sourceQuotation", {
                  defaultValue: "Source Quotation",
                }),
                value: contract.quotationId ? (
                  <button
                    type="button"
                    onClick={() => navigate(`/quotations/${contract.quotationId}`)}
                    className="text-sm font-medium text-[var(--lux-gold)] hover:underline"
                  >
                    {contract.quotation
                      ? getQuotationDisplayNumber(contract.quotation)
                      : t("contracts.quotationReference", {
                          defaultValue: "QT-{{id}}",
                          id: contract.quotationId,
                        })}
                  </button>
                ) : (
                  t("contracts.noQuotationLinked", {
                    defaultValue: "No quotation linked",
                  })
                ),
                helper: contract.quotation?.status
                  ? t(`quotations.status.${contract.quotation.status}`, {
                      defaultValue: contract.quotation.status,
                    })
                  : undefined,
              },
              {
                label: t("contracts.sourceEvent", {
                  defaultValue: "Source Event",
                }),
                value: (
                  <button
                    type="button"
                    onClick={() => navigate(`/events/${contract.eventId}`)}
                    className="text-sm font-medium text-[var(--lux-gold)] hover:underline"
                  >
                    {contract.event
                      ? getEventDisplayTitle(contract.event)
                      : t("contracts.eventReference", {
                          defaultValue: "Event #{{id}}",
                          id: contract.eventId,
                        })}
                  </button>
                ),
                helper:
                  contract.event?.customer?.fullName ||
                  contract.customer?.fullName ||
                  undefined,
              },
              {
                label: t("contracts.commitmentTotals", {
                  defaultValue: "Commitment Totals",
                }),
                value: formatMoney(contract.totalAmount),
                helper: `${t("contracts.subtotal", {
                  defaultValue: "Subtotal",
                })}: ${formatMoney(contract.subtotal)} • ${t("contracts.discount", {
                  defaultValue: "Discount",
                })}: ${formatMoney(contract.discountAmount)}`,
              },
              {
                label: t("contracts.paymentPlan", {
                  defaultValue: "Payment Plan",
                }),
                value: `${sortedPaymentSchedules.length} ${t("contracts.installments", {
                  defaultValue: "installments",
                })}`,
                helper: `${t("contracts.scheduledAmount", {
                  defaultValue: "Scheduled Amount",
                })}: ${formatMoney(scheduledTotal)}`,
              },
            ]}
          />

          <ProtectedComponent permission="contracts.update">
            <WorkflowActionBar
              title={t("contracts.workflowActions", {
                defaultValue: "Workflow Actions",
              })}
              description={t("contracts.workflowActionsHint", {
                defaultValue:
                  "Move this contract through the commitment lifecycle with explicit actions instead of editing status directly.",
              })}
              actions={workflowActions}
            />
          </ProtectedComponent>

          {contractLockMessage ? (
            <WorkflowLockBanner
              title={t("contracts.lockedTitle", {
                defaultValue: "Contract Locked",
              })}
              message={contractLockMessage}
            />
          ) : null}

          <div className="grid gap-4 xl:grid-cols-2">
            <WorkflowNextStepPanel
              title={t("contracts.nextStepsTitle", {
                defaultValue: "Next Step Guidance",
              })}
              description={t("contracts.nextStepsHint", {
                defaultValue:
                  "This panel highlights the next operational action and flags incomplete planning work.",
              })}
              items={nextSteps}
            />

            <WorkflowTimeline
              title={t("contracts.timelineTitle", {
                defaultValue: "Timeline & Action History",
              })}
              description={t("contracts.timelineHint", {
                defaultValue:
                  "This history is based on the timestamps currently exposed by the contract and linked quotation records.",
              })}
              partialHistoryLabel={t("contracts.timelinePartial", {
                defaultValue:
                  "A full contract audit trail is not available yet, so later status changes are shown from the latest reliable timestamps only.",
              })}
              items={timelineItems}
              locale={dateLocale}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>
                  {t("contracts.headerInformation", {
                    defaultValue: "Contract Header",
                  })}
                </CardTitle>
                <CardDescription>
                  {t("contracts.headerInformationHint", {
                    defaultValue:
                      "Core contract dates, reference number, and commercial status.",
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <DetailItem
                  label={t("contracts.contractNumber", {
                    defaultValue: "Contract Number",
                  })}
                  value={getContractDisplayNumber(contract)}
                />
                <DetailItem
                  label={t("contracts.signedDate", {
                    defaultValue: "Signed Date",
                  })}
                  value={format(new Date(contract.signedDate), "MMM d, yyyy", {
                    locale: dateLocale,
                  })}
                />
                <DetailItem
                  label={t("contracts.eventDate", {
                    defaultValue: "Event Date",
                  })}
                  value={
                    contract.eventDate
                      ? format(new Date(contract.eventDate), "MMM d, yyyy", {
                          locale: dateLocale,
                        })
                      : "-"
                  }
                />
                <DetailItem
                  label={t("contracts.statusLabel", {
                    defaultValue: "Status",
                  })}
                  value={t(`contracts.status.${contract.status}`, {
                    defaultValue: contract.status,
                  })}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  {t("contracts.relatedRecords", {
                    defaultValue: "Related Records",
                  })}
                </CardTitle>
                <CardDescription>
                  {t("contracts.relatedRecordsHint", {
                    defaultValue:
                      "Linked quotation, event, and customer information for this contract.",
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <DetailItem
                  label={t("contracts.quotation", { defaultValue: "Quotation" })}
                  value={
                    contract.quotation
                      ? getQuotationDisplayNumber(contract.quotation)
                      : contract.quotationId
                        ? t("contracts.quotationReference", {
                            defaultValue: "QT-{{id}}",
                            id: contract.quotationId,
                          })
                        : "-"
                  }
                />
                <DetailItem
                  label={t("contracts.event", { defaultValue: "Event" })}
                  value={
                    contract.event
                      ? getEventDisplayTitle(contract.event)
                      : t("contracts.eventReference", {
                          defaultValue: "Event #{{id}}",
                          id: contract.eventId,
                        })
                  }
                />
                <DetailItem
                  label={t("contracts.customer", { defaultValue: "Customer" })}
                  value={
                    contract.event?.customer?.fullName ||
                    contract.customer?.fullName
                  }
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  {t("contracts.totals", { defaultValue: "Totals" })}
                </CardTitle>
                <CardDescription>
                  {t("contracts.totalsHint", {
                    defaultValue:
                      "Commercial summary for the contract document.",
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <DetailItem
                  label={t("contracts.subtotal", { defaultValue: "Subtotal" })}
                  value={formatMoney(contract.subtotal)}
                />
                <DetailItem
                  label={t("contracts.discount", { defaultValue: "Discount" })}
                  value={formatMoney(contract.discountAmount)}
                />
                <DetailItem
                  label={t("contracts.totalAmount", {
                    defaultValue: "Total Amount",
                  })}
                  value={formatMoney(contract.totalAmount)}
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                {t("contracts.itemsTitle", {
                  defaultValue: "Contract Items",
                })}
              </CardTitle>
              <CardDescription>
                {t("contracts.itemsHint", {
                  defaultValue:
                    "Commercial lines included in this contract document.",
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--lux-row-border)] text-[var(--lux-text-muted)]">
                      <th className="px-3 py-3 text-start">
                        {t("contracts.serviceColumn", {
                          defaultValue: "Services",
                        })}
                      </th>
                      <th className="px-3 py-3 text-start">
                        {t("contracts.priceColumn", {
                          defaultValue: "Price",
                        })}
                      </th>
                      <th className="px-3 py-3 text-start">
                        {t("contracts.companyColumn", {
                          defaultValue: "Companies",
                        })}
                      </th>
                      <th className="px-3 py-3 text-start">
                        {t("contracts.priceColumn", {
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
                                {getContractItemDisplayName(serviceItem)}
                              </div>
                              <div className="text-xs text-[var(--lux-text-secondary)]">
                                <ItemKindBadge item={serviceItem} t={t} />
                              </div>
                              {serviceItem.notes ? (
                                <div className="text-xs text-[var(--lux-text-secondary)]">
                                  {serviceItem.notes}
                                </div>
                              ) : null}
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-3 py-3 text-[var(--lux-text-secondary)]">
                          {serviceItem
                            ? formatMoney(getContractItemPrice(serviceItem))
                            : "-"}
                        </td>
                        <td className="px-3 py-3">
                          {vendorItem ? (
                            <div className="space-y-1">
                              <div className="font-medium text-[var(--lux-text)]">
                                {getContractItemDisplayName(vendorItem)}
                              </div>
                              <div className="text-xs text-[var(--lux-text-secondary)]">
                                <ItemKindBadge item={vendorItem} t={t} />
                              </div>
                              {vendorItem.notes ? (
                                <div className="text-xs text-[var(--lux-text-secondary)]">
                                  {vendorItem.notes}
                                </div>
                              ) : null}
                            </div>
                          ) : serviceItem && isServiceSummaryItem(serviceItem) ? (
                            <div className="space-y-1">
                              <div className="font-medium text-[var(--lux-text)]">
                                {t("contracts.totalCompanies", {
                                  defaultValue: "Total Companies",
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
                                  {t("contracts.totalCompanies", {
                                    defaultValue: "Total Companies",
                                  })}
                                </span>
                              </div>
                            </div>
                          ) : null}
                          {!vendorItem && !(serviceItem && isServiceSummaryItem(serviceItem))
                            ? "-"
                            : null}
                        </td>
                        <td className="px-3 py-3 font-semibold text-[var(--lux-text)]">
                          {vendorItem
                            ? formatMoney(getContractItemPrice(vendorItem))
                            : serviceItem && isServiceSummaryItem(serviceItem)
                              ? formatMoney(vendorTotalAmount)
                              : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle>
                    {t("contracts.paymentScheduleTitle", {
                      defaultValue: "Payment Schedule",
                    })}
                  </CardTitle>
                  <CardDescription>
                    {t("contracts.paymentScheduleHint", {
                      defaultValue:
                        "Manage the planned installments for this contract. This is a payment plan only, not actual payment collection.",
                    })}
                  </CardDescription>
                </div>

                <ProtectedComponent permission="contracts.update">
                  <Button
                    disabled={Boolean(contractLockMessage)}
                    title={contractLockMessage ?? undefined}
                    onClick={() => {
                      setEditingSchedule(null);
                      setScheduleDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    {t("contracts.addPaymentSchedule", {
                      defaultValue: "Add Payment Schedule",
                    })}
                  </Button>
                </ProtectedComponent>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
                    {t("contracts.paymentScheduleCount", {
                      defaultValue: "Installments",
                    })}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-[var(--lux-heading)]">
                    {sortedPaymentSchedules.length}
                  </p>
                </div>
                <div className="rounded-2xl border px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
                    {t("contracts.scheduledAmount", {
                      defaultValue: "Scheduled Amount",
                    })}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-[var(--lux-heading)]">
                    {formatMoney(scheduledTotal)}
                  </p>
                </div>
                <div className="rounded-2xl border px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
                    {t("contracts.remainingToSchedule", {
                      defaultValue: "Remaining To Schedule",
                    })}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-[var(--lux-heading)]">
                    {formatMoney(plannedRemaining)}
                  </p>
                </div>
              </div>

              {sortedPaymentSchedules.length > 0 ? (
                <div className="space-y-3">
                  {sortedPaymentSchedules.map((schedule) => (
                    <div
                      key={schedule.id}
                      className="rounded-[22px] border p-4"
                      style={{
                        background: "var(--lux-row-surface)",
                        borderColor: "var(--lux-row-border)",
                      }}
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-base font-semibold text-[var(--lux-heading)]">
                                {schedule.installmentName}
                              </p>
                              <PaymentScheduleStatusBadge status={schedule.status} />
                            </div>
                            <p className="text-sm text-[var(--lux-text-secondary)]">
                              {t(`contracts.scheduleType.${schedule.scheduleType}`, {
                                defaultValue: schedule.scheduleType,
                              })}
                            </p>
                          </div>

                          <ProtectedComponent permission="contracts.update">
                            <div className="flex flex-wrap gap-2">
                              <Button
                                variant="outline"
                                disabled={Boolean(contractLockMessage)}
                                title={contractLockMessage ?? undefined}
                                onClick={() => {
                                  setEditingSchedule(schedule);
                                  setScheduleDialogOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                                {t("common.edit", { defaultValue: "Edit" })}
                              </Button>
                              <Button
                                variant="destructive"
                                disabled={Boolean(contractLockMessage)}
                                title={contractLockMessage ?? undefined}
                                onClick={() => setScheduleDeleteCandidate(schedule)}
                              >
                                <Trash2 className="h-4 w-4" />
                                {t("common.delete", { defaultValue: "Delete" })}
                              </Button>
                            </div>
                          </ProtectedComponent>
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                          <div className="rounded-2xl border px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
                              {t("contracts.dueDate", {
                                defaultValue: "Due Date",
                              })}
                            </p>
                            <p className="mt-1 text-sm text-[var(--lux-text)]">
                              {schedule.dueDate
                                ? format(new Date(schedule.dueDate), "PPP", {
                                    locale: dateLocale,
                                  })
                                : "-"}
                            </p>
                          </div>
                          <div className="rounded-2xl border px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
                              {t("contracts.amount", {
                                defaultValue: "Amount",
                              })}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-[var(--lux-heading)]">
                              {formatMoney(schedule.amount)}
                            </p>
                          </div>
                          <div className="rounded-2xl border px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
                              {t("contracts.paymentStatusLabel", {
                                defaultValue: "Payment Status",
                              })}
                            </p>
                            <p className="mt-1 text-sm text-[var(--lux-text)]">
                              {t(`contracts.paymentStatus.${schedule.status}`, {
                                defaultValue: schedule.status,
                              })}
                            </p>
                          </div>
                          <div className="rounded-2xl border px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
                              {t("contracts.sortOrder", {
                                defaultValue: "Sort Order",
                              })}
                            </p>
                            <p className="mt-1 text-sm text-[var(--lux-text)]">
                              {schedule.sortOrder}
                            </p>
                          </div>
                        </div>

                        {schedule.notes ? (
                          <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--lux-text-secondary)]">
                            {schedule.notes}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--lux-text-secondary)]">
                  {t("contracts.noPaymentSchedules", {
                    defaultValue:
                      "No payment schedule has been added to this contract yet.",
                  })}
                </p>
              )}
            </CardContent>
          </Card>

          <ContractAmendmentsSection contract={contract} />

          <Card>
            <CardHeader>
              <CardTitle>{t("common.notes", { defaultValue: "Notes" })}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--lux-text-secondary)]">
                {contract.notes ||
                  t("contracts.noNotes", {
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
        title={t("contracts.deleteTitle", {
          defaultValue: "Delete Contract",
        })}
        message={t("contracts.deleteMessage", {
          defaultValue: "Are you sure you want to delete this contract?",
        })}
        confirmLabel={t("common.delete", { defaultValue: "Delete" })}
        cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
        onConfirm={() =>
          deleteMutation.mutate({
            id: contract.id,
            eventId: contract.eventId,
            quotationId: contract.quotationId,
            redirectToList: true,
          })
        }
        isPending={deleteMutation.isPending}
      />

      <ConfirmDialog
        open={Boolean(scheduleDeleteCandidate)}
        onOpenChange={(open) => !open && setScheduleDeleteCandidate(null)}
        title={t("contracts.deletePaymentScheduleTitle", {
          defaultValue: "Delete Payment Schedule",
        })}
        message={t("contracts.deletePaymentScheduleMessage", {
          defaultValue:
            "Are you sure you want to delete this payment schedule?",
        })}
        confirmLabel={t("common.delete", { defaultValue: "Delete" })}
        cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
        onConfirm={() => {
          if (!scheduleDeleteCandidate) {
            return;
          }

          deletePaymentScheduleMutation.mutate(scheduleDeleteCandidate.id, {
            onSuccess: () => setScheduleDeleteCandidate(null),
          });
        }}
        isPending={deletePaymentScheduleMutation.isPending}
      />

      <ConfirmDialog
        open={Boolean(pendingWorkflowAction)}
        onOpenChange={(open) => !open && setPendingWorkflowAction(null)}
        title={
          pendingWorkflowAction?.confirmTitle ||
          t("contracts.confirmWorkflowAction", {
            defaultValue: "Confirm Contract Action",
          })
        }
        message={
          pendingWorkflowAction?.confirmMessage ||
          pendingWorkflowAction?.description ||
          t("contracts.confirmWorkflowActionHint", {
            defaultValue: "This contract will move to the selected workflow stage.",
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
            { status: pendingWorkflowAction.nextStatus as typeof contract.status },
            {
              onSettled: () => setPendingWorkflowAction(null),
            },
          );
        }}
        isPending={workflowActionMutation.isPending}
      />

      <Dialog
        open={scheduleDialogOpen}
        onOpenChange={(open) => {
          setScheduleDialogOpen(open);
          if (!open) {
            setEditingSchedule(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingSchedule
                ? t("contracts.editPaymentSchedule", {
                    defaultValue: "Edit Payment Schedule",
                  })
                : t("contracts.addPaymentSchedule", {
                    defaultValue: "Add Payment Schedule",
                  })}
            </DialogTitle>
            <DialogDescription>
              {t("contracts.paymentScheduleDialogHint", {
                defaultValue:
                  "Plan installments and due dates here. This section records scheduled payments only.",
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-[var(--lux-text)]">
                {t("contracts.installmentName", {
                  defaultValue: "Installment Name",
                })}
              </span>
              <Input
                value={scheduleForm.installmentName}
                onChange={(event) =>
                  setScheduleForm((current) => ({
                    ...current,
                    installmentName: event.target.value,
                  }))
                }
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-[var(--lux-text)]">
                {t("contracts.scheduleTypeLabel", {
                  defaultValue: "Schedule Type",
                })}
              </span>
              <Select
                value={scheduleForm.scheduleType}
                onValueChange={(value) =>
                  setScheduleForm((current) => ({
                    ...current,
                    scheduleType: value as PaymentScheduleType,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_SCHEDULE_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {t(`contracts.scheduleType.${option.value}`, {
                        defaultValue: option.label,
                      })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-[var(--lux-text)]">
                {t("contracts.dueDate", {
                  defaultValue: "Due Date",
                })}
              </span>
              <Input
                type="date"
                value={scheduleForm.dueDate}
                onChange={(event) =>
                  setScheduleForm((current) => ({
                    ...current,
                    dueDate: event.target.value,
                  }))
                }
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-[var(--lux-text)]">
                {t("contracts.amount", {
                  defaultValue: "Amount",
                })}
              </span>
              <Input
                type="number"
                min="0"
                step="0.001"
                value={scheduleForm.amount}
                onChange={(event) =>
                  setScheduleForm((current) => ({
                    ...current,
                    amount: event.target.value,
                  }))
                }
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-[var(--lux-text)]">
                {t("contracts.paymentStatusLabel", {
                  defaultValue: "Payment Status",
                })}
              </span>
              <Select
                value={scheduleForm.status}
                onValueChange={(value) =>
                  setScheduleForm((current) => ({
                    ...current,
                    status: value as PaymentScheduleStatus,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_SCHEDULE_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {t(`contracts.paymentStatus.${option.value}`, {
                        defaultValue: option.label,
                      })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-[var(--lux-text)]">
                {t("contracts.sortOrder", {
                  defaultValue: "Sort Order",
                })}
              </span>
              <Input
                type="number"
                min="0"
                value={scheduleForm.sortOrder}
                onChange={(event) =>
                  setScheduleForm((current) => ({
                    ...current,
                    sortOrder: event.target.value,
                  }))
                }
              />
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-sm font-medium text-[var(--lux-text)]">
              {t("common.notes", { defaultValue: "Notes" })}
            </span>
            <textarea
              className={textareaClassName}
              value={scheduleForm.notes}
              onChange={(event) =>
                setScheduleForm((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
              placeholder={t("contracts.paymentScheduleNotesPlaceholder", {
                defaultValue:
                  "Add installment notes, conditions, or office remarks...",
              })}
              style={{
                background: "var(--lux-control-surface)",
                borderColor: "var(--lux-control-border)",
              }}
            />
          </label>

          {scheduleError ? (
            <p className="text-sm text-[var(--lux-danger)]">{scheduleError}</p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setScheduleDialogOpen(false)}
              disabled={
                createPaymentScheduleMutation.isPending ||
                updatePaymentScheduleMutation.isPending
              }
            >
              {t("common.cancel", { defaultValue: "Cancel" })}
            </Button>
            <Button
              type="button"
              onClick={handleSavePaymentSchedule}
              disabled={
                createPaymentScheduleMutation.isPending ||
                updatePaymentScheduleMutation.isPending
              }
            >
              {createPaymentScheduleMutation.isPending ||
              updatePaymentScheduleMutation.isPending
                ? t("common.processing", { defaultValue: "Processing..." })
                : editingSchedule
                  ? t("common.update", { defaultValue: "Update" })
                  : t("common.create", { defaultValue: "Create" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProtectedComponent>
  );
};

export default ContractDetailsPage;
