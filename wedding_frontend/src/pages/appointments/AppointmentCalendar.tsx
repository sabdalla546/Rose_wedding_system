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
import { CalendarFilterBar } from "@/components/calendar/calendar-filter-bar";
import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import { AppDialogFooter, AppDialogHeader, AppDialogShell } from "@/components/shared/app-dialog";
import {
  CrudFilterField,
  CrudFilterPill,
  CrudPageLayout,
} from "@/components/shared/crud-layout";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SummaryCard } from "@/components/dashboard/summary-card";
import type { AppCalendarView } from "@/components/calendar/types";
import type { CalendarDatePreset } from "@/features/calendar/calendar-range";
import {
  AppointmentQuickView,
  AppointmentQuickViewDialog,
} from "@/features/appointments/appointment-calendar-quick-view";
import {
  buildAppointmentCalendarSummary,
  getAppointmentCalendarLegendItems,
} from "@/features/appointments/appointment-calendar";
import {
  useCancelAppointment,
  useConfirmAppointment,
  useRescheduleAppointment,
} from "@/hooks/appointments/useAppointmentActions";
import { useAppointmentsCalendarView } from "@/hooks/appointments/useAppointmentsCalendarView";
import { useCustomers } from "@/hooks/customers/useCustomers";
import { useUsers } from "@/hooks/users/useUsers";
import { cn } from "@/lib/utils";
import { APPOINTMENT_STATUS_OPTIONS } from "@/pages/appointments/adapters";
import type { Appointment } from "@/pages/appointments/types";

const DATE_PRESET_OPTIONS: Array<{ value: CalendarDatePreset; label: string }> = [
  { value: "all", label: "All dates" },
  { value: "today", label: "Today" },
  { value: "7d", label: "Next 7 days" },
  { value: "30d", label: "Next 30 days" },
];

const VIEW_OPTIONS: Array<{
  value: AppCalendarView;
  label: string;
  icon: typeof Table2;
}> = [
  { value: "month", label: "Month", icon: Table2 },
  { value: "week", label: "Week", icon: TableProperties },
  { value: "day", label: "Day", icon: CalendarDays },
  { value: "list", label: "Agenda", icon: List },
];

const INITIAL_FILTERS = {
  search: "",
  status: "all" as const,
  assignedUserId: "all",
  customerId: "all",
  datePreset: "all" as CalendarDatePreset,
};

const textareaClassName =
  "min-h-[110px] w-full rounded-[18px] border px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[color:color-mix(in_srgb,var(--color-primary)_14%,transparent)]";

type ActionTarget = Appointment | null;

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
              onChange={(event) => onEndTimeChange(event.target.value)}
              disabled={isPending || !appointment}
              className="sm:col-span-2"
            />
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
          <Button type="button" onClick={onSubmit} disabled={isPending || !appointment}>
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
          <Button type="button" onClick={onSubmit} disabled={isPending || !appointment}>
            {t("appointments.cancel", { defaultValue: "Cancel" })}
          </Button>
        </AppDialogFooter>
      </AppDialogShell>
    </Dialog>
  );
}

