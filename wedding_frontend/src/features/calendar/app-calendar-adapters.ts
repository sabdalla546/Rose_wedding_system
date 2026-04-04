import type { AppCalendarAccent, AppCalendarEvent } from "@/components/calendar/types";
import { formatEventStatus, getEventDisplayTitle } from "@/pages/events/adapters";
import type { Event, EventStatus } from "@/pages/events/types";
import type { CalendarEvent } from "@/types/calendar";

const EVENT_STATUS_ACCENTS: Record<EventStatus, AppCalendarAccent> = {
  draft: "slate",
  designing: "rose",
  quotation_pending: "gold",
  quoted: "blue",
  confirmed: "emerald",
  in_progress: "blue",
  completed: "gold",
  cancelled: "rose",
};

export function toAppCalendarAppointmentEvents(
  events: CalendarEvent[],
): AppCalendarEvent[] {
  return events.map((event) => ({
    id: event.id,
    title: event.title,
    start: event.startAt,
    end: event.endAt,
    accent: event.accent,
    statusLabel: event.status,
    typeLabel: event.eventType,
    subtitle: event.clientName,
    description: event.notes,
    location: event.venue,
    raw: event,
  }));
}

export function toAppCalendarEventEntries(events: Event[]): AppCalendarEvent[] {
  return events.map((event) => ({
    id: String(event.id),
    title: getEventDisplayTitle(event),
    start: `${event.eventDate}T12:00:00`,
    end: `${event.eventDate}T13:00:00`,
    allDay: false,
    accent: EVENT_STATUS_ACCENTS[event.status],
    statusLabel: formatEventStatus(event.status),
    typeLabel: "Event",
    subtitle: event.customer?.fullName || [event.groomName, event.brideName].filter(Boolean).join(" / ") || "-",
    description: event.notes || undefined,
    location:
      event.venue?.name || event.venueNameSnapshot || event.venueId?.toString() || "-",
    raw: event,
  }));
}
