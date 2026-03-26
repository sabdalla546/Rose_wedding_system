import { addDays, startOfDay, format } from "date-fns";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import type { AppCalendarRange } from "@/components/calendar/types";
import { getInitialCalendarRange } from "@/features/calendar/calendar-range";
import { eventCalendarRecordToAppCalendarEvent } from "@/features/events/event-calendar";
import api from "@/lib/axios";
import type { EventCalendarRecord, EventsCalendarResponse, EventStatus } from "@/pages/events/types";

export type EventsCalendarFilters = {
  search: string;
  status: "all" | EventStatus;
  venueId: string;
  customerId: string;
  datePreset: "all" | "today" | "7d" | "30d";
};

const initialFilters: EventsCalendarFilters = {
  search: "",
  status: "all",
  venueId: "all",
  customerId: "all",
  datePreset: "all",
};

function matchesEventSearch(event: EventCalendarRecord, searchTerm: string) {
  if (!searchTerm) {
    return true;
  }

  const haystack = [
    event.title,
    event.customerName,
    event.venueName,
    event.groomName,
    event.brideName,
    event.notes,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(searchTerm);
}

export function useEventsCalendarView() {
  const [filters, setFilters] = useState<EventsCalendarFilters>(initialFilters);
  const [calendarRange, setCalendarRange] = useState<AppCalendarRange>(
    getInitialCalendarRange,
  );

  const effectiveFetchRange = useMemo(() => {
    if (filters.datePreset === "all") {
      return calendarRange;
    }

    const today = startOfDay(new Date());
    const days = filters.datePreset === "today" ? 1 : filters.datePreset === "7d" ? 7 : 30;
    const start = today;
    const endExclusive = addDays(today, days);

    return {
      ...calendarRange,
      start,
      end: endExclusive,
    };
  }, [calendarRange, filters.datePreset]);

  const dateFrom = useMemo(
    () => format(effectiveFetchRange.start, "yyyy-MM-dd"),
    [effectiveFetchRange.start],
  );
  const dateTo = useMemo(
    () => format(addDays(effectiveFetchRange.end, -1), "yyyy-MM-dd"),
    [effectiveFetchRange.end],
  );

  const query = useQuery<EventCalendarRecord[]>({
    queryKey: [
      "events-calendar",
      dateFrom,
      dateTo,
      filters.status,
      filters.venueId,
      filters.customerId,
    ],
    queryFn: async () => {
      const response = await api.get<EventsCalendarResponse>("/events/calendar", {
        params: {
          dateFrom,
          dateTo,
          status: filters.status === "all" ? undefined : filters.status,
          venueId: filters.venueId !== "all" ? Number(filters.venueId) : undefined,
          customerId:
            filters.customerId !== "all" ? Number(filters.customerId) : undefined,
        },
      });

      return response.data.data;
    },
  });

  const items = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    return (query.data ?? []).filter((event) => {
      if (!matchesEventSearch(event, search)) {
        return false;
      }

      // datePreset is now backend-driven via effectiveFetchRange;
      // keep local filtering for search only.
      return true;
    });
  }, [filters.search, query.data]);

  const calendarEvents = useMemo(
    () => items.map(eventCalendarRecordToAppCalendarEvent),
    [items],
  );

  const activeFiltersCount = useMemo(
    () =>
      [
        Boolean(filters.search.trim()),
        filters.status !== "all",
        filters.venueId !== "all",
        filters.customerId !== "all",
        filters.datePreset !== "all",
      ].filter(Boolean).length,
    [filters],
  );

  return {
    items,
    calendarEvents,
    filters,
    setFilters,
    calendarRange,
    setCalendarRange,
    activeFiltersCount,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
  };
}
