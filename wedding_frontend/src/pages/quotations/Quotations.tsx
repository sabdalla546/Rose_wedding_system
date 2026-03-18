import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  FileText,
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
import { useEvents } from "@/hooks/events/useEvents";
import { useLeads } from "@/hooks/leads/useLeads";
import { useDeleteQuotation } from "@/hooks/quotations/useDeleteQuotation";
import { useQuotations } from "@/hooks/quotations/useQuotations";
import { getEventDisplayTitle } from "@/pages/events/adapters";

import {
  QUOTATION_STATUS_OPTIONS,
  toTableQuotations,
  type TableQuotation,
} from "./adapters";
import { useQuotationsColumns } from "./_components/quotationsColumns";
import type { QuotationStatus } from "./types";

const filterFieldClassName =
  "h-10 rounded-xl border px-3 text-[13px] text-[var(--lux-text)] outline-none transition focus:border-[var(--lux-gold-border)]";
const FILTER_EMPTY_VALUE = "__all__";

const fieldStyle = {
  background: "var(--lux-control-surface)",
  borderColor: "var(--lux-control-border)",
} as const;

const QuotationsPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isArabic = i18n.language === "ar";

  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [eventSearch, setEventSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [leadSearch, setLeadSearch] = useState("");
  const [eventFilter, setEventFilter] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [leadFilter, setLeadFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | QuotationStatus>(
    "all",
  );
  const [issueDateFrom, setIssueDateFrom] = useState("");
  const [issueDateTo, setIssueDateTo] = useState("");
  const [deleteCandidate, setDeleteCandidate] = useState<TableQuotation | null>(
    null,
  );

  const viewPermission = "quotations.read";
  const createPermission = "quotations.create";
  const editPermission = "quotations.update";
  const deletePermission = "quotations.delete";

  const { data: raw, isLoading } = useQuotations({
    currentPage,
    itemsPerPage,
    searchQuery,
    eventId: eventFilter,
    customerId: customerFilter,
    leadId: leadFilter,
    status: statusFilter,
    issueDateFrom,
    issueDateTo,
  });
  const { data: eventsResponse } = useEvents({
    currentPage: 1,
    itemsPerPage: 200,
    searchQuery: "",
    status: "all",
    customerId: "",
    leadId: "",
    venueId: "",
    dateFrom: "",
    dateTo: "",
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

  const adapted = toTableQuotations(raw);
  const quotations = adapted.data.quotations;
  const totalItems = adapted.total;
  const totalPages = adapted.totalPages;
  const rowNumberStart = (currentPage - 1) * itemsPerPage + 1;
  const events = useMemo(() => eventsResponse?.data ?? [], [eventsResponse?.data]);
  const customers = useMemo(
    () => customersResponse?.data ?? [],
    [customersResponse?.data],
  );
  const leads = useMemo(() => leadsResponse?.data ?? [], [leadsResponse?.data]);

  const filteredEvents = useMemo(
    () =>
      events.filter((event) =>
        getEventDisplayTitle(event)
          .toLowerCase()
          .includes(eventSearch.trim().toLowerCase()),
      ),
    [eventSearch, events],
  );
  const filteredCustomers = useMemo(
    () =>
      customers.filter((customer) =>
        customer.fullName
          .toLowerCase()
          .includes(customerSearch.trim().toLowerCase()),
      ),
    [customerSearch, customers],
  );
  const filteredLeads = useMemo(
    () =>
      leads.filter((lead) =>
        lead.fullName.toLowerCase().includes(leadSearch.trim().toLowerCase()),
      ),
    [leadSearch, leads],
  );

  const deleteMutation = useDeleteQuotation();
  const columns = useQuotationsColumns({
    onDelete: setDeleteCandidate,
    onCreateContract: (quotation) =>
      navigate(`/contracts/create?mode=from-quotation&quotationId=${quotation.id}`),
    editPermission,
    deletePermission,
  });
  const activeFiltersCount = [
    Boolean(eventFilter),
    Boolean(customerFilter),
    Boolean(leadFilter),
    statusFilter !== "all",
    Boolean(issueDateFrom),
    Boolean(issueDateTo),
  ].filter(Boolean).length;

  const handleSearchSubmit = () => {
    setSearchQuery(searchTerm.trim());
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setEventFilter("");
    setCustomerFilter("");
    setLeadFilter("");
    setStatusFilter("all");
    setIssueDateFrom("");
    setIssueDateTo("");
    setCurrentPage(1);
  };

  const handleDeleteConfirm = () => {
    if (!deleteCandidate) {
      return;
    }

    deleteMutation.mutate({
      id: deleteCandidate.id,
      eventId: deleteCandidate.eventId,
    });
    setDeleteCandidate(null);
  };

  return (
    <ProtectedComponent permission={viewPermission}>
      <div className="min-h-screen space-y-4 bg-background p-4 text-foreground">
        <CompactHeader
          icon={<FileText className="h-5 w-5 text-primary" />}
          title={t("quotations.title", { defaultValue: "Quotations" })}
          totalText={
            <>
              {totalItems}{" "}
              {t("quotations.totalQuotations", {
                defaultValue: "total quotations",
              })}
            </>
          }
          search={{
            placeholder: t("quotations.searchPlaceholder", {
              defaultValue:
                "Search by quotation number, notes, event, customer, or lead...",
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
                onClick={() => navigate("/quotations/create")}
              >
                <Plus className="h-3.5 w-3.5" />
                {t("quotations.create", {
                  defaultValue: "Create Quotation",
                })}
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
                    {t("quotations.filtersHint", {
                      defaultValue: isArabic
                        ? "ضيّق قائمة عروض الأسعار حسب الحفل والعميل والعميل المحتمل والحالة وتاريخ الإصدار."
                        : "Refine the quotations list by event, customer, lead, status, and issue date.",
                    })}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 md:justify-end">
                  <span className="rounded-full border border-[var(--lux-row-border)] bg-[var(--lux-control-hover)] px-2.5 py-1 text-[11px] font-semibold text-[var(--lux-text)]">
                    {t("quotations.activeFiltersCount", {
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
                    {t("quotations.clearFilters", {
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
                      ? t("quotations.hideFilters", {
                          defaultValue: isArabic ? "إخفاء الفلاتر" : "Hide Filters",
                        })
                      : t("quotations.showFilters", {
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
                {eventFilter ? (
                  <FilterPill
                    label={
                      events.find((event) => String(event.id) === eventFilter)
                        ? getEventDisplayTitle(
                            events.find((event) => String(event.id) === eventFilter)!,
                          )
                        : eventFilter
                    }
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
                      leads.find((lead) => String(lead.id) === leadFilter)?.fullName ||
                      leadFilter
                    }
                  />
                ) : null}
                {statusFilter !== "all" ? (
                  <FilterPill
                    label={t(`quotations.status.${statusFilter}`, {
                      defaultValue: statusFilter,
                    })}
                  />
                ) : null}
                {issueDateFrom ? (
                  <FilterPill
                    label={`${t("quotations.issueDateFrom", {
                      defaultValue: "Issue Date From",
                    })}: ${issueDateFrom}`}
                  />
                ) : null}
                {issueDateTo ? (
                  <FilterPill
                    label={`${t("quotations.issueDateTo", {
                      defaultValue: "Issue Date To",
                    })}: ${issueDateTo}`}
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
                      title={t("quotations.primaryFilters", {
                        defaultValue: isArabic ? "الفلاتر الأساسية" : "Primary Filters",
                      })}
                      description={t("quotations.primaryFiltersHint", {
                        defaultValue: isArabic
                          ? "استخدم الفلاتر الأساسية للوصول السريع إلى عروض الأسعار المطلوبة."
                          : "Use the main filters to narrow the quotations list quickly.",
                      })}
                    />
                    <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-2">
                      <FilterField
                        label={t("quotations.event", {
                          defaultValue: "Event",
                        })}
                      >
                        <SearchableFilterSelect
                          value={eventFilter}
                          onValueChange={(value) => {
                            setEventFilter(value);
                            setCurrentPage(1);
                          }}
                          onSearch={setEventSearch}
                          placeholder={t("quotations.allEvents", {
                            defaultValue: "All Events",
                          })}
                          searchPlaceholder={t("quotations.searchEvents", {
                            defaultValue: isArabic ? "ابحث عن حفل..." : "Search events...",
                          })}
                          emptyMessage={t("common.noResultsTitle", {
                            defaultValue: isArabic ? "لا توجد نتائج" : "No results found",
                          })}
                        >
                          {filteredEvents.length === 0 ? (
                            <SearchableSelectEmpty
                              message={t("common.noResultsTitle", {
                                defaultValue: isArabic ? "لا توجد نتائج" : "No results found",
                              })}
                            />
                          ) : (
                            filteredEvents.map((event) => (
                              <SearchableSelectItem key={event.id} value={String(event.id)}>
                                {getEventDisplayTitle(event)}
                              </SearchableSelectItem>
                            ))
                          )}
                        </SearchableFilterSelect>
                      </FilterField>

                      <FilterField
                        label={t("quotations.customer", {
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
                          placeholder={t("quotations.allCustomers", {
                            defaultValue: "All Customers",
                          })}
                          searchPlaceholder={t("quotations.searchCustomers", {
                            defaultValue: isArabic
                              ? "ابحث عن عميل..."
                              : "Search customers...",
                          })}
                          emptyMessage={t("common.noResultsTitle", {
                            defaultValue: isArabic ? "لا توجد نتائج" : "No results found",
                          })}
                        >
                          {filteredCustomers.length === 0 ? (
                            <SearchableSelectEmpty
                              message={t("common.noResultsTitle", {
                                defaultValue: isArabic ? "لا توجد نتائج" : "No results found",
                              })}
                            />
                          ) : (
                            filteredCustomers.map((customer) => (
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
                        label={t("quotations.lead", {
                          defaultValue: "Lead",
                        })}
                      >
                        <SearchableFilterSelect
                          value={leadFilter}
                          onValueChange={(value) => {
                            setLeadFilter(value);
                            setCurrentPage(1);
                          }}
                          onSearch={setLeadSearch}
                          placeholder={t("quotations.allLeads", {
                            defaultValue: "All Leads",
                          })}
                          searchPlaceholder={t("quotations.searchLeads", {
                            defaultValue: isArabic ? "ابحث عن عميل محتمل..." : "Search leads...",
                          })}
                          emptyMessage={t("common.noResultsTitle", {
                            defaultValue: isArabic ? "لا توجد نتائج" : "No results found",
                          })}
                        >
                          {filteredLeads.length === 0 ? (
                            <SearchableSelectEmpty
                              message={t("common.noResultsTitle", {
                                defaultValue: isArabic ? "لا توجد نتائج" : "No results found",
                              })}
                            />
                          ) : (
                            filteredLeads.map((lead) => (
                              <SearchableSelectItem key={lead.id} value={String(lead.id)}>
                                {lead.fullName}
                              </SearchableSelectItem>
                            ))
                          )}
                        </SearchableFilterSelect>
                      </FilterField>

                      <FilterField
                        label={t("quotations.statusLabel", {
                          defaultValue: "Status",
                        })}
                      >
                        <select
                          className={filterFieldClassName}
                          style={fieldStyle}
                          value={statusFilter}
                          onChange={(event) => {
                            setStatusFilter(
                              event.target.value as "all" | QuotationStatus,
                            );
                            setCurrentPage(1);
                          }}
                        >
                          <option value="all">
                            {t("quotations.allStatuses", {
                              defaultValue: "All Statuses",
                            })}
                          </option>
                          {QUOTATION_STATUS_OPTIONS.map((status) => (
                            <option key={status.value} value={status.value}>
                              {t(`quotations.status.${status.value}`, {
                                defaultValue: status.label,
                              })}
                            </option>
                          ))}
                        </select>
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
                      title={t("quotations.dateFilters", {
                        defaultValue: isArabic ? "نطاق التاريخ" : "Date Range",
                      })}
                      description={t("quotations.dateFiltersHint", {
                        defaultValue: isArabic
                          ? "حدّد نطاق تاريخ الإصدار لعرض عروض الأسعار المطابقة."
                          : "Limit the list to quotations within an issue date range.",
                      })}
                    />
                    <div className="grid grid-cols-1 gap-2.5">
                      <FilterField
                        label={t("quotations.issueDateFrom", {
                          defaultValue: "Issue Date From",
                        })}
                      >
                        <Input
                          type="date"
                          className="h-10 rounded-xl text-[13px]"
                          value={issueDateFrom}
                          onChange={(event) => {
                            setIssueDateFrom(event.target.value);
                            setCurrentPage(1);
                          }}
                        />
                      </FilterField>

                      <FilterField
                        label={t("quotations.issueDateTo", {
                          defaultValue: "Issue Date To",
                        })}
                      >
                        <Input
                          type="date"
                          className="h-10 rounded-xl text-[13px]"
                          value={issueDateTo}
                          onChange={(event) => {
                            setIssueDateTo(event.target.value);
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
            title={t("quotations.listTitle", {
              defaultValue: "Quotations List",
            })}
            totalItems={totalItems}
            currentCount={quotations.length}
            entityName={t("quotations.title", { defaultValue: "Quotations" })}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setItemsPerPage}
            setCurrentPage={setCurrentPage}
          />

          <div className="overflow-hidden">
            <DataTable
              columns={columns}
              data={quotations}
              rowNumberStart={rowNumberStart}
              enableRowNumbers
              fileName="quotations"
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
          title={t("quotations.deleteTitle", {
            defaultValue: "Delete Quotation",
          })}
          message={t("quotations.deleteMessage", {
            defaultValue: "Are you sure you want to delete this quotation?",
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

export default QuotationsPage;
