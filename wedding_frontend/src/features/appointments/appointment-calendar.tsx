import { isAfter, startOfToday } from "date-fns";
import type { TFunction } from "i18next";

import type {
  AppCalendarAccent,
  AppCalendarEvent,
  AppCalendarLegendItem,
} from "@/components/calendar/types";
import { formatDateLabel, formatTimeLabel } from "@/lib/utils";
import {
  APPOINTMENT_STATUS_OPTIONS,
  formatAppointmentStatus,
  formatAppointmentType,
  normalizeAppointmentStatus,
} from "@/pages/appointments/adapters";
import type { Appointment } from "@/pages/appointments/types";

export const APPOINTMENT_ACCENTS: Record<
  Appointment["status"],
  AppCalendarAccent
> = {
  reserved: "gold",
  attended: "emerald",
  converted: "blue",
  cancelled: "rose",
  no_show: "slate",
};

export function appointmentToAppCalendarEvent(
  appointment: Appointment,
): AppCalendarEvent {
  const normalizedStatus = normalizeAppointmentStatus(appointment.status);
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
    accent: APPOINTMENT_ACCENTS[normalizedStatus] ?? "slate",
    statusLabel: formatAppointmentStatus(normalizedStatus),
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
  const attended = appointments.filter(
    (appointment) => normalizeAppointmentStatus(appointment.status) === "attended",
  ).length;
  const upcoming = appointments.filter((appointment) => {
    const status = normalizeAppointmentStatus(appointment.status);

    if (["converted", "cancelled", "no_show"].includes(status)) {
      return false;
    }

    const appointmentStart = new Date(
      `${appointment.appointmentDate}T${appointment.startTime}:00`,
    );

    return isAfter(appointmentStart, today) || appointmentStart.getTime() === today.getTime();
  }).length;
  const converted = appointments.filter(
    (appointment) => normalizeAppointmentStatus(appointment.status) === "converted",
  ).length;
  const cancelled = appointments.filter(
    (appointment) => normalizeAppointmentStatus(appointment.status) === "cancelled",
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
      id: "attended",
      label: t("appointments.calendarPage.summary.attended", {
        defaultValue: "Attended Appointments",
      }),
      value: String(attended),
      hint: t("appointments.calendarPage.summary.attendedHint", {
        defaultValue:
          "Appointments already attended and waiting for workflow conversion.",
      }),
    },
    {
      id: "converted",
      label: t("appointments.calendarPage.summary.converted", {
        defaultValue: "Converted Appointments",
      }),
      value: String(converted),
      hint: t("appointments.calendarPage.summary.convertedHint", {
        defaultValue:
          "Appointments already converted into the event workflow in this range.",
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

export function buildAppointmentsTableSummary(
  appointments: Appointment[],
  total: number,
  activeFiltersCount: number,
  t: TFunction,
) {
  const open = appointments.filter((appointment) =>
    normalizeAppointmentStatus(appointment.status) === "reserved",
  ).length;
  const attended = appointments.filter(
    (appointment) => normalizeAppointmentStatus(appointment.status) === "attended",
  ).length;

  return [
    {
      id: "total",
      label: t("appointments.tablePage.summary.total", {
        defaultValue: "Total appointments",
      }),
      value: String(total),
      hint: t("appointments.tablePage.summary.totalHint", {
        defaultValue: "Records matching the current table query.",
      }),
    },
    {
      id: "visible",
      label: t("appointments.tablePage.summary.visible", {
        defaultValue: "Visible on this page",
      }),
      value: String(appointments.length),
      hint: t("appointments.tablePage.summary.visibleHint", {
        defaultValue: "Appointments currently loaded into the table.",
      }),
    },
    {
      id: "open",
      label: t("appointments.tablePage.summary.open", {
        defaultValue: "Needs follow-up",
      }),
      value: String(open),
      hint: t("appointments.tablePage.summary.openHint", {
        defaultValue: "Reserved appointments awaiting attendance.",
      }),
    },
    {
      id: "filters",
      label: t("appointments.tablePage.summary.filters", {
        defaultValue: "Active filters",
      }),
      value: String(activeFiltersCount),
      hint: t("appointments.tablePage.summary.filtersHint", {
        defaultValue: `${attended} attended appointments on this page.`,
      }),
    },
  ];
}

export function getAppointmentCalendarLegendItems(
  t: TFunction,
): AppCalendarLegendItem[] {
  return APPOINTMENT_STATUS_OPTIONS.map((status) => ({
    id: status.value,
    label: t(`appointments.status.${status.value}`, {
      defaultValue: status.label,
    }),
    accent: APPOINTMENT_ACCENTS[status.value],
  }));
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
