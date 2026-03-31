import type { Customer } from "@/pages/customers/types";
import type { Venue } from "@/pages/venues/types";

export interface EventSourceAppointmentSummary {
  id: number;
  customerId: number;
  appointmentDate: string;
  startTime: string;
  endTime?: string | null;
  weddingDate?: string | null;
  guestCount?: number | null;
  venueId?: number | null;
  customer?: Customer | null;
  venue?: Venue | null;
}

export type EventStatus =
  | "draft"
  | "designing"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface EventUserSummary {
  id: number;
  fullName: string;
}

export interface Event {
  id: number;
  customerId?: number | null;
  sourceAppointmentId?: number | null;
  eventDate: string;
  venueId?: number | null;
  venueNameSnapshot?: string | null;
  groomName?: string | null;
  brideName?: string | null;
  guestCount?: number | null;
  title?: string | null;
  notes?: string | null;
  status: EventStatus;
  customer?: Customer | null;
  venue?: Venue | null;
  sourceAppointment?: EventSourceAppointmentSummary | null;
  createdByUser?: EventUserSummary | null;
  updatedByUser?: EventUserSummary | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface EventsResponse {
  data: Event[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface EventResponse {
  data: Event;
}

export interface EventCalendarRecord {
  id: number;
  customerId?: number | null;
  title?: string | null;
  eventDate: string;
  venueId?: number | null;
  venueName?: string | null;
  groomName?: string | null;
  brideName?: string | null;
  guestCount?: number | null;
  notes?: string | null;
  status: EventStatus;
  customerName?: string | null;
  assignedUserId?: number | null;
  assignedUserName?: string | null;
}

export interface EventsCalendarResponse {
  data: EventCalendarRecord[];
}

export interface EventFormData {
  customerId?: string;
  sourceAppointmentId?: string;
  eventDate?: string;
  venueId?: string;
  venueNameSnapshot?: string;
  groomName?: string;
  brideName?: string;
  guestCount?: string;
  title?: string;
  notes?: string;
  status?: EventStatus | "";
}
