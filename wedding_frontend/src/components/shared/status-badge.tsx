import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'
import type { StatusType } from '@/types/shared'

const statusStyles: Record<StatusType, string> = {
  Inquiry: 'border-sky-400/20 bg-sky-400/10 text-sky-200',
  Tentative: 'border-amber-400/20 bg-amber-400/10 text-amber-200',
  Confirmed: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200',
  Completed: 'border-teal-400/20 bg-teal-400/10 text-teal-200',
  Cancelled: 'border-rose-400/20 bg-rose-400/10 text-rose-200',
  Draft: 'border-zinc-400/20 bg-zinc-400/10 text-zinc-200',
  Sent: 'border-blue-400/20 bg-blue-400/10 text-blue-200',
  Approved: 'border-violet-400/20 bg-violet-400/10 text-violet-200',
  Pending: 'border-orange-400/20 bg-orange-400/10 text-orange-200',
  Overdue: 'border-red-500/20 bg-red-500/10 text-red-200',
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
        'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.16em] uppercase',
        statusStyles[status],
        className,
      )}
    >
      {t(`status.${status}`)}
    </span>
  )
}
