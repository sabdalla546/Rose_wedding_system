import { differenceInMinutes, isSameDay, startOfDay } from 'date-fns'

import {
  getEventsForDay,
  getHourSlots,
  getWeekDays,
} from '@/features/calendar/calendar-helpers'
import { cn, formatLocalized, formatTimeLabel } from '@/lib/utils'
import type { CalendarEvent } from '@/types/calendar'

type WeekViewProps = {
  currentDate: Date
  events: CalendarEvent[]
  selectedEventId: string | null
  onSelectEvent: (event: CalendarEvent) => void
}

const startHour = 8
const hourHeight = 76

export function WeekView({
  currentDate,
  events,
  selectedEventId,
  onSelectEvent,
}: WeekViewProps) {
  const weekDays = getWeekDays(currentDate)
  const hours = getHourSlots(startHour, 23)

  return (
    <div className="overflow-x-auto pb-2">
      <div className="min-w-[900px]">
        <div className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))] gap-3">
          <div />
          {weekDays.map((day) => {
            const isToday = isSameDay(day, new Date())

            return (
              <div
                className={cn(
                  'rounded-2xl border px-3 py-3 text-center',
                  isToday && 'border-[var(--lux-gold-border)]',
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
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--lux-text-muted)]">
                  {formatLocalized(day, 'EEE')}
                </p>
                <p className="mt-1 text-lg font-semibold text-[var(--lux-text)]">
                  {formatLocalized(day, 'd')}
                </p>
              </div>
            )
          })}
        </div>

        <div className="mt-3 grid grid-cols-[72px_repeat(7,minmax(0,1fr))] gap-3">
          <div className="space-y-0">
            {hours.map((hour) => (
              <div
                className="h-[76px] pr-3 pt-1 text-right text-xs text-[var(--lux-text-muted)]"
                key={hour}
              >
                {formatLocalized(setHour(hour), 'ha')}
              </div>
            ))}
          </div>

          {weekDays.map((day) => {
            const dayEvents = getEventsForDay(events, day)

            return (
              <div
                className="relative h-[1216px] rounded-[24px] border"
                key={day.toISOString()}
                style={{
                  borderColor: 'var(--lux-row-border)',
                  background: 'var(--lux-row-surface)',
                }}
              >
                {hours.map((hour) => (
                  <div
                    className="border-b"
                    key={hour}
                    style={{
                      borderColor: 'var(--lux-row-border)',
                      height: `${hourHeight}px`,
                    }}
                  />
                ))}
                {dayEvents.map((event) => {
                  const startOffset = differenceInMinutes(
                    event.startAt,
                    startOfDay(event.startAt),
                  )
                  const minutesFromViewStart = startOffset - startHour * 60
                  const top = (minutesFromViewStart / 60) * hourHeight
                  const duration = differenceInMinutes(event.endAt, event.startAt)
                  const height = Math.max((duration / 60) * hourHeight, 48)

                  return (
                    <button
                      className={cn(
                        'absolute left-2 right-2 rounded-2xl border px-3 py-2 text-left shadow-panel transition',
                        event.conflict
                          ? 'border-amber-400/30 bg-amber-400/12'
                          : 'border-[var(--lux-gold-border)] bg-[rgba(212,175,55,0.1)]',
                        selectedEventId === event.id && 'ring-2 ring-[var(--lux-row-border)]',
                      )}
                      key={event.id}
                      style={{ top: `${top}px`, height: `${height}px` }}
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
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function setHour(hour: number) {
  const date = new Date()
  date.setHours(hour, 0, 0, 0)
  return date
}
