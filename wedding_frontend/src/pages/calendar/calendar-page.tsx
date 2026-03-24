import { addDays, endOfMonth, endOfWeek, format, startOfMonth, startOfWeek } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarClock,
  ChevronDown,
  ChevronUp,
  MapPin,
  NotebookText,
  Plus,
  RotateCcw,
  UsersRound,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { AppCalendar } from "@/components/calendar/app-calendar";
import { CalendarFilterBar } from "@/components/calendar/calendar-filter-bar";
import { EventDetailsDialog } from "@/components/calendar/event-details-dialog";
import { EventTypeBadge } from "@/components/calendar/event-type-badge";
import {
  EventQuickViewCard,
  type EventQuickViewData,
} from "@/components/calendar/event-quick-view-card";
import { CrudFilterField, CrudFilterPill, CrudPageLayout, CrudPageHeader } from "@/components/shared/crud-layout";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  SearchableSelect,
  SearchableSelectEmpty,
  SearchableSelectItem,
} from "@/components/ui/searchable-select";
import { filterCalendarEvents } from "@/features/calendar/calendar-helpers";
import { toAppCalendarAppointmentEvents } from "@/features/calendar/app-calendar-adapters";
import { useAppointmentsCalendar } from "@/hooks/appointments/useAppointments";
import { useVenues } from "@/hooks/venues/useVenues";
import {
  APPOINTMENT_TYPE_OPTIONS,
  toCalendarEvents,
} from "@/pages/appointments/adapters";
import { formatDateLabel, formatTimeLabel } from "@/lib/utils";
import type { AppCalendarRange } from "@/components/calendar/types";
import type { CalendarEvent } from "@/types/calendar";

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

const FILTER_EMPTY_VALUE = "__all__";

function getInitialRange() {
  const currentDate = new Date();

  return {
    view: "month" as const,
    title: format(currentDate, "MMMM yyyy"),
    start: startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 }),
    end: endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 }),
    currentStart: startOfMonth(currentDate),
    currentEnd: endOfMonth(currentDate),
  };
}

