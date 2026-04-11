import { format } from "date-fns";
import { CalendarClock } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { EChartsOption } from "echarts";
import {
  AppCalendar,
  type AppCalendarHandle,
} from "@/components/calendar/app-calendar";
import { EChart } from "@/components/charts/EChart";
import { SummaryCard } from "@/components/dashboard/summary-card";
import {
  AppDialogFooter,
  AppDialogHeader,
  AppDialogShell,
} from "@/components/shared/app-dialog";
import { SectionCard } from "@/components/shared/section-card";
import {
  WorkspaceFilterBar,
  WorkspaceFilterField,
  WorkspaceFilterPill,
} from "@/components/shared/workspace-filter-bar";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  SearchableSelect,
  SearchableSelectEmpty,
  SearchableSelectItem,
} from "@/components/ui/searchable-select";
import {
  AppointmentQuickView,
  AppointmentQuickViewDialog,
} from "@/features/appointments/appointment-calendar-quick-view";
import {
  buildAppointmentCalendarSummary,
  getAppointmentCalendarLegendItems,
} from "@/features/appointments/appointment-calendar";
import {
  useAttendAppointment,
  useCancelAppointment,
  useRescheduleAppointment,
} from "@/hooks/appointments/useAppointmentActions";
import { useAppointmentsCalendarView } from "@/hooks/appointments/useAppointmentsCalendarView";
import { useCustomers } from "@/hooks/customers/useCustomers";
import { APPOINTMENT_STATUS_OPTIONS } from "@/pages/appointments/adapters";
import type {
  Appointment,
  AppointmentStatus,
} from "@/pages/appointments/types";
import type { CustomerSource } from "@/pages/customers/types";

const filterFieldClassName =
  "h-11 w-full rounded-[6px] border px-3 text-sm text-[var(--lux-text)] outline-none transition focus:border-[var(--lux-gold-border)]";

const fieldStyle = {
  background: "var(--lux-control-surface)",
  borderColor: "var(--lux-control-border)",
} as const;

const textareaClassName =
  "min-h-[110px] w-full rounded-[6px] border px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:color-mix(in_srgb,var(--color-primary)_14%,transparent)]";

const FILTER_ALL_VALUE = "all";

type ActionTarget = Appointment | null;
type AppointmentsCalendarViewProps = { active: boolean };
type AnalyticsSourceKey = CustomerSource | "unknown";

const SOURCE_LABELS: Record<AnalyticsSourceKey, string> = {
  facebook: "فيسبوك",
  instagram: "إنستجرام",
  tiktok: "تيك توك",
  google_search: "بحث جوجل",
  google_maps: "خرائط جوجل",
  snapchat: "سناب شات",
  whatsapp: "واتساب",
  friend_referral: "ترشيح من صديق",
  family_referral: "ترشيح من العائلة",
  existing_customer: "عميل حالي",
  walk_in: "زيارة مباشرة",
  advertisement: "إعلان",
  exhibition: "معرض",
  website: "الموقع الإلكتروني",
  other: "أخرى",
  unknown: "غير محدد",
};

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  reserved: "محجوز",
  attended: "حضر",
  converted: "تم التحويل",
  cancelled: "ملغي",
  no_show: "لم يحضر",
};

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  reserved: "#C5A05A",
  attended: "#2E8B57",
  converted: "#3B82F6",
  cancelled: "#DC2626",
  no_show: "#6B7280",
};

const SOURCE_COLORS = [
  "#C5A05A",
  "#3B82F6",
  "#2E8B57",
  "#DC2626",
  "#8B5CF6",
  "#06B6D4",
  "#F59E0B",
  "#10B981",
  "#EC4899",
  "#6366F1",
  "#84CC16",
  "#14B8A6",
  "#F97316",
  "#64748B",
  "#A855F7",
];

