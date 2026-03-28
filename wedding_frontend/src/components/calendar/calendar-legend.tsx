import { cn } from "@/lib/utils";

import type { AppCalendarAccent, AppCalendarLegendItem } from "./types";

type CalendarLegendProps = {
  items: AppCalendarLegendItem[];
  className?: string;
};

function getLegendAccentStyle(accent: AppCalendarAccent) {
  if (accent === "gold") {
    return {
      color: "var(--color-primary)",
      background: "color-mix(in srgb, var(--color-primary) 18%, var(--color-surface))",
      borderColor: "color-mix(in srgb, var(--color-primary) 42%, transparent)",
    };
  }

  if (accent === "emerald") {
    return {
      color: "var(--color-success)",
      background: "color-mix(in srgb, var(--color-success) 16%, var(--color-surface))",
      borderColor: "color-mix(in srgb, var(--color-success) 40%, transparent)",
    };
  }

  if (accent === "blue") {
    return {
      color: "var(--color-info)",
      background: "color-mix(in srgb, var(--color-info) 15%, var(--color-surface))",
      borderColor: "color-mix(in srgb, var(--color-info) 38%, transparent)",
    };
  }

  if (accent === "rose") {
    return {
      color: "var(--color-danger)",
      background: "color-mix(in srgb, var(--color-danger) 14%, var(--color-surface))",
      borderColor: "color-mix(in srgb, var(--color-danger) 36%, transparent)",
    };
  }

  return {
    color: "var(--color-text-subtle)",
    background: "var(--color-surface)",
    borderColor: "var(--color-border)",
  };
}

export function CalendarLegend({ items, className }: CalendarLegendProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {items.map((item) => (
        <span
          key={item.id}
          className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold"
          style={getLegendAccentStyle(item.accent)}
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
