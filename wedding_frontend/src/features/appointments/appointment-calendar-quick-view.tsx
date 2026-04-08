import { CalendarClock, NotebookText, UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  AppDialogFooter,
  AppDialogHeader,
} from "@/components/shared/app-dialog";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { AppointmentStatusBadge } from "@/pages/appointments/_components/appointmentStatusBadge";
import { formatAppointmentType } from "@/pages/appointments/adapters";
import type { Appointment } from "@/pages/appointments/types";
import { useHasPermission } from "@/hooks/useHasPermission";

import {
  getAppointmentDateLabel,
  getAppointmentTimeLabel,
} from "./appointment-calendar";

type AppointmentQuickViewProps = {
  appointment: Appointment | null;
  onView: (appointment: Appointment) => void;
  onEdit: (appointment: Appointment) => void;
  onReschedule: (appointment: Appointment) => void;
  onAttend: (appointment: Appointment) => void;
  onCancel: (appointment: Appointment) => void;
  isAttendPending?: boolean;
  isCancelPending?: boolean;
  isReschedulePending?: boolean;
  className?: string;
};

type AppointmentQuickViewDialogProps = AppointmentQuickViewProps & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function QuickFact({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof CalendarClock;
}) {
  return (
    <div
      className="appointment-quick-view__fact rounded-[18px] border px-3.5 py-3"
      style={{
        borderColor: "var(--color-border)",
        background: "var(--color-surface-2)",
      }}
    >
      <div className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--color-control-hover)] text-[var(--color-primary)]">
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
        {label}
      </p>
      <p className="mt-1.5 text-sm font-medium leading-5 text-[var(--color-text)]">
        {value}
      </p>
    </div>
  );
}

