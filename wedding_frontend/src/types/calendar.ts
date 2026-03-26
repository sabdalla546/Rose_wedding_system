import type { Severity, StatusType } from '@/types/shared'

export type CalendarView = 'month' | 'week' | 'day' | 'agenda'

export type CalendarSourceType = "appointment" | "event";
export type CalendarSourceFilter = "all" | CalendarSourceType;

export type CalendarFeedItem = {
  id: string;
  sourceType: CalendarSourceType;
  sourceId: number | string;
  title: string;
  startAt: string;
  endAt: string | null;
  allDay: boolean;
  status: string;
  venueId?: number | null;
  venueName?: string | null;
  customerId?: number | null;
  customerName?: string | null;
  assignedUserId?: number | null;
  assignedUserName?: string | null;
  subtitle?: string | null;
  notes?: string | null;
  colorToken?: string | null;
  meta?: Record<string, unknown>;
};

export type CalendarFeedResponse = {
  data: CalendarFeedItem[];
};

export type OperationalCalendarFilters = {
  search: string;
  sourceType: CalendarSourceFilter;
  status: string;
  venueId: string;
  assignedUserId: string;
  dateRange: "all" | "today" | "7d" | "30d";
};

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
  appointmentId?: number
  leadId?: number
  customerId?: number | null
  meetingType?: string
  guestCount?: number | null
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
