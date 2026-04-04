import type { ReactNode } from "react";
import { AlertTriangle, Info, Lock } from "lucide-react";

import { cn } from "@/lib/utils";

type FormFeedbackTone = "error" | "warning" | "info";

const toneClasses: Record<
  FormFeedbackTone,
  { wrapper: string; icon: string; title: string; description: string }
> = {
  error: {
    wrapper:
      "border-[color:color-mix(in_srgb,var(--lux-danger)_35%,transparent)] bg-[color:color-mix(in_srgb,var(--lux-danger)_10%,transparent)]",
    icon: "text-[var(--lux-danger)]",
    title: "text-[var(--lux-danger)]",
    description: "text-[color:color-mix(in_srgb,var(--lux-danger)_84%,black)]",
  },
  warning: {
    wrapper:
      "border-[color:color-mix(in_srgb,var(--lux-gold)_28%,var(--lux-row-border))] bg-[color:color-mix(in_srgb,var(--lux-gold)_10%,transparent)]",
    icon: "text-[var(--lux-gold)]",
    title: "text-[var(--lux-heading)]",
    description: "text-[var(--lux-text-secondary)]",
  },
  info: {
    wrapper:
      "border-[var(--lux-row-border)] bg-[var(--lux-row-surface)]",
    icon: "text-[var(--lux-gold)]",
    title: "text-[var(--lux-heading)]",
    description: "text-[var(--lux-text-secondary)]",
  },
};

export function getFirstFormErrorMessage(value: unknown): string | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  if (
    "message" in value &&
    typeof (value as { message?: unknown }).message === "string"
  ) {
    const message = (value as { message: string }).message.trim();
    if (message) {
      return message;
    }
  }

  const nestedValues = Array.isArray(value)
    ? value
    : Object.values(value as Record<string, unknown>);

  for (const nestedValue of nestedValues) {
    const message = getFirstFormErrorMessage(nestedValue);
    if (message) {
      return message;
    }
  }

  return null;
}

export function FormFeedbackBanner({
  title,
  message,
  tone = "info",
  className,
}: {
  title: ReactNode;
  message: ReactNode;
  tone?: FormFeedbackTone;
  className?: string;
}) {
  const Icon = tone === "error" ? AlertTriangle : tone === "warning" ? Lock : Info;
  const classes = toneClasses[tone];

  return (
    <div
      className={cn(
        "rounded-[18px] border px-4 py-3",
        classes.wrapper,
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("mt-0.5", classes.icon)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="space-y-1">
          <p className={cn("text-sm font-semibold", classes.title)}>{title}</p>
          <div className={cn("text-sm", classes.description)}>{message}</div>
        </div>
      </div>
    </div>
  );
}
