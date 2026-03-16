import { CalendarClock } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/components/shared/empty-state'
import { SectionCard } from '@/components/shared/section-card'
import { StatusBadge } from '@/components/shared/status-badge'
import { getEventsForDay } from '@/features/calendar/calendar-helpers'
import { formatLocalized, formatTimeLabel } from '@/lib/utils'
import type { CalendarEvent } from '@/types/calendar'

type DayViewProps = {
  currentDate: Date
  events: CalendarEvent[]
  onSelectEvent: (event: CalendarEvent) => void
}

export function DayView({ currentDate, events, onSelectEvent }: DayViewProps) {
  const { t } = useTranslation()
  const dayEvents = getEventsForDay(events, currentDate)

  if (dayEvents.length === 0) {
    return (
      <EmptyState
        description={t('calendar.noBookingsForDayDescription')}
        icon={CalendarClock}
        title={t('calendar.noBookingsForDay', {
          date: formatLocalized(currentDate, 'dd MMM'),
        })}
      />
    )
  }

  return (
    <div className="space-y-4">
      {dayEvents.map((event) => (
        <SectionCard
          className="cursor-pointer space-y-4 transition hover:border-[var(--lux-gold-border)]"
          elevated
          key={event.id}
          onClick={() => onSelectEvent(event)}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-xl font-semibold text-[var(--lux-text)]">{event.title}</h3>
                <StatusBadge status={event.status} />
              </div>
              <p className="mt-2 text-sm text-[var(--lux-text-secondary)]">
                {event.clientName} • {event.venue} • {event.eventType}
              </p>
            </div>
            <div className="text-sm text-[var(--lux-text)]">
              {formatTimeLabel(event.startAt)} - {formatTimeLabel(event.endAt)}
            </div>
          </div>
          <p className="text-sm leading-6 text-[var(--lux-text-muted)]">{event.notes}</p>
        </SectionCard>
      ))}
    </div>
  )
}
