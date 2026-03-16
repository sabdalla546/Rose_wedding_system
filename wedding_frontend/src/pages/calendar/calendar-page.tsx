import {
  addDays,
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import { AgendaView } from "@/pages/calendar/_components/agenda-view";
import { DayView } from "@/pages/calendar/_components/day-view";
import { MonthView } from "@/pages/calendar/_components/month-view";
import { ViewSwitcher } from "@/pages/calendar/_components/view-switcher";
import { WeekView } from "@/pages/calendar/_components/week-view";
import { PageContainer } from "@/components/layout/page-container";
import { FilterToolbar } from "@/components/shared/filter-toolbar";
import { QuickViewPanel } from "@/components/shared/quick-view-panel";
import { SectionCard } from "@/components/shared/section-card";
import { SummaryChip } from "@/components/shared/summary-chip";
import { Button } from "@/components/ui/button";
import {
  filterCalendarEvents,
} from "@/features/calendar/calendar-helpers";
import { useAppointmentsCalendar } from "@/hooks/appointments/useAppointments";
import {
  toCalendarEvents,
} from "@/pages/appointments/adapters";
import { formatLocalized } from "@/lib/utils";
import type { CalendarView } from "@/types/calendar";

type FiltersState = {
  search: string;
  dateRange: string;
  venue: string;
  status: string;
  coordinator: string;
  eventType: string;
};

const initialFilters: FiltersState = {
  search: "",
  dateRange: "all",
  venue: "all",
  status: "all",
  coordinator: "all",
  eventType: "all",
};

export function CalendarPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [view, setView] = useState<CalendarView>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filters, setFilters] = useState<FiltersState>(initialFilters);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const { dateFrom, dateTo } = useMemo(
    () => getCalendarFetchWindow(currentDate, view),
    [currentDate, view],
  );

  const { data: appointments = [] } = useAppointmentsCalendar({
    dateFrom,
    dateTo,
  });

  const calendarEvents = useMemo(
    () => toCalendarEvents(appointments),
    [appointments],
  );

  const filteredEvents = useMemo(
    () =>
      filterCalendarEvents(calendarEvents, filters).sort(
        (first, second) => first.startAt.getTime() - second.startAt.getTime(),
      ),
    [calendarEvents, filters],
  );

  const activeSelectedEventId =
    selectedEventId &&
    filteredEvents.some((event) => event.id === selectedEventId)
      ? selectedEventId
      : (filteredEvents[0]?.id ?? null);

  const selectedEvent =
    filteredEvents.find((event) => event.id === activeSelectedEventId) ??
    filteredEvents[0] ??
    null;

  const filterFields = useMemo(
    () => [
      {
        key: "dateRange",
        label: t("calendar.fields.dateRange"),
        value: filters.dateRange,
        options: [
          { label: "All dates", value: "all" },
          { label: "Today", value: "today" },
          { label: "Next 7 days", value: "7d" },
          { label: "Next 30 days", value: "30d" },
        ],
      },
      {
        key: "venue",
        label: t("calendar.fields.venue"),
        value: filters.venue,
        options: buildFilterOptions(calendarEvents.map((event) => event.venue), "All venues"),
      },
      {
        key: "status",
        label: t("calendar.fields.status"),
        value: filters.status,
        options: buildFilterOptions(
          calendarEvents.map((event) => event.status),
          "All statuses",
        ),
      },
      {
        key: "coordinator",
        label: t("calendar.fields.coordinator"),
        value: filters.coordinator,
        options: buildFilterOptions(
          calendarEvents.map((event) => event.coordinator),
          "All coordinators",
        ),
      },
      {
        key: "eventType",
        label: t("calendar.fields.eventType"),
        value: filters.eventType,
        options: buildFilterOptions(
          calendarEvents.map((event) => event.eventType),
          "All event types",
        ),
      },
    ],
    [calendarEvents, filters, t],
  );

  const conflictEvents = filteredEvents.filter((event) => event.conflict);
  const calendarSummaries = useMemo(
    () => buildCalendarSummaries(calendarEvents),
    [calendarEvents],
  );
  const monthVisibleDays = useMemo(
    () => getMonthVisibleDays(filters.dateRange),
    [filters.dateRange],
  );

  return (
    <ProtectedComponent permission="appointments.calendar.read">
      <PageContainer>
        <section className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--lux-gold)]">
              {t("calendar.operations")}
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-[var(--lux-heading)] md:text-3xl">
              {t("calendar.title")}
            </h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <ViewSwitcher value={view} onChange={setView} />
            <ProtectedComponent permission="appointments.create">
              <Button onClick={() => navigate("/appointments/create")}>
                <Plus className="h-4 w-4" />
                {t("appointments.create", { defaultValue: "Create Appointment" })}
              </Button>
            </ProtectedComponent>
          </div>
        </section>

        <section className="flex flex-wrap gap-4">
          {calendarSummaries.map((summary) => (
            <SummaryChip
              key={summary.id}
              detail={summary.detail}
              label={summary.label}
              value={summary.value}
            />
          ))}
        </section>

        <FilterToolbar
          fields={filterFields}
          searchValue={filters.search}
          onFieldChange={(key, value) =>
            setFilters((current) => ({
              ...current,
              [key]: value,
            }))
          }
          onSearchChange={(value) =>
            setFilters((current) => ({
              ...current,
              search: value,
            }))
          }
        />

        {conflictEvents.length > 0 ? (
          <section className="grid gap-4">
            <div className="rounded-[24px] border border-red-300/50 bg-red-100/70 px-5 py-4 text-sm text-red-900">
              {t("calendar.conflictCount", { count: conflictEvents.length })}
            </div>
          </section>
        ) : null}

        <section className="grid gap-6 2xl:grid-cols-12">
          <div className="space-y-6 2xl:col-span-8">
            <SectionCard className="space-y-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--lux-text-muted)]">
                    {t("calendar.scheduleWindow")}
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-[var(--lux-text)]">
                    {formatLocalized(
                      currentDate,
                      view === "month" ? "MMMM yyyy" : "dd MMM yyyy",
                    )}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={() => navigateRange(view, setCurrentDate, "prev")}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={() => navigateRange(view, setCurrentDate, "next")}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {view === "month" ? (
                <MonthView
                  currentDate={currentDate}
                  events={filteredEvents}
                  selectedEventId={activeSelectedEventId}
                  onSelectEvent={(event) => setSelectedEventId(event.id)}
                  viewMode="month"
                  visibleDays={monthVisibleDays}
                />
              ) : null}
              {view === "week" ? (
                <WeekView
                  currentDate={currentDate}
                  events={filteredEvents}
                  selectedEventId={activeSelectedEventId}
                  onSelectEvent={(event) => setSelectedEventId(event.id)}
                />
              ) : null}
              {view === "day" ? (
                <DayView
                  currentDate={currentDate}
                  events={filteredEvents}
                  onSelectEvent={(event) => setSelectedEventId(event.id)}
                />
              ) : null}
              {view === "agenda" ? (
                <AgendaView
                  events={filteredEvents}
                  selectedEventId={activeSelectedEventId}
                  onSelectEvent={(event) => setSelectedEventId(event.id)}
                />
              ) : null}
            </SectionCard>
          </div>

          <div className="space-y-6 2xl:col-span-4">
            <QuickViewPanel
              event={selectedEvent}
              onView={() =>
                selectedEvent?.appointmentId &&
                navigate(`/appointments/${selectedEvent.appointmentId}`)
              }
              onEdit={() =>
                selectedEvent?.appointmentId &&
                navigate(`/appointments/edit/${selectedEvent.appointmentId}`)
              }
            />
          </div>
        </section>
      </PageContainer>
    </ProtectedComponent>
  );
}

