import { Navigate } from "react-router-dom";

import { useHasPermission } from "@/hooks/useHasPermission";

export function LegacyCalendarPage() {
  const canReadAppointmentsCalendar = useHasPermission(
    "appointments.calendar.read",
  );
  const canReadEvents = useHasPermission("events.read");

  if (canReadAppointmentsCalendar) {
    return <Navigate replace to="/appointments/calendar" />;
  }

  if (canReadEvents) {
    return <Navigate replace to="/events/calendar" />;
  }

  return <Navigate replace to="/dashboard" />;
}
