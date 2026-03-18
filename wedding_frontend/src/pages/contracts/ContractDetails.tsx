import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { Edit, FileText, Plus, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { PageContainer } from "@/components/layout/page-container";
import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import { SectionCard } from "@/components/shared/section-card";
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
import {
  useCreatePaymentSchedule,
  useDeletePaymentSchedule,
  useUpdatePaymentSchedule,
} from "@/hooks/contracts/usePaymentScheduleMutations";
import { getEventDisplayTitle } from "@/pages/events/adapters";
import { getQuotationDisplayNumber } from "@/pages/quotations/adapters";

import {
  computePaymentScheduleTotal,
  formatContractItemCategory,
  formatMoney,
  getContractDisplayNumber,
  getContractItemDisplayName,
  PAYMENT_SCHEDULE_STATUS_OPTIONS,
  PAYMENT_SCHEDULE_TYPE_OPTIONS,
  toNumberValue,
} from "./adapters";
import { ContractStatusBadge } from "./_components/contractStatusBadge";
import { PaymentScheduleStatusBadge } from "./_components/paymentScheduleStatusBadge";
import type {
  PaymentSchedule,
  PaymentScheduleStatus,
  PaymentScheduleType,
} from "./types";

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

const ContractDetailsPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: contract, isLoading } = useContract(id);
  const deleteMutation = useDeleteContract();
  const dateLocale = i18n.language === "ar" ? ar : enUS;

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleDeleteCandidate, setScheduleDeleteCandidate] =
    useState<PaymentSchedule | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<PaymentSchedule | null>(
    null,
  );
  const [scheduleForm, setScheduleForm] = useState<PaymentScheduleFormState>(
    createDefaultPaymentScheduleState(),
  );
  const [scheduleError, setScheduleError] = useState("");

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

          <SectionCard className="space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-[18px] border"
                  style={{
                    background: "var(--lux-control-hover)",
                    borderColor: "var(--lux-control-border)",
                    color: "var(--lux-gold)",
                  }}
                >
                  <FileText className="h-6 w-6" />
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-bold text-[var(--lux-heading)]">
                      {getContractDisplayNumber(contract)}
                    </h1>
                    <ContractStatusBadge status={contract.status} />
                  </div>
                  <p className="text-sm text-[var(--lux-text-secondary)]">
                    {contract.event
                      ? getEventDisplayTitle(contract.event)
                      : `${t("contracts.event", {
                          defaultValue: "Event",
                        })} #${contract.eventId}`}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <ProtectedComponent permission="contracts.update">
                  <Button onClick={() => navigate(`/contracts/edit/${contract.id}`)}>
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
              </div>
            </div>
          </SectionCard>

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
                      "Linked quotation, event, customer, and lead information for this contract.",
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
                        ? `QT-${contract.quotationId}`
                        : "-"
                  }
                />
                <DetailItem
                  label={t("contracts.event", { defaultValue: "Event" })}
                  value={
                    contract.event
                      ? getEventDisplayTitle(contract.event)
                      : `Event #${contract.eventId}`
                  }
                />
                <DetailItem
                  label={t("contracts.customer", { defaultValue: "Customer" })}
                  value={contract.customer?.fullName}
                />
                <DetailItem
                  label={t("contracts.lead", { defaultValue: "Lead" })}
                  value={contract.lead?.fullName}
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
                      <th className="px-3 py-3 text-start">#</th>
                      <th className="px-3 py-3 text-start">
                        {t("contracts.itemName", { defaultValue: "Item" })}
                      </th>
                      <th className="px-3 py-3 text-start">
                        {t("contracts.category", { defaultValue: "Category" })}
                      </th>
                      <th className="px-3 py-3 text-start">
                        {t("contracts.quantity", { defaultValue: "Quantity" })}
                      </th>
                      <th className="px-3 py-3 text-start">
                        {t("contracts.unitPrice", {
                          defaultValue: "Unit Price",
                        })}
                      </th>
                      <th className="px-3 py-3 text-start">
                        {t("contracts.totalPrice", {
                          defaultValue: "Total Price",
                        })}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(contract.items ?? []).map((item, index) => (
                      <tr
                        key={item.id}
                        className="border-b border-[var(--lux-row-border)] align-top last:border-b-0"
                      >
                        <td className="px-3 py-3 text-[var(--lux-text-secondary)]">
                          {index + 1}
                        </td>
                        <td className="px-3 py-3">
                          <div className="font-medium text-[var(--lux-text)]">
                            {getContractItemDisplayName(item)}
                          </div>
                          {item.notes ? (
                            <div className="mt-1 text-xs text-[var(--lux-text-secondary)]">
                              {item.notes}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-3 py-3 text-[var(--lux-text-secondary)]">
                          {t(`services.category.${item.category}`, {
                            defaultValue: formatContractItemCategory(item.category),
                          })}
                        </td>
                        <td className="px-3 py-3 text-[var(--lux-text-secondary)]">
                          {item.quantity}
                        </td>
                        <td className="px-3 py-3 text-[var(--lux-text-secondary)]">
                          {formatMoney(item.unitPrice)}
                        </td>
                        <td className="px-3 py-3 font-semibold text-[var(--lux-text)]">
                          {formatMoney(item.totalPrice)}
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
