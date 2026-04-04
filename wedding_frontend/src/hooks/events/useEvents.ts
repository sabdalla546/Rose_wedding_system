import { useQuery } from "@tanstack/react-query";

import { eventsApi } from "@/lib/api/events";
import { type EventsBusinessFilters } from "@/pages/events/event-query-params";
import type { Event, EventsResponse } from "@/pages/events/types";

export const useEvents = ({
  currentPage,
  itemsPerPage,
  filters,
}: {
  currentPage: number;
  itemsPerPage: number;
  filters: EventsBusinessFilters;
}) => {
  return useQuery<EventsResponse>({
    queryKey: [
      "events",
      currentPage,
      itemsPerPage,
      filters.search,
      filters.status,
      filters.customerId,
      filters.venueId,
      filters.dateFrom,
      filters.dateTo,
    ],
    queryFn: () => eventsApi.list({ currentPage, itemsPerPage, filters }),
  });
};

export const useEvent = (id?: string) => {
  return useQuery<Event>({
    queryKey: ["event", id],
    queryFn: () => eventsApi.get(id as string),
    enabled: !!id,
  });
};
