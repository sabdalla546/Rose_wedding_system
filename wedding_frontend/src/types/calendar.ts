import type { Severity, StatusType } from '@/types/shared'

export type CalendarView = 'month' | 'week' | 'day' | 'agenda'

export type CalendarEvent = {
  id: string
  bookingNumber: string
  title: string
  clientName: string
  venue: string
  eventType: string
  status: StatusType
  packageName: string
  coordinator: string
  totalAmount: number
  paidAmount: number
  notes: string
  startAt: Date
  endAt: Date
  accent: 'gold' | 'rose' | 'emerald' | 'blue'
  conflict?: boolean
}

export type CalendarSummary = {
  id: string
  value: string
}

export type AvailabilityNotice = {
  id: string
  messageKey: string
  severity: Severity
}