function AnalyticsSection({ items }: { items: Appointment[] }) {
  const total = items.length;

  const sourceRows = useMemo(() => {
    const map = new Map<AnalyticsSourceKey, number>();

    for (const item of items) {
      const key = (item.customer?.source ?? "unknown") as AnalyticsSourceKey;
      map.set(key, (map.get(key) ?? 0) + 1);
    }

    return Array.from(map.entries())
      .map(([key, count], index) => ({
        key,
        label: SOURCE_LABELS[key] ?? SOURCE_LABELS.unknown,
        count,
        color: SOURCE_COLORS[index % SOURCE_COLORS.length],
      }))
      .sort((a, b) => b.count - a.count);
  }, [items]);

  const statusRows = useMemo(() => {
    const map: Record<AppointmentStatus, number> = {
      reserved: 0,
      attended: 0,
      converted: 0,
      cancelled: 0,
      no_show: 0,
    };

    for (const item of items) {
      map[item.status] += 1;
    }

    return (Object.keys(map) as AppointmentStatus[]).map((status) => ({
      key: status,
      label: STATUS_LABELS[status],
      count: map[status],
      color: STATUS_COLORS[status],
    }));
  }, [items]);

  const sourcePieOption = useMemo<EChartsOption>(
    () => ({
      tooltip: {
        trigger: "item",
        formatter: "{b}: {c} ({d}%)",
      },
      legend: {
        bottom: 0,
        left: "center",
        textStyle: {
          color: "#6B7280",
        },
      },
      series: [
        {
          name: "مصدر العميل",
          type: "pie",
          radius: ["45%", "72%"],
          center: ["50%", "42%"],
          avoidLabelOverlap: true,
          label: {
            formatter: "{b}",
            color: "#374151",
          },
          data: sourceRows.map((row) => ({
            value: row.count,
            name: row.label,
            itemStyle: { color: row.color },
          })),
        },
      ],
    }),
    [sourceRows],
  );

  const statusBarOption = useMemo<EChartsOption>(
    () => ({
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow",
        },
      },
      grid: {
        left: 24,
        right: 24,
        top: 20,
        bottom: 40,
      },
      xAxis: {
        type: "category",
        data: statusRows.map((row) => row.label),
        axisLabel: {
          color: "#6B7280",
        },
      },
      yAxis: {
        type: "value",
        axisLabel: {
          color: "#6B7280",
        },
      },
      series: [
        {
          type: "bar",
          data: statusRows.map((row) => ({
            value: row.count,
            itemStyle: {
              color: row.color,
              borderRadius: [10, 10, 0, 0],
            },
          })),
          barMaxWidth: 54,
        },
      ],
    }),
    [statusRows],
  );

  if (total === 0) {
    return (
      <SectionCard>
        <div className="py-6 text-sm text-[var(--lux-text-secondary)]">
          لا توجد بيانات إحصائية ضمن الفلاتر الحالية.
        </div>
      </SectionCard>
    );
  }

  return (
    <section className="grid gap-6 xl:grid-cols-2">
      <SectionCard className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-[var(--lux-heading)]">
            نسبة مصادر العملاء
          </h3>
          <p className="text-sm text-[var(--lux-text-secondary)]">
            توزيع المواعيد الحالية حسب مصدر معرفة العميل.
          </p>
        </div>
        <EChart option={sourcePieOption} height={360} />
      </SectionCard>

      <SectionCard className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-[var(--lux-heading)]">
            حالات المواعيد
          </h3>
          <p className="text-sm text-[var(--lux-text-secondary)]">
            توزيع الحالات للمواعيد المعروضة حاليًا.
          </p>
        </div>
        <EChart option={statusBarOption} height={360} />
      </SectionCard>
    </section>
  );
}
function RescheduleDialog({
  open,
  onOpenChange,
  appointment,
  appointmentDate,
  startTime,
  endTime,
  notes,
  onAppointmentDateChange,
  onStartTimeChange,
  onEndTimeChange,
  onNotesChange,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: ActionTarget;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  notes: string;
  onAppointmentDateChange: (value: string) => void;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onSubmit: () => void;
  isPending: boolean;
}) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AppDialogShell size="sm">
        <AppDialogHeader
          title={t("appointments.rescheduleTitle", {
            defaultValue: "Reschedule Appointment",
          })}
          description={t("appointments.calendarPage.rescheduleDescription", {
            defaultValue:
              "Adjust the appointment date, time, and any follow-up note.",
          })}
        />
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              type="date"
              value={appointmentDate}
              onChange={(event) => onAppointmentDateChange(event.target.value)}
              disabled={isPending || !appointment}
            />
            <Input
              type="time"
              value={startTime}
              onChange={(event) => onStartTimeChange(event.target.value)}
              disabled={isPending || !appointment}
            />
            <Input
              type="time"
              value={endTime}
              required
              onChange={(event) => onEndTimeChange(event.target.value)}
              disabled={isPending || !appointment}
              className="sm:col-span-2"
            />
            {!endTime.trim() ? (
              <p className="text-xs text-[var(--color-text-subtle)] sm:col-span-2">
                {t("appointments.endTimeRequiredHint", {
                  defaultValue:
                    "End time is required for scheduling and conflict checks.",
                })}
              </p>
            ) : null}
          </div>
          <textarea
            className={textareaClassName}
            value={notes}
            onChange={(event) => onNotesChange(event.target.value)}
            placeholder={t("appointments.notesPlaceholder", {
              defaultValue: "Add notes...",
            })}
            disabled={isPending || !appointment}
            style={{
              background: "var(--color-surface-2)",
              borderColor: "var(--color-border)",
            }}
          />
        </div>
        <AppDialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {t("common.cancel", { defaultValue: "Cancel" })}
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={
              isPending ||
              !appointment ||
              !appointmentDate ||
              !startTime ||
              !endTime.trim()
            }
          >
            {t("appointments.reschedule", { defaultValue: "Reschedule" })}
          </Button>
        </AppDialogFooter>
      </AppDialogShell>
    </Dialog>
  );
}

