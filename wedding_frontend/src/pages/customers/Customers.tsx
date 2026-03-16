import { useMemo, useState } from "react";
import { Plus, UsersRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import CompactHeader from "@/components/common/CompactHeader";
import TableHeader from "@/components/common/TableHeader";
import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/ui/confirmDialog";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import Pagination from "@/components/ui/pagination";
import { useCustomers } from "@/hooks/customers/useCustomers";
import { useDeleteCustomer } from "@/hooks/customers/useDeleteCustomer";
import { useVenues } from "@/hooks/venues/useVenues";

import {
  CUSTOMER_STATUS_OPTIONS,
  toTableCustomers,
  type TableCustomer,
} from "./adapters";
import { useCustomersColumns } from "./_components/customersColumns";

const fieldClassName =
  "h-11 rounded-2xl border px-4 text-sm text-[var(--lux-text)] outline-none transition focus:border-[var(--lux-gold-border)]";

const fieldStyle = {
  background: "var(--lux-control-surface)",
  borderColor: "var(--lux-control-border)",
} as const;

const CustomersPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState<
    "all" | TableCustomer["status"]
  >("all");
  const [venueFilter, setVenueFilter] = useState("");
  const [weddingDateFrom, setWeddingDateFrom] = useState("");
  const [weddingDateTo, setWeddingDateTo] = useState("");
  const [deleteCandidate, setDeleteCandidate] = useState<TableCustomer | null>(
    null,
  );

  const viewPermission = "customers.read";
  const createPermission = "customers.create";
  const editPermission = "customers.update";
  const deletePermission = "customers.delete";

  const { data: raw, isLoading } = useCustomers({
    currentPage,
    itemsPerPage,
    searchQuery,
    status: statusFilter,
    venueId: venueFilter,
    weddingDateFrom,
    weddingDateTo,
  });

  const { data: venuesResponse } = useVenues({
    currentPage: 1,
    itemsPerPage: 200,
    searchQuery: "",
    isActive: "all",
  });

  const adapted = toTableCustomers(raw);
  const customers = adapted.data.customers;
  const totalItems = adapted.total;
  const totalPages = adapted.totalPages;
  const rowNumberStart = (currentPage - 1) * itemsPerPage + 1;
  const venues = useMemo(() => venuesResponse?.data ?? [], [venuesResponse?.data]);

  const columns = useCustomersColumns({
    onDelete: setDeleteCandidate,
    editPermission,
    deletePermission,
  });

  const deleteMutation = useDeleteCustomer();

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
          icon={<UsersRound className="h-5 w-5 text-primary" />}
          title={t("customers.title", { defaultValue: "Customers" })}
          totalText={
            <>
              {totalItems}{" "}
              {t("customers.totalCustomers", {
                defaultValue: "total customers",
              })}
            </>
          }
          search={{
            placeholder: t("customers.searchPlaceholder", {
              defaultValue: "Search by name, mobile, email, or venue...",
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
                onClick={() => navigate("/customers/create")}
              >
                <Plus className="h-3.5 w-3.5" />
                {t("customers.create", { defaultValue: "Create Customer" })}
              </Button>
            </ProtectedComponent>
          }
        />

        <SectionCard className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--lux-text-muted)]">
                {t("customers.statusLabel", { defaultValue: "Status" })}
              </span>
              <select
                className={fieldClassName}
                style={fieldStyle}
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(
                    event.target.value as "all" | TableCustomer["status"],
                  );
                  setCurrentPage(1);
                }}
              >
                <option value="all">
                  {t("customers.allStatuses", { defaultValue: "All Statuses" })}
                </option>
                {CUSTOMER_STATUS_OPTIONS.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--lux-text-muted)]">
                {t("common.venue", { defaultValue: "Venue" })}
              </span>
              <select
                className={fieldClassName}
                style={fieldStyle}
                value={venueFilter}
                onChange={(event) => {
                  setVenueFilter(event.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">
                  {t("customers.allVenues", { defaultValue: "All Venues" })}
                </option>
                {venues.map((venue) => (
                  <option key={venue.id} value={String(venue.id)}>
                    {venue.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--lux-text-muted)]">
                {t("customers.weddingDateFrom", {
                  defaultValue: "Wedding Date From",
                })}
              </span>
              <Input
                type="date"
                value={weddingDateFrom}
                onChange={(event) => {
                  setWeddingDateFrom(event.target.value);
                  setCurrentPage(1);
                }}
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--lux-text-muted)]">
                {t("customers.weddingDateTo", {
                  defaultValue: "Wedding Date To",
                })}
              </span>
              <Input
                type="date"
                value={weddingDateTo}
                onChange={(event) => {
                  setWeddingDateTo(event.target.value);
                  setCurrentPage(1);
                }}
              />
            </label>
          </div>
        </SectionCard>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <TableHeader
            title={t("customers.listTitle", { defaultValue: "Customers List" })}
            totalItems={totalItems}
            currentCount={customers.length}
            entityName={t("customers.title", { defaultValue: "Customers" })}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setItemsPerPage}
            setCurrentPage={setCurrentPage}
          />

          <div className="overflow-hidden">
            <DataTable
              columns={columns}
              data={customers}
              rowNumberStart={rowNumberStart}
              enableRowNumbers
              fileName="customers"
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
          title={t("customers.deleteTitle", { defaultValue: "Delete Customer" })}
          message={t("customers.deleteMessage", {
            defaultValue: "Are you sure you want to delete this customer?",
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

export default CustomersPage;
