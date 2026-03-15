import { CalendarX2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/components/shared/empty-state'
import { SectionCard } from '@/components/shared/section-card'
import { StatusBadge } from '@/components/shared/status-badge'
import { groupAgendaEvents } from '@/features/calendar/calendar-helpers'
import { formatLocalized, formatTimeLabel } from '@/lib/utils'
import type { CalendarEvent } from '@/types/calendar'

type AgendaViewProps = {
  events: CalendarEvent[]
  selectedEventId: string | null
  onSelectEvent: (event: CalendarEvent) => void
}

export function AgendaView({
  events,
  selectedEventId,
  onSelectEvent,
}: AgendaViewProps) {
  const { t } = useTranslation()
  const groups = groupAgendaEvents(events)

  if (groups.length === 0) {
    return (
      <EmptyState
        description={t('calendar.noBookingsFoundDescription')}
        icon={CalendarX2}
        title={t('calendar.noBookingsFound')}
      />
    )
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <SectionCard className="space-y-4" key={group.date.toISOString()}>
          <div>
            <h3 className="text-lg font-semibold text-white">
              {formatLocalized(group.date, 'EEEE, dd MMM')}
            </h3>
            <p className="text-sm text-[var(--lux-text-muted)]">
              {t('calendar.scheduledBookings', { count: group.events.length })}
            </p>
          </div>
          <div className="space-y-3">
            {group.events.map((event) => (
              <button
                className={`grid w-full gap-4 rounded-[22px] border px-4 py-4 text-left transition md:grid-cols-[120px_1.4fr_1fr_0.9fr] ${
                  selectedEventId === event.id
                    ? 'border-[var(--lux-gold-border)] bg-[rgba(212,175,55,0.1)]'
                    : 'border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] hover:border-[rgba(255,255,255,0.08)]'
                }`}
                key={event.id}
                type="button"
                onClick={() => onSelectEvent(event)}
              >
                <div>
                  <p className="text-sm font-semibold text-white">{formatTimeLabel(event.startAt)}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
                    {event.bookingNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{event.title}</p>
                  <p className="mt-1 text-sm text-[var(--lux-text-secondary)]">{event.clientName}</p>
                </div>
                <p className="text-sm text-[var(--lux-text-secondary)]">{event.venue}</p>
                <div className="md:justify-self-end">
                  <StatusBadge status={event.status} />
                </div>
              </button>
            ))}
          </div>
        </SectionCard>
      ))}
    </div>
  )
}
