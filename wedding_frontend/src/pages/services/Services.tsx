import { useState } from "react";
import { PackageOpen, Plus } from "lucide-react";
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
import { useDeleteService } from "@/hooks/services/useDeleteService";
import { useServices } from "@/hooks/services/useServices";

import {
  SERVICE_CATEGORY_OPTIONS,
  SERVICE_PRICING_TYPE_OPTIONS,
  toTableServices,
  type TableService,
} from "./adapters";
import { useServicesColumns } from "./_components/servicesColumns";
import type { ServiceCategory, ServicePricingType } from "./types";

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
  const [pricingTypeFilter, setPricingTypeFilter] = useState<
    "all" | ServicePricingType
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
    pricingType: pricingTypeFilter,
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
      <div className="min-h-screen space-y-4 bg-background p-4 text-foreground">
        <CompactHeader
          icon={<PackageOpen className="h-5 w-5 text-primary" />}
          title={t("services.title", { defaultValue: "Services" })}
          totalText={
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
          right={
            <ProtectedComponent permission={createPermission}>
              <Button
                size="sm"
                className="h-auto px-3 py-2 text-xs"
                onClick={() => navigate("/settings/services/create")}
              >
                <Plus className="h-3.5 w-3.5" />
                {t("services.create", { defaultValue: "Create Service" })}
              </Button>
            </ProtectedComponent>
          }
        />

        <SectionCard className="space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <label className="min-w-[220px] space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--lux-text-muted)]">
                {t("services.categoryLabel", {
                  defaultValue: "Service Category",
                })}
              </span>
              <select
                className="h-11 w-full rounded-2xl border px-4 text-sm text-[var(--lux-text)] outline-none transition focus:border-[var(--lux-gold-border)]"
                style={{
                  background: "var(--lux-control-surface)",
                  borderColor: "var(--lux-control-border)",
                }}
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
            </label>

            <label className="min-w-[220px] space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--lux-text-muted)]">
                {t("services.pricingTypeLabel", {
                  defaultValue: "Pricing Type",
                })}
              </span>
              <select
                className="h-11 w-full rounded-2xl border px-4 text-sm text-[var(--lux-text)] outline-none transition focus:border-[var(--lux-gold-border)]"
                style={{
                  background: "var(--lux-control-surface)",
                  borderColor: "var(--lux-control-border)",
                }}
                value={pricingTypeFilter}
                onChange={(event) => {
                  setPricingTypeFilter(
                    event.target.value as "all" | ServicePricingType,
                  );
                  setCurrentPage(1);
                }}
              >
                <option value="all">
                  {t("services.allPricingTypes", {
                    defaultValue: "All Pricing Types",
                  })}
                </option>
                {SERVICE_PRICING_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(`services.pricingType.${option.value}`, {
                      defaultValue: option.label,
                    })}
                  </option>
                ))}
              </select>
            </label>

            <label className="min-w-[220px] space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--lux-text-muted)]">
                {t("services.statusFilter", { defaultValue: "Status Filter" })}
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
                  {t("services.allStatuses", { defaultValue: "All Services" })}
                </option>
                <option value="true">
                  {t("services.activeOnly", { defaultValue: "Active Only" })}
                </option>
                <option value="false">
                  {t("services.inactiveOnly", { defaultValue: "Inactive Only" })}
                </option>
              </select>
            </label>
          </div>
        </SectionCard>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <TableHeader
            title={t("services.listTitle", { defaultValue: "Services List" })}
            totalItems={totalItems}
            currentCount={services.length}
            entityName={t("services.title", { defaultValue: "Services" })}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setItemsPerPage}
            setCurrentPage={setCurrentPage}
          />

          <div className="overflow-hidden">
            <DataTable
              columns={columns}
              data={services}
              rowNumberStart={rowNumberStart}
              enableRowNumbers
              fileName="services"
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
          title={t("services.deleteTitle", { defaultValue: "Delete Service" })}
          message={t("services.deleteMessage", {
            defaultValue: "Are you sure you want to delete this service?",
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

export default ServicesPage;
