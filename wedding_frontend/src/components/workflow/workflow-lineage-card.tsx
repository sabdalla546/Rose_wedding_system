import type { ReactNode } from "react";

export function WorkflowLineageCard({
  title,
  items,
}: {
  title: string;
  items: Array<{
    label: string;
    value: ReactNode;
    helper?: ReactNode;
  }>;
}) {
  return (
    <section className="rounded-[22px] border border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)] p-4 sm:p-5">
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-[var(--lux-heading)]">{title}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <div
              key={item.label}
              className="rounded-[18px] border border-[var(--lux-row-border)] bg-[var(--lux-row-surface)] p-4"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
                {item.label}
              </p>
              <div className="mt-2 text-sm text-[var(--lux-text)]">{item.value}</div>
              {item.helper ? (
                <div className="mt-2 text-xs text-[var(--lux-text-secondary)]">{item.helper}</div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
