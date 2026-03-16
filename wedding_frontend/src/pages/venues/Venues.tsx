import { useState } from "react";
import { Building2, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import CompactHeader from "@/components/common/CompactHeader";
import TableHeader from "@/components/common/TableHeader";
import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import { SectionCard } from "@/components/shared/section-card";
import ConfirmDialog from "@/components/ui/confirmDialog";
import { DataTable } from "@/components/ui/data-table";
import Pagination from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { useDeleteVenue } from "@/hooks/venues/useDeleteVenue";
import { useVenues } from "@/hooks/venues/useVenues";

import { toTableVenues } from "./adapters";
import { useVenuesColumns } from "./_components/venuesColumns";

const VenuesPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isActiveFilter, setIsActiveFilter] = useState<"all" | "true" | "false">(
    "all",
  );
  const [deleteCandidate, setDeleteCandidate] = useState<number | null>(null);

  const viewPermission = "venues.read";
  const createPermission = "venues.create";
  const editPermission = "venues.update";
  const deletePermission = "venues.delete";

  const { data: raw, isLoading } = useVenues({
    currentPage,
    itemsPerPage,
    searchQuery,
    isActive: isActiveFilter,
  });

  const adapted = toTableVenues(raw);
  const venues = adapted.data.venues;
  const totalItems = adapted.total;
  const totalPages = adapted.totalPages;
  const rowNumberStart = (currentPage - 1) * itemsPerPage + 1;

  const columns = useVenuesColumns({
    onDelete: setDeleteCandidate,
    editPermission,
    deletePermission,
  });

  const deleteMutation = useDeleteVenue();

  const handleSearchSubmit = () => {
    setSearchQuery(searchTerm.trim());
    setCurrentPage(1);
  };

  const handleDeleteConfirm = () => {
    if (!deleteCandidate) {
      return;
    }

    deleteMutation.mutate(deleteCandidate, {
      onSettled: () => setDeleteCandidate(null),
    });
  };

  return (
    <ProtectedComponent permission={viewPermission}>
      <div className="min-h-screen space-y-4 bg-background p-4 text-foreground">
        <CompactHeader
          icon={<Building2 className="h-5 w-5 text-primary" />}
          title={t("venues.title", { defaultValue: "Venues" })}
          totalText={
            <>
              {totalItems}{" "}
              {t("venues.totalVenues", { defaultValue: "total venues" })}
            </>
          }
          search={{
            placeholder: t("venues.searchPlaceholder", {
              defaultValue: "Search venues by name, city, area, or contact...",
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
                onClick={() => navigate("/settings/venues/create")}
              >
                <Plus className="h-3.5 w-3.5" />
                {t("venues.create", { defaultValue: "Create Venue" })}
              </Button>
            </ProtectedComponent>
          }
        />

        <SectionCard className="space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <label className="min-w-[200px] space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--lux-text-muted)]">
                {t("venues.statusFilter", { defaultValue: "Status Filter" })}
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
                  {t("venues.allStatuses", { defaultValue: "All Venues" })}
                </option>
                <option value="true">
                  {t("venues.activeOnly", { defaultValue: "Active Only" })}
                </option>
                <option value="false">
                  {t("venues.inactiveOnly", { defaultValue: "Inactive Only" })}
                </option>
              </select>
            </label>
          </div>
        </SectionCard>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <TableHeader
            title={t("venues.listTitle", { defaultValue: "Venues List" })}
            totalItems={totalItems}
            currentCount={venues.length}
            entityName={t("venues.title", { defaultValue: "Venues" })}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setItemsPerPage}
            setCurrentPage={setCurrentPage}
          />

          <div className="overflow-hidden">
            <DataTable
              columns={columns}
              data={venues}
              rowNumberStart={rowNumberStart}
              enableRowNumbers
              fileName="venues"
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
          title={t("venues.deleteTitle", { defaultValue: "Delete Venue" })}
          message={t("venues.deleteMessage", {
            defaultValue: "Are you sure you want to delete this venue?",
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

export default VenuesPage;
