import { useMemo, useState, type ReactNode } from "react";
import { FileText, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  CalendarFilterField,
  CalendarFilterGroup,
  CalendarFilterPanel,
  CalendarFilterPill,
} from "@/components/calendar/calendar-filter-panel";
import CompactHeader from "@/components/common/CompactHeader";
import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import { DataTableShell } from "@/components/shared/data-table-shell";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/ui/confirmDialog";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import {
  SearchableSelect,
  SearchableSelectEmpty,
  SearchableSelectItem,
} from "@/components/ui/searchable-select";
import { useContracts } from "@/hooks/contracts/useContracts";
import { useDeleteContract } from "@/hooks/contracts/useDeleteContract";
import { useEvents } from "@/hooks/events/useEvents";
import { getInitialEventsBusinessFilters } from "@/pages/events/event-query-params";
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
  const [quotationSearch, setQuotationSearch] = useState("");
  const [eventSearch, setEventSearch] = useState("");
  const [quotationFilter, setQuotationFilter] = useState("");
  const [eventFilter, setEventFilter] = useState("");
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
    status: statusFilter,
    signedDateFrom,
    signedDateTo,
  });
  const { data: quotationsResponse } = useQuotations({
    currentPage: 1,
    itemsPerPage: 200,
    searchQuery: "",
    eventId: "",
    status: "all",
    issueDateFrom: "",
    issueDateTo: "",
  });
  const { data: eventsResponse } = useEvents({
    currentPage: 1,
    itemsPerPage: 200,
    filters: getInitialEventsBusinessFilters(),
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

  const deleteMutation = useDeleteContract();
  const columns = useContractsColumns({
    onDelete: setDeleteCandidate,
    editPermission,
    deletePermission,
  });

  const activeFiltersCount = [
    Boolean(quotationFilter),
    Boolean(eventFilter),
    statusFilter !== "all",
    Boolean(signedDateFrom),
    Boolean(signedDateTo),
  ].filter(Boolean).length;

  const activeFilterPills = [
    quotationFilter ? (
      <CalendarFilterPill
        key="quotation"
        label={
          quotations.find((quotation) => String(quotation.id) === quotationFilter)
            ? getQuotationDisplayNumber(
                quotations.find(
                  (quotation) => String(quotation.id) === quotationFilter,
                )!,
              )
            : quotationFilter
        }
      />
    ) : null,
    eventFilter ? (
      <CalendarFilterPill
        key="event"
        label={
          events.find((event) => String(event.id) === eventFilter)
            ? getEventDisplayTitle(
                events.find((event) => String(event.id) === eventFilter)!,
              )
            : eventFilter
        }
      />
    ) : null,
    statusFilter !== "all" ? (
      <CalendarFilterPill
        key="status"
        label={t(`contracts.status.${statusFilter}`, {
          defaultValue: statusFilter,
        })}
      />
    ) : null,
    signedDateFrom ? (
      <CalendarFilterPill
        key="signed-date-from"
        label={`${t("contracts.signedDateFrom", {
          defaultValue: "Signed Date From",
        })}: ${signedDateFrom}`}
      />
    ) : null,
    signedDateTo ? (
      <CalendarFilterPill
        key="signed-date-to"
        label={`${t("contracts.signedDateTo", {
          defaultValue: "Signed Date To",
        })}: ${signedDateTo}`}
      />
    ) : null,
  ].filter(Boolean);

  const handleSearchSubmit = () => {
    setSearchQuery(searchTerm.trim());
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setQuotationFilter("");
    setEventFilter("");
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
                "Search by contract number, notes, quotation, event, or customer...",
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

        <CalendarFilterPanel
          title={t("common.filters", { defaultValue: "Filters" })}
          description={t("contracts.filtersHint", {
            defaultValue: isArabic
              ? "ØµÙÙ‘Ù Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø¹Ù‚ÙˆØ¯ Ø­Ø³Ø¨ Ø¹Ø±Ø¶ Ø§Ù„Ø³Ø¹Ø± ÙˆØ§Ù„Ø­ÙÙ„ ÙˆØ§Ù„Ø­Ø§Ù„Ø© ÙˆØªØ§Ø±ÙŠØ® Ø§Ù„ØªÙˆÙ‚ÙŠØ¹."
              : "Refine the contracts list by quotation, event, status, and signed date.",
          })}
          activeFiltersLabel={t("contracts.activeFiltersCount", {
            count: activeFiltersCount,
            defaultValue:
              activeFiltersCount === 1
                ? "1 active filter"
                : `${activeFiltersCount} active filters`,
          })}
          activeFiltersCount={activeFiltersCount}
          clearLabel={t("contracts.clearFilters", {
            defaultValue: "Clear Filters",
          })}
          onClear={resetFilters}
          showLabel={t("contracts.showFilters", {
            defaultValue: "Show Filters",
          })}
          hideLabel={t("contracts.hideFilters", {
            defaultValue: "Hide Filters",
          })}
          pills={activeFilterPills.length ? activeFilterPills : undefined}
        >
          <CalendarFilterGroup
            className="xl:col-span-8"
            title={t("contracts.primaryFilters", {
              defaultValue: "Primary Filters",
            })}
            description={t("contracts.primaryFiltersHint", {
              defaultValue:
                "Use the main filters to narrow the contracts list quickly.",
            })}
          >
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-2">
              <CalendarFilterField
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
                      ? "Ø§Ø¨Ø­Ø« Ø¹Ù† Ø¹Ø±Ø¶ Ø³Ø¹Ø±..."
                      : "Search quotations...",
                  })}
                  emptyMessage={t("common.noResultsTitle", {
                    defaultValue: "No results found",
                  })}
                >
                  {filteredQuotations.length === 0 ? (
                    <SearchableSelectEmpty
                      message={t("common.noResultsTitle", {
                        defaultValue: "No results found",
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
              </CalendarFilterField>

              <CalendarFilterField
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
                    defaultValue: isArabic
                      ? "Ø§Ø¨Ø­Ø« Ø¹Ù† Ø­ÙÙ„..."
                      : "Search events...",
                  })}
                  emptyMessage={t("common.noResultsTitle", {
                    defaultValue: "No results found",
                  })}
                >
                  {filteredEvents.length === 0 ? (
                    <SearchableSelectEmpty
                      message={t("common.noResultsTitle", {
                        defaultValue: "No results found",
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
              </CalendarFilterField>

              <CalendarFilterField
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
              </CalendarFilterField>
            </div>
          </CalendarFilterGroup>

          <CalendarFilterGroup
            className="xl:col-span-4"
            title={t("contracts.dateFilters", {
              defaultValue: "Date Range",
            })}
            description={t("contracts.dateFiltersHint", {
              defaultValue:
                "Limit the list to contracts within a signed date range.",
            })}
          >
            <div className="grid grid-cols-1 gap-2.5">
              <CalendarFilterField
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
              </CalendarFilterField>

              <CalendarFilterField
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
              </CalendarFilterField>
            </div>
          </CalendarFilterGroup>
        </CalendarFilterPanel>

        <DataTableShell
          title={t("contracts.listTitle", {
            defaultValue: "Contracts List",
          })}
          totalItems={totalItems}
          currentCount={contracts.length}
          entityName={t("contracts.title", { defaultValue: "Contracts" })}
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
            data={contracts}
            rowNumberStart={rowNumberStart}
            enableRowNumbers
            fileName="contracts"
            isLoading={isLoading}
          />
        </DataTableShell>

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

export default ContractsPage;
