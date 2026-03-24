import { cn } from "@/lib/utils";
import type { AppCalendarAccent } from "./types";

type EventTypeBadgeProps = {
  label: string;
  accent?: AppCalendarAccent;
  className?: string;
};

export function EventTypeBadge({
  label,
  accent = "slate",
  className,
}: EventTypeBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.12em] uppercase",
        className,
      )}
      style={{
        color: `var(--color-text)`,
        background:
          accent === "gold"
            ? "var(--color-warning-soft)"
            : accent === "emerald"
              ? "var(--color-success-soft)"
              : accent === "blue"
                ? "var(--color-info-soft)"
                : accent === "rose"
                  ? "var(--color-danger-soft)"
                  : "var(--color-surface-3)",
        borderColor:
          accent === "gold"
            ? "color-mix(in srgb, var(--color-warning) 30%, transparent)"
            : accent === "emerald"
              ? "color-mix(in srgb, var(--color-success) 28%, transparent)"
              : accent === "blue"
                ? "color-mix(in srgb, var(--color-info) 28%, transparent)"
                : accent === "rose"
                  ? "color-mix(in srgb, var(--color-danger) 28%, transparent)"
                  : "var(--color-border)",
      }}
    >
      {label}
    </span>
  );
}
