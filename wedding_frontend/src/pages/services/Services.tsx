import { useState } from "react";
import { PackageOpen, Plus } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/ui/confirmDialog";
import { DataTable } from "@/components/ui/data-table";
import { useDeleteService } from "@/hooks/services/useDeleteService";
import { useServices } from "@/hooks/services/useServices";

import {
  SERVICE_CATEGORY_OPTIONS,
  toTableServices,
  type TableService,
} from "./adapters";
import { useServicesColumns } from "./_components/servicesColumns";
import type { ServiceCategory } from "./types";

const ServicesPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [categoryFilter, setCategoryFilter] = useState<
    "all" | ServiceCategory
  >("all");
  const [isActiveFilter, setIsActiveFilter] = useState<
    "all" | "true" | "false"
  >("all");
  const [deleteCandidate, setDeleteCandidate] = useState<TableService | null>(
    null,
  );

  const viewPermission = "services.read";
  const createPermission = "services.create";
  const editPermission = "services.update";
  const deletePermission = "services.delete";

  const { data: raw, isLoading } = useServices({
    currentPage,
    itemsPerPage,
    searchQuery,
    category: categoryFilter,
    isActive: isActiveFilter,
  });

  const adapted = toTableServices(raw);
  const services = adapted.data.services;
  const totalItems = adapted.total;
  const totalPages = adapted.totalPages;
  const rowNumberStart = (currentPage - 1) * itemsPerPage + 1;

  const columns = useServicesColumns({
    onDelete: setDeleteCandidate,
    editPermission,
    deletePermission,
  });

  const deleteMutation = useDeleteService();

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
          icon={<PackageOpen className="h-5 w-5 text-primary" />}
          title={t("services.title", { defaultValue: "Services" })}
          meta={
            <>
              {totalItems}{" "}
              {t("services.totalServices", { defaultValue: "total services" })}
            </>
          }
          search={{
            placeholder: t("services.searchPlaceholder", {
              defaultValue:
                "Search by service name, code, category, or description...",
            }),
            value: searchTerm,
            onChange: setSearchTerm,
            onSubmit: handleSearchSubmit,
          }}
          actions={
            <ProtectedComponent permission={createPermission}>
              <Button onClick={() => navigate("/settings/services/create")}>
                <Plus className="h-4 w-4" />
                {t("services.create", { defaultValue: "Create Service" })}
              </Button>
            </ProtectedComponent>
          }
        />

        <CrudFilters
          title={t("common.filters", { defaultValue: "Filters" })}
          description={t("services.filterDescription", {
            defaultValue: "Refine the service catalog by category and active status.",
          })}
          contentClassName="md:grid-cols-2 xl:grid-cols-[repeat(2,minmax(220px,1fr))]"
        >
          <CrudFilterField
            label={t("services.categoryLabel", {
              defaultValue: "Service Category",
            })}
          >
              <select
                className="app-native-select"
                value={categoryFilter}
                onChange={(event) => {
                  setCategoryFilter(event.target.value as "all" | ServiceCategory);
                  setCurrentPage(1);
                }}
              >
                <option value="all">
                  {t("services.allCategories", {
                    defaultValue: "All Categories",
                  })}
                </option>
                {SERVICE_CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(`services.category.${option.value}`, {
                      defaultValue: option.label,
                    })}
                  </option>
                ))}
              </select>
          </CrudFilterField>

          <CrudFilterField
            label={t("services.statusFilter", { defaultValue: "Status Filter" })}
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
                  {t("services.allStatuses", { defaultValue: "All Services" })}
                </option>
                <option value="true">
                  {t("services.activeOnly", { defaultValue: "Active Only" })}
                </option>
                <option value="false">
                  {t("services.inactiveOnly", { defaultValue: "Inactive Only" })}
                </option>
              </select>
          </CrudFilterField>
        </CrudFilters>

        <DataTableShell
          title={t("services.listTitle", { defaultValue: "Services List" })}
          totalItems={totalItems}
          currentCount={services.length}
          entityName={t("services.title", { defaultValue: "Services" })}
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
            data={services}
            rowNumberStart={rowNumberStart}
            enableRowNumbers
            fileName="services"
            isLoading={isLoading}
          />
        </DataTableShell>

        <ConfirmDialog
          open={deleteCandidate !== null}
          onOpenChange={(open) => !open && setDeleteCandidate(null)}
          title={t("services.deleteTitle", { defaultValue: "Delete Service" })}
          message={t("services.deleteMessage", {
            defaultValue: "Are you sure you want to delete this service?",
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

export default ServicesPage;
