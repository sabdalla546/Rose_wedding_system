import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import {
  CalendarRange,
  ClipboardList,
  Handshake,
  Layers3,
  PackageOpen,
  PenSquare,
  Plus,
  Sparkles,
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { PageContainer } from "@/components/layout/page-container";
import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEventsCalendarView } from "@/hooks/events/useEventsCalendarView";
import { EventServicesChecklistDialog } from "@/pages/events/_components/EventServicesChecklistDialog";
import { EventStatusBadge } from "@/pages/events/_components/eventStatusBadge";
import {
  EventEmptyState,
  EventMetaChip,
} from "@/pages/events/_components/EventDetailsPrimitives";
import { EventWorkspaceSummary } from "@/pages/events/_components/EventWorkspaceSummary";
import {
  getEventDisplayTitle,
} from "@/pages/events/adapters";
import { getInitialEventsBusinessFilters } from "@/pages/events/event-query-params";
import {
  DeleteEventServiceConfirmDialog,
  DeleteEventVendorConfirmDialog,
  EventContractsPanel,
  EventEditDialog,
  EventExecutionPanel,
  EventOverviewPanel,
  EventQuotationsPanel,
  EventServiceEditorDialog,
  EventServicesPanel,
  EventVendorAssignmentDialog,
  EventVendorsPanel,
} from "@/features/events/components";
import { useEventEditDialog } from "@/features/events/hooks/useEventEditDialog";
import { useEventWorkspaceData } from "@/features/events/hooks/useEventWorkspaceData";
import { useEventWorkspaceDeleteFlows } from "@/features/events/hooks/useEventWorkspaceDeleteFlows";
import type { Contract } from "@/pages/contracts/types";
import type { Quotation } from "@/pages/quotations/types";
import type { EventServiceItem, Service } from "@/pages/services/types";
import type { EventVendorLink } from "@/pages/vendors/types";
import { cn } from "@/lib/utils";

type WorkspaceTabValue =
  | "overview"
  | "services"
  | "vendors"
  | "quotations"
  | "contracts"
  | "execution";

const WORKSPACE_TAB_VALUES: WorkspaceTabValue[] = [
  "overview",
  "services",
  "vendors",
  "quotations",
  "contracts",
  "execution",
];

function isWorkspaceTabValue(value: string | null): value is WorkspaceTabValue {
  return Boolean(
    value && WORKSPACE_TAB_VALUES.includes(value as WorkspaceTabValue),
  );
}

