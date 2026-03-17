import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Filter,
  Plus,
  RotateCcw,
  UserRoundSearch,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import Pagination from "@/components/ui/pagination";
import {
  SearchableSelect,
  SearchableSelectEmpty,
  SearchableSelectItem,
} from "@/components/ui/searchable-select";
import { useConvertLeadToCustomer } from "@/hooks/leads/useConvertLeadToCustomer";
import { useDeleteLead } from "@/hooks/leads/useDeleteLead";
import { useLeads } from "@/hooks/leads/useLeads";
import { useMarkLeadLost } from "@/hooks/leads/useMarkLeadLost";
import { useVenues } from "@/hooks/venues/useVenues";

import { LEAD_STATUS_OPTIONS, toTableLeads, type TableLead } from "./adapters";
import { useLeadsColumns } from "./_components/leadsColumns";

const textareaClassName =
  "min-h-[110px] w-full rounded-[22px] border px-4 py-3 text-sm text-[var(--lux-text)] placeholder:text-[var(--lux-text-muted)] outline-none transition-all focus:border-[var(--lux-gold-border)] focus:ring-2 focus:ring-[var(--lux-gold-glow)]";

const filterFieldClassName =
  "h-10 rounded-xl border px-3 text-[13px] text-[var(--lux-text)] outline-none transition focus:border-[var(--lux-gold-border)]";
const FILTER_EMPTY_VALUE = "__all__";

const fieldStyle = {
  background: "var(--lux-control-surface)",
  borderColor: "var(--lux-control-border)",
} as const;

const LeadsPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isArabic = i18n.language === "ar";

  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [venueSearch, setVenueSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | TableLead["status"]>(
    "all",
  );
  const [venueFilter, setVenueFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [weddingDateFrom, setWeddingDateFrom] = useState("");
  const [weddingDateTo, setWeddingDateTo] = useState("");
  const [deleteCandidate, setDeleteCandidate] = useState<TableLead | null>(null);
  const [lostCandidate, setLostCandidate] = useState<TableLead | null>(null);
  const [lostReason, setLostReason] = useState("");
  const [lostNotes, setLostNotes] = useState("");
  const [convertCandidate, setConvertCandidate] = useState<TableLead | null>(null);
  const [convertNotes, setConvertNotes] = useState("");

  const viewPermission = "leads.read";
  const createPermission = "leads.create";
  const editPermission = "leads.update";
  const updatePermission = "leads.update";
  const deletePermission = "leads.delete";
  const convertPermission = "leads.convert";

  const { data: raw, isLoading } = useLeads({
    currentPage,
    itemsPerPage,
    searchQuery,
    status: statusFilter,
    venueId: venueFilter,
    source: sourceFilter,
    weddingDateFrom,
    weddingDateTo,
  });

  const { data: venuesResponse } = useVenues({
    currentPage: 1,
    itemsPerPage: 200,
    searchQuery: "",
    isActive: "all",
  });

  const adapted = toTableLeads(raw);
  const leads = adapted.data.leads;
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

  const columns = useLeadsColumns({
    onDelete: setDeleteCandidate,
    onMarkLost: (lead) => {
      setLostCandidate(lead);
      setLostReason("");
      setLostNotes("");
    },
    onConvert: (lead) => {
      setConvertCandidate(lead);
      setConvertNotes("");
    },
    editPermission,
    deletePermission,
    updatePermission,
    convertPermission,
  });

  const deleteMutation = useDeleteLead();
  const markLostMutation = useMarkLeadLost();
  const convertMutation = useConvertLeadToCustomer();
  const activeFiltersCount = [
    statusFilter !== "all",
    Boolean(venueFilter),
    Boolean(sourceFilter.trim()),
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
    setSourceFilter("");
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

  const handleLostConfirm = () => {
    if (!lostCandidate) {
      return;
    }

    markLostMutation.mutate(
      {
        id: lostCandidate.id,
        values: {
          reason: lostReason,
          notes: lostNotes,
        },
      },
      {
        onSuccess: () => {
          setLostCandidate(null);
          setLostReason("");
          setLostNotes("");
        },
      },
    );
  };

  const handleConvertConfirm = () => {
    if (!convertCandidate) {
      return;
    }

    convertMutation.mutate(
      {
        id: convertCandidate.id,
        values: { notes: convertNotes },
      },
      {
        onSuccess: () => {
          setConvertCandidate(null);
          setConvertNotes("");
        },
      },
    );
  };

  return (
    <ProtectedComponent permission={viewPermission}>
      <div className="min-h-screen space-y-4 bg-background p-4 text-foreground">
        <CompactHeader
          icon={<UserRoundSearch className="h-5 w-5 text-primary" />}
          title={t("leads.title", { defaultValue: "Leads" })}
          totalText={
            <>
              {totalItems}{" "}
              {t("leads.totalLeads", { defaultValue: "total leads" })}
            </>
          }
          search={{
            placeholder: t("leads.searchPlaceholder", {
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
                onClick={() => navigate("/leads/create")}
              >
                <Plus className="h-3.5 w-3.5" />
                {t("leads.create", { defaultValue: "Create Lead" })}
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
                    {t("leads.filtersHint", {
                      defaultValue: isArabic
                        ? "قم بتضييق قائمة العملاء المحتملين حسب الحالة والقاعة والمصدر وتاريخ الزفاف."
                        : "Refine the leads list by status, venue, source, and wedding date.",
                    })}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 md:justify-end">
                  <span className="rounded-full border border-[var(--lux-row-border)] bg-[var(--lux-control-hover)] px-2.5 py-1 text-[11px] font-semibold text-[var(--lux-text)]">
                    {t("leads.activeFiltersCount", {
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
                    {t("leads.clearFilters", {
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
                      ? t("leads.hideFilters", {
                          defaultValue: isArabic ? "إخفاء الفلاتر" : "Hide Filters",
                        })
                      : t("leads.showFilters", {
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
                    label={t(`leads.status.${statusFilter}`, {
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
                {sourceFilter ? <FilterPill label={sourceFilter} /> : null}
                {weddingDateFrom ? (
                  <FilterPill
                    label={`${t("leads.weddingDateFrom", {
                      defaultValue: isArabic ? "تاريخ الزفاف من" : "Wedding Date From",
                    })}: ${weddingDateFrom}`}
                  />
                ) : null}
                {weddingDateTo ? (
                  <FilterPill
                    label={`${t("leads.weddingDateTo", {
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
                      title={t("leads.primaryFilters", {
                        defaultValue: isArabic ? "الفلاتر الأساسية" : "Primary Filters",
                      })}
                      description={t("leads.primaryFiltersHint", {
                        defaultValue: isArabic
                          ? "استخدم الفلاتر الأساسية لتضييق القائمة بسرعة."
                          : "Use the main filters to narrow the list quickly.",
                      })}
                    />
                    <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-2">
                      <FilterField
                        label={t("leads.statusLabel", { defaultValue: "Status" })}
                      >
                        <select
                          className={filterFieldClassName}
                          style={fieldStyle}
                          value={statusFilter}
                          onChange={(event) => {
                            setStatusFilter(
                              event.target.value as "all" | TableLead["status"],
                            );
                            setCurrentPage(1);
                          }}
                        >
                          <option value="all">
                            {t("leads.allStatuses", { defaultValue: "All Statuses" })}
                          </option>
                          {LEAD_STATUS_OPTIONS.map((status) => (
                            <option key={status.value} value={status.value}>
                              {t(`leads.status.${status.value}`, {
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
                          placeholder={t("leads.allVenues", {
                            defaultValue: "All Venues",
                          })}
                          searchPlaceholder={t("leads.searchVenue", {
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

                      <FilterField
                        label={t("leads.source", { defaultValue: "Source" })}
                      >
                        <Input
                          className="h-10 rounded-xl text-[13px]"
                          value={sourceFilter}
                          onChange={(event) => {
                            setSourceFilter(event.target.value);
                            setCurrentPage(1);
                          }}
                          placeholder={t("leads.sourcePlaceholder", {
                            defaultValue: "Instagram, referral, walk-in...",
                          })}
                        />
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
                      title={t("leads.dateFilters", {
                        defaultValue: isArabic ? "نطاق التاريخ" : "Date Range",
                      })}
                      description={t("leads.dateFiltersHint", {
                        defaultValue: isArabic
                          ? "حدّد نطاق تاريخ الزفاف لعرض العملاء المحتملين المطابقين."
                          : "Limit the list to leads within a wedding date range.",
                      })}
                    />
                    <div className="grid grid-cols-1 gap-2.5">
                      <FilterField
                        label={t("leads.weddingDateFrom", {
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
                        label={t("leads.weddingDateTo", {
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
            title={t("leads.listTitle", { defaultValue: "Leads List" })}
            totalItems={totalItems}
            currentCount={leads.length}
            entityName={t("leads.title", { defaultValue: "Leads" })}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setItemsPerPage}
            setCurrentPage={setCurrentPage}
          />

          <div className="overflow-hidden">
            <DataTable
              columns={columns}
              data={leads}
              rowNumberStart={rowNumberStart}
              enableRowNumbers
              fileName="leads"
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
          title={t("leads.deleteTitle", { defaultValue: "Delete Lead" })}
          message={t("leads.deleteMessage", {
            defaultValue: "Are you sure you want to delete this lead?",
          })}
          confirmLabel={t("common.delete", { defaultValue: "Delete" })}
          cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
          onConfirm={handleDeleteConfirm}
          isPending={deleteMutation.isPending}
        />

        <Dialog
          open={lostCandidate !== null}
          onOpenChange={(open) => !open && setLostCandidate(null)}
        >
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>
                {t("leads.markLostTitle", { defaultValue: "Mark Lead as Lost" })}
              </DialogTitle>
              <DialogDescription>
                {t("leads.markLostDescription", {
                  defaultValue:
                    "Add an optional reason and note for why this lead was lost.",
                })}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <label className="space-y-2">
                <span className="text-sm font-medium text-[var(--lux-text)]">
                  {t("leads.lossReason", { defaultValue: "Reason" })}
                </span>
                <Input
                  value={lostReason}
                  onChange={(event) => setLostReason(event.target.value)}
                  placeholder={t("leads.lossReasonPlaceholder", {
                    defaultValue: "Budget mismatch, no response, competitor...",
                  })}
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-[var(--lux-text)]">
                  {t("common.notes", { defaultValue: "Notes" })}
                </span>
                <textarea
                  className={textareaClassName}
                  style={fieldStyle}
                  value={lostNotes}
                  onChange={(event) => setLostNotes(event.target.value)}
                  placeholder={t("leads.lossNotesPlaceholder", {
                    defaultValue: "Add follow-up context or final outcome...",
                  })}
                />
              </label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setLostCandidate(null)}
                disabled={markLostMutation.isPending}
              >
                {t("common.cancel", { defaultValue: "Cancel" })}
              </Button>
              <Button
                type="button"
                onClick={handleLostConfirm}
                disabled={markLostMutation.isPending}
              >
                {markLostMutation.isPending
                  ? t("common.processing", { defaultValue: "Processing..." })
                  : t("leads.markLost", { defaultValue: "Mark as Lost" })}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={convertCandidate !== null}
          onOpenChange={(open) => !open && setConvertCandidate(null)}
        >
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>
                {t("leads.convertTitle", {
                  defaultValue: "Convert Lead to Customer",
                })}
              </DialogTitle>
              <DialogDescription>
                {t("leads.convertDescription", {
                  defaultValue:
                    "This will create a customer from the current lead information.",
                })}
              </DialogDescription>
            </DialogHeader>

            <label className="space-y-2">
              <span className="text-sm font-medium text-[var(--lux-text)]">
                {t("common.notes", { defaultValue: "Notes" })}
              </span>
              <textarea
                className={textareaClassName}
                style={fieldStyle}
                value={convertNotes}
                onChange={(event) => setConvertNotes(event.target.value)}
                placeholder={t("leads.convertNotesPlaceholder", {
                  defaultValue:
                    "Optional note to carry into the conversion process...",
                })}
              />
            </label>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setConvertCandidate(null)}
                disabled={convertMutation.isPending}
              >
                {t("common.cancel", { defaultValue: "Cancel" })}
              </Button>
              <Button
                type="button"
                onClick={handleConvertConfirm}
                disabled={convertMutation.isPending}
              >
                {convertMutation.isPending
                  ? t("common.processing", { defaultValue: "Processing..." })
                  : t("leads.convertToCustomer", {
                      defaultValue: "Convert to Customer",
                    })}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedComponent>
  );
};

export default LeadsPage;

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
