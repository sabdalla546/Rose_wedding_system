import { useEffect, useMemo, useState } from "react";

import type { AppCalendarRange } from "@/components/calendar/types";
import {
  getCalendarRangeDateFilters,
  getInitialCalendarRange,
} from "@/features/calendar/calendar-range";
import { appointmentToAppCalendarEvent } from "@/features/appointments/appointment-calendar";
import { useAppointmentsCalendar } from "@/hooks/appointments/useAppointments";
import type { Appointment } from "@/pages/appointments/types";

export type AppointmentCalendarFilters = {
  search: string;
  status: "all" | Appointment["status"];
  customerId: string;
  dateFrom: string;
  dateTo: string;
};

export function getInitialAppointmentCalendarFilters(): AppointmentCalendarFilters {
  return {
    search: "",
    status: "all",
    customerId: "all",
    dateFrom: "",
    dateTo: "",
  };
}

export function useAppointmentsCalendarView() {
  const [filters, setFilters] =
    useState<AppointmentCalendarFilters>(getInitialAppointmentCalendarFilters);
  const [searchQuery, setSearchQuery] = useState("");
  const [calendarRange, setCalendarRange] = useState<AppCalendarRange>(
    getInitialCalendarRange,
  );

  const derivedCalendarDateFilters = useMemo(
    () => getCalendarRangeDateFilters(calendarRange),
    [calendarRange],
  );

  const dateFrom = useMemo(
    () => filters.dateFrom.trim() || derivedCalendarDateFilters.dateFrom,
    [derivedCalendarDateFilters.dateFrom, filters.dateFrom],
  );

  const dateTo = useMemo(
    () => filters.dateTo.trim() || derivedCalendarDateFilters.dateTo,
    [derivedCalendarDateFilters.dateTo, filters.dateTo],
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
    customerId: filters.customerId !== "all" ? filters.customerId : "",
    search: searchQuery,
  });

  const items = useMemo(() => {
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
        filters.customerId !== "all",
        Boolean(filters.dateFrom.trim()),
        Boolean(filters.dateTo.trim()),
      ].filter(Boolean).length,
    [filters],
  );

  return {
    items,
    calendarEvents,
    filters,
    setFilters,
    resetFilters: () => setFilters(getInitialAppointmentCalendarFilters()),
    calendarRange,
    setCalendarRange,
    activeFiltersCount,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
  };
}
