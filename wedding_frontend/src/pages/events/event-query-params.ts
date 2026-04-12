import type { EventStatus } from "@/pages/events/types";

/** Shared business filters for Events list + calendar (single source of truth). */
export type EventsBusinessFilters = {
  search: string;
  status: "all" | EventStatus;
  venueId: string;
  customerId: string;
  dateFrom: string;
  dateTo: string;
};

export function getInitialEventsBusinessFilters(): EventsBusinessFilters {
  return {
    search: "",
    status: "all",
    venueId: "",
    customerId: "",
    dateFrom: "",
    dateTo: "",
  };
}

/** Query params for GET /events (table, paginated). */
export function buildEventsListQueryParams(
  filters: EventsBusinessFilters,
  pagination: { page: number; limit: number },
) {
  return {
    page: pagination.page,
    limit: pagination.limit,
    search: filters.search.trim() || undefined,
    status: filters.status === "all" ? undefined : filters.status,
    customerId: filters.customerId ? Number(filters.customerId) : undefined,
    venueId: filters.venueId ? Number(filters.venueId) : undefined,
    dateFrom: filters.dateFrom.trim() || undefined,
    dateTo: filters.dateTo.trim() || undefined,
  };
}

/**
 * Query params for GET /events/calendar — same contract as GET /events (no pagination).
 * Date bounds are only sent when set on the filters; never inferred from the visible calendar month.
 */
export function buildEventsCalendarQueryParams(filters: EventsBusinessFilters) {
  return {
    dateFrom: filters.dateFrom.trim() || undefined,
    dateTo: filters.dateTo.trim() || undefined,
    status: filters.status === "all" ? undefined : filters.status,
    venueId: filters.venueId.trim() ? Number(filters.venueId) : undefined,
    customerId: filters.customerId.trim() ? Number(filters.customerId) : undefined,
    search: filters.search.trim() || undefined,
  };
}
