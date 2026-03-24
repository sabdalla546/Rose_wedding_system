import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

type MetricTrendProps = {
  value: string;
  label?: string;
  direction?: "up" | "down" | "neutral";
  className?: string;
};

const directionStyles = {
  up: {
    icon: ArrowUpRight,
    color: "var(--color-success)",
    background: "var(--color-success-soft)",
  },
  down: {
    icon: ArrowDownRight,
    color: "var(--color-danger)",
    background: "var(--color-danger-soft)",
  },
  neutral: {
    icon: ArrowRight,
    color: "var(--color-info)",
    background: "var(--color-info-soft)",
  },
} as const;

export function MetricTrend({
  value,
  label,
  direction = "neutral",
  className,
}: MetricTrendProps) {
  const tone = directionStyles[direction];
  const Icon = tone.icon;

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <span
        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
        style={{
          color: tone.color,
          background: tone.background,
        }}
      >
        <Icon className="h-3.5 w-3.5" />
        {value}
      </span>
      {label ? (
        <span className="text-xs text-[var(--lux-text-muted)]">{label}</span>
      ) : null}
    </div>
  );
}
