import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  CalendarFilterField,
  CalendarFilterGroup,
  CalendarFilterPanel,
  CalendarFilterPill,
} from "@/components/calendar/calendar-filter-panel";
import TableHeader from "@/components/common/TableHeader";
import ConfirmDialog from "@/components/ui/confirmDialog";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import Pagination from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import {
  useCancelAppointment,
  useCompleteAppointment,
  useConfirmAppointment,
  useRescheduleAppointment,
} from "@/hooks/appointments/useAppointmentActions";
import { useAppointments } from "@/hooks/appointments/useAppointments";
import { useDeleteAppointment } from "@/hooks/appointments/useDeleteAppointment";
import { useCustomers } from "@/hooks/customers/useCustomers";

import { useAppointmentsColumns } from "../_components/appointmentsColumns";
import {
  APPOINTMENT_STATUS_OPTIONS,
  toTableAppointments,
  type TableAppointment,
} from "../adapters";

const textareaClassName =
  "min-h-[110px] w-full rounded-[22px] border px-4 py-3 text-sm text-[var(--lux-text)] placeholder:text-[var(--lux-text-muted)] outline-none transition-all focus:border-[var(--lux-gold-border)] focus:ring-2 focus:ring-[var(--lux-gold-glow)]";

const filterFieldClassName =
  "h-11 w-full rounded-xl border px-3 text-sm text-[var(--lux-text)] outline-none transition focus:border-[var(--lux-gold-border)]";

const fieldStyle = {
  background: "var(--lux-control-surface)",
  borderColor: "var(--lux-control-border)",
} as const;

