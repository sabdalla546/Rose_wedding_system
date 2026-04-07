import type { PropsWithChildren, ReactNode } from "react";

import { SectionCard } from "@/components/shared/section-card";
import { cn } from "@/lib/utils";

type SummaryCardProps = PropsWithChildren<{
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  accent?: ReactNode;
  className?: string;
}>;

export function SummaryCard({
  label,
  value,
  hint,
  accent,
  className,
  children,
}: SummaryCardProps) {
  return (
    <SectionCard
      className={cn("dashboard-summary-card space-y-3", className)}
      elevated
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--lux-text-muted)]">
            {label}
          </p>
          <div className="text-2xl font-semibold text-[var(--lux-heading)]">
            {value}
          </div>
        </div>
        {accent ? <div>{accent}</div> : null}
      </div>
      {hint ? (
        <p className="text-sm text-[var(--lux-text-secondary)]">{hint}</p>
      ) : null}
      {children}
    </SectionCard>
  );
}
