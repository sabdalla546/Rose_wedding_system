import type { Customer } from "@/pages/customers/types";
import type { Venue } from "@/pages/venues/types";

export type EventStatus =
  | "draft"
  | "designing"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled";

export type EventSectionType =
  | "client_info"
  | "stage"
  | "chairs"
  | "floor"
  | "hall_sides"
  | "entrance"
  | "vip_front"
  | "back_seating"
  | "buffet"
  | "flowers"
  | "groom_stage"
  | "external_companies"
  | "summary"
  | "designer_notes"
  | "general_notes";

export interface EventUserSummary {
  id: number;
  fullName: string;
}

export interface EventSection {
  id: number;
  eventId: number;
  sectionType: EventSectionType;
  title?: string | null;
  sortOrder: number;
  data: Record<string, unknown>;
  notes?: string | null;
  isCompleted: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface Event {
  id: number;
  customerId?: number | null;
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
  sections?: EventSection[];
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

export interface EventFormData {
  customerId?: string;
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
