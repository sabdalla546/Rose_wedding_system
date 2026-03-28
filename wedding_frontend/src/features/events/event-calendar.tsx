import type { TFunction } from "i18next";

import type {
  AppCalendarAccent,
  AppCalendarEvent,
  AppCalendarLegendItem,
} from "@/components/calendar/types";
import { formatEventStatus, getEventDisplayTitle } from "@/pages/events/adapters";
import type { EventCalendarRecord } from "@/pages/events/types";

const EVENT_ACCENTS: Record<EventCalendarRecord["status"], AppCalendarAccent> = {
  draft: "slate",
  designing: "rose",
  confirmed: "emerald",
  in_progress: "blue",
  completed: "gold",
  cancelled: "rose",
};

export function getEventCalendarAccent(
  status: EventCalendarRecord["status"],
): AppCalendarAccent {
  return EVENT_ACCENTS[status] ?? "slate";
}

export function eventCalendarRecordToAppCalendarEvent(
  event: EventCalendarRecord,
): AppCalendarEvent {
  const partyNames = [event.groomName, event.brideName].filter(Boolean).join(" / ");

  return {
    id: String(event.id),
    title: getEventDisplayTitle(event),
    start: event.eventDate,
    allDay: true,
    accent: getEventCalendarAccent(event.status),
    statusLabel: formatEventStatus(event.status),
    typeLabel: event.guestCount ? `${event.guestCount} guests` : undefined,
    subtitle: partyNames || event.customerName || undefined,
    description: event.notes ?? undefined,
    location: event.venueName ?? undefined,
    badgeLabel: partyNames || undefined,
    raw: event,
  };
}

export function buildEventsCalendarSummary(
  events: EventCalendarRecord[],
  t: TFunction,
) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const confirmed = events.filter((event) => event.status === "confirmed").length;
  const upcoming = events.filter(
    (event) => new Date(event.eventDate).getTime() >= todayStart.getTime(),
  ).length;
  const inProgress = events.filter(
    (event) => event.status === "in_progress",
  ).length;
  const postponed = events.filter((event) => event.status === "cancelled").length;

  return [
    {
      id: "visible",
      label: t("events.calendarPage.summary.visible", {
        defaultValue: "Visible Events",
      }),
      value: String(events.length),
      hint: t("events.calendarPage.summary.visibleHint", {
        defaultValue: "Events in the active planning window.",
      }),
    },
    {
      id: "upcoming",
      label: t("events.calendarPage.summary.upcoming", {
        defaultValue: "Upcoming Events",
      }),
      value: String(upcoming),
      hint: t("events.calendarPage.summary.upcomingHint", {
        defaultValue: "Future weddings and productions still ahead in the timeline.",
      }),
    },
    {
      id: "confirmed",
      label: t("events.calendarPage.summary.confirmed", {
        defaultValue: "Confirmed Events",
      }),
      value: String(confirmed),
      hint: t("events.calendarPage.summary.confirmedHint", {
        defaultValue: "Confirmed event productions ready for execution.",
      }),
    },
    {
      id: "postponed",
      label: t("events.calendarPage.summary.postponed", {
        defaultValue: "Cancelled / Postponed",
      }),
      value: String(postponed),
      hint: t("events.calendarPage.summary.postponedHint", {
        count: inProgress,
        defaultValue: `${inProgress} events are currently in active execution.`,
      }),
    },
  ];
}

export function buildEventsTableSummary(
  events: Array<{ status: EventCalendarRecord["status"] }>,
  total: number,
  activeFiltersCount: number,
  t: TFunction,
) {
  const confirmed = events.filter((event) => event.status === "confirmed").length;
  const inProgress = events.filter(
    (event) => event.status === "in_progress",
  ).length;

  return [
    {
      id: "total",
      label: t("events.tablePage.summary.total", {
        defaultValue: "Total events",
      }),
      value: String(total),
      hint: t("events.tablePage.summary.totalHint", {
        defaultValue: "Records matching the current planning query.",
      }),
    },
    {
      id: "visible",
      label: t("events.tablePage.summary.visible", {
        defaultValue: "Visible on this page",
      }),
      value: String(events.length),
      hint: t("events.tablePage.summary.visibleHint", {
        defaultValue: "Events currently loaded into the table.",
      }),
    },
    {
      id: "execution",
      label: t("events.tablePage.summary.execution", {
        defaultValue: "Execution-ready",
      }),
      value: String(confirmed + inProgress),
      hint: t("events.tablePage.summary.executionHint", {
        defaultValue: "Confirmed and in-progress events on this page.",
      }),
    },
    {
      id: "filters",
      label: t("events.tablePage.summary.filters", {
        defaultValue: "Active filters",
      }),
      value: String(activeFiltersCount),
      hint: t("events.tablePage.summary.filtersHint", {
        defaultValue: "Narrow the workspace without changing the route.",
      }),
    },
  ];
}

export function getEventsCalendarLegendItems(
  t: TFunction,
): AppCalendarLegendItem[] {
  return [
    {
      id: "confirmed",
      label: t("events.status.confirmed", { defaultValue: "Confirmed" }),
      accent: "emerald",
    },
    {
      id: "in-progress",
      label: t("events.status.in_progress", { defaultValue: "In Progress" }),
      accent: "blue",
    },
    {
      id: "designing",
      label: t("events.status.designing", { defaultValue: "Designing" }),
      accent: "rose",
    },
    {
      id: "cancelled",
      label: t("events.status.cancelled", { defaultValue: "Cancelled" }),
      accent: "slate",
    },
    {
      id: "completed",
      label: t("events.status.completed", { defaultValue: "Completed" }),
      accent: "gold",
    },
  ];
}
