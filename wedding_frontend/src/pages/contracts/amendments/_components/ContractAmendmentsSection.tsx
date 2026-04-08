import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCreateContractAmendment } from "@/hooks/contracts/useContractAmendmentMutations";
import { useContractAmendments } from "@/hooks/contracts/useContractAmendments";
import type {
  ContractAmendmentStatus,
} from "@/pages/contracts/amendments/types";
import type { Contract } from "@/pages/contracts/types";

import { ContractAmendmentCreateDialog } from "./ContractAmendmentCreateDialog";
import { ContractAmendmentListCard } from "./ContractAmendmentListCard";
import { ContractAmendmentStatusBadge } from "./ContractAmendmentStatusBadge";

export function ContractAmendmentsSection({
  contract,
}: {
  contract: Contract;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const createAmendmentMutation = useCreateContractAmendment();
  const { data, isLoading } = useContractAmendments({
    contractId: contract.id,
    currentPage: 1,
    itemsPerPage: 100,
  });

  const amendments = data?.data ?? [];
  const visibleAmendments = amendments.slice(0, 5);
  const statusSummary = useMemo(() => {
    return amendments.reduce<Record<ContractAmendmentStatus, number>>(
      (accumulator, amendment) => {
        accumulator[amendment.status] += 1;
        return accumulator;
      },
      {
        draft: 0,
        approved: 0,
        applied: 0,
        rejected: 0,
        cancelled: 0,
      },
    );
  }, [amendments]);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle>
                {t("contracts.amendments.title", {
                  defaultValue: "Contract Amendments",
                })}
              </CardTitle>
              <CardDescription>
                {t("contracts.amendments.sectionHint", {
                  defaultValue:
                    "Track amendment drafts, approvals, and applied commercial changes without cluttering the contract screen.",
                })}
              </CardDescription>
            </div>

            <ProtectedComponent permission="contracts.update">
              <Button type="button" onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                {t("contracts.amendments.create", {
                  defaultValue: "Create Amendment",
                })}
              </Button>
            </ProtectedComponent>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-2xl border px-4 py-3 xl:col-span-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
                {t("contracts.amendments.count", {
                  defaultValue: "Amendments",
                })}
              </p>
              <p className="mt-1 text-lg font-semibold text-[var(--lux-heading)]">
                {data?.meta.total ?? amendments.length}
              </p>
            </div>
            {(
              [
                "draft",
                "approved",
                "applied",
                "rejected",
                "cancelled",
              ] as ContractAmendmentStatus[]
            ).map((status) => (
              <div key={status} className="rounded-2xl border px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <ContractAmendmentStatusBadge status={status} />
                  <span className="text-base font-semibold text-[var(--lux-heading)]">
                    {statusSummary[status]}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {isLoading ? (
            <p className="text-sm text-[var(--lux-text-secondary)]">
              {t("common.loading", { defaultValue: "Loading..." })}
            </p>
          ) : amendments.length ? (
            <div className="space-y-3">
              {visibleAmendments.map((amendment) => (
                <ContractAmendmentListCard
                  key={amendment.id}
                  amendment={amendment}
                  href={`/contracts/${contract.id}/amendments/${amendment.id}`}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--lux-text-secondary)]">
              {t("contracts.amendments.empty", {
                defaultValue: "No amendments have been created for this contract yet.",
              })}
            </p>
          )}
        </CardContent>
      </Card>

      <ContractAmendmentCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        contractId={contract.id}
        isPending={createAmendmentMutation.isPending}
        onSubmit={(values) => {
          createAmendmentMutation.mutate(values, {
            onSuccess: (amendment) => {
              setCreateDialogOpen(false);
              navigate(`/contracts/${contract.id}/amendments/${amendment.id}`);
            },
          });
        }}
      />
    </>
  );
}
