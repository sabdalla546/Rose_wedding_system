import {
  addDays,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  isSameDay,
  isWithinInterval,
  set,
  startOfMonth,
  startOfToday,
  startOfWeek,
} from 'date-fns'

import type {
  AvailabilityNotice,
  CalendarEvent,
  CalendarSummary,
} from '@/types/calendar'

const today = startOfToday()

function eventDate(dayOffset: number, hours: number, minutes = 0) {
  return set(addDays(today, dayOffset), {
    hours,
    minutes,
    seconds: 0,
    milliseconds: 0,
  })
}

export const calendarEvents: CalendarEvent[] = [
  {
    id: 'evt-101',
    bookingNumber: 'BKG-2401',
    title: 'Royal Wedding Reception',
    clientName: 'Omar & Lina',
    venue: 'Pearl Ballroom',
    eventType: 'Wedding Reception',
    status: 'Confirmed',
    packageName: 'Royal Signature',
    coordinator: 'Maha Al-Salem',
    totalAmount: 18450,
    paidAmount: 12000,
    notes: 'Final chandelier drop and aisle candle alignment pending venue walkthrough.',
    startAt: eventDate(0, 16),
    endAt: eventDate(0, 23),
    accent: 'gold',
  },
  {
    id: 'evt-102',
    bookingNumber: 'BKG-2402',
    title: 'Bridal Entrance Decor',
    clientName: 'Hessa & Faisal',
    venue: 'Royal Koshah Suite',
    eventType: 'Decor Setup',
    status: 'Approved',
    packageName: 'Golden Aisle',
    coordinator: 'Dana Al-Mutairi',
    totalAmount: 5200,
    paidAmount: 4100,
    notes: 'Mirror aisle panels and floral arch install scheduled before client styling review.',
    startAt: eventDate(0, 10),
    endAt: eventDate(0, 12),
    accent: 'rose',
  },
  {
    id: 'evt-103',
    bookingNumber: 'BKG-2403',
    title: 'Engagement Night',
    clientName: 'Sarah & Ali',
    venue: 'Amber Hall',
    eventType: 'Engagement',
    status: 'Tentative',
    packageName: 'Moonlight Premium',
    coordinator: 'Reem Al-Harbi',
    totalAmount: 9700,
    paidAmount: 2500,
    notes: 'Client requested a soft ivory stage palette with a silver-toned family seating area.',
    startAt: eventDate(1, 18),
    endAt: eventDate(1, 23),
    accent: 'blue',
  },
  {
    id: 'evt-104',
    bookingNumber: 'BKG-2404',
    title: 'Floral Setup Preview',
    clientName: 'Mariam & Youssef',
    venue: 'Orchid Courtyard',
    eventType: 'Floral Setup',
    status: 'Confirmed',
    packageName: 'Garden Luxe',
    coordinator: 'Noura Al-Qahtani',
    totalAmount: 4600,
    paidAmount: 4600,
    notes: 'Preview includes suspended arrangements, entrance vases, and sweetheart table composition.',
    startAt: eventDate(2, 15),
    endAt: eventDate(2, 17),
    accent: 'emerald',
  },
  {
    id: 'evt-105',
    bookingNumber: 'BKG-2405',
    title: 'VIP Hall Booking',
    clientName: 'Noor & Abdullah',
    venue: 'Pearl Ballroom',
    eventType: 'Hall Booking',
    status: 'Pending',
    packageName: 'VIP Hall Reserve',
    coordinator: 'Maha Al-Salem',
    totalAmount: 12400,
    paidAmount: 6200,
    notes: 'Awaiting signed floor plan approval and final valet routing confirmation.',
    startAt: eventDate(3, 19),
    endAt: eventDate(3, 23),
    accent: 'gold',
  },
  {
    id: 'evt-106',
    bookingNumber: 'BKG-2406',
    title: 'Stage Setup',
    clientName: 'Asim & Yasmin',
    venue: 'Amber Hall',
    eventType: 'Stage Setup',
    status: 'Confirmed',
    packageName: 'Stage Couture',
    coordinator: 'Reem Al-Harbi',
    totalAmount: 7100,
    paidAmount: 5000,
    notes: 'Back-wall LED framing overlaps with evening lighting prep on the same hall.',
    startAt: eventDate(5, 17),
    endAt: eventDate(5, 20),
    accent: 'rose',
    conflict: true,
  },
  {
    id: 'evt-107',
    bookingNumber: 'BKG-2407',
    title: 'Lighting Preparation',
    clientName: 'Layla & Khaled',
    venue: 'Amber Hall',
    eventType: 'Lighting Prep',
    status: 'Confirmed',
    packageName: 'Glow Atmosphere',
    coordinator: 'Reem Al-Harbi',
    totalAmount: 3900,
    paidAmount: 2200,
    notes: 'Crew access window overlaps with stage rigging; sequencing needs coordinator confirmation.',
    startAt: eventDate(5, 18, 30),
    endAt: eventDate(5, 21),
    accent: 'blue',
    conflict: true,
  },
  {
    id: 'evt-108',
    bookingNumber: 'BKG-2408',
    title: 'Family Dinner Reception',
    clientName: 'Nasser & Rawan',
    venue: 'Velvet Majlis',
    eventType: 'Private Dinner',
    status: 'Inquiry',
    packageName: 'Majlis Signature',
    coordinator: 'Dana Al-Mutairi',
    totalAmount: 6400,
    paidAmount: 0,
    notes: 'Inquiry stage only; venue held until tasting approval window closes.',
    startAt: eventDate(6, 20),
    endAt: eventDate(6, 23),
    accent: 'emerald',
  },
  {
    id: 'evt-109',
    bookingNumber: 'BKG-2409',
    title: 'Henna Lounge Styling',
    clientName: 'Alya & Hamad',
    venue: 'Desert Rose Lounge',
    eventType: 'Lounge Styling',
    status: 'Sent',
    packageName: 'Henna Luxe',
    coordinator: 'Noura Al-Qahtani',
    totalAmount: 3300,
    paidAmount: 900,
    notes: 'Quotation sent with lounge seating, cane partitions, and live oud corner.',
    startAt: eventDate(8, 17),
    endAt: eventDate(8, 20),
    accent: 'rose',
  },
  {
    id: 'evt-110',
    bookingNumber: 'BKG-2410',
    title: 'Wedding Reception',
    clientName: 'Dana & Saud',
    venue: 'Pearl Ballroom',
    eventType: 'Wedding Reception',
    status: 'Confirmed',
    packageName: 'Royal Signature',
    coordinator: 'Maha Al-Salem',
    totalAmount: 21500,
    paidAmount: 18000,
    notes: 'Premium crystal dance floor requested; reserve from warehouse stock lot A.',
    startAt: eventDate(10, 18),
    endAt: eventDate(10, 23, 30),
    accent: 'gold',
  },
  {
    id: 'evt-111',
    bookingNumber: 'BKG-2411',
    title: 'Floral Refresh',
    clientName: 'Mona & Rashid',
    venue: 'Orchid Courtyard',
    eventType: 'Floral Setup',
    status: 'Completed',
    packageName: 'Garden Luxe',
    coordinator: 'Noura Al-Qahtani',
    totalAmount: 2800,
    paidAmount: 2800,
    notes: 'Completed refresh for bridal lunch with white roses and floating candles.',
    startAt: eventDate(-2, 14),
    endAt: eventDate(-2, 16),
    accent: 'emerald',
  },
  {
    id: 'evt-112',
    bookingNumber: 'BKG-2412',
    title: 'Stage Rehearsal',
    clientName: 'Hadeel & Bassam',
    venue: 'Royal Koshah Suite',
    eventType: 'Stage Setup',
    status: 'Draft',
    packageName: 'Stage Couture',
    coordinator: 'Dana Al-Mutairi',
    totalAmount: 4200,
    paidAmount: 0,
    notes: 'Draft plan for catwalk reveal and mirrored plinths awaiting internal estimate review.',
    startAt: eventDate(13, 11),
    endAt: eventDate(13, 13),
    accent: 'blue',
  },
]

