import type { LucideIcon } from 'lucide-react'

import type { Severity, StatusType } from '@/types/shared'

export type Metric = {
  id: string
  labelKey: string
  value: string
  meta: string
  icon: LucideIcon
}

export type ScheduleItem = {
  id: string
  time: string
  clientName: string
  venue: string
  status: StatusType
  focus: string
  counter: string
}

export type AlertItem = {
  id: string
  title: string
  description: string
  severity: Severity
}

export type PaymentSummary = {
  collectedToday: number
  dueToday: number
  overdue: number
  monthTotal: number
}

export type RecentBooking = {
  id: string
  bookingNumber: string
  clientName: string
  eventDate: Date
  venue: string
  status: StatusType
  total: number
  balance: number
}

export type InventoryAlert = {
  id: string
  itemName: string
  availableQty: number
  reorderLevel: number
  status: 'Critical' | 'Monitor'
}

export type InventoryAllocation = {
  id: string
  itemName: string
  quantity: number
  status: 'Reserved' | 'Prepared'
}

export type ActivityItem = {
  id: string
  title: string
  description: string
  timeLabel: string
}

export type QuickActionItem = {
  id: string
  labelKey: string
  icon: LucideIcon
}

export type QuoteField = {
  id: string
}

export type BookingRingSummary = {
  totalItems: number
  paid: number
  due: number
}
