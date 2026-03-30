import { useState } from "react";
import { Plus, Tags } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import CompactHeader from "@/components/common/CompactHeader";
import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import {
  CrudFilterField,
  CrudFilters,
  CrudPageLayout,
} from "@/components/shared/crud-layout";
import { DataTableShell } from "@/components/shared/data-table-shell";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/ui/confirmDialog";
import { DataTable } from "@/components/ui/data-table";
import { useDeleteVendorType } from "@/hooks/vendors/useDeleteVendorType";
import { useVendorTypes } from "@/hooks/vendors/useVendorTypes";

import {
  toTableVendorTypes,
  type TableVendorType,
} from "./adapters";
import { useVendorTypesColumns } from "./_components/vendorTypesColumns";

const VendorTypesPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isActiveFilter, setIsActiveFilter] = useState<"all" | "true" | "false">(
    "all",
  );
  const [deleteCandidate, setDeleteCandidate] = useState<TableVendorType | null>(
    null,
  );

  const viewPermission = "vendors.read";
  const createPermission = "vendors.create";
  const editPermission = "vendors.update";
  const deletePermission = "vendors.delete";

  const { data: raw, isLoading } = useVendorTypes({
    currentPage,
    itemsPerPage,
    searchQuery,
    isActive: isActiveFilter,
  });

  const adapted = toTableVendorTypes(raw);
  const vendorTypes = adapted.data.vendorTypes;
  const totalItems = adapted.total;
  const totalPages = adapted.totalPages;
  const rowNumberStart = (currentPage - 1) * itemsPerPage + 1;

  const columns = useVendorTypesColumns({
    onDelete: setDeleteCandidate,
    editPermission,
    deletePermission,
  });

  const deleteMutation = useDeleteVendorType();

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
          icon={<Tags className="h-5 w-5 text-primary" />}
          title={t("vendors.types.title", { defaultValue: "Vendor Types" })}
          totalText={
            <>
              {totalItems}{" "}
              {t("vendors.types.total", { defaultValue: "total vendor types" })}
            </>
          }
          search={{
            placeholder: t("vendors.types.searchPlaceholder", {
              defaultValue: "Search by name, Arabic name, or slug...",
            }),
            value: searchTerm,
            onChange: setSearchTerm,
            onSubmit: handleSearchSubmit,
          }}
          right={
            <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
              <ProtectedComponent permission={createPermission}>
                <Button
                  size="sm"
                  onClick={() => navigate("/settings/vendors/types/create")}
                >
                  <Plus className="h-4 w-4" />
                  {t("vendors.types.create", { defaultValue: "Create Vendor Type" })}
                </Button>
              </ProtectedComponent>
            </div>
          }
        />

        <CrudFilters
          title={t("common.filters", { defaultValue: "Filters" })}
          description={t("vendors.types.filterDescription", {
            defaultValue: "Filter vendor types by active status.",
          })}
          contentClassName="md:grid-cols-1 xl:grid-cols-[minmax(220px,1fr)]"
        >
          <CrudFilterField
            label={t("vendors.statusFilter", { defaultValue: "Status Filter" })}
          >
            <select
              className="app-native-select"
              value={isActiveFilter}
              onChange={(event) => {
                setIsActiveFilter(event.target.value as "all" | "true" | "false");
                setCurrentPage(1);
              }}
            >
              <option value="all">
                {t("vendors.types.allStatuses", {
                  defaultValue: "All Vendor Types",
                })}
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
          title={t("vendors.types.listTitle", { defaultValue: "Vendor Types List" })}
          totalItems={totalItems}
          currentCount={vendorTypes.length}
          entityName={t("vendors.types.title", { defaultValue: "Vendor Types" })}
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
            data={vendorTypes}
            rowNumberStart={rowNumberStart}
            enableRowNumbers
            fileName="vendor-types"
            isLoading={isLoading}
          />
        </DataTableShell>

        <ConfirmDialog
          open={deleteCandidate !== null}
          onOpenChange={(open) => !open && setDeleteCandidate(null)}
          title={t("vendors.types.deleteTitle", {
            defaultValue: "Delete Vendor Type",
          })}
          message={t("vendors.types.deleteMessage", {
            defaultValue: "Are you sure you want to delete this vendor type?",
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

export default VendorTypesPage;
