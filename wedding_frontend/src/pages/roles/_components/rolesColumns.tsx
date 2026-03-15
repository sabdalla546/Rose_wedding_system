import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import type { ColumnDef } from "@tanstack/react-table";
import { FaEdit, FaTrash } from "react-icons/fa";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProtectedComponent } from "@/components/routing/ProtectedComponent";

import type { TableRole } from "../adapters";

interface Props {
  onDelete: (id: number) => void;
  editPermission: string;
  deletePermission: string;
}

export const useRolesColumns = ({
  onDelete,
  editPermission,
  deletePermission,
}: Props): ColumnDef<TableRole>[] => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dateLocale = i18n.language === "ar" ? ar : enUS;
  const alignClass = i18n.language === "ar" ? "text-right" : "text-left";

  return [
    {
      accessorKey: "name",
      header: () => (
        <div className={alignClass}>
          {t("roles.name", { defaultValue: "Name" })}
        </div>
      ),
      enableSorting: true,
    },
    {
      id: "description",
      header: () => (
        <div className={alignClass}>
          {t("roles.description", { defaultValue: "Description" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>{row.original.description ?? "-"}</div>
      ),
    },
    {
      id: "permissions",
      header: () => (
        <div className={alignClass}>
          {t("roles.permissions", { defaultValue: "Permissions" })}
        </div>
      ),
      cell: ({ row }) => {
        const permissions = row.original.permissions;

        return (
          <div
            className={`flex flex-wrap gap-2 ${i18n.language === "ar" ? "justify-end" : ""}`}
          >
            {permissions.length ? (
              <>
                {permissions.slice(0, 2).map((permission) => (
                  <Badge key={permission.id} variant="outline">
                    {permission.code}
                  </Badge>
                ))}
                {permissions.length > 2 ? (
                  <Badge variant="secondary">+{permissions.length - 2}</Badge>
                ) : null}
              </>
            ) : (
              <span className="text-[var(--lux-text-muted)]">-</span>
            )}
          </div>
        );
      },
    },
    {
      id: "permissionsCount",
      header: () => (
        <div className={alignClass}>
          {t("roles.permissionsCount", { defaultValue: "Permissions Count" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>{row.original.permissions.length}</div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: () => (
        <div className={alignClass}>
          {t("roles.createdAt", { defaultValue: "Created At" })}
        </div>
      ),
      enableSorting: true,
      cell: ({ row }) => (
        <div className={alignClass}>
          {row.original.createdAt
            ? format(new Date(row.original.createdAt), "MMM d, yyyy", {
                locale: dateLocale,
              })
            : "-"}
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
          <ProtectedComponent permission={editPermission}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/settings/team/roles/edit/${row.original.id}`)}
            >
              <FaEdit className="h-3.5 w-3.5" />
            </Button>
          </ProtectedComponent>

          <ProtectedComponent permission={deletePermission}>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(row.original.id)}
            >
              <FaTrash className="h-3.5 w-3.5" />
            </Button>
          </ProtectedComponent>
        </div>
      ),
    },
  ];
};
