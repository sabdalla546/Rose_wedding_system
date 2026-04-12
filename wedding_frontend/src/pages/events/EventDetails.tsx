/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ar, enUS } from "date-fns/locale";
import type { CheckedState } from "@radix-ui/react-checkbox";
import { ArrowRight, CheckCheck, CircleOff, Play } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { PageContainer } from "@/components/layout/page-container";
import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import { WorkflowActionBar } from "@/components/workflow/workflow-action-bar";
import { WorkflowLineageCard } from "@/components/workflow/workflow-lineage-card";
import { WorkflowLockBanner } from "@/components/workflow/workflow-lock-banner";
import {
  WorkflowNextStepPanel,
  type WorkflowNextStepItem,
} from "@/components/workflow/workflow-next-step-panel";
import { WorkflowStatusBadge } from "@/components/workflow/workflow-status-badge";
import { WorkflowTimeline, type WorkflowTimelineItem } from "@/components/workflow/workflow-timeline";
import {
  AppDialogBody,
  AppDialogFooter,
  AppDialogHeader,
  AppDialogShell,
} from "@/components/shared/app-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import ConfirmDialog from "@/components/ui/confirmDialog";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEventWorkflowAction } from "@/hooks/events/useEventWorkflowActions";
import {
  useCreateContract,
  useCreateContractFromQuotation,
} from "@/hooks/contracts/useContractMutations";
import { useExecutionBriefByEvent } from "@/hooks/execution/useExecutionBriefs";
import { useCreateQuotationFromEvent } from "@/hooks/quotations/useQuotationMutations";
import {
  useCreateEventService,
  useUpdateEventService,
} from "@/hooks/services/useEventServiceMutations";
import { useServices } from "@/hooks/services/useServices";
import {
  useCreateEventVendor,
  useUpdateEventVendor,
} from "@/hooks/vendors/useEventVendorMutations";
import { useVendorSubServices } from "@/hooks/vendors/useVendorSubServices";
import { EventDetailsHero } from "./_components/EventDetailsHero";
import { EventServicesChecklistDialog } from "./_components/EventServicesChecklistDialog";
import { EventWorkspaceSummary } from "./_components/EventWorkspaceSummary";
import {
  DeleteEventServiceConfirmDialog,
  DeleteEventVendorConfirmDialog,
  EventContractsPanel,
  EventEditDialog,
  EventExecutionPanel,
  EventOverviewPanel,
  EventQuotationsPanel,
  EventServicesPanel,
  EventVendorsPanel,
} from "@/features/events/components";
import {
  EVENT_SERVICE_STATUS_OPTIONS,
  SERVICE_CATEGORY_OPTIONS,
  toNumberValue,
} from "@/pages/services/adapters";
import type {
  EventServiceItem,
  EventServiceStatus,
  ServiceCategory,
} from "@/pages/services/types";
import type { ContractStatus } from "@/pages/contracts/types";
import type { QuotationStatus } from "@/pages/quotations/types";
import { useVendors } from "@/hooks/vendors/useVendors";
import {
  EVENT_VENDOR_PROVIDED_BY_OPTIONS,
  EVENT_VENDOR_STATUS_OPTIONS,
  formatMoney as formatVendorMoney,
  formatVendorType,
  getEventVendorDisplayName,
  sumSelectedVendorSubServicePrices,
  VENDOR_TYPE_OPTIONS,
} from "@/pages/vendors/adapters";
import type {
  EventVendorLink,
  EventVendorProvidedBy,
  EventVendorStatus,
  VendorType,
} from "@/pages/vendors/types";
import {
  getEventCommercialSummary,
  getEventWorkflowActions,
  type WorkflowActionDefinition,
} from "@/lib/workflow/workflow";
import { useEventEditDialog } from "@/features/events/hooks/useEventEditDialog";
import { useEventWorkspaceData } from "@/features/events/hooks/useEventWorkspaceData";
import { useEventWorkspaceDeleteFlows } from "@/features/events/hooks/useEventWorkspaceDeleteFlows";

import type { EventStatus } from "./types";

type EventVendorFormState = {
  vendorType: VendorType;
  providedBy: EventVendorProvidedBy;
  vendorId: string;
  companyNameSnapshot: string;
  selectedSubServiceIds: number[];
  agreedPrice: string;
  isPriceOverride: boolean;
  notes: string;
  status: EventVendorStatus;
};

type EventServiceFormState = {
  serviceId: string;
  serviceNameSnapshot: string;
  category: ServiceCategory;
  notes: string;
  status: EventServiceStatus;
  sortOrder: string;
};

type QuotationCreateFormState = {
  quotationNumber: string;
  issueDate: string;
  validUntil: string;
  notes: string;
  status: QuotationStatus;
  eventServiceIds: string[];
  eventVendorIds: string[];
};

type ContractCreateFormState = {
  quotationId: string;
  contractNumber: string;
  signedDate: string;
  eventDate: string;
  notes: string;
  status: ContractStatus;
};

type EventDetailsTabValue =
  | "overview"
  | "items"
  | "vendors"
  | "quotations"
  | "contracts"
  | "execution";

const textareaClassName =
  "min-h-[110px] w-full rounded-[22px] border px-4 py-3 text-sm text-[var(--lux-text)] placeholder:text-[var(--lux-text-muted)] outline-none transition-all focus:border-[var(--lux-gold-border)] focus:ring-2 focus:ring-[var(--lux-gold-glow)] sm:min-h-[130px]";
const fieldGroupClassName = "space-y-2";
const fieldLabelClassName = "text-sm font-medium text-[var(--lux-text)]";
const helperTextClassName =
  "text-xs leading-5 text-[var(--lux-text-secondary)]";
const dialogBodyClassName = "space-y-5";
const dialogSectionClassName =
  "space-y-4 rounded-[24px] border border-[var(--lux-row-border)] bg-[var(--lux-row-surface)] p-4 sm:p-5";
const dialogSectionHeaderClassName = "space-y-1.5";
const dialogSectionTitleClassName =
  "text-sm font-semibold text-[var(--lux-text)]";
const dialogHintBoxClassName =
  "rounded-[18px] border border-dashed border-[var(--lux-row-border)] bg-[var(--lux-control-hover)] p-3 text-sm text-[var(--lux-text-secondary)]";
const dialogInsetBoxClassName =
  "rounded-[18px] border border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)] px-4 py-3";
const dialogCheckboxCardClassName =
  "flex items-center gap-3 rounded-[18px] border border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)] p-4";

const createDefaultEventVendorState = (): EventVendorFormState => ({
  vendorType: "dj",
  providedBy: "company",
  vendorId: "",
  companyNameSnapshot: "",
  selectedSubServiceIds: [],
  agreedPrice: "",
  isPriceOverride: false,
  notes: "",
  status: "pending",
});

const formatDecimalInput = (value?: number | string | null) => {
  const parsed = toNumberValue(value);

  if (parsed === null) {
    return "";
  }

  return parsed.toFixed(3);
};

const createDefaultEventServiceState = (
  sortOrder = 0,
): EventServiceFormState => ({
  serviceId: "",
  serviceNameSnapshot: "",
  category: "other",
  notes: "",
  status: "draft",
  sortOrder: String(sortOrder),
});

const createDefaultQuotationCreateState = (): QuotationCreateFormState => ({
  quotationNumber: "",
  issueDate: "",
  validUntil: "",
  notes: "",
  status: "draft",
  eventServiceIds: [],
  eventVendorIds: [],
});

const createDefaultContractCreateState = (): ContractCreateFormState => ({
  quotationId: "",
  contractNumber: "",
  signedDate: "",
  eventDate: "",
  notes: "",
  status: "draft",
});

type EventDetailsPageProps = {
  eventIdOverride?: number | string;
  embedded?: boolean;
};

