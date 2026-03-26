import { addDays, format } from "date-fns";
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
  dateFrom: string;
  dateTo: string;
};

const initialFilters: AppointmentCalendarFilters = {
  search: "",
  status: "all",
  assignedUserId: "all",
  customerId: "all",
  dateFrom: "",
  dateTo: "",
};

export function useAppointmentsCalendarView() {
  const [filters, setFilters] =
    useState<AppointmentCalendarFilters>(initialFilters);
  const [searchQuery, setSearchQuery] = useState("");
  const [calendarRange, setCalendarRange] = useState<AppCalendarRange>(
    getInitialCalendarRange,
  );

  const dateFrom = useMemo(() => {
    return filters.dateFrom.trim()
      ? filters.dateFrom.trim()
      : format(calendarRange.start, "yyyy-MM-dd");
  }, [calendarRange.start, filters.dateFrom]);

  const dateTo = useMemo(() => {
    return filters.dateTo.trim()
      ? filters.dateTo.trim()
      : format(addDays(calendarRange.end, -1), "yyyy-MM-dd");
  }, [calendarRange.end, filters.dateTo]);

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
    calendarRange,
    setCalendarRange,
    activeFiltersCount,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
  };
}