export function AppointmentQuickView({
  appointment,
  onView,
  onEdit,
  onReschedule,
  onAttend,
  onCancel,
  isAttendPending = false,
  isCancelPending = false,
  isReschedulePending = false,
  className,
}: AppointmentQuickViewProps) {
  const { t } = useTranslation();
  const canRead = useHasPermission("appointments.read");
  const canUpdate = useHasPermission("appointments.update");
  const canCancelPermission = useHasPermission("appointments.cancel");
  const canReschedulePermission = useHasPermission("appointments.reschedule");

  if (!appointment) {
    return (
      <SectionCard className={cn("min-h-[360px] justify-center", className)}>
        <div className="app-empty-state min-h-[280px]">
          <div className="app-icon-chip mb-4 h-12 w-12 rounded-full">
            <CalendarClock className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--color-text)]">
            {t("appointments.calendarPage.selectTitle", {
              defaultValue: "Select an appointment",
            })}
          </h3>
          <p className="mt-2 max-w-sm text-sm text-[var(--color-text-muted)]">
            {t("appointments.calendarPage.selectDescription", {
              defaultValue:
                "Choose an appointment from the calendar to inspect timing, follow-up notes, and actions.",
            })}
          </p>
        </div>
      </SectionCard>
    );
  }

  const isReserved = appointment.status === "reserved";
  const isTerminal = ["converted", "cancelled", "no_show"].includes(
    appointment.status,
  );

  const canAttend = canUpdate && isReserved;
  const canCancel = canCancelPermission && !isTerminal;
  const canReschedule = canReschedulePermission && !isTerminal;

  const customerName =
    appointment.customer?.fullName || `Customer #${appointment.customerId}`;

  return (
    <SectionCard
      className={cn("appointment-quick-view overflow-hidden p-0", className)}
    >
      <div
        className="border-b px-5 py-4"
        style={{
          borderColor: "var(--color-border)",
          background:
            "color-mix(in srgb, var(--color-surface-2) 84%, var(--color-surface))",
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
              {t("appointments.calendarPage.quickView", {
                defaultValue: "Appointment Quick View",
              })}
            </p>
            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-[var(--color-text)]">
                {customerName}
              </h3>
              <p className="text-sm text-[var(--color-text-subtle)]">
                {formatAppointmentType(appointment.type)}
              </p>
            </div>
          </div>
          <AppointmentStatusBadge status={appointment.status} />
        </div>
      </div>

      <div className="space-y-5 px-5 py-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <QuickFact
            label={t("appointments.appointmentDate", {
              defaultValue: "Appointment Date",
            })}
            value={getAppointmentDateLabel(appointment)}
            icon={CalendarClock}
          />
          <QuickFact
            label={t("appointments.appointmentTime", {
              defaultValue: "Appointment Time",
            })}
            value={getAppointmentTimeLabel(appointment)}
            icon={CalendarClock}
          />
          <QuickFact
            label={t("appointments.customer", { defaultValue: "Customer" })}
            value={customerName}
            icon={UserRound}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <QuickFact
            label={t("appointments.meetingType", {
              defaultValue: "Meeting Type",
            })}
            value={formatAppointmentType(appointment.type)}
            icon={NotebookText}
          />
          <QuickFact
            label={t("appointments.statusLabel", { defaultValue: "Status" })}
            value={t(`appointments.status.${appointment.status}`, {
              defaultValue: appointment.status,
            })}
            icon={NotebookText}
          />
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
            {t("common.notes", { defaultValue: "Notes" })}
          </p>
          <div
            className="appointment-quick-view__notes rounded-[18px] border px-4 py-3 text-sm leading-6 text-[var(--color-text-subtle)]"
            style={{
              borderColor: "var(--color-border)",
              background: "var(--color-surface-2)",
            }}
          >
            {appointment.notes ||
              t("appointments.noNotes", { defaultValue: "No notes added." })}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 [&>button]:w-full">
          {canRead ? (
            <Button type="button" onClick={() => onView(appointment)}>
              {t("appointments.viewAppointment", {
                defaultValue: "View Appointment",
              })}
            </Button>
          ) : null}

          {canUpdate ? (
            <Button
              type="button"
              variant="secondary"
              className="appointment-quick-view__secondary-action"
              onClick={() => onEdit(appointment)}
            >
              {t("appointments.editAppointment", {
                defaultValue: "Edit Appointment",
              })}
            </Button>
          ) : null}

          {canReschedule ? (
            <Button
              type="button"
              variant="secondary"
              className="appointment-quick-view__secondary-action"
              onClick={() => onReschedule(appointment)}
              disabled={isReschedulePending}
            >
              {t("appointments.reschedule", { defaultValue: "Reschedule" })}
            </Button>
          ) : null}

          {canAttend ? (
            <Button
              type="button"
              onClick={() => onAttend(appointment)}
              disabled={isAttendPending}
            >
              {t("appointments.attend", { defaultValue: "Attend" })}
            </Button>
          ) : null}

          {canCancel ? (
            <Button
              type="button"
              variant="outline"
              className="appointment-quick-view__secondary-action"
              onClick={() => onCancel(appointment)}
              disabled={isCancelPending}
            >
              {t("appointments.cancelAction", { defaultValue: "Cancel" })}
            </Button>
          ) : null}
        </div>
      </div>
    </SectionCard>
  );
}

export function AppointmentQuickViewDialog({
  open,
  onOpenChange,
  appointment,
  onView,
  onEdit,
  onReschedule,
  onAttend,
  onCancel,
  isAttendPending,
  isCancelPending,
  isReschedulePending,
}: AppointmentQuickViewDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-1rem)] overflow-y-auto sm:max-w-2xl">
        <AppDialogHeader
          title={t("appointments.calendarPage.quickView", {
            defaultValue: "Appointment Quick View",
          })}
          description={t("appointments.calendarPage.selectDescription", {
            defaultValue:
              "Choose an appointment from the calendar to inspect timing, follow-up notes, and actions.",
          })}
        />
        <AppointmentQuickView
          appointment={appointment}
          onView={onView}
          onEdit={onEdit}
          onReschedule={onReschedule}
          onAttend={onAttend}
          onCancel={onCancel}
          isAttendPending={isAttendPending}
          isCancelPending={isCancelPending}
          isReschedulePending={isReschedulePending}
          className="border-0 bg-transparent p-0 shadow-none"
        />
        <AppDialogFooter>
          <Button
            type="button"
            variant="outline"
            className="appointment-quick-view__secondary-action"
            onClick={() => onOpenChange(false)}
          >
            {t("common.close", { defaultValue: "Close" })}
          </Button>
        </AppDialogFooter>
      </DialogContent>
    </Dialog>
  );
}
