import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import { Button } from "@/components/ui/button";
import type { TableExecutionBrief } from "@/pages/execution/adapters";

import { ExecutionStatusBadge } from "./executionStatusBadge";

export const useExecutionColumns = (): ColumnDef<TableExecutionBrief>[] => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dateLocale = i18n.language === "ar" ? ar : enUS;
  const alignClass = i18n.language === "ar" ? "text-right" : "text-left";

  return [
    {
      accessorKey: "briefDisplay",
      header: () => (
        <div className={alignClass}>
          {t("execution.briefNumber", {
            defaultValue: "Execution Brief",
          })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>
          <div className="font-medium text-[var(--lux-text)]">
            {row.original.briefDisplay}
          </div>
          <div className="mt-1 text-xs text-[var(--lux-text-secondary)]">
            {row.original.eventDisplay}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "commercialDisplay",
      header: () => (
        <div className={alignClass}>
          {t("execution.commercialBasis", {
            defaultValue: "Commercial Basis",
          })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>{row.original.commercialDisplay}</div>
      ),
    },
    {
      accessorKey: "status",
      header: () => (
        <div className={alignClass}>
          {t("execution.statusLabel", { defaultValue: "Status" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>
          <ExecutionStatusBadge status={row.original.status} />
        </div>
      ),
    },
    {
      accessorKey: "updatedAtDisplay",
      header: () => (
        <div className={alignClass}>
          {t("common.updatedAt", { defaultValue: "Updated At" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>
          {row.original.updatedAtDisplay !== "-"
            ? format(new Date(row.original.updatedAtDisplay), "MMM d, yyyy", {
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
          <ProtectedComponent permission="events.read">
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/execution-briefs/${row.original.id}`)}
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
          </ProtectedComponent>
        </div>
      ),
    },
  ];
};
