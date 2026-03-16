import { useMemo, useState } from "react";
import { Plus, UserRoundSearch } from "lucide-react";
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
import { useConvertLeadToCustomer } from "@/hooks/leads/useConvertLeadToCustomer";
import { useDeleteLead } from "@/hooks/leads/useDeleteLead";
import { useLeads } from "@/hooks/leads/useLeads";
import { useMarkLeadLost } from "@/hooks/leads/useMarkLeadLost";
import { useVenues } from "@/hooks/venues/useVenues";

import { LEAD_STATUS_OPTIONS, toTableLeads, type TableLead } from "./adapters";
import { useLeadsColumns } from "./_components/leadsColumns";

const textareaClassName =
  "min-h-[110px] w-full rounded-[22px] border px-4 py-3 text-sm text-[var(--lux-text)] placeholder:text-[var(--lux-text-muted)] outline-none transition-all focus:border-[var(--lux-gold-border)] focus:ring-2 focus:ring-[var(--lux-gold-glow)]";

const fieldClassName =
  "h-11 rounded-2xl border px-4 text-sm text-[var(--lux-text)] outline-none transition focus:border-[var(--lux-gold-border)]";

const fieldStyle = {
  background: "var(--lux-control-surface)",
  borderColor: "var(--lux-control-border)",
} as const;

const LeadsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
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

  const handleSearchSubmit = () => {
    setSearchQuery(searchTerm.trim());
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

        <SectionCard className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--lux-text-muted)]">
                {t("leads.statusLabel", { defaultValue: "Status" })}
              </span>
              <select
                className={fieldClassName}
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
                    {status.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--lux-text-muted)]">
                {t("common.venue", { defaultValue: "Venue" })}
              </span>
              <select
                className={fieldClassName}
                style={fieldStyle}
                value={venueFilter}
                onChange={(event) => {
                  setVenueFilter(event.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">
                  {t("leads.allVenues", { defaultValue: "All Venues" })}
                </option>
                {venues.map((venue) => (
                  <option key={venue.id} value={String(venue.id)}>
                    {venue.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--lux-text-muted)]">
                {t("leads.source", { defaultValue: "Source" })}
              </span>
              <Input
                value={sourceFilter}
                onChange={(event) => {
                  setSourceFilter(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder={t("leads.sourcePlaceholder", {
                  defaultValue: "Instagram, referral, walk-in...",
                })}
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--lux-text-muted)]">
                {t("leads.weddingDateFrom", {
                  defaultValue: "Wedding Date From",
                })}
              </span>
              <Input
                type="date"
                value={weddingDateFrom}
                onChange={(event) => {
                  setWeddingDateFrom(event.target.value);
                  setCurrentPage(1);
                }}
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--lux-text-muted)]">
                {t("leads.weddingDateTo", { defaultValue: "Wedding Date To" })}
              </span>
              <Input
                type="date"
                value={weddingDateTo}
                onChange={(event) => {
                  setWeddingDateTo(event.target.value);
                  setCurrentPage(1);
                }}
              />
            </label>
          </div>
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
