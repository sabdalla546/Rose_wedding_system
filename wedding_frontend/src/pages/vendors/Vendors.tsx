import { useState } from "react";
import { ClipboardList, Handshake, Plus, Tags } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import {
  CrudFilterField,
  CrudFilters,
  CrudPageHeader,
  CrudPageLayout,
} from "@/components/shared/crud-layout";
import { DataTableShell } from "@/components/shared/data-table-shell";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/ui/confirmDialog";
import { DataTable } from "@/components/ui/data-table";
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
      <CrudPageLayout>
        <CrudPageHeader
          icon={<Handshake className="h-5 w-5 text-primary" />}
          title={t("vendors.title", { defaultValue: "Vendors" })}
          meta={
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
          actions={
            <ProtectedComponent permission={createPermission}>
              <Button
                onClick={() => navigate("/settings/vendors/create")}
              >
                <Plus className="h-4 w-4" />
                {t("vendors.create", { defaultValue: "Create Vendor" })}
              </Button>
            </ProtectedComponent>
          }
        />

        <SectionCard className="space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-[var(--lux-heading)]">
                {t("vendors.masterDataTitle", {
                  defaultValue: "Vendor Master Data",
                })}
              </h2>
              <p className="text-sm text-[var(--lux-text-secondary)]">
                {t("vendors.masterDataDescription", {
                  defaultValue:
                    "Manage reusable vendor sub-services and pricing plans by vendor type without changing event-level vendor workflows.",
                })}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/settings/vendors/sub-services")}
              >
                <ClipboardList className="h-4 w-4" />
                {t("vendors.subServices.title", {
                  defaultValue: "Vendor Sub Services",
                })}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/settings/vendors/pricing-plans")}
              >
                <Tags className="h-4 w-4" />
                {t("vendors.pricingPlans.title", {
                  defaultValue: "Vendor Pricing Plans",
                })}
              </Button>
            </div>
          </div>
        </SectionCard>

        <CrudFilters
          title={t("common.filters", { defaultValue: "Filters" })}
          description={t("vendors.filterDescription", {
            defaultValue: "Refine the vendor list by type and activity status.",
          })}
          contentClassName="md:grid-cols-2 xl:grid-cols-[repeat(2,minmax(220px,1fr))]"
        >
          <CrudFilterField
            label={t("vendors.typeLabel", { defaultValue: "Vendor Type" })}
          >
            <select
              className="app-native-select"
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
          </CrudFilterField>

          <CrudFilterField
            label={t("vendors.statusFilter", { defaultValue: "Status Filter" })}
          >
            <select
              className="app-native-select"
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
          </CrudFilterField>
        </CrudFilters>

        <DataTableShell
          title={t("vendors.listTitle", { defaultValue: "Vendors List" })}
          totalItems={totalItems}
          currentCount={vendors.length}
          entityName={t("vendors.title", { defaultValue: "Vendors" })}
          itemsPerPage={itemsPerPage}
          setItemsPerPage={setItemsPerPage}
          setCurrentPage={setCurrentPage}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(value) => {
            setItemsPerPage(value);
            setCurrentPage(1);
          }}
        >
          <DataTable
            columns={columns}
            data={vendors}
            rowNumberStart={rowNumberStart}
            enableRowNumbers
            fileName="vendors"
            isLoading={isLoading}
          />
        </DataTableShell>

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
      </CrudPageLayout>
    </ProtectedComponent>
  );
};

export default VendorsPage;
