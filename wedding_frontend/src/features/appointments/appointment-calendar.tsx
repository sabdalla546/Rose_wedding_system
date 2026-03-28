import { isAfter, startOfToday } from "date-fns";
import type { TFunction } from "i18next";

import type {
  AppCalendarAccent,
  AppCalendarEvent,
  AppCalendarLegendItem,
} from "@/components/calendar/types";
import { formatDateLabel, formatTimeLabel } from "@/lib/utils";
import {
  formatAppointmentStatus,
  formatAppointmentType,
} from "@/pages/appointments/adapters";
import type { Appointment } from "@/pages/appointments/types";

export const APPOINTMENT_ACCENTS: Record<
  Appointment["status"],
  AppCalendarAccent
> = {
  scheduled: "gold",
  confirmed: "emerald",
  completed: "blue",
  rescheduled: "gold",
  cancelled: "rose",
  no_show: "slate",
};

export function appointmentToAppCalendarEvent(
  appointment: Appointment,
): AppCalendarEvent {
  const customerName =
    appointment.customer?.fullName || `Customer #${appointment.customerId}`;
  const start = `${appointment.appointmentDate}T${appointment.startTime}:00`;
  const end = appointment.endTime
    ? `${appointment.appointmentDate}T${appointment.endTime}:00`
    : undefined;

  return {
    id: String(appointment.id),
    title: customerName,
    start,
    end,
    allDay: false,
    accent: APPOINTMENT_ACCENTS[appointment.status] ?? "slate",
    statusLabel: formatAppointmentStatus(appointment.status),
    typeLabel: formatAppointmentType(appointment.type),
    subtitle: appointment.createdByUser?.fullName || undefined,
    description: appointment.notes ?? undefined,
    raw: appointment,
  };
}

export function buildAppointmentCalendarSummary(
  appointments: Appointment[],
  t: TFunction,
) {
  const today = startOfToday();
  const confirmed = appointments.filter(
    (appointment) => appointment.status === "confirmed",
  ).length;
  const upcoming = appointments.filter((appointment) => {
    if (["completed", "cancelled", "no_show"].includes(appointment.status)) {
      return false;
    }

    const appointmentStart = new Date(
      `${appointment.appointmentDate}T${appointment.startTime}:00`,
    );

    return isAfter(appointmentStart, today) || appointmentStart.getTime() === today.getTime();
  }).length;
  const completed = appointments.filter(
    (appointment) => appointment.status === "completed",
  ).length;
  const cancelled = appointments.filter(
    (appointment) => appointment.status === "cancelled",
  ).length;

  return [
    {
      id: "visible",
      label: t("appointments.calendarPage.summary.total", {
        defaultValue: "Total Appointments",
      }),
      value: String(appointments.length),
      hint: t("appointments.calendarPage.summary.totalHint", {
        defaultValue: "Appointments in the visible calendar range.",
      }),
    },
    {
      id: "upcoming",
      label: t("appointments.calendarPage.summary.upcoming", {
        defaultValue: "Upcoming Appointments",
      }),
      value: String(upcoming),
      hint: t("appointments.calendarPage.summary.upcomingHint", {
        defaultValue: "Future appointments that still need follow-up.",
      }),
    },
    {
      id: "confirmed",
      label: t("appointments.calendarPage.summary.confirmed", {
        defaultValue: "Confirmed Appointments",
      }),
      value: String(confirmed),
      hint: t("appointments.calendarPage.summary.confirmedHint", {
        defaultValue: "Appointments confirmed with the client.",
      }),
    },
    {
      id: "completed",
      label: t("appointments.calendarPage.summary.completed", {
        defaultValue: "Completed Appointments",
      }),
      value: String(completed),
      hint: t("appointments.calendarPage.summary.completedHint", {
        defaultValue: "Appointments already completed in this range.",
      }),
    },
    {
      id: "cancelled",
      label: t("appointments.calendarPage.summary.cancelled", {
        defaultValue: "Cancelled Appointments",
      }),
      value: String(cancelled),
      hint: t("appointments.calendarPage.summary.cancelledHint", {
        defaultValue: "Cancelled appointments in the visible range.",
      }),
    },
  ];
}

export function getAppointmentCalendarLegendItems(
  t: TFunction,
): AppCalendarLegendItem[] {
  return [
    {
      id: "scheduled",
      label: t("appointments.status.scheduled", { defaultValue: "Scheduled" }),
      accent: "gold",
    },
    {
      id: "confirmed",
      label: t("appointments.status.confirmed", { defaultValue: "Confirmed" }),
      accent: "emerald",
    },
    {
      id: "completed",
      label: t("appointments.status.completed", { defaultValue: "Completed" }),
      accent: "blue",
    },
    {
      id: "cancelled",
      label: t("appointments.status.cancelled", { defaultValue: "Cancelled" }),
      accent: "rose",
    },
    {
      id: "no-show",
      label: t("appointments.status.no_show", { defaultValue: "No Show" }),
      accent: "slate",
    },
  ];
}

export function getAppointmentDateLabel(appointment: Appointment) {
  return formatDateLabel(
    new Date(`${appointment.appointmentDate}T${appointment.startTime}:00`),
    "EEEE, dd MMM yyyy",
  );
}

export function getAppointmentTimeLabel(appointment: Appointment) {
  const startDate = new Date(
    `${appointment.appointmentDate}T${appointment.startTime}:00`,
  );
  const endDate = appointment.endTime
    ? new Date(`${appointment.appointmentDate}T${appointment.endTime}:00`)
    : null;

  return endDate
    ? `${formatTimeLabel(startDate)} - ${formatTimeLabel(endDate)}`
    : formatTimeLabel(startDate);
}
