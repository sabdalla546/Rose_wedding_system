import type { LucideIcon } from "lucide-react";
import { Loader2 } from "lucide-react";

import { MetricTrend } from "@/components/dashboard/metric-trend";
import { SectionCard } from "@/components/shared/section-card";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  label: string;
  value: string;
  meta?: string;
  subtitle?: string;
  icon: LucideIcon;
  className?: string;
  trend?: {
    value: string;
    label?: string;
    direction?: "up" | "down" | "neutral";
  };
  loading?: boolean;
};

export function MetricCard({
  label,
  value,
  meta,
  subtitle,
  icon: Icon,
  className,
  trend,
  loading = false,
}: MetricCardProps) {
  return (
    <SectionCard className={cn("overflow-hidden", className)} elevated>
      {loading ? (
        <div className="flex min-h-[144px] items-center justify-center">
          <div className="app-icon-chip h-12 w-12 rounded-full">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        </div>
      ) : (
        <div className="relative flex items-start justify-between gap-4">
          <div className="space-y-3">
            <span className="text-sm font-medium text-[var(--lux-text-secondary)]">
              {label}
            </span>
            <div className="space-y-1.5">
              <p className="text-3xl font-semibold tracking-tight text-[var(--lux-heading)]">
                {value}
              </p>
              {meta ? (
                <p className="text-sm text-[var(--lux-text-muted)]">{meta}</p>
              ) : null}
              {subtitle ? (
                <p className="text-xs text-[var(--lux-text-secondary)]">{subtitle}</p>
              ) : null}
            </div>
            {trend ? (
              <MetricTrend
                value={trend.value}
                label={trend.label}
                direction={trend.direction}
              />
            ) : null}
          </div>
          <div className="app-icon-chip h-12 w-12 rounded-[var(--radius-md)]">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      )}
    </SectionCard>
  );
}
