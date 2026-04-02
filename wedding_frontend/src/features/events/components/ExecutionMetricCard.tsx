type Props = {
  label: string;
  value: string | number;
  helper?: string;
};

export function ExecutionMetricCard({ label, value, helper }: Props) {
  return (
    <div className="rounded-[22px] border border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)] px-4 py-4">
      <p className="text-xs font-semibold text-[var(--lux-text-muted)]">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-[var(--lux-heading)]">
        {value}
      </p>
      {helper ? (
        <p className="mt-1 text-xs text-[var(--lux-text-secondary)]">
          {helper}
        </p>
      ) : null}
    </div>
  );
}
