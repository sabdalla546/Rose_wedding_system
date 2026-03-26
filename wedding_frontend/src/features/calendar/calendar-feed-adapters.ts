import type { AppCalendarAccent, AppCalendarEvent } from "@/components/calendar/types";
import { formatAppointmentType, formatAppointmentStatus } from "@/pages/appointments/adapters";
import type { Appointment } from "@/pages/appointments/types";
import { formatEventStatus, getEventDisplayTitle } from "@/pages/events/adapters";
import type { Event } from "@/pages/events/types";
import type { CalendarFeedItem } from "@/types/calendar";

const APPOINTMENT_ACCENTS: Record<string, AppCalendarAccent> = {
  scheduled: "gold",
  confirmed: "emerald",
  completed: "blue",
  rescheduled: "rose",
  cancelled: "rose",
  no_show: "slate",
};

const EVENT_ACCENTS: Record<string, AppCalendarAccent> = {
  draft: "slate",
  designing: "rose",
  confirmed: "emerald",
  in_progress: "blue",
  completed: "gold",
  cancelled: "rose",
};

function accentFromFeedItem(item: CalendarFeedItem): AppCalendarAccent {
  if (item.sourceType === "event") {
    return EVENT_ACCENTS[item.status] ?? "slate";
  }

  return APPOINTMENT_ACCENTS[item.status] ?? "slate";
}

export function appointmentToCalendarFeedItem(
  appointment: Appointment,
): CalendarFeedItem {
  const customerName =
    appointment.customer?.fullName || `Customer #${appointment.customerId}`;
  const startAt = `${appointment.appointmentDate}T${appointment.startTime}:00`;

  return {
    id: `appointment-${appointment.id}`,
    sourceType: "appointment",
    sourceId: appointment.id,
    title: `${customerName} Appointment`,
    startAt,
    endAt: appointment.endTime
      ? `${appointment.appointmentDate}T${appointment.endTime}:00`
      : null,
    allDay: false,
    status: appointment.status,
    customerId: appointment.customerId,
    customerName,
    assignedUserId: appointment.createdByUser?.id ?? null,
    assignedUserName: appointment.createdByUser?.fullName ?? null,
    subtitle: formatAppointmentType(appointment.type),
    notes: appointment.notes ?? null,
    colorToken: `appointment.${appointment.status}`,
    meta: {
      type: appointment.type,
    },
  };
}

export function eventToCalendarFeedItem(event: Event): CalendarFeedItem {
  return {
    id: `event-${event.id}`,
    sourceType: "event",
    sourceId: event.id,
    title: getEventDisplayTitle(event),
    startAt: event.eventDate,
    endAt: null,
    allDay: true,
    status: event.status,
    venueId: event.venueId ?? null,
    venueName: event.venue?.name || event.venueNameSnapshot || null,
    customerId: event.customerId ?? null,
    customerName: event.customer?.fullName ?? null,
    assignedUserId: event.createdByUser?.id ?? null,
    assignedUserName: event.createdByUser?.fullName ?? null,
    subtitle:
      [event.groomName, event.brideName].filter(Boolean).join(" / ") ||
      event.customer?.fullName ||
      null,
    notes: event.notes ?? null,
    colorToken: `event.${event.status}`,
    meta: {
      guestCount: event.guestCount ?? null,
      groomName: event.groomName ?? null,
      brideName: event.brideName ?? null,
    },
  };
}

export function normalizeCalendarFeedItem(
  item: CalendarFeedItem,
): CalendarFeedItem {
  return {
    ...item,
    endAt: item.endAt ?? null,
    venueId: item.venueId ?? null,
    venueName: item.venueName ?? null,
    customerId: item.customerId ?? null,
    customerName: item.customerName ?? null,
    assignedUserId: item.assignedUserId ?? null,
    assignedUserName: item.assignedUserName ?? null,
    subtitle: item.subtitle ?? null,
    notes: item.notes ?? null,
    colorToken: item.colorToken ?? null,
    meta: item.meta ?? {},
  };
}

export function calendarFeedItemToAppCalendarEvent(
  item: CalendarFeedItem,
): AppCalendarEvent {
  const subtitle = [
    item.sourceType === "event" ? "Event" : "Appointment",
    item.subtitle,
  ]
    .filter(Boolean)
    .join(" • ");

  const statusLabel =
    item.sourceType === "event"
      ? formatEventStatus(item.status as Event["status"])
      : formatAppointmentStatus(item.status as Appointment["status"]);

  return {
    id: item.id,
    title: item.title,
    start: item.startAt,
    end: item.endAt ?? undefined,
    allDay: item.allDay,
    accent: accentFromFeedItem(item),
    statusLabel,
    typeLabel: item.sourceType === "event" ? "Event" : "Appointment",
    subtitle,
    description: item.notes ?? undefined,
    location: item.venueName ?? undefined,
    raw: item,
  };
}
