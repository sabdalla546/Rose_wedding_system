import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import type { ContractAmendment } from "@/pages/contracts/amendments/types";

import {
  formatContractAmendmentDelta,
  getContractAmendmentDisplayNumber,
} from "../adapters";
import { ContractAmendmentStatusBadge } from "./ContractAmendmentStatusBadge";

export function ContractAmendmentListCard({
  amendment,
  href,
}: {
  amendment: ContractAmendment;
  href: string;
}) {
  const { t } = useTranslation();

  return (
    <div
      className="rounded-[20px] border p-4"
      style={{
        background: "var(--lux-row-surface)",
        borderColor: "var(--lux-row-border)",
      }}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-[var(--lux-heading)]">
              {getContractAmendmentDisplayNumber(amendment)}
            </p>
            <ContractAmendmentStatusBadge status={amendment.status} />
          </div>
          <p className="text-sm text-[var(--lux-text-secondary)]">
            {amendment.reason?.trim() ||
              t("contracts.amendments.noReason", {
                defaultValue: "No amendment reason provided.",
              })}
          </p>
          <div className="flex flex-wrap gap-3 text-xs text-[var(--lux-text-secondary)]">
            {Array.isArray(amendment.items) ? (
              <span>
                {t("contracts.amendments.items", { defaultValue: "Items" })}:{" "}
                {amendment.items.length}
              </span>
            ) : null}
            <span>
              {t("contracts.amendments.totalDelta", {
                defaultValue: "Total Delta",
              })}
              : {formatContractAmendmentDelta(amendment.totalDelta)}
            </span>
          </div>
        </div>

        <Button asChild size="sm" variant="outline">
          <Link to={href}>
            <ArrowUpRight className="h-4 w-4" />
            {t("common.open", { defaultValue: "Open" })}
          </Link>
        </Button>
      </div>
    </div>
  );
}
