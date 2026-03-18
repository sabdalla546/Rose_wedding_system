import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import type { PaymentScheduleStatus } from "@/pages/contracts/types";

const statusStyles: Record<PaymentScheduleStatus, string> = {
  pending:
    "border-slate-500/30 bg-slate-500/10 text-slate-200 dark:text-slate-200",
  paid:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  cancelled:
    "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  overdue:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
};

export function PaymentScheduleStatusBadge({
  status,
  className,
}: {
  status: PaymentScheduleStatus;
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
      {t(`contracts.paymentStatus.${status}`, {
        defaultValue: status,
      })}
    </span>
  );
}
