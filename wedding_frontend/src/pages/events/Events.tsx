import {
  addDays,
  addMonths,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isWithinInterval,
  startOfDay,
  startOfMonth,
  startOfToday,
  startOfWeek,
  subMonths,
} from "date-fns";
import {
  CalendarClock,
  CalendarRange,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  FileText,
  Filter,
  MapPin,
  Plus,
  RotateCcw,
  Trash2,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { PageContainer } from "@/components/layout/page-container";
import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import { SearchInput } from "@/components/shared/search-input";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/ui/confirmDialog";
import { DataTable } from "@/components/ui/data-table";
import { Separator } from "@/components/ui/separator";
import {
  SearchableSelect,
  SearchableSelectEmpty,
  SearchableSelectItem,
} from "@/components/ui/searchable-select";
import {
  buildMonthGrid,
  isCalendarDayMuted,
} from "@/features/calendar/calendar-helpers";
import { useCustomers } from "@/hooks/customers/useCustomers";
import { useDeleteEvent } from "@/hooks/events/useDeleteEvent";
import { useEvents } from "@/hooks/events/useEvents";
import { useVenues } from "@/hooks/venues/useVenues";
import { cn, formatDateLabel, formatLocalized } from "@/lib/utils";

import {
  EVENT_STATUS_OPTIONS,
  getEventDisplayTitle,
  toTableEvents,
  type TableEvent,
} from "./adapters";
import { useEventsColumns } from "./_components/eventsColumns";
import { EventStatusBadge } from "./_components/eventStatusBadge";
import type { EventStatus } from "./types";

type EventsViewMode = "calendar" | "table";
type DeleteCandidate = {
  eventId: number;
};

type FiltersState = {
  search: string;
  dateRange: string;
  status: "all" | EventStatus;
  customerId: string;
  venueId: string;
};

type CalendarEventItem = {
  id: string;
  eventId: number;
  title: string;
  eventDate: Date;
  venue: string;
  venueId: string;
  customerId: string;
  customerName: string;
  partyNames: string;
  contractNumber: string;
  notes: string;
  status: EventStatus;
  conflict: boolean;
};

const FILTER_EMPTY_VALUE = "__all__";
const filterFieldClassName =
  "h-10 rounded-xl border px-3 text-[13px] text-[var(--lux-text)] outline-none transition focus:border-[var(--lux-gold-border)]";
const fieldStyle = {
  background: "var(--lux-control-surface)",
  borderColor: "var(--lux-control-border)",
} as const;
const initialFilters: FiltersState = {
  search: "",
  dateRange: "all",
  status: "all",
  customerId: "all",
  venueId: "all",
};

const EventsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<EventsViewMode>("calendar");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filters, setFilters] = useState(initialFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [venueSearch, setVenueSearch] = useState("");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<DeleteCandidate | null>(
    null,
  );

  const { data: raw, isLoading } = useEvents({
    currentPage: 1,
    itemsPerPage: 1000,
    searchQuery: "",
    status: "all",
    customerId: "",
    venueId: "",
    dateFrom: format(
      startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 }),
      "yyyy-MM-dd",
    ),
    dateTo: format(
      endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 }),
      "yyyy-MM-dd",
    ),
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

  const customers = customersResponse?.data ?? [];
  const venues = venuesResponse?.data ?? [];
  const calendarEvents = useMemo(() => {
    const items = (raw?.data ?? [])
      .sort((a, b) => a.eventDate.localeCompare(b.eventDate) || a.id - b.id)
      .map<CalendarEventItem>((event) => ({
        id: String(event.id),
        eventId: event.id,
        title: getEventDisplayTitle(event),
        eventDate: new Date(`${event.eventDate}T12:00:00`),
        venue:
          event.venue?.name ||
          event.venueNameSnapshot ||
          event.venueId?.toString() ||
          "-",
        venueId: event.venueId ? String(event.venueId) : "",
        customerId: event.customerId ? String(event.customerId) : "",
        customerName: event.customer?.fullName || "-",
        partyNames:
          [event.groomName, event.brideName].filter(Boolean).join(" / ") || "-",
        contractNumber:
          event.contractNumber?.trim() ||
          `EVT-${String(event.id).padStart(4, "0")}`,
        notes: event.notes?.trim() || "No notes added.",
        status: event.status,
        conflict: false,
      }));

    return items.map((item) => ({
      ...item,
      conflict: items.some(
        (candidate) =>
          candidate.id !== item.id &&
          candidate.venue === item.venue &&
          candidate.venue !== "-" &&
          isSameDay(candidate.eventDate, item.eventDate),
      ),
    }));
  }, [raw?.data]);
  const filteredEvents = useMemo(
    () => filterEvents(calendarEvents, filters),
    [calendarEvents, filters],
  );
  const filteredEventIds = useMemo(
    () => new Set(filteredEvents.map((event) => event.id)),
    [filteredEvents],
  );
  const tableEvents = useMemo(
    () =>
      toTableEvents(raw).data.events.filter((event) =>
        filteredEventIds.has(String(event.id)),
      ),
    [filteredEventIds, raw],
  );
  const selectedEvent =
    filteredEvents.find((event) => event.id === selectedEventId) ??
    filteredEvents[0] ??
    null;
  const visibleDays = useMemo(
    () => getVisibleDays(filters.dateRange),
    [filters.dateRange],
  );
  const activeFiltersCount = [
    Boolean(filters.search.trim()),
    filters.dateRange !== "all",
    filters.status !== "all",
    filters.customerId !== "all",
    filters.venueId !== "all",
  ].filter(Boolean).length;
  const deleteMutation = useDeleteEvent();
  const columns = useEventsColumns({
    onDelete: (event: TableEvent) => setDeleteCandidate({ eventId: event.id }),
    editPermission: "events.update",
    deletePermission: "events.delete",
  });

  return (
    <ProtectedComponent permission="events.read">
      <PageContainer>
        <section className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--lux-gold)]">
              {t("events.operations", { defaultValue: "Event Planning" })}
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-[var(--lux-heading)] md:text-3xl">
              {t("events.calendarTitle", { defaultValue: "Events Calendar" })}
            </h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div
              className="inline-flex rounded-2xl border p-1"
              style={{
                background: "var(--lux-control-surface)",
                borderColor: "var(--lux-control-border)",
              }}
            >
              <button
                type="button"
                className={cn(
                  "rounded-xl px-4 py-2 text-sm font-semibold text-[var(--lux-text-secondary)] transition",
                  viewMode === "calendar" && "text-[var(--lux-text)]",
                )}
                style={
                  viewMode === "calendar"
                    ? { background: "var(--lux-control-hover)" }
                    : undefined
                }
                onClick={() => setViewMode("calendar")}
              >
                <span className="flex items-center gap-2">
                  <CalendarRange className="h-4 w-4" />
                  {t("events.calendarView", { defaultValue: "Calendar" })}
                </span>
              </button>
              <button
                type="button"
                className={cn(
                  "rounded-xl px-4 py-2 text-sm font-semibold text-[var(--lux-text-secondary)] transition",
                  viewMode === "table" && "text-[var(--lux-text)]",
                )}
                style={
                  viewMode === "table"
                    ? { background: "var(--lux-control-hover)" }
                    : undefined
                }
                onClick={() => setViewMode("table")}
              >
                {t("events.tableView", { defaultValue: "Table" })}
              </button>
            </div>

            <ProtectedComponent permission="events.create">
              <Button onClick={() => navigate("/events/create")}>
                <Plus className="h-4 w-4" />
                {t("events.create", { defaultValue: "Create Event" })}
              </Button>
            </ProtectedComponent>
          </div>
        </section>

        <SectionCard className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-[var(--lux-gold)]">
                <Filter className="h-3.5 w-3.5" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">
                  {t("common.filters", { defaultValue: "Filters" })}
                </p>
              </div>
              <p className="text-xs leading-5 text-[var(--lux-text-secondary)]">
                {t("events.calendarFiltersHint", {
                  defaultValue:
                    "Filter by status, linked records, venue, and date range.",
                })}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
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
            </div>
          </div>

          {filtersOpen ? (
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
                <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                  <FilterField label={t("common.searchAnything", { defaultValue: "Search" })}>
                    <SearchInput
                      placeholder={t("events.searchPlaceholder", {
                        defaultValue:
                          "Search by title, contract, party names, or venue...",
                      })}
                      value={filters.search}
                      onChange={(value) =>
                        setFilters((current) => ({ ...current, search: value }))
                      }
                      inputClassName="h-10 rounded-xl text-[13px]"
                    />
                  </FilterField>
                  <FilterField label={t("events.statusLabel", { defaultValue: "Status" })}>
                    <select
                      className={filterFieldClassName}
                      style={fieldStyle}
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
                  </FilterField>
                  <SelectField
                    label={t("events.customer", { defaultValue: "Customer" })}
                    value={filters.customerId}
                    options={customers
                      .filter((item) =>
                        item.fullName.toLowerCase().includes(customerSearch.toLowerCase()),
                      )
                      .map((item) => ({ value: String(item.id), label: item.fullName }))}
                    placeholder={t("events.allCustomers", { defaultValue: "All Customers" })}
                    searchPlaceholder={t("events.searchCustomers", {
                      defaultValue: "Search customers...",
                    })}
                    onSearch={setCustomerSearch}
                    onChange={(value) =>
                      setFilters((current) => ({ ...current, customerId: value }))
                    }
                  />
                </div>
              </div>

              <div
                className="space-y-3 rounded-2xl border p-3 xl:col-span-4"
                style={{
                  borderColor: "var(--lux-row-border)",
                  background: "var(--lux-control-hover)",
                }}
              >
                <div className="grid grid-cols-1 gap-2.5">
                  <SelectField
                    label={t("common.venue", { defaultValue: "Venue" })}
                    value={filters.venueId}
                    options={venues
                      .filter((item) =>
                        item.name.toLowerCase().includes(venueSearch.toLowerCase()),
                      )
                      .map((item) => ({ value: String(item.id), label: item.name }))}
                    placeholder={t("events.allVenues", { defaultValue: "All Venues" })}
                    searchPlaceholder={t("events.searchVenues", {
                      defaultValue: "Search venues...",
                    })}
                    onSearch={setVenueSearch}
                    onChange={(value) =>
                      setFilters((current) => ({ ...current, venueId: value }))
                    }
                  />
                  <FilterField label={t("events.dateRange", { defaultValue: "Date Range" })}>
                    <select
                      className={filterFieldClassName}
                      style={fieldStyle}
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
                  </FilterField>
                </div>
              </div>
            </div>
          ) : null}
        </SectionCard>

        {viewMode === "calendar" ? (
          <section className="grid gap-6 2xl:grid-cols-12">
            <SectionCard className="space-y-5 2xl:col-span-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--lux-text-muted)]">
                    {t("events.scheduleWindow", {
                      defaultValue: "Schedule window",
                    })}
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-[var(--lux-text)]">
                    {formatLocalized(currentDate, "MMMM yyyy")}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={() =>
                      setCurrentDate((current) => subMonths(current, 1))
                    }
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={() =>
                      setCurrentDate((current) => addMonths(current, 1))
                    }
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {isLoading && calendarEvents.length === 0 ? (
                <div
                  className="rounded-[24px] border px-6 py-10 text-center text-sm text-[var(--lux-text-muted)]"
                  style={{
                    borderColor: "var(--lux-row-border)",
                    background: "var(--lux-row-surface)",
                  }}
                >
                  {t("common.loading", { defaultValue: "Loading..." })}
                </div>
              ) : (
                <EventMonthView
                  currentDate={currentDate}
                  events={filteredEvents}
                  visibleDays={visibleDays}
                  selectedEventId={selectedEvent?.id ?? null}
                  onSelectEvent={setSelectedEventId}
                />
              )}
            </SectionCard>

            <EventQuickViewPanel
              event={selectedEvent}
              onView={() =>
                selectedEvent && navigate(`/events/${selectedEvent.eventId}`)
              }
              onEdit={() =>
                selectedEvent &&
                navigate(`/events/edit/${selectedEvent.eventId}`)
              }
              onDelete={() =>
                selectedEvent &&
                setDeleteCandidate({ eventId: selectedEvent.eventId })
              }
            />
          </section>
        ) : (
          <SectionCard className="overflow-hidden">
            <div
              className="border-b px-1 pb-4"
              style={{ borderColor: "var(--lux-row-border)" }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--lux-text-muted)]">
                {t("events.tableView", { defaultValue: "Table" })}
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-[var(--lux-text)]">
                {t("events.filteredEvents", {
                  defaultValue: "Filtered Events",
                })}
              </h3>
              <p className="mt-1 text-sm text-[var(--lux-text-secondary)]">
                {t("events.filteredEventsCount", {
                  count: tableEvents.length,
                  defaultValue:
                    tableEvents.length === 1
                      ? "1 event matches the current filters."
                      : `${tableEvents.length} events match the current filters.`,
                })}
              </p>
            </div>
            <div className="mt-4 overflow-hidden">
              <DataTable
                columns={columns}
                data={tableEvents}
                rowNumberStart={1}
                enableRowNumbers
                fileName="events"
                isLoading={isLoading}
              />
            </div>
          </SectionCard>
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
            deleteMutation.mutate(deleteCandidate.eventId, {
              onSettled: () => setDeleteCandidate(null),
            })
          }
          isPending={deleteMutation.isPending}
        />
      </PageContainer>
    </ProtectedComponent>
  );
};

