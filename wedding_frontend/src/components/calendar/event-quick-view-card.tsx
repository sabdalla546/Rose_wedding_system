import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { CalendarRange } from "lucide-react";

import { SectionCard } from "@/components/shared/section-card";
import { Separator } from "@/components/ui/separator";

type EventQuickViewInfo = {
  label: string;
  value: string;
  icon: LucideIcon;
};

export type EventQuickViewData = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  badges?: ReactNode;
  warning?: string;
  infoItems: EventQuickViewInfo[];
  notes?: string;
  notesLabel?: string;
  actions?: ReactNode;
};

type EventQuickViewCardProps = {
  data: EventQuickViewData | null;
  emptyTitle: string;
  emptyDescription: string;
  className?: string;
};

export function EventQuickViewCard({
  data,
  emptyTitle,
  emptyDescription,
  className,
}: EventQuickViewCardProps) {
  if (!data) {
    return (
      <SectionCard className={className}>
        <div className="app-empty-state min-h-[360px]">
          <div className="app-icon-chip mb-4 h-12 w-12 rounded-full">
            <CalendarRange className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--lux-heading)]">
            {emptyTitle}
          </h3>
          <p className="mt-2 max-w-sm text-sm text-[var(--lux-text-muted)]">
            {emptyDescription}
          </p>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard className={className}>
      <div className="space-y-5">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              {data.eyebrow ? (
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--lux-text-muted)]">
                  {data.eyebrow}
                </p>
              ) : null}
              <div className="space-y-1.5">
                <h3 className="text-2xl font-semibold text-[var(--lux-heading)]">
                  {data.title}
                </h3>
                {data.subtitle ? (
                  <p className="text-sm text-[var(--lux-text-secondary)]">
                    {data.subtitle}
                  </p>
                ) : null}
              </div>
            </div>
            {data.badges ? <div className="flex flex-wrap gap-2">{data.badges}</div> : null}
          </div>

          {data.warning ? (
            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
              {data.warning}
            </div>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {data.infoItems.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={`${item.label}-${item.value}`}
                className="app-info-block"
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--lux-control-hover)] text-[var(--lux-gold)]">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--lux-text-muted)]">
                  {item.label}
                </p>
                <p className="mt-2 text-sm font-medium text-[var(--lux-text)]">
                  {item.value}
                </p>
              </div>
            );
          })}
        </div>

        <Separator />

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--lux-text-muted)]">
            {data.notesLabel ?? "Notes"}
          </p>
          <p className="app-info-block text-sm leading-6 text-[var(--lux-text-secondary)]">
            {data.notes || "No notes added."}
          </p>
        </div>

        {data.actions ? (
          <div className="grid gap-3 sm:grid-cols-2 [&>button]:w-full">
            {data.actions}
          </div>
        ) : null}
      </div>
    </SectionCard>
  );
}
