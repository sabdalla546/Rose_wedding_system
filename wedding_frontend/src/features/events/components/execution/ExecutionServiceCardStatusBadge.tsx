import { CheckCircle2, CircleDashed, Loader2, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  getExecutionServiceDetailStatusLabel,
  isExecutionServiceDetailReady,
} from "@/pages/execution/adapters";
import type { ExecutionServiceDetailStatus } from "@/pages/execution/types";
import { cn } from "@/lib/utils";

const statusStyles: Record<
  ExecutionServiceDetailStatus,
  {
    border: string;
    background: string;
    text: string;
    icon: typeof CircleDashed;
  }
> = {
  pending: {
    border: "border-[color-mix(in_srgb,var(--color-warning)_36%,transparent)]",
    background: "bg-[color-mix(in_srgb,var(--color-warning)_14%,transparent)]",
    text: "text-[var(--color-warning)]",
    icon: CircleDashed,
  },
  draft: {
    border: "border-[var(--lux-row-border)]",
    background: "bg-[var(--lux-control-hover)]",
    text: "text-[var(--lux-text-secondary)]",
    icon: Sparkles,
  },
  ready: {
    border: "border-[color-mix(in_srgb,var(--color-success)_36%,transparent)]",
    background: "bg-[color-mix(in_srgb,var(--color-success)_14%,transparent)]",
    text: "text-[var(--color-success)]",
    icon: CheckCircle2,
  },
  in_progress: {
    border: "border-[color-mix(in_srgb,var(--lux-gold)_34%,transparent)]",
    background: "bg-[color-mix(in_srgb,var(--lux-gold)_12%,transparent)]",
    text: "text-[var(--lux-gold)]",
    icon: Loader2,
  },
  done: {
    border: "border-[color-mix(in_srgb,var(--color-success)_40%,transparent)]",
    background: "bg-[color-mix(in_srgb,var(--color-success)_16%,transparent)]",
    text: "text-[var(--color-success)]",
    icon: CheckCircle2,
  },
};

type Props = {
  status: ExecutionServiceDetailStatus;
  className?: string;
};

export function ExecutionServiceCardStatusBadge({
  status,
  className,
}: Props) {
  const { t } = useTranslation();
  const style = statusStyles[status];
  const Icon = style.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[6px] border px-2.5 py-1 text-[11px] font-semibold",
        style.border,
        style.background,
        style.text,
        className,
      )}
    >
      <Icon
        className={cn(
          "h-3 w-3",
          status === "in_progress" ? "animate-spin" : "",
        )}
      />
      <span>{getExecutionServiceDetailStatusLabel(status, t)}</span>
      <span className="text-[9px] uppercase tracking-[0.12em] opacity-80">
        {isExecutionServiceDetailReady(status)
          ? t("execution.readyState", { defaultValue: "Ready" })
          : t("execution.pendingState", { defaultValue: "Pending" })}
      </span>
    </span>
  );
}
