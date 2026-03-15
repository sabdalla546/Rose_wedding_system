import {
  addDays,
  addMonths,
  addWeeks,
  subDays,
  subMonths,
  subWeeks,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

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
  calendarAvailabilityNotices,
  calendarEvents,
  calendarFilterOptions,
  calendarSummaries,
  defaultCalendarEventId,
} from "@/data/mock/calendar";
import { filterCalendarEvents } from "@/features/calendar/calendar-helpers";
import { cn, formatLocalized } from "@/lib/utils";
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
  const [view, setView] = useState<CalendarView>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filters, setFilters] = useState<FiltersState>(initialFilters);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(
    defaultCalendarEventId,
  );

  const filteredEvents = filterCalendarEvents(calendarEvents, filters).sort(
    (first, second) => first.startAt.getTime() - second.startAt.getTime(),
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

  const filterFields = [
    {
      key: "dateRange",
      label: t("calendar.fields.dateRange"),
      value: filters.dateRange,
      options: calendarFilterOptions.dateRange,
    },
    {
      key: "venue",
      label: t("calendar.fields.venue"),
      value: filters.venue,
      options: calendarFilterOptions.venues,
    },
    {
      key: "status",
      label: t("calendar.fields.status"),
      value: filters.status,
      options: calendarFilterOptions.statuses.map((option) => ({
        value: option.value,
        label:
          option.value === "all" ? option.label : t(`status.${option.value}`),
      })),
    },
    {
      key: "coordinator",
      label: t("calendar.fields.coordinator"),
      value: filters.coordinator,
      options: calendarFilterOptions.coordinators,
    },
    {
      key: "eventType",
      label: t("calendar.fields.eventType"),
      value: filters.eventType,
      options: calendarFilterOptions.eventTypes,
    },
  ];

  const conflictEvents = filteredEvents.filter((event) => event.conflict);

  return (
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
          <Button>
            <Plus className="h-4 w-4" />
            {t("common.newBooking")}
          </Button>
        </div>
      </section>

      <section className="flex flex-wrap gap-4">
        {calendarSummaries.map((summary) => (
          <SummaryChip
            detail={t(`calendar.summary.${summary.id}Detail`)}
            key={summary.id}
            label={t(`calendar.summary.${summary.id}`)}
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

      {(calendarAvailabilityNotices.length > 0 ||
        conflictEvents.length > 0) && (
        <section className="grid gap-4 xl:grid-cols-2">
          {calendarAvailabilityNotices.map((notice) => (
            <div
              className={cn(
                "rounded-[24px] border px-5 py-4 text-sm",
                notice.severity === "high"
                  ? "border-amber-300/50 bg-amber-100/70 text-amber-900"
                  : "border-sky-300/50 bg-sky-100/70 text-sky-900",
              )}
              key={notice.id}
            >
              {t(notice.messageKey)}
            </div>
          ))}
          {conflictEvents.length > 0 ? (
            <div className="rounded-[24px] border border-red-300/50 bg-red-100/70 px-5 py-4 text-sm text-red-900">
              {t("calendar.conflictCount", { count: conflictEvents.length })}
            </div>
          ) : null}
        </section>
      )}

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
          <QuickViewPanel event={selectedEvent} />
        </div>
      </section>
    </PageContainer>
  );
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
