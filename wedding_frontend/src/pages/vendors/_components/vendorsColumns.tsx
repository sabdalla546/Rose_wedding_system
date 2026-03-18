import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import type { ColumnDef } from "@tanstack/react-table";
import { Edit, Eye, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import { Button } from "@/components/ui/button";
import type { TableVendor } from "@/pages/vendors/adapters";

import { VendorActiveBadge } from "./vendorActiveBadge";

interface Props {
  onDelete: (vendor: TableVendor) => void;
  editPermission: string;
  deletePermission: string;
}

export const useVendorsColumns = ({
  onDelete,
  editPermission,
  deletePermission,
}: Props): ColumnDef<TableVendor>[] => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dateLocale = i18n.language === "ar" ? ar : enUS;
  const alignClass = i18n.language === "ar" ? "text-right" : "text-left";

  return [
    {
      accessorKey: "name",
      header: () => (
        <div className={alignClass}>
          {t("vendors.name", { defaultValue: "Vendor Name" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>
          <div className="font-medium text-[var(--lux-text)]">
            {row.original.name}
          </div>
          <div className="mt-1 text-xs text-[var(--lux-text-secondary)]">
            {row.original.contactPerson || row.original.email || "-"}
          </div>
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "type",
      header: () => (
        <div className={alignClass}>
          {t("vendors.typeLabel", { defaultValue: "Vendor Type" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>
          {t(`vendors.type.${row.original.type}`, {
            defaultValue: row.original.typeDisplay,
          })}
        </div>
      ),
    },
    {
      id: "contact",
      header: () => (
        <div className={alignClass}>
          {t("vendors.contactDetails", { defaultValue: "Contact" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>
          <div>{row.original.phone || "-"}</div>
          <div className="mt-1 text-xs text-[var(--lux-text-secondary)]">
            {row.original.phone2 || row.original.email || "-"}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "isActive",
      header: () => (
        <div className={alignClass}>
          {t("vendors.statusLabel", { defaultValue: "Status" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>
          <VendorActiveBadge isActive={row.original.isActive} />
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: () => (
        <div className={alignClass}>
          {t("vendors.createdAt", { defaultValue: "Created At" })}
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
            onClick={() => navigate(`/settings/vendors/${row.original.id}`)}
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>

          <ProtectedComponent permission={editPermission}>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/settings/vendors/edit/${row.original.id}`)}
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
