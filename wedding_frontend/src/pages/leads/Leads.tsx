import { useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  RotateCcw,
  UserRoundSearch,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  AppDialogBody,
  AppDialogFooter,
  AppDialogHeader,
} from "@/components/shared/app-dialog";
import {
  CrudFilterField,
  CrudFilterPill,
  CrudFilters,
  CrudPageHeader,
  CrudPageLayout,
} from "@/components/shared/crud-layout";
import { DataTableShell } from "@/components/shared/data-table-shell";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/ui/confirmDialog";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  SearchableSelect,
  SearchableSelectEmpty,
  SearchableSelectItem,
} from "@/components/ui/searchable-select";
import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import { useConvertLeadToCustomer } from "@/hooks/leads/useConvertLeadToCustomer";
import { useDeleteLead } from "@/hooks/leads/useDeleteLead";
import { useLeads } from "@/hooks/leads/useLeads";
import { useMarkLeadLost } from "@/hooks/leads/useMarkLeadLost";
import { useVenues } from "@/hooks/venues/useVenues";

import { LEAD_STATUS_OPTIONS, toTableLeads, type TableLead } from "./adapters";
import { useLeadsColumns } from "./_components/leadsColumns";

const filterFieldClassName =
  "app-native-select h-10 rounded-xl px-3 text-[13px]";
const FILTER_EMPTY_VALUE = "__all__";

const LeadsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

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
      <CrudPageLayout>
        <CrudPageHeader
          icon={<UserRoundSearch className="h-5 w-5 text-primary" />}
          title={t("leads.title", { defaultValue: "Leads" })}
          meta={
            <>
              {totalItems} {t("leads.totalLeads", { defaultValue: "total leads" })}
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
          actions={
            <ProtectedComponent permission={createPermission}>
              <Button onClick={() => navigate("/leads/create")}>
                <Plus className="h-4 w-4" />
                {t("leads.create", { defaultValue: "Create Lead" })}
              </Button>
            </ProtectedComponent>
          }
        />

        <CrudFilters
          title={t("common.filters", { defaultValue: "Filters" })}
          description={t("leads.filtersHint", {
            defaultValue:
              "Refine the leads list by status, venue, source, and wedding date.",
          })}
          actions={
            <>
              <CrudFilterPill
                label={t("leads.activeFiltersCount", {
                  count: activeFiltersCount,
                  defaultValue:
                    activeFiltersCount === 1
                      ? "1 active filter"
                      : `${activeFiltersCount} active filters`,
                })}
              />
              <Button
                size="sm"
                variant="secondary"
                className="h-9 rounded-xl px-2.5 text-[12px]"
                disabled={activeFiltersCount === 0}
                onClick={resetFilters}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {t("leads.clearFilters", { defaultValue: "Clear Filters" })}
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
                  ? t("leads.hideFilters", { defaultValue: "Hide Filters" })
                  : t("leads.showFilters", { defaultValue: "Show Filters" })}
              </Button>
            </>
          }
          contentClassName="grid-cols-1"
        >
          <div className="space-y-4">
            {activeFiltersCount > 0 ? (
              <div
                className="flex min-h-[28px] flex-wrap items-center gap-1.5 border-t pt-3"
                style={{ borderColor: "var(--lux-row-border)" }}
              >
                {statusFilter !== "all" ? (
                  <CrudFilterPill
                    label={t(`leads.status.${statusFilter}`, {
                      defaultValue: statusFilter,
                    })}
                  />
                ) : null}
                {venueFilter ? (
                  <CrudFilterPill
                    label={
                      venues.find((venue) => String(venue.id) === venueFilter)?.name ||
                      venueFilter
                    }
                  />
                ) : null}
                {sourceFilter ? <CrudFilterPill label={sourceFilter} /> : null}
                {weddingDateFrom ? (
                  <CrudFilterPill
                    label={`${t("leads.weddingDateFrom", {
                      defaultValue: "Wedding Date From",
                    })}: ${weddingDateFrom}`}
                  />
                ) : null}
                {weddingDateTo ? (
                  <CrudFilterPill
                    label={`${t("leads.weddingDateTo", {
                      defaultValue: "Wedding Date To",
                    })}: ${weddingDateTo}`}
                  />
                ) : null}
              </div>
            ) : null}

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
                    className="grid gap-3 border-t pt-4 xl:grid-cols-12"
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
                          defaultValue: "Primary Filters",
                        })}
                        description={t("leads.primaryFiltersHint", {
                          defaultValue:
                            "Use the main filters to narrow the list quickly.",
                        })}
                      />

                      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-2">
                        <CrudFilterField
                          label={t("leads.statusLabel", {
                            defaultValue: "Status",
                          })}
                        >
                          <select
                            className={filterFieldClassName}
                            value={statusFilter}
                            onChange={(event) => {
                              setStatusFilter(
                                event.target.value as "all" | TableLead["status"],
                              );
                              setCurrentPage(1);
                            }}
                          >
                            <option value="all">
                              {t("leads.allStatuses", {
                                defaultValue: "All Statuses",
                              })}
                            </option>
                            {LEAD_STATUS_OPTIONS.map((status) => (
                              <option key={status.value} value={status.value}>
                                {t(`leads.status.${status.value}`, {
                                  defaultValue: status.label,
                                })}
                              </option>
                            ))}
                          </select>
                        </CrudFilterField>

                        <CrudFilterField
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
                              defaultValue: "Search venues...",
                            })}
                            emptyMessage={t("common.noResultsTitle", {
                              defaultValue: "No results found",
                            })}
                          >
                            {filteredVenueOptions.length === 0 ? (
                              <SearchableSelectEmpty
                                message={t("common.noResultsTitle", {
                                  defaultValue: "No results found",
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
                        </CrudFilterField>

                        <CrudFilterField
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
                        </CrudFilterField>
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
                          defaultValue: "Date Range",
                        })}
                        description={t("leads.dateFiltersHint", {
                          defaultValue:
                            "Limit the list to leads within a wedding date range.",
                        })}
                      />

                      <div className="grid grid-cols-1 gap-2.5">
                        <CrudFilterField
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
                        </CrudFilterField>

                        <CrudFilterField
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
                        </CrudFilterField>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </CrudFilters>

        <DataTableShell
          title={t("leads.listTitle", { defaultValue: "Leads List" })}
          totalItems={totalItems}
          currentCount={leads.length}
          entityName={t("leads.title", { defaultValue: "Leads" })}
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
            data={leads}
            rowNumberStart={rowNumberStart}
            enableRowNumbers
            fileName="leads"
            isLoading={isLoading}
          />
        </DataTableShell>

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
            <AppDialogHeader
              title={t("leads.markLostTitle", {
                defaultValue: "Mark Lead as Lost",
              })}
              description={t("leads.markLostDescription", {
                defaultValue:
                  "Add an optional reason and note for why this lead was lost.",
              })}
            />

            <AppDialogBody>
              <label className="crud-filter-field">
                <span className="section-description font-medium text-[var(--lux-text)]">
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

              <label className="crud-filter-field">
                <span className="section-description font-medium text-[var(--lux-text)]">
                  {t("common.notes", { defaultValue: "Notes" })}
                </span>
                <textarea
                  className="app-textarea"
                  value={lostNotes}
                  onChange={(event) => setLostNotes(event.target.value)}
                  placeholder={t("leads.lossNotesPlaceholder", {
                    defaultValue: "Add follow-up context or final outcome...",
                  })}
                />
              </label>
            </AppDialogBody>

            <AppDialogFooter>
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
            </AppDialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={convertCandidate !== null}
          onOpenChange={(open) => !open && setConvertCandidate(null)}
        >
          <DialogContent className="sm:max-w-xl">
            <AppDialogHeader
              title={t("leads.convertTitle", {
                defaultValue: "Convert Lead to Customer",
              })}
              description={t("leads.convertDescription", {
                defaultValue:
                  "This will create a customer from the current lead information.",
              })}
            />

            <AppDialogBody>
              <label className="crud-filter-field">
                <span className="section-description font-medium text-[var(--lux-text)]">
                  {t("common.notes", { defaultValue: "Notes" })}
                </span>
                <textarea
                  className="app-textarea"
                  value={convertNotes}
                  onChange={(event) => setConvertNotes(event.target.value)}
                  placeholder={t("leads.convertNotesPlaceholder", {
                    defaultValue:
                      "Optional note to carry into the conversion process...",
                  })}
                />
              </label>
            </AppDialogBody>

            <AppDialogFooter>
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
            </AppDialogFooter>
          </DialogContent>
        </Dialog>
      </CrudPageLayout>
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
      <p className="text-xs leading-5 text-[var(--lux-text-secondary)]">
        {description}
      </p>
    </div>
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
  children: ReactNode;
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
