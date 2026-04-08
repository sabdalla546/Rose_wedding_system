import { Edit, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney } from "@/pages/contracts/adapters";
import type { ContractAmendmentItem } from "@/pages/contracts/amendments/types";

import {
  CONTRACT_AMENDMENT_ITEM_CHANGE_TYPE_LABELS,
  CONTRACT_AMENDMENT_ITEM_STATUS_LABELS,
  getContractAmendmentItemDisplayName,
} from "../adapters";

function AmendmentItemStatusPill({
  status,
}: {
  status: ContractAmendmentItem["status"];
}) {
  const toneClassName =
    status === "applied"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : status === "cancelled"
        ? "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300"
        : "border-slate-500/30 bg-slate-500/10 text-slate-200 dark:text-slate-200";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClassName}`}
    >
      {CONTRACT_AMENDMENT_ITEM_STATUS_LABELS[status]}
    </span>
  );
}

export function ContractAmendmentItemsTable({
  items,
  readOnly,
  onEdit,
  onDelete,
}: {
  items: ContractAmendmentItem[];
  readOnly?: boolean;
  onEdit?: (item: ContractAmendmentItem) => void;
  onDelete?: (item: ContractAmendmentItem) => void;
}) {
  const { t } = useTranslation();

  if (!items.length) {
    return (
      <p className="text-sm text-[var(--lux-text-secondary)]">
        {t("contracts.amendments.noItems", {
          defaultValue: "No amendment items have been added yet.",
        })}
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-[var(--lux-row-border)]">
          <TableHead>
            {t("contracts.amendments.changeType", {
              defaultValue: "Change Type",
            })}
          </TableHead>
          <TableHead>{t("contracts.service", { defaultValue: "Service" })}</TableHead>
          <TableHead>{t("contracts.category", { defaultValue: "Category" })}</TableHead>
          <TableHead>{t("contracts.quantity", { defaultValue: "Quantity" })}</TableHead>
          <TableHead>{t("contracts.unitPrice", { defaultValue: "Unit Price" })}</TableHead>
          <TableHead>{t("contracts.totalAmount", { defaultValue: "Total" })}</TableHead>
          <TableHead>{t("common.status", { defaultValue: "Status" })}</TableHead>
          <TableHead>{t("common.notes", { defaultValue: "Notes" })}</TableHead>
          {!readOnly ? (
            <TableHead>{t("common.actions", { defaultValue: "Actions" })}</TableHead>
          ) : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id} className="border-[var(--lux-row-border)]">
            <TableCell className="align-top">
              {t(`contracts.amendments.changeType.${item.changeType}`, {
                defaultValue:
                  CONTRACT_AMENDMENT_ITEM_CHANGE_TYPE_LABELS[item.changeType],
              })}
            </TableCell>
            <TableCell className="align-top">
              <div className="space-y-1">
                <div className="font-medium text-[var(--lux-text)]">
                  {getContractAmendmentItemDisplayName(item)}
                </div>
                {item.changeType === "remove_service" &&
                item.targetContractItemId ? (
                  <div className="text-xs text-[var(--lux-text-secondary)]">
                    {t("contracts.amendments.removesContractItem", {
                      defaultValue: "Removes contract item #{{id}}",
                      id: item.targetContractItemId,
                    })}
                  </div>
                ) : null}
              </div>
            </TableCell>
            <TableCell className="align-top text-[var(--lux-text-secondary)]">
              {item.category || "-"}
            </TableCell>
            <TableCell className="align-top text-[var(--lux-text-secondary)]">
              {item.quantity ?? "-"}
            </TableCell>
            <TableCell className="align-top text-[var(--lux-text-secondary)]">
              {formatMoney(item.unitPrice)}
            </TableCell>
            <TableCell className="align-top font-semibold text-[var(--lux-heading)]">
              {formatMoney(item.totalPrice)}
            </TableCell>
            <TableCell className="align-top">
              <AmendmentItemStatusPill status={item.status} />
            </TableCell>
            <TableCell className="max-w-[280px] whitespace-normal align-top text-[var(--lux-text-secondary)]">
              {item.notes || "-"}
            </TableCell>
            {!readOnly ? (
              <TableCell className="align-top">
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    type="button"
                    variant="outline"
                    onClick={() => onEdit?.(item)}
                  >
                    <Edit className="h-4 w-4" />
                    {t("common.edit", { defaultValue: "Edit" })}
                  </Button>
                  <Button
                    size="sm"
                    type="button"
                    variant="destructive"
                    onClick={() => onDelete?.(item)}
                  >
                    <Trash2 className="h-4 w-4" />
                    {t("common.delete", { defaultValue: "Delete" })}
                  </Button>
                </div>
              </TableCell>
            ) : null}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
