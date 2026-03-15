import { cn } from '@/lib/utils'

type SummaryChipProps = {
  label: string
  value: string
  detail: string
  className?: string
}

export function SummaryChip({ label, value, detail, className }: SummaryChipProps) {
  return (
    <div
      className={cn(
        'lux-elevated flex min-w-[220px] flex-1 flex-col gap-2 p-4 md:p-5',
        className,
      )}
    >
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--lux-text-muted)]">
        {label}
      </span>
      <div className="flex items-end justify-between gap-3">
        <span className="text-2xl font-semibold text-[var(--lux-text)]">{value}</span>
        <span className="text-sm text-[var(--lux-text-secondary)]">{detail}</span>
      </div>
    </div>
  )
}
