import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import type { ColumnDef } from "@tanstack/react-table";
import { Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import { Button } from "@/components/ui/button";
import type { TableVendorSubService } from "@/pages/vendors/adapters";

import { VendorActiveBadge } from "./vendorActiveBadge";

interface Props {
  editPermission: string;
}

export const useVendorSubServicesColumns = ({
  editPermission,
}: Props): ColumnDef<TableVendorSubService>[] => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dateLocale = i18n.language === "ar" ? ar : enUS;
  const alignClass = i18n.language === "ar" ? "text-right" : "text-left";

  return [
    {
      accessorKey: "name",
      header: () => (
        <div className={alignClass}>
          {t("vendors.subServices.name", { defaultValue: "Sub Service" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>
          <div className="font-medium text-[var(--lux-text)]">
            {row.original.name}
          </div>
          <div className="mt-1 text-xs text-[var(--lux-text-secondary)]">
            {row.original.code || "-"}
          </div>
        </div>
      ),
      enableSorting: true,
    },
    {
      id: "vendor",
      header: () => (
        <div className={alignClass}>
          {t("vendors.vendorSelection", { defaultValue: "Vendor" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>
          <div className="font-medium text-[var(--lux-text)]">
            {row.original.vendorDisplay}
          </div>
          <div className="mt-1 text-xs text-[var(--lux-text-secondary)]">
            {t(`vendors.type.${row.original.vendorType}`, {
              defaultValue: row.original.typeDisplay,
            })}
          </div>
        </div>
      ),
    },
    {
      id: "price",
      header: () => (
        <div className={alignClass}>
          {t("vendors.subServices.price", { defaultValue: "List Price" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>{row.original.priceDisplay}</div>
      ),
    },
    {
      accessorKey: "sortOrder",
      header: () => (
        <div className={alignClass}>
          {t("vendors.subServices.sortOrder", { defaultValue: "Sort Order" })}
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
        <div className="flex items-center justify-center">
          <ProtectedComponent permission={editPermission}>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                navigate(`/settings/vendors/sub-services/edit/${row.original.id}`)
              }
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
          </ProtectedComponent>
        </div>
      ),
    },
  ];
};
