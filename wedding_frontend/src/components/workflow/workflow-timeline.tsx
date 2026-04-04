import type { Locale } from "date-fns";
import { format } from "date-fns";

import { SectionCard } from "@/components/shared/section-card";

export type WorkflowTimelineItem = {
  id: string;
  title: string;
  description?: string;
  timestamp?: string | null;
  status?: "done" | "current" | "warning";
};

const statusClassNames: Record<NonNullable<WorkflowTimelineItem["status"]>, string> = {
  done: "bg-emerald-500",
  current: "bg-[var(--lux-gold)]",
  warning: "bg-amber-500",
};

const formatTimestamp = (timestamp?: string | null, locale?: Locale) => {
  if (!timestamp) {
    return null;
  }

  const parsed = new Date(timestamp);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return format(parsed, "PPP p", { locale });
};

export function WorkflowTimeline({
  title,
  description,
  items,
  partialHistoryLabel,
  emptyMessage,
  locale,
}: {
  title: string;
  description?: string;
  items: WorkflowTimelineItem[];
  partialHistoryLabel?: string;
  emptyMessage?: string;
  locale?: Locale;
}) {
  return (
    <SectionCard className="space-y-4">
      <div className="space-y-1.5">
        <h2 className="text-lg font-semibold text-[var(--lux-heading)]">{title}</h2>
        {description ? (
          <p className="text-sm text-[var(--lux-text-secondary)]">{description}</p>
        ) : null}
        {partialHistoryLabel ? (
          <p className="text-xs leading-5 text-[var(--lux-text-muted)]">{partialHistoryLabel}</p>
        ) : null}
      </div>

      {items.length ? (
        <div className="space-y-0">
          {items.map((item, index) => {
            const timestampLabel = formatTimestamp(item.timestamp, locale);

            return (
              <div key={item.id} className="relative flex gap-4 pb-5 last:pb-0">
                {index < items.length - 1 ? (
                  <div className="absolute left-[10px] top-6 h-[calc(100%-8px)] w-px bg-[var(--lux-row-border)]" />
                ) : null}
                <div
                  className={`mt-1 h-5 w-5 shrink-0 rounded-full ${
                    statusClassNames[item.status ?? "done"]
                  }`}
                />
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-col gap-1 lg:flex-row lg:items-center lg:justify-between">
                    <p className="text-sm font-semibold text-[var(--lux-heading)]">{item.title}</p>
                    {timestampLabel ? (
                      <p className="text-xs text-[var(--lux-text-muted)]">{timestampLabel}</p>
                    ) : null}
                  </div>
                  {item.description ? (
                    <p className="text-sm text-[var(--lux-text-secondary)]">{item.description}</p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-[var(--lux-text-secondary)]">
          {emptyMessage ?? "No timeline details are available yet."}
        </p>
      )}
    </SectionCard>
  );
}