function DesignerEventWorkspace({ eventId }: { eventId: string }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === "ar" ? ar : enUS;
  const isRtl = i18n.dir() === "rtl";

  const {
    event,
    eventLoading,
    customers,
    venues,
    serviceItems,
    existingServiceIds,
    vendorLinks,
    quotations,
    quotationsLoading,
    quotationsLoadFailed,
    contracts,
    contractsLoading,
    contractsLoadFailed,
    latestQuotation,
    latestContract,
    readiness,
  } = useEventWorkspaceData(eventId);

  const [serviceEditorOpen, setServiceEditorOpen] = useState(false);
  const [serviceChecklistOpen, setServiceChecklistOpen] = useState(false);
  const [editingServiceItem, setEditingServiceItem] =
    useState<EventServiceItem | null>(null);
  const [selectedServiceForCreate, setSelectedServiceForCreate] =
    useState<Service | null>(null);
  const [vendorDialogOpen, setVendorDialogOpen] = useState(false);
  const [editingVendorLink, setEditingVendorLink] =
    useState<EventVendorLink | null>(null);
  const {
    deleteServiceCandidate,
    setDeleteServiceCandidate,
    deleteVendorCandidate,
    setDeleteVendorCandidate,
    confirmDeleteService,
    confirmDeleteVendor,
    deleteEventServiceMutation,
    deleteEventVendorMutation,
  } = useEventWorkspaceDeleteFlows(eventId);
  const {
    open: editEventDialogOpen,
    setOpen: setEditEventDialogOpen,
    form: editEventForm,
    setForm: setEditEventForm,
    error: editEventError,
    openDialog: handleOpenEditEventDialog,
    save: handleSaveEvent,
    updateEventMutation,
  } = useEventEditDialog({
    eventId,
    event,
    eventDateRequiredMessage: t("designerDetails.eventDateRequired"),
  });
  const requestedTab = searchParams.get("tab");
  const activeTab = isWorkspaceTabValue(requestedTab)
    ? requestedTab
    : "overview";

  useEffect(() => {
    if (!requestedTab) {
      return;
    }

    if (isWorkspaceTabValue(requestedTab)) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("tab");
    setSearchParams(nextParams, { replace: true });
  }, [requestedTab, searchParams, setSearchParams]);

  if (eventLoading) {
    return (
      <EventEmptyState
        title={t("designerDetails.loadingEventTitle")}
        description={t("designerDetails.loadingEventDescription")}
      />
    );
  }

  if (!event) {
    return (
      <EventEmptyState
        title={t("designerDetails.loadEventFailedTitle")}
        description={t("designerDetails.loadEventFailedDescription")}
      />
    );
  }

  const eventDateLabel = format(new Date(event.eventDate), "PPP", {
    locale: dateLocale,
  });
  const resolvedCustomerName =
    event.customer?.fullName || t("events.noCustomerSelected");
  const resolvedVenueName =
    event.venue?.name || event.venueNameSnapshot || t("events.noVenueSelected");
  const workspaceTabs: Array<{ value: WorkspaceTabValue; label: string }> = [
    {
      value: "overview",
      label: t("common.overview", { defaultValue: "Overview" }),
    },
    { value: "execution", label: t("events.executionTab") },

    { value: "contracts", label: t("events.contracts") },
    { value: "quotations", label: t("events.quotations") },
    { value: "services", label: t("events.services") },
    { value: "vendors", label: t("events.vendors") },
  ];

  const setActiveTab = (value: WorkspaceTabValue) => {
    const nextParams = new URLSearchParams(searchParams);

    if (value === "overview") {
      nextParams.delete("tab");
    } else {
      nextParams.set("tab", value);
    }

    setSearchParams(nextParams, { replace: true });
  };

  const handleStartAddService = () => {
    setEditingServiceItem(null);
    setSelectedServiceForCreate(null);
    setActiveTab("services");
    setServiceChecklistOpen(true);
  };

  const handleCreateQuotation = () => {
    navigate(`/quotations/create?mode=from-event&eventId=${eventId}`);
  };

  const handleCreateContract = () => {
    if (latestQuotation) {
      const params = new URLSearchParams({
        mode: "from-quotation",
        quotationId: String(latestQuotation.id),
        eventId,
      });

      navigate(`/contracts/create?${params.toString()}`);
      return;
    }

    navigate(`/contracts/create?eventId=${eventId}`);
  };

  return (
    <div className="space-y-6">
      <SectionCard
        className="overflow-hidden border border-[var(--lux-row-border)]"
        style={{
          background:
            "radial-gradient(circle at top right, color-mix(in srgb, var(--lux-gold) 12%, transparent), transparent 40%), linear-gradient(135deg, color-mix(in srgb, var(--lux-panel-surface) 90%, black), color-mix(in srgb, var(--lux-control-hover) 56%, transparent))",
        }}
      >
        <div
          className={cn(
            "flex flex-col gap-5 xl:items-start xl:justify-between",
            "xl:flex-row",
          )}
        >
          <div className={cn("space-y-4", isRtl ? "text-right" : "text-left")}>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--lux-gold-border)] bg-[var(--lux-control-hover)] px-4 py-2 text-xs font-semibold text-[var(--lux-gold)]">
              <CalendarRange className="h-4 w-4" />
              {t("designerDetails.currentEventBadge")}
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h2
                  dir="auto"
                  className="text-3xl font-semibold text-[var(--lux-heading)]"
                >
                  {getEventDisplayTitle(event)}
                </h2>
                <EventStatusBadge status={event.status} />
              </div>
              <p className="max-w-3xl text-sm leading-7 text-[var(--lux-text-secondary)]">
                {t("designerDetails.currentEventDescription")}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <EventMetaChip
                label={t("designerDetails.customerField")}
                value={resolvedCustomerName}
              />
              <EventMetaChip
                label={t("designerDetails.eventDateField")}
                value={eventDateLabel}
              />
              <EventMetaChip
                label={t("designerDetails.venueField")}
                value={resolvedVenueName}
              />
              {typeof event.guestCount === "number" ? (
                <EventMetaChip
                  label={t("designerDetails.guestCountField")}
                  value={event.guestCount}
                />
              ) : null}
            </div>
          </div>

          <div className="flex flex-col items-stretch gap-3 xl:min-w-[250px]">
            <ProtectedComponent permission="events.update">
              <Button onClick={handleOpenEditEventDialog}>
                <PenSquare className="h-4 w-4" />
                {t("designerDetails.editEvent")}
              </Button>
            </ProtectedComponent>
            <Button variant="outline" onClick={() => setActiveTab("execution")}>
              <ClipboardList className="h-4 w-4" />
              {t("designerDetails.trackExecution")}
            </Button>
          </div>
        </div>
      </SectionCard>

      <EventWorkspaceSummary
        t={t}
        dateLocale={dateLocale}
        servicesCount={serviceItems.length}
        vendorsCount={vendorLinks.length}
        latestQuotation={latestQuotation as Quotation | null}
        latestContract={latestContract as Contract | null}
        readiness={readiness}
        onAddService={handleStartAddService}
        onAssignVendor={() => {
          setEditingVendorLink(null);
          setVendorDialogOpen(true);
        }}
        onEditEvent={handleOpenEditEventDialog}
        onCreateQuotation={handleCreateQuotation}
        onCreateContract={handleCreateContract}
      />

      <Tabs
        className="space-y-5"
        value={activeTab}
        onValueChange={(value) => {
          if (isWorkspaceTabValue(value)) {
            setActiveTab(value);
          }
        }}
      >
        <SectionCard className="space-y-4 border border-[var(--lux-row-border)]">
          <div
            className={cn(
              "flex flex-col gap-3 lg:items-center lg:justify-between",
              "lg:flex-row-reverse",
            )}
          >
            <div className={cn(isRtl ? "text-right" : "text-left")}>
              <h3 className="text-lg font-semibold text-[var(--lux-heading)]">
                {t("designerDetails.currentEventBadge")}
              </h3>
              <p className="text-sm text-[var(--lux-text-secondary)]">
                {t("designerDetails.shortcutsDescription")}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline">
                <Link to="/settings/vendors">
                  <Handshake className="h-4 w-4" />
                  {t("designerDetails.openVendors")}
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/settings/services">
                  <PackageOpen className="h-4 w-4" />
                  {t("designerDetails.openServices")}
                </Link>
              </Button>
            </div>
          </div>

          <TabsList
            className={cn(
              "w-full gap-2 rounded-[22px] border border-[var(--lux-row-border)] bg-[var(--lux-control-surface)] p-2 shadow-none",
            )}
          >
            {workspaceTabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={cn(
                  "min-h-11 min-w-[110px] flex-1 rounded-[16px] border border-transparent px-4 py-2.5 text-sm font-semibold data-[state=active]:border-[var(--lux-gold-border)] data-[state=active]:bg-[color-mix(in_srgb,var(--lux-gold)_14%,var(--lux-panel-surface))] data-[state=active]:text-[var(--lux-heading)] data-[state=active]:shadow-none",
                  isRtl ? "text-right" : "text-left",
                )}
              >
                <span className="truncate">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </SectionCard>

        <TabsContent value="overview">
          <EventOverviewPanel eventId={eventId} />
        </TabsContent>

        <TabsContent value="services">
          <EventServicesPanel
            eventId={eventId}
            onAdd={handleStartAddService}
            onEdit={(serviceItem) => {
              setSelectedServiceForCreate(null);
              setEditingServiceItem(serviceItem);
              setServiceEditorOpen(true);
            }}
            onDelete={(serviceItem) => setDeleteServiceCandidate(serviceItem)}
          />
        </TabsContent>

        <TabsContent value="vendors">
          <EventVendorsPanel
            eventId={eventId}
            onAdd={() => {
              setEditingVendorLink(null);
              setVendorDialogOpen(true);
            }}
            onEdit={(vendorLink) => {
              setEditingVendorLink(vendorLink);
              setVendorDialogOpen(true);
            }}
            onDelete={(vendorLink) => setDeleteVendorCandidate(vendorLink)}
          />
        </TabsContent>

        <TabsContent value="quotations">
          <EventQuotationsPanel
            eventId={eventId}
            quotations={quotations}
            loading={quotationsLoading}
            error={quotationsLoadFailed}
            onCreateQuotation={handleCreateQuotation}
            onCreateQuotationFromEvent={handleCreateQuotation}
            onViewQuotation={(quotationId) =>
              navigate(`/quotations/${quotationId}`)
            }
          />
        </TabsContent>

        <TabsContent value="contracts">
          <EventContractsPanel
            eventId={eventId}
            contracts={contracts}
            loading={contractsLoading}
            error={contractsLoadFailed}
            onCreateContract={handleCreateContract}
            onCreateContractFromQuotation={handleCreateContract}
            onViewContract={(contractId) =>
              navigate(`/contracts/${contractId}`)
            }
          />
        </TabsContent>

        <TabsContent value="execution">
          <EventExecutionPanel eventId={eventId} />
        </TabsContent>
      </Tabs>

      {serviceEditorOpen ? (
        <EventServiceEditorDialog
          open={serviceEditorOpen}
          onOpenChange={(open) => {
            setServiceEditorOpen(open);
            if (!open) {
              setEditingServiceItem(null);
              setSelectedServiceForCreate(null);
            }
          }}
          eventId={Number(eventId)}
          defaultSortOrder={serviceItems.length}
          editingServiceItem={editingServiceItem}
          initialService={selectedServiceForCreate}
        />
      ) : null}

      {event ? (
        <EventServicesChecklistDialog
          open={serviceChecklistOpen}
          onOpenChange={setServiceChecklistOpen}
          eventId={event.id}
          existingServiceIds={existingServiceIds}
        />
      ) : null}

      {vendorDialogOpen ? (
        <EventVendorAssignmentDialog
          open={vendorDialogOpen}
          onOpenChange={(open) => {
            setVendorDialogOpen(open);
            if (!open) {
              setEditingVendorLink(null);
            }
          }}
          eventId={Number(eventId)}
          editingVendorLink={editingVendorLink}
        />
      ) : null}

      <DeleteEventServiceConfirmDialog
        open={Boolean(deleteServiceCandidate)}
        onOpenChange={(open) => !open && setDeleteServiceCandidate(null)}
        title={t("services.deleteEventItemTitle", {
          defaultValue: "Delete service item",
        })}
        message={t("services.deleteEventItemMessage", {
          defaultValue: "Are you sure you want to delete this service item?",
        })}
        confirmLabel={t("common.delete")}
        cancelLabel={t("designerDetails.cancel")}
        onConfirm={confirmDeleteService}
        isPending={deleteEventServiceMutation.isPending}
      />

      <DeleteEventVendorConfirmDialog
        open={Boolean(deleteVendorCandidate)}
        onOpenChange={(open) => !open && setDeleteVendorCandidate(null)}
        title={t("vendors.deleteEventVendorTitle", {
          defaultValue: "Delete linked vendor",
        })}
        message={t("vendors.deleteEventVendorMessage", {
          defaultValue:
            "This vendor will be unlinked from the event. Do you want to continue?",
        })}
        confirmLabel={t("common.delete")}
        cancelLabel={t("designerDetails.cancel")}
        onConfirm={confirmDeleteVendor}
        isPending={deleteEventVendorMutation.isPending}
      />

      <EventEditDialog
        open={editEventDialogOpen}
        onOpenChange={setEditEventDialogOpen}
        form={editEventForm}
        setForm={setEditEventForm}
        error={editEventError}
        customers={customers}
        venues={venues}
        onSave={handleSaveEvent}
        isPending={updateEventMutation.isPending}
        variant="designer"
        guestCountInputType="text"
        labels={{
          title: t("designerDetails.editDialogTitle"),
          description: t("designerDetails.editDialogDescription"),
          customer: t("designerDetails.customerField"),
          selectCustomer: t("events.selectCustomer"),
          noCustomerSelected: t("designerDetails.noCustomer"),
          eventDate: t("designerDetails.eventDateField"),
          venue: t("designerDetails.venueField"),
          selectVenue: t("events.selectVenue"),
          noVenueSelected: t("designerDetails.noVenue"),
          statusManagedByWorkflow: t("events.statusManagedByWorkflow", {
            defaultValue: "Status managed by workflow",
          }),
          statusManagedByWorkflowHint: t("events.statusManagedByWorkflowHint", {
            defaultValue:
              "Use the workflow action buttons on the event details page to change status safely.",
          }),
          titleField: t("designerDetails.eventTitleField"),
          guestCount: t("designerDetails.guestCountField"),
          groomName: t("designerDetails.groomNameField"),
          brideName: t("designerDetails.brideNameField"),
          notes: t("designerDetails.eventNotesField"),
          cancel: t("designerDetails.cancel"),
          submit: t("designerDetails.saveChanges"),
          processing: t("common.processing"),
        }}
      />
    </div>
  );
}

