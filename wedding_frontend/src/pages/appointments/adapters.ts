import type { CalendarEvent } from "@/types/calendar";
import type {
  Appointment,
  AppointmentStatus,
  AppointmentType,
  AppointmentsResponse,
} from "@/pages/appointments/types";

export type TableAppointment = Appointment & {
  customerName: string;
  timeDisplay: string;
};

export type TableAppointmentsResponse = {
  data: { appointments: TableAppointment[] };
  total: number;
  totalPages: number;
};

export function toTableAppointments(
  res?: AppointmentsResponse,
): TableAppointmentsResponse {
  const appointments = (res?.data ?? []).map<TableAppointment>((appointment) => ({
    ...appointment,
    customerName:
      appointment.customer?.fullName || `Customer #${appointment.customerId}`,
    timeDisplay: appointment.endTime
      ? `${appointment.startTime} - ${appointment.endTime}`
      : appointment.startTime,
  }));

  return {
    data: { appointments },
    total: res?.meta?.total ?? appointments.length,
    totalPages: res?.meta?.pages ?? 1,
  };
}

export const APPOINTMENT_STATUS_OPTIONS: Array<{
  value: AppointmentStatus;
  label: string;
}> = [
  { value: "scheduled", label: "Scheduled" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "rescheduled", label: "Rescheduled" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show", label: "No Show" },
];

export const APPOINTMENT_TYPE_OPTIONS: Array<{
  value: AppointmentType;
  label: string;
}> = [
  { value: "office_visit", label: "Office Visit" },
  { value: "phone_call", label: "Phone Call" },
  { value: "video_call", label: "Video Call" },
  { value: "venue_visit", label: "Venue Visit" },
];

export const formatAppointmentStatus = (status: AppointmentStatus) =>
  status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const formatAppointmentType = (value: AppointmentType) =>
  value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const CALENDAR_STATUS_MAP: Record<AppointmentStatus, CalendarEvent["status"]> = {
  scheduled: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  rescheduled: "Tentative",
  cancelled: "Cancelled",
  no_show: "Overdue",
};

const CALENDAR_ACCENT_MAP: Record<AppointmentStatus, CalendarEvent["accent"]> = {
  scheduled: "gold",
  confirmed: "emerald",
  completed: "blue",
  rescheduled: "rose",
  cancelled: "rose",
  no_show: "blue",
};

function combineDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`);
}

export function toCalendarEvents(appointments: Appointment[]): CalendarEvent[] {
  return appointments.map((appointment) => {
    const startAt = combineDateTime(appointment.appointmentDate, appointment.startTime);
    const endAt = combineDateTime(
      appointment.appointmentDate,
      appointment.endTime || appointment.startTime,
    );
    const computedEndAt =
      endAt.getTime() > startAt.getTime()
        ? endAt
        : new Date(startAt.getTime() + 60 * 60 * 1000);
    const customerName =
      appointment.customer?.fullName || `Customer #${appointment.customerId}`;

    return {
      id: String(appointment.id),
      bookingNumber: `APPT-${String(appointment.id).padStart(4, "0")}`,
      title: `${customerName} Appointment`,
      clientName: customerName,
      venue: "-",
      eventType: formatAppointmentType(appointment.type),
      status: CALENDAR_STATUS_MAP[appointment.status],
      packageName: formatAppointmentType(appointment.type),
      coordinator: "-",
      totalAmount: 0,
      paidAmount: 0,
      notes: appointment.notes || "No notes added.",
      startAt,
      endAt: computedEndAt,
      accent: CALENDAR_ACCENT_MAP[appointment.status],
      appointmentId: appointment.id,
      customerId: appointment.customerId,
      meetingType: appointment.type,
      guestCount: null,
    };
  });
}
