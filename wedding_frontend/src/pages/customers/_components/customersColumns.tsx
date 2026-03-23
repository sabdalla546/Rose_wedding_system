import type { ColumnDef } from "@tanstack/react-table";
import { Edit, Eye, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import { Button } from "@/components/ui/button";
import type { TableCustomer } from "@/pages/customers/adapters";
import { CustomerStatusBadge } from "./customerStatusBadge";

interface Props {
  onDelete: (customer: TableCustomer) => void;
  editPermission: string;
  deletePermission: string;
}

export const useCustomersColumns = ({
  onDelete,
  editPermission,
  deletePermission,
}: Props): ColumnDef<TableCustomer>[] => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const alignClass = i18n.language === "ar" ? "text-right" : "text-left";

  return [
    {
      accessorKey: "fullName",
      header: () => (
        <div className={alignClass}>
          {t("customers.fullName", { defaultValue: "Full Name" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>
          <div className="font-medium text-[var(--lux-text)]">
            {row.original.fullName}
          </div>
          <div className="mt-1 text-xs text-[var(--lux-text-secondary)]">
            {row.original.email || "-"}
          </div>
        </div>
      ),
      enableSorting: true,
    },
    {
      id: "contact",
      header: () => (
        <div className={alignClass}>
          {t("customers.contact", { defaultValue: "Contact" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>{row.original.contactSummary || "-"}</div>
      ),
    },
    {
      accessorKey: "notesPreview",
      header: () => (
        <div className={alignClass}>
          {t("common.notes", { defaultValue: "Notes" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={`${alignClass} max-w-[280px] truncate`}>
          {row.original.notesPreview}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: () => (
        <div className={alignClass}>
          {t("customers.statusLabel", { defaultValue: "Status" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>
          <CustomerStatusBadge status={row.original.status} />
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
            onClick={() => navigate(`/customers/${row.original.id}`)}
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>

          <ProtectedComponent permission={editPermission}>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/customers/edit/${row.original.id}`)}
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
