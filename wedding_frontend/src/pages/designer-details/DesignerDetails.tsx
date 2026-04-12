import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import {
  CalendarRange,
  ClipboardList,
  Handshake,
  PackageOpen,
  PenSquare,
  Plus,
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
import type { EventCalendarRecord } from "@/pages/events/types";
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
import { DesignerCustomerDetailsPanel } from "./_components/DesignerCustomerDetailsPanel";

type WorkspaceTabValue =
  | "client-details"
  | "overview"
  | "services"
  | "vendors"
  | "quotations"
  | "contracts"
  | "execution";

const WORKSPACE_TAB_VALUES: WorkspaceTabValue[] = [
  "client-details",
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

type DesignerEventWorkspaceProps = {
  eventId: string;
  availableEvents: EventCalendarRecord[];
  eventsLoading: boolean;
  onEventChange: (value: string) => void;
};

function DesignerEventWorkspace({
  eventId,
  availableEvents,
  eventsLoading,
  onEventChange,
}: DesignerEventWorkspaceProps) {
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
    : "client-details";
  const eventSelector = (
    <div className="w-full sm:max-w-[320px]">
      <Select
        value={eventId}
        onValueChange={onEventChange}
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
          {availableEvents.map((eventOption) => (
            <SelectItem
              key={eventOption.id}
              value={String(eventOption.id)}
              className={cn(isRtl ? "text-right" : "text-left")}
            >
              <span dir="auto" className="block w-full">
                {getEventDisplayTitle(eventOption)}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

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
      value: "client-details",
      label:
        i18n.language === "ar"
          ? "تفاصيل العميل"
          : "Client Details",
    },
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

    if (value === "client-details") {
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
      <Tabs
        className="space-y-0"
        value={activeTab}
        onValueChange={(value) => {
          if (isWorkspaceTabValue(value)) {
            setActiveTab(value);
          }
        }}
      >
        <SectionCard className="overflow-hidden border border-[var(--lux-row-border)] p-0">
          <div
            className="px-5 pb-4 pt-5 sm:px-8 sm:pb-5 sm:pt-6"
            style={{
              background:
                activeTab === "client-details"
                  ? "linear-gradient(90deg, color-mix(in srgb, var(--lux-panel-surface) 96%, transparent), color-mix(in srgb, var(--lux-gold) 12%, transparent))"
                  : "transparent",
            }}
          >
            {activeTab === "client-details" ? (
              <div className="relative space-y-4">
                <div
                  className={cn(
                    "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
                    isRtl ? "sm:flex-row-reverse" : "sm:flex-row",
                  )}
                >
                  {eventSelector}

                  <div
                    className={cn(
                      "flex flex-wrap gap-2",
                      isRtl ? "justify-end" : "justify-start",
                    )}
                  >
                    <span className="rounded-full border border-[var(--lux-gold-border)] bg-[var(--lux-control-hover)] px-3 py-1 text-xs font-semibold text-[var(--lux-gold)]">
                      {i18n.language === "ar"
                        ? `${vendorLinks.length} مورد`
                        : `${vendorLinks.length} Vendors`}
                    </span>
                    <span className="rounded-full border border-[var(--lux-gold-border)] bg-[var(--lux-control-hover)] px-3 py-1 text-xs font-semibold text-[var(--lux-gold)]">
                      {i18n.language === "ar"
                        ? `${serviceItems.length} خدمة`
                        : `${serviceItems.length} Services`}
                    </span>
                  </div>
                </div>

                <div className="mx-auto flex max-w-3xl flex-col items-center gap-2 text-center">
                  <h3 className="text-2xl font-semibold text-[var(--lux-gold)] sm:text-3xl">
                    {i18n.language === "ar"
                      ? "تفاصيل العميل"
                      : "Client Details"}
                  </h3>
                  <p className="max-w-2xl text-sm leading-6 text-[var(--lux-text-secondary)] sm:text-[15px]">
                    {i18n.language === "ar"
                      ? "حدّد الخدمات والشركات المطلوبة للحدث ثم احفظها أو أنشئ منها عرض السعر أو العقد."
                      : "Select the required services and companies for the event, then save them or create the quotation or contract."}
                  </p>
                </div>
              </div>
            ) : (
              <div
                className={cn(
                  "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between",
                  isRtl ? "text-right" : "text-left",
                )}
              >
                <div>
                  <h3 className="text-lg font-semibold text-[var(--lux-heading)] sm:text-xl">
                    {t("designerDetails.currentEventBadge")}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--lux-text-secondary)]">
                    {t("designerDetails.shortcutsDescription")}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {eventSelector}
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
            )}
          </div>

          <div className="border-y border-[var(--lux-row-border)] px-2 sm:px-4">
            <TabsList
              className={cn(
                "h-auto w-full justify-start gap-1 rounded-none border-0 bg-transparent p-0 shadow-none",
                isRtl ? "flex-row-reverse" : "flex-row",
              )}
            >
              {workspaceTabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={cn(
                    "min-h-[52px] flex-1 rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-semibold data-[state=active]:border-[var(--lux-gold)] data-[state=active]:bg-transparent data-[state=active]:text-[var(--lux-gold)] data-[state=active]:shadow-none sm:flex-none",
                    isRtl ? "text-right" : "text-left",
                  )}
                >
                  <span className="truncate">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <div className="px-4 pb-5 pt-5 sm:px-6 sm:pb-6">
            <TabsContent value="overview" className="mt-0">
              <EventOverviewPanel eventId={eventId} />
            </TabsContent>

            <TabsContent value="client-details" className="mt-0">
              <DesignerCustomerDetailsPanel
                eventId={eventId}
                serviceItems={serviceItems}
                vendorLinks={vendorLinks}
                latestQuotation={latestQuotation as Quotation | null}
              />
            </TabsContent>

            <TabsContent value="services" className="mt-0">
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

            <TabsContent value="vendors" className="mt-0">
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

            <TabsContent value="quotations" className="mt-0">
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

            <TabsContent value="contracts" className="mt-0">
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

            <TabsContent value="execution" className="mt-0">
              <EventExecutionPanel eventId={eventId} />
            </TabsContent>
          </div>
        </SectionCard>
      </Tabs>

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
          {/* DesignerDetails hero intentionally disabled per updated page layout. */}

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
            <DesignerEventWorkspace
              eventId={effectiveSelectedEventId}
              availableEvents={availableEvents}
              eventsLoading={eventsLoading}
              onEventChange={handleEventChange}
            />
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