export const EventDetailsPage = ({
  eventIdOverride,
  embedded = false,
}: EventDetailsPageProps = {}) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const resolvedEventId = eventIdOverride ? String(eventIdOverride) : id;
  const dateLocale = i18n.language === "ar" ? ar : enUS;

  const [vendorDialogOpen, setVendorDialogOpen] = useState(false);
  const [editingVendorLink, setEditingVendorLink] =
    useState<EventVendorLink | null>(null);
  const [vendorError, setVendorError] = useState("");
  const [vendorForm, setVendorForm] = useState<EventVendorFormState>(
    createDefaultEventVendorState(),
  );
  const [serviceChecklistOpen, setServiceChecklistOpen] = useState(false);
  const [serviceEditorOpen, setServiceEditorOpen] = useState(false);
  const [editingServiceItem, setEditingServiceItem] =
    useState<EventServiceItem | null>(null);
  const {
    deleteServiceCandidate,
    setDeleteServiceCandidate,
    deleteVendorCandidate,
    setDeleteVendorCandidate,
    confirmDeleteService,
    confirmDeleteVendor,
    deleteEventServiceMutation,
    deleteEventVendorMutation,
  } = useEventWorkspaceDeleteFlows(resolvedEventId);
  const [serviceError, setServiceError] = useState("");
  const [serviceForm, setServiceForm] = useState<EventServiceFormState>(
    createDefaultEventServiceState(),
  );
  const [activeTab, setActiveTab] = useState<EventDetailsTabValue>("overview");
  const [createQuotationDialogOpen, setCreateQuotationDialogOpen] =
    useState(false);
  const [quotationCreateForm, setQuotationCreateForm] =
    useState<QuotationCreateFormState>(createDefaultQuotationCreateState());
  const [createContractDialogOpen, setCreateContractDialogOpen] =
    useState(false);
  const [contractCreateForm, setContractCreateForm] =
    useState<ContractCreateFormState>(createDefaultContractCreateState());
  const [pendingWorkflowAction, setPendingWorkflowAction] =
    useState<WorkflowActionDefinition | null>(null);

  const workflowActionMutation = useEventWorkflowAction(resolvedEventId);
  const createQuotationFromEventMutation = useCreateQuotationFromEvent({
    navigateOnSuccess: false,
    onSuccess: () => setCreateQuotationDialogOpen(false),
  });
  const createContractMutation = useCreateContract({
    navigateOnSuccess: false,
    onSuccess: () => setCreateContractDialogOpen(false),
  });
  const createContractFromQuotationMutation = useCreateContractFromQuotation({
    navigateOnSuccess: false,
    onSuccess: () => setCreateContractDialogOpen(false),
  });
  const createEventServiceMutation = useCreateEventService();
  const updateEventServiceMutation = useUpdateEventService(
    Number(resolvedEventId || 0),
  );
  const createEventVendorMutation = useCreateEventVendor(
    Number(resolvedEventId || 0),
  );
  const updateEventVendorMutation = useUpdateEventVendor(
    Number(resolvedEventId || 0),
  );
  const { data: vendorCatalogResponse } = useVendors({
    currentPage: 1,
    itemsPerPage: 200,
    searchQuery: "",
    type: "all",
    isActive: "all",
  });
  const {
    data: vendorSubServicesResponse,
    isLoading: vendorSubServicesLoading,
  } = useVendorSubServices({
    currentPage: 1,
    itemsPerPage: 200,
    searchQuery: "",
    vendorId: vendorForm.vendorId ? Number(vendorForm.vendorId) : undefined,
    vendorType: "all",
    isActive: "all",
    enabled:
      vendorForm.providedBy === "company" && Boolean(vendorForm.vendorId),
  });
  const { data: serviceCatalogResponse } = useServices({
    currentPage: 1,
    itemsPerPage: 200,
    searchQuery: "",
    category: "all",
    isActive: "all",
  });
  const {
    event,
    eventLoading: isLoading,
    customers: customerCatalog,
    venues: venueCatalog,
    serviceItems: sortedEventServiceItems,
    existingServiceIds: existingEventServiceIds,
    vendorLinks: sortedEventVendorLinks,
    quotations: sortedEventQuotations,
    latestQuotation,
    latestContract,
    readiness: operationalReadiness,
  } = useEventWorkspaceData(resolvedEventId, {
    sortVendorLinks: (left, right) => {
      if (left.vendorType !== right.vendorType) {
        return left.vendorType.localeCompare(right.vendorType);
      }

      return getEventVendorDisplayName(left).localeCompare(
        getEventVendorDisplayName(right),
      );
    },
  });
  const { data: executionBrief } = useExecutionBriefByEvent(resolvedEventId);

  const vendorCatalog = useMemo(
    () => vendorCatalogResponse?.data ?? [],
    [vendorCatalogResponse?.data],
  );
  const vendorSubServices = useMemo(
    () => vendorSubServicesResponse?.data ?? [],
    [vendorSubServicesResponse?.data],
  );
  const serviceCatalog = useMemo(
    () => serviceCatalogResponse?.data ?? [],
    [serviceCatalogResponse?.data],
  );
  const filteredVendorCatalog = useMemo(
    () =>
      [...vendorCatalog]
        .filter(
          (vendor) =>
            vendor.type === vendorForm.vendorType &&
            (vendor.isActive || String(vendor.id) === vendorForm.vendorId),
        )
        .sort((left, right) => {
          if (left.isActive !== right.isActive) {
            return left.isActive ? -1 : 1;
          }

          return left.name.localeCompare(right.name);
        }),
    [vendorCatalog, vendorForm.vendorId, vendorForm.vendorType],
  );
  const selectedCatalogVendor = useMemo(
    () =>
      filteredVendorCatalog.find(
        (vendor) => String(vendor.id) === vendorForm.vendorId,
      ) ?? null,
    [filteredVendorCatalog, vendorForm.vendorId],
  );
  const resolvedVendorDraftName = useMemo(() => {
    const companyNameSnapshot = vendorForm.companyNameSnapshot.trim();

    if (vendorForm.providedBy === "client") {
      return (
        companyNameSnapshot ||
        t("vendors.clientProvidedVendor", {
          defaultValue: "Client-provided vendor",
        })
      );
    }

    return (
      selectedCatalogVendor?.name ||
      companyNameSnapshot ||
      t("vendors.noVendorSelected", {
        defaultValue: "No catalog vendor selected",
      })
    );
  }, [
    selectedCatalogVendor?.name,
    t,
    vendorForm.companyNameSnapshot,
    vendorForm.providedBy,
  ]);
  const availableVendorSubServices = useMemo(
    () =>
      [...vendorSubServices].sort((left, right) => {
        if (left.isActive !== right.isActive) {
          return left.isActive ? -1 : 1;
        }

        if (left.sortOrder !== right.sortOrder) {
          return left.sortOrder - right.sortOrder;
        }

        return left.name.localeCompare(right.name);
      }),
    [vendorSubServices],
  );
  const calculatedSubServicesTotal = useMemo(
    () =>
      sumSelectedVendorSubServicePrices(
        availableVendorSubServices,
        vendorForm.selectedSubServiceIds,
      ),
    [availableVendorSubServices, vendorForm.selectedSubServiceIds],
  );
  const calculatedVendorPriceInput = useMemo(
    () => formatDecimalInput(calculatedSubServicesTotal),
    [calculatedSubServicesTotal],
  );
  const selectableServiceCatalog = useMemo(
    () =>
      [...serviceCatalog]
        .filter(
          (service) =>
            service.isActive || String(service.id) === serviceForm.serviceId,
        )
        .sort((left, right) => {
          if (left.isActive !== right.isActive) {
            return left.isActive ? -1 : 1;
          }

          return left.name.localeCompare(right.name);
        }),
    [serviceCatalog, serviceForm.serviceId],
  );
  const commercialSummary = event ? getEventCommercialSummary(event) : null;
  const {
    open: editEventDialogOpen,
    setOpen: setEditEventDialogOpen,
    form: editEventForm,
    setForm: setEditEventForm,
    error: editEventError,
    openDialog: openEditEventDialog,
    save: handleEventUpdateSave,
    updateEventMutation,
  } = useEventEditDialog({
    eventId: resolvedEventId,
    event,
    eventDateRequiredMessage: t("events.validation.eventDateRequired", {
      defaultValue: "Event date is required",
    }),
  });

  useEffect(() => {
    if (!vendorDialogOpen) {
      setEditingVendorLink(null);
      setVendorError("");
      setVendorForm(createDefaultEventVendorState());
      return;
    }

    if (!editingVendorLink) {
      setVendorForm(createDefaultEventVendorState());
      return;
    }

    setVendorForm({
      vendorType: editingVendorLink.vendorType,
      providedBy: editingVendorLink.providedBy,
      vendorId: editingVendorLink.vendorId
        ? String(editingVendorLink.vendorId)
        : "",
      companyNameSnapshot: editingVendorLink.companyNameSnapshot ?? "",
      selectedSubServiceIds: (editingVendorLink.selectedSubServices ?? [])
        .map((selectedSubService) => selectedSubService.vendorSubServiceId)
        .filter((value): value is number => typeof value === "number"),
      agreedPrice: formatDecimalInput(editingVendorLink.agreedPrice),
      isPriceOverride:
        typeof editingVendorLink.hasManualPriceOverride === "boolean"
          ? editingVendorLink.hasManualPriceOverride
          : false,
      notes: editingVendorLink.notes ?? "",
      status: editingVendorLink.status,
    });
  }, [editingVendorLink, vendorDialogOpen]);

  useEffect(() => {
    if (!vendorDialogOpen || vendorForm.isPriceOverride) {
      return;
    }

    if (vendorForm.agreedPrice === calculatedVendorPriceInput) {
      return;
    }

    setVendorForm((current) =>
      current.isPriceOverride
        ? current
        : {
            ...current,
            agreedPrice: calculatedVendorPriceInput,
          },
    );
  }, [
    calculatedVendorPriceInput,
    vendorDialogOpen,
    vendorForm.agreedPrice,
    vendorForm.isPriceOverride,
  ]);

  useEffect(() => {
    if (!serviceEditorOpen) {
      setEditingServiceItem(null);
      setServiceError("");
      setServiceForm(
        createDefaultEventServiceState(sortedEventServiceItems.length),
      );
      return;
    }

    if (!editingServiceItem) {
      setServiceForm(
        createDefaultEventServiceState(sortedEventServiceItems.length),
      );
      return;
    }

    setServiceForm({
      serviceId: editingServiceItem.serviceId
        ? String(editingServiceItem.serviceId)
        : "",
      serviceNameSnapshot: editingServiceItem.serviceNameSnapshot ?? "",
      category: editingServiceItem.category,
      notes: editingServiceItem.notes ?? "",
      status: editingServiceItem.status,
      sortOrder: String(editingServiceItem.sortOrder ?? 0),
    });
  }, [editingServiceItem, serviceEditorOpen, sortedEventServiceItems.length]);

  useEffect(() => {
    if (!createQuotationDialogOpen) {
      setQuotationCreateForm(createDefaultQuotationCreateState());
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    setQuotationCreateForm({
      quotationNumber: "",
      issueDate: today,
      validUntil: "",
      notes: "",
      status: "draft",
      eventServiceIds: sortedEventServiceItems.map((item) => String(item.id)),
      eventVendorIds: sortedEventVendorLinks.map((item) => String(item.id)),
    });
  }, [
    createQuotationDialogOpen,
    sortedEventServiceItems,
    sortedEventVendorLinks,
  ]);

  useEffect(() => {
    if (!createContractDialogOpen) {
      setContractCreateForm(createDefaultContractCreateState());
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    setContractCreateForm({
      quotationId: latestQuotation ? String(latestQuotation.id) : "",
      contractNumber: "",
      signedDate: today,
      eventDate: event?.eventDate ? String(event.eventDate).slice(0, 10) : "",
      notes: "",
      status: "draft",
    });
  }, [createContractDialogOpen, event?.eventDate, latestQuotation]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-sm text-[var(--lux-text-secondary)]">
          {t("common.loading", { defaultValue: "Loading..." })}
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-sm text-[var(--lux-text-secondary)]">
          {t("common.noResultsTitle", { defaultValue: "No results found" })}
        </div>
      </div>
    );
  }

  const handleVendorSave = () => {
    if (!resolvedEventId) {
      return;
    }

    const selectedVendor = filteredVendorCatalog.find(
      (vendor) => String(vendor.id) === vendorForm.vendorId,
    );
    const manualCompanyNameSnapshot = vendorForm.companyNameSnapshot.trim();
    const companyNameSnapshot =
      vendorForm.providedBy === "company"
        ? manualCompanyNameSnapshot || selectedVendor?.name || ""
        : manualCompanyNameSnapshot;

    if (vendorForm.providedBy === "company") {
      if (!vendorForm.vendorId && !companyNameSnapshot) {
        setVendorError(
          t("vendors.selectionRequired", {
            defaultValue: "Select a catalog vendor or enter a company name.",
          }),
        );
        return;
      }
    } else if (!companyNameSnapshot) {
      setVendorError(
        t("vendors.clientVendorNameRequired", {
          defaultValue: "Enter the client-provided vendor name.",
        }),
      );
      return;
    }

    if (!vendorForm.vendorId && vendorForm.selectedSubServiceIds.length > 0) {
      setVendorError(
        t("vendors.selectVendorForSubServices", {
          defaultValue:
            "Select a company vendor to load that vendor's sub-services.",
        }),
      );
      return;
    }

    if (
      vendorForm.agreedPrice.trim() &&
      (toNumberValue(vendorForm.agreedPrice) === null ||
        Number(vendorForm.agreedPrice) < 0)
    ) {
      setVendorError(
        t("vendors.agreedPriceInvalid", {
          defaultValue: "Agreed price must be zero or greater.",
        }),
      );
      return;
    }

    setVendorError("");

    const payload = {
      eventId: Number(resolvedEventId),
      vendorType: vendorForm.vendorType,
      providedBy: vendorForm.providedBy,
      vendorId: vendorForm.providedBy === "company" ? vendorForm.vendorId : "",
      companyNameSnapshot,
      selectedSubServiceIds: vendorForm.selectedSubServiceIds,
      agreedPrice: vendorForm.agreedPrice,
      notes: vendorForm.notes,
      status: vendorForm.status,
    };

    if (editingVendorLink) {
      updateEventVendorMutation.mutate(
        { id: editingVendorLink.id, values: payload },
        { onSuccess: () => setVendorDialogOpen(false) },
      );
      return;
    }

    createEventVendorMutation.mutate(payload, {
      onSuccess: () => setVendorDialogOpen(false),
    });
  };

  const handleServiceSave = () => {
    if (!resolvedEventId) {
      return;
    }

    const sortOrderValue = Number(serviceForm.sortOrder || 0);
    const selectedService = serviceCatalog.find(
      (service) => String(service.id) === serviceForm.serviceId,
    );
    const serviceNameSnapshot =
      serviceForm.serviceNameSnapshot.trim() || selectedService?.name || "";

    if (!serviceForm.serviceId && !serviceNameSnapshot) {
      setServiceError(
        t("services.selectionRequired", {
          defaultValue: "Select a catalog service or enter a service name.",
        }),
      );
      return;
    }

    if (!Number.isInteger(sortOrderValue) || sortOrderValue < 0) {
      setServiceError(
        t("services.sortOrderInvalid", {
          defaultValue: "Sort order must be zero or greater.",
        }),
      );
      return;
    }

    setServiceError("");

    const payload = {
      eventId: Number(resolvedEventId),
      serviceId: serviceForm.serviceId,
      serviceNameSnapshot,
      category: serviceForm.category,
      notes: serviceForm.notes,
      status: serviceForm.status,
      sortOrder: String(sortOrderValue),
    };

    if (!editingServiceItem) {
      setServiceError(
        t("services.editOnlyDialogMessage", {
          defaultValue: "Use the checklist dialog to add new services.",
        }),
      );
      return;
    }

    updateEventServiceMutation.mutate(
      { id: editingServiceItem.id, values: payload },
      { onSuccess: () => setServiceEditorOpen(false) },
    );
  };

  const handleEventWorkflowAction = (action: WorkflowActionDefinition) => {
    if (!action.nextStatus) {
      return;
    }

    if (action.confirmTitle || action.confirmMessage) {
      setPendingWorkflowAction(action);
      return;
    }

    workflowActionMutation.mutate({ status: action.nextStatus as EventStatus });
  };

  const handleConfirmWorkflowAction = () => {
    if (!pendingWorkflowAction?.nextStatus) {
      setPendingWorkflowAction(null);
      return;
    }

    workflowActionMutation.mutate(
      { status: pendingWorkflowAction.nextStatus as EventStatus },
      {
        onSettled: () => setPendingWorkflowAction(null),
      },
    );
  };

  const handleCreateQuotationSave = () => {
    if (!resolvedEventId) {
      return;
    }

    createQuotationFromEventMutation.mutate({
      eventId: String(resolvedEventId),
      quotationNumber: quotationCreateForm.quotationNumber,
      issueDate: quotationCreateForm.issueDate,
      validUntil: quotationCreateForm.validUntil,
      notes: quotationCreateForm.notes,
      eventServiceIds: quotationCreateForm.eventServiceIds,
      eventVendorIds: quotationCreateForm.eventVendorIds,
      status: quotationCreateForm.status,
    });
  };

  const handleCreateContractSave = () => {
    if (!resolvedEventId) {
      return;
    }

    if (contractCreateForm.quotationId) {
      createContractFromQuotationMutation.mutate({
        quotationId: contractCreateForm.quotationId,
        contractNumber: contractCreateForm.contractNumber,
        signedDate: contractCreateForm.signedDate,
        eventDate: contractCreateForm.eventDate,
        notes: contractCreateForm.notes,
        status: contractCreateForm.status,
      });
      return;
    }

    createContractMutation.mutate({
      eventId: String(resolvedEventId),
      quotationId: "",
      contractNumber: contractCreateForm.contractNumber,
      signedDate: contractCreateForm.signedDate,
      eventDate: contractCreateForm.eventDate,
      notes: contractCreateForm.notes,
      status: contractCreateForm.status,
      items: [],
      paymentSchedules: [],
    });
  };

  const workflowActionIcons: Partial<Record<EventStatus, ReactNode>> = {
    designing: <ArrowRight className="h-4 w-4" />,
    quotation_pending: <ArrowRight className="h-4 w-4" />,
    quoted: <ArrowRight className="h-4 w-4" />,
    confirmed: <CheckCheck className="h-4 w-4" />,
    in_progress: <Play className="h-4 w-4" />,
    completed: <CheckCheck className="h-4 w-4" />,
    cancelled: <CircleOff className="h-4 w-4" />,
  };

  const workflowActions = getEventWorkflowActions(event.status).map((action) => ({
    ...action,
    icon: action.nextStatus
      ? workflowActionIcons[action.nextStatus as EventStatus]
      : undefined,
    loading:
      workflowActionMutation.isPending &&
      action.nextStatus === workflowActionMutation.variables?.status,
    onClick: () => handleEventWorkflowAction(action),
  }));
  const nextSteps: WorkflowNextStepItem[] = [];
  const timelineItems: WorkflowTimelineItem[] = [
    {
      id: "created",
      title: t("events.timelineCreated", {
        defaultValue: "Event created",
      }),
      description: t("events.timelineCreatedHint", {
        defaultValue: "The event entered the main workflow.",
      }),
      timestamp: event.createdAt ?? event.eventDate,
      status: "done",
    },
    {
      id: "status-update",
      title: t("events.timelineStatusUpdate", {
        defaultValue: "Event status updated",
      }),
      description: t("events.timelineStatusUpdateHint", {
        defaultValue: "Current event status: {{status}}",
        status: t(`events.status.${event.status}`, {
          defaultValue: event.status,
        }),
      }),
      timestamp: event.updatedAt ?? event.eventDate,
      status: event.status === "cancelled" ? "warning" : "current",
    },
  ];

  if (event.status === "cancelled") {
    nextSteps.push({
      id: "event-cancelled",
      title: t("events.nextCancelledTitle", {
        defaultValue: "Workflow is blocked",
      }),
      description: t("events.nextCancelledHint", {
        defaultValue:
          "This event is cancelled, so quotation, contract, and execution creation should stop here.",
      }),
      tone: "warning",
    });
  }

  if (event.status === "designing" && !latestQuotation) {
    nextSteps.push({
      id: "prepare-quotation",
      title: t("events.nextQuotationTitle", {
        defaultValue: "Prepare the quotation",
      }),
      description: t("events.nextQuotationHint", {
        defaultValue:
          "Design work is underway. Once scope is ready, create the quotation package from this event.",
      }),
      tone: "default",
      action: (
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setActiveTab("quotations");
            setCreateQuotationDialogOpen(true);
          }}
        >
          {t("quotations.createFromEvent", {
            defaultValue: "Create Quotation",
          })}
        </Button>
      ),
    });
  }

  if (latestQuotation?.status === "approved" && !latestContract) {
    nextSteps.push({
      id: "create-contract",
      title: t("events.nextContractTitle", {
        defaultValue: "Create the contract",
      }),
      description: t("events.nextContractHint", {
        defaultValue:
          "The quotation is approved, but there is no downstream contract yet. Move this event into the commitment stage next.",
      }),
      tone: "default",
      action: (
        <Button
          type="button"
          onClick={() => {
            setActiveTab("contracts");
            setCreateContractDialogOpen(true);
          }}
        >
          {t("contracts.create", { defaultValue: "Create Contract" })}
        </Button>
      ),
    });
  }

  if (
    latestContract &&
    (latestContract.status === "signed" || latestContract.status === "active") &&
    !executionBrief
  ) {
    nextSteps.push({
      id: "prepare-execution",
      title: t("events.nextExecutionTitle", {
        defaultValue: "Prepare the execution brief",
      }),
      description: t("events.nextExecutionHint", {
        defaultValue:
          "The commitment stage is live, but there is no execution brief yet. Open the execution workspace to generate it from this event.",
      }),
      tone: "warning",
    });
  }

  if (executionBrief?.status === "approved") {
    nextSteps.push({
      id: "handoff-execution",
      title: t("events.nextHandoffTitle", {
        defaultValue: "Handoff the approved brief",
      }),
      description: t("events.nextHandoffHint", {
        defaultValue:
          "The execution brief is approved and waiting on operational handoff.",
      }),
      tone: "warning",
      action: (
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(`/execution-briefs/${executionBrief.id}`)}
        >
          {t("execution.openExecutionBrief", {
            defaultValue: "Open Execution Brief",
          })}
        </Button>
      ),
    });
  }

  if (event.sourceAppointment) {
    timelineItems.push({
      id: "source-appointment",
      title: t("events.timelineFromAppointment", {
        defaultValue: "Converted from appointment",
      }),
      description:
        event.sourceAppointment.customer?.fullName || `#${event.sourceAppointmentId}`,
      timestamp: event.sourceAppointment.appointmentDate,
      status: "done",
    });
  }

  if (latestQuotation) {
    timelineItems.push({
      id: "quotation-linked",
      title: t("events.timelineQuotationLinked", {
        defaultValue: "Quotation linked to event",
      }),
      description: t("events.timelineQuotationLinkedHint", {
        defaultValue: "Latest quotation status: {{status}}",
        status: t(`quotations.status.${latestQuotation.status}`, {
          defaultValue: latestQuotation.status,
        }),
      }),
      timestamp: latestQuotation.createdAt ?? latestQuotation.issueDate,
      status: "done",
    });
  }

  if (latestContract) {
    timelineItems.push({
      id: "contract-linked",
      title: t("events.timelineContractLinked", {
        defaultValue: "Contract linked to event",
      }),
      description: t("events.timelineContractLinkedHint", {
        defaultValue: "Latest contract status: {{status}}",
        status: t(`contracts.status.${latestContract.status}`, {
          defaultValue: latestContract.status,
        }),
      }),
      timestamp: latestContract.createdAt ?? latestContract.signedDate,
      status: "done",
    });
  }

  if (executionBrief) {
    timelineItems.push({
      id: "execution-linked",
      title: t("events.timelineExecutionLinked", {
        defaultValue: "Execution brief linked",
      }),
      description: t("events.timelineExecutionLinkedHint", {
        defaultValue: "Execution status: {{status}}",
        status: t(`execution.briefStatusOptions.${executionBrief.status}`, {
          defaultValue: executionBrief.status,
        }),
      }),
      timestamp: executionBrief.createdAt,
      status: "done",
    });
  }

  return (
    <>
      <ProtectedComponent permission="events.read">
        <PageContainer
          className={
            embedded ? "p-0 text-foreground" : "pb-4 pt-4 text-foreground"
          }
        >
          <div
            dir={i18n.dir()}
            className={`mx-auto w-full space-y-6 ${embedded ? "max-w-none" : "max-w-6xl"}`}
          >
            {!embedded ? (
              <EventDetailsHero
                event={event}
                dateLocale={dateLocale}
                t={t}
                onBack={() => navigate("/events")}
                onEdit={() => navigate(`/events/edit/${event.id}`)}
                onViewCustomer={
                  event.customerId
                    ? () => navigate(`/customers/${event.customerId}`)
                    : undefined
                }
                onViewSourceAppointment={
                  event.sourceAppointmentId
                    ? () =>
                        navigate(`/appointments/${event.sourceAppointmentId}`)
                    : undefined
                }
              />
            ) : null}

            {event.status === "cancelled" ? (
              <WorkflowLockBanner
                title={t("events.workflowLockedTitle", {
                  defaultValue: "Workflow Locked",
                })}
                message={t("events.workflowLockedMessage", {
                  defaultValue:
                    "This event is cancelled. New quotation and execution actions should stop here.",
                })}
              />
            ) : null}

            <WorkflowLineageCard
              title={t("events.workflowLineage", {
                defaultValue: "Workflow Lineage",
              })}
              items={[
                {
                  label: t("events.sourceAppointment", {
                    defaultValue: "Source Appointment",
                  }),
                  value: event.sourceAppointmentId ? (
                    <button
                      type="button"
                      onClick={() => navigate(`/appointments/${event.sourceAppointmentId}`)}
                      className="text-sm font-medium text-[var(--lux-gold)] hover:underline"
                    >
                      #{event.sourceAppointmentId}
                    </button>
                  ) : (
                    t("events.manualEvent", {
                      defaultValue: "Created manually without an appointment source.",
                    })
                  ),
                  helper: event.sourceAppointment?.customer?.fullName || undefined,
                },
                {
                  label: t("events.customer", { defaultValue: "Customer" }),
                  value: event.customerId ? (
                    <button
                      type="button"
                      onClick={() => navigate(`/customers/${event.customerId}`)}
                      className="text-sm font-medium text-[var(--lux-gold)] hover:underline"
                    >
                      {event.customer?.fullName || `Customer #${event.customerId}`}
                    </button>
                  ) : (
                    t("events.noCustomerLinked", {
                      defaultValue: "No customer linked",
                    })
                  ),
                  helper: event.venue?.name || event.venueNameSnapshot || undefined,
                },
                {
                  label: t("events.commercialState", {
                    defaultValue: "Commercial State",
                  }),
                  value:
                    latestContract?.status ||
                    latestQuotation?.status ||
                    t("events.noCommercialDocuments", {
                      defaultValue: "No quotation or contract created yet.",
                    }),
                  helper: commercialSummary || undefined,
                },
                {
                  label: t("events.downstreamArtifacts", {
                    defaultValue: "Downstream Artifacts",
                  }),
                  value: (
                    <div className="flex flex-wrap items-center gap-2">
                      {latestQuotation ? (
                        <button
                          type="button"
                          onClick={() => navigate(`/quotations/${latestQuotation.id}`)}
                          className="text-sm font-medium text-[var(--lux-gold)] hover:underline"
                        >
                          QT #{latestQuotation.id}
                        </button>
                      ) : null}
                      {latestContract ? (
                        <button
                          type="button"
                          onClick={() => navigate(`/contracts/${latestContract.id}`)}
                          className="text-sm font-medium text-[var(--lux-gold)] hover:underline"
                        >
                          CT #{latestContract.id}
                        </button>
                      ) : null}
                      {executionBrief ? (
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/execution-briefs/${executionBrief.id}`)
                          }
                          className="inline-flex items-center"
                        >
                          <WorkflowStatusBadge
                            entity="execution"
                            status={executionBrief.status}
                          />
                        </button>
                      ) : null}
                      {!latestQuotation && !latestContract && !executionBrief
                        ? t("events.noDownstreamArtifacts", {
                            defaultValue:
                              "No quotation, contract, or execution brief has been linked yet.",
                          })
                        : null}
                    </div>
                  ),
                  helper: executionBrief
                    ? t("events.executionBriefLinked", {
                        defaultValue: "Execution brief is already linked to this event.",
                      })
                    : t("events.executionBriefPending", {
                        defaultValue:
                          "Execution brief becomes relevant after commercial confirmation.",
                      }),
                },
              ]}
            />

            <ProtectedComponent permission="events.update">
              <WorkflowActionBar
                title={t("events.workflowActions", {
                  defaultValue: "Workflow Actions",
                })}
                description={t("events.workflowActionsHint", {
                  defaultValue:
                    "Move the event forward with explicit business actions instead of editing status manually.",
                })}
                actions={workflowActions}
              />
            </ProtectedComponent>

            <EventWorkspaceSummary
              t={t}
              dateLocale={dateLocale}
              servicesCount={sortedEventServiceItems.length}
              vendorsCount={sortedEventVendorLinks.length}
              latestQuotation={latestQuotation}
              latestContract={latestContract}
              readiness={operationalReadiness}
              onEditEvent={openEditEventDialog}
              onAddService={() => {
                setActiveTab("items");
                setServiceChecklistOpen(true);
              }}
              onAssignVendor={() => {
                setActiveTab("vendors");
                setVendorDialogOpen(true);
              }}
              onCreateQuotation={() => {
                setActiveTab("quotations");
                setCreateQuotationDialogOpen(true);
              }}
              onCreateContract={() => {
                setActiveTab("contracts");
                setCreateContractDialogOpen(true);
              }}
            />

            <div className="grid gap-4 xl:grid-cols-2">
              <WorkflowNextStepPanel
                title={t("events.nextStepsTitle", {
                  defaultValue: "Next Step Guidance",
                })}
                description={t("events.nextStepsHint", {
                  defaultValue:
                    "This panel calls out the most relevant follow-up based on the event's current workflow position and linked artifacts.",
                })}
                items={nextSteps}
              />

              <WorkflowTimeline
                title={t("events.timelineTitle", {
                  defaultValue: "Timeline & Action History",
                })}
                description={t("events.timelineHint", {
                  defaultValue:
                    "This history combines the event record with linked quotation, contract, and execution timestamps when available.",
                })}
                partialHistoryLabel={t("events.timelinePartial", {
                  defaultValue:
                    "This is a partial operational timeline. Full backend audit history is not available yet, so the latest reliable timestamps are used.",
                })}
                items={timelineItems}
                locale={dateLocale}
              />
            </div>

            <Tabs
              dir={i18n.dir()}
              value={activeTab}
              onValueChange={(value) =>
                setActiveTab(value as EventDetailsTabValue)
              }
              className="w-full"
            >
              <TabsList>
                <TabsTrigger value="items">
                  {t("events.itemsTab", { defaultValue: "Items / Services" })}
                </TabsTrigger>

                <TabsTrigger value="vendors">
                  {t("events.externalVendorsTab", {
                    defaultValue: "External Vendors",
                  })}
                </TabsTrigger>
                <TabsTrigger value="quotations">
                  {t("events.quotations", { defaultValue: "Quotations" })}
                </TabsTrigger>
                <TabsTrigger value="contracts">
                  {t("events.contracts", { defaultValue: "Contracts" })}
                </TabsTrigger>
                <TabsTrigger value="overview">
                  {t("events.overviewTab", { defaultValue: "Overview" })}
                </TabsTrigger>

                {/**
   *                 <TabsTrigger value="execution">
                  {t("events.executionTab", { defaultValue: "Execution" })}
                </TabsTrigger>
   */}
              </TabsList>

              <TabsContent value="overview">
                <EventOverviewPanel eventId={resolvedEventId ?? ""} />
              </TabsContent>

              <TabsContent value="items">
                <EventServicesPanel
                  eventId={resolvedEventId ?? ""}
                  onAdd={() => setServiceChecklistOpen(true)}
                  onEdit={(serviceItem) => {
                    setEditingServiceItem(serviceItem);
                    setServiceEditorOpen(true);
                  }}
                  onDelete={(serviceItem) =>
                    setDeleteServiceCandidate(serviceItem)
                  }
                />
              </TabsContent>

              <TabsContent value="vendors">
                <EventVendorsPanel
                  eventId={resolvedEventId ?? ""}
                  onAdd={() => setVendorDialogOpen(true)}
                  onEdit={(vendorLink) => {
                    setEditingVendorLink(vendorLink);
                    setVendorDialogOpen(true);
                  }}
                  onDelete={(vendorLink) =>
                    setDeleteVendorCandidate(vendorLink)
                  }
                />
              </TabsContent>

              <TabsContent value="quotations">
                <EventQuotationsPanel
                  eventId={resolvedEventId ?? ""}
                  onCreateQuotation={() => setCreateQuotationDialogOpen(true)}
                  onCreateQuotationFromEvent={() =>
                    setCreateQuotationDialogOpen(true)
                  }
                  onViewQuotation={undefined}
                />
              </TabsContent>

              <TabsContent value="contracts">
                <EventContractsPanel
                  eventId={resolvedEventId ?? ""}
                  onCreateContract={() => setCreateContractDialogOpen(true)}
                  onCreateContractFromQuotation={() =>
                    setCreateContractDialogOpen(true)
                  }
                  onViewContract={undefined}
                />
              </TabsContent>

              <TabsContent value="execution">
                <EventExecutionPanel eventId={resolvedEventId ?? ""} />
              </TabsContent>
            </Tabs>
          </div>
        </PageContainer>
      </ProtectedComponent>

      <EventEditDialog
        open={editEventDialogOpen}
        onOpenChange={setEditEventDialogOpen}
        form={editEventForm}
        setForm={setEditEventForm}
        error={editEventError}
        customers={customerCatalog}
        venues={venueCatalog}
        onSave={handleEventUpdateSave}
        isPending={updateEventMutation.isPending}
        variant="details"
        shellClassName="h-[min(88dvh,820px)]"
        labels={{
          title: t("events.editTitle", { defaultValue: "Edit Event" }),
          description: t("events.editDescription", {
            defaultValue: "Update event details, venue, and linked records.",
          }),
          customer: t("events.customer", { defaultValue: "Customer" }),
          selectCustomer: t("events.selectCustomer", {
            defaultValue: "Select customer",
          }),
          noCustomerSelected: t("events.noCustomerSelected", {
            defaultValue: "No customer selected",
          }),
          eventDate: t("events.eventDate", { defaultValue: "Event Date" }),
          venue: t("common.venue", { defaultValue: "Venue" }),
          selectVenue: t("events.selectVenue", {
            defaultValue: "Select venue",
          }),
          noVenueSelected: t("events.noVenueSelected", {
            defaultValue: "No venue selected",
          }),
          statusManagedByWorkflow: t("events.statusManagedByWorkflow", {
            defaultValue: "Status Managed by Workflow",
          }),
          statusManagedByWorkflowHint: t("events.statusManagedByWorkflowHint", {
            defaultValue:
              "Use the workflow action buttons on the event details page to change status safely.",
          }),
          titleField: t("events.titleField", { defaultValue: "Title" }),
          guestCount: t("events.guestCount", { defaultValue: "Guest Count" }),
          groomName: t("events.groomName", { defaultValue: "Groom Name" }),
          brideName: t("events.brideName", { defaultValue: "Bride Name" }),
          notes: t("common.notes", { defaultValue: "Notes" }),
          cancel: t("common.cancel", { defaultValue: "Cancel" }),
          submit: t("common.update", { defaultValue: "Update" }),
          processing: t("common.processing", {
            defaultValue: "Processing...",
          }),
        }}
      />

      <Dialog
        open={createQuotationDialogOpen}
        onOpenChange={setCreateQuotationDialogOpen}
      >
        <AppDialogShell size="lg" className="h-[min(88dvh,820px)]">
          <AppDialogHeader
            title={t("quotations.createFromEvent", {
              defaultValue: "Create From Event",
            })}
            description={t("events.quotationsHint", {
              defaultValue:
                "Review linked quotations and move quickly into quotation workflows for this event.",
            })}
          />
          <AppDialogBody className={dialogBodyClassName}>
            <div className={dialogSectionClassName}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className={fieldGroupClassName}>
                  <span className={fieldLabelClassName}>
                    {t("quotations.issueDate", { defaultValue: "Issue Date" })}
                  </span>
                  <Input
                    type="date"
                    value={quotationCreateForm.issueDate}
                    onChange={(event) =>
                      setQuotationCreateForm((current) => ({
                        ...current,
                        issueDate: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className={fieldGroupClassName}>
                  <span className={fieldLabelClassName}>
                    {t("quotations.validUntil", {
                      defaultValue: "Valid Until",
                    })}
                  </span>
                  <Input
                    type="date"
                    value={quotationCreateForm.validUntil}
                    onChange={(event) =>
                      setQuotationCreateForm((current) => ({
                        ...current,
                        validUntil: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>

              <div className="grid gap-3">
                <p className={fieldLabelClassName}>
                  {t("services.eventServices", {
                    defaultValue: "Event Services",
                  })}
                </p>
                {sortedEventServiceItems.map((item) => (
                  <label key={item.id} className={dialogCheckboxCardClassName}>
                    <Checkbox
                      checked={quotationCreateForm.eventServiceIds.includes(
                        String(item.id),
                      )}
                      onCheckedChange={(checked: CheckedState) =>
                        setQuotationCreateForm((current) => ({
                          ...current,
                          eventServiceIds:
                            checked === true
                              ? [
                                  ...new Set([
                                    ...current.eventServiceIds,
                                    String(item.id),
                                  ]),
                                ]
                              : current.eventServiceIds.filter(
                                  (value) => value !== String(item.id),
                                ),
                        }))
                      }
                    />
                    <span className="text-sm text-[var(--lux-text)]">
                      {item.service?.name || item.serviceNameSnapshot}
                    </span>
                  </label>
                ))}
              </div>

              <div className="grid gap-3">
                <p className={fieldLabelClassName}>
                  {t("vendors.eventVendors", { defaultValue: "Event Vendors" })}
                </p>
                {sortedEventVendorLinks.map((item) => (
                  <label key={item.id} className={dialogCheckboxCardClassName}>
                    <Checkbox
                      checked={quotationCreateForm.eventVendorIds.includes(
                        String(item.id),
                      )}
                      onCheckedChange={(checked: CheckedState) =>
                        setQuotationCreateForm((current) => ({
                          ...current,
                          eventVendorIds:
                            checked === true
                              ? [
                                  ...new Set([
                                    ...current.eventVendorIds,
                                    String(item.id),
                                  ]),
                                ]
                              : current.eventVendorIds.filter(
                                  (value) => value !== String(item.id),
                                ),
                        }))
                      }
                    />
                    <span className="text-sm text-[var(--lux-text)]">
                      {item.resolvedCompanyName ||
                        item.vendor?.name ||
                        item.companyNameSnapshot}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </AppDialogBody>
          <AppDialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setCreateQuotationDialogOpen(false)}
            >
              {t("common.cancel", { defaultValue: "Cancel" })}
            </Button>
            <Button
              onClick={handleCreateQuotationSave}
              disabled={createQuotationFromEventMutation.isPending}
            >
              {createQuotationFromEventMutation.isPending
                ? t("common.processing", { defaultValue: "Processing..." })
                : t("common.create", { defaultValue: "Create" })}
            </Button>
          </AppDialogFooter>
        </AppDialogShell>
      </Dialog>

      <Dialog
        open={createContractDialogOpen}
        onOpenChange={setCreateContractDialogOpen}
      >
        <AppDialogShell size="md" className="h-[min(88dvh,760px)]">
          <AppDialogHeader
            title={t("contracts.create", { defaultValue: "Create Contract" })}
            description={t("events.contractsHint", {
              defaultValue:
                "Review linked contracts and move quickly into contract workflows for this event.",
            })}
          />
          <AppDialogBody className={dialogBodyClassName}>
            <div className={dialogSectionClassName}>
              <label className={fieldGroupClassName}>
                <span className={fieldLabelClassName}>
                  {t("events.quotations", { defaultValue: "Quotations" })}
                </span>
                <Select
                  value={contractCreateForm.quotationId || "none"}
                  onValueChange={(value) =>
                    setContractCreateForm((current) => ({
                      ...current,
                      quotationId: value === "none" ? "" : value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      {t("contracts.noQuotation", {
                        defaultValue: "Create without quotation",
                      })}
                    </SelectItem>
                    {sortedEventQuotations.map((quotation) => (
                      <SelectItem
                        key={quotation.id}
                        value={String(quotation.id)}
                      >
                        {quotation.quotationNumber || `QT-${quotation.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>

              <label className={fieldGroupClassName}>
                <span className={fieldLabelClassName}>
                  {t("contracts.signedDate", { defaultValue: "Signed Date" })}
                </span>
                <Input
                  type="date"
                  value={contractCreateForm.signedDate}
                  onChange={(event) =>
                    setContractCreateForm((current) => ({
                      ...current,
                      signedDate: event.target.value,
                    }))
                  }
                />
              </label>
            </div>
          </AppDialogBody>
          <AppDialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setCreateContractDialogOpen(false)}
            >
              {t("common.cancel", { defaultValue: "Cancel" })}
            </Button>
            <Button
              onClick={handleCreateContractSave}
              disabled={
                createContractMutation.isPending ||
                createContractFromQuotationMutation.isPending
              }
            >
              {createContractMutation.isPending ||
              createContractFromQuotationMutation.isPending
                ? t("common.processing", { defaultValue: "Processing..." })
                : t("common.create", { defaultValue: "Create" })}
            </Button>
          </AppDialogFooter>
        </AppDialogShell>
      </Dialog>

      <Dialog
        open={vendorDialogOpen}
        onOpenChange={(open) => {
          setVendorDialogOpen(open);
          if (!open) {
            setEditingVendorLink(null);
          }
        }}
      >
        <AppDialogShell size="lg" className="h-[min(92dvh,920px)]">
          <AppDialogHeader
            title={
              editingVendorLink
                ? t("vendors.editVendorAssignment", {
                    defaultValue: "Edit Vendor Assignment",
                  })
                : t("vendors.assignVendor", {
                    defaultValue: "Assign Vendor",
                  })
            }
            description={t("vendors.vendorAssignmentHint", {
              defaultValue:
                "Link a catalog vendor or record a manual company snapshot for this event.",
            })}
          />

          <AppDialogBody className={dialogBodyClassName}>
            <div className="space-y-5">
              <div className={dialogSectionClassName}>
                <div className={dialogSectionHeaderClassName}>
                  <p className={dialogSectionTitleClassName}>
                    {t("vendors.vendorSetup", {
                      defaultValue: "Vendor Setup",
                    })}
                  </p>
                  <p className={helperTextClassName}>
                    {t("vendors.vendorSetupHint", {
                      defaultValue:
                        "Choose the vendor type, source, and assignment status before selecting sub-services.",
                    })}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <label className={fieldGroupClassName}>
                    <span className={fieldLabelClassName}>
                      {t("vendors.typeLabel", { defaultValue: "Vendor Type" })}
                    </span>
                    <Select
                      value={vendorForm.vendorType}
                      onValueChange={(value) =>
                        setVendorForm((current) => ({
                          ...current,
                          vendorId: "",
                          companyNameSnapshot: "",
                          selectedSubServiceIds: [],
                          agreedPrice: "",
                          isPriceOverride: false,
                          vendorType: value as VendorType,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VENDOR_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {t(`vendors.type.${option.value}`, {
                              defaultValue: option.label,
                            })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </label>

                  <label className={fieldGroupClassName}>
                    <span className={fieldLabelClassName}>
                      {t("vendors.providedByLabel", {
                        defaultValue: "Provided By",
                      })}
                    </span>
                    <Select
                      value={vendorForm.providedBy}
                      onValueChange={(value) =>
                        setVendorForm((current) => ({
                          ...current,
                          providedBy: value as EventVendorProvidedBy,
                          vendorId: value === "client" ? "" : current.vendorId,
                          selectedSubServiceIds:
                            value === "client"
                              ? []
                              : current.selectedSubServiceIds,
                          agreedPrice:
                            value === "client" ? "" : current.agreedPrice,
                          isPriceOverride:
                            value === "client"
                              ? false
                              : current.isPriceOverride,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EVENT_VENDOR_PROVIDED_BY_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {t(`vendors.providedBy.${option.value}`, {
                              defaultValue: option.label,
                            })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </label>

                  <label className={fieldGroupClassName}>
                    <span className={fieldLabelClassName}>
                      {t("vendors.assignmentStatusLabel", {
                        defaultValue: "Assignment Status",
                      })}
                    </span>
                    <Select
                      value={vendorForm.status}
                      onValueChange={(value) =>
                        setVendorForm((current) => ({
                          ...current,
                          status: value as EventVendorStatus,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EVENT_VENDOR_STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {t(`vendors.assignmentStatus.${option.value}`, {
                              defaultValue: option.label,
                            })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </label>
                </div>

                <div className={dialogInsetBoxClassName}>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">
                      {t(`vendors.providedBy.${vendorForm.providedBy}`, {
                        defaultValue:
                          vendorForm.providedBy === "company"
                            ? "Company"
                            : "Client",
                      })}
                    </Badge>
                    <Badge variant="outline">
                      {t(`vendors.type.${vendorForm.vendorType}`, {
                        defaultValue: formatVendorType(vendorForm.vendorType),
                      })}
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    {vendorForm.providedBy === "company" ? (
                      <>
                        <label className={fieldGroupClassName}>
                          <span className={fieldLabelClassName}>
                            {t("vendors.vendorSelection", {
                              defaultValue: "Catalog Vendor",
                            })}
                          </span>
                          <Select
                            value={vendorForm.vendorId || "none"}
                            onValueChange={(value) =>
                              setVendorForm((current) => {
                                const nextValue = value === "none" ? "" : value;
                                const selectedVendor =
                                  filteredVendorCatalog.find(
                                    (vendor) => String(vendor.id) === nextValue,
                                  );

                                return {
                                  ...current,
                                  vendorId: nextValue,
                                  selectedSubServiceIds: [],
                                  agreedPrice: "",
                                  isPriceOverride: false,
                                  companyNameSnapshot:
                                    selectedVendor?.name ||
                                    current.companyNameSnapshot,
                                };
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue
                                placeholder={t("vendors.selectVendor", {
                                  defaultValue: "Select vendor",
                                })}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">
                                {t("vendors.noVendorSelected", {
                                  defaultValue: "No catalog vendor selected",
                                })}
                              </SelectItem>
                              {filteredVendorCatalog.map((vendor) => (
                                <SelectItem
                                  key={vendor.id}
                                  value={String(vendor.id)}
                                >
                                  {vendor.name}
                                  {!vendor.isActive
                                    ? ` (${t("vendors.status.inactive", {
                                        defaultValue: "Inactive",
                                      })})`
                                    : ""}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </label>

                        {!filteredVendorCatalog.length ? (
                          <div className={dialogHintBoxClassName}>
                            {t("vendors.noVendorsForType", {
                              defaultValue:
                                "No catalog vendors are available for this vendor type yet. You can still save a company snapshot.",
                            })}
                          </div>
                        ) : null}

                        <label className={fieldGroupClassName}>
                          <span className={fieldLabelClassName}>
                            {t("vendors.companyNameSnapshot", {
                              defaultValue: "Company Name Snapshot",
                            })}
                          </span>
                          <Input
                            value={vendorForm.companyNameSnapshot}
                            onChange={(event) =>
                              setVendorForm((current) => ({
                                ...current,
                                companyNameSnapshot: event.target.value,
                              }))
                            }
                            placeholder={t(
                              "vendors.companyNameSnapshotPlaceholder",
                              {
                                defaultValue:
                                  "Optional override or fallback company name",
                              },
                            )}
                          />
                          <p className={helperTextClassName}>
                            {t("vendors.vendorSelectionHint", {
                              defaultValue:
                                "Choose a catalog vendor for this type, or keep a snapshot-only name when the booking needs a manual fallback.",
                            })}
                          </p>
                        </label>
                      </>
                    ) : (
                      <>
                        <div className={dialogHintBoxClassName}>
                          {t("vendors.clientVendorModeHint", {
                            defaultValue:
                              "Client mode keeps the vendor outside the company catalog. Enter the name exactly as shared by the client.",
                          })}
                        </div>
                        <label className={fieldGroupClassName}>
                          <span className={fieldLabelClassName}>
                            {t("vendors.companyNameSnapshot", {
                              defaultValue: "Client Vendor Name",
                            })}
                          </span>
                          <Input
                            value={vendorForm.companyNameSnapshot}
                            onChange={(event) =>
                              setVendorForm((current) => ({
                                ...current,
                                companyNameSnapshot: event.target.value,
                              }))
                            }
                            placeholder={t(
                              "vendors.companyNameSnapshotPlaceholder",
                              {
                                defaultValue:
                                  "Enter the vendor name provided by the client",
                              },
                            )}
                          />
                        </label>
                      </>
                    )}

                    <div className={dialogInsetBoxClassName}>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
                        {t("vendors.vendorPreview", {
                          defaultValue: "Current Display Name",
                        })}
                      </p>
                      <p className="mt-1 text-sm font-medium text-[var(--lux-text)]">
                        {resolvedVendorDraftName}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className={dialogSectionClassName}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className={dialogSectionHeaderClassName}>
                    <p className={dialogSectionTitleClassName}>
                      {t("vendors.selectedSubServices", {
                        defaultValue: "Selected Sub Services",
                      })}
                    </p>
                    <p className={helperTextClassName}>
                      {t("vendors.selectedSubServicesHint", {
                        defaultValue:
                          "Choose the reusable checklist items configured for the selected vendor. Active pricing is matched from that vendor's plan thresholds.",
                      })}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {t("vendors.selectedSubServicesCount", {
                      defaultValue: "Selected Count",
                    })}
                    : {vendorForm.selectedSubServiceIds.length}
                  </Badge>
                </div>

                {vendorForm.providedBy !== "company" ? (
                  <div className={dialogHintBoxClassName}>
                    {t("vendors.clientModeNoSubServices", {
                      defaultValue:
                        "Vendor sub-services are available only when a company vendor is selected.",
                    })}
                  </div>
                ) : !vendorForm.vendorId ? (
                  <div className={dialogHintBoxClassName}>
                    {t("vendors.selectVendorForSubServices", {
                      defaultValue:
                        "Select a company vendor to load that vendor's sub-services.",
                    })}
                  </div>
                ) : vendorSubServicesLoading ? (
                  <p className="text-sm text-[var(--lux-text-secondary)]">
                    {t("common.loading", { defaultValue: "Loading..." })}
                  </p>
                ) : availableVendorSubServices.length ? (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {availableVendorSubServices.map((subService) => {
                      const checked = vendorForm.selectedSubServiceIds.includes(
                        subService.id,
                      );

                      return (
                        <label
                          key={subService.id}
                          className="flex items-start gap-3 rounded-[18px] border p-3"
                          style={{
                            background: checked
                              ? "var(--lux-control-hover)"
                              : "var(--lux-panel-surface)",
                            borderColor: checked
                              ? "var(--lux-accent)"
                              : "var(--lux-row-border)",
                          }}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(nextChecked: CheckedState) =>
                              setVendorForm((current) => ({
                                ...current,
                                selectedSubServiceIds: nextChecked
                                  ? Array.from(
                                      new Set([
                                        ...current.selectedSubServiceIds,
                                        subService.id,
                                      ]),
                                    )
                                  : current.selectedSubServiceIds.filter(
                                      (id) => id !== subService.id,
                                    ),
                              }))
                            }
                          />
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-[var(--lux-text)]">
                              {subService.name}
                            </p>
                            <p className={helperTextClassName}>
                              {subService.description ||
                                subService.code ||
                                t("vendors.noDescription", {
                                  defaultValue: "No description",
                                })}
                              {!subService.isActive
                                ? ` - ${t("vendors.status.inactive", {
                                    defaultValue: "Inactive",
                                  })})`
                                : ""}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div
                    className="rounded-[18px] border border-dashed p-4 text-sm text-[var(--lux-text-secondary)]"
                    style={{
                      background: "var(--lux-panel-surface)",
                      borderColor: "var(--lux-row-border)",
                    }}
                  >
                    {t("vendors.noVendorSubServicesForType", {
                      defaultValue:
                        "No vendor sub-services are configured for this vendor yet.",
                    })}
                  </div>
                )}
              </div>

              <div className={dialogSectionClassName}>
                <div className={dialogSectionHeaderClassName}>
                  <p className={dialogSectionTitleClassName}>
                    {t("vendors.pricingSummary", {
                      defaultValue: "Pricing Summary",
                    })}
                  </p>
                  <p className={helperTextClassName}>
                    {t("vendors.pricingSummaryHint", {
                      defaultValue:
                        "The agreed price defaults to the sum of each selected sub-service list price. Enable override to enter a different amount.",
                    })}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className={dialogInsetBoxClassName}>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
                      {t("vendors.selectedSubServicesCount", {
                        defaultValue: "Selected Count",
                      })}
                    </p>
                    <p className="mt-1 text-sm font-medium text-[var(--lux-text)]">
                      {vendorForm.selectedSubServiceIds.length}
                    </p>
                  </div>

                  <div className={dialogInsetBoxClassName}>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
                      {t("vendors.calculatedPrice", {
                        defaultValue: "Calculated Price",
                      })}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[var(--lux-heading)]">
                      {vendorForm.providedBy === "company" &&
                      vendorForm.selectedSubServiceIds.length > 0
                        ? formatVendorMoney(calculatedSubServicesTotal)
                        : "-"}
                    </p>
                  </div>
                </div>

                {vendorForm.providedBy === "company" &&
                Boolean(vendorForm.vendorId) &&
                vendorForm.selectedSubServiceIds.length > 0 &&
                calculatedSubServicesTotal === 0 &&
                !vendorSubServicesLoading ? (
                  <div className={dialogHintBoxClassName}>
                    {t("vendors.subServicePricesMissingHint", {
                      defaultValue:
                        "Selected sub-services have no list price configured. Set prices on sub-services or use a manual override.",
                    })}
                  </div>
                ) : null}

                <label className={dialogCheckboxCardClassName}>
                  <Checkbox
                    checked={vendorForm.isPriceOverride}
                    onCheckedChange={(checked: CheckedState) =>
                      setVendorForm((current) => {
                        const nextChecked = Boolean(checked);

                        return {
                          ...current,
                          isPriceOverride: nextChecked,
                          agreedPrice: nextChecked
                            ? current.agreedPrice || calculatedVendorPriceInput
                            : calculatedVendorPriceInput,
                        };
                      })
                    }
                  />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[var(--lux-text)]">
                      {t("vendors.manualPriceOverride", {
                        defaultValue: "Manual Price Override",
                      })}
                    </p>
                    <p className="text-xs text-[var(--lux-text-secondary)]">
                      {t("vendors.manualPriceOverrideHint", {
                        defaultValue:
                          "Enable this only when the final agreed amount differs from the summed sub-service prices.",
                      })}
                    </p>
                  </div>
                </label>

                <label className={fieldGroupClassName}>
                  <span className={fieldLabelClassName}>
                    {t("vendors.agreedPrice", {
                      defaultValue: "Agreed Price",
                    })}
                  </span>
                  <Input
                    type="number"
                    min="0"
                    step="0.001"
                    value={vendorForm.agreedPrice}
                    disabled={!vendorForm.isPriceOverride}
                    onChange={(event) =>
                      setVendorForm((current) => ({
                        ...current,
                        agreedPrice: event.target.value,
                      }))
                    }
                    placeholder={t("vendors.agreedPricePlaceholder", {
                      defaultValue: "Calculated automatically when available",
                    })}
                  />
                  <p className="text-xs text-[var(--lux-text-secondary)]">
                    {vendorForm.isPriceOverride
                      ? t("vendors.manualPriceOverrideActiveHint", {
                          defaultValue:
                            "Manual override is active. The contract uses the amount you enter.",
                        })
                      : t("vendors.agreedPriceAutoHint", {
                          defaultValue:
                            "Agreed price follows the sum of selected sub-service prices until manual override is enabled.",
                        })}
                  </p>
                </label>
              </div>

              <div className={dialogSectionClassName}>
                <div className={dialogSectionHeaderClassName}>
                  <p className={dialogSectionTitleClassName}>
                    {t("vendors.notesAndStatus", {
                      defaultValue: "Notes",
                    })}
                  </p>
                  <p className={helperTextClassName}>
                    {t("vendors.notesAndStatusHint", {
                      defaultValue:
                        "Capture any assignment-specific details that the operations team should see later in Event Details.",
                    })}
                  </p>
                </div>

                <label className={fieldGroupClassName}>
                  <span className={fieldLabelClassName}>
                    {t("common.notes", { defaultValue: "Notes" })}
                  </span>
                  <textarea
                    className={textareaClassName}
                    value={vendorForm.notes}
                    onChange={(event) =>
                      setVendorForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                    placeholder={t("vendors.assignmentNotesPlaceholder", {
                      defaultValue:
                        "Add assignment notes, responsibilities, or coordination remarks...",
                    })}
                    style={{
                      background: "var(--lux-control-surface)",
                      borderColor: "var(--lux-control-border)",
                    }}
                  />
                </label>
              </div>
            </div>

            {vendorError ? (
              <p className="text-sm text-[var(--lux-danger)]">{vendorError}</p>
            ) : null}
          </AppDialogBody>

          <AppDialogFooter className="gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setVendorDialogOpen(false)}
              disabled={
                createEventVendorMutation.isPending ||
                updateEventVendorMutation.isPending
              }
            >
              {t("common.cancel", { defaultValue: "Cancel" })}
            </Button>
            <Button
              type="button"
              onClick={handleVendorSave}
              disabled={
                createEventVendorMutation.isPending ||
                updateEventVendorMutation.isPending
              }
            >
              {createEventVendorMutation.isPending ||
              updateEventVendorMutation.isPending
                ? t("common.processing", { defaultValue: "Processing..." })
                : editingVendorLink
                  ? t("common.update", { defaultValue: "Update" })
                  : t("common.create", { defaultValue: "Create" })}
            </Button>
          </AppDialogFooter>
        </AppDialogShell>
      </Dialog>

      <Dialog
        open={serviceEditorOpen}
        onOpenChange={(open) => {
          setServiceEditorOpen(open);
          if (!open) {
            setEditingServiceItem(null);
          }
        }}
      >
        <AppDialogShell size="md" className="h-[min(88dvh,760px)]">
          <AppDialogHeader
            title={t("services.editEventService", {
              defaultValue: "Edit Event Service",
            })}
            description={
              <>
                <span>
                  {t("services.editEventServiceHint", {
                    defaultValue: "Update the selected event service details.",
                  })}
                </span>
                <span className="block">
                  {t("services.eventServiceHint", {
                    defaultValue:
                      "Link a catalog service or record a manual service line for this event.",
                  })}
                </span>
              </>
            }
          />

          <AppDialogBody className={dialogBodyClassName}>
            <div className={dialogSectionClassName}>
              <div className={dialogSectionHeaderClassName}>
                <p className={dialogSectionTitleClassName}>
                  {t("services.serviceSetup", {
                    defaultValue: "Service Setup",
                  })}
                </p>
                <p className={helperTextClassName}>
                  {t("services.serviceSetupHint", {
                    defaultValue:
                      "Set the category, item status, and sort order before confirming the linked service line.",
                  })}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <label className={fieldGroupClassName}>
                  <span className={fieldLabelClassName}>
                    {t("services.categoryLabel", {
                      defaultValue: "Service Category",
                    })}
                  </span>
                  <Select
                    value={serviceForm.category}
                    onValueChange={(value) =>
                      setServiceForm((current) => ({
                        ...current,
                        category: value as ServiceCategory,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_CATEGORY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {t(`services.category.${option.value}`, {
                            defaultValue: option.label,
                          })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>

                <label className={fieldGroupClassName}>
                  <span className={fieldLabelClassName}>
                    {t("services.eventStatusLabel", {
                      defaultValue: "Item Status",
                    })}
                  </span>
                  <Select
                    value={serviceForm.status}
                    onValueChange={(value) =>
                      setServiceForm((current) => ({
                        ...current,
                        status: value as EventServiceStatus,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_SERVICE_STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {t(`services.eventStatus.${option.value}`, {
                            defaultValue: option.label,
                          })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>

                <label className={fieldGroupClassName}>
                  <span className={fieldLabelClassName}>
                    {t("services.sortOrder", { defaultValue: "Sort Order" })}
                  </span>
                  <Input
                    type="number"
                    min="0"
                    value={serviceForm.sortOrder}
                    onChange={(event) =>
                      setServiceForm((current) => ({
                        ...current,
                        sortOrder: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>
            </div>

            <div className={dialogSectionClassName}>
              <label className={fieldGroupClassName}>
                <span className={fieldLabelClassName}>
                  {t("services.serviceSelection", {
                    defaultValue: "Catalog Service",
                  })}
                </span>
                <Select
                  value={serviceForm.serviceId || "none"}
                  onValueChange={(value) =>
                    setServiceForm((current) => {
                      const nextValue = value === "none" ? "" : value;
                      const selectedService = serviceCatalog.find(
                        (service) => String(service.id) === nextValue,
                      );

                      return {
                        ...current,
                        serviceId: nextValue,
                        serviceNameSnapshot:
                          selectedService?.name || current.serviceNameSnapshot,
                        category: selectedService?.category || current.category,
                      };
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("services.selectService", {
                        defaultValue: "Select service",
                      })}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      {t("services.noServiceSelected", {
                        defaultValue: "No catalog service selected",
                      })}
                    </SelectItem>
                    {selectableServiceCatalog.map((service) => (
                      <SelectItem key={service.id} value={String(service.id)}>
                        {service.name}
                        {!service.isActive
                          ? ` (${t("services.status.inactive", {
                              defaultValue: "Inactive",
                            })})`
                          : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className={helperTextClassName}>
                  {t("services.serviceSelectionHint", {
                    defaultValue:
                      "Choose a service from the catalog when available, or leave it empty and type the service name manually.",
                  })}
                </p>
              </label>

              <label className={fieldGroupClassName}>
                <span className={fieldLabelClassName}>
                  {t("services.serviceNameSnapshot", {
                    defaultValue: "Service Name",
                  })}
                </span>
                <Input
                  value={serviceForm.serviceNameSnapshot}
                  onChange={(event) =>
                    setServiceForm((current) => ({
                      ...current,
                      serviceNameSnapshot: event.target.value,
                    }))
                  }
                  placeholder={t("services.serviceNameSnapshotPlaceholder", {
                    defaultValue:
                      "Enter service name if the item is not in the catalog",
                  })}
                />
              </label>

              <label className={fieldGroupClassName}>
                <span className={fieldLabelClassName}>
                  {t("common.notes", { defaultValue: "Notes" })}
                </span>
                <textarea
                  className={textareaClassName}
                  value={serviceForm.notes}
                  onChange={(event) =>
                    setServiceForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  placeholder={t("services.eventNotesPlaceholder", {
                    defaultValue:
                      "Add service notes, scope details, or internal coordination remarks...",
                  })}
                  style={{
                    background: "var(--lux-control-surface)",
                    borderColor: "var(--lux-control-border)",
                  }}
                />
              </label>
            </div>

            {serviceError ? (
              <p className="text-sm text-[var(--lux-danger)]">{serviceError}</p>
            ) : null}
          </AppDialogBody>

          <AppDialogFooter className="gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setServiceEditorOpen(false)}
              disabled={
                createEventServiceMutation.isPending ||
                updateEventServiceMutation.isPending
              }
            >
              {t("common.cancel", { defaultValue: "Cancel" })}
            </Button>
            <Button
              type="button"
              onClick={handleServiceSave}
              disabled={
                createEventServiceMutation.isPending ||
                updateEventServiceMutation.isPending
              }
            >
              {createEventServiceMutation.isPending ||
              updateEventServiceMutation.isPending
                ? t("common.processing", { defaultValue: "Processing..." })
                : t("common.update", { defaultValue: "Update" })}
            </Button>
          </AppDialogFooter>
        </AppDialogShell>
      </Dialog>

      <EventServicesChecklistDialog
        open={serviceChecklistOpen}
        onOpenChange={(open) => {
          setServiceChecklistOpen(open);
        }}
        eventId={event.id}
        existingServiceIds={existingEventServiceIds}
      />

      <ConfirmDialog
        open={Boolean(pendingWorkflowAction)}
        onOpenChange={(open) => !open && setPendingWorkflowAction(null)}
        title={
          pendingWorkflowAction?.confirmTitle ||
          t("events.confirmWorkflowAction", {
            defaultValue: "Confirm Workflow Action",
          })
        }
        message={
          pendingWorkflowAction?.confirmMessage ||
          pendingWorkflowAction?.description ||
          t("events.confirmWorkflowActionHint", {
            defaultValue:
              "This event will move to the next workflow stage.",
          })
        }
        confirmLabel={
          pendingWorkflowAction?.label ||
          t("common.confirm", { defaultValue: "Confirm" })
        }
        cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
        onConfirm={handleConfirmWorkflowAction}
        isPending={workflowActionMutation.isPending}
      />

      <DeleteEventVendorConfirmDialog
        open={deleteVendorCandidate !== null}
        onOpenChange={(open) => !open && setDeleteVendorCandidate(null)}
        title={t("vendors.deleteLinkTitle", {
          defaultValue: "Delete Vendor Assignment",
        })}
        message={t("vendors.deleteLinkMessage", {
          defaultValue:
            "Are you sure you want to delete this vendor assignment?",
        })}
        confirmLabel={t("common.delete", { defaultValue: "Delete" })}
        cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
        onConfirm={confirmDeleteVendor}
        isPending={deleteEventVendorMutation.isPending}
      />

      <DeleteEventServiceConfirmDialog
        open={deleteServiceCandidate !== null}
        onOpenChange={(open) => !open && setDeleteServiceCandidate(null)}
        title={t("services.deleteEventItemTitle", {
          defaultValue: "Delete Event Service",
        })}
        message={t("services.deleteEventItemMessage", {
          defaultValue:
            "Are you sure you want to delete this event service item?",
        })}
        confirmLabel={t("common.delete", { defaultValue: "Delete" })}
        cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
        onConfirm={confirmDeleteService}
        isPending={deleteEventServiceMutation.isPending}
      />
    </>
  );
};

export default EventDetailsPage;
