import { useState } from "react";
import { Handshake, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import CompactHeader from "@/components/common/CompactHeader";
import TableHeader from "@/components/common/TableHeader";
import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/ui/confirmDialog";
import { DataTable } from "@/components/ui/data-table";
import Pagination from "@/components/ui/pagination";
import { useDeleteVendor } from "@/hooks/vendors/useDeleteVendor";
import { useVendors } from "@/hooks/vendors/useVendors";

import {
  toTableVendors,
  VENDOR_TYPE_OPTIONS,
  type TableVendor,
} from "./adapters";
import { useVendorsColumns } from "./_components/vendorsColumns";
import type { VendorType } from "./types";

const VendorsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [typeFilter, setTypeFilter] = useState<"all" | VendorType>("all");
  const [isActiveFilter, setIsActiveFilter] = useState<
    "all" | "true" | "false"
  >("all");
  const [deleteCandidate, setDeleteCandidate] = useState<TableVendor | null>(
    null,
  );

  const viewPermission = "vendors.read";
  const createPermission = "vendors.create";
  const editPermission = "vendors.update";
  const deletePermission = "vendors.delete";

  const { data: raw, isLoading } = useVendors({
    currentPage,
    itemsPerPage,
    searchQuery,
    type: typeFilter,
    isActive: isActiveFilter,
  });

  const adapted = toTableVendors(raw);
  const vendors = adapted.data.vendors;
  const totalItems = adapted.total;
  const totalPages = adapted.totalPages;
  const rowNumberStart = (currentPage - 1) * itemsPerPage + 1;

  const columns = useVendorsColumns({
    onDelete: setDeleteCandidate,
    editPermission,
    deletePermission,
  });

  const deleteMutation = useDeleteVendor();

  const handleSearchSubmit = () => {
    setSearchQuery(searchTerm.trim());
    setCurrentPage(1);
  };

  const handleDeleteConfirm = () => {
    if (!deleteCandidate) {
      return;
    }

    deleteMutation.mutate(deleteCandidate.id, {
      onSettled: () => setDeleteCandidate(null),
    });
  };

  return (
    <ProtectedComponent permission={viewPermission}>
      <div className="min-h-screen space-y-4 bg-background p-4 text-foreground">
        <CompactHeader
          icon={<Handshake className="h-5 w-5 text-primary" />}
          title={t("vendors.title", { defaultValue: "Vendors" })}
          totalText={
            <>
              {totalItems}{" "}
              {t("vendors.totalVendors", { defaultValue: "total vendors" })}
            </>
          }
          search={{
            placeholder: t("vendors.searchPlaceholder", {
              defaultValue:
                "Search by vendor name, contact person, phone, or email...",
            }),
            value: searchTerm,
            onChange: setSearchTerm,
            onSubmit: handleSearchSubmit,
          }}
          right={
            <ProtectedComponent permission={createPermission}>
              <Button
                size="sm"
                className="h-auto px-3 py-2 text-xs"
                onClick={() => navigate("/settings/vendors/create")}
              >
                <Plus className="h-3.5 w-3.5" />
                {t("vendors.create", { defaultValue: "Create Vendor" })}
              </Button>
            </ProtectedComponent>
          }
        />

        <SectionCard className="space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <label className="min-w-[220px] space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--lux-text-muted)]">
                {t("vendors.typeLabel", { defaultValue: "Vendor Type" })}
              </span>
              <select
                className="h-11 w-full rounded-2xl border px-4 text-sm text-[var(--lux-text)] outline-none transition focus:border-[var(--lux-gold-border)]"
                style={{
                  background: "var(--lux-control-surface)",
                  borderColor: "var(--lux-control-border)",
                }}
                value={typeFilter}
                onChange={(event) => {
                  setTypeFilter(event.target.value as "all" | VendorType);
                  setCurrentPage(1);
                }}
              >
                <option value="all">
                  {t("vendors.allTypes", { defaultValue: "All Types" })}
                </option>
                {VENDOR_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(`vendors.type.${option.value}`, {
                      defaultValue: option.label,
                    })}
                  </option>
                ))}
              </select>
            </label>

            <label className="min-w-[220px] space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--lux-text-muted)]">
                {t("vendors.statusFilter", { defaultValue: "Status Filter" })}
              </span>
              <select
                className="h-11 w-full rounded-2xl border px-4 text-sm text-[var(--lux-text)] outline-none transition focus:border-[var(--lux-gold-border)]"
                style={{
                  background: "var(--lux-control-surface)",
                  borderColor: "var(--lux-control-border)",
                }}
                value={isActiveFilter}
                onChange={(event) => {
                  setIsActiveFilter(
                    event.target.value as "all" | "true" | "false",
                  );
                  setCurrentPage(1);
                }}
              >
                <option value="all">
                  {t("vendors.allStatuses", { defaultValue: "All Vendors" })}
                </option>
                <option value="true">
                  {t("vendors.activeOnly", { defaultValue: "Active Only" })}
                </option>
                <option value="false">
                  {t("vendors.inactiveOnly", { defaultValue: "Inactive Only" })}
                </option>
              </select>
            </label>
          </div>
        </SectionCard>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <TableHeader
            title={t("vendors.listTitle", { defaultValue: "Vendors List" })}
            totalItems={totalItems}
            currentCount={vendors.length}
            entityName={t("vendors.title", { defaultValue: "Vendors" })}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setItemsPerPage}
            setCurrentPage={setCurrentPage}
          />

          <div className="overflow-hidden">
            <DataTable
              columns={columns}
              data={vendors}
              rowNumberStart={rowNumberStart}
              enableRowNumbers
              fileName="vendors"
              isLoading={isLoading}
            />
          </div>

          {totalPages > 1 ? (
            <div className="border-t border-border bg-muted/40 px-6 py-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={(value) => {
                  setItemsPerPage(value);
                  setCurrentPage(1);
                }}
              />
            </div>
          ) : null}
        </div>

        <ConfirmDialog
          open={deleteCandidate !== null}
          onOpenChange={(open) => !open && setDeleteCandidate(null)}
          title={t("vendors.deleteTitle", { defaultValue: "Delete Vendor" })}
          message={t("vendors.deleteMessage", {
            defaultValue: "Are you sure you want to delete this vendor?",
          })}
          confirmLabel={t("common.delete", { defaultValue: "Delete" })}
          cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
          onConfirm={handleDeleteConfirm}
          isPending={deleteMutation.isPending}
        />
      </div>
    </ProtectedComponent>
  );
};

export default VendorsPage;
