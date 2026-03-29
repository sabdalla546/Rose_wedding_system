import { useQuery } from "@tanstack/react-query";

import api from "@/lib/axios";
import {
  buildEventsListQueryParams,
  type EventsBusinessFilters,
} from "@/pages/events/event-query-params";
import type { Event, EventResponse, EventsResponse } from "@/pages/events/types";

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
    queryFn: async () => {
      const res = await api.get("/events", {
        params: buildEventsListQueryParams(filters, {
          page: currentPage,
          limit: itemsPerPage,
        }),
      });

      return res.data;
    },
  });
};

export const useEvent = (id?: string) => {
  return useQuery<Event>({
    queryKey: ["event", id],
    queryFn: async () => {
      const res = await api.get<EventResponse>(`/events/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
};
