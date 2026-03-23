import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PageContainer } from "@/components/layout/page-container";
import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import ConfirmDialog from "@/components/ui/confirmDialog";
import TableHeader from "@/components/common/TableHeader";
import Pagination from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppointments } from "@/hooks/appointments/useAppointments";
import {
  useCancelAppointment,
  useCompleteAppointment,
  useConfirmAppointment,
  useRescheduleAppointment,
} from "@/hooks/appointments/useAppointmentActions";
import { useDeleteAppointment } from "@/hooks/appointments/useDeleteAppointment";
import { useCustomers } from "@/hooks/customers/useCustomers";
import {
  APPOINTMENT_STATUS_OPTIONS,
  toTableAppointments,
  type TableAppointment,
} from "./adapters";
import { useAppointmentsColumns } from "./_components/appointmentsColumns";

const textareaClassName =
  "min-h-[110px] w-full rounded-[22px] border px-4 py-3 text-sm text-[var(--lux-text)] placeholder:text-[var(--lux-text-muted)] outline-none transition-all focus:border-[var(--lux-gold-border)] focus:ring-2 focus:ring-[var(--lux-gold-glow)]";

const AppointmentsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [statusFilter, setStatusFilter] = useState<
    "all" | TableAppointment["status"]
  >("all");
  const [customerFilter, setCustomerFilter] = useState("");
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

  const { data, isLoading } = useAppointments({
    currentPage,
    itemsPerPage,
    status: statusFilter,
    customerId: customerFilter,
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
  const appointments = adapted.data.appointments.filter((appointment) => {
    if (!searchQuery.trim()) {
      return true;
    }

    const search = searchQuery.toLowerCase();
    return (
      appointment.customerName.toLowerCase().includes(search) ||
      appointment.customer?.mobile?.toLowerCase().includes(search) ||
      appointment.notes?.toLowerCase().includes(search)
    );
  });

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

  return (
    <ProtectedComponent permission="appointments.read">
      <PageContainer className="space-y-6 pb-4 pt-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--lux-heading)]">
              {t("appointments.title", { defaultValue: "Appointments" })}
            </h1>
            <p className="text-sm text-[var(--lux-text-secondary)]">
              {t("appointments.coreFlowHint", {
                defaultValue:
                  "Appointments now carry only scheduling details and link back to customers.",
              })}
            </p>
          </div>

          <ProtectedComponent permission="appointments.create">
            <Button onClick={() => navigate("/appointments/create")}>
              <Plus className="h-4 w-4" />
              {t("appointments.create", { defaultValue: "Create Appointment" })}
            </Button>
          </ProtectedComponent>
        </div>

        <div className="grid gap-4 rounded-[24px] border p-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="relative xl:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--lux-text-muted)]" />
            <Input
              className="pl-10"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={t("appointments.searchPlaceholder", {
                defaultValue: "Search by customer, mobile, or notes",
              })}
            />
          </div>
          <select
            className="h-10 rounded-xl border px-3 text-sm"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(
                event.target.value as "all" | TableAppointment["status"],
              );
              setCurrentPage(1);
            }}
          >
            <option value="all">
              {t("appointments.allStatuses", { defaultValue: "All Statuses" })}
            </option>
            {APPOINTMENT_STATUS_OPTIONS.map((status) => (
              <option key={status.value} value={status.value}>
                {t(`appointments.status.${status.value}`, {
                  defaultValue: status.label,
                })}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-xl border px-3 text-sm"
            value={customerFilter}
            onChange={(event) => {
              setCustomerFilter(event.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">
              {t("appointments.allCustomers", {
                defaultValue: "All Customers",
              })}
            </option>
            {customers.map((customer) => (
              <option key={customer.id} value={String(customer.id)}>
                {customer.fullName}
              </option>
            ))}
          </select>
          <Input
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
          />
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <TableHeader
            title={t("appointments.listTitle", {
              defaultValue: "Appointments List",
            })}
            totalItems={adapted.total}
            currentCount={appointments.length}
            entityName={t("appointments.title", {
              defaultValue: "Appointments",
            })}
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
          title={t("appointments.deleteTitle", {
            defaultValue: "Delete Appointment",
          })}
          message={t("appointments.deleteMessage", {
            defaultValue: "Are you sure you want to delete this appointment?",
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

        <ActionDialog
          open={confirmCandidate !== null}
          onOpenChange={(open) => !open && setConfirmCandidate(null)}
          title={t("appointments.confirmTitle", {
            defaultValue: "Confirm Appointment",
          })}
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
          confirmLabel={t("appointments.confirm", { defaultValue: "Confirm" })}
        />

        <ActionDialog
          open={completeCandidate !== null}
          onOpenChange={(open) => !open && setCompleteCandidate(null)}
          title={t("appointments.completeTitle", {
            defaultValue: "Complete Appointment",
          })}
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
          confirmLabel={t("appointments.complete", {
            defaultValue: "Complete",
          })}
        />

        <Dialog
          open={cancelCandidate !== null}
          onOpenChange={(open) => !open && setCancelCandidate(null)}
        >
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>
                {t("appointments.cancelTitle", {
                  defaultValue: "Cancel Appointment",
                })}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                value={cancelReason}
                onChange={(event) => setCancelReason(event.target.value)}
                placeholder={t("appointments.cancelReasonPlaceholder", {
                  defaultValue: "Cancellation reason",
                })}
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
              <Button
                variant="outline"
                onClick={() => setCancelCandidate(null)}
              >
                {t("common.cancel", { defaultValue: "Cancel" })}
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
                {t("appointments.cancelAction", { defaultValue: "Cancel" })}
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
              <DialogTitle>
                {t("appointments.rescheduleTitle", {
                  defaultValue: "Reschedule Appointment",
                })}
              </DialogTitle>
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
                {t("common.cancel", { defaultValue: "Cancel" })}
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
                {t("appointments.reschedule", { defaultValue: "Reschedule" })}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageContainer>
    </ProtectedComponent>
  );
};

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

export default AppointmentsPage;
