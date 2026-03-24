import { addDays, endOfMonth, endOfWeek, format, startOfMonth, startOfWeek } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarClock,
  ChevronDown,
  ChevronUp,
  MapPin,
  Plus,
  RotateCcw,
  UserRound,
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
import { CrudFilterField, CrudFilterPill, CrudPageHeader, CrudPageLayout } from "@/components/shared/crud-layout";
import { DataTableShell } from "@/components/shared/data-table-shell";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/ui/confirmDialog";
import { DataTable } from "@/components/ui/data-table";
import {
  SearchableSelect,
  SearchableSelectEmpty,
  SearchableSelectItem,
} from "@/components/ui/searchable-select";
import { toAppCalendarEventEntries } from "@/features/calendar/app-calendar-adapters";
import { useCustomers } from "@/hooks/customers/useCustomers";
import { useDeleteEvent } from "@/hooks/events/useDeleteEvent";
import { useEvents } from "@/hooks/events/useEvents";
import { useVenues } from "@/hooks/venues/useVenues";
import { formatDateLabel } from "@/lib/utils";

import {
  EVENT_STATUS_OPTIONS,
  getEventDisplayTitle,
  toTableEvents,
  type TableEvent,
} from "./adapters";
import { EventStatusBadge } from "./_components/eventStatusBadge";
import { useEventsColumns } from "./_components/eventsColumns";
import type { Event, EventStatus } from "./types";
import type { AppCalendarRange } from "@/components/calendar/types";

type DisplayMode = "calendar" | "table";

type FiltersState = {
  search: string;
  dateRange: string;
  status: "all" | EventStatus;
  customerId: string;
  venueId: string;
};

