import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarRange,
  ChevronDown,
  ChevronUp,
  Filter,
  Plus,
  RotateCcw,
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
import { useDeleteEvent } from "@/hooks/events/useDeleteEvent";
import { useEvents } from "@/hooks/events/useEvents";
import { useLeads } from "@/hooks/leads/useLeads";
import { useVenues } from "@/hooks/venues/useVenues";

import { EVENT_STATUS_OPTIONS, toTableEvents, type TableEvent } from "./adapters";
import { useEventsColumns } from "./_components/eventsColumns";

const filterFieldClassName =
  "h-10 rounded-xl border px-3 text-[13px] text-[var(--lux-text)] outline-none transition focus:border-[var(--lux-gold-border)]";
const FILTER_EMPTY_VALUE = "__all__";

const fieldStyle = {
  background: "var(--lux-control-surface)",
  borderColor: "var(--lux-control-border)",
} as const;

const EventsPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isArabic = i18n.language === "ar";

  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [leadSearch, setLeadSearch] = useState("");
  const [venueSearch, setVenueSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | TableEvent["status"]>(
    "all",
  );
  const [customerFilter, setCustomerFilter] = useState("");
  const [leadFilter, setLeadFilter] = useState("");
  const [venueFilter, setVenueFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [deleteCandidate, setDeleteCandidate] = useState<TableEvent | null>(null);

  const { data: raw, isLoading } = useEvents({
    currentPage,
    itemsPerPage,
    searchQuery,
    status: statusFilter,
    customerId: customerFilter,
    leadId: leadFilter,
    venueId: venueFilter,
    dateFrom,
    dateTo,
  });
  const { data: customersResponse } = useCustomers({
    currentPage: 1,
    itemsPerPage: 200,
    searchQuery: "",
    status: "all",
    venueId: "",
    weddingDateFrom: "",
    weddingDateTo: "",
  });
  const { data: leadsResponse } = useLeads({
    currentPage: 1,
    itemsPerPage: 200,
    searchQuery: "",
    status: "all",
    venueId: "",
    source: "",
    weddingDateFrom: "",
    weddingDateTo: "",
  });
  const { data: venuesResponse } = useVenues({
    currentPage: 1,
    itemsPerPage: 200,
    searchQuery: "",
    isActive: "all",
  });

  const adapted = toTableEvents(raw);
  const events = adapted.data.events;
  const totalItems = adapted.total;
  const totalPages = adapted.totalPages;
  const rowNumberStart = (currentPage - 1) * itemsPerPage + 1;
  const customers = useMemo(
    () => customersResponse?.data ?? [],
    [customersResponse?.data],
  );
  const leads = useMemo(() => leadsResponse?.data ?? [], [leadsResponse?.data]);
  const venues = useMemo(() => venuesResponse?.data ?? [], [venuesResponse?.data]);

  const filteredCustomerOptions = useMemo(
    () =>
      customers.filter((customer) =>
        customer.fullName
          .toLowerCase()
          .includes(customerSearch.trim().toLowerCase()),
      ),
    [customerSearch, customers],
  );
  const filteredLeadOptions = useMemo(
    () =>
      leads.filter((lead) =>
        lead.fullName.toLowerCase().includes(leadSearch.trim().toLowerCase()),
      ),
    [leadSearch, leads],
  );
  const filteredVenueOptions = useMemo(
    () =>
      venues.filter((venue) =>
        venue.name.toLowerCase().includes(venueSearch.trim().toLowerCase()),
      ),
    [venueSearch, venues],
  );

  const columns = useEventsColumns({
    onDelete: setDeleteCandidate,
    editPermission: "events.update",
    deletePermission: "events.delete",
  });

  const deleteMutation = useDeleteEvent();
  const activeFiltersCount = [
    statusFilter !== "all",
    Boolean(customerFilter),
    Boolean(leadFilter),
    Boolean(venueFilter),
    Boolean(dateFrom),
    Boolean(dateTo),
  ].filter(Boolean).length;

  const handleSearchSubmit = () => {
    setSearchQuery(searchTerm.trim());
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setStatusFilter("all");
    setCustomerFilter("");
    setLeadFilter("");
    setVenueFilter("");
    setDateFrom("");
    setDateTo("");
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
    <ProtectedComponent permission="events.read">
      <div className="min-h-screen space-y-4 bg-background p-4 text-foreground">
        <CompactHeader
          icon={<CalendarRange className="h-5 w-5 text-primary" />}
          title={t("events.title", { defaultValue: "Events" })}
          totalText={
            <>
              {totalItems}{" "}
              {t("events.totalEvents", { defaultValue: "total events" })}
            </>
          }
          search={{
            placeholder: t("events.searchPlaceholder", {
              defaultValue:
                "Search by title, contract, party names, or venue...",
            }),
            value: searchTerm,
            onChange: setSearchTerm,
            onSubmit: handleSearchSubmit,
          }}
          right={
            <ProtectedComponent permission="events.create">
              <Button
                size="sm"
                className="h-auto px-3 py-2 text-xs"
                onClick={() => navigate("/events/create")}
              >
                <Plus className="h-3.5 w-3.5" />
                {t("events.create", { defaultValue: "Create Event" })}
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
                    {t("events.filtersHint", {
                      defaultValue:
                        "Refine the events list by status, linked records, venue, and event date.",
                    })}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 md:justify-end">
                  <span className="rounded-full border border-[var(--lux-row-border)] bg-[var(--lux-control-hover)] px-2.5 py-1 text-[11px] font-semibold text-[var(--lux-text)]">
                    {t("events.activeFiltersCount", {
                      count: activeFiltersCount,
                      defaultValue:
                        activeFiltersCount === 1
                          ? "1 active filter"
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
                    {t("events.clearFilters", {
                      defaultValue: "Clear Filters",
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
                      ? t("events.hideFilters", {
                          defaultValue: "Hide Filters",
                        })
                      : t("events.showFilters", {
                          defaultValue: "Show Filters",
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
                    label={t(`events.status.${statusFilter}`, {
                      defaultValue: statusFilter,
                    })}
                  />
                ) : null}
                {customerFilter ? (
                  <FilterPill
                    label={
                      customers.find(
                        (customer) => String(customer.id) === customerFilter,
                      )?.fullName || customerFilter
                    }
                  />
                ) : null}
                {leadFilter ? (
                  <FilterPill
                    label={
                      leads.find((lead) => String(lead.id) === leadFilter)
                        ?.fullName || leadFilter
                    }
                  />
                ) : null}
                {venueFilter ? (
                  <FilterPill
                    label={
                      venues.find((venue) => String(venue.id) === venueFilter)
                        ?.name || venueFilter
                    }
                  />
                ) : null}
                {dateFrom ? (
                  <FilterPill
                    label={`${t("events.dateFrom", {
                      defaultValue: "Date From",
                    })}: ${dateFrom}`}
                  />
                ) : null}
                {dateTo ? (
                  <FilterPill
                    label={`${t("events.dateTo", {
                      defaultValue: "Date To",
                    })}: ${dateTo}`}
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
                      title={t("events.primaryFilters", {
                        defaultValue: "Primary Filters",
                      })}
                      description={t("events.primaryFiltersHint", {
                        defaultValue:
                          "Use the main filters to narrow the list quickly.",
                      })}
                    />
                    <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-2">
                      <FilterField
                        label={t("events.statusLabel", {
                          defaultValue: "Status",
                        })}
                      >
                        <select
                          className={filterFieldClassName}
                          style={fieldStyle}
                          value={statusFilter}
                          onChange={(event) => {
                            setStatusFilter(
                              event.target.value as "all" | TableEvent["status"],
                            );
                            setCurrentPage(1);
                          }}
                        >
                          <option value="all">
                            {t("events.allStatuses", {
                              defaultValue: "All Statuses",
                            })}
                          </option>
                          {EVENT_STATUS_OPTIONS.map((status) => (
                            <option key={status.value} value={status.value}>
                              {t(`events.status.${status.value}`, {
                                defaultValue: status.label,
                              })}
                            </option>
                          ))}
                        </select>
                      </FilterField>

                      <FilterField
                        label={t("events.customer", {
                          defaultValue: "Customer",
                        })}
                      >
                        <SearchableFilterSelect
                          value={customerFilter}
                          onValueChange={(value) => {
                            setCustomerFilter(value);
                            setCurrentPage(1);
                          }}
                          onSearch={setCustomerSearch}
                          placeholder={t("events.allCustomers", {
                            defaultValue: "All Customers",
                          })}
                          searchPlaceholder={t("events.searchCustomers", {
                            defaultValue: isArabic
                              ? "ابحث عن عميل..."
                              : "Search customers...",
                          })}
                          emptyMessage={t("common.noResultsTitle", {
                            defaultValue: isArabic
                              ? "لا توجد نتائج"
                              : "No results found",
                          })}
                        >
                          {filteredCustomerOptions.length === 0 ? (
                            <SearchableSelectEmpty
                              message={t("common.noResultsTitle", {
                                defaultValue: isArabic
                                  ? "لا توجد نتائج"
                                  : "No results found",
                              })}
                            />
                          ) : (
                            filteredCustomerOptions.map((customer) => (
                              <SearchableSelectItem
                                key={customer.id}
                                value={String(customer.id)}
                              >
                                {customer.fullName}
                              </SearchableSelectItem>
                            ))
                          )}
                        </SearchableFilterSelect>
                      </FilterField>

                      <FilterField
                        label={t("events.lead", { defaultValue: "Lead" })}
                      >
                        <SearchableFilterSelect
                          value={leadFilter}
                          onValueChange={(value) => {
                            setLeadFilter(value);
                            setCurrentPage(1);
                          }}
                          onSearch={setLeadSearch}
                          placeholder={t("events.allLeads", {
                            defaultValue: "All Leads",
                          })}
                          searchPlaceholder={t("events.searchLeads", {
                            defaultValue: isArabic
                              ? "ابحث عن عميل محتمل..."
                              : "Search leads...",
                          })}
                          emptyMessage={t("common.noResultsTitle", {
                            defaultValue: isArabic
                              ? "لا توجد نتائج"
                              : "No results found",
                          })}
                        >
                          {filteredLeadOptions.length === 0 ? (
                            <SearchableSelectEmpty
                              message={t("common.noResultsTitle", {
                                defaultValue: isArabic
                                  ? "لا توجد نتائج"
                                  : "No results found",
                              })}
                            />
                          ) : (
                            filteredLeadOptions.map((lead) => (
                              <SearchableSelectItem
                                key={lead.id}
                                value={String(lead.id)}
                              >
                                {lead.fullName}
                              </SearchableSelectItem>
                            ))
                          )}
                        </SearchableFilterSelect>
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
                          placeholder={t("events.allVenues", {
                            defaultValue: "All Venues",
                          })}
                          searchPlaceholder={t("events.searchVenues", {
                            defaultValue: isArabic
                              ? "ابحث عن قاعة..."
                              : "Search venues...",
                          })}
                          emptyMessage={t("common.noResultsTitle", {
                            defaultValue: isArabic
                              ? "لا توجد نتائج"
                              : "No results found",
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
                      title={t("events.dateFilters", {
                        defaultValue: "Date Range",
                      })}
                      description={t("events.dateFiltersHint", {
                        defaultValue:
                          "Limit the list to events within a specific event date range.",
                      })}
                    />
                    <div className="grid grid-cols-1 gap-2.5">
                      <FilterField
                        label={t("events.dateFrom", {
                          defaultValue: "Date From",
                        })}
                      >
                        <Input
                          type="date"
                          className="h-10 rounded-xl text-[13px]"
                          value={dateFrom}
                          onChange={(event) => {
                            setDateFrom(event.target.value);
                            setCurrentPage(1);
                          }}
                        />
                      </FilterField>

                      <FilterField
                        label={t("events.dateTo", {
                          defaultValue: "Date To",
                        })}
                      >
                        <Input
                          type="date"
                          className="h-10 rounded-xl text-[13px]"
                          value={dateTo}
                          onChange={(event) => {
                            setDateTo(event.target.value);
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
            title={t("events.listTitle", { defaultValue: "Events List" })}
            totalItems={totalItems}
            currentCount={events.length}
            entityName={t("events.title", { defaultValue: "Events" })}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setItemsPerPage}
            setCurrentPage={setCurrentPage}
          />

          <div className="overflow-hidden">
            <DataTable
              columns={columns}
              data={events}
              rowNumberStart={rowNumberStart}
              enableRowNumbers
              fileName="events"
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
          title={t("events.deleteTitle", { defaultValue: "Delete Event" })}
          message={t("events.deleteMessage", {
            defaultValue: "Are you sure you want to delete this event?",
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
      <p className="text-xs leading-5 text-[var(--lux-text-secondary)]">
        {description}
      </p>
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

export default EventsPage;
