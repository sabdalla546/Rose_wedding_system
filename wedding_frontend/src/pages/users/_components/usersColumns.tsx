import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { enUS, ar } from "date-fns/locale";
import type { ColumnDef } from "@tanstack/react-table";
import { FaEdit, FaTrash, FaUndo } from "react-icons/fa";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProtectedComponent } from "@/components/routing/ProtectedComponent";

import type { TableUser } from "../adapters";

interface Props {
  onDelete: (id: number) => void;
  onRestore: (id: number) => void;
  editPermission: string;
  deletePermission: string;
  restorePermission: string;
}

export const useUsersColumns = ({
  onDelete,
  onRestore,
  editPermission,
  deletePermission,
  restorePermission,
}: Props): ColumnDef<TableUser>[] => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dateLocale = i18n.language === "ar" ? ar : enUS;
  const alignClass = i18n.language === "ar" ? "text-right" : "text-left";

  return [
    {
      accessorKey: "name",
      header: () => (
        <div className={alignClass}>
          {t("users.name", { defaultValue: "Name" })}
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "email",
      header: () => (
        <div className={alignClass}>
          {t("users.email", { defaultValue: "Email" })}
        </div>
      ),
      enableSorting: true,
    },
    {
      id: "phone",
      header: () => (
        <div className={alignClass}>
          {t("users.phone", { defaultValue: "Phone" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>{row.original.phone ?? "-"}</div>
      ),
    },
    {
      id: "status",
      header: () => (
        <div className={alignClass}>
          {t("users.status", { defaultValue: "Status" })}
        </div>
      ),
      cell: ({ row }) => {
        const isActive = row.original.isActive;
        return (
          <div className={alignClass}>
            <Badge variant={isActive ? "default" : "secondary"}>
              {isActive
                ? t("users.active", { defaultValue: "Active" })
                : t("users.inactive", { defaultValue: "Inactive" })}
            </Badge>
          </div>
        );
      },
    },
    {
      id: "role",
      header: () => (
        <div className={alignClass}>
          {t("users.role", { defaultValue: "Role" })}
        </div>
      ),
      cell: ({ row }) => {
        const roleName =
          row.original.Role?.name ?? row.original.Roles?.[0]?.name ?? "-";

        return (
          <div className={alignClass}>
            {roleName !== "-" ? (
              <Badge className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/10">
                {roleName}
              </Badge>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: () => (
        <div className={alignClass}>
          {t("users.createdAt", { defaultValue: "Created At" })}
        </div>
      ),
      enableSorting: true,
      cell: ({ row }) => (
        <div className={alignClass}>
          {format(new Date(row.original.createdAt), "MMM d, yyyy", {
            locale: dateLocale,
          })}
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
      cell: ({ row }) => {
        const isDeleted = Boolean(row.original.deletedAt);

        return (
          <div className="flex items-center justify-center gap-2">
            {isDeleted ? (
              <ProtectedComponent permission={restorePermission}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRestore(row.original.id)}
                >
                  <FaUndo className="h-3.5 w-3.5" />
                </Button>
              </ProtectedComponent>
            ) : (
              <>
                <ProtectedComponent permission={editPermission}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      navigate(`/settings/team/users/edit/${row.original.id}`)
                    }
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
              </>
            )}
          </div>
        );
      },
    },
  ];
};
