import type { LucideIcon } from 'lucide-react'

import { SectionCard } from '@/components/shared/section-card'
import { cn } from '@/lib/utils'

type MetricCardProps = {
  label: string
  value: string
  meta: string
  icon: LucideIcon
  className?: string
}

export function MetricCard({
  label,
  value,
  meta,
  icon: Icon,
  className,
}: MetricCardProps) {
  return (
    <SectionCard className={cn('overflow-hidden p-5', className)} elevated>
      <div className="relative flex items-start justify-between gap-4">
        <div className="space-y-3">
          <span className="text-sm font-medium text-[var(--lux-text-secondary)]">
            {label}
          </span>
          <div>
            <p className="text-3xl font-semibold tracking-tight text-white">{value}</p>
            <p className="mt-1 text-sm text-[var(--lux-text-muted)]">{meta}</p>
          </div>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--lux-gold-border)] bg-[rgba(212,175,55,0.08)] text-[var(--lux-gold)]">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="absolute inset-x-5 bottom-0 h-px bg-gradient-to-r from-transparent via-[rgba(212,175,55,0.2)] to-transparent" />
    </SectionCard>
  )
}