export default function AppointmentCalendarPage() {
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
  } = useAppointmentsCalendarView();
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [calendarHeader, setCalendarHeader] = useState<{
    title: string;
    view: AppCalendarView;
  }>({
    title: "",
    view: "week",
  });
  const [cancelCandidate, setCancelCandidate] = useState<ActionTarget>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelNotes, setCancelNotes] = useState("");
  const [rescheduleCandidate, setRescheduleCandidate] = useState<ActionTarget>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleStartTime, setRescheduleStartTime] = useState("");
  const [rescheduleEndTime, setRescheduleEndTime] = useState("");
  const [rescheduleNotes, setRescheduleNotes] = useState("");

  const confirmAppointment = useConfirmAppointment();
  const cancelAppointment = useCancelAppointment();
  const rescheduleAppointment = useRescheduleAppointment();
  const { data: usersResponse } = useUsers({
    currentPage: 1,
    itemsPerPage: 200,
    searchQuery: "",
  });
  const { data: customersResponse } = useCustomers({
    currentPage: 1,
    itemsPerPage: 200,
    searchQuery: "",
    status: "all",
  });

  useEffect(() => {
    if (!items.length) {
      setSelectedAppointmentId(null);
      return;
    }

    if (!selectedAppointmentId || !items.some((item) => String(item.id) === selectedAppointmentId)) {
      setSelectedAppointmentId(String(items[0].id));
    }
  }, [items, selectedAppointmentId]);

  const selectedAppointment = useMemo(
    () => items.find((item) => String(item.id) === selectedAppointmentId) ?? null,
    [items, selectedAppointmentId],
  );

  const assignedUserOptions = useMemo(
    () =>
      (usersResponse?.data ?? []).map((user) => ({
        value: String(user.id),
        label: user.fullName,
      })),
    [usersResponse?.data],
  );

  const customerOptions = useMemo(
    () =>
      (customersResponse?.data ?? []).map((customer) => ({
        value: String(customer.id),
        label: customer.fullName,
      })),
    [customersResponse?.data],
  );

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

  return (
    <ProtectedComponent permission="appointments.calendar.read">
      <CrudPageLayout>
        <SectionCard className="space-y-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
                {t("appointments.calendarPage.eyebrow", {
                  defaultValue: "Appointments Calendar",
                })}
              </p>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-[var(--color-text)]">
                  {t("appointments.calendarPage.title", {
                    defaultValue: "Appointments Calendar",
                  })}
                </h1>
                <p className="max-w-3xl text-sm leading-6 text-[var(--color-text-subtle)]">
                  {t("appointments.calendarPage.description", {
                    defaultValue:
                      "Lightweight scheduling calendar for appointments, meetings, and follow-up management.",
                  })}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 xl:justify-end">
              <Button variant="outline" onClick={() => navigate("/appointments")}>
                {t("appointments.backToAppointments", {
                  defaultValue: "Back to Appointments",
                })}
              </Button>
              <ProtectedComponent permission="appointments.create">
                <Button onClick={() => navigate("/appointments/create")}>
                  <CalendarRange className="h-4 w-4" />
                  {t("appointments.create", { defaultValue: "Create Appointment" })}
                </Button>
              </ProtectedComponent>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                {t("appointments.calendarPage.visibleRange", {
                  defaultValue: "Visible Range",
                })}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-semibold text-[var(--color-text)]">
                  {calendarHeader.title ||
                    t("appointments.calendarPage.loadingWindow", {
                      defaultValue: "Loading schedule window...",
                    })}
                </h2>
                <span
                  className="inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-subtle)]"
                  style={{
                    borderColor: "var(--color-border)",
                    background: "var(--color-surface-2)",
                  }}
                >
                  {t(`calendar.view.${calendarHeader.view}`, {
                    defaultValue:
                      VIEW_OPTIONS.find((option) => option.value === calendarHeader.view)?.label ??
                      calendarHeader.view,
                  })}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center lg:justify-end">
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="outline" onClick={() => calendarRef.current?.today()}>
                  {t("calendar.today", { defaultValue: "Today" })}
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  onClick={() => calendarRef.current?.previous()}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  onClick={() => calendarRef.current?.next()}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {VIEW_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const active = calendarHeader.view === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={cn(
                        "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition",
                        active
                          ? "text-[var(--color-primary-foreground)]"
                          : "text-[var(--color-text-subtle)] hover:text-[var(--color-text)]",
                      )}
                      style={
                        active
                          ? {
                              background: "var(--color-primary)",
                              borderColor: "var(--color-primary)",
                            }
                          : {
                              background: "var(--color-surface-2)",
                              borderColor: "var(--color-border)",
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
          </div>
        </SectionCard>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {summaryItems.map((summary) => (
            <SummaryCard
              key={summary.id}
              label={summary.label}
              value={summary.value}
              hint={summary.hint}
              className="space-y-2 border-[var(--color-border)] shadow-none"
            />
          ))}
        </section>

        <CalendarFilterBar
          title={t("common.filters", { defaultValue: "Filters" })}
          description={t("appointments.calendarPage.filtersDescription", {
            defaultValue:
              "Quick appointment filters for search, status, assignment, customer, and date preset.",
          })}
          actions={
            <>
              <CrudFilterPill
                label={t("appointments.activeFiltersCount", {
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
                {t("appointments.clearFilters", { defaultValue: "Clear Filters" })}
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="crud-form-grid xl:grid-cols-5">
              <CrudFilterField
                label={t("appointments.calendarPage.searchLabel", {
                  defaultValue: "Search",
                })}
              >
                <Input
                  value={filters.search}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      search: event.target.value,
                    }))
                  }
                  placeholder={t("appointments.calendarPage.searchPlaceholder", {
                    defaultValue:
                      "Search customers, notes, mobile numbers, or assigned users...",
                  })}
                />
              </CrudFilterField>

              <CrudFilterField
                label={t("appointments.statusLabel", { defaultValue: "Status" })}
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
                    {t("appointments.allStatuses", { defaultValue: "All Statuses" })}
                  </option>
                  {APPOINTMENT_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {t(`appointments.status.${option.value}`, {
                        defaultValue: option.label,
                      })}
                    </option>
                  ))}
                </select>
              </CrudFilterField>

              <CrudFilterField
                label={t("appointments.assignedUser", {
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
                    {t("appointments.calendarPage.allAssignedUsers", {
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

              <CrudFilterField
                label={t("appointments.customer", { defaultValue: "Customer" })}
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
                    {t("appointments.calendarPage.allCustomers", {
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
                label={t("appointments.calendarPage.datePreset", {
                  defaultValue: "Date Preset",
                })}
              >
                <select
                  className="app-native-select h-10 rounded-xl text-[13px]"
                  value={filters.datePreset}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      datePreset: event.target.value as CalendarDatePreset,
                    }))
                  }
                >
                  {DATE_PRESET_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {t(`calendar.filters.${option.value}`, {
                        defaultValue: option.label,
                      })}
                    </option>
                  ))}
                </select>
              </CrudFilterField>
            </div>
          </div>
        </CalendarFilterBar>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.78fr)]">
          <div className="space-y-6">
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
                locale={i18n.language === "ar" ? "ar" : "en"}
                events={calendarEvents}
                initialView="week"
                loading={isLoading || isFetching}
                legends={getAppointmentCalendarLegendItems(t)}
                emptyTitle={t("appointments.calendarPage.emptyTitle", {
                  defaultValue: "No appointments in this range",
                })}
                emptyDescription={t("appointments.calendarPage.emptyDescription", {
                  defaultValue:
                    "Try another visible range or clear one of the active filters.",
                })}
                hideToolbar
                variant="appointment"
                onStateChange={setCalendarHeader}
                onRangeChange={setCalendarRange}
                onEventSelect={(event) => {
                  setSelectedAppointmentId(event.id);
                  setDetailsDialogOpen(true);
                }}
                onDateSelect={(date) =>
                  navigate(`/appointments/create?date=${format(date, "yyyy-MM-dd")}`)
                }
              />
            )}
          </div>

          <div className="space-y-6">
            <AppointmentQuickView
              appointment={selectedAppointment}
              onView={(appointment) => navigate(`/appointments/${appointment.id}`)}
              onEdit={(appointment) => navigate(`/appointments/edit/${appointment.id}`)}
              onReschedule={openRescheduleDialog}
              onConfirm={(appointment) =>
                confirmAppointment.mutate({ id: appointment.id, values: {} })
              }
              onCancel={openCancelDialog}
              isConfirmPending={confirmAppointment.isPending}
              isCancelPending={cancelAppointment.isPending}
              isReschedulePending={rescheduleAppointment.isPending}
            />
          </div>
        </section>

        <AppointmentQuickViewDialog
          open={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
          appointment={selectedAppointment}
          onView={(appointment) => navigate(`/appointments/${appointment.id}`)}
          onEdit={(appointment) => navigate(`/appointments/edit/${appointment.id}`)}
          onReschedule={openRescheduleDialog}
          onConfirm={(appointment) =>
            confirmAppointment.mutate({ id: appointment.id, values: {} })
          }
          onCancel={openCancelDialog}
          isConfirmPending={confirmAppointment.isPending}
          isCancelPending={cancelAppointment.isPending}
          isReschedulePending={rescheduleAppointment.isPending}
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
            if (!cancelCandidate) {
              return;
            }

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
            if (!rescheduleCandidate) {
              return;
            }

            rescheduleAppointment.mutateReschedule(
              {
                id: rescheduleCandidate.id,
                values: {
                  appointmentDate: rescheduleDate,
                  startTime: rescheduleStartTime,
                  endTime: rescheduleEndTime,
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
      </CrudPageLayout>
    </ProtectedComponent>
  );
}
