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
import { WorkflowModuleDashboard } from "@/components/workflow/workflow-module-dashboard";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/ui/confirmDialog";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import {
  SearchableSelect,
  SearchableSelectEmpty,
  SearchableSelectItem,
} from "@/components/ui/searchable-select";
import { useEvents } from "@/hooks/events/useEvents";
import { getInitialEventsBusinessFilters } from "@/pages/events/event-query-params";
import { useDeleteQuotation } from "@/hooks/quotations/useDeleteQuotation";
import { useQuotations } from "@/hooks/quotations/useQuotations";
import { useQuotationWorkflowSummary } from "@/hooks/workflow/useWorkflowSummaries";
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
  const workflowSummary = useQuotationWorkflowSummary();

  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [eventSearch, setEventSearch] = useState("");
  const [eventFilter, setEventFilter] = useState("");
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
    status: statusFilter,
    issueDateFrom,
    issueDateTo,
  });
  const { data: eventsResponse } = useEvents({
    currentPage: 1,
    itemsPerPage: 200,
    filters: getInitialEventsBusinessFilters(),
  });

  const adapted = toTableQuotations(raw);
  const quotations = adapted.data.quotations;
  const totalItems = adapted.total;
  const totalPages = adapted.totalPages;
  const rowNumberStart = (currentPage - 1) * itemsPerPage + 1;
  const events = useMemo(() => eventsResponse?.data ?? [], [eventsResponse?.data]);

  const filteredEvents = useMemo(
    () =>
      events.filter((event) =>
        getEventDisplayTitle(event)
          .toLowerCase()
          .includes(eventSearch.trim().toLowerCase()),
      ),
    [eventSearch, events],
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
    statusFilter !== "all",
    Boolean(issueDateFrom),
    Boolean(issueDateTo),
  ].filter(Boolean).length;

  const activeFilterPills = [
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
        label={t(`quotations.status.${statusFilter}`, {
          defaultValue: statusFilter,
        })}
      />
    ) : null,
    issueDateFrom ? (
      <CalendarFilterPill
        key="issue-date-from"
        label={`${t("quotations.issueDateFrom", {
          defaultValue: "Issue Date From",
        })}: ${issueDateFrom}`}
      />
    ) : null,
    issueDateTo ? (
      <CalendarFilterPill
        key="issue-date-to"
        label={`${t("quotations.issueDateTo", {
          defaultValue: "Issue Date To",
        })}: ${issueDateTo}`}
      />
    ) : null,
  ].filter(Boolean);

  const handleSearchSubmit = () => {
    setSearchQuery(searchTerm.trim());
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setEventFilter("");
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
                "Search by quotation number, notes, event, or customer...",
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

        <WorkflowModuleDashboard
          title={t("quotations.workflowDashboard", {
            defaultValue: "Quotation Workflow Visibility",
          })}
          description={t("quotations.workflowDashboardHint", {
            defaultValue:
              "See which quotations still need review, which ones are approved, and which records are no longer active.",
          })}
          metrics={[
            {
              id: "total",
              label: t("common.total", { defaultValue: "Total" }),
              value: workflowSummary.total,
              helper: t("quotations.totalQuotations", {
                defaultValue: "total quotations",
              }),
            },
            {
              id: "pending",
              label: t("quotations.pendingReview", {
                defaultValue: "Pending Review",
              }),
              value: workflowSummary.metrics.pending,
              helper: t("quotations.pendingReviewHint", {
                defaultValue: "Draft and sent quotations still need a commercial decision.",
              }),
            },
            {
              id: "approved",
              label: t("quotations.approvedReady", {
                defaultValue: "Approved",
              }),
              value: workflowSummary.metrics.approved,
              helper: t("quotations.approvedReadyHint", {
                defaultValue: "Approved quotations are ready for contract follow-up.",
              }),
            },
            {
              id: "blocked",
              label: t("quotations.closedOut", {
                defaultValue: "Closed Out",
              }),
              value: workflowSummary.metrics.blocked,
              helper: t("quotations.closedOutHint", {
                defaultValue: "Rejected, expired, and superseded quotations no longer need action.",
              }),
            },
          ]}
          statuses={[
            {
              key: "all",
              label: t("quotations.allStatuses", { defaultValue: "All Statuses" }),
              count: workflowSummary.total,
              active: statusFilter === "all",
              onClick: () => {
                setStatusFilter("all");
                setCurrentPage(1);
              },
            },
            {
              key: "draft",
              label: t("quotations.status.draft", { defaultValue: "Draft" }),
              count: workflowSummary.statusCounts.draft,
              active: statusFilter === "draft",
              onClick: () => {
                setStatusFilter("draft");
                setCurrentPage(1);
              },
            },
            {
              key: "sent",
              label: t("quotations.status.sent", { defaultValue: "Sent" }),
              count: workflowSummary.statusCounts.sent,
              active: statusFilter === "sent",
              onClick: () => {
                setStatusFilter("sent");
                setCurrentPage(1);
              },
            },
            {
              key: "approved",
              label: t("quotations.status.approved", { defaultValue: "Approved" }),
              count: workflowSummary.statusCounts.approved,
              active: statusFilter === "approved",
              onClick: () => {
                setStatusFilter("approved");
                setCurrentPage(1);
              },
            },
            {
              key: "converted_to_contract",
              label: t("quotations.status.converted_to_contract", {
                defaultValue: "Converted",
              }),
              count: workflowSummary.statusCounts.converted_to_contract,
              active: statusFilter === "converted_to_contract",
              onClick: () => {
                setStatusFilter("converted_to_contract");
                setCurrentPage(1);
              },
            },
            {
              key: "rejected",
              label: t("quotations.status.rejected", { defaultValue: "Rejected" }),
              count: workflowSummary.statusCounts.rejected,
              active: statusFilter === "rejected",
              onClick: () => {
                setStatusFilter("rejected");
                setCurrentPage(1);
              },
            },
          ]}
          footer={
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStatusFilter("approved");
                  setCurrentPage(1);
                }}
              >
                {t("quotations.focusApproved", {
                  defaultValue: "Focus approved quotations",
                })}
              </Button>
              <Button type="button" variant="outline" onClick={resetFilters}>
                {t("quotations.clearFilters", { defaultValue: "Clear Filters" })}
              </Button>
            </div>
          }
          loading={workflowSummary.isLoading}
        />

        <CalendarFilterPanel
          title={t("common.filters", { defaultValue: "Filters" })}
          description={t("quotations.filtersHint", {
            defaultValue: isArabic
              ? "Ø¶ÙŠÙ‘Ù‚ Ù‚Ø§Ø¦Ù…Ø© Ø¹Ø±ÙˆØ¶ Ø§Ù„Ø£Ø³Ø¹Ø§Ø± Ø­Ø³Ø¨ Ø§Ù„Ø­ÙÙ„ ÙˆØ§Ù„Ø­Ø§Ù„Ø© ÙˆØªØ§Ø±ÙŠØ® Ø§Ù„Ø¥ØµØ¯Ø§Ø±."
              : "Refine the quotations list by event, status, and issue date.",
          })}
          activeFiltersLabel={t("quotations.activeFiltersCount", {
            count: activeFiltersCount,
            defaultValue:
              activeFiltersCount === 1
                ? "1 active filter"
                : `${activeFiltersCount} active filters`,
          })}
          activeFiltersCount={activeFiltersCount}
          clearLabel={t("quotations.clearFilters", {
            defaultValue: "Clear Filters",
          })}
          onClear={resetFilters}
          showLabel={t("quotations.showFilters", {
            defaultValue: "Show Filters",
          })}
          hideLabel={t("quotations.hideFilters", {
            defaultValue: "Hide Filters",
          })}
          pills={activeFilterPills.length ? activeFilterPills : undefined}
        >
          <CalendarFilterGroup
            className="xl:col-span-8"
            title={t("quotations.primaryFilters", {
              defaultValue: "Primary Filters",
            })}
            description={t("quotations.primaryFiltersHint", {
              defaultValue:
                "Use the main filters to narrow the quotations list quickly.",
            })}
          >
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-2">
              <CalendarFilterField
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
              </CalendarFilterField>
            </div>
          </CalendarFilterGroup>

          <CalendarFilterGroup
            className="xl:col-span-4"
            title={t("quotations.dateFilters", {
              defaultValue: "Date Range",
            })}
            description={t("quotations.dateFiltersHint", {
              defaultValue:
                "Limit the list to quotations within an issue date range.",
            })}
          >
            <div className="grid grid-cols-1 gap-2.5">
              <CalendarFilterField
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
              </CalendarFilterField>

              <CalendarFilterField
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
              </CalendarFilterField>
            </div>
          </CalendarFilterGroup>
        </CalendarFilterPanel>

        <DataTableShell
          title={t("quotations.listTitle", {
            defaultValue: "Quotations List",
          })}
          totalItems={totalItems}
          currentCount={quotations.length}
          entityName={t("quotations.title", { defaultValue: "Quotations" })}
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
            data={quotations}
            rowNumberStart={rowNumberStart}
            enableRowNumbers
            fileName="quotations"
            isLoading={isLoading}
          />
        </DataTableShell>

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

export default QuotationsPage;
