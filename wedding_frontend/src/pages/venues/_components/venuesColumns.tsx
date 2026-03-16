import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import type { ColumnDef } from "@tanstack/react-table";
import { Edit, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TableVenue } from "@/pages/venues/adapters";

interface Props {
  onDelete: (id: number) => void;
  editPermission: string;
  deletePermission: string;
}

export const useVenuesColumns = ({
  onDelete,
  editPermission,
  deletePermission,
}: Props): ColumnDef<TableVenue>[] => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dateLocale = i18n.language === "ar" ? ar : enUS;
  const alignClass = i18n.language === "ar" ? "text-right" : "text-left";

  return [
    {
      accessorKey: "name",
      header: () => (
        <div className={alignClass}>
          {t("venues.name", { defaultValue: "Venue Name" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>
          <div className="font-medium text-[var(--lux-text)]">
            {row.original.name}
          </div>
          <div className="mt-1 text-xs text-[var(--lux-text-secondary)]">
            {row.original.address || row.original.locationSummary}
          </div>
        </div>
      ),
      enableSorting: true,
    },
    {
      id: "location",
      header: () => (
        <div className={alignClass}>
          {t("venues.location", { defaultValue: "Location" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>{row.original.locationSummary}</div>
      ),
    },
    {
      accessorKey: "contactPerson",
      header: () => (
        <div className={alignClass}>
          {t("venues.contactPerson", { defaultValue: "Contact Person" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>{row.original.contactPerson || "-"}</div>
      ),
    },
    {
      accessorKey: "phone",
      header: () => (
        <div className={alignClass}>
          {t("venues.phone", { defaultValue: "Phone" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>{row.original.phone || "-"}</div>
      ),
    },
    {
      id: "status",
      header: () => (
        <div className={alignClass}>
          {t("venues.status", { defaultValue: "Status" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>
          <Badge variant={row.original.isActive ? "default" : "secondary"}>
            {row.original.isActive
              ? t("venues.active", { defaultValue: "Active" })
              : t("venues.inactive", { defaultValue: "Inactive" })}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: () => (
        <div className={alignClass}>
          {t("venues.createdAt", { defaultValue: "Created At" })}
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
          <ProtectedComponent permission={editPermission}>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/settings/venues/edit/${row.original.id}`)}
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
          </ProtectedComponent>

          <ProtectedComponent permission={deletePermission}>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onDelete(row.original.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </ProtectedComponent>
        </div>
      ),
    },
  ];
};
