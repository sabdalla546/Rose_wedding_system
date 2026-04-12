import { useState } from "react";
import { ClipboardList, Handshake, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import CompactHeader from "@/components/common/CompactHeader";
import {
  CrudFilterField,
  CrudFilters,
  CrudPageLayout,
} from "@/components/shared/crud-layout";
import { DataTableShell } from "@/components/shared/data-table-shell";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/ui/confirmDialog";
import { DataTable } from "@/components/ui/data-table";
import { useDeleteVendor } from "@/hooks/vendors/useDeleteVendor";
import { useVendorTypes } from "@/hooks/vendors/useVendorTypes";
import { useVendors } from "@/hooks/vendors/useVendors";

import {
  getVendorTypeName,
  toTableVendors,
  type TableVendor,
} from "./adapters";
import { useVendorsColumns } from "./_components/vendorsColumns";
import type { VendorType } from "./types";

const VendorsPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const language = i18n.resolvedLanguage ?? "en";

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
  const { data: vendorTypesResponse } = useVendorTypes({
    currentPage: 1,
    itemsPerPage: 200,
    searchQuery: "",
    isActive: "all",
  });
  const vendorTypeOptions = vendorTypesResponse?.data ?? [];

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
            <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
              <ProtectedComponent permission={createPermission}>
                <Button size="sm" onClick={() => navigate("/settings/vendors/create")}>
                  <Plus className="h-4 w-4" />
                  {t("vendors.create", { defaultValue: "Create Vendor" })}
                </Button>
              </ProtectedComponent>
            </div>
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
                    "Manage reusable vendor sub-services and list prices by vendor type without changing event-level vendor workflows.",
                })}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/settings/vendors/types")}
              >
                {t("vendors.types.title", {
                  defaultValue: "Vendor Types",
                })}
              </Button>
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
              {vendorTypeOptions.map((option) => (
                <option key={option.id} value={option.slug}>
                  {getVendorTypeName({
                    slug: option.slug,
                    vendorType: option,
                    language,
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
