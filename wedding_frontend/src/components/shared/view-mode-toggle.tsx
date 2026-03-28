import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type ViewModeOption<T extends string> = {
  value: T;
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
};

type ViewModeToggleProps<T extends string> = {
  ariaLabel: string;
  options: Array<ViewModeOption<T>>;
  value: T;
  onValueChange: (value: T) => void;
  className?: string;
};

export function ViewModeToggle<T extends string>({
  ariaLabel,
  options,
  value,
  onValueChange,
  className,
}: ViewModeToggleProps<T>) {
  return (
    <div
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center gap-1 rounded-[6px] border p-1",
        className,
      )}
      role="tablist"
      style={{
        background: "var(--lux-control-surface)",
        borderColor: "var(--lux-control-border)",
      }}
    >
      {options.map((option) => {
        const Icon = option.icon;
        const active = option.value === value;

        return (
          <button
            key={option.value}
            aria-pressed={active}
            className={cn(
              "inline-flex items-center gap-2 rounded-[4px] px-3 py-2 text-sm font-medium transition",
              active
                ? "text-[var(--lux-primary-text)]"
                : "text-[var(--lux-text-secondary)] hover:text-[var(--lux-text)]",
              option.disabled && "cursor-not-allowed opacity-50",
            )}
            disabled={option.disabled}
            role="tab"
            style={
              active
                ? {
                    background: "var(--lux-primary-surface)",
                    borderColor: "var(--lux-gold-border)",
                  }
                : undefined
            }
            type="button"
            onClick={() => {
              if (!option.disabled) {
                onValueChange(option.value);
              }
            }}
          >
            <Icon className="h-4 w-4" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
