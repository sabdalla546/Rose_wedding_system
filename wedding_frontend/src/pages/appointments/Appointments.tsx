import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarClock,
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
import {
  useCancelAppointment,
  useCompleteAppointment,
  useConfirmAppointment,
  useRescheduleAppointment,
} from "@/hooks/appointments/useAppointmentActions";
import { useAppointments } from "@/hooks/appointments/useAppointments";
import { useDeleteAppointment } from "@/hooks/appointments/useDeleteAppointment";
import { useCustomers } from "@/hooks/customers/useCustomers";
import { useUsers } from "@/hooks/users/useUsers";
import { useVenues } from "@/hooks/venues/useVenues";

import {
  APPOINTMENT_STATUS_OPTIONS,
  toTableAppointments,
  type TableAppointment,
} from "./adapters";
import { useAppointmentsColumns } from "./_components/appointmentsColumns";

const textareaClassName =
  "min-h-[110px] w-full rounded-[22px] border px-4 py-3 text-sm text-[var(--lux-text)] placeholder:text-[var(--lux-text-muted)] outline-none transition-all focus:border-[var(--lux-gold-border)] focus:ring-2 focus:ring-[var(--lux-gold-glow)]";

const fieldStyle = {
  background: "var(--lux-control-surface)",
  borderColor: "var(--lux-control-border)",
} as const;

const fieldClassName =
  "h-11 rounded-2xl border px-4 text-sm text-[var(--lux-text)] outline-none transition focus:border-[var(--lux-gold-border)]";
const filterFieldClassName =
  "h-10 rounded-xl border px-3 text-[13px] text-[var(--lux-text)] outline-none transition focus:border-[var(--lux-gold-border)]";
const FILTER_EMPTY_VALUE = "__all__";

const AppointmentsPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isArabic = i18n.language === "ar";

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | TableAppointment["status"]>(
    "all",
  );
  const [customerSearch, setCustomerSearch] = useState("");
  const [venueSearch, setVenueSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [venueFilter, setVenueFilter] = useState("");
  const [assignedUserFilter, setAssignedUserFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [deleteCandidate, setDeleteCandidate] = useState<TableAppointment | null>(null);
  const [confirmCandidate, setConfirmCandidate] = useState<TableAppointment | null>(null);
  const [completeCandidate, setCompleteCandidate] = useState<TableAppointment | null>(null);
  const [cancelCandidate, setCancelCandidate] = useState<TableAppointment | null>(null);
  const [rescheduleCandidate, setRescheduleCandidate] = useState<TableAppointment | null>(null);
  const [confirmNotes, setConfirmNotes] = useState("");
  const [completeNotes, setCompleteNotes] = useState("");
  const [completeResult, setCompleteResult] = useState("");
  const [completeNextStep, setCompleteNextStep] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [cancelNotes, setCancelNotes] = useState("");
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleStartTime, setRescheduleStartTime] = useState("");
  const [rescheduleEndTime, setRescheduleEndTime] = useState("");
  const [rescheduleAssignedUserId, setRescheduleAssignedUserId] = useState("");
  const [rescheduleNotes, setRescheduleNotes] = useState("");
  const [rescheduleNextStep, setRescheduleNextStep] = useState("");

  const { data: raw, isLoading } = useAppointments({
    currentPage,
    itemsPerPage,
    status: statusFilter,
    customerId: customerFilter,
    venueId: venueFilter,
    assignedToUserId: assignedUserFilter,
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
  const { data: usersResponse } = useUsers({
    currentPage: 1,
    itemsPerPage: 200,
    searchQuery: "",
  });

  const adapted = toTableAppointments(raw);
  const appointments = adapted.data.appointments;
  const totalItems = adapted.total;
  const totalPages = adapted.totalPages;
  const rowNumberStart = (currentPage - 1) * itemsPerPage + 1;
  const customers = useMemo(
    () => customersResponse?.data ?? [],
    [customersResponse?.data],
  );
  const venues = useMemo(() => venuesResponse?.data ?? [], [venuesResponse?.data]);
  const users = useMemo(() => usersResponse?.data ?? [], [usersResponse?.data]);
  const venueFilterOptions = useMemo(() => {
    const options = new Map<string, { id: string; name: string }>();

    venues.forEach((venue) => {
      options.set(String(venue.id), {
        id: String(venue.id),
        name: venue.name,
      });
    });

    customers.forEach((customer) => {
      const venueId = customer.venue?.id ?? customer.venueId;
      const venueName =
        customer.venue?.name ?? customer.venueNameSnapshot?.trim() ?? "";

      if (!venueId || !venueName || options.has(String(venueId))) {
        return;
      }

      options.set(String(venueId), {
        id: String(venueId),
        name: venueName,
      });
    });

    return Array.from(options.values()).sort((left, right) =>
      left.name.localeCompare(right.name),
    );
  }, [customers, venues]);
  const filteredCustomerOptions = useMemo(
    () =>
      customers.filter((customer) =>
        customer.fullName
          .toLowerCase()
          .includes(customerSearch.trim().toLowerCase()),
      ),
    [customerSearch, customers],
  );
  const filteredVenueOptions = useMemo(
    () =>
      venueFilterOptions.filter((venue) =>
        venue.name.toLowerCase().includes(venueSearch.trim().toLowerCase()),
      ),
    [venueFilterOptions, venueSearch],
  );
  const filteredUserOptions = useMemo(
    () =>
      users.filter((user) =>
        user.fullName.toLowerCase().includes(userSearch.trim().toLowerCase()),
      ),
    [userSearch, users],
  );

  const deleteMutation = useDeleteAppointment();
  const confirmMutation = useConfirmAppointment();
  const completeMutation = useCompleteAppointment();
  const cancelMutation = useCancelAppointment();
  const rescheduleMutation = useRescheduleAppointment();
  const activeFiltersCount = [
    statusFilter !== "all",
    Boolean(customerFilter),
    Boolean(venueFilter),
    Boolean(assignedUserFilter),
    Boolean(dateFrom),
    Boolean(dateTo),
  ].filter(Boolean).length;

  const resetFilters = () => {
    setStatusFilter("all");
    setCustomerFilter("");
    setVenueFilter("");
    setAssignedUserFilter("");
    setDateFrom("");
    setDateTo("");
    setCurrentPage(1);
  };

  const columns = useAppointmentsColumns({
    onDelete: setDeleteCandidate,
    onConfirm: (appointment) => {
      setConfirmCandidate(appointment);
      setConfirmNotes("");
    },
    onComplete: (appointment) => {
      setCompleteCandidate(appointment);
      setCompleteNotes("");
      setCompleteResult("");
      setCompleteNextStep("");
    },
    onCancel: (appointment) => {
      setCancelCandidate(appointment);
      setCancelReason("");
      setCancelNotes("");
    },
    onReschedule: (appointment) => {
      setRescheduleCandidate(appointment);
      setRescheduleDate(appointment.appointmentDate);
      setRescheduleStartTime(appointment.appointmentStartTime);
      setRescheduleEndTime(appointment.appointmentEndTime || "");
      setRescheduleAssignedUserId(
        appointment.assignedToUserId ? String(appointment.assignedToUserId) : "",
      );
      setRescheduleNotes(appointment.notes || "");
      setRescheduleNextStep(appointment.nextStep || "");
    },
    editPermission: "appointments.update",
    deletePermission: "appointments.delete",
  });

  return (
    <ProtectedComponent permission="appointments.read">
      <div className="min-h-screen space-y-4 bg-background p-4 text-foreground">
        <CompactHeader
          icon={<CalendarClock className="h-5 w-5 text-primary" />}
          title={t("appointments.title", { defaultValue: "Appointments" })}
          totalText={
            <>
              {totalItems}{" "}
              {t("appointments.totalAppointments", {
                defaultValue: "total appointments",
              })}
            </>
          }
          right={
            <ProtectedComponent permission="appointments.create">
              <Button
                size="sm"
                className="h-auto px-3 py-2 text-xs"
                onClick={() => navigate("/appointments/create")}
              >
                <Plus className="h-3.5 w-3.5" />
                {t("appointments.create", { defaultValue: "Create Appointment" })}
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
                    {t("appointments.filtersHint", {
                      defaultValue:
                        "Refine the appointment list by status, customer, venue, owner, and date.",
                    })}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 md:justify-end">
                  <span className="rounded-full border border-[var(--lux-row-border)] bg-[var(--lux-control-hover)] px-2.5 py-1 text-[11px] font-semibold text-[var(--lux-text)]">
                    {t("appointments.activeFiltersCount", {
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
                    {t("appointments.clearFilters", {
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
                      ? t("appointments.hideFilters", { defaultValue: "Hide Filters" })
                      : t("appointments.showFilters", { defaultValue: "Show Filters" })}
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
                    label={t(`appointments.status.${statusFilter}`, {
                      defaultValue: statusFilter,
                    })}
                  />
                ) : null}
                {customerFilter ? (
                  <FilterPill
                    label={
                      customers.find((customer) => String(customer.id) === customerFilter)
                        ?.fullName || customerFilter
                    }
                  />
                ) : null}
                {venueFilter ? (
                  <FilterPill
                    label={
                      venueFilterOptions.find((venue) => venue.id === venueFilter)
                        ?.name || venueFilter
                    }
                  />
                ) : null}
                {assignedUserFilter ? (
                  <FilterPill
                    label={
                      users.find((user) => String(user.id) === assignedUserFilter)
                        ?.fullName || assignedUserFilter
                    }
                  />
                ) : null}
                {dateFrom ? (
                  <FilterPill
                    label={`${t("appointments.dateFrom", {
                      defaultValue: "Date From",
                    })}: ${dateFrom}`}
                  />
                ) : null}
                {dateTo ? (
                  <FilterPill
                    label={`${t("appointments.dateTo", {
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
                      title={t("appointments.primaryFilters", {
                        defaultValue: "Primary Filters",
                      })}
                      description={t("appointments.primaryFiltersHint", {
                        defaultValue:
                          "Use the main operational filters to narrow the list quickly.",
                      })}
                    />
                    <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-2">
                      <FilterField
                        label={t("appointments.statusLabel", {
                          defaultValue: "Status",
                        })}
                      >
                        <select
                          className={filterFieldClassName}
                          style={fieldStyle}
                          value={statusFilter}
                          onChange={(event) => {
                            setStatusFilter(
                              event.target.value as "all" | TableAppointment["status"],
                            );
                            setCurrentPage(1);
                          }}
                        >
                          <option value="all">
                            {t("appointments.allStatuses", {
                              defaultValue: "All Statuses",
                            })}
                          </option>
                          {APPOINTMENT_STATUS_OPTIONS.map((status) => (
                            <option key={status.value} value={status.value}>
                              {t(`appointments.status.${status.value}`, {
                                defaultValue: status.label,
                              })}
                            </option>
                          ))}
                        </select>
                      </FilterField>

                      <FilterField
                        label={t("appointments.customer", {
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
                          placeholder={t("appointments.allCustomers", {
                            defaultValue: "All Customers",
                          })}
                          searchPlaceholder={t("appointments.searchCustomer", {
                            defaultValue: isArabic
                              ? "ابحث عن عميل محتمل..."
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
                        label={t("common.venue", {
                          defaultValue: "Venue",
                        })}
                      >
                        <SearchableFilterSelect
                          value={venueFilter}
                          onValueChange={(value) => {
                            setVenueFilter(value);
                            setCurrentPage(1);
                          }}
                          nativeOptions={venueFilterOptions}
                          onSearch={setVenueSearch}
                          placeholder={t("appointments.allVenues", {
                            defaultValue: "All Venues",
                          })}
                          searchPlaceholder={t("appointments.searchVenue", {
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
                                value={venue.id}
                              >
                                {venue.name}
                              </SearchableSelectItem>
                            ))
                          )}
                        </SearchableFilterSelect>
                      </FilterField>

                      <FilterField
                        label={t("appointments.assignedTo", {
                          defaultValue: "Assigned To",
                        })}
                      >
                        <SearchableFilterSelect
                          value={assignedUserFilter}
                          onValueChange={(value) => {
                            setAssignedUserFilter(value);
                            setCurrentPage(1);
                          }}
                          onSearch={setUserSearch}
                          placeholder={t("appointments.allUsers", {
                            defaultValue: "All Users",
                          })}
                          searchPlaceholder={t("appointments.searchUsers", {
                            defaultValue: isArabic
                              ? "ابحث عن مستخدم..."
                              : "Search users...",
                          })}
                          emptyMessage={t("common.noResultsTitle", {
                            defaultValue: isArabic
                              ? "لا توجد نتائج"
                              : "No results found",
                          })}
                        >
                          {filteredUserOptions.length === 0 ? (
                            <SearchableSelectEmpty
                              message={t("common.noResultsTitle", {
                                defaultValue: isArabic
                                  ? "لا توجد نتائج"
                                  : "No results found",
                              })}
                            />
                          ) : (
                            filteredUserOptions.map((user) => (
                              <SearchableSelectItem
                                key={user.id}
                                value={String(user.id)}
                              >
                                {user.fullName}
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
                      title={t("appointments.dateFilters", {
                        defaultValue: "Date Range",
                      })}
                      description={t("appointments.dateFiltersHint", {
                        defaultValue:
                          "Limit the list to appointments within a specific time window.",
                      })}
                    />
                    <div className="grid grid-cols-1 gap-2.5">
                      <FilterField
                        label={t("appointments.dateFrom", {
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
                        label={t("appointments.dateTo", {
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
            title={t("appointments.listTitle", { defaultValue: "Appointments List" })}
            totalItems={totalItems}
            currentCount={appointments.length}
            entityName={t("appointments.title", { defaultValue: "Appointments" })}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setItemsPerPage}
            setCurrentPage={setCurrentPage}
          />
          <div className="overflow-hidden">
            <DataTable
              columns={columns}
              data={appointments}
              rowNumberStart={rowNumberStart}
              enableRowNumbers
              fileName="appointments"
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
          title={t("appointments.deleteTitle", { defaultValue: "Delete Appointment" })}
          message={t("appointments.deleteMessage", {
            defaultValue: "Are you sure you want to delete this appointment?",
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

        {renderSimpleDialog({
          t,
          open: confirmCandidate !== null,
          onOpenChange: (open) => !open && setConfirmCandidate(null),
          title: t("appointments.confirmTitle", { defaultValue: "Confirm Appointment" }),
          description: t("appointments.confirmDescription", {
            defaultValue: "Add an optional note before confirming this appointment.",
          }),
          value: confirmNotes,
          onChange: setConfirmNotes,
          onConfirm: () =>
            confirmCandidate &&
            confirmMutation.mutate(
              {
                id: confirmCandidate.id,
                values: { notes: confirmNotes },
              },
              { onSuccess: () => setConfirmCandidate(null) },
            ),
          isPending: confirmMutation.isPending,
          confirmLabel: t("appointments.confirm", { defaultValue: "Confirm" }),
        })}

        <Dialog
          open={completeCandidate !== null}
          onOpenChange={(open) => !open && setCompleteCandidate(null)}
        >
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>
                {t("appointments.completeTitle", { defaultValue: "Complete Appointment" })}
              </DialogTitle>
              <DialogDescription>
                {t("appointments.completeDescription", {
                  defaultValue: "Capture the outcome, notes, and next step for this appointment.",
                })}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input value={completeResult} onChange={(e) => setCompleteResult(e.target.value)} placeholder={t("appointments.resultPlaceholder", { defaultValue: "Meeting result" })} />
              <Input value={completeNextStep} onChange={(e) => setCompleteNextStep(e.target.value)} placeholder={t("appointments.nextStepPlaceholder", { defaultValue: "Next step" })} />
              <textarea className={textareaClassName} style={fieldStyle} value={completeNotes} onChange={(e) => setCompleteNotes(e.target.value)} placeholder={t("appointments.notesPlaceholder", { defaultValue: "Notes..." })} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCompleteCandidate(null)} disabled={completeMutation.isPending}>
                {t("common.cancel", { defaultValue: "Cancel" })}
              </Button>
              <Button
                onClick={() =>
                  completeCandidate &&
                  completeMutation.mutate(
                    {
                      id: completeCandidate.id,
                      values: {
                        result: completeResult,
                        notes: completeNotes,
                        nextStep: completeNextStep,
                      },
                    },
                    { onSuccess: () => setCompleteCandidate(null) },
                  )
                }
                disabled={completeMutation.isPending}
              >
                {completeMutation.isPending
                  ? t("common.processing", { defaultValue: "Processing..." })
                  : t("appointments.complete", { defaultValue: "Complete" })}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={cancelCandidate !== null}
          onOpenChange={(open) => !open && setCancelCandidate(null)}
        >
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>
                {t("appointments.cancelTitle", { defaultValue: "Cancel Appointment" })}
              </DialogTitle>
              <DialogDescription>
                {t("appointments.cancelDescription", {
                  defaultValue: "Add a reason and optional note for the cancellation.",
                })}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder={t("appointments.cancelReasonPlaceholder", { defaultValue: "Cancellation reason" })} />
              <textarea className={textareaClassName} style={fieldStyle} value={cancelNotes} onChange={(e) => setCancelNotes(e.target.value)} placeholder={t("appointments.notesPlaceholder", { defaultValue: "Notes..." })} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCancelCandidate(null)} disabled={cancelMutation.isPending}>
                {t("common.cancel", { defaultValue: "Cancel" })}
              </Button>
              <Button
                onClick={() =>
                  cancelCandidate &&
                  cancelMutation.mutate(
                    {
                      id: cancelCandidate.id,
                      values: {
                        reason: cancelReason,
                        notes: cancelNotes,
                      },
                    },
                    { onSuccess: () => setCancelCandidate(null) },
                  )
                }
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending
                  ? t("common.processing", { defaultValue: "Processing..." })
                  : t("appointments.cancelAction", { defaultValue: "Cancel Appointment" })}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={rescheduleCandidate !== null}
          onOpenChange={(open) => !open && setRescheduleCandidate(null)}
        >
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>
                {t("appointments.rescheduleTitle", { defaultValue: "Reschedule Appointment" })}
              </DialogTitle>
              <DialogDescription>
                {t("appointments.rescheduleDescription", {
                  defaultValue: "Update the appointment timing and any follow-up instructions.",
                })}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} />
              <Input type="time" value={rescheduleStartTime} onChange={(e) => setRescheduleStartTime(e.target.value)} />
              <Input type="time" value={rescheduleEndTime} onChange={(e) => setRescheduleEndTime(e.target.value)} />
              <select className={fieldClassName} style={fieldStyle} value={rescheduleAssignedUserId} onChange={(e) => setRescheduleAssignedUserId(e.target.value)}>
                <option value="">{t("appointments.unassigned", { defaultValue: "Unassigned" })}</option>
                {users.map((user) => (
                  <option key={user.id} value={String(user.id)}>
                    {user.fullName}
                  </option>
                ))}
              </select>
              <Input className="md:col-span-2" value={rescheduleNextStep} onChange={(e) => setRescheduleNextStep(e.target.value)} placeholder={t("appointments.nextStepPlaceholder", { defaultValue: "Next step" })} />
              <textarea className={`${textareaClassName} md:col-span-2`} style={fieldStyle} value={rescheduleNotes} onChange={(e) => setRescheduleNotes(e.target.value)} placeholder={t("appointments.notesPlaceholder", { defaultValue: "Notes..." })} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRescheduleCandidate(null)} disabled={rescheduleMutation.isPending}>
                {t("common.cancel", { defaultValue: "Cancel" })}
              </Button>
              <Button
                onClick={() =>
                  rescheduleCandidate &&
                  rescheduleMutation.mutateReschedule(
                    {
                      id: rescheduleCandidate.id,
                      values: {
                        appointmentDate: rescheduleDate,
                        appointmentStartTime: rescheduleStartTime,
                        appointmentEndTime: rescheduleEndTime,
                        assignedToUserId: rescheduleAssignedUserId,
                        notes: rescheduleNotes,
                        nextStep: rescheduleNextStep,
                      },
                    },
                    { onSuccess: () => setRescheduleCandidate(null) },
                  )
                }
                disabled={rescheduleMutation.isPending}
              >
                {rescheduleMutation.isPending
                  ? t("common.processing", { defaultValue: "Processing..." })
                  : t("appointments.reschedule", { defaultValue: "Reschedule" })}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedComponent>
  );
};

function renderSimpleDialog({
  t,
  open,
  onOpenChange,
  title,
  description,
  value,
  onChange,
  onConfirm,
  isPending,
  confirmLabel,
}: {
  t: (key: string, options?: Record<string, unknown>) => string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
  onConfirm: () => void;
  isPending: boolean;
  confirmLabel: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <textarea
          className={textareaClassName}
          style={fieldStyle}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={t("appointments.notesPlaceholder", {
            defaultValue: "Notes...",
          })}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {t("common.cancel", { defaultValue: "Cancel" })}
          </Button>
          <Button onClick={onConfirm} disabled={isPending}>
            {isPending
              ? t("common.processing", { defaultValue: "Processing..." })
              : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
  nativeOptions,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  children,
}: {
  value: string;
  onValueChange: (value: string) => void;
  onSearch: (value: string) => void;
  nativeOptions?: Array<{ id: string; name: string }>;
  placeholder: string;
  searchPlaceholder: string;
  emptyMessage: string;
  children: React.ReactNode;
}) {
  if (nativeOptions) {
    return (
      <select
        className={filterFieldClassName}
        style={fieldStyle}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
      >
        <option value="">{placeholder}</option>
        {nativeOptions.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    );
  }

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

export default AppointmentsPage;
