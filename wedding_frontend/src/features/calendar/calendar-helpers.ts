import {
  addDays,
  eachDayOfInterval,
  endOfDay,
  format,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns'

import type { CalendarEvent } from '@/types/calendar'

export function buildMonthGrid(baseDate: Date) {
  const start = startOfWeek(startOfMonth(baseDate), { weekStartsOn: 0 })
  const end = addDays(start, 41)

  const days = eachDayOfInterval({ start, end })
  const rows: Date[][] = []

  for (let index = 0; index < days.length; index += 7) {
    rows.push(days.slice(index, index + 7))
  }

  return rows
}

export function getEventsForDay(events: CalendarEvent[], date: Date) {
  return events
    .filter((event) => isSameDay(event.startAt, date))
    .sort((first, second) => first.startAt.getTime() - second.startAt.getTime())
}

export function getWeekDays(baseDate: Date) {
  const start = startOfWeek(baseDate, { weekStartsOn: 0 })
  return Array.from({ length: 7 }, (_, index) => addDays(start, index))
}

export function getHourSlots(startHour = 8, endHour = 23) {
  return Array.from({ length: endHour - startHour + 1 }, (_, index) => startHour + index)
}

type CalendarFilters = {
  search: string
  dateRange: string
  venue: string
  status: string
  coordinator: string
  eventType: string
}

export function filterCalendarEvents(events: CalendarEvent[], filters: CalendarFilters) {
  const search = filters.search.trim().toLowerCase()

  return events.filter((event) => {
    if (search) {
      const haystack = [
        event.title,
        event.clientName,
        event.bookingNumber,
        event.venue,
      ]
        .join(' ')
        .toLowerCase()

      if (!haystack.includes(search)) {
        return false
      }
    }

    if (filters.venue !== 'all' && event.venue !== filters.venue) {
      return false
    }

    if (filters.status !== 'all' && event.status !== filters.status) {
      return false
    }

    if (filters.coordinator !== 'all' && event.coordinator !== filters.coordinator) {
      return false
    }

    if (filters.eventType !== 'all' && event.eventType !== filters.eventType) {
      return false
    }

    const today = startOfDay(new Date())
    const eventDate = startOfDay(event.startAt)

    if (filters.dateRange === 'today') {
      return isSameDay(eventDate, today)
    }

    if (filters.dateRange === '7d') {
      return isWithinInterval(eventDate, {
        start: today,
        end: endOfDay(addDays(today, 7)),
      })
    }

    if (filters.dateRange === '30d') {
      return isWithinInterval(eventDate, {
        start: today,
        end: endOfDay(addDays(today, 30)),
      })
    }

    return true
  })
}

export function groupAgendaEvents(events: CalendarEvent[]) {
  const groups = new Map<string, { date: Date; events: CalendarEvent[] }>()

  for (const event of events) {
    const key = format(event.startAt, 'yyyy-MM-dd')
    const current = groups.get(key)

    if (current) {
      current.events.push(event)
    } else {
      groups.set(key, { date: startOfDay(event.startAt), events: [event] })
    }
  }

  return Array.from(groups.values()).sort(
    (first, second) => first.date.getTime() - second.date.getTime(),
  )
}

export function isCalendarDayMuted(currentMonth: Date, day: Date) {
  return !isSameMonth(currentMonth, day)
}
