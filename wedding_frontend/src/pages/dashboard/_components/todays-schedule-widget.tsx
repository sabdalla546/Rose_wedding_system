import { ArrowUpRight, Clock3, MapPin } from 'lucide-react'

import { ActionMenu } from '@/components/shared/action-menu'
import { SectionCard } from '@/components/shared/section-card'
import { StatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import type { ScheduleItem } from '@/types/dashboard'

type TodaysScheduleWidgetProps = {
  items: ScheduleItem[]
}

export function TodaysScheduleWidget({ items }: TodaysScheduleWidgetProps) {
  return (
    <SectionCard className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold text-white">Today&apos;s Schedule</h3>
          <p className="mt-1 text-sm text-[var(--lux-text-muted)]">
            Priority timeline for active client-facing operations today.
          </p>
        </div>
        <Button variant="secondary">
          View Calendar
          <ArrowUpRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            className="flex flex-col gap-4 rounded-[24px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-4 transition hover:border-[var(--lux-gold-border)] hover:bg-[rgba(212,175,55,0.04)] lg:flex-row lg:items-center lg:justify-between"
            key={item.id}
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgba(212,175,55,0.16)] bg-[rgba(212,175,55,0.08)] text-[var(--lux-gold)]">
                <Clock3 className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-base font-semibold text-white">{item.clientName}</p>
                  <StatusBadge status={item.status} />
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--lux-text-secondary)]">
                  <span>{item.time}</span>
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {item.venue}
                  </span>
                </div>
                <p className="text-sm text-[var(--lux-text-muted)]">{item.focus}</p>
              </div>
            </div>
            <ActionMenu items={['Open booking', 'Mark complete', 'Send reminder']} />
          </div>
        ))}
      </div>
    </SectionCard>
  )
}