export default function DesignerDetailsPage() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  const [searchParams, setSearchParams] = useSearchParams();
  const eventFilters = useMemo(getInitialEventsBusinessFilters, []);

  const {
    items: availableEventsData,
    isLoading: eventsLoading,
    isError: eventsLoadFailed,
    refetch: refetchEvents,
  } = useEventsCalendarView(eventFilters);

  const availableEvents = useMemo(
    () =>
      [...availableEventsData].sort((left, right) => {
        const leftTime = new Date(left.eventDate).getTime();
        const rightTime = new Date(right.eventDate).getTime();

        if (leftTime !== rightTime) {
          return rightTime - leftTime;
        }

        return right.id - left.id;
      }),
    [availableEventsData],
  );
  const requestedEventId = searchParams.get("eventId");
  const effectiveSelectedEventId = availableEvents.find(
    (event) => String(event.id) === requestedEventId,
  )
    ? requestedEventId ?? ""
    : availableEvents[0]
      ? String(availableEvents[0].id)
      : "";

  useEffect(() => {
    if (
      !effectiveSelectedEventId ||
      requestedEventId === effectiveSelectedEventId
    ) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("eventId", effectiveSelectedEventId);
    setSearchParams(nextParams, { replace: true });
  }, [
    effectiveSelectedEventId,
    requestedEventId,
    searchParams,
    setSearchParams,
  ]);

  const handleEventChange = (value: string) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("eventId", value);
    setSearchParams(nextParams, { replace: true });
  };

  return (
    <ProtectedComponent
      anyOf={["events.read", "vendors.read", "services.read"]}
    >
      <PageContainer className="pb-4 pt-4 text-foreground">
        <div dir={i18n.dir()} className="mx-auto w-full max-w-7xl space-y-6">
          <SectionCard
            className="relative overflow-hidden border border-[var(--lux-row-border)]"
            style={{
              background:
                "radial-gradient(circle at top right, color-mix(in srgb, var(--lux-gold) 12%, transparent), transparent 42%), linear-gradient(135deg, color-mix(in srgb, var(--lux-panel-surface) 92%, black), color-mix(in srgb, var(--lux-control-hover) 52%, transparent))",
            }}
          >
            <div
              className={cn(
                "flex flex-col gap-5 lg:items-start lg:justify-between",
                "lg:flex-row",
              )}
            >
              <div
                className={cn(
                  "max-w-3xl space-y-4",
                  isRtl ? "text-right" : "text-left",
                )}
              >
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--lux-gold-border)] bg-[var(--lux-control-hover)] px-4 py-2 text-xs font-semibold text-[var(--lux-gold)]">
                  <Sparkles className="h-4 w-4" />
                  {t("designerDetails.title")}
                </div>
                <div className="space-y-3">
                  <h1 className="text-3xl font-semibold text-[var(--lux-heading)]">
                    {t("designerDetails.title")}
                  </h1>
                  <p className="max-w-2xl text-sm leading-7 text-[var(--lux-text-secondary)]">
                    {t("designerDetails.subtitle")}
                  </p>
                </div>
              </div>

              <div className="flex h-20 w-20 items-center justify-center rounded-[28px] border border-[var(--lux-gold-border)] bg-[color-mix(in_srgb,var(--lux-gold)_10%,transparent)] text-[var(--lux-gold)] shadow-[0_20px_60px_color-mix(in_srgb,var(--lux-gold)_18%,transparent)]">
                <Layers3 className="h-9 w-9" />
              </div>
            </div>
          </SectionCard>

          <SectionCard className="space-y-5">
            <div
              className={cn(
                "flex flex-col gap-3 xl:items-end xl:justify-between",
                "xl:flex-row",
              )}
            >
              <div
                className={cn("space-y-2", isRtl ? "text-right" : "text-left")}
              >
                <h2 className="text-xl font-semibold text-[var(--lux-heading)]">
                  {t("designerDetails.selectorTitle")}
                </h2>
                <p className="max-w-3xl text-sm leading-7 text-[var(--lux-text-secondary)]">
                  {t("designerDetails.selectorDescription")}
                </p>
              </div>

              <div className="w-full xl:max-w-md">
                <Select
                  value={effectiveSelectedEventId || undefined}
                  onValueChange={handleEventChange}
                  disabled={eventsLoading || availableEvents.length === 0}
                >
                  <SelectTrigger
                    dir={i18n.dir()}
                    className={cn(
                      "h-12",
                      isRtl
                        ? "text-right [&_span]:text-right"
                        : "text-left [&_span]:text-left",
                    )}
                  >
                    <SelectValue
                      placeholder={
                        eventsLoading
                          ? t("designerDetails.loadingEventsPlaceholder")
                          : t("designerDetails.selectEventPlaceholder")
                      }
                    />
                  </SelectTrigger>
                  <SelectContent dir={i18n.dir()}>
                    {availableEvents.map((event) => (
                      <SelectItem
                        key={event.id}
                        value={String(event.id)}
                        className={cn(isRtl ? "text-right" : "text-left")}
                      >
                        <span dir="auto" className="block w-full">
                          {getEventDisplayTitle(event)}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-[22px] border border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)] px-4 py-4">
                <p
                  className={cn(
                    "text-[11px] font-semibold text-[var(--lux-text-muted)]",
                    isRtl
                      ? "tracking-normal text-right"
                      : "uppercase tracking-[0.16em] text-left",
                  )}
                >
                  {t("designerDetails.capabilityEvent")}
                </p>
                <p className="mt-2 text-sm font-medium text-[var(--lux-text)]">
                  {t("designerDetails.capabilityEventDescription")}
                </p>
              </div>
              <div className="rounded-[22px] border border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)] px-4 py-4">
                <p
                  className={cn(
                    "text-[11px] font-semibold text-[var(--lux-text-muted)]",
                    isRtl
                      ? "tracking-normal text-right"
                      : "uppercase tracking-[0.16em] text-left",
                  )}
                >
                  {t("designerDetails.capabilityVendors")}
                </p>
                <p className="mt-2 text-sm font-medium text-[var(--lux-text)]">
                  {t("designerDetails.capabilityVendorsDescription")}
                </p>
              </div>
              <div className="rounded-[22px] border border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)] px-4 py-4">
                <p
                  className={cn(
                    "text-[11px] font-semibold text-[var(--lux-text-muted)]",
                    isRtl
                      ? "tracking-normal text-right"
                      : "uppercase tracking-[0.16em] text-left",
                  )}
                >
                  {t("designerDetails.capabilityServices")}
                </p>
                <p className="mt-2 text-sm font-medium text-[var(--lux-text)]">
                  {t("designerDetails.capabilityServicesDescription")}
                </p>
              </div>
            </div>
          </SectionCard>

          {eventsLoading ? (
            <EventEmptyState
              title={t("designerDetails.loadingEventsTitle")}
              description={t("designerDetails.loadingEventsDescription")}
            />
          ) : eventsLoadFailed ? (
            <EventEmptyState
              title={t("designerDetails.loadEventsFailedTitle", {
                defaultValue: "Unable to load events",
              })}
              description={t("designerDetails.loadEventsFailedDescription", {
                defaultValue:
                  "The event selector could not be loaded right now. Try again to refresh the list.",
              })}
              action={
                <Button type="button" onClick={() => void refetchEvents()}>
                  {t("common.retry", { defaultValue: "Retry" })}
                </Button>
              }
            />
          ) : availableEvents.length === 0 ? (
            <EventEmptyState
              title={t("designerDetails.noEventsTitle")}
              description={t("designerDetails.noEventsDescription")}
              action={
                <ProtectedComponent permission="events.read">
                  <Button asChild>
                    <Link to="/events">
                      <Plus className="h-4 w-4" />
                      {t("designerDetails.openEvents")}
                    </Link>
                  </Button>
                </ProtectedComponent>
              }
            />
          ) : effectiveSelectedEventId ? (
            <DesignerEventWorkspace eventId={effectiveSelectedEventId} />
          ) : (
            <EventEmptyState
              title={t("designerDetails.chooseEventTitle")}
              description={t("designerDetails.chooseEventDescription")}
            />
          )}
        </div>
      </PageContainer>
    </ProtectedComponent>
  );
}