function EventMonthView({
  currentDate,
  events,
  visibleDays,
  selectedEventId,
  onSelectEvent,
}: {
  currentDate: Date;
  events: CalendarEventItem[];
  visibleDays?: Date[];
  selectedEventId: string | null;
  onSelectEvent: (id: string) => void;
}) {
  const { t } = useTranslation();
  const today = startOfToday();
  const monthMatrix = buildMonthGrid(currentDate);
  const weeks = visibleDays?.length
    ? Array.from(
        { length: Math.ceil(visibleDays.length / 7) },
        (_, index) => visibleDays.slice(index * 7, index * 7 + 7),
      )
    : monthMatrix;

  return (
    <div className="space-y-2">
      <div className={cn("grid gap-3 px-1 text-center text-xs font-semibold uppercase tracking-[0.18em] text-[var(--lux-text-muted)]", visibleDays?.length === 1 ? "grid-cols-1" : "grid-cols-7")}>
        {(weeks[0] ?? []).map((day) => (
          <span key={day.toISOString()}>{formatLocalized(day, "EE")}</span>
        ))}
      </div>
      <div className="space-y-3">
        {weeks.map((week) => (
          <div key={week[0]?.toISOString()} className={cn("grid gap-3", week.length === 1 ? "grid-cols-1" : "grid-cols-7")}>
            {week.map((day) => {
              const dayEvents = events.filter((event) =>
                isSameDay(event.eventDate, day),
              );
              return (
                <div
                  key={day.toISOString()}
                  className={cn("min-h-[168px] rounded-[24px] border p-3 transition", isSameDay(day, today) && "border-[var(--lux-gold-border)] bg-[rgba(212,175,55,0.07)]", !visibleDays && isCalendarDayMuted(currentDate, day) && "opacity-45")}
                  style={isSameDay(day, today) ? undefined : { borderColor: "var(--lux-row-border)", background: "var(--lux-row-surface)" }}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-[var(--lux-text)]">{formatLocalized(day, "d")}</span>
                    {dayEvents.length > 0 ? (
                      <span className="rounded-full bg-[rgba(212,175,55,0.12)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--lux-gold)]">
                        {dayEvents.length} {t("events.badgeScheduled", { defaultValue: "scheduled" })}
                      </span>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    {dayEvents.slice(0, 3).map((event) => (
                      <button
                        key={event.id}
                        type="button"
                        className={cn("w-full rounded-2xl border px-3 py-2 text-left transition", selectedEventId === event.id ? "border-[var(--lux-gold-border)] bg-[rgba(212,175,55,0.1)]" : "hover:border-[var(--lux-row-border)]")}
                        style={selectedEventId === event.id ? undefined : { borderColor: "transparent", background: "var(--lux-row-surface)" }}
                        onClick={() => onSelectEvent(event.id)}
                      >
                        <p className="truncate text-sm font-semibold text-[var(--lux-text)]">{event.title}</p>
                        <p className="mt-1 truncate text-xs text-[var(--lux-text-secondary)]">{event.venue}</p>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function EventQuickViewPanel({
  event,
  onView,
  onEdit,
  onDelete,
}: {
  event: CalendarEventItem | null;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();

  return (
    <SectionCard className="space-y-5 2xl:col-span-4">
      {event ? (
        <>
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--lux-text-muted)]">
                  {t("events.quickView", { defaultValue: "Quick View" })}
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-[var(--lux-text)]">{event.title}</h3>
                <p className="mt-1 text-sm text-[var(--lux-text-secondary)]">{event.contractNumber}</p>
              </div>
              <EventStatusBadge status={event.status} />
            </div>
            {event.conflict ? (
              <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                {t("events.availabilityWarning", {
                  defaultValue: "This venue is assigned to multiple events on the same date.",
                })}
              </div>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <InfoBlock icon={CalendarClock} label={t("events.eventDate", { defaultValue: "Event Date" })} value={formatDateLabel(event.eventDate, "EEEE, dd MMM yyyy")} />
            <InfoBlock icon={MapPin} label={t("common.venue", { defaultValue: "Venue" })} value={event.venue} />
            <InfoBlock icon={UsersRound} label={t("events.partyNames", { defaultValue: "Party Names" })} value={event.partyNames} />
            <InfoBlock icon={UserRound} label={t("events.customer", { defaultValue: "Customer" })} value={event.customerName} />
            <InfoBlock icon={FileText} label={t("contracts.contractNumber", { defaultValue: "Contract Number" })} value={event.contractNumber} />
          </div>

          <Separator />

          <p className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm leading-6 text-[var(--lux-text-secondary)]">
            {event.notes}
          </p>

          <div className="grid gap-3">
            <Button className="w-full" onClick={onView}>
              {t("events.viewEvent", { defaultValue: "View Event" })}
            </Button>
            <ProtectedComponent permission="events.update">
              <Button className="w-full" variant="secondary" onClick={onEdit}>
                {t("common.edit", { defaultValue: "Edit" })}
              </Button>
            </ProtectedComponent>
            <ProtectedComponent permission="events.delete">
              <Button className="w-full" variant="destructive" onClick={onDelete}>
                <Trash2 className="h-4 w-4" />
                {t("common.delete", { defaultValue: "Delete" })}
              </Button>
            </ProtectedComponent>
          </div>
        </>
      ) : (
        <div className="flex min-h-[340px] items-center justify-center rounded-[24px] border border-dashed border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] text-center">
          <div>
            <p className="text-lg font-semibold text-[var(--lux-text)]">
              {t("events.selectEvent", { defaultValue: "Select an event" })}
            </p>
            <p className="mt-2 text-sm text-[var(--lux-text-muted)]">
              {t("events.selectEventDescription", {
                defaultValue: "Choose an event from the calendar to review its details.",
              })}
            </p>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

function InfoBlock({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarClock;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-4">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[rgba(212,175,55,0.08)] text-[var(--lux-gold)]">
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--lux-text-muted)]">{label}</p>
      <p className="mt-2 text-sm font-medium text-[var(--lux-text)]">{value}</p>
    </div>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-2">
      <span className="text-[11px] font-medium text-[var(--lux-text-muted)]">{label}</span>
      {children}
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  placeholder,
  searchPlaceholder,
  onSearch,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  placeholder: string;
  searchPlaceholder: string;
  onSearch: (value: string) => void;
  onChange: (value: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <FilterField label={label}>
      <SearchableSelect
        value={value === "all" ? FILTER_EMPTY_VALUE : value}
        onValueChange={(next) =>
          onChange(next === FILTER_EMPTY_VALUE ? "all" : next)
        }
        onSearch={onSearch}
        placeholder={placeholder}
        searchPlaceholder={searchPlaceholder}
        emptyMessage={t("common.noResultsTitle", { defaultValue: "No results found" })}
        allowClear={value !== "all"}
        onClear={() => onChange("all")}
        triggerClassName={filterFieldClassName}
      >
        <SearchableSelectItem value={FILTER_EMPTY_VALUE}>
          {placeholder}
        </SearchableSelectItem>
        {options.length === 0 ? (
          <SearchableSelectEmpty
            message={t("common.noResultsTitle", { defaultValue: "No results found" })}
          />
        ) : (
          options.map((option) => (
            <SearchableSelectItem key={option.value} value={option.value}>
              {option.label}
            </SearchableSelectItem>
          ))
        )}
      </SearchableSelect>
    </FilterField>
  );
}

function getVisibleDays(dateRange: string) {
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

function filterEvents(events: CalendarEventItem[], filters: FiltersState) {
  const search = filters.search.trim().toLowerCase();

  return events.filter((event) => {
    if (search) {
      const haystack = [
        event.title,
        event.contractNumber,
        event.partyNames,
        event.venue,
        event.customerName,
      ]
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(search)) {
        return false;
      }
    }

    if (filters.status !== "all" && event.status !== filters.status) {
      return false;
    }

    if (filters.customerId !== "all" && event.customerId !== filters.customerId) {
      return false;
    }

    if (filters.venueId !== "all" && event.venueId !== filters.venueId) {
      return false;
    }

    const today = startOfDay(new Date());

    if (filters.dateRange === "today") {
      return isSameDay(event.eventDate, today);
    }

    if (filters.dateRange === "7d") {
      return isWithinInterval(event.eventDate, {
        start: today,
        end: endOfDay(addDays(today, 6)),
      });
    }

    if (filters.dateRange === "30d") {
      return isWithinInterval(event.eventDate, {
        start: today,
        end: endOfDay(addDays(today, 29)),
      });
    }

    return true;
  });
}

export default EventsPage;