export function AppointmentsTableView() {
  const { t } = useTranslation();

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [statusFilter, setStatusFilter] = useState<
    "all" | TableAppointment["status"]
  >("all");
  const [customerFilter, setCustomerFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [deleteCandidate, setDeleteCandidate] =
    useState<TableAppointment | null>(null);
  const [confirmCandidate, setConfirmCandidate] =
    useState<TableAppointment | null>(null);
  const [completeCandidate, setCompleteCandidate] =
    useState<TableAppointment | null>(null);
  const [cancelCandidate, setCancelCandidate] =
    useState<TableAppointment | null>(null);
  const [rescheduleCandidate, setRescheduleCandidate] =
    useState<TableAppointment | null>(null);

  const [actionNotes, setActionNotes] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleStartTime, setRescheduleStartTime] = useState("");
  const [rescheduleEndTime, setRescheduleEndTime] = useState("");

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setSearchQuery(searchTerm.trim());
    }, 300);

    return () => window.clearTimeout(handle);
  }, [searchTerm]);

  const { data, isLoading } = useAppointments({
    currentPage,
    itemsPerPage,
    status: statusFilter,
    customerId: customerFilter,
    search: searchQuery,
    dateFrom,
    dateTo,
  });
  const { data: customersResponse } = useCustomers({
    currentPage: 1,
    itemsPerPage: 200,
    searchQuery: "",
    status: "all",
  });

  const deleteMutation = useDeleteAppointment();
  const confirmMutation = useConfirmAppointment();
  const completeMutation = useCompleteAppointment();
  const cancelMutation = useCancelAppointment();
  const rescheduleMutation = useRescheduleAppointment();

  const adapted = useMemo(() => toTableAppointments(data), [data]);
  const customers = customersResponse?.data ?? [];
  const appointments = adapted.data.appointments;
  const activeFiltersCount = [
    Boolean(searchTerm.trim()),
    statusFilter !== "all",
    Boolean(customerFilter),
    Boolean(dateFrom),
    Boolean(dateTo),
  ].filter(Boolean).length;
  const activeFilterPills = [
    searchTerm.trim() ? (
      <CalendarFilterPill key="search" label={searchTerm.trim()} />
    ) : null,
    statusFilter !== "all" ? (
      <CalendarFilterPill
        key="status"
        label={t(`appointments.status.${statusFilter}`, {
          defaultValue: statusFilter,
        })}
      />
    ) : null,
    customerFilter ? (
      <CalendarFilterPill
        key="customer"
        label={
          customers.find((customer) => String(customer.id) === customerFilter)
            ?.fullName ?? customerFilter
        }
      />
    ) : null,
    dateFrom ? (
      <CalendarFilterPill
        key="date-from"
        label={`${t("common.from", { defaultValue: "From" })}: ${dateFrom}`}
      />
    ) : null,
    dateTo ? (
      <CalendarFilterPill
        key="date-to"
        label={`${t("common.to", { defaultValue: "To" })}: ${dateTo}`}
      />
    ) : null,
  ].filter(Boolean);

  const columns = useAppointmentsColumns({
    onDelete: setDeleteCandidate,
    onConfirm: (appointment) => {
      setActionNotes(appointment.notes || "");
      setConfirmCandidate(appointment);
    },
    onComplete: (appointment) => {
      setActionNotes(appointment.notes || "");
      setCompleteCandidate(appointment);
    },
    onCancel: (appointment) => {
      setActionNotes(appointment.notes || "");
      setCancelReason("");
      setCancelCandidate(appointment);
    },
    onReschedule: (appointment) => {
      setRescheduleDate(appointment.appointmentDate);
      setRescheduleStartTime(appointment.startTime);
      setRescheduleEndTime(appointment.endTime || "");
      setActionNotes(appointment.notes || "");
      setRescheduleCandidate(appointment);
    },
    editPermission: "appointments.update",
    deletePermission: "appointments.delete",
  });
  const resetFilters = () => {
    setStatusFilter("all");
    setCustomerFilter("");
    setSearchTerm("");
    setSearchQuery("");
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
  };

  return (
    <>
      <CalendarFilterPanel
        title={t("common.filters")}
        description={t("appointments.tablePage.filtersDescription")}
        activeFiltersLabel={t("appointments.activeFiltersCount", {
          count: activeFiltersCount,
        })}
        activeFiltersCount={activeFiltersCount}
        clearLabel={t("appointments.clearFilters")}
        onClear={resetFilters}
        showLabel={t("appointments.showFilters")}
        hideLabel={t("appointments.hideFilters")}
        pills={activeFilterPills.length ? activeFilterPills : undefined}
      >
        <CalendarFilterGroup
          className="xl:col-span-8"
          title={t("appointments.primaryFilters")}
          description={t("appointments.tablePage.primaryFiltersHint")}
        >
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-2">
            <CalendarFilterField
              label={t("appointments.calendarPage.searchLabel")}
            >
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--lux-text-muted)]" />
                <Input
                  className={`${filterFieldClassName} pl-10`}
                  style={fieldStyle}
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder={t("appointments.searchPlaceholder")}
                />
              </div>
            </CalendarFilterField>

            <CalendarFilterField
              label={t("appointments.statusLabel")}
            >
              <select
                className={filterFieldClassName}
                style={fieldStyle}
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(
                    event.target.value as "all" | TableAppointment["status"],
                  );
                  setCurrentPage(1);
                }}
              >
                <option value="all">{t("appointments.allStatuses")}</option>
                {APPOINTMENT_STATUS_OPTIONS.map((status) => (
                  <option key={status.value} value={status.value}>
                    {t(`appointments.status.${status.value}`, {
                      defaultValue: status.label,
                    })}
                  </option>
                ))}
              </select>
            </CalendarFilterField>

            <CalendarFilterField
              label={t("appointments.customer")}
            >
              <select
                className={filterFieldClassName}
                style={fieldStyle}
                value={customerFilter}
                onChange={(event) => {
                  setCustomerFilter(event.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">{t("appointments.allCustomers")}</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={String(customer.id)}>
                    {customer.fullName}
                  </option>
                ))}
              </select>
            </CalendarFilterField>
          </div>
        </CalendarFilterGroup>

        <CalendarFilterGroup
          className="xl:col-span-4"
          title={t("appointments.dateFilters")}
          description={t("appointments.tablePage.dateFiltersHint")}
        >
          <div className="grid grid-cols-1 gap-2.5">
            <CalendarFilterField
              label={t("common.from", { defaultValue: "From" })}
            >
              <Input
                type="date"
                className={filterFieldClassName}
                style={fieldStyle}
                value={dateFrom}
                onChange={(event) => {
                  setDateFrom(event.target.value);
                  setCurrentPage(1);
                }}
              />
            </CalendarFilterField>

            <CalendarFilterField label={t("common.to", { defaultValue: "To" })}>
              <Input
                type="date"
                className={filterFieldClassName}
                style={fieldStyle}
                value={dateTo}
                onChange={(event) => {
                  setDateTo(event.target.value);
                  setCurrentPage(1);
                }}
              />
            </CalendarFilterField>
          </div>
        </CalendarFilterGroup>
      </CalendarFilterPanel>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <TableHeader
          title={t("appointments.listTitle")}
          totalItems={adapted.total}
          currentCount={appointments.length}
          entityName={t("appointments.title")}
          itemsPerPage={itemsPerPage}
          setItemsPerPage={setItemsPerPage}
          setCurrentPage={setCurrentPage}
        />

        <DataTable
          columns={columns}
          data={appointments}
          rowNumberStart={(currentPage - 1) * itemsPerPage + 1}
          enableRowNumbers
          isLoading={isLoading}
          fileName="appointments"
        />

        {adapted.totalPages > 1 ? (
          <div className="border-t border-border bg-muted/40 px-6 py-4">
            <Pagination
              currentPage={currentPage}
              totalPages={adapted.totalPages}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(value: number) => {
                setItemsPerPage(value);
                setCurrentPage(1);
              }}
            />
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        open={deleteCandidate !== null}
        onOpenChange={(open) => !open && setDeleteCandidate(null)}
        title={t("appointments.deleteTitle")}
        message={t("appointments.deleteMessage")}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        onConfirm={() =>
          deleteCandidate &&
          deleteMutation.mutate(deleteCandidate.id, {
            onSettled: () => setDeleteCandidate(null),
          })
        }
        isPending={deleteMutation.isPending}
      />

      <ActionDialog
        open={confirmCandidate !== null}
        onOpenChange={(open) => !open && setConfirmCandidate(null)}
        title={t("appointments.confirmTitle")}
        value={actionNotes}
        onChange={setActionNotes}
        onConfirm={() =>
          confirmCandidate &&
          confirmMutation.mutate(
            { id: confirmCandidate.id, values: { notes: actionNotes } },
            { onSuccess: () => setConfirmCandidate(null) },
          )
        }
        isPending={confirmMutation.isPending}
        confirmLabel={t("appointments.confirm")}
      />

      <ActionDialog
        open={completeCandidate !== null}
        onOpenChange={(open) => !open && setCompleteCandidate(null)}
        title={t("appointments.completeTitle")}
        value={actionNotes}
        onChange={setActionNotes}
        onConfirm={() =>
          completeCandidate &&
          completeMutation.mutate(
            { id: completeCandidate.id, values: { notes: actionNotes } },
            { onSuccess: () => setCompleteCandidate(null) },
          )
        }
        isPending={completeMutation.isPending}
        confirmLabel={t("appointments.complete")}
      />

      <Dialog
        open={cancelCandidate !== null}
        onOpenChange={(open) => !open && setCancelCandidate(null)}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t("appointments.cancelTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              placeholder={t("appointments.cancelReasonPlaceholder")}
            />
            <textarea
              className={textareaClassName}
              value={actionNotes}
              onChange={(event) => setActionNotes(event.target.value)}
              style={{
                background: "var(--lux-control-surface)",
                borderColor: "var(--lux-control-border)",
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelCandidate(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() =>
                cancelCandidate &&
                cancelMutation.mutate(
                  {
                    id: cancelCandidate.id,
                    values: { reason: cancelReason, notes: actionNotes },
                  },
                  { onSuccess: () => setCancelCandidate(null) },
                )
              }
              disabled={cancelMutation.isPending}
            >
              {t("appointments.cancelAction")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={rescheduleCandidate !== null}
        onOpenChange={(open) => !open && setRescheduleCandidate(null)}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t("appointments.rescheduleTitle")}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              type="date"
              value={rescheduleDate}
              onChange={(event) => setRescheduleDate(event.target.value)}
            />
            <Input
              type="time"
              value={rescheduleStartTime}
              onChange={(event) => setRescheduleStartTime(event.target.value)}
            />
            <Input
              type="time"
              value={rescheduleEndTime}
              onChange={(event) => setRescheduleEndTime(event.target.value)}
            />
            <textarea
              className={`${textareaClassName} md:col-span-2`}
              value={actionNotes}
              onChange={(event) => setActionNotes(event.target.value)}
              style={{
                background: "var(--lux-control-surface)",
                borderColor: "var(--lux-control-border)",
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRescheduleCandidate(null)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() =>
                rescheduleCandidate &&
                rescheduleMutation.mutateReschedule(
                  {
                    id: rescheduleCandidate.id,
                    values: {
                      appointmentDate: rescheduleDate,
                      startTime: rescheduleStartTime,
                      endTime: rescheduleEndTime,
                      notes: actionNotes,
                    },
                  },
                  { onSuccess: () => setRescheduleCandidate(null) },
                )
              }
              disabled={rescheduleMutation.isPending}
            >
              {t("appointments.reschedule")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ActionDialog({
  open,
  onOpenChange,
  title,
  value,
  onChange,
  onConfirm,
  isPending,
  confirmLabel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  value: string;
  onChange: (value: string) => void;
  onConfirm: () => void;
  isPending: boolean;
  confirmLabel: string;
}) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <textarea
          className={textareaClassName}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          style={{
            background: "var(--lux-control-surface)",
            borderColor: "var(--lux-control-border)",
          }}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel", { defaultValue: "Cancel" })}
          </Button>
          <Button onClick={onConfirm} disabled={isPending}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
