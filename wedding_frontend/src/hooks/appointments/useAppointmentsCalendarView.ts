import { addDays, format, startOfDay } from "date-fns";
import { useEffect, useMemo, useState } from "react";

import type { AppCalendarRange } from "@/components/calendar/types";
import { getInitialCalendarRange } from "@/features/calendar/calendar-range";
import { appointmentToAppCalendarEvent } from "@/features/appointments/appointment-calendar";
import { useAppointmentsCalendar } from "@/hooks/appointments/useAppointments";
import type { Appointment } from "@/pages/appointments/types";

export type AppointmentCalendarFilters = {
  search: string;
  status: "all" | Appointment["status"];
  assignedUserId: string;
  customerId: string;
  datePreset: "all" | "today" | "7d" | "30d";
};

const initialFilters: AppointmentCalendarFilters = {
  search: "",
  status: "all",
  assignedUserId: "all",
  customerId: "all",
  datePreset: "all",
};

export function useAppointmentsCalendarView() {
  const [filters, setFilters] =
    useState<AppointmentCalendarFilters>(initialFilters);
  const [searchQuery, setSearchQuery] = useState("");
  const [calendarRange, setCalendarRange] = useState<AppCalendarRange>(
    getInitialCalendarRange,
  );

  const effectiveFetchRange = useMemo(() => {
    if (filters.datePreset === "all") {
      return calendarRange;
    }

    const today = startOfDay(new Date());
    const days =
      filters.datePreset === "today" ? 1 : filters.datePreset === "7d" ? 7 : 30;
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

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setSearchQuery(filters.search.trim());
    }, 300);

    return () => window.clearTimeout(handle);
  }, [filters.search]);

  const query = useAppointmentsCalendar({
    dateFrom,
    dateTo,
    status: filters.status,
    assignedUserId:
      filters.assignedUserId !== "all" ? filters.assignedUserId : "",
    customerId: filters.customerId !== "all" ? filters.customerId : "",
    search: searchQuery,
  });

  const items = useMemo(() => {
    // datePreset is now backend-driven via `effectiveFetchRange`.
    return query.data ?? [];
  }, [
    query.data,
  ]);

  const calendarEvents = useMemo(
    () => items.map(appointmentToAppCalendarEvent),
    [items],
  );

  const activeFiltersCount = useMemo(
    () =>
      [
        Boolean(filters.search.trim()),
        filters.status !== "all",
        filters.assignedUserId !== "all",
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
