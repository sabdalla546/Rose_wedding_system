import { useEffect, useMemo, useState } from "react";
import { ar, enUS } from "date-fns/locale";
import type { CheckedState } from "@radix-ui/react-checkbox";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { PageContainer } from "@/components/layout/page-container";
import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
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
import {
  useCreateEventSection,
  useDeleteEventSection,
  useUpdateEventSection,
} from "@/hooks/events/useEventSectionMutations";
import { useEvent } from "@/hooks/events/useEvents";
import { useContracts } from "@/hooks/contracts/useContracts";
import { useQuotations } from "@/hooks/quotations/useQuotations";
import {
  useCreateEventService,
  useDeleteEventService,
  useUpdateEventService,
} from "@/hooks/services/useEventServiceMutations";
import {
  useEventServiceItems,
  useServices,
} from "@/hooks/services/useServices";
import {
  useCreateEventVendor,
  useDeleteEventVendor,
  useUpdateEventVendor,
} from "@/hooks/vendors/useEventVendorMutations";
import { useVendorPricingPlans } from "@/hooks/vendors/useVendorPricingPlans";
import { useVendorSubServices } from "@/hooks/vendors/useVendorSubServices";
import { EventBusinessDocsPanels } from "./_components/EventBusinessDocsPanels";
import { EventDetailsHero } from "./_components/EventDetailsHero";
import { EventSectionsPanel } from "./_components/EventSectionsPanel";
import { EventServicesChecklistDialog } from "./_components/EventServicesChecklistDialog";
import { EventServicesPanel } from "./_components/EventServicesPanel";
import { EventVendorsPanel } from "./_components/EventVendorsPanel";
import {
  EVENT_SERVICE_STATUS_OPTIONS,
  formatMoney,
  SERVICE_CATEGORY_OPTIONS,
  toNumberValue,
} from "@/pages/services/adapters";
import type {
  EventServiceItem,
  EventServiceStatus,
  ServiceCategory,
} from "@/pages/services/types";
import { useEventVendorLinks, useVendors } from "@/hooks/vendors/useVendors";
import {
  EVENT_VENDOR_PROVIDED_BY_OPTIONS,
  EVENT_VENDOR_STATUS_OPTIONS,
  formatVendorType,
  getEventVendorDisplayName,
  VENDOR_TYPE_OPTIONS,
} from "@/pages/vendors/adapters";
import type {
  EventVendorLink,
  EventVendorProvidedBy,
  EventVendorStatus,
  VendorPricingPlan,
  VendorType,
} from "@/pages/vendors/types";

import { EVENT_SECTION_TYPE_OPTIONS } from "./adapters";
import type { EventSection, EventSectionType } from "./types";

type SectionFormState = {
  sectionType: EventSectionType;
  title: string;
  sortOrder: string;
  dataText: string;
  notes: string;
  isCompleted: boolean;
};

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

const textareaClassName =
  "min-h-[110px] w-full rounded-[22px] border px-4 py-3 text-sm text-[var(--lux-text)] placeholder:text-[var(--lux-text-muted)] outline-none transition-all focus:border-[var(--lux-gold-border)] focus:ring-2 focus:ring-[var(--lux-gold-glow)] sm:min-h-[130px]";
const fieldGroupClassName = "space-y-2";
const fieldLabelClassName = "text-sm font-medium text-[var(--lux-text)]";
const helperTextClassName = "text-xs leading-5 text-[var(--lux-text-secondary)]";
const dialogBodyClassName = "space-y-5";
const dialogSectionClassName =
  "space-y-4 rounded-[24px] border border-[var(--lux-row-border)] bg-[var(--lux-row-surface)] p-4 sm:p-5";
const dialogSectionHeaderClassName = "space-y-1.5";
const dialogSectionTitleClassName = "text-sm font-semibold text-[var(--lux-text)]";
const dialogHintBoxClassName =
  "rounded-[18px] border border-dashed border-[var(--lux-row-border)] bg-[var(--lux-control-hover)] p-3 text-sm text-[var(--lux-text-secondary)]";
