import { Navigate } from "react-router-dom";

export default function AppointmentCalendarPage() {
  return <Navigate replace to="/appointments?view=calendar" />;
}
