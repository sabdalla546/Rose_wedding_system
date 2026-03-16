import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import type { ColumnDef } from "@tanstack/react-table";
import {
  CircleOff,
  Edit,
  Eye,
  MoreHorizontal,
  Trash2,
  UserCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TableLead } from "@/pages/leads/adapters";

import { LeadStatusBadge } from "./leadStatusBadge";

interface Props {
  onDelete: (lead: TableLead) => void;
  onMarkLost: (lead: TableLead) => void;
  onConvert: (lead: TableLead) => void;
  editPermission: string;
  deletePermission: string;
  updatePermission: string;
  convertPermission: string;
}

export const useLeadsColumns = ({
  onDelete,
  onMarkLost,
  onConvert,
  editPermission,
  deletePermission,
  updatePermission,
  convertPermission,
}: Props): ColumnDef<TableLead>[] => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dateLocale = i18n.language === "ar" ? ar : enUS;
  const alignClass = i18n.language === "ar" ? "text-right" : "text-left";

  return [
    {
      accessorKey: "fullName",
      header: () => (
        <div className={alignClass}>
          {t("leads.fullName", { defaultValue: "Full Name" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>
          <div className="font-medium text-[var(--lux-text)]">
            {row.original.fullName}
          </div>
          <div className="mt-1 text-xs text-[var(--lux-text-secondary)]">
            {row.original.email || row.original.contactSummary}
          </div>
        </div>
      ),
      enableSorting: true,
    },
    {
      id: "contact",
      header: () => (
        <div className={alignClass}>
          {t("leads.contact", { defaultValue: "Contact" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>
          <div>{row.original.mobile}</div>
          <div className="mt-1 text-xs text-[var(--lux-text-secondary)]">
            {row.original.mobile2 || "-"}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "weddingDate",
      header: () => (
        <div className={alignClass}>
          {t("leads.weddingDate", { defaultValue: "Wedding Date" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>
          {format(new Date(row.original.weddingDate), "MMM d, yyyy", {
            locale: dateLocale,
          })}
        </div>
      ),
      enableSorting: true,
    },
    {
      id: "venue",
      header: () => (
        <div className={alignClass}>
          {t("common.venue", { defaultValue: "Venue" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>{row.original.venueDisplay}</div>
      ),
    },
    {
      accessorKey: "sourceDisplay",
      header: () => (
        <div className={alignClass}>
          {t("leads.source", { defaultValue: "Source" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>{row.original.sourceDisplay}</div>
      ),
    },
    {
      accessorKey: "guestCount",
      header: () => (
        <div className={alignClass}>
          {t("leads.guestCount", { defaultValue: "Guests" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>{row.original.guestCount || "-"}</div>
      ),
    },
    {
      accessorKey: "status",
      header: () => (
        <div className={alignClass}>
          {t("leads.statusLabel", { defaultValue: "Status" })}
        </div>
      ),
      cell: ({ row }) => (
        <div className={alignClass}>
          <LeadStatusBadge status={row.original.status} />
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: () => (
        <div className={alignClass}>
          {t("leads.createdAt", { defaultValue: "Created At" })}
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
            onClick={() => navigate(`/leads/${row.original.id}`)}
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>

          <ProtectedComponent permission={editPermission}>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/leads/edit/${row.original.id}`)}
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
          </ProtectedComponent>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <ProtectedComponent permission={updatePermission}>
                <DropdownMenuItem
                  disabled={!row.original.canMarkLost}
                  onClick={() => onMarkLost(row.original)}
                >
                  <CircleOff className="me-2 h-4 w-4" />
                  {t("leads.markLost", { defaultValue: "Mark as Lost" })}
                </DropdownMenuItem>
              </ProtectedComponent>

              <ProtectedComponent permission={convertPermission}>
                <DropdownMenuItem
                  disabled={!row.original.canConvert}
                  onClick={() => onConvert(row.original)}
                >
                  <UserCheck className="me-2 h-4 w-4" />
                  {t("leads.convertToCustomer", {
                    defaultValue: "Convert to Customer",
                  })}
                </DropdownMenuItem>
              </ProtectedComponent>

              <ProtectedComponent permission={deletePermission}>
                <DropdownMenuItem
                  className="text-[var(--lux-danger)] hover:text-[var(--lux-danger)] focus:text-[var(--lux-danger)]"
                  onClick={() => onDelete(row.original)}
                >
                  <Trash2 className="me-2 h-4 w-4" />
                  {t("common.delete", { defaultValue: "Delete" })}
                </DropdownMenuItem>
              </ProtectedComponent>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];
};
