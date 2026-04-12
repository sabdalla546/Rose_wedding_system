/* eslint-disable react-hooks/use-memo */
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import {
  ArrowLeft,
  CalendarRange,
  ClipboardList,
  Handshake,
  PackageOpen,
  PenSquare,
  Plus,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { PageContainer } from "@/components/layout/page-container";
import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import { SectionCard } from "@/components/shared/section-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCreateContractFromQuotation } from "@/hooks/contracts/useContractMutations";
import { useEventsCalendarView } from "@/hooks/events/useEventsCalendarView";
import { useCreateQuotation } from "@/hooks/quotations/useQuotationMutations";
import { EventServicesChecklistDialog } from "@/pages/events/_components/EventServicesChecklistDialog";
import { EventStatusBadge } from "@/pages/events/_components/eventStatusBadge";
import {
  EventEmptyState,
  EventMetaChip,
} from "@/pages/events/_components/EventDetailsPrimitives";
import { EventWorkspaceSummary } from "@/pages/events/_components/EventWorkspaceSummary";
import { getEventDisplayTitle } from "@/pages/events/adapters";
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
import { ContractDetailsWorkspace } from "@/pages/contracts/_components/ContractDetailsWorkspace";
import { ContractFormWorkspace } from "@/pages/contracts/_components/ContractFormWorkspace";
import type { Contract } from "@/pages/contracts/types";
import { QuotationDetailsWorkspace } from "@/pages/quotations/_components/QuotationDetailsWorkspace";
import { QuotationFormWorkspace } from "@/pages/quotations/_components/QuotationFormWorkspace";
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

type WorkspaceSubview = "list" | "create" | "details";

function isWorkspaceSubview(value: string | null): value is WorkspaceSubview {
  return value === "list" || value === "create" || value === "details";
}

function DesignerInlineWorkspaceHeader({
  title,
  subtitle,
  backLabel,
  onBack,
}: {
  title: string;
  subtitle?: string;
  backLabel: string;
  onBack: () => void;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 rounded-[8px] border border-[var(--lux-row-border)] bg-[var(--lux-control-surface)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-[var(--lux-heading)] sm:text-lg">
          {title}
        </h3>
        {subtitle ? (
          <p className="text-sm text-[var(--lux-text-secondary)]">{subtitle}</p>
        ) : null}
      </div>

      <Button type="button" variant="outline" size="sm" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
        {backLabel}
      </Button>
    </div>
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
  const [quickQuotationDialogOpen, setQuickQuotationDialogOpen] =
    useState(false);
  const [quickQuotationForm, setQuickQuotationForm] = useState({
    issueDate: new Date().toISOString().slice(0, 10),
    validUntil: "",
    manualServicesTotal: "",
  });
  const [quickQuotationError, setQuickQuotationError] = useState("");
  const [quickContractDialogOpen, setQuickContractDialogOpen] = useState(false);
  const [quickContractForm, setQuickContractForm] = useState({
    signedDate: new Date().toISOString().slice(0, 10),
    eventDate: "",
  });
  const [quickContractError, setQuickContractError] = useState("");
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
  const quickQuotationMutation = useCreateQuotation({
    navigateOnSuccess: false,
    onSuccess: () => {
      setQuickQuotationDialogOpen(false);
      setQuickQuotationError("");
      setQuickQuotationForm({
        issueDate: new Date().toISOString().slice(0, 10),
        validUntil: "",
        manualServicesTotal: "",
      });
    },
  });
  const quickContractMutation = useCreateContractFromQuotation({
    navigateOnSuccess: false,
    onSuccess: () => {
      setQuickContractDialogOpen(false);
      setQuickContractError("");
      setQuickContractForm({
        signedDate: new Date().toISOString().slice(0, 10),
        eventDate: event?.eventDate ? String(event.eventDate).slice(0, 10) : "",
      });
    },
  });
  const requestedTab = searchParams.get("tab");
  const requestedView = searchParams.get("view");
  const requestedQuotationId = searchParams.get("quotationId");
  const requestedContractId = searchParams.get("contractId");
  const activeTab = isWorkspaceTabValue(requestedTab)
    ? requestedTab
    : "client-details";
  const activeSubview = isWorkspaceSubview(requestedView)
    ? requestedView
    : "list";
  const quotationSubview: WorkspaceSubview =
    activeTab === "quotations" &&
    activeSubview === "details" &&
    requestedQuotationId
      ? "details"
      : activeTab === "quotations" && activeSubview === "create"
        ? "create"
        : "list";
  const contractSubview: WorkspaceSubview =
    activeTab === "contracts" &&
    activeSubview === "details" &&
    requestedContractId
      ? "details"
      : activeTab === "contracts" && activeSubview === "create"
        ? "create"
        : "list";
  const selectedQuotationId =
    quotationSubview === "details" ? requestedQuotationId : null;
  const selectedContractId =
    contractSubview === "details" ? requestedContractId : null;
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
    nextParams.delete("view");
    nextParams.delete("quotationId");
    nextParams.delete("contractId");
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
      label: i18n.language === "ar" ? "تفاصيل العميل" : "Client Details",
    },

    /**
    *  {
      value: "overview",
      label: t("common.overview", { defaultValue: "Overview" }),
    },
    {
      value: "services",
      label: t("events.services", { defaultValue: "Services" }),
    },
    {
      value: "vendors",
      label: t("events.vendors", { defaultValue: "Vendors" }),
    },
    {
      value: "quotations",
      label: t("events.quotations", { defaultValue: "Quotations" }),
    },
    {
      value: "contracts",
      label: t("events.contracts", { defaultValue: "Contracts" }),
    },
    {
      value: "execution",
      label: t("events.executionTab", { defaultValue: "Execution" }),
    },
    */
  ];

  const updateWorkspaceSearch = (
    tab: WorkspaceTabValue,
    view: WorkspaceSubview = "list",
    extras?: Record<string, string | null | undefined>,
  ) => {
    const nextParams = new URLSearchParams(searchParams);

    if (tab === "client-details") {
      nextParams.delete("tab");
    } else {
      nextParams.set("tab", tab);
    }

    if (view === "list") {
      nextParams.delete("view");
    } else {
      nextParams.set("view", view);
    }

    nextParams.delete("quotationId");
    nextParams.delete("contractId");

    if (extras) {
      Object.entries(extras).forEach(([key, value]) => {
        if (value) {
          nextParams.set(key, value);
        } else {
          nextParams.delete(key);
        }
      });
    }

    setSearchParams(nextParams, { replace: true });
  };

  const setActiveTab = (value: WorkspaceTabValue) => {
    updateWorkspaceSearch(value, "list");
  };

  const openQuotationList = () => updateWorkspaceSearch("quotations", "list");
  const openQuotationCreate = () =>
    updateWorkspaceSearch("quotations", "create");
  const openQuotationDetails = (quotationId: number | string) =>
    updateWorkspaceSearch("quotations", "details", {
      quotationId: String(quotationId),
    });

  const openContractList = () => updateWorkspaceSearch("contracts", "list");
  const openContractCreate = (options?: { quotationId?: string }) =>
    updateWorkspaceSearch("contracts", "create", {
      quotationId: options?.quotationId ?? String(latestQuotation?.id ?? ""),
    });
  const openContractDetails = (contractId: number | string) =>
    updateWorkspaceSearch("contracts", "details", {
      contractId: String(contractId),
    });

  const handleStartAddService = () => {
    setEditingServiceItem(null);
    setSelectedServiceForCreate(null);
    setActiveTab("services");
    setServiceChecklistOpen(true);
  };

  const handleCreateQuotation = () => openQuotationCreate();
  const handleOpenQuickQuotationDialog = () => {
    setQuickQuotationError("");
    setQuickQuotationForm({
      issueDate: new Date().toISOString().slice(0, 10),
      validUntil: "",
      manualServicesTotal: "",
    });
    setQuickQuotationDialogOpen(true);
  };
  const handleOpenQuickContractDialog = () => {
    setQuickContractError("");
    setQuickContractForm({
      signedDate: new Date().toISOString().slice(0, 10),
      eventDate: event?.eventDate ? String(event.eventDate).slice(0, 10) : "",
    });
    setQuickContractDialogOpen(true);
  };

  const handleCreateQuickQuotation = () => {
    if (!quickQuotationForm.issueDate.trim()) {
      setQuickQuotationError("Issue date is required.");
      return;
    }

    if (!quickQuotationForm.validUntil.trim()) {
      setQuickQuotationError("Valid until is required.");
      return;
    }

    const manualServicesTotal = Number(quickQuotationForm.manualServicesTotal);

    if (!Number.isFinite(manualServicesTotal) || manualServicesTotal <= 0) {
      setQuickQuotationError(
        "Total services amount must be greater than zero.",
      );
      return;
    }

    setQuickQuotationError("");
    quickQuotationMutation.mutate({
      eventId,
      issueDate: quickQuotationForm.issueDate,
      validUntil: quickQuotationForm.validUntil,
      discountAmount: "0",
      status: "draft",
      items: [
        {
          itemType: "service",
          itemName: "Total Services",
          category: "service_summary",
          quantity: "1",
          unitPrice: manualServicesTotal.toFixed(3),
          totalPrice: manualServicesTotal.toFixed(3),
          notes: "",
          sortOrder: "0",
        },
      ],
    });
  };
  const handleCreateQuickContract = () => {
    if (!latestQuotation) {
      setQuickContractError("يجب إنشاء عرض سعر أولاً.");
      return;
    }

    if (!quickContractForm.signedDate.trim()) {
      setQuickContractError("Signed date is required.");
      return;
    }

    setQuickContractError("");
    quickContractMutation.mutate({
      quotationId: String(latestQuotation.id),
      signedDate: quickContractForm.signedDate,
      eventDate: quickContractForm.eventDate,
      status: "draft",
    });
  };

  const handleCreateContract = () =>
    openContractCreate({
      quotationId: latestQuotation ? String(latestQuotation.id) : undefined,
    });

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
                onCreateQuotation={() => handleOpenQuickQuotationDialog()}
                onCreateContract={() => handleOpenQuickContractDialog()}
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
                onDelete={(serviceItem) =>
                  setDeleteServiceCandidate(serviceItem)
                }
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
              {quotationSubview === "list" ? (
                <EventQuotationsPanel
                  eventId={eventId}
                  quotations={quotations}
                  loading={quotationsLoading}
                  error={quotationsLoadFailed}
                  onCreateQuotation={handleCreateQuotation}
                  onCreateQuotationFromEvent={handleCreateQuotation}
                  onViewQuotation={openQuotationDetails}
                />
              ) : quotationSubview === "create" ? (
                <div>
                  <DesignerInlineWorkspaceHeader
                    title={t("quotations.createTitle", {
                      defaultValue: "Create Quotation",
                    })}
                    subtitle={t("quotations.createDescription", {
                      defaultValue:
                        "Create one quotation with mixed service and vendor items, or build it directly from event selections.",
                    })}
                    backLabel={t("quotations.backToQuotations", {
                      defaultValue: "Back to Quotations",
                    })}
                    onBack={openQuotationList}
                  />
                  <QuotationFormWorkspace
                    initialMode="from_event"
                    initialEventId={eventId}
                    onCancel={openQuotationList}
                    onOpenQuotation={openQuotationDetails}
                  />
                </div>
              ) : selectedQuotationId ? (
                <div>
                  <DesignerInlineWorkspaceHeader
                    title={t("quotations.detailsTitle", {
                      defaultValue: "Quotation Details",
                    })}
                    subtitle={t("quotations.workflowStage", {
                      defaultValue: "Commercial Snapshot",
                    })}
                    backLabel={t("quotations.backToQuotations", {
                      defaultValue: "Back to Quotations",
                    })}
                    onBack={openQuotationList}
                  />
                  <QuotationDetailsWorkspace
                    quotationId={selectedQuotationId}
                    onOpenContractCreate={(quotationId) =>
                      openContractCreate({ quotationId: String(quotationId) })
                    }
                    onOpenContract={openContractDetails}
                    onOpenEvent={() => setActiveTab("client-details")}
                    onDeleteSuccess={openQuotationList}
                  />
                </div>
              ) : null}
            </TabsContent>

            <TabsContent value="contracts" className="mt-0">
              {contractSubview === "list" ? (
                <EventContractsPanel
                  eventId={eventId}
                  contracts={contracts}
                  loading={contractsLoading}
                  error={contractsLoadFailed}
                  onCreateContract={handleCreateContract}
                  onCreateContractFromQuotation={handleCreateContract}
                  onViewContract={openContractDetails}
                />
              ) : contractSubview === "create" ? (
                <div>
                  <DesignerInlineWorkspaceHeader
                    title={t("contracts.createTitle", {
                      defaultValue: "Create Contract",
                    })}
                    subtitle={t("contracts.createDescription", {
                      defaultValue:
                        "Create a manual contract or build one directly from a quotation.",
                    })}
                    backLabel={t("contracts.backToContracts", {
                      defaultValue: "Back to Contracts",
                    })}
                    onBack={openContractList}
                  />
                  <ContractFormWorkspace
                    initialMode={
                      requestedQuotationId ? "from_quotation" : "manual"
                    }
                    initialEventId={eventId}
                    initialQuotationId={requestedQuotationId ?? undefined}
                    onCancel={openContractList}
                    onOpenContract={openContractDetails}
                  />
                </div>
              ) : selectedContractId ? (
                <div>
                  <DesignerInlineWorkspaceHeader
                    title={t("contracts.detailsTitle", {
                      defaultValue: "Contract Details",
                    })}
                    subtitle={t("contracts.workflowStage", {
                      defaultValue: "Commitment Snapshot",
                    })}
                    backLabel={t("contracts.backToContracts", {
                      defaultValue: "Back to Contracts",
                    })}
                    onBack={openContractList}
                  />
                  <ContractDetailsWorkspace
                    contractId={selectedContractId}
                    onOpenQuotation={openQuotationDetails}
                    onOpenEvent={() => setActiveTab("client-details")}
                    onDeleteSuccess={openContractList}
                  />
                </div>
              ) : null}
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

      <Dialog
        open={quickQuotationDialogOpen}
        onOpenChange={(open) => {
          setQuickQuotationDialogOpen(open);
          if (!open) {
            setQuickQuotationError("");
          }
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {t("quotations.createTitle", {
                defaultValue: "Create Quotation",
              })}
            </DialogTitle>
            <DialogDescription>
              أدخل تاريخ الإصدار، صالح حتى، وإجمالي قيمة الخدمات ثم أنشئ عرض
              السعر.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-[var(--lux-text)]">
                تاريخ الإصدار
              </span>
              <Input
                type="date"
                value={quickQuotationForm.issueDate}
                onChange={(event) =>
                  setQuickQuotationForm((current) => ({
                    ...current,
                    issueDate: event.target.value,
                  }))
                }
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-[var(--lux-text)]">
                صالح حتى
              </span>
              <Input
                type="date"
                value={quickQuotationForm.validUntil}
                onChange={(event) =>
                  setQuickQuotationForm((current) => ({
                    ...current,
                    validUntil: event.target.value,
                  }))
                }
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-[var(--lux-text)]">
                إجمالي قيمة الخدمات
              </span>
              <Input
                type="number"
                min="0"
                step="0.001"
                value={quickQuotationForm.manualServicesTotal}
                onChange={(event) =>
                  setQuickQuotationForm((current) => ({
                    ...current,
                    manualServicesTotal: event.target.value,
                  }))
                }
              />
            </label>
          </div>

          {quickQuotationError ? (
            <p className="text-sm text-[var(--lux-danger)]">
              {quickQuotationError}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setQuickQuotationDialogOpen(false)}
              disabled={quickQuotationMutation.isPending}
            >
              {t("common.cancel", { defaultValue: "Cancel" })}
            </Button>
            <Button
              type="button"
              onClick={handleCreateQuickQuotation}
              disabled={quickQuotationMutation.isPending}
            >
              {quickQuotationMutation.isPending
                ? t("common.processing", { defaultValue: "Processing..." })
                : t("common.create", { defaultValue: "Create" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={quickContractDialogOpen}
        onOpenChange={(open) => {
          setQuickContractDialogOpen(open);
          if (!open) {
            setQuickContractError("");
          }
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {t("contracts.createTitle", {
                defaultValue: "Create Contract",
              })}
            </DialogTitle>
            <DialogDescription>
              أدخل تاريخ التوقيع ثم أنشئ العقد مباشرة بدون انتقال.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-[var(--lux-text)]">
                تاريخ التوقيع
              </span>
              <Input
                type="date"
                value={quickContractForm.signedDate}
                onChange={(event) =>
                  setQuickContractForm((current) => ({
                    ...current,
                    signedDate: event.target.value,
                  }))
                }
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-[var(--lux-text)]">
                تاريخ المناسبة
              </span>
              <Input
                type="date"
                value={quickContractForm.eventDate}
                onChange={(event) =>
                  setQuickContractForm((current) => ({
                    ...current,
                    eventDate: event.target.value,
                  }))
                }
              />
            </label>
          </div>

          {!latestQuotation ? (
            <p className="text-sm text-[var(--lux-text-secondary)]">
              يجب أن يوجد عرض سعر أولاً حتى يتم إنشاء العقد.
            </p>
          ) : null}

          {quickContractError ? (
            <p className="text-sm text-[var(--lux-danger)]">
              {quickContractError}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setQuickContractDialogOpen(false)}
              disabled={quickContractMutation.isPending}
            >
              {t("common.cancel", { defaultValue: "Cancel" })}
            </Button>
            <Button
              type="button"
              onClick={handleCreateQuickContract}
              disabled={quickContractMutation.isPending || !latestQuotation}
            >
              {quickContractMutation.isPending
                ? t("common.processing", { defaultValue: "Processing..." })
                : t("common.create", { defaultValue: "Create" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
    ? (requestedEventId ?? "")
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
    nextParams.delete("view");
    nextParams.delete("quotationId");
    nextParams.delete("contractId");
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
