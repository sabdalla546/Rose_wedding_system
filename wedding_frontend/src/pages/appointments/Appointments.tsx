import { useMemo, useState } from "react";
import { CalendarClock, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import CompactHeader from "@/components/common/CompactHeader";
import TableHeader from "@/components/common/TableHeader";
import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/ui/confirmDialog";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import Pagination from "@/components/ui/pagination";
import {
  useCancelAppointment,
  useCompleteAppointment,
  useConfirmAppointment,
  useRescheduleAppointment,
} from "@/hooks/appointments/useAppointmentActions";
import { useAppointments } from "@/hooks/appointments/useAppointments";
import { useDeleteAppointment } from "@/hooks/appointments/useDeleteAppointment";
import { useLeads } from "@/hooks/leads/useLeads";
import { useUsers } from "@/hooks/users/useUsers";
import { useVenues } from "@/hooks/venues/useVenues";

import {
  APPOINTMENT_STATUS_OPTIONS,
  toTableAppointments,
  type TableAppointment,
} from "./adapters";
import { useAppointmentsColumns } from "./_components/appointmentsColumns";

const textareaClassName =
  "min-h-[110px] w-full rounded-[22px] border px-4 py-3 text-sm text-[var(--lux-text)] placeholder:text-[var(--lux-text-muted)] outline-none transition-all focus:border-[var(--lux-gold-border)] focus:ring-2 focus:ring-[var(--lux-gold-glow)]";

const fieldStyle = {
  background: "var(--lux-control-surface)",
  borderColor: "var(--lux-control-border)",
} as const;

const fieldClassName =
  "h-11 rounded-2xl border px-4 text-sm text-[var(--lux-text)] outline-none transition focus:border-[var(--lux-gold-border)]";

const AppointmentsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState<"all" | TableAppointment["status"]>(
    "all",
  );
  const [leadFilter, setLeadFilter] = useState("");
  const [venueFilter, setVenueFilter] = useState("");
  const [assignedUserFilter, setAssignedUserFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [deleteCandidate, setDeleteCandidate] = useState<TableAppointment | null>(null);
  const [confirmCandidate, setConfirmCandidate] = useState<TableAppointment | null>(null);
  const [completeCandidate, setCompleteCandidate] = useState<TableAppointment | null>(null);
  const [cancelCandidate, setCancelCandidate] = useState<TableAppointment | null>(null);
  const [rescheduleCandidate, setRescheduleCandidate] = useState<TableAppointment | null>(null);
  const [confirmNotes, setConfirmNotes] = useState("");
  const [completeNotes, setCompleteNotes] = useState("");
  const [completeResult, setCompleteResult] = useState("");
  const [completeNextStep, setCompleteNextStep] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [cancelNotes, setCancelNotes] = useState("");
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleStartTime, setRescheduleStartTime] = useState("");
  const [rescheduleEndTime, setRescheduleEndTime] = useState("");
  const [rescheduleAssignedUserId, setRescheduleAssignedUserId] = useState("");
  const [rescheduleNotes, setRescheduleNotes] = useState("");
  const [rescheduleNextStep, setRescheduleNextStep] = useState("");

  const { data: raw, isLoading } = useAppointments({
    currentPage,
    itemsPerPage,
    status: statusFilter,
    leadId: leadFilter,
    venueId: venueFilter,
    assignedToUserId: assignedUserFilter,
    dateFrom,
    dateTo,
  });
  const { data: leadsResponse } = useLeads({
    currentPage: 1,
    itemsPerPage: 200,
    searchQuery: "",
    status: "all",
    venueId: "",
    source: "",
    weddingDateFrom: "",
    weddingDateTo: "",
  });
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

  const adapted = toTableAppointments(raw);
  const appointments = adapted.data.appointments;
  const totalItems = adapted.total;
  const totalPages = adapted.totalPages;
  const rowNumberStart = (currentPage - 1) * itemsPerPage + 1;
  const leads = useMemo(() => leadsResponse?.data ?? [], [leadsResponse?.data]);
  const venues = useMemo(() => venuesResponse?.data ?? [], [venuesResponse?.data]);
  const users = useMemo(() => usersResponse?.data ?? [], [usersResponse?.data]);

  const deleteMutation = useDeleteAppointment();
  const confirmMutation = useConfirmAppointment();
  const completeMutation = useCompleteAppointment();
  const cancelMutation = useCancelAppointment();
  const rescheduleMutation = useRescheduleAppointment();

  const columns = useAppointmentsColumns({
    onDelete: setDeleteCandidate,
    onConfirm: (appointment) => {
      setConfirmCandidate(appointment);
      setConfirmNotes("");
    },
    onComplete: (appointment) => {
      setCompleteCandidate(appointment);
      setCompleteNotes("");
      setCompleteResult("");
      setCompleteNextStep("");
    },
    onCancel: (appointment) => {
      setCancelCandidate(appointment);
      setCancelReason("");
      setCancelNotes("");
    },
    onReschedule: (appointment) => {
      setRescheduleCandidate(appointment);
      setRescheduleDate(appointment.appointmentDate);
      setRescheduleStartTime(appointment.appointmentStartTime);
      setRescheduleEndTime(appointment.appointmentEndTime || "");
      setRescheduleAssignedUserId(
        appointment.assignedToUserId ? String(appointment.assignedToUserId) : "",
      );
      setRescheduleNotes(appointment.notes || "");
      setRescheduleNextStep(appointment.nextStep || "");
    },
    editPermission: "appointments.update",
    deletePermission: "appointments.delete",
  });

  return (
    <ProtectedComponent permission="appointments.read">
      <div className="min-h-screen space-y-4 bg-background p-4 text-foreground">
        <CompactHeader
          icon={<CalendarClock className="h-5 w-5 text-primary" />}
          title={t("appointments.title", { defaultValue: "Appointments" })}
          totalText={
            <>
              {totalItems}{" "}
              {t("appointments.totalAppointments", {
                defaultValue: "total appointments",
              })}
            </>
          }
          right={
            <ProtectedComponent permission="appointments.create">
              <Button
                size="sm"
                className="h-auto px-3 py-2 text-xs"
                onClick={() => navigate("/appointments/create")}
              >
                <Plus className="h-3.5 w-3.5" />
                {t("appointments.create", { defaultValue: "Create Appointment" })}
              </Button>
            </ProtectedComponent>
          }
        />

        <SectionCard className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--lux-text-muted)]">
                {t("appointments.statusLabel", { defaultValue: "Status" })}
              </span>
              <select
                className={fieldClassName}
                style={fieldStyle}
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(
                    event.target.value as "all" | TableAppointment["status"],
                  );
                  setCurrentPage(1);
                }}
              >
                <option value="all">
                  {t("appointments.allStatuses", {
                    defaultValue: "All Statuses",
                  })}
                </option>
                {APPOINTMENT_STATUS_OPTIONS.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--lux-text-muted)]">
                {t("appointments.lead", { defaultValue: "Lead" })}
              </span>
              <select
                className={fieldClassName}
                style={fieldStyle}
                value={leadFilter}
                onChange={(event) => {
                  setLeadFilter(event.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">{t("appointments.allLeads", { defaultValue: "All Leads" })}</option>
                {leads.map((lead) => (
                  <option key={lead.id} value={String(lead.id)}>
                    {lead.fullName}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--lux-text-muted)]">
                {t("common.venue", { defaultValue: "Venue" })}
              </span>
              <select
                className={fieldClassName}
                style={fieldStyle}
                value={venueFilter}
                onChange={(event) => {
                  setVenueFilter(event.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">{t("appointments.allVenues", { defaultValue: "All Venues" })}</option>
                {venues.map((venue) => (
                  <option key={venue.id} value={String(venue.id)}>
                    {venue.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--lux-text-muted)]">
                {t("appointments.assignedTo", { defaultValue: "Assigned To" })}
              </span>
              <select
                className={fieldClassName}
                style={fieldStyle}
                value={assignedUserFilter}
                onChange={(event) => {
                  setAssignedUserFilter(event.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">{t("appointments.allUsers", { defaultValue: "All Users" })}</option>
                {users.map((user) => (
                  <option key={user.id} value={String(user.id)}>
                    {user.fullName}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--lux-text-muted)]">
                {t("appointments.dateFrom", { defaultValue: "Date From" })}
              </span>
              <Input
                type="date"
                value={dateFrom}
                onChange={(event) => {
                  setDateFrom(event.target.value);
                  setCurrentPage(1);
                }}
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--lux-text-muted)]">
                {t("appointments.dateTo", { defaultValue: "Date To" })}
              </span>
              <Input
                type="date"
                value={dateTo}
                onChange={(event) => {
                  setDateTo(event.target.value);
                  setCurrentPage(1);
                }}
              />
            </label>
          </div>
        </SectionCard>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <TableHeader
            title={t("appointments.listTitle", { defaultValue: "Appointments List" })}
            totalItems={totalItems}
            currentCount={appointments.length}
            entityName={t("appointments.title", { defaultValue: "Appointments" })}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setItemsPerPage}
            setCurrentPage={setCurrentPage}
          />
          <div className="overflow-hidden">
            <DataTable
              columns={columns}
              data={appointments}
              rowNumberStart={rowNumberStart}
              enableRowNumbers
              fileName="appointments"
              isLoading={isLoading}
            />
          </div>
          {totalPages > 1 ? (
            <div className="border-t border-border bg-muted/40 px-6 py-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={(value) => {
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
          title={t("appointments.deleteTitle", { defaultValue: "Delete Appointment" })}
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

        {renderSimpleDialog({
          open: confirmCandidate !== null,
          onOpenChange: (open) => !open && setConfirmCandidate(null),
          title: t("appointments.confirmTitle", { defaultValue: "Confirm Appointment" }),
          description: t("appointments.confirmDescription", {
            defaultValue: "Add an optional note before confirming this appointment.",
          }),
          value: confirmNotes,
          onChange: setConfirmNotes,
          onConfirm: () =>
            confirmCandidate &&
            confirmMutation.mutate(
              {
                id: confirmCandidate.id,
                values: { notes: confirmNotes },
              },
              { onSuccess: () => setConfirmCandidate(null) },
            ),
          isPending: confirmMutation.isPending,
          confirmLabel: t("appointments.confirm", { defaultValue: "Confirm" }),
        })}

        <Dialog
          open={completeCandidate !== null}
          onOpenChange={(open) => !open && setCompleteCandidate(null)}
        >
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>
                {t("appointments.completeTitle", { defaultValue: "Complete Appointment" })}
              </DialogTitle>
              <DialogDescription>
                {t("appointments.completeDescription", {
                  defaultValue: "Capture the outcome, notes, and next step for this appointment.",
                })}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input value={completeResult} onChange={(e) => setCompleteResult(e.target.value)} placeholder={t("appointments.resultPlaceholder", { defaultValue: "Meeting result" })} />
              <Input value={completeNextStep} onChange={(e) => setCompleteNextStep(e.target.value)} placeholder={t("appointments.nextStepPlaceholder", { defaultValue: "Next step" })} />
              <textarea className={textareaClassName} style={fieldStyle} value={completeNotes} onChange={(e) => setCompleteNotes(e.target.value)} placeholder={t("appointments.notesPlaceholder", { defaultValue: "Notes..." })} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCompleteCandidate(null)} disabled={completeMutation.isPending}>
                {t("common.cancel", { defaultValue: "Cancel" })}
              </Button>
              <Button
                onClick={() =>
                  completeCandidate &&
                  completeMutation.mutate(
                    {
                      id: completeCandidate.id,
                      values: {
                        result: completeResult,
                        notes: completeNotes,
                        nextStep: completeNextStep,
                      },
                    },
                    { onSuccess: () => setCompleteCandidate(null) },
                  )
                }
                disabled={completeMutation.isPending}
              >
                {completeMutation.isPending
                  ? t("common.processing", { defaultValue: "Processing..." })
                  : t("appointments.complete", { defaultValue: "Complete" })}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={cancelCandidate !== null}
          onOpenChange={(open) => !open && setCancelCandidate(null)}
        >
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>
                {t("appointments.cancelTitle", { defaultValue: "Cancel Appointment" })}
              </DialogTitle>
              <DialogDescription>
                {t("appointments.cancelDescription", {
                  defaultValue: "Add a reason and optional note for the cancellation.",
                })}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder={t("appointments.cancelReasonPlaceholder", { defaultValue: "Cancellation reason" })} />
              <textarea className={textareaClassName} style={fieldStyle} value={cancelNotes} onChange={(e) => setCancelNotes(e.target.value)} placeholder={t("appointments.notesPlaceholder", { defaultValue: "Notes..." })} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCancelCandidate(null)} disabled={cancelMutation.isPending}>
                {t("common.cancel", { defaultValue: "Cancel" })}
              </Button>
              <Button
                onClick={() =>
                  cancelCandidate &&
                  cancelMutation.mutate(
                    {
                      id: cancelCandidate.id,
                      values: {
                        reason: cancelReason,
                        notes: cancelNotes,
                      },
                    },
                    { onSuccess: () => setCancelCandidate(null) },
                  )
                }
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending
                  ? t("common.processing", { defaultValue: "Processing..." })
                  : t("appointments.cancelAction", { defaultValue: "Cancel Appointment" })}
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
                {t("appointments.rescheduleTitle", { defaultValue: "Reschedule Appointment" })}
              </DialogTitle>
              <DialogDescription>
                {t("appointments.rescheduleDescription", {
                  defaultValue: "Update the appointment timing and any follow-up instructions.",
                })}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} />
              <Input type="time" value={rescheduleStartTime} onChange={(e) => setRescheduleStartTime(e.target.value)} />
              <Input type="time" value={rescheduleEndTime} onChange={(e) => setRescheduleEndTime(e.target.value)} />
              <select className={fieldClassName} style={fieldStyle} value={rescheduleAssignedUserId} onChange={(e) => setRescheduleAssignedUserId(e.target.value)}>
                <option value="">{t("appointments.unassigned", { defaultValue: "Unassigned" })}</option>
                {users.map((user) => (
                  <option key={user.id} value={String(user.id)}>
                    {user.fullName}
                  </option>
                ))}
              </select>
              <Input className="md:col-span-2" value={rescheduleNextStep} onChange={(e) => setRescheduleNextStep(e.target.value)} placeholder={t("appointments.nextStepPlaceholder", { defaultValue: "Next step" })} />
              <textarea className={`${textareaClassName} md:col-span-2`} style={fieldStyle} value={rescheduleNotes} onChange={(e) => setRescheduleNotes(e.target.value)} placeholder={t("appointments.notesPlaceholder", { defaultValue: "Notes..." })} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRescheduleCandidate(null)} disabled={rescheduleMutation.isPending}>
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
                        appointmentStartTime: rescheduleStartTime,
                        appointmentEndTime: rescheduleEndTime,
                        assignedToUserId: rescheduleAssignedUserId,
                        notes: rescheduleNotes,
                        nextStep: rescheduleNextStep,
                      },
                    },
                    { onSuccess: () => setRescheduleCandidate(null) },
                  )
                }
                disabled={rescheduleMutation.isPending}
              >
                {rescheduleMutation.isPending
                  ? t("common.processing", { defaultValue: "Processing..." })
                  : t("appointments.reschedule", { defaultValue: "Reschedule" })}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedComponent>
  );
};

function renderSimpleDialog({
  open,
  onOpenChange,
  title,
  description,
  value,
  onChange,
  onConfirm,
  isPending,
  confirmLabel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
  onConfirm: () => void;
  isPending: boolean;
  confirmLabel: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <textarea
          className={textareaClassName}
          style={fieldStyle}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Notes..."
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isPending}>
            {isPending ? "Processing..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AppointmentsPage;
