import { format } from "date-fns";
import {
  CalendarClock,
  CalendarRange,
  MapPin,
  NotebookText,
  RotateCcw,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { AppCalendar } from "@/components/calendar/app-calendar";
import { CalendarFilterBar } from "@/components/calendar/calendar-filter-bar";
import { EventDetailsDialog } from "@/components/calendar/event-details-dialog";
import { EventTypeBadge } from "@/components/calendar/event-type-badge";
import { EventQuickViewCard, type EventQuickViewData } from "@/components/calendar/event-quick-view-card";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import { CrudFilterField, CrudFilterPill, CrudPageHeader, CrudPageLayout } from "@/components/shared/crud-layout";
import { Button } from "@/components/ui/button";
import { useCancelAppointment, useConfirmAppointment } from "@/hooks/appointments/useAppointmentActions";
import { useOperationalCalendar } from "@/hooks/calendar/useOperationalCalendar";
import { useUsers } from "@/hooks/users/useUsers";
import { useVenues } from "@/hooks/venues/useVenues";
import { formatAppointmentStatus } from "@/pages/appointments/adapters";
import { formatEventStatus } from "@/pages/events/adapters";
import { formatDateLabel, formatTimeLabel } from "@/lib/utils";
import type { AppCalendarAccent } from "@/components/calendar/types";
import type {
  CalendarFeedItem,
  CalendarSourceFilter,
  OperationalCalendarFilters,
} from "@/types/calendar";

const SOURCE_OPTIONS: Array<{ value: CalendarSourceFilter; label: string }> = [
  { value: "all", label: "All sources" },
  { value: "appointment", label: "Appointments" },
  { value: "event", label: "Events" },
];

const DATE_RANGE_OPTIONS: Array<{
  value: "all" | "today" | "7d" | "30d";
  label: string;
}> = [
  { value: "all", label: "All dates" },
  { value: "today", label: "Today" },
  { value: "7d", label: "Next 7 days" },
  { value: "30d", label: "Next 30 days" },
];

function getSourceFilterFromSearchParams(searchParams: URLSearchParams): CalendarSourceFilter {
  const sourceType = searchParams.get("sourceType");

  return sourceType === "appointment" || sourceType === "event"
    ? sourceType
    : "all";
}

function formatCalendarStatus(item: CalendarFeedItem) {
  return item.sourceType === "event"
    ? formatEventStatus(item.status as Parameters<typeof formatEventStatus>[0])
    : formatAppointmentStatus(
        item.status as Parameters<typeof formatAppointmentStatus>[0],
      );
}

function formatCalendarStatusValue(
  status: string,
  sourceType: CalendarSourceFilter,
) {
  if (sourceType === "event") {
    return formatEventStatus(status as Parameters<typeof formatEventStatus>[0]);
  }

  if (sourceType === "appointment") {
    return formatAppointmentStatus(
      status as Parameters<typeof formatAppointmentStatus>[0],
    );
  }

  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function statusAccent(item: CalendarFeedItem): AppCalendarAccent {
  if (item.sourceType === "event") {
    if (item.status === "confirmed") return "emerald";
    if (item.status === "completed") return "gold";
    if (item.status === "in_progress") return "blue";
    if (item.status === "cancelled") return "rose";
    return "slate";
  }

  if (item.status === "confirmed") return "emerald";
  if (item.status === "completed") return "blue";
  if (item.status === "cancelled") return "rose";
  if (item.status === "rescheduled") return "rose";
  return "gold";
}

function OperationalStatusBadge({ item }: { item: CalendarFeedItem }) {
  const accent = statusAccent(item);

  return (
    <EventTypeBadge
      label={formatCalendarStatus(item)}
      accent={accent}
    />
  );
}

function buildSummaryCards(items: CalendarFeedItem[], t: ReturnType<typeof useTranslation>["t"]) {
  const appointmentCount = items.filter((item) => item.sourceType === "appointment").length;
  const eventCount = items.filter((item) => item.sourceType === "event").length;
  const venueCount = new Set(items.map((item) => item.venueName).filter(Boolean)).size;
  const assignedCount = new Set(
    items.map((item) => item.assignedUserName).filter(Boolean),
  ).size;

  return [
    {
      id: "total",
      label: t("calendar.summary.total", { defaultValue: "Visible Items" }),
      value: String(items.length),
      hint: t("calendar.summary.totalHint", {
        defaultValue: "Appointments and events in the current operational window.",
      }),
    },
    {
      id: "appointments",
      label: t("calendar.summary.appointments", { defaultValue: "Appointments" }),
      value: String(appointmentCount),
      hint: t("calendar.summary.appointmentsHint", {
        defaultValue: "Client meetings and scheduling touchpoints.",
      }),
    },
    {
      id: "events",
      label: t("calendar.summary.events", { defaultValue: "Events" }),
      value: String(eventCount),
      hint: t("calendar.summary.eventsHint", {
        defaultValue: "Wedding and production milestones.",
      }),
    },
    {
      id: "venues",
      label: t("calendar.summary.venues", { defaultValue: "Venues" }),
      value: String(venueCount),
      hint: t("calendar.summary.venuesHint", {
        defaultValue: `${assignedCount} active coordinators in the visible feed.`,
      }),
    },
  ];
}

function buildQuickViewData(
  item: CalendarFeedItem | null,
  t: ReturnType<typeof useTranslation>["t"],
  navigate: ReturnType<typeof useNavigate>,
  onConfirmAppointment: (item: CalendarFeedItem) => void,
  onCancelAppointment: (item: CalendarFeedItem) => void,
): EventQuickViewData | null {
  if (!item) {
    return null;
  }

  const isAppointment = item.sourceType === "appointment";
  const startDate = new Date(item.startAt);
  const endDate = item.endAt ? new Date(item.endAt) : null;
  const guestCount =
    typeof item.meta?.guestCount === "number" ? String(item.meta.guestCount) : "-";
  const partyNames =
    [item.meta?.groomName, item.meta?.brideName]
      .filter(Boolean)
      .join(" / ") || "-";

  return {
    eyebrow: t("calendar.quickView", { defaultValue: "Quick View" }),
    title: item.title,
    subtitle:
      item.subtitle ||
      item.customerName ||
      item.assignedUserName ||
      (isAppointment
        ? t("calendar.appointmentItem", { defaultValue: "Appointment" })
        : t("calendar.eventItem", { defaultValue: "Event" })),
    badges: (
      <>
        <OperationalStatusBadge item={item} />
        <EventTypeBadge
          label={
            isAppointment
              ? t("calendar.appointmentItem", { defaultValue: "Appointment" })
              : t("calendar.eventItem", { defaultValue: "Event" })
          }
          accent={isAppointment ? "gold" : "emerald"}
        />
      </>
    ),
    infoItems: [
      {
        label: t("common.date", { defaultValue: "Date" }),
        value: formatDateLabel(startDate, "EEEE, dd MMM yyyy"),
        icon: CalendarClock,
      },
      {
        label: t("common.time", { defaultValue: "Time" }),
        value: item.allDay
          ? t("calendar.allDay", { defaultValue: "All day" })
          : endDate
            ? `${formatTimeLabel(startDate)} - ${formatTimeLabel(endDate)}`
            : formatTimeLabel(startDate),
        icon: CalendarClock,
      },
      {
        label: t("common.venue", { defaultValue: "Venue" }),
        value: item.venueName || "-",
        icon: MapPin,
      },
      {
        label: t("appointments.assignedTo", { defaultValue: "Assigned To" }),
        value: item.assignedUserName || "-",
        icon: UserRound,
      },
      {
        label: isAppointment
          ? t("appointments.meetingType", { defaultValue: "Meeting Type" })
          : t("events.partyNames", { defaultValue: "Party Names" }),
        value: isAppointment ? item.subtitle || "-" : partyNames,
        icon: NotebookText,
      },
      {
        label: isAppointment
          ? t("appointments.customer", { defaultValue: "Customer" })
          : t("events.guestCount", { defaultValue: "Guest Count" }),
        value: isAppointment ? item.customerName || "-" : guestCount,
        icon: UsersRound,
      },
    ],
    notes: item.notes || t("common.noNotes", { defaultValue: "No notes added." }),
    notesLabel: t("common.notes", { defaultValue: "Notes" }),
    actions: isAppointment ? (
      <>
        <Button type="button" onClick={() => navigate(`/appointments/${item.sourceId}`)}>
          {t("appointments.viewAppointment", { defaultValue: "View Appointment" })}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => navigate(`/appointments/edit/${item.sourceId}`)}
        >
          {t("common.edit", { defaultValue: "Edit" })}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => navigate(`/appointments/edit/${item.sourceId}`)}
        >
          {t("appointments.reschedule", { defaultValue: "Reschedule" })}
        </Button>
        {["scheduled", "rescheduled"].includes(item.status) ? (
          <Button type="button" onClick={() => onConfirmAppointment(item)}>
            {t("appointments.confirm", { defaultValue: "Confirm" })}
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => onCancelAppointment(item)}
            disabled={["completed", "cancelled"].includes(item.status)}
          >
            {t("appointments.cancelAction", { defaultValue: "Cancel" })}
          </Button>
        )}
      </>
    ) : (
      <>
        <Button type="button" onClick={() => navigate(`/events/${item.sourceId}`)}>
          {t("events.viewEvent", { defaultValue: "View Event" })}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => navigate(`/events/edit/${item.sourceId}`)}
        >
          {t("common.edit", { defaultValue: "Edit" })}
        </Button>
      </>
    ),
  };
}

