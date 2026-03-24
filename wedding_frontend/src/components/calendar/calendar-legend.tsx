import { cn } from "@/lib/utils";

import type { AppCalendarLegendItem } from "./types";

type CalendarLegendProps = {
  items: AppCalendarLegendItem[];
  className?: string;
};

export function CalendarLegend({ items, className }: CalendarLegendProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {items.map((item) => (
        <span
          key={item.id}
          className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-[var(--lux-text-secondary)]"
          style={{
            background: "var(--lux-control-surface)",
            borderColor: "var(--lux-control-border)",
          }}
        >
          <span
            className={cn("h-2.5 w-2.5 rounded-full", `app-calendar-accent-dot--${item.accent}`)}
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}
