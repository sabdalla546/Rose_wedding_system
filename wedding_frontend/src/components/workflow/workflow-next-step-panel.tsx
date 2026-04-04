import type { ReactNode } from "react";

import { SectionCard } from "@/components/shared/section-card";

export type WorkflowNextStepItem = {
  id: string;
  title: string;
  description: string;
  tone?: "default" | "warning" | "success";
  action?: ReactNode;
};

const toneClassNames: Record<NonNullable<WorkflowNextStepItem["tone"]>, string> = {
  default:
    "border-[var(--lux-row-border)] bg-[var(--lux-row-surface)]",
  warning:
    "border-amber-400/35 bg-amber-500/10",
  success:
    "border-emerald-500/25 bg-emerald-500/10",
};

export function WorkflowNextStepPanel({
  title,
  description,
  items,
}: {
  title: string;
  description?: string;
  items: WorkflowNextStepItem[];
}) {
  if (!items.length) {
    return null;
  }

  return (
    <SectionCard className="space-y-4">
      <div className="space-y-1.5">
        <h2 className="text-lg font-semibold text-[var(--lux-heading)]">{title}</h2>
        {description ? (
          <p className="text-sm text-[var(--lux-text-secondary)]">{description}</p>
        ) : null}
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className={`rounded-[20px] border p-4 ${toneClassNames[item.tone ?? "default"]}`}
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-1.5">
                <p className="text-sm font-semibold text-[var(--lux-heading)]">{item.title}</p>
                <p className="text-sm text-[var(--lux-text-secondary)]">{item.description}</p>
              </div>
              {item.action ? <div className="flex shrink-0">{item.action}</div> : null}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
