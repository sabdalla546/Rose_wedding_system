import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Filter,
  Plus,
  RotateCcw,
  UsersRound,
} from "lucide-react";
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
import {
  SearchableSelect,
  SearchableSelectEmpty,
  SearchableSelectItem,
} from "@/components/ui/searchable-select";
import { useCustomers } from "@/hooks/customers/useCustomers";
import { useDeleteCustomer } from "@/hooks/customers/useDeleteCustomer";
import { useVenues } from "@/hooks/venues/useVenues";

import {
  CUSTOMER_STATUS_OPTIONS,
  toTableCustomers,
  type TableCustomer,
} from "./adapters";
import { useCustomersColumns } from "./_components/customersColumns";

const filterFieldClassName =
  "h-10 rounded-xl border px-3 text-[13px] text-[var(--lux-text)] outline-none transition focus:border-[var(--lux-gold-border)]";
const FILTER_EMPTY_VALUE = "__all__";

const fieldStyle = {
  background: "var(--lux-control-surface)",
  borderColor: "var(--lux-control-border)",
} as const;

const CustomersPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isArabic = i18n.language === "ar";

  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [venueSearch, setVenueSearch] = useState("");
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
  const filteredVenueOptions = useMemo(
    () =>
      venues.filter((venue) =>
        venue.name.toLowerCase().includes(venueSearch.trim().toLowerCase()),
      ),
    [venueSearch, venues],
  );

  const columns = useCustomersColumns({
    onDelete: setDeleteCandidate,
    editPermission,
    deletePermission,
  });

  const deleteMutation = useDeleteCustomer();
  const activeFiltersCount = [
    statusFilter !== "all",
    Boolean(venueFilter),
    Boolean(weddingDateFrom),
    Boolean(weddingDateTo),
  ].filter(Boolean).length;

  const handleSearchSubmit = () => {
    setSearchQuery(searchTerm.trim());
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setStatusFilter("all");
    setVenueFilter("");
    setWeddingDateFrom("");
    setWeddingDateTo("");
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

        <SectionCard className="overflow-hidden">
          <div className="space-y-3">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-[var(--lux-gold)]">
                    <Filter className="h-3.5 w-3.5" />
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">
                      {t("common.filters", { defaultValue: "Filters" })}
                    </p>
                  </div>
                  <p className="max-w-2xl text-xs leading-5 text-[var(--lux-text-secondary)]">
                    {t("customers.filtersHint", {
                      defaultValue: isArabic
                        ? "قم بتضييق قائمة العملاء حسب الحالة والقاعة وتاريخ الزفاف."
                        : "Refine the customers list by status, venue, and wedding date.",
                    })}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 md:justify-end">
                  <span className="rounded-full border border-[var(--lux-row-border)] bg-[var(--lux-control-hover)] px-2.5 py-1 text-[11px] font-semibold text-[var(--lux-text)]">
                    {t("customers.activeFiltersCount", {
                      count: activeFiltersCount,
                      defaultValue:
                        activeFiltersCount === 1
                          ? isArabic
                            ? "فلتر نشط واحد"
                            : "1 active filter"
                          : isArabic
                            ? `${activeFiltersCount} فلاتر نشطة`
                            : `${activeFiltersCount} active filters`,
                    })}
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-9 rounded-xl px-2.5 text-[12px]"
                    disabled={activeFiltersCount === 0}
                    onClick={resetFilters}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    {t("customers.clearFilters", {
                      defaultValue: isArabic ? "مسح الفلاتر" : "Clear Filters",
                    })}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 rounded-xl px-2.5 text-[12px]"
                    onClick={() => setFiltersOpen((current) => !current)}
                  >
                    {filtersOpen ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                    {filtersOpen
                      ? t("customers.hideFilters", {
                          defaultValue: isArabic ? "إخفاء الفلاتر" : "Hide Filters",
                        })
                      : t("customers.showFilters", {
                          defaultValue: isArabic ? "عرض الفلاتر" : "Show Filters",
                        })}
                  </Button>
                </div>
              </div>
            </div>

            {activeFiltersCount > 0 ? (
              <div
                className="flex min-h-[28px] flex-wrap items-center gap-1.5 border-t pt-3"
                style={{ borderColor: "var(--lux-row-border)" }}
              >
                {statusFilter !== "all" ? (
                  <FilterPill
                    label={t(`customers.status.${statusFilter}`, {
                      defaultValue: statusFilter,
                    })}
                  />
                ) : null}
                {venueFilter ? (
                  <FilterPill
                    label={
                      venues.find((venue) => String(venue.id) === venueFilter)?.name ||
                      venueFilter
                    }
                  />
                ) : null}
                {weddingDateFrom ? (
                  <FilterPill
                    label={`${t("customers.weddingDateFrom", {
                      defaultValue: isArabic ? "تاريخ الزفاف من" : "Wedding Date From",
                    })}: ${weddingDateFrom}`}
                  />
                ) : null}
                {weddingDateTo ? (
                  <FilterPill
                    label={`${t("customers.weddingDateTo", {
                      defaultValue: isArabic ? "تاريخ الزفاف إلى" : "Wedding Date To",
                    })}: ${weddingDateTo}`}
                  />
                ) : null}
              </div>
            ) : null}
          </div>

          <AnimatePresence initial={false}>
            {filtersOpen ? (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div
                  className="mt-4 grid gap-3 border-t pt-4 xl:grid-cols-12"
                  style={{ borderColor: "var(--lux-row-border)" }}
                >
                  <div
                    className="space-y-3 rounded-2xl border p-3 xl:col-span-8"
                    style={{
                      borderColor: "var(--lux-row-border)",
                      background: "var(--lux-control-hover)",
                    }}
                  >
                    <FilterGroupTitle
                      title={t("customers.primaryFilters", {
                        defaultValue: isArabic ? "الفلاتر الأساسية" : "Primary Filters",
                      })}
                      description={t("customers.primaryFiltersHint", {
                        defaultValue: isArabic
                          ? "استخدم الفلاتر الأساسية لتضييق القائمة بسرعة."
                          : "Use the main filters to narrow the list quickly.",
                      })}
                    />
                    <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-2">
                      <FilterField
                        label={t("customers.statusLabel", { defaultValue: "Status" })}
                      >
                        <select
                          className={filterFieldClassName}
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
                            {t("customers.allStatuses", {
                              defaultValue: "All Statuses",
                            })}
                          </option>
                          {CUSTOMER_STATUS_OPTIONS.map((status) => (
                            <option key={status.value} value={status.value}>
                              {t(`customers.status.${status.value}`, {
                                defaultValue: status.label,
                              })}
                            </option>
                          ))}
                        </select>
                      </FilterField>

                      <FilterField
                        label={t("common.venue", { defaultValue: "Venue" })}
                      >
                        <SearchableFilterSelect
                          value={venueFilter}
                          onValueChange={(value) => {
                            setVenueFilter(value);
                            setCurrentPage(1);
                          }}
                          onSearch={setVenueSearch}
                          placeholder={t("customers.allVenues", {
                            defaultValue: "All Venues",
                          })}
                          searchPlaceholder={t("customers.searchVenue", {
                            defaultValue: isArabic
                              ? "ابحث عن قاعة..."
                              : "Search venues...",
                          })}
                          emptyMessage={t("common.noResultsTitle", {
                            defaultValue: isArabic ? "لا توجد نتائج" : "No results found",
                          })}
                        >
                          {filteredVenueOptions.length === 0 ? (
                            <SearchableSelectEmpty
                              message={t("common.noResultsTitle", {
                                defaultValue: isArabic
                                  ? "لا توجد نتائج"
                                  : "No results found",
                              })}
                            />
                          ) : (
                            filteredVenueOptions.map((venue) => (
                              <SearchableSelectItem
                                key={venue.id}
                                value={String(venue.id)}
                              >
                                {venue.name}
                              </SearchableSelectItem>
                            ))
                          )}
                        </SearchableFilterSelect>
                      </FilterField>
                    </div>
                  </div>

                  <div
                    className="space-y-3 rounded-2xl border p-3 xl:col-span-4"
                    style={{
                      borderColor: "var(--lux-row-border)",
                      background: "var(--lux-control-hover)",
                    }}
                  >
                    <FilterGroupTitle
                      title={t("customers.dateFilters", {
                        defaultValue: isArabic ? "نطاق التاريخ" : "Date Range",
                      })}
                      description={t("customers.dateFiltersHint", {
                        defaultValue: isArabic
                          ? "حدّد نطاق تاريخ الزفاف لعرض العملاء المطابقين."
                          : "Limit the list to customers within a wedding date range.",
                      })}
                    />
                    <div className="grid grid-cols-1 gap-2.5">
                      <FilterField
                        label={t("customers.weddingDateFrom", {
                          defaultValue: "Wedding Date From",
                        })}
                      >
                        <Input
                          type="date"
                          className="h-10 rounded-xl text-[13px]"
                          value={weddingDateFrom}
                          onChange={(event) => {
                            setWeddingDateFrom(event.target.value);
                            setCurrentPage(1);
                          }}
                        />
                      </FilterField>

                      <FilterField
                        label={t("customers.weddingDateTo", {
                          defaultValue: "Wedding Date To",
                        })}
                      >
                        <Input
                          type="date"
                          className="h-10 rounded-xl text-[13px]"
                          value={weddingDateTo}
                          onChange={(event) => {
                            setWeddingDateTo(event.target.value);
                            setCurrentPage(1);
                          }}
                        />
                      </FilterField>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
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

function FilterGroupTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--lux-gold)]">
        {title}
      </p>
      <p className="text-xs leading-5 text-[var(--lux-text-secondary)]">{description}</p>
    </div>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-2">
      <span className="text-[11px] font-medium text-[var(--lux-text-muted)]">
        {label}
      </span>
      {children}
    </label>
  );
}

function FilterPill({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-[var(--lux-row-border)] bg-[var(--lux-panel)] px-2.5 py-1 text-[11px] text-[var(--lux-text-secondary)]">
      {label}
    </span>
  );
}

function SearchableFilterSelect({
  value,
  onValueChange,
  onSearch,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  children,
}: {
  value: string;
  onValueChange: (value: string) => void;
  onSearch: (value: string) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyMessage: string;
  children: React.ReactNode;
}) {
  return (
    <SearchableSelect
      value={value || FILTER_EMPTY_VALUE}
      onValueChange={(nextValue) =>
        onValueChange(nextValue === FILTER_EMPTY_VALUE ? "" : nextValue)
      }
      onSearch={onSearch}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      emptyMessage={emptyMessage}
      allowClear={Boolean(value)}
      onClear={() => onValueChange("")}
      triggerClassName={filterFieldClassName}
      size="default"
    >
      <SearchableSelectItem value={FILTER_EMPTY_VALUE}>
        {placeholder}
      </SearchableSelectItem>
      {children}
    </SearchableSelect>
  );
}

export default CustomersPage;
