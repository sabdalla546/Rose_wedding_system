import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import type { ColumnDef } from "@tanstack/react-table";
import {
  CheckCheck,
  CircleOff,
  Edit,
  Eye,
  MoreHorizontal,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatMeetingType, type TableAppointment } from "@/pages/appointments/adapters";

import { AppointmentStatusBadge } from "./appointmentStatusBadge";

interface Props {
  onDelete: (appointment: TableAppointment) => void;
  onConfirm: (appointment: TableAppointment) => void;
  onComplete: (appointment: TableAppointment) => void;
  onCancel: (appointment: TableAppointment) => void;
  onReschedule: (appointment: TableAppointment) => void;
  editPermission: string;
  deletePermission: string;
}

export const useAppointmentsColumns = ({
  onDelete,
  onConfirm,
  onComplete,
  onCancel,
  onReschedule,
  editPermission,
  deletePermission,
}: Props): ColumnDef<TableAppointment>[] => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dateLocale = i18n.language === "ar" ? ar : enUS;
  const alignClass = i18n.language === "ar" ? "text-right" : "text-left";

  return [
    {
      accessorKey: "customerName",
      header: () => (
        <div className={alignClass}>
          {t("appointments.customer", { defaultValue: "Customer" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>
          <div className="font-medium text-[var(--lux-text)]">
            {row.original.customerName}
          </div>
          <div className="mt-1 text-xs text-[var(--lux-text-secondary)]">
            {row.original.venueDisplay}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "appointmentDate",
      header: () => (
        <div className={alignClass}>
          {t("appointments.date", { defaultValue: "Date" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>
          {format(new Date(row.original.appointmentDate), "MMM d, yyyy", {
            locale: dateLocale,
          })}
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "timeDisplay",
      header: () => (
        <div className={alignClass}>
          {t("appointments.time", { defaultValue: "Time" })}
        </div>
      ),
      cell: ({ row }) => <div className={alignClass}>{row.original.timeDisplay}</div>,
    },
    {
      accessorKey: "meetingType",
      header: () => (
        <div className={alignClass}>
          {t("appointments.meetingType", { defaultValue: "Meeting Type" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>
          {t(`appointments.meetingTypeOptions.${row.original.meetingType}`, {
            defaultValue: formatMeetingType(row.original.meetingType),
          })}
        </div>
      ),
    },
    {
      accessorKey: "assignedUserDisplay",
      header: () => (
        <div className={alignClass}>
          {t("appointments.assignedTo", { defaultValue: "Assigned To" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>
          {row.original.assignedToUser?.fullName ||
            t("appointments.unassigned", { defaultValue: "Unassigned" })}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: () => (
        <div className={alignClass}>
          {t("appointments.statusLabel", { defaultValue: "Status" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>
          <AppointmentStatusBadge status={row.original.status} />
        </div>
      ),
    },
    {
      id: "actions",
      header: () => (
        <div className="text-center">
          {t("common.actions", { defaultValue: "Actions" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/appointments/${row.original.id}`)}
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>

          <ProtectedComponent permission={editPermission}>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/appointments/edit/${row.original.id}`)}
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
          </ProtectedComponent>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <ProtectedComponent permission="appointments.confirm">
                <DropdownMenuItem
                  disabled={!["scheduled", "rescheduled"].includes(row.original.status)}
                  onClick={() => onConfirm(row.original)}
                >
                  <CheckCheck className="me-2 h-4 w-4" />
                  {t("appointments.confirm", { defaultValue: "Confirm" })}
                </DropdownMenuItem>
              </ProtectedComponent>
              <ProtectedComponent permission="appointments.complete">
                <DropdownMenuItem
                  disabled={["completed", "cancelled"].includes(row.original.status)}
                  onClick={() => onComplete(row.original)}
                >
                  <CheckCheck className="me-2 h-4 w-4" />
                  {t("appointments.complete", { defaultValue: "Complete" })}
                </DropdownMenuItem>
              </ProtectedComponent>
              <ProtectedComponent permission="appointments.reschedule">
                <DropdownMenuItem
                  disabled={row.original.status === "completed"}
                  onClick={() => onReschedule(row.original)}
                >
                  <RotateCcw className="me-2 h-4 w-4" />
                  {t("appointments.reschedule", { defaultValue: "Reschedule" })}
                </DropdownMenuItem>
              </ProtectedComponent>
              <ProtectedComponent permission="appointments.cancel">
                <DropdownMenuItem
                  disabled={["completed", "cancelled"].includes(row.original.status)}
                  onClick={() => onCancel(row.original)}
                >
                  <CircleOff className="me-2 h-4 w-4" />
                  {t("appointments.cancelAction", { defaultValue: "Cancel" })}
                </DropdownMenuItem>
              </ProtectedComponent>
              <ProtectedComponent permission={deletePermission}>
                <DropdownMenuItem
                  className="text-[var(--lux-danger)] hover:text-[var(--lux-danger)] focus:text-[var(--lux-danger)]"
                  onClick={() => onDelete(row.original)}
                >
                  <Trash2 className="me-2 h-4 w-4" />
                  {t("common.delete", { defaultValue: "Delete" })}
                </DropdownMenuItem>
              </ProtectedComponent>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];
};
