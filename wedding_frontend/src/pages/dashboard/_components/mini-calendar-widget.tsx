import { addMonths, format, isSameDay, startOfToday, subMonths } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

import { SectionCard } from '@/components/shared/section-card'
import { Button } from '@/components/ui/button'
import { buildMonthGrid, getEventsForDay, isCalendarDayMuted } from '@/features/calendar/calendar-helpers'
import { cn } from '@/lib/utils'
import type { CalendarEvent } from '@/types/calendar'

const weekdayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

type MiniCalendarWidgetProps = {
  events: CalendarEvent[]
}

export function MiniCalendarWidget({ events }: MiniCalendarWidgetProps) {
  const [currentMonth, setCurrentMonth] = useState(startOfToday())
  const today = startOfToday()
  const weeks = buildMonthGrid(currentMonth)

  return (
    <SectionCard className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white">Calendar</h3>
          <p className="mt-1 text-sm text-[var(--lux-text-muted)]">
            Live booking density across the month.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="icon"
            variant="secondary"
            onClick={() => setCurrentMonth((value) => subMonths(value, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            onClick={() => setCurrentMonth((value) => addMonths(value, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="rounded-[24px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-4">
        <div className="mb-4 text-center text-lg font-semibold text-white">
          {format(currentMonth, 'MMMM yyyy')}
        </div>
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
          {weekdayLabels.map((weekday) => (
            <span key={weekday}>{weekday}</span>
          ))}
        </div>
        <div className="mt-3 space-y-2">
          {weeks.map((week) => (
            <div className="grid grid-cols-7 gap-2" key={week[0].toISOString()}>
              {week.map((day) => {
                const dayEvents = getEventsForDay(events, day)

                return (
                  <button
                    className={cn(
                      'flex aspect-square flex-col items-center justify-center rounded-2xl border border-transparent bg-transparent text-sm transition',
                      isCalendarDayMuted(currentMonth, day) && 'text-[rgba(138,138,149,0.45)]',
                      isSameDay(day, today) &&
                        'border-[var(--lux-gold-border)] bg-[rgba(212,175,55,0.1)] text-white',
                      dayEvents.length > 0 &&
                        !isSameDay(day, today) &&
                        'bg-[rgba(255,255,255,0.03)] text-white hover:border-[rgba(255,255,255,0.06)]',
                    )}
                    key={day.toISOString()}
                    type="button"
                  >
                    <span>{format(day, 'd')}</span>
                    {dayEvents.length > 0 ? (
                      <span className="mt-1 flex gap-1">
                        {dayEvents.slice(0, 3).map((event) => (
                          <span
                            className="h-1.5 w-1.5 rounded-full bg-[var(--lux-gold)]"
                            key={event.id}
                          />
                        ))}
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  )
}
