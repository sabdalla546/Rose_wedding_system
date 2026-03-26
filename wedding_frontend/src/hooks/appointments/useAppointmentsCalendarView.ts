import { addDays, format } from "date-fns";
import { useMemo, useState } from "react";

import type { AppCalendarRange } from "@/components/calendar/types";
import { getInitialCalendarRange, matchesCalendarDatePreset } from "@/features/calendar/calendar-range";
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

function matchesAppointmentSearch(appointment: Appointment, searchTerm: string) {
  if (!searchTerm) {
    return true;
  }

  const haystack = [
    appointment.customer?.fullName,
    appointment.customer?.mobile,
    appointment.notes,
    appointment.createdByUser?.fullName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(searchTerm);
}

export function useAppointmentsCalendarView() {
  const [filters, setFilters] =
    useState<AppointmentCalendarFilters>(initialFilters);
  const [calendarRange, setCalendarRange] = useState<AppCalendarRange>(
    getInitialCalendarRange,
  );

  const query = useAppointmentsCalendar({
    dateFrom: format(calendarRange.start, "yyyy-MM-dd"),
    dateTo: format(addDays(calendarRange.end, -1), "yyyy-MM-dd"),
    status: filters.status,
    assignedUserId:
      filters.assignedUserId !== "all" ? filters.assignedUserId : "",
  });

  const items = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    return (query.data ?? []).filter((appointment) => {
      if (
        filters.assignedUserId !== "all" &&
        String(appointment.createdByUser?.id ?? "") !== filters.assignedUserId
      ) {
        return false;
      }

      if (
        filters.customerId !== "all" &&
        String(appointment.customer?.id ?? appointment.customerId) !==
          filters.customerId
      ) {
        return false;
      }

      if (!matchesAppointmentSearch(appointment, search)) {
        return false;
      }

      return matchesCalendarDatePreset(
        `${appointment.appointmentDate}T${appointment.startTime}:00`,
        filters.datePreset,
      );
    });
  }, [
    filters.assignedUserId,
    filters.customerId,
    filters.datePreset,
    filters.search,
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