const initialFilters: FiltersState = {
  search: "",
  dateRange: "all",
  status: "all",
  customerId: "all",
  venueId: "all",
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

const EventsPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [displayMode, setDisplayMode] = useState<DisplayMode>("calendar");
  const [filters, setFilters] = useState<FiltersState>(initialFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [venueSearch, setVenueSearch] = useState("");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Event | null>(null);
  const [calendarRange, setCalendarRange] = useState<AppCalendarRange>(getInitialRange);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const { data: raw, isLoading } = useEvents({
    currentPage: 1,
    itemsPerPage: 1000,
    searchQuery: "",
    status: "all",
    customerId: "",
    venueId: "",
    dateFrom: format(calendarRange.start, "yyyy-MM-dd"),
    dateTo: format(addDays(calendarRange.end, -1), "yyyy-MM-dd"),
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
  const { data: venuesResponse } = useVenues({
    currentPage: 1,
    itemsPerPage: 200,
    searchQuery: "",
    isActive: "all",
  });

  const events = raw?.data ?? [];
  const customers = customersResponse?.data ?? [];
  const venues = venuesResponse?.data ?? [];

  const filteredEvents = useMemo(
    () => filterEvents(events, filters),
    [events, filters],
  );
  const calendarEvents = useMemo(
    () => toAppCalendarEventEntries(filteredEvents),
    [filteredEvents],
  );
  const selectedEvent =
    filteredEvents.find((event) => String(event.id) === selectedEventId) ??
    filteredEvents[0] ??
    null;
  const activeFiltersCount = [
    Boolean(filters.search.trim()),
    filters.dateRange !== "all",
    filters.status !== "all",
    filters.customerId !== "all",
    filters.venueId !== "all",
  ].filter(Boolean).length;

  const tableEvents = useMemo(
    () => toTableEvents({ data: filteredEvents, meta: raw?.meta ?? { total: filteredEvents.length, page: 1, limit: 1000, pages: 1 } }).data.events,
    [filteredEvents, raw?.meta],
  );

  const deleteMutation = useDeleteEvent();
  const columns = useEventsColumns({
    onDelete: (event: TableEvent) => setDeleteCandidate(event),
    editPermission: "events.update",
    deletePermission: "events.delete",
  });

  const customerOptions = useMemo(
    () =>
      customers
        .filter((item) =>
          item.fullName.toLowerCase().includes(customerSearch.toLowerCase()),
        )
        .map((item) => ({ value: String(item.id), label: item.fullName })),
    [customerSearch, customers],
  );
  const venueOptions = useMemo(
    () =>
      venues
        .filter((item) =>
          item.name.toLowerCase().includes(venueSearch.toLowerCase()),
        )
        .map((item) => ({ value: String(item.id), label: item.name })),
    [venueSearch, venues],
  );

  const overviewCards = useMemo(
    () => [
      {
        id: "total",
        label: t("events.filteredEvents", { defaultValue: "Filtered Events" }),
        value: String(filteredEvents.length),
        hint: t("events.filteredEventsCount", {
          count: filteredEvents.length,
          defaultValue:
            filteredEvents.length === 1
              ? "1 event matches the current filters."
              : `${filteredEvents.length} events match the current filters.`,
        }),
      },
      {
        id: "confirmed",
        label: t("events.status.confirmed", { defaultValue: "Confirmed" }),
        value: String(filteredEvents.filter((event) => event.status === "confirmed").length),
        hint: t("events.confirmedHint", {
          defaultValue: "Confirmed events in the current calendar window.",
        }),
      },
      {
        id: "designing",
        label: t("events.status.designing", { defaultValue: "Designing" }),
        value: String(filteredEvents.filter((event) => event.status === "designing").length),
        hint: t("events.designingHint", {
          defaultValue: "Events currently in design preparation.",
        }),
      },
      {
        id: "completed",
        label: t("events.status.completed", { defaultValue: "Completed" }),
        value: String(filteredEvents.filter((event) => event.status === "completed").length),
        hint: t("events.completedHint", {
          defaultValue: "Completed events in this visible range.",
        }),
      },
    ],
    [filteredEvents, t],
  );

  const quickViewData = useMemo<EventQuickViewData | null>(() => {
    if (!selectedEvent) {
      return null;
    }

    const venueDisplay =
      selectedEvent.venue?.name ||
      selectedEvent.venueNameSnapshot ||
      selectedEvent.venueId?.toString() ||
      "-";

    return {
      eyebrow: t("events.quickView", { defaultValue: "Quick View" }),
      title: getEventDisplayTitle(selectedEvent),
      subtitle:
        selectedEvent.customer?.fullName ||
        [selectedEvent.groomName, selectedEvent.brideName].filter(Boolean).join(" / ") ||
        "-",
      badges: (
        <>
          <EventStatusBadge status={selectedEvent.status} />
          <EventTypeBadge
            label={t("events.calendarType", { defaultValue: "Event" })}
            accent={
              selectedEvent.status === "confirmed"
                ? "emerald"
                : selectedEvent.status === "completed"
                  ? "gold"
                  : selectedEvent.status === "in_progress"
                    ? "blue"
                    : selectedEvent.status === "cancelled"
                      ? "rose"
                      : "slate"
            }
          />
        </>
      ),
      infoItems: [
        {
          label: t("events.eventDate", { defaultValue: "Event Date" }),
          value: formatDateLabel(new Date(selectedEvent.eventDate), "EEEE, dd MMM yyyy"),
          icon: CalendarClock,
        },
        {
          label: t("common.venue", { defaultValue: "Venue" }),
          value: venueDisplay,
          icon: MapPin,
        },
        {
          label: t("events.partyNames", { defaultValue: "Party Names" }),
          value:
            [selectedEvent.groomName, selectedEvent.brideName].filter(Boolean).join(" / ") ||
            "-",
          icon: UsersRound,
        },
        {
          label: t("events.customer", { defaultValue: "Customer" }),
          value: selectedEvent.customer?.fullName || "-",
          icon: UserRound,
        },
      ],
      notes: selectedEvent.notes || t("events.noNotes", { defaultValue: "No notes added." }),
      notesLabel: t("common.notes", { defaultValue: "Notes" }),
      actions: (
        <>
          <Button type="button" onClick={() => navigate(`/events/${selectedEvent.id}`)}>
            {t("events.viewEvent", { defaultValue: "View Event" })}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(`/events/edit/${selectedEvent.id}`)}
          >
            {t("common.edit", { defaultValue: "Edit" })}
          </Button>
        </>
      ),
    };
  }, [navigate, selectedEvent, t]);

  const legendItems = [
    { id: "draft", label: t("events.status.draft", { defaultValue: "Draft" }), accent: "slate" as const },
    { id: "designing", label: t("events.status.designing", { defaultValue: "Designing" }), accent: "rose" as const },
    { id: "confirmed", label: t("events.status.confirmed", { defaultValue: "Confirmed" }), accent: "emerald" as const },
    { id: "completed", label: t("events.status.completed", { defaultValue: "Completed" }), accent: "gold" as const },
  ];

  return (
    <ProtectedComponent permission="events.read">
      <CrudPageLayout>
        <CrudPageHeader
          eyebrow={t("events.operations", { defaultValue: "Event Planning" })}
          title={t("events.calendarTitle", { defaultValue: "Events Calendar" })}
          description={t("events.calendarFiltersHint", {
            defaultValue:
              "Track event schedules, review conflicts, and switch between calendar and table views.",
          })}
          actions={
            <>
              <div
                className="inline-flex rounded-2xl border p-1"
                style={{
                  background: "var(--lux-control-surface)",
                  borderColor: "var(--lux-control-border)",
                }}
              >
                {(["calendar", "table"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className="rounded-xl px-4 py-2 text-sm font-semibold transition"
                    style={
                      displayMode === mode
                        ? {
                            background: "var(--lux-primary-surface)",
                            color: "var(--lux-primary-text)",
                          }
                        : {
                            color: "var(--lux-text-secondary)",
                          }
                    }
                    onClick={() => setDisplayMode(mode)}
                  >
                    {mode === "calendar"
                      ? t("events.calendarView", { defaultValue: "Calendar" })
                      : t("events.tableView", { defaultValue: "Table" })}
                  </button>
                ))}
              </div>
              <ProtectedComponent permission="events.create">
                <Button onClick={() => navigate("/events/create")}>
                  <Plus className="h-4 w-4" />
                  {t("events.create", { defaultValue: "Create Event" })}
                </Button>
              </ProtectedComponent>
            </>
          }
        />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {overviewCards.map((card) => (
            <SummaryCard key={card.id} label={card.label} value={card.value} hint={card.hint} />
          ))}
        </section>

        <CalendarFilterBar
          title={t("common.filters", { defaultValue: "Filters" })}
          description={t("events.calendarFiltersHint", {
            defaultValue: "Filter by status, linked records, venue, and date range.",
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
                onClick={() => setFilters(initialFilters)}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {t("events.clearFilters", { defaultValue: "Clear Filters" })}
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
                  ? t("events.hideFilters", { defaultValue: "Hide Filters" })
                  : t("events.showFilters", { defaultValue: "Show Filters" })}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
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
                        <CrudFilterField
                          label={t("common.searchAnything", { defaultValue: "Search" })}
                        >
                          <input
                            className="app-native-select h-10 rounded-xl text-[13px]"
                            placeholder={t("events.searchPlaceholder", {
                              defaultValue:
                                "Search by title, party names, venue, or customer...",
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
                                status: event.target.value as "all" | EventStatus,
                              }))
                            }
                          >
                            <option value="all">
                              {t("events.allStatuses", { defaultValue: "All Statuses" })}
                            </option>
                            {EVENT_STATUS_OPTIONS.map((status) => (
                              <option key={status.value} value={status.value}>
                                {t(`events.status.${status.value}`, {
                                  defaultValue: status.label,
                                })}
                              </option>
                            ))}
                          </select>
                        </CrudFilterField>

                        <CrudFilterField
                          label={t("events.customer", { defaultValue: "Customer" })}
                        >
                          <SearchableFilterSelect
                            value={filters.customerId}
                            onValueChange={(value) =>
                              setFilters((current) => ({ ...current, customerId: value }))
                            }
                            onSearch={setCustomerSearch}
                            placeholder={t("events.allCustomers", { defaultValue: "All Customers" })}
                            searchPlaceholder={t("events.searchCustomers", {
                              defaultValue: "Search customers...",
                            })}
                          >
                            {customerOptions.length === 0 ? (
                              <SearchableSelectEmpty
                                message={t("common.noResultsTitle", {
                                  defaultValue: "No results found",
                                })}
                              />
                            ) : (
                              customerOptions.map((option) => (
                                <SearchableSelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SearchableSelectItem>
                              ))
                            )}
                          </SearchableFilterSelect>
                        </CrudFilterField>

                        <CrudFilterField
                          label={t("common.venue", { defaultValue: "Venue" })}
                        >
                          <SearchableFilterSelect
                            value={filters.venueId}
                            onValueChange={(value) =>
                              setFilters((current) => ({ ...current, venueId: value }))
                            }
                            onSearch={setVenueSearch}
                            placeholder={t("events.allVenues", { defaultValue: "All Venues" })}
                            searchPlaceholder={t("events.searchVenues", {
                              defaultValue: "Search venues...",
                            })}
                          >
                            {venueOptions.length === 0 ? (
                              <SearchableSelectEmpty
                                message={t("common.noResultsTitle", {
                                  defaultValue: "No results found",
                                })}
                              />
                            ) : (
                              venueOptions.map((option) => (
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
                        <CrudFilterField
                          label={t("events.dateRange", { defaultValue: "Date Range" })}
                        >
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
                            <option value="all">{t("events.filters.allDates", { defaultValue: "All dates" })}</option>
                            <option value="today">{t("events.filters.today", { defaultValue: "Today" })}</option>
                            <option value="7d">{t("events.filters.next7Days", { defaultValue: "Next 7 days" })}</option>
                            <option value="30d">{t("events.filters.next30Days", { defaultValue: "Next 30 days" })}</option>
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

        {displayMode === "calendar" ? (
          <section className="grid gap-6 2xl:grid-cols-12">
            <div className="space-y-6 2xl:col-span-8">
              <AppCalendar
                locale={i18n.language === "ar" ? "ar" : "en"}
                events={calendarEvents}
                loading={isLoading}
                legends={legendItems}
                emptyTitle={t("events.emptyCalendarTitle", {
                  defaultValue: "No events found",
                })}
                emptyDescription={t("events.emptyCalendarDescription", {
                  defaultValue:
                    "Try expanding the date range or clearing the current filters.",
                })}
                onRangeChange={setCalendarRange}
                onEventSelect={(calendarEvent) => {
                  setSelectedEventId(calendarEvent.id);
                  setDetailsDialogOpen(true);
                }}
                onDateSelect={(date) =>
                  navigate(`/events/create?date=${format(date, "yyyy-MM-dd")}`)
                }
              />
            </div>

            <div className="space-y-6 2xl:col-span-4">
              <EventQuickViewCard
                data={quickViewData}
                emptyTitle={t("events.selectEvent", { defaultValue: "Select an event" })}
                emptyDescription={t("events.selectEventDescription", {
                  defaultValue:
                    "Choose an event from the calendar to review its details.",
                })}
              />
            </div>
          </section>
        ) : (
          <DataTableShell
            title={t("events.filteredEvents", { defaultValue: "Filtered Events" })}
            totalItems={tableEvents.length}
            currentCount={tableEvents.length}
            entityName={t("events.title", { defaultValue: "Events" })}
            itemsPerPage={tableEvents.length || 1}
            setItemsPerPage={() => undefined}
            setCurrentPage={() => undefined}
            showMeta
          >
            <DataTable
              columns={columns}
              data={tableEvents}
              rowNumberStart={1}
              enableRowNumbers
              fileName="events"
              isLoading={isLoading}
            />
          </DataTableShell>
        )}

        <ConfirmDialog
          open={deleteCandidate !== null}
          onOpenChange={(open) => !open && setDeleteCandidate(null)}
          title={t("events.deleteTitle", { defaultValue: "Delete Event" })}
          message={t("events.deleteMessage", {
            defaultValue: "Are you sure you want to delete this event?",
          })}
          confirmLabel={t("common.delete", { defaultValue: "Delete" })}
          cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
          onConfirm={() =>
            deleteCandidate &&
            deleteMutation.mutate(deleteCandidate.id, {
              onSettled: () => setDeleteCandidate(null),
            })
          }
          isPending={deleteMutation.isPending}
        />

        <EventDetailsDialog
          open={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
          title={t("events.quickView", { defaultValue: "Quick View" })}
          description={t("events.selectEventDescription", {
            defaultValue: "Choose an event from the calendar to review its details.",
          })}
          data={quickViewData}
          emptyTitle={t("events.selectEvent", { defaultValue: "Select an event" })}
          emptyDescription={t("events.selectEventDescription", {
            defaultValue: "Choose an event from the calendar to review its details.",
          })}
        />
      </CrudPageLayout>
    </ProtectedComponent>
  );
};

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
      value={value === "all" ? FILTER_EMPTY_VALUE : value}
      onValueChange={(next) =>
        onValueChange(next === FILTER_EMPTY_VALUE ? "all" : next)
      }
      onSearch={onSearch}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      emptyMessage="No results found"
      allowClear={value !== "all"}
      onClear={() => onValueChange("all")}
      triggerClassName="app-native-select h-10 rounded-xl px-3 text-[13px]"
    >
      <SearchableSelectItem value={FILTER_EMPTY_VALUE}>
        {placeholder}
      </SearchableSelectItem>
      {children}
    </SearchableSelect>
  );
}

function filterEvents(events: Event[], filters: FiltersState) {
  const search = filters.search.trim().toLowerCase();
  const today = new Date();

  return events.filter((event) => {
    const venueDisplay =
      event.venue?.name || event.venueNameSnapshot || event.venueId?.toString() || "-";
    const customerDisplay = event.customer?.fullName || "-";

    if (search) {
      const haystack = [
        getEventDisplayTitle(event),
        event.groomName,
        event.brideName,
        venueDisplay,
        customerDisplay,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(search)) {
        return false;
      }
    }

    if (filters.status !== "all" && event.status !== filters.status) {
      return false;
    }

    if (filters.customerId !== "all" && String(event.customerId || "") !== filters.customerId) {
      return false;
    }

    if (filters.venueId !== "all" && String(event.venueId || "") !== filters.venueId) {
      return false;
    }

    const eventDate = new Date(`${event.eventDate}T12:00:00`);

    if (filters.dateRange === "today") {
      return format(eventDate, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");
    }

    if (filters.dateRange === "7d") {
      const end = addDays(today, 6);
      return eventDate >= today && eventDate <= end;
    }

    if (filters.dateRange === "30d") {
      const end = addDays(today, 29);
      return eventDate >= today && eventDate <= end;
    }

    return true;
  });
}

export default EventsPage;
