import { useState } from "react";
import { Package2, Plus } from "lucide-react";
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
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/ui/confirmDialog";
import { DataTable } from "@/components/ui/data-table";
import { useInventory } from "@/hooks/inventory/useInventory";
import { useDeleteInventoryItem } from "@/hooks/inventory/useInventoryMutations";

import {
  INVENTORY_STOCK_FILTER_OPTIONS,
  toTableInventory,
  type TableInventoryItem,
} from "./adapters";
import { useInventoryColumns } from "./_components/inventoryColumns";
import type { InventoryStockFilter } from "./types";

const InventoryPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [stockFilter, setStockFilter] =
    useState<InventoryStockFilter>("all");
  const [deleteCandidate, setDeleteCandidate] =
    useState<TableInventoryItem | null>(null);

  const { data: raw, isLoading } = useInventory({
    currentPage,
    itemsPerPage,
    searchQuery,
    stockFilter,
  });

  const adapted = toTableInventory(raw);
  const items = adapted.data.items;
  const totalItems = adapted.total;
  const totalPages = adapted.totalPages;
  const rowNumberStart = (currentPage - 1) * itemsPerPage + 1;

  const deleteMutation = useDeleteInventoryItem();

  const columns = useInventoryColumns({
    onDelete: setDeleteCandidate,
    editPermission: "inventory.update",
    deletePermission: "inventory.delete",
  });

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

  const hasActiveFilters = searchQuery.length > 0 || stockFilter !== "all";
  const showEmptyCatalog = !isLoading && items.length === 0 && !hasActiveFilters;

  return (
    <ProtectedComponent permission="inventory.read">
      <CrudPageLayout>
        <CompactHeader
          icon={<Package2 className="h-5 w-5 text-primary" />}
          title={t("inventory.title", { defaultValue: "Inventory" })}
          subtitle={t("inventory.description", {
            defaultValue:
              "Manage standalone stock items, quantities, and optional catalog images.",
          })}
          totalText={
            <>
              {totalItems}{" "}
              {t("inventory.totalItems", {
                defaultValue: "total items",
              })}
            </>
          }
          search={{
            placeholder: t("inventory.searchPlaceholder", {
              defaultValue: "Search inventory by product name...",
            }),
            value: searchTerm,
            onChange: setSearchTerm,
            onSubmit: handleSearchSubmit,
          }}
          right={
            <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
              <ProtectedComponent permission="inventory.create">
                <Button size="sm" onClick={() => navigate("/inventory/create")}>
                  <Plus className="h-4 w-4" />
                  {t("inventory.create", {
                    defaultValue: "Create Item",
                  })}
                </Button>
              </ProtectedComponent>
            </div>
          }
        />

        <CrudFilters
          title={t("common.filters", { defaultValue: "Filters" })}
          description={t("inventory.filterDescription", {
            defaultValue:
              "Refine the stock catalog by product name and stock availability.",
          })}
          contentClassName="md:grid-cols-1 xl:grid-cols-[minmax(240px,320px)]"
        >
          <CrudFilterField
            label={t("inventory.stockFilter", {
              defaultValue: "Stock Filter",
            })}
          >
            <select
              className="app-native-select"
              value={stockFilter}
              onChange={(event) => {
                setStockFilter(event.target.value as InventoryStockFilter);
                setCurrentPage(1);
              }}
            >
              {INVENTORY_STOCK_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(`inventory.filters.${option.value}`, {
                    defaultValue: option.label,
                  })}
                </option>
              ))}
            </select>
          </CrudFilterField>
        </CrudFilters>

        {showEmptyCatalog ? (
          <SectionCard className="flex flex-col items-center justify-center gap-5 px-6 py-16 text-center">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-[22px] border"
              style={{
                background: "var(--lux-control-hover)",
                borderColor: "var(--lux-control-border)",
                color: "var(--lux-gold)",
              }}
            >
              <Package2 className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-[var(--lux-heading)]">
                {t("inventory.emptyTitle", {
                  defaultValue: "No inventory items yet",
                })}
              </h2>
              <p className="mx-auto max-w-2xl text-sm text-[var(--lux-text-secondary)]">
                {t("inventory.emptyDescription", {
                  defaultValue:
                    "Start your standalone stock catalog by creating the first item and adding its quantity and reference image.",
                })}
              </p>
            </div>
            <ProtectedComponent permission="inventory.create">
              <Button onClick={() => navigate("/inventory/create")}>
                <Plus className="h-4 w-4" />
                {t("inventory.emptyAction", {
                  defaultValue: "Create First Item",
                })}
              </Button>
            </ProtectedComponent>
          </SectionCard>
        ) : (
          <DataTableShell
            title={t("inventory.listTitle", { defaultValue: "Inventory Items" })}
            totalItems={totalItems}
            currentCount={items.length}
            entityName={t("inventory.title", { defaultValue: "Inventory" })}
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
              data={items}
              rowNumberStart={rowNumberStart}
              enableRowNumbers
              fileName="inventory"
              isLoading={isLoading}
              emptyTitle={t("inventory.emptyFilteredTitle", {
                defaultValue: "No matching inventory items",
              })}
              emptyDescription={t("inventory.emptyFilteredDescription", {
                defaultValue:
                  "Try changing the search term or stock filter to find matching items.",
              })}
            />
          </DataTableShell>
        )}

        <ConfirmDialog
          open={deleteCandidate !== null}
          onOpenChange={(open) => !open && setDeleteCandidate(null)}
          title={t("inventory.deleteTitle", {
            defaultValue: "Delete Inventory Item",
          })}
          message={t("inventory.deleteMessage", {
            defaultValue: "Are you sure you want to delete this inventory item?",
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

export default InventoryPage;
