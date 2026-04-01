export type CalendarSourceType = "appointment" | "event";

export type AppointmentCalendarRecord = {
  id: number;
  customerId: number;
  appointmentDate: string;
  startTime: string;
  endTime: string | null;
  type: string;
  notes: string | null;
  status: string;
  customerName: string | null;
};

export type EventCalendarRecord = {
  id: number;
  customerId: number | null;
  title: string | null;
  eventDate: string;
  venueId: number | null;
  venueName: string | null;
  groomName: string | null;
  brideName: string | null;
  guestCount: number | null;
  notes: string | null;
  status: string;
  customerName: string | null;
};

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
  subtitle?: string | null;
  notes?: string | null;
  colorToken?: string | null;
  meta?: Record<string, unknown>;
};

export type CalendarFeedFilters = {
  dateFrom?: string;
  dateTo?: string;
  sourceType: "all" | CalendarSourceType;
  status?: string;
  venueId?: number;
  customerId?: number;
  search?: string;
};
