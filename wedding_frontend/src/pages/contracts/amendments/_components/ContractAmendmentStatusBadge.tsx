import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import type { ContractAmendmentStatus } from "@/pages/contracts/amendments/types";

import { CONTRACT_AMENDMENT_STATUS_LABELS } from "../adapters";

const statusStyles: Record<ContractAmendmentStatus, string> = {
  draft:
    "border-slate-500/30 bg-slate-500/10 text-slate-200 dark:text-slate-200",
  approved:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  applied:
    "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  rejected:
    "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  cancelled:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
};

export function ContractAmendmentStatusBadge({
  status,
  className,
}: {
  status: ContractAmendmentStatus;
  className?: string;
}) {
  const { t } = useTranslation();

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        statusStyles[status],
        className,
      )}
    >
      {t(`contracts.amendments.status.${status}`, {
        defaultValue: CONTRACT_AMENDMENT_STATUS_LABELS[status],
      })}
    </span>
  );
}
