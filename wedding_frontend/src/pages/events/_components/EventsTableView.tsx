import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import {
  CalendarDays,
  Download,
  Filter,
  Search,
  ShieldCheck,
} from "lucide-react";
import api from "@/lib/axios";
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
import { buildEventsTableSummary } from "@/features/events/event-calendar";
import { useCustomers } from "@/hooks/customers/useCustomers";
import { useDeleteEvent } from "@/hooks/events/useDeleteEvent";
import { useEvents } from "@/hooks/events/useEvents";
import { useVenues } from "@/hooks/venues/useVenues";

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

      const response = await api.get("/events/export/pdf", {
        params: {
          search: filters.search.trim() ? filters.search.trim() : undefined,
          status: filters.status === "all" ? undefined : filters.status,
          customerId: filters.customerId
            ? Number(filters.customerId)
            : undefined,
          venueId: filters.venueId ? Number(filters.venueId) : undefined,
          dateFrom: filters.dateFrom || undefined,
          dateTo: filters.dateTo || undefined,
        },
        responseType: "blob",
        validateStatus: () => true,
      });

      const contentType = String(
        response.headers["content-type"] || "",
      ).toLowerCase();

      if (!contentType.includes("application/pdf")) {
        const errorText = await response.data.text();
        console.error("Events PDF export failed response:", errorText);
        throw new Error(
          errorText || "Server did not return a valid PDF document.",
        );
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
              <select
                className={filterFieldClassName}
                style={fieldStyle}
                value={filters.status}
                onChange={(event) => {
                  onFiltersChange((current) => ({
                    ...current,
                    status: event.target.value as "all" | EventStatus,
                  }));
                  setCurrentPage(1);
                }}
              >
                <option value="all">
                  {t("events.allStatuses", { defaultValue: "All Statuses" })}
                </option>
                {EVENT_STATUS_OPTIONS.map((status) => (
                  <option key={status.value} value={status.value}>
                    {t(`events.status.${status.value}`, {
                      defaultValue: status.label,
                    })}
                  </option>
                ))}
              </select>
            </WorkspaceFilterField>

            <WorkspaceFilterField
              label={t("common.venue", { defaultValue: "Venue" })}
            >
              <select
                className={filterFieldClassName}
                style={fieldStyle}
                value={filters.venueId}
                onChange={(event) => {
                  onFiltersChange((current) => ({
                    ...current,
                    venueId: event.target.value,
                  }));
                  setCurrentPage(1);
                }}
              >
                <option value="">
                  {t("events.allVenues", { defaultValue: "All Venues" })}
                </option>
                {venues.map((venue) => (
                  <option key={venue.id} value={String(venue.id)}>
                    {venue.name}
                  </option>
                ))}
              </select>
            </WorkspaceFilterField>

            <WorkspaceFilterField
              label={t("events.customer", { defaultValue: "Customer" })}
            >
              <select
                className={filterFieldClassName}
                style={fieldStyle}
                value={filters.customerId}
                onChange={(event) => {
                  onFiltersChange((current) => ({
                    ...current,
                    customerId: event.target.value,
                  }));
                  setCurrentPage(1);
                }}
              >
                <option value="">
                  {t("events.allCustomers", { defaultValue: "All Customers" })}
                </option>
                {customers.map((customer) => (
                  <option key={customer.id} value={String(customer.id)}>
                    {customer.fullName}
                  </option>
                ))}
              </select>
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
