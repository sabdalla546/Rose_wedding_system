import api from "@/lib/axios";
import {
  buildEventsCalendarQueryParams,
  buildEventsListQueryParams,
  type EventsBusinessFilters,
} from "@/pages/events/event-query-params";
import type {
  EventFormData,
  EventResponse,
  EventsResponse,
  EventStatus,
} from "@/pages/events/types";

const normalizeOptionalString = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const normalizeNullableString = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const normalizeGuestCountForCreate = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? Number(trimmed) : undefined;
};

const normalizeGuestCountForUpdate = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? Number(trimmed) : null;
};

const normalizeOptionalId = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? Number(trimmed) : undefined;
};

const normalizeNullableId = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? Number(trimmed) : null;
};

const requireTrimmedValue = (value: string | undefined, field: string) => {
  const trimmed = value?.trim();

  if (!trimmed) {
    throw new Error(`${field} is required`);
  }

  return trimmed;
};

const buildCreateEventPayload = (values: EventFormData) => ({
  customerId: Number(requireTrimmedValue(values.customerId, "customerId")),
  eventDate: requireTrimmedValue(values.eventDate, "eventDate"),
  sourceAppointmentId: normalizeOptionalId(values.sourceAppointmentId),
  venueId: normalizeOptionalId(values.venueId),
  venueNameSnapshot: normalizeOptionalString(values.venueNameSnapshot),
  groomName: normalizeOptionalString(values.groomName),
  brideName: normalizeOptionalString(values.brideName),
  guestCount: normalizeGuestCountForCreate(values.guestCount),
  title: normalizeOptionalString(values.title),
  notes: normalizeOptionalString(values.notes),
});

const buildCreateEventFromSourcePayload = (values: EventFormData) => ({
  sourceAppointmentId: Number(
    requireTrimmedValue(values.sourceAppointmentId, "sourceAppointmentId"),
  ),
  eventDate: normalizeOptionalString(values.eventDate),
  venueId: normalizeOptionalId(values.venueId),
  venueNameSnapshot: normalizeNullableString(values.venueNameSnapshot),
  groomName: normalizeNullableString(values.groomName),
  brideName: normalizeNullableString(values.brideName),
  guestCount: normalizeGuestCountForCreate(values.guestCount),
  title: normalizeNullableString(values.title),
  notes: normalizeNullableString(values.notes),
});

const buildUpdateEventPayload = (values: EventFormData) => ({
  customerId: normalizeNullableId(values.customerId),
  eventDate: requireTrimmedValue(values.eventDate, "eventDate"),
  venueId: normalizeNullableId(values.venueId),
  venueNameSnapshot: normalizeNullableString(values.venueNameSnapshot),
  groomName: normalizeNullableString(values.groomName),
  brideName: normalizeNullableString(values.brideName),
  guestCount: normalizeGuestCountForUpdate(values.guestCount),
  title: normalizeNullableString(values.title),
  notes: normalizeNullableString(values.notes),
});

export const eventsApi = {
  async list(params: {
    currentPage: number;
    itemsPerPage: number;
    filters: EventsBusinessFilters;
  }) {
    const response = await api.get<EventsResponse>("/events", {
      params: buildEventsListQueryParams(params.filters, {
        page: params.currentPage,
        limit: params.itemsPerPage,
      }),
    });

    return response.data;
  },

  async get(id: string | number) {
    const response = await api.get<EventResponse>(`/events/${id}`);
    return response.data.data;
  },

  exportPdf(filters: EventsBusinessFilters) {
    return api.get<Blob>("/events/export/pdf", {
      params: buildEventsCalendarQueryParams(filters),
      responseType: "blob",
    });
  },

  create(values: EventFormData) {
    return api.post("/events", buildCreateEventPayload(values));
  },

  createFromSource(values: EventFormData) {
    return api.post("/events/create-from-source", buildCreateEventFromSourcePayload(values));
  },

  update(id: string | number, values: EventFormData) {
    return api.put(`/events/${id}`, buildUpdateEventPayload(values));
  },

  updateWorkflowStatus(
    id: string | number,
    status: EventStatus,
    notes?: string,
  ) {
    return api.put(`/events/${id}`, {
      status,
      notes: notes?.trim() ? notes.trim() : undefined,
    });
  },
};
