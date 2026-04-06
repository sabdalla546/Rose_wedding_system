import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  CheckCheck,
  Download,
  Filter,
  Search,
} from "lucide-react";
import api from "@/lib/axios";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { SummaryCard } from "@/components/dashboard/summary-card";
import { DataTableShell } from "@/components/shared/data-table-shell";
import { WorkflowModuleDashboard } from "@/components/workflow/workflow-module-dashboard";
import {
  WorkspaceFilterBar,
  WorkspaceFilterField,
  WorkspaceFilterPill,
} from "@/components/shared/workspace-filter-bar";
import { Button } from "@/components/ui/button";
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
import { buildAppointmentsTableSummary } from "@/features/appointments/appointment-calendar";
import {
  useCancelAppointment,
  useCompleteAppointment,
  useConfirmAppointment,
  useRescheduleAppointment,
} from "@/hooks/appointments/useAppointmentActions";
import { useAppointments } from "@/hooks/appointments/useAppointments";
import { useDeleteAppointment } from "@/hooks/appointments/useDeleteAppointment";
import { useCustomers } from "@/hooks/customers/useCustomers";
import { useAppointmentWorkflowSummary } from "@/hooks/workflow/useWorkflowSummaries";

import { useAppointmentsColumns } from "../_components/appointmentsColumns";
import {
  APPOINTMENT_STATUS_OPTIONS,
  toTableAppointments,
  type TableAppointment,
} from "../adapters";

const textareaClassName =
  "min-h-[110px] w-full rounded-[6px] border px-4 py-3 text-sm text-[var(--lux-text)] placeholder:text-[var(--lux-text-muted)] outline-none transition-all focus:border-[var(--lux-gold-border)] focus:ring-2 focus:ring-[var(--lux-gold-glow)]";

const filterFieldClassName =
  "h-11 w-full rounded-[6px] border px-3 text-sm text-[var(--lux-text)] outline-none transition focus:border-[var(--lux-gold-border)]";

const fieldStyle = {
  background: "var(--lux-control-surface)",
  borderColor: "var(--lux-control-border)",
} as const;

