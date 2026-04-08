import type { CalendarEvent } from "@/types/calendar";
import type {
  Appointment,
  AppointmentStatus,
  AppointmentType,
  AppointmentsResponse,
} from "@/pages/appointments/types";
import type { TFunction } from "i18next";

export type TableAppointment = Appointment & {
  customerName: string;
  timeDisplay: string;
  weddingDateDisplay: string;
};

export type TableAppointmentsResponse = {
  data: { appointments: TableAppointment[] };
  total: number;
  totalPages: number;
};

const LEGACY_APPOINTMENT_STATUS_MAP = {
  scheduled: "reserved",
  confirmed: "reserved",
  rescheduled: "reserved",
  completed: "attended",
} as const;

export function normalizeAppointmentStatus(
  status?: string | null,
): AppointmentStatus {
  if (!status) {
    return "reserved";
  }

  return (
    LEGACY_APPOINTMENT_STATUS_MAP[
      status as keyof typeof LEGACY_APPOINTMENT_STATUS_MAP
    ] ?? (status as AppointmentStatus)
  );
}

export function toTableAppointments(
  res?: AppointmentsResponse,
): TableAppointmentsResponse {
  const appointments = (res?.data ?? []).map<TableAppointment>(
    (appointment) => ({
      ...appointment,
      status: normalizeAppointmentStatus(appointment.status),
      customerName:
        appointment.customer?.fullName || `Customer #${appointment.customerId}`,
      timeDisplay: appointment.endTime
        ? `${appointment.startTime} - ${appointment.endTime}`
        : appointment.startTime,
      weddingDateDisplay: appointment.weddingDate || "-",
    }),
  );

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
  { value: "reserved", label: "Reserved" },
  { value: "attended", label: "Attended" },
  { value: "converted", label: "Converted" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show", label: "No Show" },
];

export const APPOINTMENT_FORM_STATUS_OPTIONS =
  APPOINTMENT_STATUS_OPTIONS.filter(
    (status) => !["converted"].includes(status.value),
  );

export const APPOINTMENT_TYPE_OPTIONS: Array<{
  value: AppointmentType;
  label: string;
}> = [
  { value: "New Appointment 1", label: "New Appointment 1" },
  { value: "New Appointment 2", label: "New Appointment 2" },
  { value: "New Appointment 3", label: "New Appointment 3" },
  { value: "Details Appointment 1", label: "Details Appointment 1" },
  { value: "Details Appointment 2", label: "Details Appointment 2" },
  { value: "Details Appointment 3", label: "Details Appointment 3" },
  { value: "Office Visit", label: "Office Visit" },
];

export const formatAppointmentStatus = (status: string) => {
  return normalizeAppointmentStatus(status)
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

export const formatAppointmentType = (
  value: AppointmentType,
  t?: TFunction<"translation", undefined>,
): string => {
  if (t) {
    return t(`appointments.typeOptions.${value}`, {
      defaultValue: value,
    });
  }

  return value;
};

const CALENDAR_STATUS_MAP: Record<AppointmentStatus, CalendarEvent["status"]> =
  {
    reserved: "Pending",
    attended: "Confirmed",
    converted: "Completed",
    cancelled: "Cancelled",
    no_show: "Overdue",
  };

const CALENDAR_ACCENT_MAP: Record<AppointmentStatus, CalendarEvent["accent"]> =
  {
    reserved: "gold",
    attended: "emerald",
    converted: "blue",
    cancelled: "rose",
    no_show: "blue",
  };

function combineDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`);
}

export function toCalendarEvents(appointments: Appointment[]): CalendarEvent[] {
  return appointments.map((appointment) => {
    const normalizedStatus = normalizeAppointmentStatus(appointment.status);
    const startAt = combineDateTime(
      appointment.appointmentDate,
      appointment.startTime,
    );
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
      venue: appointment.venue?.name || "-",
      eventType: formatAppointmentType(appointment.type),
      status: CALENDAR_STATUS_MAP[normalizedStatus],
      packageName: formatAppointmentType(appointment.type),
      coordinator: "-",
      totalAmount: 0,
      paidAmount: 0,
      notes: appointment.notes || "No notes added.",
      startAt,
      endAt: computedEndAt,
      accent: CALENDAR_ACCENT_MAP[normalizedStatus],
      appointmentId: appointment.id,
      customerId: appointment.customerId,
      meetingType: appointment.type,
      guestCount: appointment.guestCount ?? null,
    };
  });
}
