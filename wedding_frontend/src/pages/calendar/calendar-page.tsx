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
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Filter,
  Plus,
  RotateCcw,
} from "lucide-react";
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
import { QuickViewPanel } from "@/components/shared/quick-view-panel";
import { SearchInput } from "@/components/shared/search-input";
import { SectionCard } from "@/components/shared/section-card";
import { SummaryChip } from "@/components/shared/summary-chip";
import { Button } from "@/components/ui/button";
import {
  SearchableSelect,
  SearchableSelectEmpty,
  SearchableSelectItem,
} from "@/components/ui/searchable-select";
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
const FILTER_EMPTY_VALUE = "__all__";
const filterFieldClassName =
  "h-10 rounded-xl border px-3 text-[13px] text-[var(--lux-text)] outline-none transition focus:border-[var(--lux-gold-border)]";

export function CalendarPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isArabic = i18n.language === "ar";
  const [view, setView] = useState<CalendarView>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filters, setFilters] = useState<FiltersState>(initialFilters);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [venueSearch, setVenueSearch] = useState("");
  const [coordinatorSearch, setCoordinatorSearch] = useState("");
  const [eventTypeSearch, setEventTypeSearch] = useState("");

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

  const dateRangeOptions = useMemo(
    () => [
      {
        label: t("calendar.filters.allDates", { defaultValue: "All dates" }),
        value: "all",
      },
      {
        label: t("calendar.filters.today", { defaultValue: "Today" }),
        value: "today",
      },
      {
        label: t("calendar.filters.next7Days", {
          defaultValue: "Next 7 days",
        }),
        value: "7d",
      },
      {
        label: t("calendar.filters.next30Days", {
          defaultValue: "Next 30 days",
        }),
        value: "30d",
      },
    ],
    [t],
  );
  const venueOptions = useMemo(
    () =>
      buildFilterOptions(
        calendarEvents.map((event) => event.venue),
        t("calendar.filters.allVenues", { defaultValue: "All venues" }),
      ),
    [calendarEvents, t],
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
        t("calendar.filters.allCoordinators", {
          defaultValue: "All coordinators",
        }),
      ),
    [calendarEvents, t],
  );
  const eventTypeOptions = useMemo(
    () =>
      buildFilterOptions(
        calendarEvents.map((event) => event.eventType),
        t("calendar.filters.allEventTypes", {
          defaultValue: "All event types",
        }),
      ),
    [calendarEvents, t],
  );
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
        option.label
          .toLowerCase()
          .includes(coordinatorSearch.trim().toLowerCase()),
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

  const conflictEvents = filteredEvents.filter((event) => event.conflict);
  const calendarSummaries = useMemo(
    () => buildCalendarSummaries(calendarEvents, t),
    [calendarEvents, t],
  );
  const monthVisibleDays = useMemo(
    () => getMonthVisibleDays(filters.dateRange),
    [filters.dateRange],
  );
  const activeFiltersCount = [
    Boolean(filters.search.trim()),
    filters.dateRange !== "all",
    filters.venue !== "all",
    filters.status !== "all",
    filters.coordinator !== "all",
    filters.eventType !== "all",
  ].filter(Boolean).length;

  const resetFilters = () => {
    setFilters(initialFilters);
  };

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

        <SectionCard className="overflow-hidden">
          <div className="space-y-3">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-[var(--lux-gold)]">
                    <Filter className="h-3.5 w-3.5" />
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">
                      {t("common.filters", { defaultValue: "Filters" })}
                    </p>
                  </div>
                  <p className="max-w-2xl text-xs leading-5 text-[var(--lux-text-secondary)]">
                    {t("calendar.filterToolbarDescription")}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 md:justify-end">
                  <span className="rounded-full border border-[var(--lux-row-border)] bg-[var(--lux-control-hover)] px-2.5 py-1 text-[11px] font-semibold text-[var(--lux-text)]">
                    {t("calendar.activeFiltersCount", {
                      count: activeFiltersCount,
                      defaultValue:
                        activeFiltersCount === 1
                          ? isArabic
                            ? "فلتر نشط واحد"
                            : "1 active filter"
                          : isArabic
                            ? `${activeFiltersCount} فلاتر نشطة`
                            : `${activeFiltersCount} active filters`,
                    })}
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-9 rounded-xl px-2.5 text-[12px]"
                    disabled={activeFiltersCount === 0}
                    onClick={resetFilters}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    {t("calendar.clearFilters", {
                      defaultValue: isArabic ? "مسح الفلاتر" : "Clear Filters",
                    })}
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
                      ? t("calendar.hideFilters", {
                          defaultValue: isArabic ? "إخفاء الفلاتر" : "Hide Filters",
                        })
                      : t("calendar.showFilters", {
                          defaultValue: isArabic ? "عرض الفلاتر" : "Show Filters",
                        })}
                  </Button>
                </div>
              </div>
            </div>

            {activeFiltersCount > 0 ? (
              <div
                className="flex min-h-[28px] flex-wrap items-center gap-1.5 border-t pt-3"
                style={{ borderColor: "var(--lux-row-border)" }}
              >
                {filters.search.trim() ? (
                  <FilterPill label={filters.search.trim()} />
                ) : null}
                {filters.dateRange !== "all" ? (
                  <FilterPill
                    label={
                      dateRangeOptions.find((option) => option.value === filters.dateRange)
                        ?.label || filters.dateRange
                    }
                  />
                ) : null}
                {filters.venue !== "all" ? <FilterPill label={filters.venue} /> : null}
                {filters.status !== "all" ? <FilterPill label={filters.status} /> : null}
                {filters.coordinator !== "all" ? (
                  <FilterPill label={filters.coordinator} />
                ) : null}
                {filters.eventType !== "all" ? (
                  <FilterPill label={filters.eventType} />
                ) : null}
              </div>
            ) : null}
          </div>

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
                  className="mt-4 grid gap-3 border-t pt-4 xl:grid-cols-12"
                  style={{ borderColor: "var(--lux-row-border)" }}
                >
                  <div
                    className="space-y-3 rounded-2xl border p-3 xl:col-span-8"
                    style={{
                      borderColor: "var(--lux-row-border)",
                      background: "var(--lux-control-hover)",
                    }}
                  >
                    <FilterGroupTitle
                      title={t("calendar.primaryFilters", {
                        defaultValue: isArabic ? "الفلاتر الأساسية" : "Primary Filters",
                      })}
                      description={t("calendar.primaryFiltersHint", {
                        defaultValue: isArabic
                          ? "استخدم البحث والفلاتر الرئيسية لتضييق الجدول بسرعة."
                          : "Use search and the main filters to narrow the schedule quickly.",
                      })}
                    />
                    <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                      <FilterField
                        label={t("common.searchAnything", {
                          defaultValue: "Search",
                        })}
                      >
                        <SearchInput
                          placeholder={t("common.searchCustomerOrBooking")}
                          value={filters.search}
                          onChange={(value) =>
                            setFilters((current) => ({
                              ...current,
                              search: value,
                            }))
                          }
                          inputClassName="h-10 rounded-xl text-[13px]"
                        />
                      </FilterField>

                      <FilterField
                        label={t("calendar.fields.venue")}
                      >
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
                            defaultValue: isArabic
                              ? "ابحث عن قاعة..."
                              : "Search venues...",
                          })}
                          emptyMessage={t("common.noResultsTitle", {
                            defaultValue: isArabic ? "لا توجد نتائج" : "No results found",
                          })}
                        >
                          {filteredVenueOptions.length === 0 ? (
                            <SearchableSelectEmpty
                              message={t("common.noResultsTitle", {
                                defaultValue: isArabic
                                  ? "لا توجد نتائج"
                                  : "No results found",
                              })}
                            />
                          ) : (
                            filteredVenueOptions.map((option) => (
                              <SearchableSelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SearchableSelectItem>
                            ))
                          )}
                        </SearchableFilterSelect>
                      </FilterField>

                      <FilterField
                        label={t("calendar.fields.coordinator")}
                      >
                        <SearchableFilterSelect
                          value={filters.coordinator}
                          onValueChange={(value) =>
                            setFilters((current) => ({
                              ...current,
                              coordinator: value,
                            }))
                          }
                          onSearch={setCoordinatorSearch}
                          placeholder={t("calendar.filters.allCoordinators", {
                            defaultValue: "All coordinators",
                          })}
                          searchPlaceholder={t("calendar.searchCoordinator", {
                            defaultValue: isArabic
                              ? "ابحث عن منسق..."
                              : "Search coordinators...",
                          })}
                          emptyMessage={t("common.noResultsTitle", {
                            defaultValue: isArabic ? "لا توجد نتائج" : "No results found",
                          })}
                        >
                          {filteredCoordinatorOptions.length === 0 ? (
                            <SearchableSelectEmpty
                              message={t("common.noResultsTitle", {
                                defaultValue: isArabic
                                  ? "لا توجد نتائج"
                                  : "No results found",
                              })}
                            />
                          ) : (
                            filteredCoordinatorOptions.map((option) => (
                              <SearchableSelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SearchableSelectItem>
                            ))
                          )}
                        </SearchableFilterSelect>
                      </FilterField>

                      <FilterField
                        label={t("calendar.fields.eventType")}
                      >
                        <SearchableFilterSelect
                          value={filters.eventType}
                          onValueChange={(value) =>
                            setFilters((current) => ({
                              ...current,
                              eventType: value,
                            }))
                          }
                          onSearch={setEventTypeSearch}
                          placeholder={t("calendar.filters.allEventTypes", {
                            defaultValue: "All event types",
                          })}
                          searchPlaceholder={t("calendar.searchEventType", {
                            defaultValue: isArabic
                              ? "ابحث عن نوع موعد..."
                              : "Search event types...",
                          })}
                          emptyMessage={t("common.noResultsTitle", {
                            defaultValue: isArabic ? "لا توجد نتائج" : "No results found",
                          })}
                        >
                          {filteredEventTypeOptions.length === 0 ? (
                            <SearchableSelectEmpty
                              message={t("common.noResultsTitle", {
                                defaultValue: isArabic
                                  ? "لا توجد نتائج"
                                  : "No results found",
                              })}
                            />
                          ) : (
                            filteredEventTypeOptions.map((option) => (
                              <SearchableSelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SearchableSelectItem>
                            ))
                          )}
                        </SearchableFilterSelect>
                      </FilterField>
                    </div>
                  </div>

                  <div
                    className="space-y-3 rounded-2xl border p-3 xl:col-span-4"
                    style={{
                      borderColor: "var(--lux-row-border)",
                      background: "var(--lux-control-hover)",
                    }}
                  >
                    <FilterGroupTitle
                      title={t("calendar.scopeFilters", {
                        defaultValue: isArabic ? "نطاق العرض" : "View Scope",
                      })}
                      description={t("calendar.scopeFiltersHint", {
                        defaultValue: isArabic
                          ? "حدد الإطار الزمني والحالة المعروضة في التقويم."
                          : "Set the time scope and visible status for the calendar.",
                      })}
                    />
                    <div className="grid grid-cols-1 gap-2.5">
                      <FilterField
                        label={t("calendar.fields.dateRange")}
                      >
                        <select
                          className={filterFieldClassName}
                          style={{
                            background: "var(--lux-control-surface)",
                            borderColor: "var(--lux-control-border)",
                          }}
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
                      </FilterField>

                      <FilterField
                        label={t("calendar.fields.status")}
                      >
                        <select
                          className={filterFieldClassName}
                          style={{
                            background: "var(--lux-control-surface)",
                            borderColor: "var(--lux-control-border)",
                          }}
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
                      </FilterField>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </SectionCard>

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

function FilterGroupTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--lux-gold)]">
        {title}
      </p>
      <p className="text-xs leading-5 text-[var(--lux-text-secondary)]">{description}</p>
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
      <span className="text-[11px] font-medium text-[var(--lux-text-muted)]">
        {label}
      </span>
      {children}
    </label>
  );
}

function FilterPill({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-[var(--lux-row-border)] bg-[var(--lux-panel)] px-2.5 py-1 text-[11px] text-[var(--lux-text-secondary)]">
      {label}
    </span>
  );
}

function SearchableFilterSelect({
  value,
  onValueChange,
  onSearch,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  children,
}: {
  value: string;
  onValueChange: (value: string) => void;
  onSearch: (value: string) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyMessage: string;
  children: React.ReactNode;
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
      emptyMessage={emptyMessage}
      allowClear={value !== "all"}
      onClear={() => onValueChange("all")}
      triggerClassName={filterFieldClassName}
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
  events: ReturnType<typeof toCalendarEvents>,
  t: (key: string, options?: Record<string, unknown>) => string,
) {
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
      label: t("calendar.summary.todayBookings", {
        defaultValue: "Today appointments",
      }),
      detail: t("calendar.summary.todayBookingsDetail", {
        defaultValue: "Appointments scheduled for today.",
      }),
      value: String(
        events.filter(
          (event) => format(event.startAt, "yyyy-MM-dd") === format(today, "yyyy-MM-dd"),
        ).length,
      ),
    },
    {
      id: "thisWeekEvents",
      label: t("calendar.summary.thisWeekEvents", {
        defaultValue: "This week",
      }),
      detail: t("calendar.summary.thisWeekEventsDetail", {
        defaultValue: "Appointments scheduled this week.",
      }),
      value: String(
        events.filter(
          (event) =>
            event.startAt >= startOfCurrentWeek && event.startAt <= endOfCurrentWeek,
        ).length,
      ),
    },
    {
      id: "pendingConfirmations",
      label: t("calendar.summary.pendingConfirmations", {
        defaultValue: "Pending confirmations",
      }),
      detail: t("calendar.summary.pendingConfirmationsDetail", {
        defaultValue:
          "Scheduled or rescheduled appointments awaiting confirmation.",
      }),
      value: String(
        events.filter((event) => ["Pending", "Tentative"].includes(event.status)).length,
      ),
    },
    {
      id: "fullyBookedDays",
      label: t("calendar.summary.fullyBookedDays", {
        defaultValue: "Busy days",
      }),
      detail: t("calendar.summary.fullyBookedDaysDetail", {
        defaultValue: "Days carrying two or more appointments.",
      }),
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
