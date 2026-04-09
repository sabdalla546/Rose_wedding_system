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
import {
  formatAppointmentType,
  normalizeAppointmentStatus,
  type TableAppointment,
} from "@/pages/appointments/adapters";
import { AppointmentStatusBadge } from "./appointmentStatusBadge";

interface Props {
  onDelete: (appointment: TableAppointment) => void;
  onConfirm: (appointment: TableAppointment) => void;
  onAttend: (appointment: TableAppointment) => void;
  onCancel: (appointment: TableAppointment) => void;
  onReschedule: (appointment: TableAppointment) => void;
  editPermission: string;
  deletePermission: string;
}

export const useAppointmentsColumns = ({
  onDelete,
  onConfirm,
  onAttend,
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
            {row.original.customer?.mobile || "-"}
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
          <div>
            {format(new Date(row.original.appointmentDate), "MMM d, yyyy", {
              locale: dateLocale,
            })}
          </div>
          <div className="mt-1 text-xs text-[var(--lux-text-secondary)]">
            {t("appointments.weddingDate", {
              defaultValue: "Wedding Date",
            })}
            :{" "}
            {row.original.weddingDate
              ? format(new Date(row.original.weddingDate), "MMM d, yyyy", {
                  locale: dateLocale,
                })
              : "-"}
          </div>
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
      cell: ({ row }) => (
        <div className={alignClass}>{row.original.timeDisplay}</div>
      ),
    },
    {
      accessorKey: "type",
      header: () => (
        <div className={alignClass}>
          {t("appointments.type", { defaultValue: "Type" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>
          {t(`appointments.typeOptions.${row.original.type}`, {
            defaultValue: formatAppointmentType(row.original.type),
          })}
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
      cell: ({ row }) => {
        const normalizedStatus = normalizeAppointmentStatus(row.original.status);

        return (
          <div className={alignClass}>
            <AppointmentStatusBadge status={normalizedStatus} />
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => (
        <div className="text-center">
          {t("common.actions", { defaultValue: "Actions" })}
        </div>
      ),
      cell: ({ row }) => {
        const normalizedStatus = normalizeAppointmentStatus(row.original.status);

        return (
          <div className="flex items-center justify-center gap-1.5">
            <Button
              size="icon"
              variant="secondary"
              aria-label={t("appointments.viewAppointment", {
                defaultValue: "View Appointment",
              })}
              title={t("appointments.viewAppointment", {
                defaultValue: "View Appointment",
              })}
              onClick={() => navigate(`/appointments/${row.original.id}`)}
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>

            <ProtectedComponent permission={editPermission}>
              <Button
                size="icon"
                variant="outline"
                aria-label={t("appointments.editAppointment", {
                  defaultValue: "Edit Appointment",
                })}
                title={t("appointments.editAppointment", {
                  defaultValue: "Edit Appointment",
                })}
                onClick={() => navigate(`/appointments/edit/${row.original.id}`)}
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
            </ProtectedComponent>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={t("common.actions", { defaultValue: "Actions" })}
                  title={t("common.actions", { defaultValue: "Actions" })}
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                <ProtectedComponent permission="appointments.confirm">
                  <DropdownMenuItem
                    disabled={normalizedStatus !== "reserved"}
                    onClick={() => onConfirm(row.original)}
                  >
                    <CheckCheck className="me-2 h-4 w-4" />
                    {t("appointments.confirm", { defaultValue: "Confirm" })}
                  </DropdownMenuItem>
                </ProtectedComponent>

                <ProtectedComponent permission="appointments.update">
                  <DropdownMenuItem
                    disabled={normalizedStatus !== "reserved"}
                    onClick={() => onAttend(row.original)}
                  >
                    <CheckCheck className="me-2 h-4 w-4" />
                    {t("appointments.attend", { defaultValue: "Attend" })}
                  </DropdownMenuItem>
                </ProtectedComponent>

                <ProtectedComponent permission="appointments.reschedule">
                  <DropdownMenuItem
                    disabled={["converted", "cancelled", "no_show"].includes(
                      normalizedStatus,
                    )}
                    onClick={() => onReschedule(row.original)}
                  >
                    <RotateCcw className="me-2 h-4 w-4" />
                    {t("appointments.reschedule", {
                      defaultValue: "Reschedule",
                    })}
                  </DropdownMenuItem>
                </ProtectedComponent>

                <ProtectedComponent permission="appointments.cancel">
                  <DropdownMenuItem
                    disabled={["converted", "cancelled", "no_show"].includes(
                      normalizedStatus,
                    )}
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
        );
      },
    },
  ];
};
