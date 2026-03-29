import { format } from "date-fns";
import { CalendarDays } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { AppCalendar, type AppCalendarHandle } from "@/components/calendar/app-calendar";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { SectionCard } from "@/components/shared/section-card";
import {
  WorkspaceFilterBar,
  WorkspaceFilterField,
  WorkspaceFilterPill,
} from "@/components/shared/workspace-filter-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  EventCalendarQuickView,
  EventCalendarQuickViewDialog,
} from "@/features/events/event-calendar-quick-view";
import {
  buildEventsCalendarSummary,
  getEventsCalendarLegendItems,
} from "@/features/events/event-calendar";
import { useCustomers } from "@/hooks/customers/useCustomers";
import { useEventsCalendarView } from "@/hooks/events/useEventsCalendarView";
import { useVenues } from "@/hooks/venues/useVenues";
import {
  getInitialEventsBusinessFilters,
  type EventsBusinessFilters,
} from "@/pages/events/event-query-params";
import { EVENT_STATUS_OPTIONS } from "@/pages/events/adapters";

const filterFieldClassName =
  "h-11 w-full rounded-[6px] border px-3 text-sm text-[var(--lux-text)] outline-none transition focus:border-[var(--lux-gold-border)]";

const fieldStyle = {
  background: "var(--lux-control-surface)",
  borderColor: "var(--lux-control-border)",
} as const;

type EventsCalendarViewProps = {
  active: boolean;
  filters: EventsBusinessFilters;
  onFiltersChange: Dispatch<SetStateAction<EventsBusinessFilters>>;
};

