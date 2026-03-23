import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import type { CheckedState } from "@radix-ui/react-checkbox";
import {
  CalendarRange,
  CheckCircle2,
  Edit,
  GripVertical,
  Link2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { PageContainer } from "@/components/layout/page-container";
import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import { SectionCard } from "@/components/shared/section-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import ConfirmDialog from "@/components/ui/confirmDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { EventServicesChecklistDialog } from "./_components/EventServicesChecklistDialog";
import {
  EVENT_SERVICE_STATUS_OPTIONS,
  formatMoney,
  formatServiceCategory,
  getEventServiceDisplayName,
  SERVICE_CATEGORY_OPTIONS,
  toNumberValue,
} from "@/pages/services/adapters";
import { EventServiceStatusBadge } from "@/pages/services/_components/eventServiceStatusBadge";
import type {
  EventServiceItem,
  EventServiceStatus,
  ServiceCategory,
} from "@/pages/services/types";
import { getContractDisplayNumber } from "@/pages/contracts/adapters";
import { ContractStatusBadge } from "@/pages/contracts/_components/contractStatusBadge";
import { getQuotationDisplayNumber } from "@/pages/quotations/adapters";
import { QuotationStatusBadge } from "@/pages/quotations/_components/quotationStatusBadge";
import { useEventVendorLinks, useVendors } from "@/hooks/vendors/useVendors";
import {
  EVENT_VENDOR_PROVIDED_BY_OPTIONS,
  EVENT_VENDOR_STATUS_OPTIONS,
  formatVendorType,
  getEventVendorDisplayName,
  VENDOR_TYPE_OPTIONS,
} from "@/pages/vendors/adapters";
import { EventVendorStatusBadge } from "@/pages/vendors/_components/eventVendorStatusBadge";
import type {
  EventVendorLink,
  EventVendorProvidedBy,
  EventVendorStatus,
  VendorPricingPlan,
  VendorType,
} from "@/pages/vendors/types";

import {
  EVENT_SECTION_TYPE_OPTIONS,
  formatEventSectionType,
  getEventDisplayTitle,
} from "./adapters";
import { EventStatusBadge } from "./_components/eventStatusBadge";
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

const eventDialogContentClassName =
  "max-h-[calc(100vh-1rem)] gap-3 overflow-y-auto p-4 sm:max-w-2xl sm:gap-4 sm:p-6";

const eventDialogHeaderClassName = "pr-12";

const eventDialogFooterClassName =
  "gap-2 pt-2 [&>button]:w-full sm:[&>button]:w-auto";

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

function DetailItem({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
        {label}
      </p>
      <p className="text-sm text-[var(--lux-text)]">{value || "-"}</p>
    </div>
  );
}

function renderDataValue(value: unknown) {
  if (value === null || typeof value === "undefined" || value === "") {
    return "-";
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  return JSON.stringify(value);
}

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
    vendorType: vendorForm.vendorType,
    isActive: "all",
  });
  const {
    data: vendorPricingPlansResponse,
    isLoading: vendorPricingPlansLoading,
  } = useVendorPricingPlans({
    currentPage: 1,
    itemsPerPage: 200,
    searchQuery: "",
    vendorType: vendorForm.vendorType,
    isActive: "true",
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
              <button
                type="button"
                onClick={() => navigate("/events")}
                className="inline-flex items-center gap-2 text-sm text-[var(--lux-text-secondary)] transition-colors hover:text-[var(--lux-gold)]"
              >
                {"<-"}{" "}
                {t("events.backToEvents", { defaultValue: "Back to Events" })}
              </button>

              <SectionCard className="space-y-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-[18px] border"
                      style={{
                        background: "var(--lux-control-hover)",
                        borderColor: "var(--lux-control-border)",
                        color: "var(--lux-gold)",
                      }}
                    >
                      <CalendarRange className="h-6 w-6" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl font-bold text-[var(--lux-heading)]">
                          {getEventDisplayTitle(event)}
                        </h1>
                        <EventStatusBadge status={event.status} />
                      </div>
                      <p className="text-sm text-[var(--lux-text-secondary)]">
                        {format(new Date(event.eventDate), "MMM d, yyyy", {
                          locale: dateLocale,
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <ProtectedComponent permission="events.update">
                      <Button
                        onClick={() => navigate(`/events/edit/${event.id}`)}
                      >
                        <Edit className="h-4 w-4" />
                        {t("common.edit", { defaultValue: "Edit" })}
                      </Button>
                    </ProtectedComponent>
                    {event.customerId ? (
                      <ProtectedComponent permission="customers.read">
                        <Button
                          variant="outline"
                          onClick={() =>
                            navigate(`/customers/${event.customerId}`)
                          }
                        >
                          <Link2 className="h-4 w-4" />
                          {t("events.viewCustomer", {
                            defaultValue: "View Customer",
                          })}
                        </Button>
                      </ProtectedComponent>
                    ) : null}
                  </div>
                </div>
              </SectionCard>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {t("events.generalInfo", {
                        defaultValue: "General Info",
                      })}
                    </CardTitle>
                    <CardDescription>
                      {t("events.generalInfoCardHint", {
                        defaultValue:
                          "Core event details, planning names, and contract information.",
                      })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    <DetailItem
                      label={t("events.eventDate", {
                        defaultValue: "Event Date",
                      })}
                      value={format(new Date(event.eventDate), "MMM d, yyyy", {
                        locale: dateLocale,
                      })}
                    />
                    <DetailItem
                      label={t("events.titleField", { defaultValue: "Title" })}
                      value={event.title}
                    />
                    <DetailItem
                      label={t("events.groomName", {
                        defaultValue: "Groom Name",
                      })}
                      value={event.groomName}
                    />
                    <DetailItem
                      label={t("events.brideName", {
                        defaultValue: "Bride Name",
                      })}
                      value={event.brideName}
                    />
                    <DetailItem
                      label={t("events.guestCount", {
                        defaultValue: "Guest Count",
                      })}
                      value={event.guestCount}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>
                      {t("events.linkedRecords", {
                        defaultValue: "Linked Records",
                      })}
                    </CardTitle>
                    <CardDescription>
                      {t("events.linkedRecordsCardHint", {
                        defaultValue:
                          "Customer, venue, and current event status.",
                      })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    <DetailItem
                      label={t("events.customer", { defaultValue: "Customer" })}
                      value={event.customer?.fullName}
                    />
                    <DetailItem
                      label={t("common.venue", { defaultValue: "Venue" })}
                      value={event.venue?.name || event.venueNameSnapshot}
                    />
                    <DetailItem
                      label={t("events.statusLabel", {
                        defaultValue: "Status",
                      })}
                      value={t(`events.status.${event.status}`, {
                        defaultValue: event.status,
                      })}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>
                      {t("events.auditTrail", { defaultValue: "Audit Trail" })}
                    </CardTitle>
                    <CardDescription>
                      {t("events.auditTrailHint", {
                        defaultValue:
                          "Who created the event and when it was last updated.",
                      })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    <DetailItem
                      label={t("events.createdBy", {
                        defaultValue: "Created By",
                      })}
                      value={event.createdByUser?.fullName}
                    />
                    <DetailItem
                      label={t("events.updatedBy", {
                        defaultValue: "Updated By",
                      })}
                      value={event.updatedByUser?.fullName}
                    />
                    <DetailItem
                      label={t("events.createdAt", {
                        defaultValue: "Created At",
                      })}
                      value={
                        event.createdAt
                          ? format(new Date(event.createdAt), "MMM d, yyyy p", {
                              locale: dateLocale,
                            })
                          : "-"
                      }
                    />
                    <DetailItem
                      label={t("events.updatedAt", {
                        defaultValue: "Updated At",
                      })}
                      value={
                        event.updatedAt
                          ? format(new Date(event.updatedAt), "MMM d, yyyy p", {
                              locale: dateLocale,
                            })
                          : "-"
                      }
                    />
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>
                    {t("common.notes", { defaultValue: "Notes" })}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--lux-text-secondary)]">
                    {event.notes ||
                      t("events.noNotes", {
                        defaultValue: "No notes added yet.",
                      })}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle>
                      {t("events.sectionsTitle", {
                        defaultValue: "Event Sections",
                      })}
                    </CardTitle>
                    <CardDescription>
                      {t("events.sectionsHint", {
                        defaultValue:
                          "Manage the ordered planning sections for this event.",
                      })}
                    </CardDescription>
                  </div>
                  <ProtectedComponent permission="events.update">
                    <Button onClick={() => setSectionDialogOpen(true)}>
                      <Plus className="h-4 w-4" />
                      {t("events.addSection", { defaultValue: "Add Section" })}
                    </Button>
                  </ProtectedComponent>
                </CardHeader>
                <CardContent className="space-y-3">
                  {sortedSections.length ? (
                    sortedSections.map((section) => (
                      <div
                        key={section.id}
                        className="rounded-[22px] border p-4"
                        style={{
                          background: "var(--lux-row-surface)",
                          borderColor: "var(--lux-row-border)",
                        }}
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)] px-3 py-1 text-xs font-medium text-[var(--lux-text)]">
                                <GripVertical className="h-3.5 w-3.5 text-[var(--lux-text-muted)]" />
                                {t(
                                  `events.sectionType.${section.sectionType}`,
                                  {
                                    defaultValue: formatEventSectionType(
                                      section.sectionType,
                                    ),
                                  },
                                )}
                              </span>
                              <span className="rounded-full border border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)] px-3 py-1 text-xs text-[var(--lux-text-secondary)]">
                                {t("events.sortOrder", {
                                  defaultValue: "Sort Order",
                                })}
                                : {section.sortOrder}
                              </span>
                              {section.isCompleted ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-[color:color-mix(in_srgb,#059669_34%,transparent)] bg-[color:color-mix(in_srgb,#059669_14%,transparent)] px-3 py-1 text-xs text-[#047857]">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  {t("events.completed", {
                                    defaultValue: "Completed",
                                  })}
                                </span>
                              ) : null}
                            </div>

                            <h3 className="text-base font-semibold text-[var(--lux-heading)]">
                              {section.title ||
                                t(`events.sectionType.${section.sectionType}`, {
                                  defaultValue: formatEventSectionType(
                                    section.sectionType,
                                  ),
                                })}
                            </h3>

                            {Object.keys(section.data ?? {}).length ? (
                              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                {Object.entries(section.data ?? {}).map(
                                  ([key, value]) => (
                                    <div
                                      key={key}
                                      className="rounded-2xl border px-4 py-3"
                                      style={{
                                        background: "var(--lux-panel-surface)",
                                        borderColor: "var(--lux-row-border)",
                                      }}
                                    >
                                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
                                        {key.replace(/_/g, " ")}
                                      </p>
                                      <p className="mt-1 whitespace-pre-wrap break-words text-sm text-[var(--lux-text)]">
                                        {renderDataValue(value)}
                                      </p>
                                    </div>
                                  ),
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-[var(--lux-text-secondary)]">
                                {t("events.emptySectionData", {
                                  defaultValue:
                                    "No structured data added to this section yet.",
                                })}
                              </p>
                            )}

                            {section.notes ? (
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
                                  {t("common.notes", { defaultValue: "Notes" })}
                                </p>
                                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[var(--lux-text-secondary)]">
                                  {section.notes}
                                </p>
                              </div>
                            ) : null}
                          </div>

                          <ProtectedComponent permission="events.update">
                            <div className="flex flex-wrap gap-2">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setEditingSection(section);
                                  setSectionDialogOpen(true);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                                {t("common.edit", { defaultValue: "Edit" })}
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => setDeleteCandidate(section)}
                              >
                                <Trash2 className="h-4 w-4" />
                                {t("common.delete", { defaultValue: "Delete" })}
                              </Button>
                            </div>
                          </ProtectedComponent>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[var(--lux-text-secondary)]">
                      {t("events.noSections", {
                        defaultValue:
                          "No sections have been added to this event yet.",
                      })}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle>
                      {t("vendors.eventVendors", {
                        defaultValue: "Event Vendors",
                      })}
                    </CardTitle>
                    <CardDescription>
                      {t("vendors.eventVendorsHint", {
                        defaultValue:
                          "Track which company or client is responsible for each vendor category in this event.",
                      })}
                    </CardDescription>
                  </div>
                  <ProtectedComponent permission="events.update">
                    <Button onClick={() => setVendorDialogOpen(true)}>
                      <Plus className="h-4 w-4" />
                      {t("vendors.assignVendor", {
                        defaultValue: "Assign Vendor",
                      })}
                    </Button>
                  </ProtectedComponent>
                </CardHeader>
                <CardContent className="space-y-4">
                  {eventVendorLinksLoading ? (
                    <p className="text-sm text-[var(--lux-text-secondary)]">
                      {t("common.loading", { defaultValue: "Loading..." })}
                    </p>
                  ) : sortedEventVendorLinks.length ? (
                    sortedEventVendorLinks.map((vendorLink) => (
                      <article
                        key={vendorLink.id}
                        className="rounded-[24px] border p-4 shadow-sm"
                        style={{
                          background:
                            "linear-gradient(180deg, color-mix(in srgb, var(--lux-row-surface) 85%, var(--lux-panel-surface)), var(--lux-panel-surface))",
                          borderColor: "var(--lux-row-border)",
                        }}
                      >
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0 flex-1 space-y-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline">
                                {t(`vendors.type.${vendorLink.vendorType}`, {
                                  defaultValue: formatVendorType(
                                    vendorLink.vendorType,
                                  ),
                                })}
                              </Badge>
                              <Badge variant="secondary">
                                {t(
                                  `vendors.providedBy.${vendorLink.providedBy}`,
                                  {
                                    defaultValue: vendorLink.providedBy,
                                  },
                                )}
                              </Badge>
                              {vendorLink.hasManualPriceOverride ? (
                                <Badge variant="outline">
                                  {t("vendors.manualPriceOverride", {
                                    defaultValue: "Manual Price",
                                  })}
                                </Badge>
                              ) : null}
                              <EventVendorStatusBadge
                                status={vendorLink.status}
                              />
                            </div>

                            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,0.9fr)]">
                              <div className="space-y-2">
                                <div className="space-y-1">
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
                                    {t("vendors.resolvedCompanyName", {
                                      defaultValue: "Resolved Company / Vendor",
                                    })}
                                  </p>
                                  <h3 className="break-words text-lg font-semibold text-[var(--lux-heading)]">
                                    {vendorLink.resolvedCompanyName ||
                                      getEventVendorDisplayName(vendorLink)}
                                  </h3>
                                </div>

                                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-[var(--lux-text-secondary)]">
                                  <span>
                                    {t("vendors.providedByLabel", {
                                      defaultValue: "Provided By",
                                    })}
                                    {": "}
                                    {t(
                                      `vendors.providedBy.${vendorLink.providedBy}`,
                                      {
                                        defaultValue: vendorLink.providedBy,
                                      },
                                    )}
                                  </span>
                                  {vendorLink.vendor ? (
                                    <span>
                                      {[ 
                                        vendorLink.vendor.contactPerson,
                                        vendorLink.vendor.phone,
                                      ]
                                        .filter(Boolean)
                                        .join(" / ") ||
                                        vendorLink.vendor.email ||
                                        "-"}
                                    </span>
                                  ) : vendorLink.providedBy === "client" ? (
                                    <span>
                                      {t("vendors.clientProvidedVendor", {
                                        defaultValue: "Client-provided vendor",
                                      })}
                                    </span>
                                  ) : null}
                                </div>
                              </div>

                              <div
                                className="grid grid-cols-1 gap-3 rounded-[20px] border p-4 sm:grid-cols-3 lg:grid-cols-1"
                                style={{
                                  background: "var(--lux-panel-surface)",
                                  borderColor: "var(--lux-row-border)",
                                }}
                              >
                                <div className="space-y-1">
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
                                    {t("vendors.pricingPlans.name", {
                                      defaultValue: "Pricing Plan",
                                    })}
                                  </p>
                                  <p className="text-sm font-medium text-[var(--lux-text)]">
                                    {vendorLink.resolvedPricingLabel ||
                                      (vendorLink.selectedSubServicesCount > 0
                                        ? t("vendors.noMatchingPricingPlan", {
                                            defaultValue:
                                              "No matching pricing plan",
                                          })
                                        : t("vendors.noPricingPlan", {
                                            defaultValue:
                                              "No pricing plan selected",
                                          }))}
                                  </p>
                                </div>

                                <div className="space-y-1">
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
                                    {t("vendors.selectedSubServicesCount", {
                                      defaultValue: "Selected Count",
                                    })}
                                  </p>
                                  <p className="text-sm font-medium text-[var(--lux-text)]">
                                    {vendorLink.selectedSubServicesCount}
                                  </p>
                                </div>

                                <div className="space-y-1">
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
                                    {t("vendors.agreedPrice", {
                                      defaultValue: "Agreed Price",
                                    })}
                                  </p>
                                  <p className="text-base font-semibold text-[var(--lux-heading)]">
                                    {vendorLink.agreedPrice !== null &&
                                    typeof vendorLink.agreedPrice !== "undefined"
                                      ? formatMoney(vendorLink.agreedPrice)
                                      : "-"}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
                                  {t("vendors.selectedSubServices", {
                                    defaultValue: "Selected Sub Services",
                                  })}
                                </p>
                                {vendorLink.selectedSubServices?.length ? (
                                  <>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                      {(expandedVendorIds.includes(vendorLink.id)
                                        ? vendorLink.selectedSubServices
                                        : vendorLink.selectedSubServices.slice(
                                            0,
                                            6,
                                          )
                                      ).map((selectedSubService) => (
                                        <span
                                          key={selectedSubService.id}
                                          className="rounded-full border border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)] px-3 py-1 text-xs text-[var(--lux-text-secondary)]"
                                        >
                                          {selectedSubService.nameSnapshot}
                                        </span>
                                      ))}
                                    </div>
                                    {vendorLink.selectedSubServices.length > 6 ? (
                                      <div className="mt-2">
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          className="h-auto px-0 py-0 text-xs text-[var(--lux-text-secondary)]"
                                          onClick={() =>
                                            setExpandedVendorIds((current) =>
                                              current.includes(vendorLink.id)
                                                ? current.filter(
                                                    (value) =>
                                                      value !== vendorLink.id,
                                                  )
                                                : [...current, vendorLink.id],
                                            )
                                          }
                                        >
                                          {expandedVendorIds.includes(
                                            vendorLink.id,
                                          )
                                            ? t("common.showLess", {
                                                defaultValue: "Show less",
                                              })
                                            : t("common.showMore", {
                                                defaultValue:
                                                  "Show all sub-services",
                                              })}
                                        </Button>
                                      </div>
                                    ) : null}
                                  </>
                                ) : (
                                  <p className="mt-1 text-sm text-[var(--lux-text-secondary)]">
                                    {t("vendors.noSelectedSubServices", {
                                      defaultValue:
                                        "No sub-services selected for this vendor.",
                                    })}
                                  </p>
                                )}
                              </div>
                            </div>

                            {vendorLink.notes ? (
                              <div className="rounded-[18px] border p-3" style={{
                                background: "var(--lux-panel-surface)",
                                borderColor: "var(--lux-row-border)",
                              }}>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
                                  {t("common.notes", { defaultValue: "Notes" })}
                                </p>
                                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[var(--lux-text-secondary)]">
                                  {vendorLink.notes}
                                </p>
                              </div>
                            ) : null}
                          </div>

                          <ProtectedComponent permission="events.update">
                            <div className="flex flex-wrap gap-2">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setEditingVendorLink(vendorLink);
                                  setVendorDialogOpen(true);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                                {t("common.edit", { defaultValue: "Edit" })}
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() =>
                                  setDeleteVendorCandidate(vendorLink)
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                                {t("common.delete", { defaultValue: "Delete" })}
                              </Button>
                            </div>
                          </ProtectedComponent>
                        </div>
                      </article>
                    ))
                  ) : (
                    <div
                      className="rounded-[22px] border px-5 py-8 text-center"
                      style={{
                        background: "var(--lux-panel-surface)",
                        borderColor: "var(--lux-row-border)",
                      }}
                    >
                      <p className="text-base font-semibold text-[var(--lux-heading)]">
                        {t("vendors.noEventVendorsTitle", {
                          defaultValue: "No vendor assignments yet",
                        })}
                      </p>
                      <p className="mt-2 text-sm text-[var(--lux-text-secondary)]">
                        {t("vendors.noEventVendors", {
                          defaultValue:
                            "Add the first vendor assignment to capture company ownership, selected sub-services, and pricing for this event.",
                        })}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle>
                      {t("services.eventServices", {
                        defaultValue: "Event Services",
                      })}
                    </CardTitle>
                    <CardDescription>
                      {t("services.eventServicesHint", {
                        defaultValue:
                          "Track the selected services and operational line items for this event.",
                      })}
                    </CardDescription>
                  </div>
                  <ProtectedComponent permission="events.update">
                    <Button onClick={() => setServiceChecklistOpen(true)}>
                      <Plus className="h-4 w-4" />
                      {t("services.addEventService", {
                        defaultValue: "Add Event Service",
                      })}
                    </Button>
                  </ProtectedComponent>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div
                      className="rounded-2xl border px-4 py-3"
                      style={{
                        background: "var(--lux-panel-surface)",
                        borderColor: "var(--lux-row-border)",
                      }}
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
                        {t("services.summaryItems", {
                          defaultValue: "Items",
                        })}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[var(--lux-heading)]">
                        {eventServiceSummary.itemsCount}
                      </p>
                    </div>
                  </div>

                  {eventServiceItemsLoading ? (
                    <p className="text-sm text-[var(--lux-text-secondary)]">
                      {t("common.loading", { defaultValue: "Loading..." })}
                    </p>
                  ) : sortedEventServiceItems.length ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {sortedEventServiceItems.map((serviceItem) => (
                        <div
                          key={serviceItem.id}
                          className="flex h-full flex-col justify-between rounded-[22px] border p-4"
                          style={{
                            background: "var(--lux-row-surface)",
                            borderColor: "var(--lux-row-border)",
                          }}
                        >
                          <div className="space-y-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full border border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)] px-3 py-1 text-xs text-[var(--lux-text-secondary)]">
                                {t(
                                  `services.category.${serviceItem.category}`,
                                  {
                                    defaultValue: formatServiceCategory(
                                      serviceItem.category,
                                    ),
                                  },
                                )}
                              </span>
                              <span className="rounded-full border border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)] px-3 py-1 text-xs text-[var(--lux-text-secondary)]">
                                {t("services.sortOrder", {
                                  defaultValue: "Sort Order",
                                })}
                                : {serviceItem.sortOrder}
                              </span>
                              <EventServiceStatusBadge
                                status={serviceItem.status}
                              />
                            </div>

                            <div className="space-y-1">
                              <h3 className="text-lg font-semibold leading-7 text-[var(--lux-heading)]">
                                {getEventServiceDisplayName(serviceItem)}
                              </h3>
                              {serviceItem.service?.code ? (
                                <p className="text-sm text-[var(--lux-text-secondary)]">
                                  {serviceItem.service.code}
                                </p>
                              ) : null}
                            </div>

                            {serviceItem.notes ? (
                              <p className="text-sm leading-6 text-[var(--lux-text-secondary)]">
                                {serviceItem.notes}
                              </p>
                            ) : null}
                          </div>

                          <ProtectedComponent permission="events.update">
                            <div className="mt-4 flex flex-wrap gap-2 pt-2">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setEditingServiceItem(serviceItem);
                                  setServiceEditorOpen(true);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                                {t("common.edit", { defaultValue: "Edit" })}
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() =>
                                  setDeleteServiceCandidate(serviceItem)
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                                {t("common.delete", { defaultValue: "Delete" })}
                              </Button>
                            </div>
                          </ProtectedComponent>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--lux-text-secondary)]">
                      {t("services.noEventServices", {
                        defaultValue:
                          "No service items have been added to this event yet.",
                      })}
                    </p>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-1">
                        <CardTitle>
                          {t("events.quotations", {
                            defaultValue: "Quotations",
                          })}
                        </CardTitle>
                        <CardDescription>
                          {t("events.quotationsHint", {
                            defaultValue:
                              "Review linked quotations and move quickly into quotation workflows for this event.",
                          })}
                        </CardDescription>
                      </div>

                      <ProtectedComponent permission="quotations.create">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            onClick={() =>
                              navigate(`/quotations/create?eventId=${event.id}`)
                            }
                          >
                            <Plus className="h-4 w-4" />
                            {t("quotations.create", {
                              defaultValue: "Create Quotation",
                            })}
                          </Button>
                          <Button
                            onClick={() =>
                              navigate(
                                `/quotations/create?mode=from-event&eventId=${event.id}`,
                              )
                            }
                          >
                            <Plus className="h-4 w-4" />
                            {t("quotations.createFromEvent", {
                              defaultValue: "Create From Event",
                            })}
                          </Button>
                        </div>
                      </ProtectedComponent>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {sortedEventQuotations.length > 0 ? (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div
                          className="rounded-2xl border px-4 py-3"
                          style={{
                            background: "var(--lux-panel-surface)",
                            borderColor: "var(--lux-row-border)",
                          }}
                        >
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
                            {t("events.quotationCount", {
                              defaultValue: "Quotation Count",
                            })}
                          </p>
                          <p className="mt-1 text-lg font-semibold text-[var(--lux-heading)]">
                            {quotationSummary.itemsCount}
                          </p>
                        </div>
                        <div
                          className="rounded-2xl border px-4 py-3"
                          style={{
                            background: "var(--lux-panel-surface)",
                            borderColor: "var(--lux-row-border)",
                          }}
                        >
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
                            {t("events.quotationTotalAmount", {
                              defaultValue: "Quoted Total",
                            })}
                          </p>
                          <p className="mt-1 text-lg font-semibold text-[var(--lux-heading)]">
                            {formatMoney(quotationSummary.totalAmount)}
                          </p>
                        </div>
                      </div>
                    ) : null}

                    {eventQuotationsLoading ? (
                      <p className="text-sm text-[var(--lux-text-secondary)]">
                        {t("common.loading", { defaultValue: "Loading..." })}
                      </p>
                    ) : sortedEventQuotations.length > 0 ? (
                      <div className="space-y-3">
                        {sortedEventQuotations.map((quotation) => (
                          <div
                            key={quotation.id}
                            className="rounded-[22px] border p-4"
                            style={{
                              background: "var(--lux-row-surface)",
                              borderColor: "var(--lux-row-border)",
                            }}
                          >
                            <div className="flex flex-col gap-4">
                              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                <div className="space-y-2">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-base font-semibold text-[var(--lux-heading)]">
                                      {getQuotationDisplayNumber(quotation)}
                                    </p>
                                    <QuotationStatusBadge
                                      status={quotation.status}
                                    />
                                  </div>
                                  <p className="text-sm text-[var(--lux-text-secondary)]">
                                    {quotation.customer?.fullName ||
                                      t("events.noQuotationParty", {
                                        defaultValue: "No customer linked",
                                      })}
                                  </p>
                                </div>

                                <ProtectedComponent permission="quotations.read">
                                  <Button
                                    variant="outline"
                                    onClick={() =>
                                      navigate(`/quotations/${quotation.id}`)
                                    }
                                  >
                                    <Link2 className="h-4 w-4" />
                                    {t("events.viewQuotation", {
                                      defaultValue: "View Quotation",
                                    })}
                                  </Button>
                                </ProtectedComponent>
                              </div>

                              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                                <div
                                  className="rounded-2xl border px-4 py-3"
                                  style={{
                                    background: "var(--lux-panel-surface)",
                                    borderColor: "var(--lux-row-border)",
                                  }}
                                >
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
                                    {t("quotations.issueDate", {
                                      defaultValue: "Issue Date",
                                    })}
                                  </p>
                                  <p className="mt-1 text-sm text-[var(--lux-text)]">
                                    {format(
                                      new Date(quotation.issueDate),
                                      "PPP",
                                      {
                                        locale: dateLocale,
                                      },
                                    )}
                                  </p>
                                </div>
                                <div
                                  className="rounded-2xl border px-4 py-3"
                                  style={{
                                    background: "var(--lux-panel-surface)",
                                    borderColor: "var(--lux-row-border)",
                                  }}
                                >
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
                                    {t("quotations.validUntil", {
                                      defaultValue: "Valid Until",
                                    })}
                                  </p>
                                  <p className="mt-1 text-sm text-[var(--lux-text)]">
                                    {quotation.validUntil
                                      ? format(
                                          new Date(quotation.validUntil),
                                          "PPP",
                                          {
                                            locale: dateLocale,
                                          },
                                        )
                                      : "-"}
                                  </p>
                                </div>
                                <div
                                  className="rounded-2xl border px-4 py-3"
                                  style={{
                                    background: "var(--lux-panel-surface)",
                                    borderColor: "var(--lux-row-border)",
                                  }}
                                >
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
                                    {t("quotations.subtotal", {
                                      defaultValue: "Subtotal",
                                    })}
                                  </p>
                                  <p className="mt-1 text-sm text-[var(--lux-text)]">
                                    {formatMoney(quotation.subtotal)}
                                  </p>
                                </div>
                                <div
                                  className="rounded-2xl border px-4 py-3"
                                  style={{
                                    background: "var(--lux-panel-surface)",
                                    borderColor: "var(--lux-row-border)",
                                  }}
                                >
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
                                    {t("quotations.totalAmount", {
                                      defaultValue: "Total Amount",
                                    })}
                                  </p>
                                  <p className="mt-1 text-sm font-semibold text-[var(--lux-heading)]">
                                    {formatMoney(quotation.totalAmount)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-[var(--lux-text-secondary)]">
                        {t("events.noQuotations", {
                          defaultValue:
                            "No quotations have been created for this event yet.",
                        })}
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-1">
                        <CardTitle>
                          {t("events.contracts", { defaultValue: "Contracts" })}
                        </CardTitle>
                        <CardDescription>
                          {t("events.contractsHint", {
                            defaultValue:
                              "Review linked contracts and move quickly into contract workflows for this event.",
                          })}
                        </CardDescription>
                      </div>

                      <ProtectedComponent permission="contracts.create">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            onClick={() =>
                              navigate(`/contracts/create?eventId=${event.id}`)
                            }
                          >
                            <Plus className="h-4 w-4" />
                            {t("contracts.create", {
                              defaultValue: "Create Contract",
                            })}
                          </Button>
                          <Button
                            onClick={() =>
                              navigate(
                                `/contracts/create?mode=from-quotation&eventId=${event.id}`,
                              )
                            }
                          >
                            <Plus className="h-4 w-4" />
                            {t("contracts.createFromQuotation", {
                              defaultValue: "Create From Quotation",
                            })}
                          </Button>
                        </div>
                      </ProtectedComponent>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {sortedEventContracts.length > 0 ? (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div
                          className="rounded-2xl border px-4 py-3"
                          style={{
                            background: "var(--lux-panel-surface)",
                            borderColor: "var(--lux-row-border)",
                          }}
                        >
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
                            {t("events.contractCount", {
                              defaultValue: "Contract Count",
                            })}
                          </p>
                          <p className="mt-1 text-lg font-semibold text-[var(--lux-heading)]">
                            {contractSummary.itemsCount}
                          </p>
                        </div>
                        <div
                          className="rounded-2xl border px-4 py-3"
                          style={{
                            background: "var(--lux-panel-surface)",
                            borderColor: "var(--lux-row-border)",
                          }}
                        >
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
                            {t("events.contractTotalAmount", {
                              defaultValue: "Contracted Total",
                            })}
                          </p>
                          <p className="mt-1 text-lg font-semibold text-[var(--lux-heading)]">
                            {formatMoney(contractSummary.totalAmount)}
                          </p>
                        </div>
                      </div>
                    ) : null}

                    {eventContractsLoading ? (
                      <p className="text-sm text-[var(--lux-text-secondary)]">
                        {t("common.loading", { defaultValue: "Loading..." })}
                      </p>
                    ) : sortedEventContracts.length > 0 ? (
                      <div className="space-y-3">
                        {sortedEventContracts.map((contract) => (
                          <div
                            key={contract.id}
                            className="rounded-[22px] border p-4"
                            style={{
                              background: "var(--lux-row-surface)",
                              borderColor: "var(--lux-row-border)",
                            }}
                          >
                            <div className="flex flex-col gap-4">
                              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                <div className="space-y-2">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-base font-semibold text-[var(--lux-heading)]">
                                      {getContractDisplayNumber(contract)}
                                    </p>
                                    <ContractStatusBadge
                                      status={contract.status}
                                    />
                                  </div>
                                  <p className="text-sm text-[var(--lux-text-secondary)]">
                                    {contract.customer?.fullName ||
                                      t("events.noContractParty", {
                                        defaultValue: "No customer linked",
                                      })}
                                  </p>
                                </div>

                                <ProtectedComponent permission="contracts.read">
                                  <Button
                                    variant="outline"
                                    onClick={() =>
                                      navigate(`/contracts/${contract.id}`)
                                    }
                                  >
                                    <Link2 className="h-4 w-4" />
                                    {t("events.viewContract", {
                                      defaultValue: "View Contract",
                                    })}
                                  </Button>
                                </ProtectedComponent>
                              </div>

                              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                                <div
                                  className="rounded-2xl border px-4 py-3"
                                  style={{
                                    background: "var(--lux-panel-surface)",
                                    borderColor: "var(--lux-row-border)",
                                  }}
                                >
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
                                    {t("contracts.signedDate", {
                                      defaultValue: "Signed Date",
                                    })}
                                  </p>
                                  <p className="mt-1 text-sm text-[var(--lux-text)]">
                                    {format(
                                      new Date(contract.signedDate),
                                      "PPP",
                                      {
                                        locale: dateLocale,
                                      },
                                    )}
                                  </p>
                                </div>
                                <div
                                  className="rounded-2xl border px-4 py-3"
                                  style={{
                                    background: "var(--lux-panel-surface)",
                                    borderColor: "var(--lux-row-border)",
                                  }}
                                >
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
                                    {t("contracts.eventDate", {
                                      defaultValue: "Event Date",
                                    })}
                                  </p>
                                  <p className="mt-1 text-sm text-[var(--lux-text)]">
                                    {contract.eventDate
                                      ? format(
                                          new Date(contract.eventDate),
                                          "PPP",
                                          {
                                            locale: dateLocale,
                                          },
                                        )
                                      : "-"}
                                  </p>
                                </div>
                                <div
                                  className="rounded-2xl border px-4 py-3"
                                  style={{
                                    background: "var(--lux-panel-surface)",
                                    borderColor: "var(--lux-row-border)",
                                  }}
                                >
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
                                    {t("contracts.subtotal", {
                                      defaultValue: "Subtotal",
                                    })}
                                  </p>
                                  <p className="mt-1 text-sm text-[var(--lux-text)]">
                                    {formatMoney(contract.subtotal)}
                                  </p>
                                </div>
                                <div
                                  className="rounded-2xl border px-4 py-3"
                                  style={{
                                    background: "var(--lux-panel-surface)",
                                    borderColor: "var(--lux-row-border)",
                                  }}
                                >
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
                                    {t("contracts.totalAmount", {
                                      defaultValue: "Total Amount",
                                    })}
                                  </p>
                                  <p className="mt-1 text-sm font-semibold text-[var(--lux-heading)]">
                                    {formatMoney(contract.totalAmount)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-[var(--lux-text-secondary)]">
                        {t("events.noContracts", {
                          defaultValue:
                            "No contracts have been created for this event yet.",
                        })}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
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
          <DialogContent className={eventDialogContentClassName}>
            <DialogHeader className={eventDialogHeaderClassName}>
              <DialogTitle>
                {editingSection
                  ? t("events.editSection", { defaultValue: "Edit Section" })
                  : t("events.addSection", { defaultValue: "Add Section" })}
              </DialogTitle>
              <DialogDescription>
                {t("events.sectionDialogHint", {
                  defaultValue:
                    "Keep section notes clean and use JSON only for structured planning data.",
                })}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-[var(--lux-text)]">
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

              <label className="space-y-2">
                <span className="text-sm font-medium text-[var(--lux-text)]">
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

            <label className="space-y-2">
              <span className="text-sm font-medium text-[var(--lux-text)]">
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

            <label className="space-y-2">
              <span className="text-sm font-medium text-[var(--lux-text)]">
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

            <label className="space-y-2">
              <span className="text-sm font-medium text-[var(--lux-text)]">
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

            <label
              className="flex items-center gap-3 rounded-[20px] border p-4"
              style={{
                background: "var(--lux-control-hover)",
                borderColor: "var(--lux-row-border)",
              }}
            >
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

            {sectionError ? (
              <p className="text-sm text-[var(--lux-danger)]">{sectionError}</p>
            ) : null}

            <DialogFooter className={eventDialogFooterClassName}>
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
            </DialogFooter>
          </DialogContent>
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
          <DialogContent className={eventDialogContentClassName}>
            <DialogHeader className={eventDialogHeaderClassName}>
              <DialogTitle>
                {editingVendorLink
                  ? t("vendors.editVendorAssignment", {
                      defaultValue: "Edit Vendor Assignment",
                    })
                  : t("vendors.assignVendor", {
                      defaultValue: "Assign Vendor",
                    })}
              </DialogTitle>
              <DialogDescription>
                {t("vendors.vendorAssignmentHint", {
                  defaultValue:
                    "Link a catalog vendor or record a manual company snapshot for this event.",
                })}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div
                className="space-y-4 rounded-[24px] border p-5"
                style={{
                  background: "var(--lux-row-surface)",
                  borderColor: "var(--lux-row-border)",
                }}
              >
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[var(--lux-text)]">
                    {t("vendors.vendorSetup", {
                      defaultValue: "Vendor Setup",
                    })}
                  </p>
                  <p className="text-xs text-[var(--lux-text-secondary)]">
                    {t("vendors.vendorSetupHint", {
                      defaultValue:
                        "Choose the vendor type, source, and assignment status before selecting sub-services.",
                    })}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-[var(--lux-text)]">
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

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-[var(--lux-text)]">
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

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-[var(--lux-text)]">
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

                <div
                  className="rounded-[20px] border p-4"
                  style={{
                    background: "var(--lux-panel-surface)",
                    borderColor: "var(--lux-row-border)",
                  }}
                >
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
                        <label className="space-y-2">
                          <span className="text-sm font-medium text-[var(--lux-text)]">
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
                          <div
                            className="rounded-[18px] border border-dashed p-3 text-sm text-[var(--lux-text-secondary)]"
                            style={{
                              background: "var(--lux-control-hover)",
                              borderColor: "var(--lux-row-border)",
                            }}
                          >
                            {t("vendors.noVendorsForType", {
                              defaultValue:
                                "No catalog vendors are available for this vendor type yet. You can still save a company snapshot.",
                            })}
                          </div>
                        ) : null}

                        <label className="space-y-2">
                          <span className="text-sm font-medium text-[var(--lux-text)]">
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
                          <p className="text-xs text-[var(--lux-text-secondary)]">
                            {t("vendors.vendorSelectionHint", {
                              defaultValue:
                                "Choose a catalog vendor for this type, or keep a snapshot-only name when the booking needs a manual fallback.",
                            })}
                          </p>
                        </label>
                      </>
                    ) : (
                      <>
                        <div
                          className="rounded-[18px] border border-dashed p-3 text-sm text-[var(--lux-text-secondary)]"
                          style={{
                            background: "var(--lux-control-hover)",
                            borderColor: "var(--lux-row-border)",
                          }}
                        >
                          {t("vendors.clientVendorModeHint", {
                            defaultValue:
                              "Client mode keeps the vendor outside the company catalog. Enter the name exactly as shared by the client.",
                          })}
                        </div>
                        <label className="space-y-2">
                          <span className="text-sm font-medium text-[var(--lux-text)]">
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

                    <div
                      className="rounded-[18px] border px-4 py-3"
                      style={{
                        background: "var(--lux-control-hover)",
                        borderColor: "var(--lux-row-border)",
                      }}
                    >
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

              <div
                className="space-y-3 rounded-[24px] border p-5"
                style={{
                  background: "var(--lux-row-surface)",
                  borderColor: "var(--lux-row-border)",
                }}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-[var(--lux-text)]">
                      {t("vendors.selectedSubServices", {
                        defaultValue: "Selected Sub Services",
                      })}
                    </p>
                    <p className="text-xs text-[var(--lux-text-secondary)]">
                      {t("vendors.selectedSubServicesHint", {
                        defaultValue:
                          "Choose the reusable checklist items needed for this event vendor. Active pricing is matched from the selected count.",
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

              {vendorSubServicesLoading ? (
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
                          <p className="text-xs text-[var(--lux-text-secondary)]">
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
                      "No vendor sub-services are configured for this vendor type yet.",
                  })}
                </div>
              )}
            </div>

              <div
                className="space-y-4 rounded-[24px] border p-5"
                style={{
                  background: "var(--lux-row-surface)",
                  borderColor: "var(--lux-row-border)",
                }}
              >
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[var(--lux-text)]">
                    {t("vendors.pricingSummary", {
                      defaultValue: "Pricing Summary",
                    })}
                  </p>
                  <p className="text-xs text-[var(--lux-text-secondary)]">
                    {t("vendors.pricingSummaryHint", {
                      defaultValue:
                        "Pricing plan stays visible for reference even if you override the agreed price manually.",
                    })}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div
                    className="rounded-[18px] border px-4 py-3"
                    style={{
                      background: "var(--lux-panel-surface)",
                      borderColor: "var(--lux-row-border)",
                    }}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
                      {t("vendors.pricingPlans.name", {
                        defaultValue: "Pricing Plan",
                      })}
                    </p>
                    <p className="mt-1 text-sm font-medium text-[var(--lux-text)]">
                      {vendorPricingPlansLoading
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

                  <div
                    className="rounded-[18px] border px-4 py-3"
                    style={{
                      background: "var(--lux-panel-surface)",
                      borderColor: "var(--lux-row-border)",
                    }}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
                      {t("vendors.selectedSubServicesCount", {
                        defaultValue: "Selected Count",
                      })}
                    </p>
                    <p className="mt-1 text-sm font-medium text-[var(--lux-text)]">
                      {vendorForm.selectedSubServiceIds.length}
                    </p>
                  </div>

                  <div
                    className="rounded-[18px] border px-4 py-3"
                    style={{
                      background: "var(--lux-panel-surface)",
                      borderColor: "var(--lux-row-border)",
                    }}
                  >
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

                {vendorForm.selectedSubServiceIds.length > 0 &&
                !calculatedVendorPricingPlan &&
                !vendorPricingPlansLoading ? (
                  <div
                    className="rounded-[18px] border border-dashed p-3 text-sm text-[var(--lux-text-secondary)]"
                    style={{
                      background: "var(--lux-control-hover)",
                      borderColor: "var(--lux-row-border)",
                    }}
                  >
                    {t("vendors.noMatchingPricingPlan", {
                      defaultValue: "No matching pricing plan",
                    })}
                  </div>
                ) : null}

                <label
                  className="flex items-center gap-3 rounded-[18px] border p-4"
                  style={{
                    background: "var(--lux-panel-surface)",
                    borderColor: "var(--lux-row-border)",
                  }}
                >
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

                <label className="space-y-2">
                  <span className="text-sm font-medium text-[var(--lux-text)]">
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

              <div
                className="space-y-3 rounded-[24px] border p-5"
                style={{
                  background: "var(--lux-row-surface)",
                  borderColor: "var(--lux-row-border)",
                }}
              >
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[var(--lux-text)]">
                    {t("vendors.notesAndStatus", {
                      defaultValue: "Notes",
                    })}
                  </p>
                  <p className="text-xs text-[var(--lux-text-secondary)]">
                    {t("vendors.notesAndStatusHint", {
                      defaultValue:
                        "Capture any assignment-specific details that the operations team should see later in Event Details.",
                    })}
                  </p>
                </div>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-[var(--lux-text)]">
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

            <DialogFooter className={eventDialogFooterClassName}>
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
            </DialogFooter>
          </DialogContent>
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
          <DialogContent className={eventDialogContentClassName}>
            <DialogHeader className={eventDialogHeaderClassName}>
              <DialogTitle>
                {t("services.editEventService", {
                  defaultValue: "Edit Event Service",
                })}
              </DialogTitle>
              <DialogDescription>
                {t("services.editEventServiceHint", {
                  defaultValue: "Update the selected event service details.",
                })}
              </DialogDescription>
              <DialogDescription>
                {t("services.eventServiceHint", {
                  defaultValue:
                    "Link a catalog service or record a manual service line for this event.",
                })}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <label className="space-y-2">
                <span className="text-sm font-medium text-[var(--lux-text)]">
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

              <label className="space-y-2">
                <span className="text-sm font-medium text-[var(--lux-text)]">
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

              <label className="space-y-2">
                <span className="text-sm font-medium text-[var(--lux-text)]">
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

            <label className="space-y-2">
              <span className="text-sm font-medium text-[var(--lux-text)]">
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
              <p className="text-xs text-[var(--lux-text-secondary)]">
                {t("services.serviceSelectionHint", {
                  defaultValue:
                    "Choose a service from the catalog when available, or leave it empty and type the service name manually.",
                })}
              </p>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-[var(--lux-text)]">
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

            <label className="space-y-2">
              <span className="text-sm font-medium text-[var(--lux-text)]">
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

            {serviceError ? (
              <p className="text-sm text-[var(--lux-danger)]">{serviceError}</p>
            ) : null}

            <DialogFooter className={eventDialogFooterClassName}>
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
            </DialogFooter>
          </DialogContent>
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

