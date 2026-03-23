import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import type { ColumnDef } from "@tanstack/react-table";
import { Edit, Eye, FilePlus2, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import { Button } from "@/components/ui/button";
import type { TableQuotation } from "@/pages/quotations/adapters";

import { QuotationStatusBadge } from "./quotationStatusBadge";

interface Props {
  onDelete: (quotation: TableQuotation) => void;
  onCreateContract: (quotation: TableQuotation) => void;
  editPermission: string;
  deletePermission: string;
}

export const useQuotationsColumns = ({
  onDelete,
  onCreateContract,
  editPermission,
  deletePermission,
}: Props): ColumnDef<TableQuotation>[] => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dateLocale = i18n.language === "ar" ? ar : enUS;
  const alignClass = i18n.language === "ar" ? "text-right" : "text-left";

  return [
    {
      accessorKey: "quotationNumberDisplay",
      header: () => (
        <div className={alignClass}>
          {t("quotations.quotationNumber", {
            defaultValue: "Quotation Number",
          })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>
          <div className="font-medium text-[var(--lux-text)]">
            {row.original.quotationNumberDisplay}
          </div>
          <div className="mt-1 text-xs text-[var(--lux-text-secondary)]">
            {row.original.eventDisplay}
          </div>
        </div>
      ),
      enableSorting: true,
    },
    {
      id: "customerLead",
      header: () => (
        <div className={alignClass}>
          {t("quotations.customerLead", {
            defaultValue: "Customer / Lead",
          })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>{row.original.customerLeadDisplay}</div>
      ),
    },
    {
      accessorKey: "issueDate",
      header: () => (
        <div className={alignClass}>
          {t("quotations.issueDate", { defaultValue: "Issue Date" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>
          {format(new Date(row.original.issueDate), "MMM d, yyyy", {
            locale: dateLocale,
          })}
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "validUntil",
      header: () => (
        <div className={alignClass}>
          {t("quotations.validUntil", { defaultValue: "Valid Until" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>
          {row.original.validUntil
            ? format(new Date(row.original.validUntil), "MMM d, yyyy", {
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
          {t("quotations.statusLabel", { defaultValue: "Status" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>
          <QuotationStatusBadge status={row.original.status} />
        </div>
      ),
    },
    {
      accessorKey: "subtotal",
      header: () => (
        <div className={alignClass}>
          {t("quotations.subtotal", { defaultValue: "Subtotal" })}
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
          {t("quotations.discount", { defaultValue: "Discount" })}
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
          {t("quotations.totalAmount", { defaultValue: "Total Amount" })}
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
            onClick={() => navigate(`/quotations/${row.original.id}`)}
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>

          <ProtectedComponent permission={editPermission}>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/quotations/edit/${row.original.id}`)}
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

          <Button
            size="sm"
            variant="secondary"
            onClick={() => onCreateContract(row.original)}
          >
            <FilePlus2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];
};
