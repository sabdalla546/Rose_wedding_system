import { useQuery } from "@tanstack/react-query";

import api from "@/lib/axios";
import type { Event, EventResponse, EventsResponse } from "@/pages/events/types";

interface UseEventsParams {
  currentPage: number;
  itemsPerPage: number;
  searchQuery: string;
  status: "all" | Event["status"];
  customerId: string;
  leadId?: string;
  venueId: string;
  dateFrom: string;
  dateTo: string;
}

export const useEvents = ({
  currentPage,
  itemsPerPage,
  searchQuery,
  status,
  customerId,
  leadId = "",
  venueId,
  dateFrom,
  dateTo,
}: UseEventsParams) => {
  return useQuery<EventsResponse>({
    queryKey: [
      "events",
      currentPage,
      itemsPerPage,
      searchQuery,
      status,
      customerId,
      leadId,
      venueId,
      dateFrom,
      dateTo,
    ],
    queryFn: async () => {
      const res = await api.get("/events", {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: searchQuery || undefined,
          status: status === "all" ? undefined : status,
          customerId: customerId ? Number(customerId) : undefined,
          venueId: venueId ? Number(venueId) : undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        },
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
