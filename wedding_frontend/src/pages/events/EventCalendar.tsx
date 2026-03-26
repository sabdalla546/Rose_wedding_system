import { format } from "date-fns";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CalendarRange,
  List,
  RotateCcw,
  Table2,
  TableProperties,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { AppCalendar, type AppCalendarHandle } from "@/components/calendar/app-calendar";
import { EventTypeBadge } from "@/components/calendar/event-type-badge";
import type { AppCalendarView } from "@/components/calendar/types";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import {
  CrudFilterField,
  CrudFilterPill,
  CrudPageLayout,
} from "@/components/shared/crud-layout";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { CalendarFilterBar } from "@/components/calendar/calendar-filter-bar";
import {
  EventCalendarQuickView,
  EventCalendarQuickViewDialog,
} from "@/features/events/event-calendar-quick-view";
import {
  buildEventsCalendarSummary,
  getEventCalendarAccent,
  getEventsCalendarLegendItems,
} from "@/features/events/event-calendar";
import { useCustomers } from "@/hooks/customers/useCustomers";
import { useEventsCalendarView } from "@/hooks/events/useEventsCalendarView";
import { useVenues } from "@/hooks/venues/useVenues";
import { formatEventStatus, getEventDisplayTitle } from "@/pages/events/adapters";
import { cn, formatDateLabel } from "@/lib/utils";

const VIEW_OPTIONS: Array<{
  value: AppCalendarView;
  label: string;
  icon: typeof Table2;
}> = [
  { value: "month", label: "Month", icon: Table2 },
  { value: "week", label: "Week", icon: TableProperties },
  { value: "day", label: "Day", icon: CalendarDays },
  { value: "list", label: "List", icon: List },
];

const INITIAL_FILTERS = {
  search: "",
  status: "all" as const,
  venueId: "all",
  customerId: "all",
  dateFrom: "",
  dateTo: "",
};

