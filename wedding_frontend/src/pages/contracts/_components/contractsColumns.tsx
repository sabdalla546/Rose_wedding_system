import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import type { ColumnDef } from "@tanstack/react-table";
import { Edit, Eye, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import { Button } from "@/components/ui/button";
import { isContractLocked } from "@/lib/workflow/workflow";
import type { TableContract } from "@/pages/contracts/adapters";

import { ContractStatusBadge } from "./contractStatusBadge";

interface Props {
  onDelete: (contract: TableContract) => void;
  editPermission: string;
  deletePermission: string;
}

export const useContractsColumns = ({
  onDelete,
  editPermission,
  deletePermission,
}: Props): ColumnDef<TableContract>[] => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dateLocale = i18n.language === "ar" ? ar : enUS;
  const alignClass = i18n.language === "ar" ? "text-right" : "text-left";

  return [
    {
      accessorKey: "contractNumberDisplay",
      header: () => (
        <div className={alignClass}>
          {t("contracts.contractNumber", {
            defaultValue: "Contract Number",
          })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>
          <div className="font-medium text-[var(--lux-text)]">
            {row.original.contractNumberDisplay}
          </div>
          <div className="mt-1 text-xs text-[var(--lux-text-secondary)]">
            {row.original.quotationDisplay}
          </div>
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "eventDisplay",
      header: () => (
        <div className={alignClass}>
          {t("contracts.event", { defaultValue: "Event" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>{row.original.eventDisplay}</div>
      ),
    },
    {
      id: "customerLead",
      header: () => (
        <div className={alignClass}>
          {t("contracts.customerLead", {
            defaultValue: "Customer / Lead",
          })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>{row.original.customerLeadDisplay}</div>
      ),
    },
    {
      accessorKey: "signedDate",
      header: () => (
        <div className={alignClass}>
          {t("contracts.signedDate", { defaultValue: "Signed Date" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>
          {format(new Date(row.original.signedDate), "MMM d, yyyy", {
            locale: dateLocale,
          })}
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "eventDate",
      header: () => (
        <div className={alignClass}>
          {t("contracts.eventDate", { defaultValue: "Event Date" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>
          {row.original.eventDate
            ? format(new Date(row.original.eventDate), "MMM d, yyyy", {
                locale: dateLocale,
              })
            : "-"}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: () => (
        <div className={alignClass}>
          {t("contracts.statusLabel", { defaultValue: "Status" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>
          <ContractStatusBadge status={row.original.status} />
        </div>
      ),
    },
    {
      accessorKey: "subtotal",
      header: () => (
        <div className={alignClass}>
          {t("contracts.subtotal", { defaultValue: "Subtotal" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>{row.original.subtotalDisplay}</div>
      ),
    },
    {
      accessorKey: "discountAmount",
      header: () => (
        <div className={alignClass}>
          {t("contracts.discount", { defaultValue: "Discount" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>{row.original.discountAmountDisplay}</div>
      ),
    },
    {
      accessorKey: "totalAmount",
      header: () => (
        <div className={alignClass}>
          {t("contracts.totalAmount", { defaultValue: "Total Amount" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>{row.original.totalAmountDisplay}</div>
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
        <div className="flex  items-center justify-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/contracts/${row.original.id}`)}
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>

          <ProtectedComponent permission={editPermission}>
            <Button
              size="sm"
              variant="outline"
              disabled={isContractLocked(row.original.status)}
              title={
                isContractLocked(row.original.status)
                  ? t("contracts.lockedEditHint", {
                      defaultValue:
                        "Signed or active contracts are read-only.",
                    })
                  : undefined
              }
              onClick={() => navigate(`/contracts/edit/${row.original.id}`)}
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
