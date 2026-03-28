import { Navigate } from "react-router-dom";

export default function EventCalendarPage() {
  return <Navigate replace to="/events?view=calendar" />;
}
