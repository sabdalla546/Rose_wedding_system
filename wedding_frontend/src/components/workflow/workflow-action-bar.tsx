import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import type { WorkflowActionDefinition } from "@/lib/workflow/workflow";

type WorkflowActionItem = WorkflowActionDefinition & {
  icon?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
};

export function WorkflowActionBar({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions: WorkflowActionItem[];
}) {
  if (!actions.length) {
    return null;
  }

  return (
    <section className="rounded-[22px] border border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)] p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1.5">
          <h2 className="text-base font-semibold text-[var(--lux-heading)]">
            {title}
          </h2>
          {description ? (
            <p className="text-sm text-[var(--lux-text-secondary)]">
              {description}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <Button
              key={action.key}
              variant={action.variant ?? "outline"}
              disabled={action.disabled || action.loading}
              onClick={action.onClick}
            >
              {action.icon}
              {action.loading ? "Processing..." : action.label}
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
}