function buildFilterOptions(values: string[], allLabel: string) {
  return [
    { label: allLabel, value: "all" },
    ...Array.from(new Set(values.filter(Boolean))).map((value) => ({
      label: value,
      value,
    })),
  ];
}

function buildCalendarSummaries(events: ReturnType<typeof toCalendarEvents>) {
  const today = new Date();
  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 0 });
  const endOfCurrentWeek = endOfWeek(today, { weekStartsOn: 0 });
  const dayCounts = new Map<string, number>();

  for (const event of events) {
    const key = format(event.startAt, "yyyy-MM-dd");
    dayCounts.set(key, (dayCounts.get(key) || 0) + 1);
  }

  return [
    {
      id: "todayBookings",
      label: "Today appointments",
      detail: "Appointments scheduled for today.",
      value: String(
        events.filter(
          (event) => format(event.startAt, "yyyy-MM-dd") === format(today, "yyyy-MM-dd"),
        ).length,
      ),
    },
    {
      id: "thisWeekEvents",
      label: "This week",
      detail: "Appointments scheduled this week.",
      value: String(
        events.filter(
          (event) =>
            event.startAt >= startOfCurrentWeek && event.startAt <= endOfCurrentWeek,
        ).length,
      ),
    },
    {
      id: "pendingConfirmations",
      label: "Pending confirmations",
      detail: "Scheduled or rescheduled appointments awaiting confirmation.",
      value: String(
        events.filter((event) => ["Pending", "Tentative"].includes(event.status)).length,
      ),
    },
    {
      id: "fullyBookedDays",
      label: "Busy days",
      detail: "Days carrying two or more appointments.",
      value: String(
        Array.from(dayCounts.values()).filter((count) => count >= 2).length,
      ),
    },
  ];
}

function getMonthVisibleDays(dateRange: string) {
  const today = startOfDay(new Date());

  if (dateRange === "today") {
    return [today];
  }

  if (dateRange === "7d") {
    return Array.from({ length: 7 }, (_, index) => addDays(today, index));
  }

  if (dateRange === "30d") {
    return Array.from({ length: 30 }, (_, index) => addDays(today, index));
  }

  return undefined;
}

function getCalendarFetchWindow(currentDate: Date, view: CalendarView) {
  if (view === "month") {
    return {
      dateFrom: format(
        startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 }),
        "yyyy-MM-dd",
      ),
      dateTo: format(
        endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 }),
        "yyyy-MM-dd",
      ),
    };
  }

  if (view === "week") {
    return {
      dateFrom: format(startOfWeek(currentDate, { weekStartsOn: 0 }), "yyyy-MM-dd"),
      dateTo: format(endOfWeek(currentDate, { weekStartsOn: 0 }), "yyyy-MM-dd"),
    };
  }

  if (view === "day") {
    return {
      dateFrom: format(currentDate, "yyyy-MM-dd"),
      dateTo: format(currentDate, "yyyy-MM-dd"),
    };
  }

  return {
    dateFrom: format(subDays(currentDate, 30), "yyyy-MM-dd"),
    dateTo: format(addDays(currentDate, 30), "yyyy-MM-dd"),
  };
}

function navigateRange(
  view: CalendarView,
  setCurrentDate: React.Dispatch<React.SetStateAction<Date>>,
  direction: "prev" | "next",
) {
  setCurrentDate((current) => {
    if (view === "month") {
      return direction === "prev"
        ? subMonths(current, 1)
        : addMonths(current, 1);
    }

    if (view === "week") {
      return direction === "prev" ? subWeeks(current, 1) : addWeeks(current, 1);
    }

    return direction === "prev" ? subDays(current, 1) : addDays(current, 1);
  });
}
