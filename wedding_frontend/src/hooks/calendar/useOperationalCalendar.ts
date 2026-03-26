import {
  addDays,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isWithinInterval,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import type { AppCalendarRange } from "@/components/calendar/types";
import { calendarFeedItemToAppCalendarEvent, normalizeCalendarFeedItem } from "@/features/calendar/calendar-feed-adapters";
import api from "@/lib/axios";
import type {
  CalendarFeedItem,
  CalendarFeedResponse,
  CalendarSourceFilter,
  OperationalCalendarFilters,
} from "@/types/calendar";

const initialFilters = (
  sourceType: CalendarSourceFilter = "all",
): OperationalCalendarFilters => ({
  search: "",
  sourceType,
  status: "all",
  venueId: "all",
  assignedUserId: "all",
  dateRange: "all",
});

function getInitialRange(): AppCalendarRange {
  const currentDate = new Date();
  const currentMonthStart = startOfMonth(currentDate);
  const currentMonthEnd = endOfMonth(currentDate);

  return {
    view: "month",
    title: format(currentDate, "MMMM yyyy"),
    start: startOfWeek(currentMonthStart, { weekStartsOn: 0 }),
    end: endOfWeek(currentMonthEnd, { weekStartsOn: 0 }),
    currentStart: currentMonthStart,
    currentEnd: currentMonthEnd,
  };
}

function matchesDatePreset(item: CalendarFeedItem, preset: OperationalCalendarFilters["dateRange"]) {
  if (preset === "all") {
    return true;
  }

  const today = startOfDay(new Date());
  const itemDate = startOfDay(new Date(item.startAt));

  if (preset === "today") {
    return itemDate.getTime() === today.getTime();
  }

  if (preset === "7d") {
    return isWithinInterval(itemDate, {
      start: today,
      end: endOfDay(addDays(today, 6)),
    });
  }

  return isWithinInterval(itemDate, {
    start: today,
    end: endOfDay(addDays(today, 29)),
  });
}

// Operational calendar summary:
// - Appointments and Events keep their separate CRUD/list pages.
// - The Calendar page consumes one normalized `/calendar/feed`.
// - Existing `AppCalendar`, filter shells, quick-view card, and dialog are reused.
// - Event timing and coordinator ownership still use the current low-risk schema assumptions.
export function useOperationalCalendar(
  defaultSourceType: CalendarSourceFilter = "all",
) {
  const [filters, setFilters] = useState<OperationalCalendarFilters>(
    initialFilters(defaultSourceType),
  );
  const [calendarRange, setCalendarRange] = useState<AppCalendarRange>(
    getInitialRange,
  );

  const query = useQuery<CalendarFeedItem[]>({
    queryKey: [
      "calendar-feed",
      calendarRange.start.toISOString(),
      calendarRange.end.toISOString(),
      filters.search,
      filters.sourceType,
      filters.status,
      filters.venueId,
      filters.assignedUserId,
    ],
    queryFn: async () => {
      const response = await api.get<CalendarFeedResponse>("/calendar/feed", {
        params: {
          dateFrom: format(calendarRange.start, "yyyy-MM-dd"),
          dateTo: format(addDays(calendarRange.end, -1), "yyyy-MM-dd"),
          sourceType: filters.sourceType,
          status: filters.status === "all" ? undefined : filters.status,
          venueId:
            filters.venueId !== "all" ? Number(filters.venueId) : undefined,
          assignedUserId:
            filters.assignedUserId !== "all"
              ? Number(filters.assignedUserId)
              : undefined,
          search: filters.search.trim() || undefined,
        },
      });

      return response.data.data.map(normalizeCalendarFeedItem);
    },
  });

  const items = useMemo(
    () =>
      (query.data ?? []).filter((item) => matchesDatePreset(item, filters.dateRange)),
    [filters.dateRange, query.data],
  );

  const calendarEvents = useMemo(
    () => items.map(calendarFeedItemToAppCalendarEvent),
    [items],
  );

  const activeFiltersCount = useMemo(
    () =>
      [
        Boolean(filters.search.trim()),
        filters.sourceType !== "all",
        filters.status !== "all",
        filters.venueId !== "all",
        filters.assignedUserId !== "all",
        filters.dateRange !== "all",
      ].filter(Boolean).length,
    [filters],
  );

  return {
    calendarEvents,
    calendarRange,
    filters,
    items,
    setCalendarRange,
    setFilters,
    activeFiltersCount,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refetch: query.refetch,
  };
}
