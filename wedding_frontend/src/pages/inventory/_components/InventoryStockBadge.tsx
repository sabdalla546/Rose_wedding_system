import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { InventoryStockStatus } from "@/pages/inventory/adapters";

type InventoryStockBadgeProps = {
  status: InventoryStockStatus;
  quantity: number;
};

export function InventoryStockBadge({
  status,
  quantity,
}: InventoryStockBadgeProps) {
  const { t } = useTranslation();
  const isInStock = status === "in_stock";

  return (
    <Badge
      className={cn(
        "gap-1.5 rounded-full px-3 py-1 text-[10px] tracking-[0.16em]",
        isInStock
          ? "border-[color:color-mix(in_srgb,var(--lux-gold)_35%,var(--lux-control-border))]"
          : "border-[color:color-mix(in_srgb,var(--lux-danger)_48%,var(--lux-control-border))]",
      )}
      style={
        isInStock
          ? undefined
          : {
              background: "var(--lux-danger-soft)",
              borderColor:
                "color-mix(in srgb, var(--lux-danger) 48%, var(--lux-control-border))",
              color: "var(--lux-danger)",
              boxShadow:
                "inset 0 1px 0 color-mix(in srgb, var(--lux-danger) 16%, transparent)",
            }
      }
      variant={isInStock ? "default" : "destructive"}
    >
      <span>
        {isInStock
          ? t("inventory.status.inStock", { defaultValue: "In Stock" })
          : t("inventory.status.outOfStock", { defaultValue: "Out of Stock" })}
      </span>
      <span className="opacity-75">
        {t("inventory.units", {
          count: quantity,
          defaultValue: quantity === 1 ? "unit" : "units",
        })}
      </span>
    </Badge>
  );
}
