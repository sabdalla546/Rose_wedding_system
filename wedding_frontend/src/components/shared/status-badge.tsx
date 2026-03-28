import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'
import type { StatusType } from '@/types/shared'

const statusStyles: Record<
  StatusType,
  {
    background: string
    borderColor: string
    color: string
  }
> = {
  Inquiry: {
    background: 'var(--color-info-soft)',
    borderColor: 'color-mix(in srgb, var(--color-info) 28%, transparent)',
    color: 'var(--color-info)',
  },
  Tentative: {
    background: 'var(--color-warning-soft)',
    borderColor: 'color-mix(in srgb, var(--color-warning) 30%, transparent)',
    color: 'var(--color-warning)',
  },
  Confirmed: {
    background: 'var(--color-success-soft)',
    borderColor: 'color-mix(in srgb, var(--color-success) 28%, transparent)',
    color: 'var(--color-success)',
  },
  Completed: {
    background: 'var(--color-success-soft)',
    borderColor: 'color-mix(in srgb, var(--color-success) 28%, transparent)',
    color: 'var(--color-success)',
  },
  Cancelled: {
    background: 'var(--color-danger-soft)',
    borderColor: 'color-mix(in srgb, var(--color-danger) 28%, transparent)',
    color: 'var(--color-danger)',
  },
  Draft: {
    background: 'var(--color-surface-3)',
    borderColor: 'var(--color-border)',
    color: 'var(--color-text-subtle)',
  },
  Sent: {
    background: 'var(--color-info-soft)',
    borderColor: 'color-mix(in srgb, var(--color-info) 28%, transparent)',
    color: 'var(--color-info)',
  },
  Approved: {
    background: 'var(--color-info-soft)',
    borderColor: 'color-mix(in srgb, var(--color-info) 28%, transparent)',
    color: 'var(--color-info)',
  },
  Pending: {
    background: 'var(--color-warning-soft)',
    borderColor: 'color-mix(in srgb, var(--color-warning) 30%, transparent)',
    color: 'var(--color-warning)',
  },
  Overdue: {
    background: 'var(--color-danger-soft)',
    borderColor: 'color-mix(in srgb, var(--color-danger) 28%, transparent)',
    color: 'var(--color-danger)',
  },
}

type StatusBadgeProps = {
  status: StatusType
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { t } = useTranslation()

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[4px] border px-3 py-1 text-xs font-semibold tracking-[0.16em] uppercase',
        className,
      )}
      style={statusStyles[status]}
    >
      {t(`status.${status}`)}
    </span>
  )
}