function CancelDialog({
  open,
  onOpenChange,
  appointment,
  reason,
  notes,
  onReasonChange,
  onNotesChange,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: ActionTarget;
  reason: string;
  notes: string;
  onReasonChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onSubmit: () => void;
  isPending: boolean;
}) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AppDialogShell size="sm">
        <AppDialogHeader
          title={t("appointments.cancelTitle", {
            defaultValue: "Cancel Appointment",
          })}
          description={t("appointments.calendarPage.cancelDescription", {
            defaultValue:
              "Add a cancellation reason and any note that should stay with the appointment.",
          })}
        />
        <div className="space-y-4">
          <Input
            value={reason}
            onChange={(event) => onReasonChange(event.target.value)}
            placeholder={t("appointments.cancelReasonPlaceholder", {
              defaultValue: "Enter cancellation reason",
            })}
            disabled={isPending || !appointment}
          />
          <textarea
            className={textareaClassName}
            value={notes}
            onChange={(event) => onNotesChange(event.target.value)}
            placeholder={t("appointments.notesPlaceholder", {
              defaultValue: "Add notes...",
            })}
            disabled={isPending || !appointment}
            style={{
              background: "var(--color-surface-2)",
              borderColor: "var(--color-border)",
            }}
          />
        </div>
        <AppDialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {t("common.cancel", { defaultValue: "Cancel" })}
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={isPending || !appointment}
          >
            {t("appointments.cancel", { defaultValue: "Cancel" })}
          </Button>
        </AppDialogFooter>
      </AppDialogShell>
    </Dialog>
  );
}

function ActionDialog({
  open,
  onOpenChange,
  appointment,
  title,
  description,
  value,
  onChange,
  onSubmit,
  isPending,
  confirmLabel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: ActionTarget;
  title: string;
  description?: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isPending: boolean;
  confirmLabel: string;
}) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AppDialogShell size="sm">
        <AppDialogHeader title={title} description={description} />
        <textarea
          className={textareaClassName}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={isPending || !appointment}
          placeholder={t("appointments.notesPlaceholder", {
            defaultValue: "Add notes...",
          })}
          style={{
            background: "var(--color-surface-2)",
            borderColor: "var(--color-border)",
          }}
        />
        <AppDialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {t("common.cancel", { defaultValue: "Cancel" })}
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={isPending || !appointment}
          >
            {confirmLabel}
          </Button>
        </AppDialogFooter>
      </AppDialogShell>
    </Dialog>
  );
}

