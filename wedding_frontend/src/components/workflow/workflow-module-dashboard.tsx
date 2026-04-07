import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Loader2, CalendarClock } from "lucide-react";

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

type WorkflowModuleDashboardProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  metrics?: WorkflowDashboardMetric[];
  statuses?: WorkflowDashboardStatus[];
  statusesTitle?: string;
  statusesDescription?: string;
  footer?: ReactNode;
  loading?: boolean;
  showContentLabel?: string;
  hideContentLabel?: string;
  defaultExpanded?: boolean;
};

export function WorkflowModuleDashboard({
  eyebrow = "Workflow Dashboard",
  title,
  description,
  metrics = [],
  statuses = [],
  statusesTitle = "Status Distribution",
  statusesDescription = "Use these quick filters to jump into the current workflow queue.",
  footer,
  loading = false,
  showContentLabel,
  hideContentLabel,
  defaultExpanded = true,
}: WorkflowModuleDashboardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const safeMetrics = useMemo(
    () => (Array.isArray(metrics) ? metrics : []),
    [metrics],
  );

  const safeStatuses = useMemo(
    () => (Array.isArray(statuses) ? statuses : []),
    [statuses],
  );

  return (
    <SectionCard className="space-y-5">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--lux-text-muted)]">
            {eyebrow}
          </p>

          <h2 className="text-lg font-semibold text-[var(--lux-heading)]">
            {title}
          </h2>

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
          {safeMetrics.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {safeMetrics.map((metric) => (
                <div
                  key={metric.id}
                  className="group relative overflow-hidden rounded-[14px] border p-5 transition-all duration-200"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(20,20,20,0.96) 0%, rgba(14,14,14,0.98) 100%)",
                    borderColor: "rgba(201, 162, 39, 0.28)",
                    boxShadow:
                      "inset 0 1px 0 rgba(255,255,255,0.03), 0 0 0 1px rgba(201,162,39,0.04)",
                  }}
                >
                  <div className="pointer-events-none absolute inset-0 opacity-80">
                    <div
                      className="absolute inset-x-0 top-0 h-px"
                      style={{
                        background:
                          "linear-gradient(90deg, rgba(201,162,39,0) 0%, rgba(201,162,39,0.32) 50%, rgba(201,162,39,0) 100%)",
                      }}
                    />
                  </div>

                  <div className="flex h-full flex-col">
                    <div className="mb-4 flex items-start justify-between">
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-full"
                        style={{
                          background: "rgba(201, 162, 39, 0.08)",
                          border: "1px solid rgba(201, 162, 39, 0.18)",
                        }}
                      >
                        <CalendarClock
                          className="h-4 w-4"
                          style={{ color: "var(--lux-gold)" }}
                        />
                      </div>
                    </div>

                    <p
                      className="text-sm font-semibold"
                      style={{ color: "var(--lux-text-secondary)" }}
                    >
                      {metric.label}
                    </p>

                    <p
                      className="mt-2 text-5xl font-bold leading-none tracking-tight"
                      style={{ color: "var(--lux-heading)" }}
                    >
                      {metric.value}
                    </p>

                    {metric.helper ? (
                      <p
                        className="mt-4 text-sm leading-6"
                        style={{ color: "var(--lux-text)" }}
                      >
                        {metric.helper}
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {safeStatuses.length ? (
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
                {safeStatuses.map((status) => (
                  <Button
                    key={status.key}
                    type="button"
                    variant={status.active ? "default" : "outline"}
                    className="h-auto min-h-11 rounded-[16px] px-4 py-2 text-left"
                    onClick={status.onClick}
                  >
                    <span className="flex flex-col items-start">
                      <span className="text-xs font-medium opacity-80">
                        {status.label}
                      </span>
                      <span className="text-sm font-semibold">
                        {status.count}
                      </span>
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
