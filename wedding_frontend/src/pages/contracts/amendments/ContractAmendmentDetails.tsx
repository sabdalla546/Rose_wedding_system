import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { ArrowLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";

import { PageContainer } from "@/components/layout/page-container";
import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import { WorkflowEntityHeader } from "@/components/workflow/workflow-entity-header";
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
import { Textarea } from "@/components/ui/textarea";
import { useContract } from "@/hooks/contracts/useContracts";
import { useContractAmendment } from "@/hooks/contracts/useContractAmendments";
import {
  useAddContractAmendmentItem,
  useApplyContractAmendment,
  useApproveContractAmendment,
  useDeleteContractAmendmentItem,
  useRejectContractAmendment,
  useUpdateContractAmendmentItem,
} from "@/hooks/contracts/useContractAmendmentMutations";

import {
  canEditContractAmendment,
  formatContractAmendmentDelta,
  getContractAmendmentDeltaTone,
  getContractAmendmentDisplayNumber,
} from "./adapters";
import { ContractAmendmentActionBar } from "./_components/ContractAmendmentActionBar";
import { ContractAmendmentItemFormDialog } from "./_components/ContractAmendmentItemFormDialog";
import { ContractAmendmentItemsTable } from "./_components/ContractAmendmentItemsTable";
import { ContractAmendmentStatusBadge } from "./_components/ContractAmendmentStatusBadge";
import type {
  ContractAmendmentItem,
  ContractAmendmentItemCreateFormData,
  ContractAmendmentItemUpdateFormData,
} from "./types";
import { getContractDisplayNumber } from "../adapters";

function DetailBlock({
  label,
  value,
}: {
  label: string;
  value?: string | null;
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

function SummaryStat({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-2xl border px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
        {label}
      </p>
      <p className={`mt-1 text-lg font-semibold ${valueClassName ?? "text-[var(--lux-heading)]"}`}>
        {value}
      </p>
    </div>
  );
}

const ContractAmendmentDetailsPage = () => {
  const { t, i18n } = useTranslation();
  const { id, amendmentId } = useParams();
  const dateLocale = i18n.language === "ar" ? ar : enUS;

  const { data: amendment, isLoading } = useContractAmendment(amendmentId);
  const { data: contract } = useContract(id);

  const addItemMutation = useAddContractAmendmentItem();
  const updateItemMutation = useUpdateContractAmendmentItem();
  const deleteItemMutation = useDeleteContractAmendmentItem();
  const approveMutation = useApproveContractAmendment();
  const rejectMutation = useRejectContractAmendment();
  const applyMutation = useApplyContractAmendment();

  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContractAmendmentItem | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<ContractAmendmentItem | null>(
    null,
  );
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectNotes, setRejectNotes] = useState("");
  const [rejectError, setRejectError] = useState("");

  const sortedItems = useMemo(
    () =>
      [...(amendment?.items ?? [])].sort((left, right) => {
        if (left.sortOrder !== right.sortOrder) {
          return left.sortOrder - right.sortOrder;
        }

        return left.id - right.id;
      }),
    [amendment?.items],
  );

  const contractServiceItems = useMemo(
    () =>
      [...(contract?.items ?? [])].sort(
        (left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0),
      ),
    [contract?.items],
  );

  useEffect(() => {
    if (!rejectDialogOpen) {
      setRejectReason("");
      setRejectNotes("");
      setRejectError("");
    }
  }, [rejectDialogOpen]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-sm text-[var(--lux-text-secondary)]">
          {t("common.loading", { defaultValue: "Loading..." })}
        </div>
      </div>
    );
  }

  if (!amendment) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-sm text-[var(--lux-text-secondary)]">
          {t("common.noResultsTitle", { defaultValue: "No results found" })}
        </div>
      </div>
    );
  }

  const isDraft = canEditContractAmendment(amendment.status);
  const contractHref = `/contracts/${id ?? amendment.contractId}`;

  return (
    <>
      <PageContainer className="space-y-6">
        <WorkflowEntityHeader
          eyebrow={t("contracts.amendments.title", {
            defaultValue: "Contract Amendments",
          })}
          title={getContractAmendmentDisplayNumber(amendment)}
          description={t("contracts.amendments.headerHint", {
            defaultValue:
              "Commercial amendment for contract {{contractNumber}}.",
            contractNumber: contract
              ? getContractDisplayNumber(contract)
              : `CT-${amendment.contractId}`,
          })}
          status={<ContractAmendmentStatusBadge status={amendment.status} />}
          actions={
            <Button asChild variant="outline">
              <Link to={contractHref}>
                <ArrowLeft className="h-4 w-4" />
                {t("contracts.amendments.backToContract", {
                  defaultValue: "Back to Contract",
                })}
              </Link>
            </Button>
          }
        />

        <ProtectedComponent permission="contracts.update">
          <ContractAmendmentActionBar
            status={amendment.status}
            isApprovePending={approveMutation.isPending}
            isRejectPending={rejectMutation.isPending}
            isApplyPending={applyMutation.isPending}
            onAddItem={() => {
              setEditingItem(null);
              setItemDialogOpen(true);
            }}
            onApprove={() => setApproveDialogOpen(true)}
            onReject={() => setRejectDialogOpen(true)}
            onApply={() => setApplyDialogOpen(true)}
          />
        </ProtectedComponent>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {t("contracts.amendments.itemsTitle", {
                    defaultValue: "Amendment Items",
                  })}
                </CardTitle>
                <CardDescription>
                  {t("contracts.amendments.itemsHint", {
                    defaultValue:
                      "Each item describes a service to add or a current contract service to remove.",
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ContractAmendmentItemsTable
                  items={sortedItems}
                  readOnly={!isDraft}
                  onEdit={(item) => {
                    setEditingItem(item);
                    setItemDialogOpen(true);
                  }}
                  onDelete={(item) => setDeleteCandidate(item)}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {t("contracts.amendments.summaryTitle", {
                    defaultValue: "Amendment Summary",
                  })}
                </CardTitle>
                <CardDescription>
                  {t("contracts.amendments.summaryHint", {
                    defaultValue:
                      "Current reason, notes, and commercial delta for this amendment.",
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <SummaryStat
                    label={t("contracts.subtotal", { defaultValue: "Subtotal" })}
                    value={formatContractAmendmentDelta(amendment.subtotalDelta)}
                    valueClassName={getContractAmendmentDeltaTone(
                      amendment.subtotalDelta,
                    )}
                  />
                  <SummaryStat
                    label={t("contracts.discount", { defaultValue: "Discount" })}
                    value={formatContractAmendmentDelta(amendment.discountDelta)}
                    valueClassName={getContractAmendmentDeltaTone(
                      amendment.discountDelta,
                    )}
                  />
                  <SummaryStat
                    label={t("contracts.totalAmount", { defaultValue: "Total" })}
                    value={formatContractAmendmentDelta(amendment.totalDelta)}
                    valueClassName={getContractAmendmentDeltaTone(
                      amendment.totalDelta,
                    )}
                  />
                </div>

                <DetailBlock
                  label={t("contracts.amendments.reason", {
                    defaultValue: "Reason",
                  })}
                  value={amendment.reason}
                />
                <DetailBlock
                  label={t("common.notes", { defaultValue: "Notes" })}
                  value={amendment.notes}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  {t("contracts.amendments.auditTitle", {
                    defaultValue: "Workflow Audit",
                  })}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <DetailBlock
                  label={t("contracts.amendments.requestedAt", {
                    defaultValue: "Requested At",
                  })}
                  value={
                    amendment.requestedAt
                      ? format(new Date(amendment.requestedAt), "PPP p", {
                          locale: dateLocale,
                        })
                      : amendment.createdAt
                        ? format(new Date(amendment.createdAt), "PPP p", {
                            locale: dateLocale,
                          })
                        : "-"
                  }
                />
                <DetailBlock
                  label={t("contracts.amendments.approvedAt", {
                    defaultValue: "Approved At",
                  })}
                  value={
                    amendment.approvedAt
                      ? format(new Date(amendment.approvedAt), "PPP p", {
                          locale: dateLocale,
                        })
                      : "-"
                  }
                />
                <DetailBlock
                  label={t("contracts.amendments.appliedAt", {
                    defaultValue: "Applied At",
                  })}
                  value={
                    amendment.appliedAt
                      ? format(new Date(amendment.appliedAt), "PPP p", {
                          locale: dateLocale,
                        })
                      : "-"
                  }
                />
                <DetailBlock
                  label={t("contracts.amendments.requestedBy", {
                    defaultValue: "Requested By",
                  })}
                  value={amendment.requestedByUser?.fullName}
                />
                <DetailBlock
                  label={t("contracts.amendments.approvedBy", {
                    defaultValue: "Approved By",
                  })}
                  value={amendment.approvedByUser?.fullName}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContainer>

      <ContractAmendmentItemFormDialog
        open={itemDialogOpen}
        onOpenChange={(open) => {
          setItemDialogOpen(open);
          if (!open) {
            setEditingItem(null);
          }
        }}
        mode={editingItem ? "edit" : "create"}
        item={editingItem}
        contractServiceItems={contractServiceItems}
        isPending={addItemMutation.isPending || updateItemMutation.isPending}
        onSubmit={(values) => {
          if (editingItem) {
            updateItemMutation.mutate(
              {
                amendmentId: amendment.id,
                itemId: editingItem.id,
                values: values as ContractAmendmentItemUpdateFormData,
              },
              {
                onSuccess: () => {
                  setItemDialogOpen(false);
                  setEditingItem(null);
                },
              },
            );
            return;
          }

          addItemMutation.mutate(
            {
              amendmentId: amendment.id,
              values: values as ContractAmendmentItemCreateFormData,
            },
            {
              onSuccess: () => setItemDialogOpen(false),
            },
          );
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteCandidate)}
        onOpenChange={(open) => !open && setDeleteCandidate(null)}
        title={t("contracts.amendments.deleteItemTitle", {
          defaultValue: "Delete Amendment Item",
        })}
        message={t("contracts.amendments.deleteItemMessage", {
          defaultValue: "Are you sure you want to delete this amendment item?",
        })}
        confirmLabel={t("common.delete", { defaultValue: "Delete" })}
        cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
        onConfirm={() => {
          if (!deleteCandidate) {
            return;
          }

          deleteItemMutation.mutate(
            {
              itemId: deleteCandidate.id,
              amendmentId: amendment.id,
            },
            {
              onSuccess: () => setDeleteCandidate(null),
            },
          );
        }}
        isPending={deleteItemMutation.isPending}
      />

      <ConfirmDialog
        open={approveDialogOpen}
        onOpenChange={setApproveDialogOpen}
        title={t("contracts.amendments.approveTitle", {
          defaultValue: "Approve Amendment",
        })}
        message={t("contracts.amendments.approveMessage", {
          defaultValue: "This draft amendment will be locked and marked as approved.",
        })}
        confirmLabel={t("contracts.amendments.approve", {
          defaultValue: "Approve Amendment",
        })}
        cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
        onConfirm={() =>
          approveMutation.mutate(
            { amendmentId: amendment.id },
            {
              onSuccess: () => setApproveDialogOpen(false),
            },
          )
        }
        isPending={approveMutation.isPending}
        confirmVariant="default"
      />

      <ConfirmDialog
        open={applyDialogOpen}
        onOpenChange={setApplyDialogOpen}
        title={t("contracts.amendments.applyTitle", {
          defaultValue: "Apply Amendment",
        })}
        message={t("contracts.amendments.applyMessage", {
          defaultValue:
            "Applying this amendment will update the contract and current service commitments.",
        })}
        confirmLabel={t("contracts.amendments.apply", {
          defaultValue: "Apply Amendment",
        })}
        cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
        onConfirm={() =>
          applyMutation.mutate(
            {
              amendmentId: amendment.id,
              contractId: amendment.contractId,
            },
            {
              onSuccess: () => setApplyDialogOpen(false),
            },
          )
        }
        isPending={applyMutation.isPending}
        confirmVariant="default"
      />

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {t("contracts.amendments.rejectTitle", {
                defaultValue: "Reject Amendment",
              })}
            </DialogTitle>
            <DialogDescription>
              {t("contracts.amendments.rejectHint", {
                defaultValue:
                  "Provide a rejection reason. The amendment will remain read-only after rejection.",
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <label className="space-y-2">
              <span className="text-sm font-medium text-[var(--lux-text)]">
                {t("contracts.amendments.reason", { defaultValue: "Reason" })}
              </span>
              <Input
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-[var(--lux-text)]">
                {t("common.notes", { defaultValue: "Notes" })}
              </span>
              <Textarea
                value={rejectNotes}
                onChange={(event) => setRejectNotes(event.target.value)}
              />
            </label>

            {rejectError ? (
              <p className="text-sm text-[var(--lux-danger)]">{rejectError}</p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={rejectMutation.isPending}
              onClick={() => setRejectDialogOpen(false)}
            >
              {t("common.cancel", { defaultValue: "Cancel" })}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={rejectMutation.isPending}
              onClick={() => {
                if (!rejectReason.trim()) {
                  setRejectError(
                    t("contracts.amendments.validation.rejectReasonRequired", {
                      defaultValue: "Rejection reason is required.",
                    }),
                  );
                  return;
                }

                setRejectError("");
                rejectMutation.mutate(
                  {
                    amendmentId: amendment.id,
                    values: {
                      reason: rejectReason,
                      notes: rejectNotes,
                    },
                  },
                  {
                    onSuccess: () => setRejectDialogOpen(false),
                  },
                );
              }}
            >
              {rejectMutation.isPending
                ? t("common.processing", { defaultValue: "Processing..." })
                : t("contracts.amendments.reject", {
                    defaultValue: "Reject Amendment",
                  })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ContractAmendmentDetailsPage;
