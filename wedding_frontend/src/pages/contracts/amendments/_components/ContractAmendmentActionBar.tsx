import { CheckCheck, Plus, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import type { ContractAmendmentStatus } from "@/pages/contracts/amendments/types";

import {
  canApplyContractAmendment,
  canApproveContractAmendment,
  canEditContractAmendment,
  canRejectContractAmendment,
} from "../adapters";

export function ContractAmendmentActionBar({
  status,
  isApprovePending,
  isRejectPending,
  isApplyPending,
  onAddItem,
  onApprove,
  onReject,
  onApply,
}: {
  status: ContractAmendmentStatus;
  isApprovePending?: boolean;
  isRejectPending?: boolean;
  isApplyPending?: boolean;
  onAddItem?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onApply?: () => void;
}) {
  const { t } = useTranslation();
  const isReadOnly = !canEditContractAmendment(status);

  return (
    <section className="rounded-[22px] border border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)] p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1.5">
          <h2 className="text-base font-semibold text-[var(--lux-heading)]">
            {t("contracts.amendments.actionsTitle", {
              defaultValue: "Amendment Actions",
            })}
          </h2>
          <p className="text-sm text-[var(--lux-text-secondary)]">
            {isReadOnly
              ? t("contracts.amendments.readOnlyHint", {
                  defaultValue:
                    "This amendment is read-only. Only remaining workflow actions are available.",
                })
              : t("contracts.amendments.draftHint", {
                  defaultValue:
                    "Add or adjust amendment items while the amendment is still in draft.",
                })}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {canEditContractAmendment(status) ? (
            <Button type="button" variant="outline" onClick={onAddItem}>
              <Plus className="h-4 w-4" />
              {t("contracts.amendments.addItem", {
                defaultValue: "Add Item",
              })}
            </Button>
          ) : null}
          {canApproveContractAmendment(status) ? (
            <Button type="button" disabled={isApprovePending} onClick={onApprove}>
              <CheckCheck className="h-4 w-4" />
              {isApprovePending
                ? t("common.processing", { defaultValue: "Processing..." })
                : t("contracts.amendments.approve", {
                    defaultValue: "Approve Amendment",
                  })}
            </Button>
          ) : null}
          {canRejectContractAmendment(status) ? (
            <Button
              type="button"
              variant="destructive"
              disabled={isRejectPending}
              onClick={onReject}
            >
              <XCircle className="h-4 w-4" />
              {isRejectPending
                ? t("common.processing", { defaultValue: "Processing..." })
                : t("contracts.amendments.reject", {
                    defaultValue: "Reject Amendment",
                  })}
            </Button>
          ) : null}
          {canApplyContractAmendment(status) ? (
            <Button
              type="button"
              variant="secondary"
              disabled={isApplyPending}
              onClick={onApply}
            >
              <CheckCheck className="h-4 w-4" />
              {isApplyPending
                ? t("common.processing", { defaultValue: "Processing..." })
                : t("contracts.amendments.apply", {
                    defaultValue: "Apply Amendment",
                  })}
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
