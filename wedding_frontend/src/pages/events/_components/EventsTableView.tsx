import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import {
  CalendarDays,
  Download,
  Filter,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { SummaryCard } from "@/components/dashboard/summary-card";
import { DataTableShell } from "@/components/shared/data-table-shell";
import {
  WorkspaceFilterBar,
  WorkspaceFilterField,
  WorkspaceFilterPill,
} from "@/components/shared/workspace-filter-bar";
import ConfirmDialog from "@/components/ui/confirmDialog";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import {
  SearchableSelect,
  SearchableSelectEmpty,
  SearchableSelectItem,
} from "@/components/ui/searchable-select";
import { buildEventsTableSummary } from "@/features/events/event-calendar";
import { useCustomers } from "@/hooks/customers/useCustomers";
import { useDeleteEvent } from "@/hooks/events/useDeleteEvent";
import { useEvents } from "@/hooks/events/useEvents";
import { useVenues } from "@/hooks/venues/useVenues";
import { eventsApi } from "@/lib/api/events";

import { useEventsColumns } from "../_components/eventsColumns";
import {
  EVENT_STATUS_OPTIONS,
  toTableEvents,
  type TableEvent,
} from "../adapters";
import type { EventsBusinessFilters } from "@/pages/events/event-query-params";
import type { EventStatus } from "../types";
import { Button } from "@/components/ui/button";

const filterFieldClassName =
  "h-11 w-full rounded-[6px] border px-3 text-sm text-[var(--lux-text)] outline-none transition focus:border-[var(--lux-gold-border)]";

const fieldStyle = {
  background: "var(--lux-control-surface)",
  borderColor: "var(--lux-control-border)",
} as const;

const EMPTY_FILTER_VALUE = "__all__";

type EventsTableViewProps = {
  filters: EventsBusinessFilters;
  onFiltersChange: Dispatch<SetStateAction<EventsBusinessFilters>>;
};

export function EventsTableView({
  filters,
  onFiltersChange,
}: EventsTableViewProps) {
  const { t } = useTranslation();

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [statusSearch, setStatusSearch] = useState("");
  const [venueSearch, setVenueSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [deleteCandidate, setDeleteCandidate] = useState<TableEvent | null>(
    null,
  );
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const { data, isLoading } = useEvents({
    currentPage,
    itemsPerPage,
    filters,
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
  const { data: venuesResponse } = useVenues({
    currentPage: 1,
    itemsPerPage: 200,
    searchQuery: "",
    isActive: "all",
  });

  const adapted = useMemo(() => toTableEvents(data), [data]);
  const customers = customersResponse?.data ?? [];
  const venues = venuesResponse?.data ?? [];
  const statusOptions = useMemo(
    () =>
      EVENT_STATUS_OPTIONS.map((status) => ({
        value: status.value,
        label: t(`events.status.${status.value}`, {
          defaultValue: status.label,
        }),
      })),
    [t],
  );
  const filteredStatusOptions = useMemo(() => {
    const query = statusSearch.trim().toLowerCase();

    if (!query) {
      return statusOptions;
    }

    return statusOptions.filter((status) =>
      status.label.toLowerCase().includes(query),
    );
  }, [statusOptions, statusSearch]);
  const customerOptions = useMemo(
    () =>
      customers.map((customer) => ({
        value: String(customer.id),
        label: customer.fullName,
      })),
    [customers],
  );
  const filteredCustomerOptions = useMemo(() => {
    const query = customerSearch.trim().toLowerCase();

    if (!query) {
      return customerOptions;
    }

    return customerOptions.filter((customer) =>
      customer.label.toLowerCase().includes(query),
    );
  }, [customerOptions, customerSearch]);
  const venueOptions = useMemo(
    () =>
      venues.map((venue) => ({
        value: String(venue.id),
        label: venue.name,
      })),
    [venues],
  );
  const filteredVenueOptions = useMemo(() => {
    const query = venueSearch.trim().toLowerCase();

    if (!query) {
      return venueOptions;
    }

    return venueOptions.filter((venue) =>
      venue.label.toLowerCase().includes(query),
    );
  }, [venueOptions, venueSearch]);
  const tableEvents = adapted.data.events;
  const activeFiltersCount = [
    Boolean(filters.search.trim()),
    filters.status !== "all",
    Boolean(filters.customerId),
    Boolean(filters.venueId),
    Boolean(filters.dateFrom),
    Boolean(filters.dateTo),
  ].filter(Boolean).length;
  const summaryItems = useMemo(
    () =>
      buildEventsTableSummary(
        tableEvents,
        adapted.total,
        activeFiltersCount,
        t,
      ),
    [activeFiltersCount, adapted.total, t, tableEvents],
  );
  const activeFilterPills = [
    filters.search.trim() ? (
      <WorkspaceFilterPill key="search" label={filters.search.trim()} />
    ) : null,
    filters.status !== "all" ? (
      <WorkspaceFilterPill
        key="status"
        label={t(`events.status.${filters.status}`, {
          defaultValue: filters.status,
        })}
      />
    ) : null,
    filters.customerId ? (
      <WorkspaceFilterPill
        key="customer"
        label={
          customers.find(
            (customer) => String(customer.id) === filters.customerId,
          )?.fullName ?? filters.customerId
        }
      />
    ) : null,
    filters.venueId ? (
      <WorkspaceFilterPill
        key="venue"
        label={
          venues.find((venue) => String(venue.id) === filters.venueId)?.name ??
          filters.venueId
        }
      />
    ) : null,
    filters.dateFrom ? (
      <WorkspaceFilterPill
        key="date-from"
        label={`${t("common.from", { defaultValue: "From" })}: ${filters.dateFrom}`}
      />
    ) : null,
    filters.dateTo ? (
      <WorkspaceFilterPill
        key="date-to"
        label={`${t("common.to", { defaultValue: "To" })}: ${filters.dateTo}`}
      />
    ) : null,
  ].filter(Boolean);

  const columns = useEventsColumns({
    onDelete: setDeleteCandidate,
    editPermission: "events.update",
    deletePermission: "events.delete",
  });
  const deleteMutation = useDeleteEvent();
  const resetFilters = () => {
    onFiltersChange({
      search: "",
      status: "all",
      customerId: "",
      venueId: "",
      dateFrom: "",
      dateTo: "",
    });
    setCurrentPage(1);
  };
  const handleExportPdf = async () => {
    try {
      setIsExportingPdf(true);

      const response = await eventsApi.exportPdf(filters);
      const contentType = String(response.headers["content-type"] || "").toLowerCase();

      if (!contentType.includes("application/pdf")) {
        throw new Error("Server did not return a valid PDF document.");
      }

      const contentDisposition = response.headers["content-disposition"] as
        | string
        | undefined;

      const fileNameMatch = contentDisposition?.match(/filename="?(.*?)"?$/i);
      const fileName =
        fileNameMatch?.[1] ||
        `events-report-${new Date().toISOString().slice(0, 10)}.pdf`;

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export events PDF", error);
      alert(
        error instanceof Error ? error.message : "Failed to export events PDF",
      );
    } finally {
      setIsExportingPdf(false);
    }
  };
  return (
    <>
      {/* <WorkflowModuleDashboard
        eyebrow={t("events.workflowDashboardEyebrow", {
          defaultValue: "Workflow Dashboard",
        })}
        title={t("events.workflowDashboard", {
          defaultValue: "Event Workflow Visibility",
        })}
        description={t("events.workflowDashboardHint", {
          defaultValue:
            "See which events are still being designed, waiting on commercial progress, confirmed, or already blocked.",
        })}
        statusesTitle={t("events.statusDistributionTitle", {
          defaultValue: "Status Distribution",
        })}
        statusesDescription={t("events.statusDistributionHint", {
          defaultValue:
            "Use these quick filters to jump into the current workflow queue.",
        })}
        metrics={[
          {
            id: "total",
            label: t("common.total", { defaultValue: "Total" }),
            value: workflowSummary.total,
            helper: t("events.totalEventsHint", {
              defaultValue: "All event records in the current workflow.",
            }),
          },
          {
            id: "active",
            label: t("events.activeQueue", {
              defaultValue: "Active Queue",
            }),
            value: workflowSummary.metrics.active,
            helper: t("events.activeQueueHint", {
              defaultValue: "Designing, quotation, confirmation, and execution stages.",
            }),
          },
          {
            id: "completed",
            label: t("events.completedLabel", {
              defaultValue: "Completed",
            }),
            value: workflowSummary.metrics.completed,
            helper: t("events.completedLabelHint", {
              defaultValue: "Events already delivered.",
            }),
          },
          {
            id: "blocked",
            label: t("events.blockedLabel", {
              defaultValue: "Blocked",
            }),
            value: workflowSummary.metrics.blocked,
            helper: t("events.blockedLabelHint", {
              defaultValue: "Cancelled events stop downstream creation.",
            }),
          },
        ]}
        statuses={[
          {
            key: "all",
            label: t("events.allStatuses", { defaultValue: "All Statuses" }),
            count: workflowSummary.total,
            active: filters.status === "all",
            onClick: () => {
              onFiltersChange((current) => ({ ...current, status: "all" }));
              setCurrentPage(1);
            },
          },
          {
            key: "draft",
            label: t("events.status.draft", { defaultValue: "Draft" }),
            count: workflowSummary.statusCounts.draft,
            active: filters.status === "draft",
            onClick: () => {
              onFiltersChange((current) => ({ ...current, status: "draft" }));
              setCurrentPage(1);
            },
          },
          {
            key: "designing",
            label: t("events.status.designing", { defaultValue: "Designing" }),
            count: workflowSummary.statusCounts.designing,
            active: filters.status === "designing",
            onClick: () => {
              onFiltersChange((current) => ({ ...current, status: "designing" }));
              setCurrentPage(1);
            },
          },
          {
            key: "quotation_pending",
            label: t("events.status.quotation_pending", {
              defaultValue: "Quotation Pending",
            }),
            count: workflowSummary.statusCounts.quotation_pending,
            active: filters.status === "quotation_pending",
            onClick: () => {
              onFiltersChange((current) => ({
                ...current,
                status: "quotation_pending",
              }));
              setCurrentPage(1);
            },
          },
          {
            key: "confirmed",
            label: t("events.status.confirmed", { defaultValue: "Confirmed" }),
            count: workflowSummary.statusCounts.confirmed,
            active: filters.status === "confirmed",
            onClick: () => {
              onFiltersChange((current) => ({ ...current, status: "confirmed" }));
              setCurrentPage(1);
            },
          },
          {
            key: "in_progress",
            label: t("events.status.in_progress", { defaultValue: "In Progress" }),
            count: workflowSummary.statusCounts.in_progress,
            active: filters.status === "in_progress",
            onClick: () => {
              onFiltersChange((current) => ({ ...current, status: "in_progress" }));
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
                onFiltersChange((current) => ({
                  ...current,
                  status: "quotation_pending",
                }));
                setCurrentPage(1);
              }}
            >
              {t("events.focusCommercialQueue", {
                defaultValue: "Focus quotation queue",
              })}
            </Button>
            <Button type="button" variant="outline" onClick={resetFilters}>
              {t("events.clearFilters", { defaultValue: "Clear Filters" })}
            </Button>
          </div>
        }
        loading={workflowSummary.isLoading}
        showContentLabel={t("events.showWorkflowDashboard", {
          defaultValue: "Show Dashboard",
        })}
        hideContentLabel={t("events.hideWorkflowDashboard", {
          defaultValue: "Hide Dashboard",
        })}
      /> */}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryItems.map((summary) => (
          <SummaryCard
            key={summary.id}
            label={summary.label}
            value={summary.value}
            hint={summary.hint}
            accent={
              summary.id === "total" ? (
                <CalendarDays className="h-4 w-4" />
              ) : summary.id === "execution" ? (
                <ShieldCheck className="h-4 w-4" />
              ) : (
                <Filter className="h-4 w-4" />
              )
            }
            className="workspace-summary-card"
          />
        ))}
      </section>

      <WorkspaceFilterBar
        title={t("common.filters", { defaultValue: "Filters" })}
        description={t("events.primaryFiltersHint", {
          defaultValue:
            "Use the main filters to narrow the event list quickly.",
        })}
        activeFiltersLabel={t("events.activeFiltersCount", {
          count: activeFiltersCount,
          defaultValue:
            activeFiltersCount === 1
              ? "1 active filter"
              : `${activeFiltersCount} active filters`,
        })}
        activeFiltersCount={activeFiltersCount}
        clearLabel={t("events.clearFilters", { defaultValue: "Clear Filters" })}
        onClear={resetFilters}
        showFiltersLabel={t("events.showFilters", {
          defaultValue: "Show Filters",
        })}
        hideFiltersLabel={t("events.hideFilters", {
          defaultValue: "Hide Filters",
        })}
        pills={activeFilterPills.length ? activeFilterPills : undefined}
        quickFilters={
          <>
            <WorkspaceFilterField
              label={t("common.searchAnything", { defaultValue: "Search" })}
            >
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--lux-text-muted)]" />
                <Input
                  className={`${filterFieldClassName} pl-10`}
                  style={fieldStyle}
                  value={filters.search}
                  onChange={(event) => {
                    onFiltersChange((current) => ({
                      ...current,
                      search: event.target.value,
                    }));
                    setCurrentPage(1);
                  }}
                  placeholder={t("events.searchPlaceholder", {
                    defaultValue:
                      "Search by title, party names, venue, or customer",
                  })}
                />
              </div>
            </WorkspaceFilterField>

            <WorkspaceFilterField
              label={t("events.statusLabel", { defaultValue: "Status" })}
            >
              <SearchableSelect
                value={filters.status}
                onValueChange={(value) => {
                  onFiltersChange((current) => ({
                    ...current,
                    status: value as "all" | EventStatus,
                  }));
                  setCurrentPage(1);
                }}
                onSearch={setStatusSearch}
                placeholder={t("events.allStatuses", {
                  defaultValue: "All Statuses",
                })}
                searchPlaceholder={t("common.search", {
                  defaultValue: "search",
                })}
                emptyMessage={t("common.noResultsTitle", {
                  defaultValue: "No results found",
                })}
                allowClear={filters.status !== "all"}
                onClear={() => {
                  onFiltersChange((current) => ({
                    ...current,
                    status: "all",
                  }));
                  setCurrentPage(1);
                }}
                triggerClassName={filterFieldClassName}
              >
                <SearchableSelectItem value="all">
                  {t("events.allStatuses", { defaultValue: "All Statuses" })}
                </SearchableSelectItem>
                {filteredStatusOptions.length === 0 ? (
                  <SearchableSelectEmpty
                    message={t("common.noResultsTitle", {
                      defaultValue: "No results found",
                    })}
                  />
                ) : null}
                {filteredStatusOptions.map((status) => (
                  <SearchableSelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SearchableSelectItem>
                ))}
              </SearchableSelect>
            </WorkspaceFilterField>

            <WorkspaceFilterField
              label={t("common.venue", { defaultValue: "Venue" })}
            >
              <SearchableSelect
                value={filters.venueId || EMPTY_FILTER_VALUE}
                onValueChange={(value) => {
                  onFiltersChange((current) => ({
                    ...current,
                    venueId: value === EMPTY_FILTER_VALUE ? "" : value,
                  }));
                  setCurrentPage(1);
                }}
                onSearch={setVenueSearch}
                placeholder={t("events.allVenues", {
                  defaultValue: "All Venues",
                })}
                searchPlaceholder={t("events.searchVenues", {
                  defaultValue: "Search venues...",
                })}
                emptyMessage={t("common.noResultsTitle", {
                  defaultValue: "No results found",
                })}
                allowClear={Boolean(filters.venueId)}
                onClear={() => {
                  onFiltersChange((current) => ({
                    ...current,
                    venueId: "",
                  }));
                  setCurrentPage(1);
                }}
                triggerClassName={filterFieldClassName}
              >
                <SearchableSelectItem value={EMPTY_FILTER_VALUE}>
                  {t("events.allVenues", { defaultValue: "All Venues" })}
                </SearchableSelectItem>
                {filteredVenueOptions.length === 0 ? (
                  <SearchableSelectEmpty
                    message={t("common.noResultsTitle", {
                      defaultValue: "No results found",
                    })}
                  />
                ) : null}
                {filteredVenueOptions.map((venue) => (
                  <SearchableSelectItem key={venue.value} value={venue.value}>
                    {venue.label}
                  </SearchableSelectItem>
                ))}
              </SearchableSelect>
            </WorkspaceFilterField>

            <WorkspaceFilterField
              label={t("events.customer", { defaultValue: "Customer" })}
            >
              <SearchableSelect
                value={filters.customerId || EMPTY_FILTER_VALUE}
                onValueChange={(value) => {
                  onFiltersChange((current) => ({
                    ...current,
                    customerId: value === EMPTY_FILTER_VALUE ? "" : value,
                  }));
                  setCurrentPage(1);
                }}
                onSearch={setCustomerSearch}
                placeholder={t("events.allCustomers", {
                  defaultValue: "All Customers",
                })}
                searchPlaceholder={t("events.searchCustomers", {
                  defaultValue: "Search customers...",
                })}
                emptyMessage={t("common.noResultsTitle", {
                  defaultValue: "No results found",
                })}
                allowClear={Boolean(filters.customerId)}
                onClear={() => {
                  onFiltersChange((current) => ({
                    ...current,
                    customerId: "",
                  }));
                  setCurrentPage(1);
                }}
                triggerClassName={filterFieldClassName}
              >
                <SearchableSelectItem value={EMPTY_FILTER_VALUE}>
                  {t("events.allCustomers", { defaultValue: "All Customers" })}
                </SearchableSelectItem>
                {filteredCustomerOptions.length === 0 ? (
                  <SearchableSelectEmpty
                    message={t("common.noResultsTitle", {
                      defaultValue: "No results found",
                    })}
                  />
                ) : null}
                {filteredCustomerOptions.map((customer) => (
                  <SearchableSelectItem
                    key={customer.value}
                    value={customer.value}
                  >
                    {customer.label}
                  </SearchableSelectItem>
                ))}
              </SearchableSelect>
            </WorkspaceFilterField>

            <WorkspaceFilterField
              label={t("common.from", { defaultValue: "From" })}
            >
              <Input
                type="date"
                className={filterFieldClassName}
                style={fieldStyle}
                value={filters.dateFrom}
                onChange={(event) => {
                  onFiltersChange((current) => ({
                    ...current,
                    dateFrom: event.target.value,
                  }));
                  setCurrentPage(1);
                }}
              />
            </WorkspaceFilterField>

            <WorkspaceFilterField
              label={t("common.to", { defaultValue: "To" })}
            >
              <Input
                type="date"
                className={filterFieldClassName}
                style={fieldStyle}
                value={filters.dateTo}
                onChange={(event) => {
                  onFiltersChange((current) => ({
                    ...current,
                    dateTo: event.target.value,
                  }));
                  setCurrentPage(1);
                }}
              />
            </WorkspaceFilterField>
          </>
        }
      />

      <DataTableShell
        title={t("events.listTitle", { defaultValue: "Events List" })}
        totalItems={adapted.total}
        currentCount={tableEvents.length}
        entityName={t("events.title", { defaultValue: "Events" })}
        itemsPerPage={itemsPerPage}
        setItemsPerPage={setItemsPerPage}
        setCurrentPage={setCurrentPage}
        currentPage={currentPage}
        totalPages={adapted.totalPages}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(value: number) => {
          setItemsPerPage(value);
          setCurrentPage(1);
        }}
        headerActions={
          <Button
            type="button"
            variant="outline"
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {isExportingPdf
              ? t("common.loading", { defaultValue: "Loading..." })
              : t("events.exportPdf", { defaultValue: "Export PDF" })}
          </Button>
        }
        className="operations-table-shell"
      >
        <DataTable
          columns={columns}
          data={tableEvents}
          rowNumberStart={(currentPage - 1) * itemsPerPage + 1}
          enableRowNumbers
          fileName="events"
          isLoading={isLoading}
          emptyTitle={t("events.tablePage.emptyTitle", {
            defaultValue: "No events match these filters",
          })}
          emptyDescription={t("events.tablePage.emptyDescription", {
            defaultValue:
              "Try clearing the venue or date filters to bring more records back into view.",
          })}
        />
      </DataTableShell>

      <ConfirmDialog
        open={deleteCandidate !== null}
        onOpenChange={(open) => !open && setDeleteCandidate(null)}
        title={t("events.deleteTitle", { defaultValue: "Delete Event" })}
        message={t("events.deleteMessage", {
          defaultValue: "Are you sure you want to delete this event?",
        })}
        confirmLabel={t("common.delete", { defaultValue: "Delete" })}
        cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
        onConfirm={() =>
          deleteCandidate &&
          deleteMutation.mutate(deleteCandidate.id, {
            onSettled: () => setDeleteCandidate(null),
          })
        }
        isPending={deleteMutation.isPending}
      />
    </>
  );
}
