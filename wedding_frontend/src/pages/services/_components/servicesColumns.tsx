import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import type { ColumnDef } from "@tanstack/react-table";
import { Edit, Eye, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import { Button } from "@/components/ui/button";
import type { TableService } from "@/pages/services/adapters";

import { ServiceActiveBadge } from "./serviceActiveBadge";

interface Props {
  onDelete: (service: TableService) => void;
  editPermission: string;
  deletePermission: string;
}

export const useServicesColumns = ({
  onDelete,
  editPermission,
  deletePermission,
}: Props): ColumnDef<TableService>[] => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dateLocale = i18n.language === "ar" ? ar : enUS;
  const alignClass = i18n.language === "ar" ? "text-right" : "text-left";

  return [
    {
      accessorKey: "name",
      header: () => (
        <div className={alignClass}>
          {t("services.name", { defaultValue: "Service Name" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>
          <div className="font-medium text-[var(--lux-text)]">
            {row.original.name}
          </div>
          <div className="mt-1 text-xs text-[var(--lux-text-secondary)]">
            {row.original.code || row.original.unitName || "-"}
          </div>
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "category",
      header: () => (
        <div className={alignClass}>
          {t("services.categoryLabel", { defaultValue: "Service Category" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>
          {t(`services.category.${row.original.category}`, {
            defaultValue: row.original.categoryDisplay,
          })}
        </div>
      ),
    },
    {
      accessorKey: "pricingType",
      header: () => (
        <div className={alignClass}>
          {t("services.pricingTypeLabel", { defaultValue: "Pricing Type" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>
          {t(`services.pricingType.${row.original.pricingType}`, {
            defaultValue: row.original.pricingTypeDisplay,
          })}
        </div>
      ),
    },
    {
      accessorKey: "basePrice",
      header: () => (
        <div className={alignClass}>
          {t("services.basePrice", { defaultValue: "Base Price" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>{row.original.basePriceDisplay}</div>
      ),
    },
    {
      accessorKey: "isActive",
      header: () => (
        <div className={alignClass}>
          {t("services.statusLabel", { defaultValue: "Status" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>
          <ServiceActiveBadge isActive={row.original.isActive} />
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: () => (
        <div className={alignClass}>
          {t("services.createdAt", { defaultValue: "Created At" })}
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
            onClick={() => navigate(`/settings/services/${row.original.id}`)}
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>

          <ProtectedComponent permission={editPermission}>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/settings/services/edit/${row.original.id}`)}
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