export function EventsCalendarView({
  active,
  filters,
  onFiltersChange,
}: EventsCalendarViewProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const calendarRef = useRef<AppCalendarHandle | null>(null);
  const {
    items,
    calendarEvents,
    activeFiltersCount,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useEventsCalendarView(filters);

  const resetFilters = () => {
    onFiltersChange(getInitialEventsBusinessFilters());
  };
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

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
    if (!active) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      calendarRef.current?.updateSize();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [active]);

  const selectedEvent = useMemo(() => {
    if (!items.length) {
      return null;
    }

    if (selectedEventId) {
      const matchedItem =
        items.find((item) => String(item.id) === selectedEventId) ?? null;

      if (matchedItem) {
        return matchedItem;
      }
    }

    return items[0] ?? null;
  }, [items, selectedEventId]);

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

  const activeFilterPills = [
    filters.search.trim() ? (
      <WorkspaceFilterPill key="search" label={filters.search.trim()} />
    ) : null,
    filters.status !== "all" ? (
      <WorkspaceFilterPill
        key="status"
        label={t(`events.status.${filters.status}`, {
          defaultValue: filters.status,
        })}
      />
    ) : null,
    filters.venueId.trim() ? (
      <WorkspaceFilterPill
        key="venue"
        label={
          venueOptions.find((option) => option.value === filters.venueId)?.label ??
          filters.venueId
        }
      />
    ) : null,
    filters.customerId.trim() ? (
      <WorkspaceFilterPill
        key="customer"
        label={
          customerOptions.find((option) => option.value === filters.customerId)
            ?.label ?? filters.customerId
        }
      />
    ) : null,
    filters.dateFrom ? (
      <WorkspaceFilterPill
        key="date-from"
        label={`${t("common.from", { defaultValue: "From" })}: ${filters.dateFrom}`}
      />
    ) : null,
    filters.dateTo ? (
      <WorkspaceFilterPill
        key="date-to"
        label={`${t("common.to", { defaultValue: "To" })}: ${filters.dateTo}`}
      />
    ) : null,
  ].filter(Boolean);

  return (
    <>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {buildEventsCalendarSummary(items, t).map((summary) => (
          <SummaryCard
            key={summary.id}
            label={summary.label}
            value={summary.value}
            hint={summary.hint}
            accent={<CalendarDays className="h-4 w-4" />}
            className="workspace-summary-card"
          />
        ))}
      </section>

      <WorkspaceFilterBar
        title={t("common.filters", { defaultValue: "Filters" })}
        description={t("events.calendarPage.filtersDescription", {
          defaultValue:
            "Focus the event calendar by status, venue, search terms, and date presets.",
        })}
        activeFiltersLabel={t("events.activeFiltersCount", {
          count: activeFiltersCount,
          defaultValue:
            activeFiltersCount === 1
              ? "1 active filter"
              : `${activeFiltersCount} active filters`,
        })}
        activeFiltersCount={activeFiltersCount}
        clearLabel={t("events.clearFilters", { defaultValue: "Clear Filters" })}
        onClear={resetFilters}
        showFiltersLabel={t("events.showFilters", { defaultValue: "Show Filters" })}
        hideFiltersLabel={t("events.hideFilters", { defaultValue: "Hide Filters" })}
        pills={activeFilterPills.length ? activeFilterPills : undefined}
        quickFilters={
          <>
            <WorkspaceFilterField
              label={t("common.searchAnything", { defaultValue: "Search" })}
            >
              <Input
                className={filterFieldClassName}
                style={fieldStyle}
                placeholder={t("events.calendarPage.searchPlaceholder", {
                  defaultValue:
                    "Search event titles, party names, venues, customers, or notes...",
                })}
                value={filters.search}
                onChange={(event) =>
                  onFiltersChange((current) => ({
                    ...current,
                    search: event.target.value,
                  }))
                }
              />
            </WorkspaceFilterField>

            <WorkspaceFilterField
              label={t("events.statusLabel", { defaultValue: "Status" })}
            >
              <select
                className={filterFieldClassName}
                style={fieldStyle}
                value={filters.status}
                onChange={(event) =>
                  onFiltersChange((current) => ({
                    ...current,
                    status: event.target.value as typeof filters.status,
                  }))
                }
              >
                <option value="all">
                  {t("events.allStatuses", { defaultValue: "All Statuses" })}
                </option>
                {EVENT_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(`events.status.${option.value}`, {
                      defaultValue: option.label,
                    })}
                  </option>
                ))}
              </select>
            </WorkspaceFilterField>

            <WorkspaceFilterField
              label={t("common.venue", { defaultValue: "Venue" })}
            >
              <select
                className={filterFieldClassName}
                style={fieldStyle}
                value={filters.venueId}
                onChange={(event) =>
                  onFiltersChange((current) => ({
                    ...current,
                    venueId: event.target.value,
                  }))
                }
              >
                <option value="">
                  {t("events.allVenues", { defaultValue: "All Venues" })}
                </option>
                {venueOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                  ))}
              </select>
            </WorkspaceFilterField>

            <WorkspaceFilterField
              label={t("events.customer", { defaultValue: "Customer" })}
            >
              <select
                className={filterFieldClassName}
                style={fieldStyle}
                value={filters.customerId}
                onChange={(event) =>
                  onFiltersChange((current) => ({
                    ...current,
                    customerId: event.target.value,
                  }))
                }
              >
                <option value="">
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
            </WorkspaceFilterField>

            <WorkspaceFilterField
              label={t("common.from", { defaultValue: "From" })}
            >
              <Input
                type="date"
                className={filterFieldClassName}
                style={fieldStyle}
                value={filters.dateFrom}
                onChange={(event) =>
                  onFiltersChange((current) => ({
                    ...current,
                    dateFrom: event.target.value,
                  }))
                }
              />
            </WorkspaceFilterField>

            <WorkspaceFilterField
              label={t("common.to", { defaultValue: "To" })}
            >
              <Input
                type="date"
                className={filterFieldClassName}
                style={fieldStyle}
                value={filters.dateTo}
                onChange={(event) =>
                  onFiltersChange((current) => ({
                    ...current,
                    dateTo: event.target.value,
                  }))
                }
              />
            </WorkspaceFilterField>
          </>
        }
      />

      <section className="grid gap-6 2xl:grid-cols-12">
        <div className="space-y-6 2xl:col-span-8">
          {isError ? (
            <SectionCard className="space-y-4" elevated>
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
              className="operations-calendar-panel"
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
              variant="event"
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
            className="operations-side-panel 2xl:sticky 2xl:top-4"
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
    </>
  );
}