export function CalendarPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultSourceType = getSourceFilterFromSearchParams(searchParams);
  const {
    items,
    calendarEvents,
    filters,
    setCalendarRange,
    setFilters,
    activeFiltersCount,
    isLoading,
    isFetching,
  } = useOperationalCalendar(defaultSourceType);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const confirmAppointment = useConfirmAppointment();
  const cancelAppointment = useCancelAppointment();

  const { data: venuesResponse } = useVenues({
    currentPage: 1,
    itemsPerPage: 200,
    searchQuery: "",
    isActive: "all",
  });
  const { data: usersResponse } = useUsers({
    currentPage: 1,
    itemsPerPage: 200,
    searchQuery: "",
  });

  useEffect(() => {
    setFilters((current) => ({
      ...current,
      sourceType: defaultSourceType,
    }));
  }, [defaultSourceType, setFilters]);

  useEffect(() => {
    if (!items.length) {
      setSelectedItemId(null);
      return;
    }

    if (!selectedItemId || !items.some((item) => item.id === selectedItemId)) {
      setSelectedItemId(items[0].id);
    }
  }, [items, selectedItemId]);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedItemId) ?? null,
    [items, selectedItemId],
  );

  const statusOptions = useMemo(
    () =>
      Array.from(new Set(items.map((item) => item.status)))
        .sort()
        .map((status) => ({
          value: status,
          label: formatCalendarStatusValue(status, filters.sourceType),
        })),
    [filters.sourceType, items],
  );

  const venueOptions = useMemo(
    () =>
      (venuesResponse?.data ?? []).map((venue) => ({
        value: String(venue.id),
        label: venue.name,
      })),
    [venuesResponse?.data],
  );

  const assignedUserOptions = useMemo(
    () =>
      (usersResponse?.data ?? []).map((user) => ({
        value: String(user.id),
        label: user.fullName,
      })),
    [usersResponse?.data],
  );

  const summaryCards = useMemo(() => buildSummaryCards(items, t), [items, t]);
  const quickViewData = useMemo(
    () =>
      buildQuickViewData(
        selectedItem,
        t,
        navigate,
        (item) =>
          confirmAppointment.mutate({ id: Number(item.sourceId), values: {} }),
        (item) =>
          cancelAppointment.mutate({
            id: Number(item.sourceId),
            values: { reason: "", notes: "" },
          }),
      ),
    [cancelAppointment, confirmAppointment, navigate, selectedItem, t],
  );

  const legendItems = [
    {
      id: "appointment",
      label: t("calendar.legend.appointments", { defaultValue: "Appointments" }),
      accent: "gold" as const,
    },
    {
      id: "event",
      label: t("calendar.legend.events", { defaultValue: "Events" }),
      accent: "emerald" as const,
    },
    {
      id: "completed",
      label: t("calendar.legend.completed", { defaultValue: "Completed" }),
      accent: "blue" as const,
    },
    {
      id: "cancelled",
      label: t("calendar.legend.cancelled", { defaultValue: "Cancelled" }),
      accent: "rose" as const,
    },
  ];

  return (
    <ProtectedComponent anyOf={["appointments.calendar.read", "events.read"]}>
      <CrudPageLayout>
        <CrudPageHeader
          eyebrow={t("calendar.operations", { defaultValue: "Daily Operations" })}
          title={t("calendar.title", { defaultValue: "Operational Calendar" })}
          description={t("calendar.unifiedDescription", {
            defaultValue:
              "Unified operational timeline for appointments and wedding events.",
          })}
          actions={
            <ProtectedComponent permission="appointments.create">
              <Button onClick={() => navigate("/appointments/create")}>
                <CalendarRange className="h-4 w-4" />
                {t("appointments.create", { defaultValue: "Create Appointment" })}
              </Button>
            </ProtectedComponent>
          }
        />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((summary) => (
            <SummaryCard
              key={summary.id}
              label={summary.label}
              value={summary.value}
              hint={summary.hint}
            />
          ))}
        </section>

        <CalendarFilterBar
          title={t("common.filters", { defaultValue: "Filters" })}
          description={t("calendar.filterToolbarDescription", {
            defaultValue:
              "Refine the unified operational feed by source, status, venue, and coordinator.",
          })}
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
                onClick={() =>
                  setFilters({
                    search: "",
                    sourceType: defaultSourceType,
                    status: "all",
                    venueId: "all",
                    assignedUserId: "all",
                    dateRange: "all",
                  })
                }
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {t("calendar.clearFilters", { defaultValue: "Clear Filters" })}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="crud-form-grid xl:grid-cols-3">
              <CrudFilterField
                label={t("common.searchAnything", { defaultValue: "Search" })}
              >
                <input
                  className="app-native-select h-10 rounded-xl text-[13px]"
                  placeholder={t("calendar.searchPlaceholder", {
                    defaultValue: "Search titles, customers, notes, or venues...",
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
                label={t("calendar.filters.sourceType", { defaultValue: "Source Type" })}
              >
                <select
                  className="app-native-select h-10 rounded-xl text-[13px]"
                  value={filters.sourceType}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      sourceType: event.target.value as CalendarSourceFilter,
                    }))
                  }
                >
                  {SOURCE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {t(`calendar.source.${option.value}`, { defaultValue: option.label })}
                    </option>
                  ))}
                </select>
              </CrudFilterField>

              <CrudFilterField
                label={t("calendar.filters.dateRange", { defaultValue: "Date Range" })}
              >
                <select
                  className="app-native-select h-10 rounded-xl text-[13px]"
                  value={filters.dateRange}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      dateRange: event.target.value as OperationalCalendarFilters["dateRange"],
                    }))
                  }
                >
                  {DATE_RANGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {t(`calendar.filters.${option.value}`, { defaultValue: option.label })}
                    </option>
                  ))}
                </select>
              </CrudFilterField>

              <CrudFilterField
                label={t("calendar.filters.status", { defaultValue: "Status" })}
              >
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
                  <option value="all">
                    {t("calendar.filters.allStatuses", { defaultValue: "All statuses" })}
                  </option>
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </CrudFilterField>

              <CrudFilterField
                label={t("calendar.filters.venue", { defaultValue: "Venue" })}
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
                    {t("calendar.filters.allVenues", { defaultValue: "All venues" })}
                  </option>
                  {venueOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </CrudFilterField>

              <CrudFilterField
                label={t("calendar.filters.assignedUser", {
                  defaultValue: "Assigned User / Coordinator",
                })}
              >
                <select
                  className="app-native-select h-10 rounded-xl text-[13px]"
                  value={filters.assignedUserId}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      assignedUserId: event.target.value,
                    }))
                  }
                >
                  <option value="all">
                    {t("calendar.filters.allAssignedUsers", {
                      defaultValue: "All assigned users",
                    })}
                  </option>
                  {assignedUserOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </CrudFilterField>
            </div>

            {activeFiltersCount > 0 ? (
              <div
                className="flex min-h-[28px] flex-wrap items-center gap-1.5 border-t pt-3"
                style={{ borderColor: "var(--lux-row-border)" }}
              >
                {filters.search.trim() ? <CrudFilterPill label={filters.search.trim()} /> : null}
                {filters.sourceType !== "all" ? (
                  <CrudFilterPill
                    label={t(`calendar.source.${filters.sourceType}`, {
                      defaultValue: filters.sourceType,
                    })}
                  />
                ) : null}
                {filters.status !== "all" ? <CrudFilterPill label={filters.status} /> : null}
                {filters.venueId !== "all" ? (
                  <CrudFilterPill
                    label={
                      venueOptions.find((option) => option.value === filters.venueId)?.label ||
                      filters.venueId
                    }
                  />
                ) : null}
                {filters.assignedUserId !== "all" ? (
                  <CrudFilterPill
                    label={
                      assignedUserOptions.find(
                        (option) => option.value === filters.assignedUserId,
                      )?.label || filters.assignedUserId
                    }
                  />
                ) : null}
                {filters.dateRange !== "all" ? (
                  <CrudFilterPill
                    label={
                      DATE_RANGE_OPTIONS.find((option) => option.value === filters.dateRange)
                        ?.label || filters.dateRange
                    }
                  />
                ) : null}
              </div>
            ) : null}
          </div>
        </CalendarFilterBar>

        <section className="grid gap-6 2xl:grid-cols-12">
          <div className="space-y-6 2xl:col-span-8">
            <AppCalendar
              locale={i18n.language === "ar" ? "ar" : "en"}
              events={calendarEvents}
              loading={isLoading || isFetching}
              legends={legendItems}
              emptyTitle={t("calendar.emptyTitle", {
                defaultValue: "No schedule items found",
              })}
              emptyDescription={t("calendar.emptyDescription", {
                defaultValue:
                  "Try changing the current view window or relaxing one of the active filters.",
              })}
              onRangeChange={setCalendarRange}
              onEventSelect={(event) => {
                setSelectedItemId(event.id);
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
              emptyTitle={t("calendar.selectScheduleItem", {
                defaultValue: "Select a schedule item",
              })}
              emptyDescription={t("calendar.selectScheduleItemDescription", {
                defaultValue:
                  "Choose an appointment or event from the calendar to inspect its details.",
              })}
            />
          </div>
        </section>

        <EventDetailsDialog
          open={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
          title={t("calendar.quickView", { defaultValue: "Quick View" })}
          description={t("calendar.selectScheduleItemDescription", {
            defaultValue:
              "Choose an appointment or event from the calendar to inspect its details.",
          })}
          data={quickViewData}
          emptyTitle={t("calendar.selectScheduleItem", {
            defaultValue: "Select a schedule item",
          })}
          emptyDescription={t("calendar.selectScheduleItemDescription", {
            defaultValue:
              "Choose an appointment or event from the calendar to inspect its details.",
          })}
        />
      </CrudPageLayout>
    </ProtectedComponent>
  );
}