const weekRange = {
  start: startOfWeek(today, { weekStartsOn: 0 }),
  end: endOfWeek(today, { weekStartsOn: 0 }),
}

const currentMonthDays = eachDayOfInterval({
  start: startOfMonth(today),
  end: endOfMonth(today),
})

const daysWithThreeOrMoreEvents = currentMonthDays.filter((day) => {
  const count = calendarEvents.filter((event) => isSameDay(event.startAt, day)).length
  return count >= 2
})

export const calendarSummaries: CalendarSummary[] = [
  {
    id: 'todayBookings',
    value: String(calendarEvents.filter((event) => isSameDay(event.startAt, today)).length),
  },
  {
    id: 'thisWeekEvents',
    value: String(
      calendarEvents.filter((event) =>
        isWithinInterval(event.startAt, { start: weekRange.start, end: weekRange.end }),
      ).length,
    ),
  },
  {
    id: 'pendingConfirmations',
    value: String(
      calendarEvents.filter((event) =>
        ['Tentative', 'Pending', 'Inquiry'].includes(event.status),
      ).length,
    ),
  },
  {
    id: 'fullyBookedDays',
    value: String(daysWithThreeOrMoreEvents.length),
  },
]

export const calendarAvailabilityNotices: AvailabilityNotice[] = [
  {
    id: 'notice-1',
    messageKey: 'calendar.noticeOne',
    severity: 'high',
  },
  {
    id: 'notice-2',
    messageKey: 'calendar.noticeTwo',
    severity: 'medium',
  },
]

export const calendarFilterOptions = {
  dateRange: [
    { label: 'All dates', value: 'all' },
    { label: 'Today', value: 'today' },
    { label: 'Next 7 days', value: '7d' },
    { label: 'Next 30 days', value: '30d' },
  ],
  venues: [
    { label: 'All venues', value: 'all' },
    ...Array.from(new Set(calendarEvents.map((event) => event.venue))).map((venue) => ({
      label: venue,
      value: venue,
    })),
  ],
  statuses: [
    { label: 'All statuses', value: 'all' },
    ...Array.from(new Set(calendarEvents.map((event) => event.status))).map((status) => ({
      label: status,
      value: status,
    })),
  ],
  coordinators: [
    { label: 'All coordinators', value: 'all' },
    ...Array.from(new Set(calendarEvents.map((event) => event.coordinator))).map(
      (coordinator) => ({
        label: coordinator,
        value: coordinator,
      }),
    ),
  ],
  eventTypes: [
    { label: 'All event types', value: 'all' },
    ...Array.from(new Set(calendarEvents.map((event) => event.eventType))).map((eventType) => ({
      label: eventType,
      value: eventType,
    })),
  ],
}

export const defaultCalendarEventId =
  calendarEvents.find((event) => differenceInCalendarDays(event.startAt, today) === 0)?.id ??
  calendarEvents[0]?.id
