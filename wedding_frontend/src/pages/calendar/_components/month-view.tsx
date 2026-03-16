import { isSameDay, startOfDay, startOfToday } from 'date-fns'
import { useTranslation } from 'react-i18next'

import {
  buildMonthGrid,
  getEventsForDay,
  isCalendarDayMuted,
} from '@/features/calendar/calendar-helpers'
import { cn, formatLocalized, formatTimeLabel } from '@/lib/utils'
import type { CalendarEvent, CalendarView } from '@/types/calendar'

type MonthViewProps = {
  currentDate: Date
  events: CalendarEvent[]
  selectedEventId: string | null
  onSelectEvent: (event: CalendarEvent) => void
  viewMode?: Extract<CalendarView, 'month' | 'week' | 'day'>
  visibleDays?: Date[]
}

export function MonthView({
  currentDate,
  events,
  selectedEventId,
  onSelectEvent,
  viewMode = 'month',
  visibleDays,
}: MonthViewProps) {
  const { t } = useTranslation()
  const today = startOfToday()
  const monthMatrix = buildMonthGrid(currentDate)
  const weeks = getVisibleWeeks(monthMatrix, currentDate, viewMode, visibleDays)
  const weekdayLabels =
    viewMode === 'day' ? [startOfDay(currentDate)] : weeks[0] ?? []
  const columnsClassName =
    viewMode === 'day' || visibleDays?.length === 1 ? 'grid-cols-1' : 'grid-cols-7'
  const rowClassName = cn('grid gap-3', columnsClassName)

  return (
    <div className="space-y-2">
      <div
        className={cn(
          'grid gap-3 px-1 text-center text-xs font-semibold uppercase tracking-[0.18em] text-[var(--lux-text-muted)]',
          columnsClassName,
        )}
      >
        {weekdayLabels.map((day) => (
          <span key={day.toISOString()}>{formatLocalized(day, 'EE')}</span>
        ))}
      </div>
      <div className="space-y-3">
        {weeks.map((week) => (
          <div className={rowClassName} key={week[0].toISOString()}>
            {week.map((day) => {
              const dayEvents = getEventsForDay(events, day)
              const remaining = dayEvents.length - 3
              const isToday = isSameDay(day, today)

              return (
                <div
                  className={cn(
                    'min-h-[168px] rounded-[24px] border p-3 transition',
                    isToday && 'border-[var(--lux-gold-border)] bg-[rgba(212,175,55,0.07)]',
                    !visibleDays && isCalendarDayMuted(currentDate, day) && 'opacity-45',
                  )}
                  key={day.toISOString()}
                  style={
                    isToday
                      ? undefined
                      : {
                          borderColor: 'var(--lux-row-border)',
                          background: 'var(--lux-row-surface)',
                        }
                  }
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-[var(--lux-text)]">
                      {formatLocalized(day, 'd')}
                    </span>
                    {dayEvents.length > 0 ? (
                      <span className="rounded-full bg-[rgba(212,175,55,0.12)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--lux-gold)]">
                        {dayEvents.length} {t('calendar.badgeBooked')}
                      </span>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    {dayEvents.slice(0, 3).map((event) => {
                      const isSelected = selectedEventId === event.id

                      return (
                        <button
                          className={cn(
                            'w-full rounded-2xl border px-3 py-2 text-left transition',
                            isSelected
                              ? 'border-[var(--lux-gold-border)] bg-[rgba(212,175,55,0.1)]'
                              : 'hover:border-[var(--lux-row-border)]',
                          )}
                          key={event.id}
                          style={
                            isSelected
                              ? undefined
                              : {
                                  borderColor: 'transparent',
                                  background: 'var(--lux-row-surface)',
                                }
                          }
                          type="button"
                          onClick={() => onSelectEvent(event)}
                        >
                          <p className="truncate text-sm font-semibold text-[var(--lux-text)]">
                            {event.title}
                          </p>
                          <p className="mt-1 truncate text-xs text-[var(--lux-text-secondary)]">
                            {formatTimeLabel(event.startAt)} • {event.venue}
                          </p>
                        </button>
                      )
                    })}
                    {remaining > 0 ? (
                      <div
                        className="rounded-2xl border border-dashed px-3 py-2 text-xs font-semibold text-[var(--lux-text-muted)]"
                        style={{ borderColor: 'var(--lux-row-border)' }}
                      >
                        {t('calendar.moreBookings', { count: remaining })}
                      </div>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

function getVisibleWeeks(
  monthMatrix: Date[][],
  currentDate: Date,
  viewMode: Extract<CalendarView, 'month' | 'week' | 'day'>,
  visibleDays?: Date[],
) {
  if (visibleDays?.length) {
    if (visibleDays.length === 1) {
      return [visibleDays]
    }

    const rows: Date[][] = []

    for (let index = 0; index < visibleDays.length; index += 7) {
      rows.push(visibleDays.slice(index, index + 7))
    }

    return rows
  }

  if (viewMode === 'month') {
    return monthMatrix
  }

  if (viewMode === 'day') {
    return [[startOfDay(currentDate)]]
  }

  const activeWeek =
    monthMatrix.find((week) => week.some((day) => isSameDay(day, currentDate))) ??
    monthMatrix[0] ??
    []

  return activeWeek.length ? [activeWeek] : []
}