export function AppointmentsCalendarView({
  active,
}: AppointmentsCalendarViewProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const calendarRef = useRef<AppCalendarHandle | null>(null);
  const {
    items,
    calendarEvents,
    weddingDayMarkers,
    filters,
    setFilters,
    resetFilters,
    setCalendarRange,
    activeFiltersCount,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useAppointmentsCalendarView();

  const [selectedAppointmentId, setSelectedAppointmentId] = useState<
    string | null
  >(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const [attendCandidate, setAttendCandidate] = useState<ActionTarget>(null);
  const [attendNotes, setAttendNotes] = useState("");

  const [cancelCandidate, setCancelCandidate] = useState<ActionTarget>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelNotes, setCancelNotes] = useState("");

  const [rescheduleCandidate, setRescheduleCandidate] =
    useState<ActionTarget>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleStartTime, setRescheduleStartTime] = useState("");
  const [rescheduleEndTime, setRescheduleEndTime] = useState("");
  const [rescheduleNotes, setRescheduleNotes] = useState("");

  const [customerSearch, setCustomerSearch] = useState("");

  const attendAppointment = useAttendAppointment();
  const cancelAppointment = useCancelAppointment();
  const rescheduleAppointment = useRescheduleAppointment();

  const { data: customersResponse } = useCustomers({
    currentPage: 1,
    itemsPerPage: 200,
    searchQuery: "",
    status: "all",
  });

  useEffect(() => {
    if (!active) return;

    const frame = window.requestAnimationFrame(() => {
      calendarRef.current?.updateSize();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [active]);

  const selectedAppointment = useMemo(() => {
    if (!items.length) return null;

    if (selectedAppointmentId) {
      const matchedItem =
        items.find((item) => String(item.id) === selectedAppointmentId) ?? null;

      if (matchedItem) return matchedItem;
    }

    return items[0] ?? null;
  }, [items, selectedAppointmentId]);

  const customerOptions = useMemo(
    () =>
      (customersResponse?.data ?? []).map((customer) => ({
        value: String(customer.id),
        label: customer.fullName,
      })),
    [customersResponse?.data],
  );

  const filteredCustomerOptions = useMemo(() => {
    const query = customerSearch.trim().toLowerCase();

    if (!query) return customerOptions;

    return customerOptions.filter((option) =>
      option.label.toLowerCase().includes(query),
    );
  }, [customerOptions, customerSearch]);

  const openAttendDialog = (appointment: Appointment) => {
    setDetailsDialogOpen(false);
    setAttendCandidate(appointment);
    setAttendNotes(appointment.notes ?? "");
  };

  const openCancelDialog = (appointment: Appointment) => {
    setDetailsDialogOpen(false);
    setCancelCandidate(appointment);
    setCancelReason("");
    setCancelNotes(appointment.notes ?? "");
  };

  const openRescheduleDialog = (appointment: Appointment) => {
    setDetailsDialogOpen(false);
    setRescheduleCandidate(appointment);
    setRescheduleDate(appointment.appointmentDate);
    setRescheduleStartTime(appointment.startTime);
    setRescheduleEndTime(appointment.endTime ?? "");
    setRescheduleNotes(appointment.notes ?? "");
  };

  const summaryItems = useMemo(
    () => buildAppointmentCalendarSummary(items, t),
    [items, t],
  );

  const activeFilterPills = [
    filters.search.trim() ? (
      <WorkspaceFilterPill key="search" label={filters.search.trim()} />
    ) : null,
    filters.status !== "all" ? (
      <WorkspaceFilterPill
        key="status"
        label={t(`appointments.status.${filters.status}`, {
          defaultValue: filters.status,
        })}
      />
    ) : null,
    filters.customerId !== "all" ? (
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
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {summaryItems.map((summary) => (
          <SummaryCard
            key={summary.id}
            label={summary.label}
            value={summary.value}
            hint={summary.hint}
            accent={<CalendarClock className="h-4 w-4" />}
            className="workspace-summary-card"
          />
        ))}
      </section>

      <AnalyticsSection items={items} />
      <WorkspaceFilterBar
        title={t("common.filters")}
        description={t("appointments.calendarPage.filtersDescription")}
        activeFiltersLabel={t("appointments.activeFiltersCount", {
          count: activeFiltersCount,
        })}
        activeFiltersCount={activeFiltersCount}
        clearLabel={t("appointments.clearFilters")}
        onClear={resetFilters}
        showFiltersLabel={t("appointments.showFilters")}
        hideFiltersLabel={t("appointments.hideFilters")}
        pills={activeFilterPills.length ? activeFilterPills : undefined}
        quickFilters={
          <>
            <WorkspaceFilterField
              label={t("appointments.calendarPage.searchLabel")}
            >
              <Input
                className={filterFieldClassName}
                style={fieldStyle}
                value={filters.search}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    search: event.target.value,
                  }))
                }
                placeholder={t("appointments.calendarPage.searchPlaceholder", {
                  defaultValue: "Search customers, notes, or mobile numbers...",
                })}
              />
            </WorkspaceFilterField>

            <WorkspaceFilterField label={t("appointments.statusLabel")}>
              <SearchableSelect
                value={filters.status}
                onValueChange={(value) =>
                  setFilters((current) => ({
                    ...current,
                    status: value as typeof filters.status,
                  }))
                }
                placeholder={t("appointments.allStatuses", {
                  defaultValue: "All Statuses",
                })}
                searchPlaceholder={t("appointments.calendarPage.searchLabel", {
                  defaultValue: "Search",
                })}
                allowClear={filters.status !== FILTER_ALL_VALUE}
                onClear={() =>
                  setFilters((current) => ({
                    ...current,
                    status: FILTER_ALL_VALUE,
                  }))
                }
                triggerClassName={filterFieldClassName}
              >
                <SearchableSelectItem value={FILTER_ALL_VALUE}>
                  {t("appointments.allStatuses", {
                    defaultValue: "All Statuses",
                  })}
                </SearchableSelectItem>
                {APPOINTMENT_STATUS_OPTIONS.map((option) => (
                  <SearchableSelectItem key={option.value} value={option.value}>
                    {t(`appointments.status.${option.value}`, {
                      defaultValue: option.label,
                    })}
                  </SearchableSelectItem>
                ))}
              </SearchableSelect>
            </WorkspaceFilterField>

            <WorkspaceFilterField label={t("appointments.customer")}>
              <SearchableSelect
                value={filters.customerId}
                onValueChange={(value) =>
                  setFilters((current) => ({
                    ...current,
                    customerId: value,
                  }))
                }
                onSearch={setCustomerSearch}
                placeholder={t("appointments.calendarPage.allCustomers", {
                  defaultValue: "All customers",
                })}
                searchPlaceholder={t("appointments.calendarPage.searchLabel", {
                  defaultValue: "Search",
                })}
                emptyMessage={t("common.noResultsTitle", {
                  defaultValue: "No results found",
                })}
                allowClear={filters.customerId !== FILTER_ALL_VALUE}
                onClear={() =>
                  setFilters((current) => ({
                    ...current,
                    customerId: FILTER_ALL_VALUE,
                  }))
                }
                triggerClassName={filterFieldClassName}
              >
                <SearchableSelectItem value={FILTER_ALL_VALUE}>
                  {t("appointments.calendarPage.allCustomers", {
                    defaultValue: "All customers",
                  })}
                </SearchableSelectItem>
                {filteredCustomerOptions.length === 0 ? (
                  <SearchableSelectEmpty
                    message={t("common.noResultsTitle", {
                      defaultValue: "No results found",
                    })}
                  />
                ) : null}
                {filteredCustomerOptions.map((option) => (
                  <SearchableSelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SearchableSelectItem>
                ))}
              </SearchableSelect>
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
                  setFilters((current) => ({
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
                  setFilters((current) => ({
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
            <SectionCard className="space-y-4">
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
                  {t("common.error", { defaultValue: "Error" })}
                </p>
                <h3 className="text-xl font-semibold text-[var(--color-text)]">
                  {t("appointments.calendarPage.errorTitle", {
                    defaultValue: "Unable to load the appointments calendar",
                  })}
                </h3>
                <p className="text-sm text-[var(--color-text-subtle)]">
                  {t("appointments.calendarPage.errorDescription", {
                    defaultValue:
                      "The appointment schedule could not be loaded right now. Try again to refresh the visible range.",
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
              dayMarkers={weddingDayMarkers}
              initialView="month"
              initialDate={
                filters.dateFrom ? new Date(filters.dateFrom) : undefined
              }
              loading={isLoading || isFetching}
              legends={getAppointmentCalendarLegendItems(t)}
              emptyTitle={t("appointments.calendarPage.emptyTitle", {
                defaultValue: "No appointments in this range",
              })}
              emptyDescription={t(
                "appointments.calendarPage.emptyDescription",
                {
                  defaultValue:
                    "Try another visible range or clear one of the active filters.",
                },
              )}
              variant="appointment"
              onRangeChange={setCalendarRange}
              onEventSelect={(event) => {
                setSelectedAppointmentId(event.id);
                setDetailsDialogOpen(true);
              }}
              onDayMarkerSelect={(marker) => {
                setSelectedAppointmentId(marker.appointmentId);
                setDetailsDialogOpen(true);
              }}
              onDateSelect={(date) =>
                navigate(
                  `/appointments/create?date=${format(date, "yyyy-MM-dd")}`,
                )
              }
            />
          )}
        </div>

        <div className="space-y-6 2xl:col-span-4">
          <AppointmentQuickView
            appointment={selectedAppointment}
            onView={(appointment) =>
              navigate(`/appointments/${appointment.id}`)
            }
            onEdit={(appointment) =>
              navigate(`/appointments/edit/${appointment.id}`)
            }
            onReschedule={openRescheduleDialog}
            onAttend={openAttendDialog}
            onCancel={openCancelDialog}
            isAttendPending={attendAppointment.isPending}
            isCancelPending={cancelAppointment.isPending}
            isReschedulePending={rescheduleAppointment.isPending}
            className="operations-side-panel 2xl:sticky 2xl:top-4"
          />
        </div>
      </section>

      <AppointmentQuickViewDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        appointment={selectedAppointment}
        onView={(appointment) => navigate(`/appointments/${appointment.id}`)}
        onEdit={(appointment) =>
          navigate(`/appointments/edit/${appointment.id}`)
        }
        onReschedule={openRescheduleDialog}
        onAttend={openAttendDialog}
        onCancel={openCancelDialog}
        isAttendPending={attendAppointment.isPending}
        isCancelPending={cancelAppointment.isPending}
        isReschedulePending={rescheduleAppointment.isPending}
      />

      <ActionDialog
        open={attendCandidate !== null}
        onOpenChange={(open) => {
          if (!open) {
            setAttendCandidate(null);
            setAttendNotes("");
          }
        }}
        appointment={attendCandidate}
        title={t("appointments.attendTitle", {
          defaultValue: "Mark as Attended",
        })}
        description={t("appointments.calendarPage.attendDescription", {
          defaultValue:
            "Mark this appointment as attended and optionally add a note before converting it into the event workflow.",
        })}
        value={attendNotes}
        onChange={setAttendNotes}
        onSubmit={() => {
          if (!attendCandidate) return;

          attendAppointment.mutate(
            {
              id: attendCandidate.id,
              values: {
                notes: attendNotes.trim() || undefined,
              },
            },
            {
              onSuccess: () => {
                setAttendCandidate(null);
                setAttendNotes("");
              },
            },
          );
        }}
        isPending={attendAppointment.isPending}
        confirmLabel={t("appointments.attend", { defaultValue: "Attend" })}
      />

      <CancelDialog
        open={cancelCandidate !== null}
        onOpenChange={(open) => {
          if (!open) {
            setCancelCandidate(null);
          }
        }}
        appointment={cancelCandidate}
        reason={cancelReason}
        notes={cancelNotes}
        onReasonChange={setCancelReason}
        onNotesChange={setCancelNotes}
        onSubmit={() => {
          if (!cancelCandidate) return;

          cancelAppointment.mutate(
            {
              id: cancelCandidate.id,
              values: {
                reason: cancelReason.trim() || undefined,
                notes: cancelNotes.trim() || undefined,
              },
            },
            {
              onSuccess: () => {
                setCancelCandidate(null);
                setCancelReason("");
                setCancelNotes("");
              },
            },
          );
        }}
        isPending={cancelAppointment.isPending}
      />

      <RescheduleDialog
        open={rescheduleCandidate !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRescheduleCandidate(null);
          }
        }}
        appointment={rescheduleCandidate}
        appointmentDate={rescheduleDate}
        startTime={rescheduleStartTime}
        endTime={rescheduleEndTime}
        notes={rescheduleNotes}
        onAppointmentDateChange={setRescheduleDate}
        onStartTimeChange={setRescheduleStartTime}
        onEndTimeChange={setRescheduleEndTime}
        onNotesChange={setRescheduleNotes}
        onSubmit={() => {
          if (!rescheduleCandidate) return;

          rescheduleAppointment.mutateReschedule(
            {
              id: rescheduleCandidate.id,
              values: {
                appointmentDate: rescheduleDate,
                startTime: rescheduleStartTime,
                endTime: rescheduleEndTime.trim(),
                notes: rescheduleNotes,
              },
            },
            {
              onSuccess: () => {
                setRescheduleCandidate(null);
                setRescheduleDate("");
                setRescheduleStartTime("");
                setRescheduleEndTime("");
                setRescheduleNotes("");
              },
            },
          );
        }}
        isPending={rescheduleAppointment.isPending}
      />
    </>
  );
}
