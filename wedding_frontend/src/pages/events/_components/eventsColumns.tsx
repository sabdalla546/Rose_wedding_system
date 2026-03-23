import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import type { ColumnDef } from "@tanstack/react-table";
import { Edit, Eye, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import { Button } from "@/components/ui/button";
import type { TableEvent } from "@/pages/events/adapters";

import { EventStatusBadge } from "./eventStatusBadge";

interface Props {
  onDelete: (event: TableEvent) => void;
  editPermission: string;
  deletePermission: string;
}

export const useEventsColumns = ({
  onDelete,
  editPermission,
  deletePermission,
}: Props): ColumnDef<TableEvent>[] => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dateLocale = i18n.language === "ar" ? ar : enUS;
  const alignClass = i18n.language === "ar" ? "text-right" : "text-left";

  return [
    {
      accessorKey: "titleDisplay",
      header: () => (
        <div className={alignClass}>
          {t("events.event", { defaultValue: "Event" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>
          <div className="font-medium text-[var(--lux-text)]">
            {row.original.titleDisplay}
          </div>
          <div className="mt-1 text-xs text-[var(--lux-text-secondary)]">
            {row.original.partyDisplay}
          </div>
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "eventDate",
      header: () => (
        <div className={alignClass}>
          {t("events.eventDate", { defaultValue: "Event Date" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>
          {format(new Date(row.original.eventDate), "MMM d, yyyy", {
            locale: dateLocale,
          })}
        </div>
      ),
      enableSorting: true,
    },
    {
      id: "customer",
      header: () => (
        <div className={alignClass}>
          {t("events.customer", { defaultValue: "Customer" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>{row.original.customerDisplay}</div>
      ),
    },
    {
      id: "venue",
      header: () => (
        <div className={alignClass}>
          {t("common.venue", { defaultValue: "Venue" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>{row.original.venueDisplay}</div>
      ),
    },
    {
      accessorKey: "guestCount",
      header: () => (
        <div className={alignClass}>
          {t("events.guestCount", { defaultValue: "Guest Count" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>{row.original.guestCount || "-"}</div>
      ),
    },
    {
      accessorKey: "status",
      header: () => (
        <div className={alignClass}>
          {t("events.statusLabel", { defaultValue: "Status" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>
          <EventStatusBadge status={row.original.status} />
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: () => (
        <div className={alignClass}>
          {t("events.createdAt", { defaultValue: "Created At" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>
          {row.original.createdAt
            ? format(new Date(row.original.createdAt), "MMM d, yyyy", {
                locale: dateLocale,
              })
            : "-"}
        </div>
      ),
      enableSorting: true,
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
            onClick={() => navigate(`/events/${row.original.id}`)}
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>

          <ProtectedComponent permission={editPermission}>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/events/edit/${row.original.id}`)}
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
          </ProtectedComponent>

          <ProtectedComponent permission={deletePermission}>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onDelete(row.original)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </ProtectedComponent>
        </div>
      ),
    },
  ];
};