const dialogInsetBoxClassName =
  "rounded-[18px] border border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)] px-4 py-3";
const dialogCheckboxCardClassName =
  "flex items-center gap-3 rounded-[18px] border border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)] p-4";

const createDefaultSectionState = (sortOrder = 0): SectionFormState => ({
  sectionType: "client_info",
  title: "",
  sortOrder: String(sortOrder),
  dataText: "{}",
  notes: "",
  isCompleted: false,
});

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

const findMatchingVendorPricingPlan = (
  pricingPlans: VendorPricingPlan[],
  selectedSubServicesCount: number,
) => {
  if (selectedSubServicesCount <= 0) {
    return null;
  }

  return (
    [...pricingPlans]
      .sort((left, right) => {
        if (left.minSubServices !== right.minSubServices) {
          return right.minSubServices - left.minSubServices;
        }

        const leftMax =
          typeof left.maxSubServices === "number"
            ? left.maxSubServices
            : Number.MAX_SAFE_INTEGER;
        const rightMax =
          typeof right.maxSubServices === "number"
            ? right.maxSubServices
            : Number.MAX_SAFE_INTEGER;

        if (leftMax !== rightMax) {
          return leftMax - rightMax;
        }

        return left.id - right.id;
      })
      .find((plan) => {
        const matchesMin = plan.minSubServices <= selectedSubServicesCount;
        const matchesMax =
          plan.maxSubServices === null ||
          typeof plan.maxSubServices === "undefined" ||
          plan.maxSubServices >= selectedSubServicesCount;

        return matchesMin && matchesMax;
      }) ?? null
  );
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

const EventDetailsPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: event, isLoading } = useEvent(id);
  const dateLocale = i18n.language === "ar" ? ar : enUS;

  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<EventSection | null>(
    null,
  );
  const [deleteCandidate, setDeleteCandidate] = useState<EventSection | null>(
    null,
  );
  const [sectionError, setSectionError] = useState("");
  const [sectionForm, setSectionForm] = useState<SectionFormState>(
    createDefaultSectionState(),
  );
  const [vendorDialogOpen, setVendorDialogOpen] = useState(false);
  const [editingVendorLink, setEditingVendorLink] =
    useState<EventVendorLink | null>(null);
  const [deleteVendorCandidate, setDeleteVendorCandidate] =
    useState<EventVendorLink | null>(null);
  const [expandedVendorIds, setExpandedVendorIds] = useState<number[]>([]);
  const [vendorError, setVendorError] = useState("");
  const [vendorForm, setVendorForm] = useState<EventVendorFormState>(
    createDefaultEventVendorState(),
  );
  const [serviceChecklistOpen, setServiceChecklistOpen] = useState(false);
  const [serviceEditorOpen, setServiceEditorOpen] = useState(false);
  const [editingServiceItem, setEditingServiceItem] =
    useState<EventServiceItem | null>(null);
  const [deleteServiceCandidate, setDeleteServiceCandidate] =
    useState<EventServiceItem | null>(null);
  const [serviceError, setServiceError] = useState("");
  const [serviceForm, setServiceForm] = useState<EventServiceFormState>(
    createDefaultEventServiceState(),
  );

  const createSectionMutation = useCreateEventSection();
  const updateSectionMutation = useUpdateEventSection(Number(id || 0));
  const deleteSectionMutation = useDeleteEventSection(Number(id || 0));
  const createEventServiceMutation = useCreateEventService();
  const updateEventServiceMutation = useUpdateEventService(Number(id || 0));
  const deleteEventServiceMutation = useDeleteEventService(Number(id || 0));
  const createEventVendorMutation = useCreateEventVendor(Number(id || 0));
  const updateEventVendorMutation = useUpdateEventVendor(Number(id || 0));
  const deleteEventVendorMutation = useDeleteEventVendor(Number(id || 0));
  const { data: vendorCatalogResponse } = useVendors({
    currentPage: 1,
    itemsPerPage: 200,
    searchQuery: "",
    type: "all",
    isActive: "all",
  });
  const { data: eventVendorLinksResponse, isLoading: eventVendorLinksLoading } =
    useEventVendorLinks({
      currentPage: 1,
      itemsPerPage: 200,
      eventId: Number(id || 0),
      vendorType: "all",
      providedBy: "all",
      status: "all",
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
  const {
    data: vendorPricingPlansResponse,
    isLoading: vendorPricingPlansLoading,
  } = useVendorPricingPlans({
    currentPage: 1,
    itemsPerPage: 200,
    searchQuery: "",
    vendorId: vendorForm.vendorId ? Number(vendorForm.vendorId) : undefined,
    vendorType: "all",
    isActive: "true",
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
    data: eventServiceItemsResponse,
    isLoading: eventServiceItemsLoading,
  } = useEventServiceItems({
    currentPage: 1,
    itemsPerPage: 200,
    eventId: Number(id || 0),
    category: "all",
    status: "all",
  });
  const { data: eventQuotationsResponse, isLoading: eventQuotationsLoading } =
    useQuotations({
      currentPage: 1,
      itemsPerPage: 200,
      searchQuery: "",
      eventId: String(id || ""),
      status: "all",
      issueDateFrom: "",
      issueDateTo: "",
    });
  const { data: eventContractsResponse, isLoading: eventContractsLoading } =
    useContracts({
      currentPage: 1,
      itemsPerPage: 200,
      searchQuery: "",
      quotationId: "",
      eventId: String(id || ""),
      status: "all",
      signedDateFrom: "",
      signedDateTo: "",
  });
  const vendorCatalog = vendorCatalogResponse?.data ?? [];
  const vendorSubServices = vendorSubServicesResponse?.data ?? [];
  const vendorPricingPlans = vendorPricingPlansResponse?.data ?? [];
  const serviceCatalog = serviceCatalogResponse?.data ?? [];

  const sortedSections = useMemo(
    () =>
      [...(event?.sections ?? [])].sort((left, right) => {
        if (left.sortOrder !== right.sortOrder) {
          return left.sortOrder - right.sortOrder;
        }

        return left.id - right.id;
      }),
    [event?.sections],
  );
  const sortedEventVendorLinks = useMemo(
    () =>
      [...(eventVendorLinksResponse?.data ?? [])].sort((left, right) => {
        if (left.vendorType !== right.vendorType) {
          return left.vendorType.localeCompare(right.vendorType);
        }

        return getEventVendorDisplayName(left).localeCompare(
          getEventVendorDisplayName(right),
        );
      }),
    [eventVendorLinksResponse?.data],
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
  const calculatedVendorPricingPlan = useMemo(
    () =>
      findMatchingVendorPricingPlan(
        vendorPricingPlans,
        vendorForm.selectedSubServiceIds.length,
      ),
    [vendorPricingPlans, vendorForm.selectedSubServiceIds.length],
  );
  const calculatedVendorPriceInput = useMemo(
    () => formatDecimalInput(calculatedVendorPricingPlan?.price),
    [calculatedVendorPricingPlan?.price],
  );
  const sortedEventServiceItems = useMemo(
    () =>
      [...(eventServiceItemsResponse?.data ?? [])].sort((left, right) => {
        if (left.sortOrder !== right.sortOrder) {
          return left.sortOrder - right.sortOrder;
        }

        return left.id - right.id;
      }),
    [eventServiceItemsResponse?.data],
  );
  const existingEventServiceIds = useMemo(
    () =>
      sortedEventServiceItems
        .map((item) => item.serviceId)
        .filter((value): value is number => typeof value === "number"),
    [sortedEventServiceItems],
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
  const eventServiceSummary = useMemo(
    () =>
      sortedEventServiceItems.reduce(
        (summary) => ({
          itemsCount: summary.itemsCount + 1,
        }),
        {
          itemsCount: 0,
        },
      ),
    [sortedEventServiceItems],
  );
  const sortedEventQuotations = useMemo(
    () =>
      [...(eventQuotationsResponse?.data ?? [])].sort((left, right) => {
        const leftTime = new Date(left.issueDate).getTime();
        const rightTime = new Date(right.issueDate).getTime();

        if (leftTime !== rightTime) {
          return rightTime - leftTime;
        }

        return right.id - left.id;
      }),
    [eventQuotationsResponse?.data],
  );
  const quotationSummary = useMemo(
    () =>
      sortedEventQuotations.reduce(
        (summary, quotation) => ({
          itemsCount: summary.itemsCount + 1,
          totalAmount: Number(
            (
              summary.totalAmount + (toNumberValue(quotation.totalAmount) ?? 0)
            ).toFixed(3),
          ),
        }),
        {
          itemsCount: 0,
          totalAmount: 0,
        },
      ),
    [sortedEventQuotations],
  );
  const sortedEventContracts = useMemo(
    () =>
      [...(eventContractsResponse?.data ?? [])].sort((left, right) => {
        const leftTime = new Date(left.signedDate).getTime();
        const rightTime = new Date(right.signedDate).getTime();

        if (leftTime !== rightTime) {
          return rightTime - leftTime;
        }

        return right.id - left.id;
      }),
    [eventContractsResponse?.data],
  );
  const contractSummary = useMemo(
    () =>
      sortedEventContracts.reduce(
        (summary, contract) => ({
          itemsCount: summary.itemsCount + 1,
          totalAmount: Number(
            (
              summary.totalAmount + (toNumberValue(contract.totalAmount) ?? 0)
            ).toFixed(3),
          ),
        }),
        {
          itemsCount: 0,
          totalAmount: 0,
        },
      ),
    [sortedEventContracts],
  );

  useEffect(() => {
    if (!sectionDialogOpen) {
      setEditingSection(null);
      setSectionError("");
      setSectionForm(createDefaultSectionState(sortedSections.length));
      return;
    }

    if (!editingSection) {
      setSectionForm(createDefaultSectionState(sortedSections.length));
      return;
    }

    setSectionForm({
      sectionType: editingSection.sectionType,
      title: editingSection.title ?? "",
      sortOrder: String(editingSection.sortOrder ?? 0),
      dataText: JSON.stringify(editingSection.data ?? {}, null, 2),
      notes: editingSection.notes ?? "",
      isCompleted: editingSection.isCompleted,
    });
  }, [editingSection, sectionDialogOpen, sortedSections.length]);

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
          : editingVendorLink.agreedPrice !== null &&
            typeof editingVendorLink.agreedPrice !== "undefined" &&
            toNumberValue(editingVendorLink.agreedPrice) !==
              toNumberValue(editingVendorLink.pricingPlan?.price),
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

  const handleSectionSave = () => {
    if (!id) {
      return;
    }

    const sortOrder = Number(sectionForm.sortOrder || 0);
    if (!Number.isInteger(sortOrder) || sortOrder < 0) {
      setSectionError(
        t("events.sectionSortOrderInvalid", {
          defaultValue: "Sort order must be zero or greater.",
        }),
      );
      return;
    }

    let parsedData: Record<string, unknown>;
    try {
      const parsed = JSON.parse(sectionForm.dataText || "{}");
      if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
        throw new Error("invalid");
      }
      parsedData = parsed as Record<string, unknown>;
    } catch {
      setSectionError(
        t("events.sectionDataInvalid", {
          defaultValue: "Section data must be valid JSON object.",
        }),
      );
      return;
    }

    setSectionError("");

    const payload = {
      sectionType: sectionForm.sectionType,
      title: sectionForm.title,
      sortOrder,
      data: parsedData,
      notes: sectionForm.notes,
      isCompleted: sectionForm.isCompleted,
    };

    if (editingSection) {
      updateSectionMutation.mutate(
        { id: editingSection.id, values: payload },
        { onSuccess: () => setSectionDialogOpen(false) },
      );
      return;
    }

    createSectionMutation.mutate(
      { eventId: Number(id), ...payload },
      { onSuccess: () => setSectionDialogOpen(false) },
    );
  };

  const handleVendorSave = () => {
    if (!id) {
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

    if (
      !vendorForm.vendorId &&
      vendorForm.selectedSubServiceIds.length > 0
    ) {
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
      eventId: Number(id),
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
    if (!id) {
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
      eventId: Number(id),
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

  return (
    <>
      <ProtectedComponent permission="events.read">
        <PageContainer className="pb-4 pt-4 text-foreground">
          <div
            dir={i18n.dir()}
            className="mx-auto w-full max-w-6xl space-y-6"
          >
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
              />

              <EventSectionsPanel
                sections={sortedSections}
                t={t}
                onAdd={() => setSectionDialogOpen(true)}
                onEdit={(section) => {
                  setEditingSection(section);
                  setSectionDialogOpen(true);
                }}
                onDelete={(section) => setDeleteCandidate(section)}
              />

              <EventVendorsPanel
                vendorLinks={sortedEventVendorLinks}
                loading={eventVendorLinksLoading}
                expandedVendorIds={expandedVendorIds}
                t={t}
                onAdd={() => setVendorDialogOpen(true)}
                onEdit={(vendorLink) => {
                  setEditingVendorLink(vendorLink);
                  setVendorDialogOpen(true);
                }}
                onDelete={(vendorLink) => setDeleteVendorCandidate(vendorLink)}
                onToggleExpanded={(vendorId) =>
                  setExpandedVendorIds((current) =>
                    current.includes(vendorId)
                      ? current.filter((value) => value !== vendorId)
                      : [...current, vendorId],
                  )
                }
              />

              <EventServicesPanel
                serviceItems={sortedEventServiceItems}
                loading={eventServiceItemsLoading}
                summary={eventServiceSummary}
                t={t}
                onAdd={() => setServiceChecklistOpen(true)}
                onEdit={(serviceItem) => {
                  setEditingServiceItem(serviceItem);
                  setServiceEditorOpen(true);
                }}
                onDelete={(serviceItem) => setDeleteServiceCandidate(serviceItem)}
              />

              <EventBusinessDocsPanels
                quotations={sortedEventQuotations}
                quotationsLoading={eventQuotationsLoading}
                quotationSummary={quotationSummary}
                contracts={sortedEventContracts}
                contractsLoading={eventContractsLoading}
                contractSummary={contractSummary}
                dateLocale={dateLocale}
                t={t}
                onCreateQuotation={() =>
                  navigate(`/quotations/create?eventId=${event.id}`)
                }
                onCreateQuotationFromEvent={() =>
                  navigate(`/quotations/create?mode=from-event&eventId=${event.id}`)
                }
                onViewQuotation={(quotationId) =>
                  navigate(`/quotations/${quotationId}`)
                }
                onCreateContract={() =>
                  navigate(`/contracts/create?eventId=${event.id}`)
                }
                onCreateContractFromQuotation={() =>
                  navigate(
                    `/contracts/create?mode=from-quotation&eventId=${event.id}`,
                  )
                }
                onViewContract={(contractId) =>
                  navigate(`/contracts/${contractId}`)
                }
              />
            </div>
          </PageContainer>
        </ProtectedComponent>

        <Dialog
          open={sectionDialogOpen}
          onOpenChange={(open) => {
            setSectionDialogOpen(open);
            if (!open) {
              setEditingSection(null);
            }
          }}
        >
          <AppDialogShell size="md" className="h-[min(88dvh,760px)]">
            <AppDialogHeader
              title={
                editingSection
                  ? t("events.editSection", { defaultValue: "Edit Section" })
                  : t("events.addSection", { defaultValue: "Add Section" })
              }
              description={t("events.sectionDialogHint", {
                defaultValue:
                  "Keep section notes clean and use JSON only for structured planning data.",
              })}
            />

            <AppDialogBody className={dialogBodyClassName}>
              <div className={dialogSectionClassName}>
                <div className={dialogSectionHeaderClassName}>
                  <p className={dialogSectionTitleClassName}>
                    {t("events.sectionSetup", { defaultValue: "Section Setup" })}
                  </p>
                  <p className={helperTextClassName}>
                    {t("events.sectionSetupHint", {
                      defaultValue:
                        "Define the section type, title, and ordering before adding structured values.",
                    })}
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className={fieldGroupClassName}>
                <span className={fieldLabelClassName}>
                  {t("events.sectionTypeLabel", {
                    defaultValue: "Section Type",
                  })}
                </span>
                <Select
                  value={sectionForm.sectionType}
                  onValueChange={(value) =>
                    setSectionForm((current) => ({
                      ...current,
                      sectionType: value as EventSectionType,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_SECTION_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {t(`events.sectionType.${option.value}`, {
                          defaultValue: option.label,
                        })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>

              <label className={fieldGroupClassName}>
                <span className={fieldLabelClassName}>
                  {t("events.sortOrder", { defaultValue: "Sort Order" })}
                </span>
                <Input
                  type="number"
                  min="0"
                  value={sectionForm.sortOrder}
                  onChange={(event) =>
                    setSectionForm((current) => ({
                      ...current,
                      sortOrder: event.target.value,
                    }))
                  }
                />
              </label>
            </div>

            <label className={fieldGroupClassName}>
              <span className={fieldLabelClassName}>
              {t("events.sectionTitle", { defaultValue: "Title" })}
              </span>
              <Input
                value={sectionForm.title}
                onChange={(event) =>
                  setSectionForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                placeholder={t("events.sectionTitlePlaceholder", {
                  defaultValue: "Enter a section title",
                })}
              />
            </label>
              </div>

              <div className={dialogSectionClassName}>
                <div className={dialogSectionHeaderClassName}>
                  <p className={dialogSectionTitleClassName}>
                    {t("events.sectionContent", { defaultValue: "Section Content" })}
                  </p>
                  <p className={helperTextClassName}>
                    {t("events.sectionContentHint", {
                      defaultValue:
                        "Use structured JSON for operational values and plain notes for planner context.",
                    })}
                  </p>
                </div>

            <label className={fieldGroupClassName}>
              <span className={fieldLabelClassName}>
                {t("events.sectionData", { defaultValue: "Structured Data" })}
              </span>
              <textarea
                className={textareaClassName}
                value={sectionForm.dataText}
                onChange={(event) =>
                  setSectionForm((current) => ({
                    ...current,
                    dataText: event.target.value,
                  }))
                }
                placeholder='{"notes":"Add structured values here"}'
                style={{
                  background: "var(--lux-control-surface)",
                  borderColor: "var(--lux-control-border)",
                }}
              />
            </label>

            <label className={fieldGroupClassName}>
              <span className={fieldLabelClassName}>
                {t("common.notes", { defaultValue: "Notes" })}
              </span>
              <textarea
                className={textareaClassName}
                value={sectionForm.notes}
                onChange={(event) =>
                  setSectionForm((current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
                placeholder={t("events.sectionNotesPlaceholder", {
                  defaultValue: "Add section notes or planner remarks...",
                })}
                style={{
                  background: "var(--lux-control-surface)",
                  borderColor: "var(--lux-control-border)",
                }}
              />
            </label>

            <label className={dialogCheckboxCardClassName}>
              <Checkbox
                checked={sectionForm.isCompleted}
                onCheckedChange={(checked: CheckedState) =>
                  setSectionForm((current) => ({
                    ...current,
                    isCompleted: Boolean(checked),
                  }))
                }
              />
              <span className="text-sm text-[var(--lux-text)]">
                {t("events.completed", { defaultValue: "Completed" })}
              </span>
            </label>
              </div>

              {sectionError ? (
                <p className="text-sm text-[var(--lux-danger)]">{sectionError}</p>
              ) : null}

            </AppDialogBody>

            <AppDialogFooter className="gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSectionDialogOpen(false)}
                disabled={
                  createSectionMutation.isPending ||
                  updateSectionMutation.isPending
                }
              >
                {t("common.cancel", { defaultValue: "Cancel" })}
              </Button>
              <Button
                type="button"
                onClick={handleSectionSave}
                disabled={
                  createSectionMutation.isPending ||
                  updateSectionMutation.isPending
                }
              >
                {createSectionMutation.isPending ||
                updateSectionMutation.isPending
                  ? t("common.processing", { defaultValue: "Processing..." })
                  : editingSection
                    ? t("common.update", { defaultValue: "Update" })
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
                                })}`
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
                        "Pricing plans are resolved from the selected vendor and stay visible for reference even if you override the agreed price manually.",
                    })}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className={dialogInsetBoxClassName}>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
                      {t("vendors.pricingPlans.name", {
                        defaultValue: "Pricing Plan",
                      })}
                    </p>
                    <p className="mt-1 text-sm font-medium text-[var(--lux-text)]">
                      {vendorForm.providedBy !== "company"
                        ? t("vendors.clientModeNoPricingPlan", {
                            defaultValue:
                              "No auto pricing in client mode without a linked vendor",
                          })
                        : !vendorForm.vendorId
                          ? t("vendors.selectVendorForPricing", {
                              defaultValue:
                                "Select a company vendor to load pricing plans",
                            })
                          : vendorPricingPlansLoading
                        ? t("common.loading", { defaultValue: "Loading..." })
                        : calculatedVendorPricingPlan?.name ||
                          (vendorForm.selectedSubServiceIds.length
                            ? t("vendors.noMatchingPricingPlan", {
                                defaultValue: "No matching pricing plan",
                              })
                            : t("vendors.noPricingPlan", {
                                defaultValue: "No pricing plan selected",
                              }))}
                    </p>
                  </div>

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
                      {calculatedVendorPricingPlan
                        ? formatMoney(calculatedVendorPricingPlan.price)
                        : "-"}
                    </p>
                  </div>
                </div>

                {vendorForm.providedBy === "company" &&
                Boolean(vendorForm.vendorId) &&
                vendorForm.selectedSubServiceIds.length > 0 &&
                !calculatedVendorPricingPlan &&
                !vendorPricingPlansLoading ? (
                  <div className={dialogHintBoxClassName}>
                    {t("vendors.noMatchingPricingPlan", {
                      defaultValue: "No matching pricing plan",
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
                          "Enable this only when the final agreed amount differs from the matched pricing plan.",
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
                            "Manual override is active. The matched pricing plan remains linked for reference.",
                        })
                      : t("vendors.agreedPriceAutoHint", {
                      defaultValue:
                          "Agreed price follows the matched pricing plan until manual override is enabled.",
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
          open={deleteCandidate !== null}
          onOpenChange={(open) => !open && setDeleteCandidate(null)}
          title={t("events.deleteSectionTitle", {
            defaultValue: "Delete Section",
          })}
          message={t("events.deleteSectionMessage", {
            defaultValue: "Are you sure you want to delete this section?",
          })}
          confirmLabel={t("common.delete", { defaultValue: "Delete" })}
          cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
          onConfirm={() =>
            deleteCandidate &&
            deleteSectionMutation.mutate(deleteCandidate.id, {
              onSettled: () => setDeleteCandidate(null),
            })
          }
          isPending={deleteSectionMutation.isPending}
        />

        <ConfirmDialog
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
          onConfirm={() =>
            deleteVendorCandidate &&
            deleteEventVendorMutation.mutate(deleteVendorCandidate.id, {
              onSettled: () => setDeleteVendorCandidate(null),
            })
          }
          isPending={deleteEventVendorMutation.isPending}
        />

        <ConfirmDialog
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
          onConfirm={() =>
            deleteServiceCandidate &&
            deleteEventServiceMutation.mutate(deleteServiceCandidate.id, {
              onSettled: () => setDeleteServiceCandidate(null),
            })
          }
          isPending={deleteEventServiceMutation.isPending}
        />
      </>
    );
  };
export default EventDetailsPage;

