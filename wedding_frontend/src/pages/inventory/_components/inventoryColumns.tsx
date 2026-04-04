import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import type { ColumnDef } from "@tanstack/react-table";
import { Edit, Eye, ImageOff, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import { Button } from "@/components/ui/button";
import {
  formatInventoryQuantity,
  getInventoryImageUrl,
  type TableInventoryItem,
} from "@/pages/inventory/adapters";

import { InventoryStockBadge } from "./InventoryStockBadge";

interface InventoryColumnsProps {
  onDelete: (item: TableInventoryItem) => void;
  editPermission: string;
  deletePermission: string;
}

export const useInventoryColumns = ({
  onDelete,
  editPermission,
  deletePermission,
}: InventoryColumnsProps): ColumnDef<TableInventoryItem>[] => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dateLocale = i18n.language === "ar" ? ar : enUS;
  const alignClass = i18n.language === "ar" ? "text-right" : "text-left";

  return [
    {
      id: "image",
      header: () => (
        <div className={alignClass}>
          {t("inventory.image", { defaultValue: "Image" })}
        </div>
      ),
      cell: ({ row }) => {
        const imageUrl = getInventoryImageUrl(row.original);

        return (
          <div className={alignClass}>
            <div
              className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-[14px] border"
              style={{
                background: "var(--lux-control-hover)",
                borderColor: "var(--lux-control-border)",
              }}
            >
              {imageUrl ? (
                <img
                  alt={row.original.name}
                  className="h-full w-full object-cover"
                  src={imageUrl}
                />
              ) : (
                <ImageOff className="h-5 w-5 text-[var(--lux-text-muted)]" />
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "name",
      header: () => (
        <div className={alignClass}>
          {t("inventory.name", { defaultValue: "Product Name" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>
          <div className="font-medium text-[var(--lux-text)]">
            {row.original.name}
          </div>
          <div className="mt-1 text-xs text-[var(--lux-text-secondary)]">
            {t("inventory.updatedAt", { defaultValue: "Updated At" })}:{" "}
            {row.original.updatedAt
              ? format(new Date(row.original.updatedAt), "MMM d, yyyy", {
                  locale: dateLocale,
                })
              : "-"}
          </div>
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "quantity",
      header: () => (
        <div className={alignClass}>
          {t("inventory.quantity", { defaultValue: "Quantity" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>
          <div className="font-semibold text-[var(--lux-heading)]">
            {formatInventoryQuantity(row.original.quantity)}
          </div>
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "stockStatus",
      header: () => (
        <div className={alignClass}>
          {t("inventory.stockStatus", { defaultValue: "Stock Status" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>
          <InventoryStockBadge
            quantity={row.original.quantity}
            status={row.original.stockStatus}
          />
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: () => (
        <div className={alignClass}>
          {t("inventory.createdAt", { defaultValue: "Created At" })}
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
            onClick={() => navigate(`/inventory/${row.original.id}`)}
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>

          <ProtectedComponent permission={editPermission}>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/inventory/edit/${row.original.id}`)}
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
