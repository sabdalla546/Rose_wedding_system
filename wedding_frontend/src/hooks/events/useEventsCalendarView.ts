import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { eventCalendarRecordToAppCalendarEvent } from "@/features/events/event-calendar";
import api from "@/lib/axios";
import {
  buildEventsCalendarQueryParams,
  getInitialEventsBusinessFilters,
  type EventsBusinessFilters,
} from "@/pages/events/event-query-params";
import type { EventCalendarRecord, EventsCalendarResponse } from "@/pages/events/types";

export type EventsCalendarFilters = EventsBusinessFilters;

export function getInitialEventsCalendarFilters(): EventsCalendarFilters {
  return getInitialEventsBusinessFilters();
}

export function useEventsCalendarView(filters: EventsBusinessFilters) {
  const apiParams = useMemo(
    () => buildEventsCalendarQueryParams(filters),
    [filters],
  );

  const query = useQuery<EventCalendarRecord[]>({
    queryKey: [
      "events-calendar",
      apiParams.dateFrom,
      apiParams.dateTo,
      apiParams.status,
      apiParams.venueId,
      apiParams.customerId,
      apiParams.search,
    ],
    queryFn: async () => {
      const response = await api.get<EventsCalendarResponse>("/events/calendar", {
        params: apiParams,
      });

      return response.data.data;
    },
  });

  const items = query.data ?? [];

  const calendarEvents = useMemo(
    () => items.map(eventCalendarRecordToAppCalendarEvent),
    [items],
  );

  const activeFiltersCount = useMemo(
    () =>
      [
        Boolean(filters.search.trim()),
        filters.status !== "all",
        Boolean(filters.venueId.trim()),
        Boolean(filters.customerId.trim()),
        Boolean(filters.dateFrom.trim()),
        Boolean(filters.dateTo.trim()),
      ].filter(Boolean).length,
    [filters],
  );

  return {
    items,
    calendarEvents,
    activeFiltersCount,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
  };
}