export function AppointmentsTableView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const workflowSummary = useAppointmentWorkflowSummary();

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
  const [isExportingPdf, setIsExportingPdf] = useState(false);
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
  const summaryItems = useMemo(
    () =>
      buildAppointmentsTableSummary(
        appointments,
        adapted.total,
        activeFiltersCount,
        t,
      ),
    [activeFiltersCount, adapted.total, appointments, t],
  );
  const activeFilterPills = [
    searchTerm.trim() ? (
      <WorkspaceFilterPill key="search" label={searchTerm.trim()} />
    ) : null,
    statusFilter !== "all" ? (
      <WorkspaceFilterPill
        key="status"
        label={t(`appointments.status.${statusFilter}`, {
          defaultValue: statusFilter,
        })}
      />
    ) : null,
    customerFilter ? (
      <WorkspaceFilterPill
        key="customer"
        label={
          customers.find((customer) => String(customer.id) === customerFilter)
            ?.fullName ?? customerFilter
        }
      />
    ) : null,
    dateFrom ? (
      <WorkspaceFilterPill
        key="date-from"
        label={`${t("common.from", { defaultValue: "From" })}: ${dateFrom}`}
      />
    ) : null,
    dateTo ? (
      <WorkspaceFilterPill
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
    onCreateEvent: (appointment) =>
      navigate(`/events/create?fromAppointmentId=${appointment.id}`),
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
  const handleExportPdf = async () => {
    try {
      setIsExportingPdf(true);

      const response = await api.get("/appointments/export/pdf", {
        params: {
          status: statusFilter === "all" ? undefined : statusFilter,
          customerId: customerFilter ? Number(customerFilter) : undefined,
          search: searchQuery?.trim() ? searchQuery.trim() : undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        },
        responseType: "blob",
      });

      const contentDisposition = response.headers["content-disposition"] as
        | string
        | undefined;

      const fileNameMatch = contentDisposition?.match(/filename="?(.*?)"?$/i);
      const fileName =
        fileNameMatch?.[1] ||
        `appointments-report-${new Date().toISOString().slice(0, 10)}.pdf`;

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export appointments PDF", error);
    } finally {
      setIsExportingPdf(false);
    }
  };
  return (
    <>
      <WorkflowModuleDashboard
        eyebrow={t("appointments.workflowDashboardEyebrow", {
          defaultValue: "Workflow Dashboard",
        })}
        title={t("appointments.workflowDashboard", {
          defaultValue: "Appointment Workflow Visibility",
        })}
        description={t("appointments.workflowDashboardHint", {
          defaultValue:
            "Track intake load, completed appointments ready for conversion, and blocked appointments before they disappear into the table.",
        })}
        statusesTitle={t("appointments.statusDistributionTitle", {
          defaultValue: "Status Distribution",
        })}
        statusesDescription={t("appointments.statusDistributionHint", {
          defaultValue:
            "Use these quick filters to jump into the current workflow queue.",
        })}
        metrics={[
          {
            id: "total",
            label: t("common.total", { defaultValue: "Total" }),
            value: workflowSummary.total,
            helper: t("appointments.totalAppointments", {
              defaultValue: "all appointments in the intake pipeline",
            }),
          },
          {
            id: "upcoming",
            label: t("appointments.upcomingLabel", {
              defaultValue: "Upcoming",
            }),
            value: workflowSummary.metrics.upcoming,
            helper: t("appointments.upcomingLabelHint", {
              defaultValue: "Scheduled, confirmed, and rescheduled appointments.",
            }),
          },
          {
            id: "ready",
            label: t("appointments.readyToConvertLabel", {
              defaultValue: "Ready To Convert",
            }),
            value: workflowSummary.metrics.readyToConvert,
            helper: t("appointments.readyToConvertLabelHint", {
              defaultValue: "Completed appointments can move into the event workflow.",
            }),
          },
          {
            id: "blocked",
            label: t("appointments.blockedLabel", {
              defaultValue: "Blocked",
            }),
            value: workflowSummary.metrics.blocked,
            helper: t("appointments.blockedLabelHint", {
              defaultValue: "Cancelled and no-show appointments.",
            }),
          },
        ]}
        statuses={[
          {
            key: "all",
            label: t("appointments.allStatuses", { defaultValue: "All Statuses" }),
            count: workflowSummary.total,
            active: statusFilter === "all",
            onClick: () => {
              setStatusFilter("all");
              setCurrentPage(1);
            },
          },
          {
            key: "scheduled",
            label: t("appointments.status.scheduled", { defaultValue: "Scheduled" }),
            count: workflowSummary.statusCounts.scheduled,
            active: statusFilter === "scheduled",
            onClick: () => {
              setStatusFilter("scheduled");
              setCurrentPage(1);
            },
          },
          {
            key: "confirmed",
            label: t("appointments.status.confirmed", { defaultValue: "Confirmed" }),
            count: workflowSummary.statusCounts.confirmed,
            active: statusFilter === "confirmed",
            onClick: () => {
              setStatusFilter("confirmed");
              setCurrentPage(1);
            },
          },
          {
            key: "completed",
            label: t("appointments.status.completed", { defaultValue: "Completed" }),
            count: workflowSummary.statusCounts.completed,
            active: statusFilter === "completed",
            onClick: () => {
              setStatusFilter("completed");
              setCurrentPage(1);
            },
          },
          {
            key: "converted",
            label: t("appointments.status.converted", { defaultValue: "Converted" }),
            count: workflowSummary.statusCounts.converted,
            active: statusFilter === "converted",
            onClick: () => {
              setStatusFilter("converted");
              setCurrentPage(1);
            },
          },
          {
            key: "cancelled",
            label: t("appointments.status.cancelled", { defaultValue: "Cancelled" }),
            count: workflowSummary.statusCounts.cancelled,
            active: statusFilter === "cancelled",
            onClick: () => {
              setStatusFilter("cancelled");
              setCurrentPage(1);
            },
          },
        ]}
        footer={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setStatusFilter("completed");
                setCurrentPage(1);
              }}
            >
              {t("appointments.focusReadyConversions", {
                defaultValue: "Focus ready conversions",
              })}
            </Button>
            <Button type="button" variant="outline" onClick={resetFilters}>
              {t("appointments.clearFilters", { defaultValue: "Clear Filters" })}
            </Button>
          </div>
        }
        loading={workflowSummary.isLoading}
        showContentLabel={t("appointments.showWorkflowDashboard", {
          defaultValue: "Show Dashboard",
        })}
        hideContentLabel={t("appointments.hideWorkflowDashboard", {
          defaultValue: "Hide Dashboard",
        })}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryItems.map((summary) => (
          <SummaryCard
            key={summary.id}
            label={summary.label}
            value={summary.value}
            hint={summary.hint}
            accent={
              summary.id === "total" ? (
                <CalendarClock className="h-4 w-4" />
              ) : summary.id === "open" ? (
                <CheckCheck className="h-4 w-4" />
              ) : (
                <Filter className="h-4 w-4" />
              )
            }
            className="workspace-summary-card"
          />
        ))}
      </section>

      <WorkspaceFilterBar
        title={t("common.filters")}
        description={t("appointments.tablePage.filtersDescription")}
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
            </WorkspaceFilterField>

            <WorkspaceFilterField label={t("appointments.statusLabel")}>
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
            </WorkspaceFilterField>

            <WorkspaceFilterField label={t("appointments.customer")}>
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
            </WorkspaceFilterField>

            <WorkspaceFilterField
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
            </WorkspaceFilterField>

            <WorkspaceFilterField
              label={t("common.to", { defaultValue: "To" })}
            >
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
            </WorkspaceFilterField>
          </>
        }
      />

      <DataTableShell
        title={t("appointments.listTitle")}
        totalItems={adapted.total}
        currentCount={appointments.length}
        entityName={t("appointments.title")}
        itemsPerPage={itemsPerPage}
        setItemsPerPage={setItemsPerPage}
        setCurrentPage={setCurrentPage}
        currentPage={currentPage}
        totalPages={adapted.totalPages}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(value: number) => {
          setItemsPerPage(value);
          setCurrentPage(1);
        }}
        headerActions={
          <Button
            type="button"
            variant="outline"
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {isExportingPdf
              ? t("common.loading", { defaultValue: "Loading..." })
              : t("appointments.exportPdf", { defaultValue: "Export PDF" })}
          </Button>
        }
        className="operations-table-shell"
      >
        <DataTable
          columns={columns}
          data={appointments}
          rowNumberStart={(currentPage - 1) * itemsPerPage + 1}
          enableRowNumbers
          isLoading={isLoading}
          fileName="appointments"
          emptyTitle={t("appointments.tablePage.emptyTitle", {
            defaultValue: "No appointments match these filters",
          })}
          emptyDescription={t("appointments.tablePage.emptyDescription", {
            defaultValue:
              "Try broadening the date window or clearing one of the filters.",
          })}
        />
      </DataTableShell>

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
