import type { ColumnDef } from "@tanstack/react-table";
import { Edit, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import { Button } from "@/components/ui/button";
import type { TableVendorType } from "@/pages/vendors/adapters";

import { VendorActiveBadge } from "./vendorActiveBadge";

interface Props {
  onDelete: (vendorType: TableVendorType) => void;
  editPermission: string;
  deletePermission: string;
}

export const useVendorTypesColumns = ({
  onDelete,
  editPermission,
  deletePermission,
}: Props): ColumnDef<TableVendorType>[] => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const alignClass = i18n.language === "ar" ? "text-right" : "text-left";

  return [
    {
      accessorKey: "name",
      header: () => (
        <div className={alignClass}>
          {t("vendors.types.name", { defaultValue: "Name" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>
          <div className="font-medium text-[var(--lux-text)]">
            {row.original.name}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "nameAr",
      header: () => (
        <div className={alignClass}>
          {t("vendors.types.nameAr", { defaultValue: "Arabic Name" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>{row.original.nameAr || "-"}</div>
      ),
    },
    {
      accessorKey: "slug",
      header: () => (
        <div className={alignClass}>
          {t("vendors.types.slug", { defaultValue: "Slug" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={`${alignClass} font-mono text-xs`}>{row.original.slug}</div>
      ),
    },
    {
      accessorKey: "sortOrder",
      header: () => (
        <div className={alignClass}>
          {t("vendors.types.sortOrder", { defaultValue: "Sort Order" })}
        </div>
      ),
      cell: ({ row }) => <div className={alignClass}>{row.original.sortOrder}</div>,
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
              onClick={() => navigate(`/settings/vendors/types/edit/${row.original.id}`)}
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
