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
import { useContracts } from "@/hooks/contracts/useContracts";
import { useDeleteContract } from "@/hooks/contracts/useDeleteContract";
import { useCustomers } from "@/hooks/customers/useCustomers";
import { useEvents } from "@/hooks/events/useEvents";
import { useLeads } from "@/hooks/leads/useLeads";
import { useQuotations } from "@/hooks/quotations/useQuotations";
import { getEventDisplayTitle } from "@/pages/events/adapters";
import { getQuotationDisplayNumber } from "@/pages/quotations/adapters";

import {
  CONTRACT_STATUS_OPTIONS,
  toTableContracts,
  type TableContract,
} from "./adapters";
import { useContractsColumns } from "./_components/contractsColumns";
import type { ContractStatus } from "./types";

const filterFieldClassName =
  "h-10 rounded-xl border px-3 text-[13px] text-[var(--lux-text)] outline-none transition focus:border-[var(--lux-gold-border)]";
const FILTER_EMPTY_VALUE = "__all__";

const fieldStyle = {
  background: "var(--lux-control-surface)",
  borderColor: "var(--lux-control-border)",
} as const;

const ContractsPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isArabic = i18n.language === "ar";

  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [quotationSearch, setQuotationSearch] = useState("");
  const [eventSearch, setEventSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [leadSearch, setLeadSearch] = useState("");
  const [quotationFilter, setQuotationFilter] = useState("");
  const [eventFilter, setEventFilter] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [leadFilter, setLeadFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ContractStatus>(
    "all",
  );
  const [signedDateFrom, setSignedDateFrom] = useState("");
  const [signedDateTo, setSignedDateTo] = useState("");
  const [deleteCandidate, setDeleteCandidate] = useState<TableContract | null>(
    null,
  );

  const viewPermission = "contracts.read";
  const createPermission = "contracts.create";
  const editPermission = "contracts.update";
  const deletePermission = "contracts.delete";

  const { data: raw, isLoading } = useContracts({
    currentPage,
    itemsPerPage,
    searchQuery,
    quotationId: quotationFilter,
    eventId: eventFilter,
    customerId: customerFilter,
    leadId: leadFilter,
    status: statusFilter,
    signedDateFrom,
    signedDateTo,
  });
  const { data: quotationsResponse } = useQuotations({
    currentPage: 1,
    itemsPerPage: 200,
    searchQuery: "",
    eventId: "",
    customerId: "",
    leadId: "",
    status: "all",
    issueDateFrom: "",
    issueDateTo: "",
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

  const adapted = toTableContracts(raw);
  const contracts = adapted.data.contracts;
  const totalItems = adapted.total;
  const totalPages = adapted.totalPages;
  const rowNumberStart = (currentPage - 1) * itemsPerPage + 1;
  const quotations = useMemo(
    () => quotationsResponse?.data ?? [],
    [quotationsResponse?.data],
  );
  const events = useMemo(() => eventsResponse?.data ?? [], [eventsResponse?.data]);
  const customers = useMemo(
    () => customersResponse?.data ?? [],
    [customersResponse?.data],
  );
  const leads = useMemo(() => leadsResponse?.data ?? [], [leadsResponse?.data]);

  const filteredQuotations = useMemo(
    () =>
      quotations.filter((quotation) => {
        const label = `${getQuotationDisplayNumber(quotation)} ${
          quotation.event ? getEventDisplayTitle(quotation.event) : ""
        }`;
        return label.toLowerCase().includes(quotationSearch.trim().toLowerCase());
      }),
    [quotationSearch, quotations],
  );
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

  const deleteMutation = useDeleteContract();
  const columns = useContractsColumns({
    onDelete: setDeleteCandidate,
    editPermission,
    deletePermission,
  });
  const activeFiltersCount = [
    Boolean(quotationFilter),
    Boolean(eventFilter),
    Boolean(customerFilter),
    Boolean(leadFilter),
    statusFilter !== "all",
    Boolean(signedDateFrom),
    Boolean(signedDateTo),
  ].filter(Boolean).length;

  const handleSearchSubmit = () => {
    setSearchQuery(searchTerm.trim());
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setQuotationFilter("");
    setEventFilter("");
    setCustomerFilter("");
    setLeadFilter("");
    setStatusFilter("all");
    setSignedDateFrom("");
    setSignedDateTo("");
    setCurrentPage(1);
  };

  const handleDeleteConfirm = () => {
    if (!deleteCandidate) {
      return;
    }

    deleteMutation.mutate({
      id: deleteCandidate.id,
      eventId: deleteCandidate.eventId,
      quotationId: deleteCandidate.quotationId,
    });
    setDeleteCandidate(null);
  };

  return (
    <ProtectedComponent permission={viewPermission}>
      <div className="min-h-screen space-y-4 bg-background p-4 text-foreground">
        <CompactHeader
          icon={<FileText className="h-5 w-5 text-primary" />}
          title={t("contracts.title", { defaultValue: "Contracts" })}
          totalText={
            <>
              {totalItems}{" "}
              {t("contracts.totalContracts", {
                defaultValue: "total contracts",
              })}
            </>
          }
          search={{
            placeholder: t("contracts.searchPlaceholder", {
              defaultValue:
                "Search by contract number, notes, quotation, event, customer, or lead...",
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
                onClick={() => navigate("/contracts/create")}
              >
                <Plus className="h-3.5 w-3.5" />
                {t("contracts.create", {
                  defaultValue: "Create Contract",
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
                    {t("contracts.filtersHint", {
                      defaultValue: isArabic
                        ? "صفِّ قائمة العقود حسب عرض السعر والحفل والعميل والعميل المحتمل والحالة وتاريخ التوقيع."
                        : "Refine the contracts list by quotation, event, customer, lead, status, and signed date.",
                    })}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 md:justify-end">
                  <span className="rounded-full border border-[var(--lux-row-border)] bg-[var(--lux-control-hover)] px-2.5 py-1 text-[11px] font-semibold text-[var(--lux-text)]">
                    {t("contracts.activeFiltersCount", {
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
                    {t("contracts.clearFilters", {
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
                      ? t("contracts.hideFilters", {
                          defaultValue: isArabic ? "إخفاء الفلاتر" : "Hide Filters",
                        })
                      : t("contracts.showFilters", {
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
                {quotationFilter ? (
                  <FilterPill
                    label={
                      quotations.find(
                        (quotation) => String(quotation.id) === quotationFilter,
                      )
                        ? getQuotationDisplayNumber(
                            quotations.find(
                              (quotation) =>
                                String(quotation.id) === quotationFilter,
                            )!,
                          )
                        : quotationFilter
                    }
                  />
                ) : null}
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
                      leads.find((lead) => String(lead.id) === leadFilter)
                        ?.fullName || leadFilter
                    }
                  />
                ) : null}
                {statusFilter !== "all" ? (
                  <FilterPill
                    label={t(`contracts.status.${statusFilter}`, {
                      defaultValue: statusFilter,
                    })}
                  />
                ) : null}
                {signedDateFrom ? (
                  <FilterPill
                    label={`${t("contracts.signedDateFrom", {
                      defaultValue: "Signed Date From",
                    })}: ${signedDateFrom}`}
                  />
                ) : null}
                {signedDateTo ? (
                  <FilterPill
                    label={`${t("contracts.signedDateTo", {
                      defaultValue: "Signed Date To",
                    })}: ${signedDateTo}`}
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
                      title={t("contracts.primaryFilters", {
                        defaultValue: isArabic ? "الفلاتر الأساسية" : "Primary Filters",
                      })}
                      description={t("contracts.primaryFiltersHint", {
                        defaultValue: isArabic
                          ? "استخدم الفلاتر الأساسية للوصول السريع إلى العقود المطلوبة."
                          : "Use the main filters to narrow the contracts list quickly.",
                      })}
                    />
                    <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-2">
                      <FilterField
                        label={t("contracts.quotation", {
                          defaultValue: "Quotation",
                        })}
                      >
                        <SearchableFilterSelect
                          value={quotationFilter}
                          onValueChange={(value) => {
                            setQuotationFilter(value);
                            setCurrentPage(1);
                          }}
                          onSearch={setQuotationSearch}
                          placeholder={t("contracts.allQuotations", {
                            defaultValue: "All Quotations",
                          })}
                          searchPlaceholder={t("contracts.searchQuotations", {
                            defaultValue: isArabic
                              ? "ابحث عن عرض سعر..."
                              : "Search quotations...",
                          })}
                          emptyMessage={t("common.noResultsTitle", {
                            defaultValue: isArabic ? "لا توجد نتائج" : "No results found",
                          })}
                        >
                          {filteredQuotations.length === 0 ? (
                            <SearchableSelectEmpty
                              message={t("common.noResultsTitle", {
                                defaultValue: isArabic ? "لا توجد نتائج" : "No results found",
                              })}
                            />
                          ) : (
                            filteredQuotations.map((quotation) => (
                              <SearchableSelectItem
                                key={quotation.id}
                                value={String(quotation.id)}
                              >
                                {getQuotationDisplayNumber(quotation)}
                              </SearchableSelectItem>
                            ))
                          )}
                        </SearchableFilterSelect>
                      </FilterField>

                      <FilterField
                        label={t("contracts.event", {
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
                          placeholder={t("contracts.allEvents", {
                            defaultValue: "All Events",
                          })}
                          searchPlaceholder={t("contracts.searchEvents", {
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
                              <SearchableSelectItem
                                key={event.id}
                                value={String(event.id)}
                              >
                                {getEventDisplayTitle(event)}
                              </SearchableSelectItem>
                            ))
                          )}
                        </SearchableFilterSelect>
                      </FilterField>

                      <FilterField
                        label={t("contracts.customer", {
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
                          placeholder={t("contracts.allCustomers", {
                            defaultValue: "All Customers",
                          })}
                          searchPlaceholder={t("contracts.searchCustomers", {
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
                        label={t("contracts.lead", {
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
                          placeholder={t("contracts.allLeads", {
                            defaultValue: "All Leads",
                          })}
                          searchPlaceholder={t("contracts.searchLeads", {
                            defaultValue: isArabic
                              ? "ابحث عن عميل محتمل..."
                              : "Search leads...",
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
                        label={t("contracts.statusLabel", {
                          defaultValue: "Status",
                        })}
                      >
                        <select
                          className={filterFieldClassName}
                          style={fieldStyle}
                          value={statusFilter}
                          onChange={(event) => {
                            setStatusFilter(
                              event.target.value as "all" | ContractStatus,
                            );
                            setCurrentPage(1);
                          }}
                        >
                          <option value="all">
                            {t("contracts.allStatuses", {
                              defaultValue: "All Statuses",
                            })}
                          </option>
                          {CONTRACT_STATUS_OPTIONS.map((status) => (
                            <option key={status.value} value={status.value}>
                              {t(`contracts.status.${status.value}`, {
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
                      title={t("contracts.dateFilters", {
                        defaultValue: isArabic ? "نطاق التاريخ" : "Date Range",
                      })}
                      description={t("contracts.dateFiltersHint", {
                        defaultValue: isArabic
                          ? "حدّد نطاق تاريخ التوقيع لعرض العقود المطابقة."
                          : "Limit the list to contracts within a signed date range.",
                      })}
                    />
                    <div className="grid grid-cols-1 gap-2.5">
                      <FilterField
                        label={t("contracts.signedDateFrom", {
                          defaultValue: "Signed Date From",
                        })}
                      >
                        <Input
                          type="date"
                          className="h-10 rounded-xl text-[13px]"
                          value={signedDateFrom}
                          onChange={(event) => {
                            setSignedDateFrom(event.target.value);
                            setCurrentPage(1);
                          }}
                        />
                      </FilterField>

                      <FilterField
                        label={t("contracts.signedDateTo", {
                          defaultValue: "Signed Date To",
                        })}
                      >
                        <Input
                          type="date"
                          className="h-10 rounded-xl text-[13px]"
                          value={signedDateTo}
                          onChange={(event) => {
                            setSignedDateTo(event.target.value);
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
            title={t("contracts.listTitle", {
              defaultValue: "Contracts List",
            })}
            totalItems={totalItems}
            currentCount={contracts.length}
            entityName={t("contracts.title", { defaultValue: "Contracts" })}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setItemsPerPage}
            setCurrentPage={setCurrentPage}
          />

          <div className="overflow-hidden">
            <DataTable
              columns={columns}
              data={contracts}
              rowNumberStart={rowNumberStart}
              enableRowNumbers
              fileName="contracts"
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
          title={t("contracts.deleteTitle", {
            defaultValue: "Delete Contract",
          })}
          message={t("contracts.deleteMessage", {
            defaultValue: "Are you sure you want to delete this contract?",
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

export default ContractsPage;
