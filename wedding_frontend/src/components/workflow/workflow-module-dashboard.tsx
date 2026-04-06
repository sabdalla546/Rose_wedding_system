import type { ReactNode } from "react";
import { useState } from "react";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";

import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";

type WorkflowDashboardMetric = {
  id: string;
  label: string;
  value: string | number;
  helper?: string;
};

type WorkflowDashboardStatus = {
  key: string;
  label: string;
  count: number;
  active?: boolean;
  onClick?: () => void;
};

export function WorkflowModuleDashboard({
  eyebrow = "Workflow Dashboard",
  title,
  description,
  metrics,
  statuses,
  statusesTitle = "Status Distribution",
  statusesDescription = "Use these quick filters to jump into the current workflow queue.",
  footer,
  loading = false,
  showContentLabel,
  hideContentLabel,
  defaultExpanded = true,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  metrics: WorkflowDashboardMetric[];
  statuses: WorkflowDashboardStatus[];
  statusesTitle?: string;
  statusesDescription?: string;
  footer?: ReactNode;
  loading?: boolean;
  showContentLabel?: string;
  hideContentLabel?: string;
  defaultExpanded?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <SectionCard className="space-y-5">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--lux-text-muted)]">
            {eyebrow}
          </p>
          <h2 className="text-lg font-semibold text-[var(--lux-heading)]">{title}</h2>
          {description ? (
            <p className="max-w-3xl text-sm text-[var(--lux-text-secondary)]">
              {description}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2 self-start">
          {showContentLabel && hideContentLabel ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setIsExpanded((current) => !current)}
            >
              {isExpanded ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
              {isExpanded ? hideContentLabel : showContentLabel}
            </Button>
          ) : null}
          {loading ? (
            <div className="app-icon-chip h-10 w-10 rounded-full">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : null}
        </div>
      </div>

      {isExpanded ? (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <div
                key={metric.id}
                className="rounded-[20px] border border-[var(--lux-row-border)] bg-[var(--lux-row-surface)] p-4"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
                  {metric.label}
                </p>
                <p className="mt-2 text-2xl font-semibold text-[var(--lux-heading)]">
                  {metric.value}
                </p>
                {metric.helper ? (
                  <p className="mt-2 text-xs leading-5 text-[var(--lux-text-secondary)]">
                    {metric.helper}
                  </p>
                ) : null}
              </div>
            ))}
          </div>

          {statuses.length ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-[var(--lux-text)]">
                  {statusesTitle}
                </p>
                <p className="text-sm text-[var(--lux-text-secondary)]">
                  {statusesDescription}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {statuses.map((status) => (
                  <Button
                    key={status.key}
                    type="button"
                    variant={status.active ? "default" : "outline"}
                    className="h-auto min-h-11 rounded-[16px] px-4 py-2 text-left"
                    onClick={status.onClick}
                  >
                    <span className="flex flex-col items-start">
                      <span className="text-xs font-medium opacity-80">{status.label}</span>
                      <span className="text-sm font-semibold">{status.count}</span>
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          ) : null}

          {footer ? <div>{footer}</div> : null}
        </>
      ) : null}
    </SectionCard>
  );
}