export default function EventCalendarPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const calendarRef = useRef<AppCalendarHandle | null>(null);
  const {
    items,
    calendarEvents,
    filters,
    setFilters,
    setCalendarRange,
    activeFiltersCount,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useEventsCalendarView();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [calendarHeader, setCalendarHeader] = useState<{
    title: string;
    view: AppCalendarView;
  }>({
    title: "",
    view: "month",
  });

  const { data: venuesResponse } = useVenues({
    currentPage: 1,
    itemsPerPage: 200,
    searchQuery: "",
    isActive: "all",
  });
  const { data: customersResponse } = useCustomers({
    currentPage: 1,
    itemsPerPage: 200,
    searchQuery: "",
    status: "all",
    venueId: "",
    weddingDateFrom: "",
    weddingDateTo: "",
  });

  useEffect(() => {
    if (!items.length) {
      setSelectedEventId(null);
      return;
    }

    if (!selectedEventId || !items.some((item) => String(item.id) === selectedEventId)) {
      setSelectedEventId(String(items[0].id));
    }
  }, [items, selectedEventId]);

  const selectedEvent = useMemo(
    () => items.find((item) => String(item.id) === selectedEventId) ?? null,
    [items, selectedEventId],
  );

  const venueOptions = useMemo(
    () =>
      (venuesResponse?.data ?? []).map((venue) => ({
        value: String(venue.id),
        label: venue.name,
      })),
    [venuesResponse?.data],
  );

  const customerOptions = useMemo(
    () =>
      (customersResponse?.data ?? []).map((customer) => ({
        value: String(customer.id),
        label: customer.fullName,
      })),
    [customersResponse?.data],
  );

  const statusOptions = useMemo(
    () =>
      Array.from(new Set(items.map((item) => item.status)))
        .sort()
        .map((status) => ({
          value: status,
          label: t(`events.status.${status}`, { defaultValue: status }),
        })),
    [items, t],
  );

  const spotlightBadges = selectedEvent ? (
    <>
      <EventTypeBadge
        label={formatEventStatus(selectedEvent.status)}
        accent={getEventCalendarAccent(selectedEvent.status)}
      />
      {selectedEvent.venueName ? (
        <EventTypeBadge label={selectedEvent.venueName} accent="gold" />
      ) : null}
    </>
  ) : null;

  return (
    <ProtectedComponent permission="events.read">
      <CrudPageLayout>
        <SectionCard className="overflow-hidden border-[var(--lux-gold-border)]/35 p-0 shadow-[0_18px_45px_rgba(0,0,0,0.24)]" elevated>
          <div
            className="space-y-6 px-5 py-5 md:px-6"
            style={{
              background:
                "linear-gradient(135deg, color-mix(in srgb, var(--lux-control-hover) 78%, transparent), color-mix(in srgb, var(--lux-surface) 86%, transparent))",
            }}
          >
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--lux-text-muted)]">
                  {t("events.calendarPage.eyebrow", {
                    defaultValue: "Events Calendar",
                  })}
                </p>
                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold tracking-tight text-[var(--lux-heading)]">
                    {t("events.calendarPage.title", {
                      defaultValue: "Events Planning Calendar",
                    })}
                  </h1>
                  <p className="max-w-3xl text-sm leading-6 text-[var(--lux-text-secondary)]">
                    {t("events.calendarPage.description", {
                      defaultValue:
                        "Dedicated calendar for wedding event dates, venue planning, and production readiness.",
                    })}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                <Button variant="outline" onClick={() => navigate("/events")}>
                  {t("events.backToEvents", { defaultValue: "Back to Events" })}
                </Button>
                <ProtectedComponent permission="events.create">
                  <Button onClick={() => navigate("/events/create")}>
                    <CalendarRange className="h-4 w-4" />
                    {t("events.create", { defaultValue: "Create Event" })}
                  </Button>
                </ProtectedComponent>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.95fr)]">
              <div
                className="rounded-[28px] border px-5 py-5"
                style={{
                  borderColor: "color-mix(in srgb, var(--lux-gold-border) 28%, transparent)",
                  background:
                    "linear-gradient(180deg, color-mix(in srgb, var(--lux-panel-surface) 92%, transparent), color-mix(in srgb, var(--lux-control-hover) 35%, transparent))",
                }}
              >
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--lux-text-muted)]">
                    {t("events.calendarPage.currentWindow", {
                      defaultValue: "Planning Window",
                    })}
                  </p>
                  <div className="flex flex-wrap items-end gap-3">
                    <h2 className="text-2xl font-semibold text-[var(--lux-heading)]">
                      {calendarHeader.title || t("events.calendarPage.loadingWindow", {
                        defaultValue: "Loading current window...",
                      })}
                    </h2>
                    <span className="inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-secondary)]" style={{ borderColor: "var(--lux-control-border)", background: "var(--lux-control-surface)" }}>
                      {t(`calendar.view.${calendarHeader.view}`, {
                        defaultValue: calendarHeader.view,
                      })}
                    </span>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <Button type="button" variant="outline" onClick={() => calendarRef.current?.today()}>
                    {t("calendar.today", { defaultValue: "Today" })}
                  </Button>
                  <Button type="button" size="icon" variant="secondary" onClick={() => calendarRef.current?.previous()}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Button type="button" size="icon" variant="secondary" onClick={() => calendarRef.current?.next()}>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  {VIEW_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const active = calendarHeader.view === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        className={cn(
                          "inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium transition",
                          active
                            ? "text-[var(--lux-primary-text)]"
                            : "text-[var(--lux-text-secondary)] hover:text-[var(--lux-text)]",
                        )}
                        style={
                          active
                            ? {
                                background: "var(--lux-primary-surface)",
                                borderColor: "var(--lux-gold-border)",
                              }
                            : {
                                background: "var(--lux-control-surface)",
                                borderColor: "var(--lux-control-border)",
                              }
                        }
                        onClick={() => {
                          setCalendarHeader((current) => ({
                            ...current,
                            view: option.value,
                          }));
                          calendarRef.current?.setView(option.value);
                        }}
                      >
                        <Icon className="h-4 w-4" />
                        {t(`calendar.view.${option.value}`, {
                          defaultValue: option.label,
                        })}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div
                className="rounded-[28px] border px-5 py-5"
                style={{
                  borderColor: "color-mix(in srgb, var(--lux-row-border) 85%, transparent)",
                  background:
                    "linear-gradient(180deg, color-mix(in srgb, var(--lux-panel-surface) 90%, transparent), color-mix(in srgb, var(--lux-control-hover) 28%, transparent))",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--lux-text-muted)]">
                      {t("events.calendarPage.featuredEvent", {
                        defaultValue: "Featured Event",
                      })}
                    </p>
                    <h3 className="text-xl font-semibold text-[var(--lux-heading)]">
                      {selectedEvent
                        ? getEventDisplayTitle(selectedEvent)
                        : t("events.calendarPage.selectTitle", {
                            defaultValue: "Select an event",
                          })}
                    </h3>
                  </div>
                  {spotlightBadges ? (
                    <div className="flex flex-wrap justify-end gap-2">{spotlightBadges}</div>
                  ) : null}
                </div>

                <div className="mt-4 space-y-3 text-sm text-[var(--lux-text-secondary)]">
                  <p>
                    {selectedEvent
                      ? formatDateLabel(
                          new Date(selectedEvent.eventDate),
                          "EEEE, dd MMM yyyy",
                        )
                      : t("events.calendarPage.featuredEventHint", {
                          defaultValue:
                            "Select a wedding event from the calendar to surface its venue, party names, and planning context here.",
                        })}
                  </p>
                  {selectedEvent ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="rounded-2xl border px-3 py-2.5" style={{ borderColor: "var(--lux-control-border)", background: "var(--lux-control-surface)" }}>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--lux-text-muted)]">
                          {t("common.venue", { defaultValue: "Venue" })}
                        </p>
                        <p className="mt-1 text-sm font-medium text-[var(--lux-text)]">
                          {selectedEvent.venueName || "-"}
                        </p>
                      </div>
                      <div className="rounded-2xl border px-3 py-2.5" style={{ borderColor: "var(--lux-control-border)", background: "var(--lux-control-surface)" }}>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--lux-text-muted)]">
                          {t("events.partyNames", { defaultValue: "Party Names" })}
                        </p>
                        <p className="mt-1 text-sm font-medium text-[var(--lux-text)]">
                          {[selectedEvent.groomName, selectedEvent.brideName]
                            .filter(Boolean)
                            .join(" / ") || selectedEvent.customerName || "-"}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {buildEventsCalendarSummary(items, t).map((summary) => (
            <SummaryCard
              key={summary.id}
              label={summary.label}
              value={summary.value}
              hint={summary.hint}
              className="space-y-2.5"
            />
          ))}
        </section>

        <CalendarFilterBar
          title={t("common.filters", { defaultValue: "Filters" })}
          description={t("events.calendarPage.filtersDescription", {
            defaultValue:
              "Focus the event calendar by status, venue, search terms, and date presets.",
          })}
          actions={
            <>
              <CrudFilterPill
                label={t("events.activeFiltersCount", {
                  count: activeFiltersCount,
                  defaultValue:
                    activeFiltersCount === 1
                      ? "1 active filter"
                      : `${activeFiltersCount} active filters`,
                })}
              />
              <Button
                size="sm"
                variant="secondary"
                className="h-9 rounded-xl px-2.5 text-[12px]"
                disabled={activeFiltersCount === 0}
                onClick={() => setFilters(INITIAL_FILTERS)}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {t("events.clearFilters", { defaultValue: "Clear Filters" })}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="crud-form-grid xl:grid-cols-6">
              <CrudFilterField
                label={t("common.searchAnything", { defaultValue: "Search" })}
              >
                <input
                  className="app-native-select h-10 rounded-xl text-[13px]"
                  placeholder={t("events.calendarPage.searchPlaceholder", {
                    defaultValue:
                      "Search event titles, party names, venues, customers, or notes...",
                  })}
                  value={filters.search}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      search: event.target.value,
                    }))
                  }
                />
              </CrudFilterField>

              <CrudFilterField
                label={t("events.statusLabel", { defaultValue: "Status" })}
              >
                <select
                  className="app-native-select h-10 rounded-xl text-[13px]"
                  value={filters.status}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      status: event.target.value as typeof filters.status,
                    }))
                  }
                >
                  <option value="all">
                    {t("events.allStatuses", { defaultValue: "All Statuses" })}
                  </option>
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </CrudFilterField>

              <CrudFilterField
                label={t("common.venue", { defaultValue: "Venue" })}
              >
                <select
                  className="app-native-select h-10 rounded-xl text-[13px]"
                  value={filters.venueId}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      venueId: event.target.value,
                    }))
                  }
                >
                  <option value="all">
                    {t("events.allVenues", { defaultValue: "All Venues" })}
                  </option>
                  {venueOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </CrudFilterField>

              <CrudFilterField
                label={t("events.customer", { defaultValue: "Customer" })}
              >
                <select
                  className="app-native-select h-10 rounded-xl text-[13px]"
                  value={filters.customerId}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      customerId: event.target.value,
                    }))
                  }
                >
                  <option value="all">
                    {t("events.calendarPage.allCustomers", {
                      defaultValue: "All customers",
                    })}
                  </option>
                  {customerOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </CrudFilterField>

              <CrudFilterField
                label={t("common.from", { defaultValue: "From" })}
              >
                <input
                  type="date"
                  className="app-native-select h-10 rounded-xl text-[13px]"
                  value={filters.dateFrom}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      dateFrom: event.target.value,
                    }))
                  }
                />
              </CrudFilterField>

              <CrudFilterField label={t("common.to", { defaultValue: "To" })}>
                <input
                  type="date"
                  className="app-native-select h-10 rounded-xl text-[13px]"
                  value={filters.dateTo}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      dateTo: event.target.value,
                    }))
                  }
                />
              </CrudFilterField>
            </div>
          </div>
        </CalendarFilterBar>

        <section className="grid gap-6 2xl:grid-cols-12">
          <div className="space-y-6 2xl:col-span-8">
            {isError ? (
              <SectionCard
                className="space-y-4"
                elevated
              >
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--lux-text-muted)]">
                    {t("common.error", { defaultValue: "Error" })}
                  </p>
                  <h3 className="text-xl font-semibold text-[var(--lux-heading)]">
                    {t("events.calendarPage.errorTitle", {
                      defaultValue: "Unable to load the events calendar",
                    })}
                  </h3>
                  <p className="text-sm text-[var(--lux-text-secondary)]">
                    {t("events.calendarPage.errorDescription", {
                      defaultValue:
                        "The planning feed could not be loaded right now. Try again to refresh the schedule.",
                    })}
                  </p>
                </div>
                <Button onClick={() => refetch()}>
                  {t("common.retry", { defaultValue: "Retry" })}
                </Button>
              </SectionCard>
            ) : (
              <AppCalendar
                ref={calendarRef}
                locale={i18n.language === "ar" ? "ar" : "en"}
                events={calendarEvents}
                loading={isLoading || isFetching}
                legends={getEventsCalendarLegendItems(t)}
                emptyTitle={t("events.calendarPage.emptyTitle", {
                  defaultValue: "No events found",
                })}
                emptyDescription={t("events.calendarPage.emptyDescription", {
                  defaultValue:
                    "Try changing the planning window or clearing one of the active filters.",
                })}
                hideToolbar
                variant="event"
                onStateChange={setCalendarHeader}
                onRangeChange={setCalendarRange}
                onEventSelect={(event) => {
                  setSelectedEventId(event.id);
                  setDetailsDialogOpen(true);
                }}
                onDateSelect={(date) =>
                  navigate(`/events/create?date=${format(date, "yyyy-MM-dd")}`)
                }
              />
            )}
          </div>

          <div className="space-y-6 2xl:col-span-4">
            <EventCalendarQuickView
              event={selectedEvent}
              onView={(event) => navigate(`/events/${event.id}`)}
              onEdit={(event) => navigate(`/events/edit/${event.id}`)}
            />
          </div>
        </section>

        <EventCalendarQuickViewDialog
          open={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
          event={selectedEvent}
          onView={(event) => navigate(`/events/${event.id}`)}
          onEdit={(event) => navigate(`/events/edit/${event.id}`)}
        />
      </CrudPageLayout>
    </ProtectedComponent>
  );
}
