import type {
  Event,
  EventSectionType,
  EventStatus,
  EventsResponse,
} from "@/pages/events/types";

export type TableEvent = Event & {
  titleDisplay: string;
  customerDisplay: string;
  venueDisplay: string;
  partyDisplay: string;
};

export type TableEventsResponse = {
  data: { events: TableEvent[] };
  total: number;
  totalPages: number;
};

export function formatEventStatus(status: EventStatus) {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatEventSectionType(sectionType: EventSectionType) {
  return sectionType
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getEventDisplayTitle(event: Pick<Event, "title" | "groomName" | "brideName" | "id">) {
  const partyNames = [event.groomName, event.brideName].filter(Boolean).join(" & ");

  return event.title?.trim() || partyNames || `Event #${event.id}`;
}

export function toTableEvents(res?: EventsResponse): TableEventsResponse {
  const events = (res?.data ?? []).map<TableEvent>((event) => ({
    ...event,
    titleDisplay: getEventDisplayTitle(event),
    customerDisplay: event.customer?.fullName || "-",
    venueDisplay:
      event.venue?.name ||
      event.venueNameSnapshot ||
      event.venueId?.toString() ||
      "-",
    partyDisplay:
      [event.groomName, event.brideName].filter(Boolean).join(" / ") || "-",
  }));

  return {
    data: { events },
    total: res?.meta?.total ?? events.length,
    totalPages: res?.meta?.pages ?? 1,
  };
}

export const EVENT_STATUS_OPTIONS: Array<{
  value: EventStatus;
  label: string;
}> = [
  { value: "draft", label: "Draft" },
  { value: "designing", label: "Designing" },
  { value: "quotation_pending", label: "Quotation Pending" },
  { value: "quoted", label: "Quoted" },
  { value: "confirmed", label: "Confirmed" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export const EVENT_SECTION_TYPE_OPTIONS: Array<{
  value: EventSectionType;
  label: string;
}> = [
  { value: "client_info", label: "Client Info" },
  { value: "stage", label: "Stage" },
  { value: "chairs", label: "Chairs" },
  { value: "floor", label: "Floor" },
  { value: "hall_sides", label: "Hall Sides" },
  { value: "entrance", label: "Entrance" },
  { value: "vip_front", label: "VIP Front" },
  { value: "back_seating", label: "Back Seating" },
  { value: "buffet", label: "Buffet" },
  { value: "flowers", label: "Flowers" },
  { value: "groom_stage", label: "Groom Stage" },
  { value: "external_companies", label: "External Companies" },
  { value: "summary", label: "Summary" },
  { value: "designer_notes", label: "Designer Notes" },
  { value: "general_notes", label: "General Notes" },
];
