import { useMemo, useState } from "react";
import { CalendarRange, Plus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { PageContainer } from "@/components/layout/page-container";
import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/ui/confirmDialog";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import TableHeader from "@/components/common/TableHeader";
import Pagination from "@/components/ui/pagination";
import { useCustomers } from "@/hooks/customers/useCustomers";
import { useDeleteEvent } from "@/hooks/events/useDeleteEvent";
import { useEvents } from "@/hooks/events/useEvents";
import { useVenues } from "@/hooks/venues/useVenues";

import { EVENT_STATUS_OPTIONS, toTableEvents, type TableEvent } from "./adapters";
import { useEventsColumns } from "./_components/eventsColumns";
import type { EventStatus } from "./types";

const EventsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | EventStatus>("all");
  const [customerFilter, setCustomerFilter] = useState("");
  const [venueFilter, setVenueFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [deleteCandidate, setDeleteCandidate] = useState<TableEvent | null>(null);

  const { data, isLoading } = useEvents({
    currentPage,
    itemsPerPage,
    searchQuery,
    status: statusFilter,
    customerId: customerFilter,
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
  const { data: venuesResponse } = useVenues({
    currentPage: 1,
    itemsPerPage: 200,
    searchQuery: "",
    isActive: "all",
  });

  const adapted = useMemo(() => toTableEvents(data), [data]);
  const customers = customersResponse?.data ?? [];
  const venues = venuesResponse?.data ?? [];

  const columns = useEventsColumns({
    onDelete: setDeleteCandidate,
    editPermission: "events.update",
    deletePermission: "events.delete",
  });
  const deleteMutation = useDeleteEvent();

  return (
    <ProtectedComponent permission="events.read">
      <PageContainer className="space-y-6 pb-4 pt-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--lux-heading)]">
              {t("events.title", { defaultValue: "Events" })}
            </h1>
            <p className="text-sm text-[var(--lux-text-secondary)]">
              {t("events.managementHint")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ProtectedComponent permission="events.read">
              <Button
                variant="secondary"
                onClick={() => navigate("/events/calendar")}
              >
                <CalendarRange className="h-4 w-4" />
                {t("calendar.openCalendar", { defaultValue: "Open Calendar" })}
              </Button>
            </ProtectedComponent>

            <ProtectedComponent permission="events.create">
              <Button onClick={() => navigate("/events/create")}>
                <Plus className="h-4 w-4" />
                {t("events.create", { defaultValue: "Create Event" })}
              </Button>
            </ProtectedComponent>
          </div>
        </div>

        <div className="grid gap-4 rounded-[24px] border p-4 md:grid-cols-2 xl:grid-cols-6">
          <div className="relative xl:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--lux-text-muted)]" />
            <Input
              className="pl-10"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setCurrentPage(1);
              }}
              placeholder={t("events.searchPlaceholder", {
                defaultValue: "Search by title, party names, venue, or customer",
              })}
            />
          </div>

          <select
            className="h-10 rounded-xl border px-3 text-sm"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as "all" | EventStatus);
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

          <select
            className="h-10 rounded-xl border px-3 text-sm"
            value={customerFilter}
            onChange={(event) => {
              setCustomerFilter(event.target.value);
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

          <select
            className="h-10 rounded-xl border px-3 text-sm"
            value={venueFilter}
            onChange={(event) => {
              setVenueFilter(event.target.value);
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

          <Input
            type="date"
            value={dateFrom}
            onChange={(event) => {
              setDateFrom(event.target.value);
              setCurrentPage(1);
            }}
          />

          <Input
            type="date"
            value={dateTo}
            onChange={(event) => {
              setDateTo(event.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <TableHeader
            title={t("events.listTitle", { defaultValue: "Events List" })}
            totalItems={adapted.total}
            currentCount={adapted.data.events.length}
            entityName={t("events.title", { defaultValue: "Events" })}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setItemsPerPage}
            setCurrentPage={setCurrentPage}
            actions={
              <ProtectedComponent permission="events.read">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate("/events/calendar")}
                >
                  <CalendarRange className="h-3.5 w-3.5" />
                  {t("calendar.openCalendar", { defaultValue: "Open Calendar" })}
                </Button>
              </ProtectedComponent>
            }
          />

          <DataTable
            columns={columns}
            data={adapted.data.events}
            rowNumberStart={(currentPage - 1) * itemsPerPage + 1}
            enableRowNumbers
            fileName="events"
            isLoading={isLoading}
          />

          {adapted.totalPages > 1 ? (
            <div className="border-t border-border bg-muted/40 px-6 py-4">
              <Pagination
                currentPage={currentPage}
                totalPages={adapted.totalPages}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={(value: number) => {
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
          onConfirm={() =>
            deleteCandidate &&
            deleteMutation.mutate(deleteCandidate.id, {
              onSettled: () => setDeleteCandidate(null),
            })
          }
          isPending={deleteMutation.isPending}
        />
      </PageContainer>
    </ProtectedComponent>
  );
};

export default EventsPage;
