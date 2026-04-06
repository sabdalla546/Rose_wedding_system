import { format } from "date-fns";
import { CalendarClock } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  AppCalendar,
  type AppCalendarHandle,
} from "@/components/calendar/app-calendar";
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
  useCancelAppointment,
  useConfirmAppointment,
  useRescheduleAppointment,
} from "@/hooks/appointments/useAppointmentActions";
import { useAppointmentsCalendarView } from "@/hooks/appointments/useAppointmentsCalendarView";
import { useCustomers } from "@/hooks/customers/useCustomers";
import { APPOINTMENT_STATUS_OPTIONS } from "@/pages/appointments/adapters";
import type { Appointment } from "@/pages/appointments/types";

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

type AppointmentsCalendarViewProps = {
  active: boolean;
};

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
          <Button
            type="button"
            onClick={onSubmit}
            disabled={isPending || !appointment}
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

export function AppointmentsCalendarView({
  active,
}: AppointmentsCalendarViewProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const calendarRef = useRef<AppCalendarHandle | null>(null);
  const {
    items,
    calendarEvents,
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

  const confirmAppointment = useConfirmAppointment();
  const cancelAppointment = useCancelAppointment();
  const rescheduleAppointment = useRescheduleAppointment();
  const { data: customersResponse } = useCustomers({
    currentPage: 1,
    itemsPerPage: 200,
    searchQuery: "",
    status: "all",
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

  const selectedAppointment = useMemo(() => {
    if (!items.length) {
      return null;
    }

    if (selectedAppointmentId) {
      const matchedItem =
        items.find((item) => String(item.id) === selectedAppointmentId) ?? null;

      if (matchedItem) {
        return matchedItem;
      }
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

    if (!query) {
      return customerOptions;
    }

    return customerOptions.filter((option) =>
      option.label.toLowerCase().includes(query),
    );
  }, [customerOptions, customerSearch]);

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
                  defaultValue:
                    "Search customers, notes, or mobile numbers...",
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
            onConfirm={(appointment) =>
              confirmAppointment.mutate({ id: appointment.id, values: {} })
            }
            onCancel={openCancelDialog}
            isConfirmPending={confirmAppointment.isPending}
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
    </>
  );
}