export function CalendarPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<FiltersState>(initialFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [venueSearch, setVenueSearch] = useState("");
  const [coordinatorSearch, setCoordinatorSearch] = useState("");
  const [eventTypeSearch, setEventTypeSearch] = useState("");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [calendarRange, setCalendarRange] = useState<AppCalendarRange>(getInitialRange);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const { data: appointments = [], isLoading } = useAppointmentsCalendar({
    dateFrom: format(calendarRange.start, "yyyy-MM-dd"),
    dateTo: format(addDays(calendarRange.end, -1), "yyyy-MM-dd"),
  });
  const { data: venuesResponse } = useVenues({
    currentPage: 1,
    itemsPerPage: 200,
    searchQuery: "",
    isActive: "all",
  });

  const calendarEvents = useMemo(() => toCalendarEvents(appointments), [appointments]);
  const appCalendarEvents = useMemo(
    () => toAppCalendarAppointmentEvents(filterCalendarEvents(calendarEvents, filters)),
    [calendarEvents, filters],
  );
  const filteredEvents = useMemo(
    () =>
      filterCalendarEvents(calendarEvents, filters).sort(
        (first, second) => first.startAt.getTime() - second.startAt.getTime(),
      ),
    [calendarEvents, filters],
  );

  const venueNames = useMemo(
    () => venuesResponse?.data.map((venue) => venue.name) ?? [],
    [venuesResponse?.data],
  );

  const selectedEvent =
    filteredEvents.find((event) => event.id === selectedEventId) ??
    filteredEvents[0] ??
    null;

  const dateRangeOptions = useMemo(
    () => [
      { label: t("calendar.filters.allDates", { defaultValue: "All dates" }), value: "all" },
      { label: t("calendar.filters.today", { defaultValue: "Today" }), value: "today" },
      { label: t("calendar.filters.next7Days", { defaultValue: "Next 7 days" }), value: "7d" },
      { label: t("calendar.filters.next30Days", { defaultValue: "Next 30 days" }), value: "30d" },
    ],
    [t],
  );
  const venueOptions = useMemo(
    () =>
      buildFilterOptions(
        [...venueNames, ...calendarEvents.map((event) => event.venue)],
        t("calendar.filters.allVenues", { defaultValue: "All venues" }),
        false,
      ),
    [calendarEvents, t, venueNames],
  );
  const statusOptions = useMemo(
    () =>
      buildFilterOptions(
        calendarEvents.map((event) => event.status),
        t("calendar.filters.allStatuses", { defaultValue: "All statuses" }),
      ),
    [calendarEvents, t],
  );
  const coordinatorOptions = useMemo(
    () =>
      buildFilterOptions(
        calendarEvents.map((event) => event.coordinator),
        t("calendar.filters.allCoordinators", { defaultValue: "All coordinators" }),
        false,
      ),
    [calendarEvents, t],
  );
  const eventTypeOptions = useMemo(() => {
    const baseOptions = APPOINTMENT_TYPE_OPTIONS.map((item) => ({
      label: t(`appointments.typeOptions.${item.value}`, { defaultValue: item.label }),
      value: item.label,
    }));
    const knownValues = new Set(baseOptions.map((option) => option.value));
    const extraOptions = buildFilterOptions(
      calendarEvents.map((event) => event.eventType),
      t("calendar.filters.allEventTypes", { defaultValue: "All event types" }),
      false,
    ).filter((option) => !knownValues.has(option.value));

    return [...baseOptions, ...extraOptions];
  }, [calendarEvents, t]);

  const filteredVenueOptions = useMemo(
    () =>
      venueOptions.filter((option) =>
        option.label.toLowerCase().includes(venueSearch.trim().toLowerCase()),
      ),
    [venueOptions, venueSearch],
  );
  const filteredCoordinatorOptions = useMemo(
    () =>
      coordinatorOptions.filter((option) =>
        option.label.toLowerCase().includes(coordinatorSearch.trim().toLowerCase()),
      ),
    [coordinatorOptions, coordinatorSearch],
  );
  const filteredEventTypeOptions = useMemo(
    () =>
      eventTypeOptions.filter((option) =>
        option.label.toLowerCase().includes(eventTypeSearch.trim().toLowerCase()),
      ),
    [eventTypeOptions, eventTypeSearch],
  );

  const activeFiltersCount = [
    Boolean(filters.search.trim()),
    filters.dateRange !== "all",
    filters.venue !== "all",
    filters.status !== "all",
    filters.coordinator !== "all",
    filters.eventType !== "all",
  ].filter(Boolean).length;

  const calendarSummaries = useMemo(
    () => buildCalendarSummaries(calendarEvents, t),
    [calendarEvents, t],
  );

  const quickViewData = useMemo<EventQuickViewData | null>(() => {
    if (!selectedEvent) {
      return null;
    }

    return {
      eyebrow: t("calendar.quickView", { defaultValue: "Quick View" }),
      title: selectedEvent.title,
      subtitle: `${selectedEvent.clientName} • ${selectedEvent.bookingNumber}`,
      badges: (
        <>
          <StatusBadge status={selectedEvent.status} />
          <EventTypeBadge
            label={selectedEvent.eventType}
            accent={
              selectedEvent.status === "Confirmed"
                ? "emerald"
                : selectedEvent.status === "Pending"
                  ? "gold"
                  : selectedEvent.status === "Completed"
                    ? "blue"
                    : "rose"
            }
          />
        </>
      ),
      warning: selectedEvent.conflict
        ? t("calendar.availabilityWarning")
        : undefined,
      infoItems: [
        {
          label: t("common.date"),
          value: formatDateLabel(selectedEvent.startAt, "EEEE, dd MMM yyyy"),
          icon: CalendarClock,
        },
        {
          label: t("common.time"),
          value: `${formatTimeLabel(selectedEvent.startAt)} - ${formatTimeLabel(selectedEvent.endAt)}`,
          icon: CalendarClock,
        },
        {
          label: t("common.venue"),
          value: selectedEvent.venue,
          icon: MapPin,
        },
        {
          label: t("appointments.assignedTo", { defaultValue: "Assigned To" }),
          value: selectedEvent.coordinator,
          icon: UsersRound,
        },
        {
          label: t("appointments.meetingType", { defaultValue: "Meeting Type" }),
          value: selectedEvent.packageName,
          icon: NotebookText,
        },
        {
          label: t("appointments.guestCount", { defaultValue: "Guest Count" }),
          value: selectedEvent.guestCount ? String(selectedEvent.guestCount) : "-",
          icon: UsersRound,
        },
      ],
      notes: selectedEvent.notes,
      notesLabel: t("common.notes", { defaultValue: "Notes" }),
      actions: (
        <>
          <Button
            type="button"
            onClick={() =>
              selectedEvent.appointmentId &&
              navigate(`/appointments/${selectedEvent.appointmentId}`)
            }
          >
            {t("appointments.viewAppointment", { defaultValue: "View Appointment" })}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              selectedEvent.appointmentId &&
              navigate(`/appointments/edit/${selectedEvent.appointmentId}`)
            }
          >
            {t("common.edit", { defaultValue: "Edit" })}
          </Button>
        </>
      ),
    };
  }, [navigate, selectedEvent, t]);

  const legendItems = [
    { id: "confirmed", label: t("status.Confirmed", { defaultValue: "Confirmed" }), accent: "emerald" as const },
    { id: "pending", label: t("status.Pending", { defaultValue: "Pending" }), accent: "gold" as const },
    { id: "tentative", label: t("status.Tentative", { defaultValue: "Tentative" }), accent: "rose" as const },
    { id: "completed", label: t("status.Completed", { defaultValue: "Completed" }), accent: "blue" as const },
  ];

  return (
    <ProtectedComponent permission="appointments.calendar.read">
      <CrudPageLayout>
        <CrudPageHeader
          eyebrow={t("calendar.operations")}
          title={t("calendar.title")}
          description={t("calendar.filterToolbarDescription")}
          actions={
            <ProtectedComponent permission="appointments.create">
              <Button onClick={() => navigate("/appointments/create")}>
                <Plus className="h-4 w-4" />
                {t("appointments.create", { defaultValue: "Create Appointment" })}
              </Button>
            </ProtectedComponent>
          }
        />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {calendarSummaries.map((summary) => (
            <SummaryCard
              key={summary.id}
              label={summary.label}
              value={summary.value}
              hint={summary.detail}
            />
          ))}
        </section>

        <CalendarFilterBar
          title={t("common.filters", { defaultValue: "Filters" })}
          description={t("calendar.filterToolbarDescription")}
          actions={
            <>
              <CrudFilterPill
                label={t("calendar.activeFiltersCount", {
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
                onClick={() => setFilters(initialFilters)}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {t("calendar.clearFilters", { defaultValue: "Clear Filters" })}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-9 rounded-xl px-2.5 text-[12px]"
                onClick={() => setFiltersOpen((current) => !current)}
              >
                {filtersOpen ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
                {filtersOpen
                  ? t("calendar.hideFilters", { defaultValue: "Hide Filters" })
                  : t("calendar.showFilters", { defaultValue: "Show Filters" })}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            {activeFiltersCount > 0 ? (
              <div
                className="flex min-h-[28px] flex-wrap items-center gap-1.5 border-t pt-3"
                style={{ borderColor: "var(--lux-row-border)" }}
              >
                {filters.search.trim() ? <CrudFilterPill label={filters.search.trim()} /> : null}
                {filters.dateRange !== "all" ? (
                  <CrudFilterPill
                    label={dateRangeOptions.find((option) => option.value === filters.dateRange)?.label || filters.dateRange}
                  />
                ) : null}
                {filters.venue !== "all" ? <CrudFilterPill label={filters.venue} /> : null}
                {filters.status !== "all" ? <CrudFilterPill label={filters.status} /> : null}
                {filters.coordinator !== "all" ? (
                  <CrudFilterPill label={filters.coordinator} />
                ) : null}
                {filters.eventType !== "all" ? (
                  <CrudFilterPill
                    label={eventTypeOptions.find((option) => option.value === filters.eventType)?.label || filters.eventType}
                  />
                ) : null}
              </div>
            ) : null}

            <AnimatePresence initial={false}>
              {filtersOpen ? (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div
                    className="grid gap-3 border-t pt-4 xl:grid-cols-12"
                    style={{ borderColor: "var(--lux-row-border)" }}
                  >
                    <div
                      className="space-y-3 rounded-2xl border p-3 xl:col-span-8"
                      style={{
                        borderColor: "var(--lux-row-border)",
                        background: "var(--lux-control-hover)",
                      }}
                    >
                      <div className="crud-form-grid md:grid-cols-2">
                        <CrudFilterField label={t("common.searchAnything", { defaultValue: "Search" })}>
                          <input
                            className="app-native-select h-10 rounded-xl text-[13px]"
                            placeholder={t("common.searchCustomerOrBooking")}
                            value={filters.search}
                            onChange={(event) =>
                              setFilters((current) => ({
                                ...current,
                                search: event.target.value,
                              }))
                            }
                          />
                        </CrudFilterField>

                        <CrudFilterField label={t("calendar.fields.venue")}>
                          <SearchableFilterSelect
                            value={filters.venue}
                            onValueChange={(value) =>
                              setFilters((current) => ({ ...current, venue: value }))
                            }
                            onSearch={setVenueSearch}
                            placeholder={t("calendar.filters.allVenues", {
                              defaultValue: "All venues",
                            })}
                            searchPlaceholder={t("calendar.searchVenue", {
                              defaultValue: "Search venues...",
                            })}
                          >
                            {filteredVenueOptions.length === 0 ? (
                              <SearchableSelectEmpty
                                message={t("common.noResultsTitle", {
                                  defaultValue: "No results found",
                                })}
                              />
                            ) : (
                              filteredVenueOptions.map((option) => (
                                <SearchableSelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SearchableSelectItem>
                              ))
                            )}
                          </SearchableFilterSelect>
                        </CrudFilterField>

                        <CrudFilterField label={t("calendar.fields.coordinator")}>
                          <SearchableFilterSelect
                            value={filters.coordinator}
                            onValueChange={(value) =>
                              setFilters((current) => ({ ...current, coordinator: value }))
                            }
                            onSearch={setCoordinatorSearch}
                            placeholder={t("calendar.filters.allCoordinators", {
                              defaultValue: "All coordinators",
                            })}
                            searchPlaceholder={t("calendar.searchCoordinator", {
                              defaultValue: "Search coordinators...",
                            })}
                          >
                            {filteredCoordinatorOptions.length === 0 ? (
                              <SearchableSelectEmpty
                                message={t("common.noResultsTitle", {
                                  defaultValue: "No results found",
                                })}
                              />
                            ) : (
                              filteredCoordinatorOptions.map((option) => (
                                <SearchableSelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SearchableSelectItem>
                              ))
                            )}
                          </SearchableFilterSelect>
                        </CrudFilterField>

                        <CrudFilterField label={t("calendar.fields.eventType")}>
                          <SearchableFilterSelect
                            value={filters.eventType}
                            onValueChange={(value) =>
                              setFilters((current) => ({ ...current, eventType: value }))
                            }
                            onSearch={setEventTypeSearch}
                            placeholder={t("calendar.filters.allEventTypes", {
                              defaultValue: "All event types",
                            })}
                            searchPlaceholder={t("calendar.searchEventType", {
                              defaultValue: "Search event types...",
                            })}
                          >
                            {filteredEventTypeOptions.length === 0 ? (
                              <SearchableSelectEmpty
                                message={t("common.noResultsTitle", {
                                  defaultValue: "No results found",
                                })}
                              />
                            ) : (
                              filteredEventTypeOptions.map((option) => (
                                <SearchableSelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SearchableSelectItem>
                              ))
                            )}
                          </SearchableFilterSelect>
                        </CrudFilterField>
                      </div>
                    </div>

                    <div
                      className="space-y-3 rounded-2xl border p-3 xl:col-span-4"
                      style={{
                        borderColor: "var(--lux-row-border)",
                        background: "var(--lux-control-hover)",
                      }}
                    >
                      <div className="crud-form-grid">
                        <CrudFilterField label={t("calendar.fields.dateRange")}>
                          <select
                            className="app-native-select h-10 rounded-xl text-[13px]"
                            value={filters.dateRange}
                            onChange={(event) =>
                              setFilters((current) => ({
                                ...current,
                                dateRange: event.target.value,
                              }))
                            }
                          >
                            {dateRangeOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </CrudFilterField>

                        <CrudFilterField label={t("calendar.fields.status")}>
                          <select
                            className="app-native-select h-10 rounded-xl text-[13px]"
                            value={filters.status}
                            onChange={(event) =>
                              setFilters((current) => ({
                                ...current,
                                status: event.target.value,
                              }))
                            }
                          >
                            {statusOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </CrudFilterField>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </CalendarFilterBar>

        <section className="grid gap-6 2xl:grid-cols-12">
          <div className="space-y-6 2xl:col-span-8">
            <AppCalendar
              locale={i18n.language === "ar" ? "ar" : "en"}
              events={appCalendarEvents}
              loading={isLoading}
              legends={legendItems}
              emptyTitle={t("calendar.emptyTitle", { defaultValue: "No appointments found" })}
              emptyDescription={t("calendar.emptyDescription", {
                defaultValue: "Try another date range or remove some filters.",
              })}
              onRangeChange={setCalendarRange}
              onEventSelect={(event) => {
                setSelectedEventId(event.id);
                setDetailsDialogOpen(true);
              }}
              onDateSelect={(date) =>
                navigate(`/appointments/create?date=${format(date, "yyyy-MM-dd")}`)
              }
            />
          </div>

          <div className="space-y-6 2xl:col-span-4">
            <EventQuickViewCard
              data={quickViewData}
              emptyTitle={t("calendar.selectBooking")}
              emptyDescription={t("calendar.selectBookingDescription")}
            />
          </div>
        </section>

        <EventDetailsDialog
          open={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
          title={t("calendar.quickView", { defaultValue: "Quick View" })}
          description={t("calendar.selectBookingDescription")}
          data={quickViewData}
          emptyTitle={t("calendar.selectBooking")}
          emptyDescription={t("calendar.selectBookingDescription")}
        />
      </CrudPageLayout>
    </ProtectedComponent>
  );
}

function buildFilterOptions(
  values: string[],
  allLabel: string,
  includeAllOption = true,
) {
  const options = Array.from(new Set(values.filter((value) => value && value !== "-")))
    .map((value) => ({
      label: value,
      value,
    }))
    .sort((left, right) => left.label.localeCompare(right.label));

  return [
    ...(includeAllOption ? [{ label: allLabel, value: "all" }] : []),
    ...options,
  ];
}

function SearchableFilterSelect({
  value,
  onValueChange,
  onSearch,
  placeholder,
  searchPlaceholder,
  children,
}: {
  value: string;
  onValueChange: (value: string) => void;
  onSearch: (value: string) => void;
  placeholder: string;
  searchPlaceholder: string;
  children: ReactNode;
}) {
  return (
    <SearchableSelect
      value={value || FILTER_EMPTY_VALUE}
      onValueChange={(nextValue) =>
        onValueChange(nextValue === FILTER_EMPTY_VALUE ? "all" : nextValue)
      }
      onSearch={onSearch}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      emptyMessage="No results found"
      allowClear={value !== "all"}
      onClear={() => onValueChange("all")}
      triggerClassName="app-native-select h-10 rounded-xl px-3 text-[13px]"
      size="default"
    >
      <SearchableSelectItem value={FILTER_EMPTY_VALUE}>
        {placeholder}
      </SearchableSelectItem>
      {children}
    </SearchableSelect>
  );
}

function buildCalendarSummaries(
  events: CalendarEvent[],
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  const today = new Date();
  const todayKey = format(today, "yyyy-MM-dd");
  const weekEnd = addDays(today, 6);
  const confirmedCount = events.filter((event) => event.status === "Confirmed").length;
  const pendingCount = events.filter((event) =>
    ["Pending", "Tentative"].includes(event.status),
  ).length;

  return [
    {
      id: "todayAppointments",
      label: t("calendar.summary.todayBookings", {
        defaultValue: "Today appointments",
      }),
      detail: t("calendar.summary.todayBookingsDetail", {
        defaultValue: "Appointments scheduled for today.",
      }),
      value: String(events.filter((event) => format(event.startAt, "yyyy-MM-dd") === todayKey).length),
    },
    {
      id: "weekAppointments",
      label: t("calendar.summary.thisWeekEvents", { defaultValue: "This week" }),
      detail: t("calendar.summary.thisWeekEventsDetail", {
        defaultValue: "Appointments scheduled over the next seven days.",
      }),
      value: String(
        events.filter((event) => event.startAt >= today && event.startAt <= weekEnd).length,
      ),
    },
    {
      id: "confirmedAppointments",
      label: t("calendar.summary.confirmed", { defaultValue: "Confirmed" }),
      detail: t("calendar.summary.confirmedDetail", {
        defaultValue: "Appointments already confirmed with clients.",
      }),
      value: String(confirmedCount),
    },
    {
      id: "pendingAppointments",
      label: t("calendar.summary.pendingConfirmations", {
        defaultValue: "Pending confirmations",
      }),
      detail: t("calendar.summary.pendingConfirmationsDetail", {
        defaultValue: "Scheduled or tentative appointments awaiting follow-up.",
      }),
      value: String(pendingCount),
    },
  ];
}
