import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  useCreateEventService,
  useDeleteEventService,
} from "@/hooks/services/useEventServiceMutations";
import { useServices } from "@/hooks/services/useServices";
import { useToast } from "@/hooks/use-toast";
import {
  useCreateEventVendor,
  useDeleteEventVendor,
  useUpdateEventVendor,
} from "@/hooks/vendors/useEventVendorMutations";
import { useVendors } from "@/hooks/vendors/useVendors";
import { formatVendorType } from "@/pages/vendors/adapters";
import type { Quotation } from "@/pages/quotations/types";
import type {
  EventServiceItem,
  EventServiceItemFormData,
  Service,
} from "@/pages/services/types";
import type {
  EventVendorLink,
  EventVendorLinkFormData,
  Vendor,
} from "@/pages/vendors/types";

type DesignerCustomerDetailsParams = {
  eventId: string;
  serviceItems: EventServiceItem[];
  vendorLinks: EventVendorLink[];
  latestQuotation: Quotation | null;
  onCreateQuotation?: (options: { eventId: string }) => void;
  onCreateContract?: (options: {
    eventId: string;
    quotationId?: string;
  }) => void;
};

export type DesignerChecklistServiceOption = {
  id: number;
  name: string;
  categoryLabel: string;
  description?: string | null;
  code?: string | null;
  isActive: boolean;
  selected: boolean;
};

export type DesignerChecklistVendorOption = {
  id: number;
  name: string;
  typeLabel: string;
  description?: string | null;
  contactPerson?: string | null;
  phone?: string | null;
  isActive: boolean;
  selected: boolean;
};

type PendingAction = "save" | "quotation" | "contract" | null;
type VendorSubServiceSelectionMap = Record<number, number[]>;

const DEFAULT_EVENT_SERVICE_STATUS = "confirmed";
const DEFAULT_EVENT_VENDOR_STATUS = "pending";

const normalizeIds = (values: number[]) =>
  Array.from(new Set(values)).sort((left, right) => left - right);

const normalizeVendorSubServiceSelections = (
  record: VendorSubServiceSelectionMap,
  selectedVendorIds: number[],
) =>
  normalizeIds(selectedVendorIds).reduce<VendorSubServiceSelectionMap>(
    (accumulator, vendorId) => {
      accumulator[vendorId] = normalizeIds(record[vendorId] ?? []);
      return accumulator;
    },
    {},
  );

const buildSignature = (
  serviceIds: number[],
  vendorIds: number[],
  vendorSubServices: VendorSubServiceSelectionMap,
) =>
  JSON.stringify({
    services: normalizeIds(serviceIds),
    vendors: normalizeIds(vendorIds),
    vendorSubServices: normalizeIds(vendorIds).map((vendorId) => [
      vendorId,
      normalizeIds(vendorSubServices[vendorId] ?? []),
    ]),
  });

const formatDecimalInput = (value?: number | string | null) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return "";
  }

  return parsed.toFixed(3);
};

const areSameIds = (left: number[], right: number[]) =>
  JSON.stringify(normalizeIds(left)) === JSON.stringify(normalizeIds(right));

export function useDesignerCustomerDetails({
  eventId,
  serviceItems,
  vendorLinks,
  latestQuotation,
  onCreateQuotation,
  onCreateContract,
}: DesignerCustomerDetailsParams) {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const numericEventId = Number(eventId || 0);
  const isRtl = i18n.dir() === "rtl";

  const createEventServiceMutation = useCreateEventService();
  const deleteEventServiceMutation = useDeleteEventService(numericEventId);
  const createEventVendorMutation = useCreateEventVendor(numericEventId);
  const updateEventVendorMutation = useUpdateEventVendor(numericEventId);
  const deleteEventVendorMutation = useDeleteEventVendor(numericEventId);

  const {
    data: servicesResponse,
    isLoading: servicesLoading,
    isError: servicesLoadFailed,
  } = useServices({
    currentPage: 1,
    itemsPerPage: 500,
    searchQuery: "",
    category: "all",
    isActive: "all",
  });
  const {
    data: vendorsResponse,
    isLoading: vendorsLoading,
    isError: vendorsLoadFailed,
  } = useVendors({
    currentPage: 1,
    itemsPerPage: 500,
    searchQuery: "",
    type: "all",
    isActive: "all",
  });

  const externalServiceIds = useMemo(
    () =>
      normalizeIds(
        serviceItems
          .map((item) => item.serviceId)
          .filter((value): value is number => typeof value === "number"),
      ),
    [serviceItems],
  );
  const externalVendorIds = useMemo(
    () =>
      normalizeIds(
        vendorLinks
          .map((link) => link.vendorId)
          .filter((value): value is number => typeof value === "number"),
      ),
    [vendorLinks],
  );
  const externalVendorSubServices = useMemo(
    () =>
      vendorLinks.reduce<VendorSubServiceSelectionMap>((accumulator, link) => {
        if (typeof link.vendorId !== "number") {
          return accumulator;
        }

        accumulator[link.vendorId] = normalizeIds(
          (link.selectedSubServices ?? [])
            .map((selectedSubService) => selectedSubService.vendorSubServiceId)
            .filter((value): value is number => typeof value === "number"),
        );

        return accumulator;
      }, {}),
    [vendorLinks],
  );

  const [committedServiceIds, setCommittedServiceIds] = useState<number[]>(
    externalServiceIds,
  );
  const [committedVendorIds, setCommittedVendorIds] = useState<number[]>(
    externalVendorIds,
  );
  const [committedVendorSubServices, setCommittedVendorSubServices] =
    useState<VendorSubServiceSelectionMap>(
      normalizeVendorSubServiceSelections(
        externalVendorSubServices,
        externalVendorIds,
      ),
    );
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>(
    externalServiceIds,
  );
  const [selectedVendorIds, setSelectedVendorIds] = useState<number[]>(
    externalVendorIds,
  );
  const [selectedVendorSubServices, setSelectedVendorSubServices] =
    useState<VendorSubServiceSelectionMap>(
      normalizeVendorSubServiceSelections(
        externalVendorSubServices,
        externalVendorIds,
      ),
    );
  const [vendorCalculatedAgreedPriceByVendorId, setVendorCalculatedAgreedPriceByVendorId] =
    useState<Record<number, string>>({});
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const externalSignature = useMemo(
    () =>
      buildSignature(
        externalServiceIds,
        externalVendorIds,
        externalVendorSubServices,
      ),
    [externalServiceIds, externalVendorIds, externalVendorSubServices],
  );
  const committedSignature = useMemo(
    () =>
      buildSignature(
        committedServiceIds,
        committedVendorIds,
        committedVendorSubServices,
      ),
    [committedServiceIds, committedVendorIds, committedVendorSubServices],
  );
  const selectionSignature = useMemo(
    () =>
      buildSignature(
        selectedServiceIds,
        selectedVendorIds,
        selectedVendorSubServices,
      ),
    [selectedServiceIds, selectedVendorIds, selectedVendorSubServices],
  );

  useEffect(() => {
    if (externalSignature === committedSignature) {
      return;
    }

    const shouldRefreshSelections = selectionSignature === committedSignature;
    const normalizedExternalVendorSubServices =
      normalizeVendorSubServiceSelections(
        externalVendorSubServices,
        externalVendorIds,
      );

    setCommittedServiceIds(externalServiceIds);
    setCommittedVendorIds(externalVendorIds);
    setCommittedVendorSubServices(normalizedExternalVendorSubServices);

    if (shouldRefreshSelections) {
      setSelectedServiceIds(externalServiceIds);
      setSelectedVendorIds(externalVendorIds);
      setSelectedVendorSubServices(normalizedExternalVendorSubServices);
    }
  }, [
    committedSignature,
    externalServiceIds,
    externalSignature,
    externalVendorIds,
    externalVendorSubServices,
    selectionSignature,
  ]);

  const selectedServiceIdSet = useMemo(
    () => new Set(selectedServiceIds),
    [selectedServiceIds],
  );
  const selectedVendorIdSet = useMemo(
    () => new Set(selectedVendorIds),
    [selectedVendorIds],
  );
  const committedServiceIdSet = useMemo(
    () => new Set(committedServiceIds),
    [committedServiceIds],
  );
  const committedVendorIdSet = useMemo(
    () => new Set(committedVendorIds),
    [committedVendorIds],
  );

  const serviceItemsByServiceId = useMemo(
    () =>
      new Map(
        serviceItems
          .filter((item) => typeof item.serviceId === "number")
          .map((item) => [item.serviceId as number, item]),
      ),
    [serviceItems],
  );
  const vendorLinksByVendorId = useMemo(
    () =>
      new Map(
        vendorLinks
          .filter((link) => typeof link.vendorId === "number")
          .map((link) => [link.vendorId as number, link]),
      ),
    [vendorLinks],
  );

  const servicesCatalog = useMemo<Service[]>(
    () =>
      [...(servicesResponse?.data ?? [])].sort((left, right) => {
        if (left.isActive !== right.isActive) {
          return left.isActive ? -1 : 1;
        }

        const categoryComparison = left.category.localeCompare(right.category);
        if (categoryComparison !== 0) {
          return categoryComparison;
        }

        return left.name.localeCompare(right.name);
      }),
    [servicesResponse?.data],
  );

  const vendorsCatalog = useMemo<Vendor[]>(
    () =>
      [...(vendorsResponse?.data ?? [])]
        .filter(
          (vendor) => vendor.isActive || committedVendorIdSet.has(vendor.id),
        )
        .sort((left, right) => {
          if (left.isActive !== right.isActive) {
            return left.isActive ? -1 : 1;
          }

          const typeComparison = left.type.localeCompare(right.type);
          if (typeComparison !== 0) {
            return typeComparison;
          }

          return left.name.localeCompare(right.name);
        }),
    [committedVendorIdSet, vendorsResponse?.data],
  );

  const serviceOptions = useMemo<DesignerChecklistServiceOption[]>(
    () =>
      servicesCatalog.map((service) => ({
        id: service.id,
        name: service.name,
        categoryLabel: t(`services.category.${service.category}`, {
          defaultValue: service.category.replace(/_/g, " "),
        }),
        description: service.description ?? null,
        code: service.code ?? null,
        isActive: service.isActive,
        selected: selectedServiceIdSet.has(service.id),
      })),
    [selectedServiceIdSet, servicesCatalog, t],
  );

  const vendorOptions = useMemo<DesignerChecklistVendorOption[]>(
    () =>
      vendorsCatalog.map((vendor) => ({
        id: vendor.id,
        name: vendor.name,
        typeLabel: t(`vendors.type.${vendor.type}`, {
          defaultValue: formatVendorType(vendor.type),
        }),
        description: vendor.notes ?? vendor.address ?? null,
        contactPerson: vendor.contactPerson ?? null,
        phone: vendor.phone ?? vendor.phone2 ?? null,
        isActive: vendor.isActive,
        selected: selectedVendorIdSet.has(vendor.id),
      })),
    [selectedVendorIdSet, t, vendorsCatalog],
  );

  const isDirty = selectionSignature !== committedSignature;
  const isSaving =
    pendingAction !== null ||
    createEventServiceMutation.isPending ||
    deleteEventServiceMutation.isPending ||
    createEventVendorMutation.isPending ||
    updateEventVendorMutation.isPending ||
    deleteEventVendorMutation.isPending;

  const toggleService = (serviceId: number, checked: boolean) => {
    setSelectedServiceIds((current) =>
      normalizeIds(
        checked
          ? [...current, serviceId]
          : current.filter((value) => value !== serviceId),
      ),
    );
  };

  const toggleVendor = (vendorId: number, checked: boolean) => {
    setSelectedVendorIds((current) => {
      const nextVendorIds = normalizeIds(
        checked
          ? [...current, vendorId]
          : current.filter((value) => value !== vendorId),
      );

      setSelectedVendorSubServices((currentSelections) => {
        if (checked) {
          return {
            ...currentSelections,
            [vendorId]:
              currentSelections[vendorId] ??
              committedVendorSubServices[vendorId] ??
              [],
          };
        }

        const nextSelections = { ...currentSelections };
        delete nextSelections[vendorId];
        return nextSelections;
      });

      return nextVendorIds;
    });
  };

  const toggleVendorSubService = (
    vendorId: number,
    subServiceId: number,
    checked: boolean,
  ) => {
    setSelectedVendorSubServices((current) => ({
      ...current,
      [vendorId]: normalizeIds(
        checked
          ? [...(current[vendorId] ?? []), subServiceId]
          : (current[vendorId] ?? []).filter((value) => value !== subServiceId),
      ),
    }));
  };

  const setVendorCalculatedAgreedPrice = (vendorId: number, value: string) => {
    setVendorCalculatedAgreedPriceByVendorId((current) => {
      if (current[vendorId] === value) {
        return current;
      }

      return {
        ...current,
        [vendorId]: value,
      };
    });
  };

  const syncSelections = async (options?: { notifyIfUnchanged?: boolean }) => {
    const servicesToAdd = servicesCatalog.filter(
      (service) =>
        selectedServiceIdSet.has(service.id) &&
        !committedServiceIdSet.has(service.id),
    );
    const servicesToRemove = serviceItems.filter(
      (item) =>
        typeof item.serviceId === "number" &&
        !selectedServiceIdSet.has(item.serviceId),
    );
    const vendorsToAdd = vendorsCatalog.filter(
      (vendor) =>
        selectedVendorIdSet.has(vendor.id) &&
        !committedVendorIdSet.has(vendor.id),
    );
    const vendorsToRemove = vendorLinks.filter(
      (link) =>
        typeof link.vendorId === "number" &&
        !selectedVendorIdSet.has(link.vendorId),
    );
    const vendorsToUpdate = vendorLinks.filter((link) => {
      if (
        typeof link.vendorId !== "number" ||
        !selectedVendorIdSet.has(link.vendorId)
      ) {
        return false;
      }

      return !areSameIds(
        committedVendorSubServices[link.vendorId] ?? [],
        selectedVendorSubServices[link.vendorId] ?? [],
      );
    });

    const hasChanges =
      servicesToAdd.length > 0 ||
      servicesToRemove.length > 0 ||
      vendorsToAdd.length > 0 ||
      vendorsToRemove.length > 0 ||
      vendorsToUpdate.length > 0;

    if (!hasChanges) {
      if (options?.notifyIfUnchanged !== false) {
        toast({
          title: t("common.success", { defaultValue: "Success" }),
          description:
            i18n.language === "ar"
              ? "تم حفظ تفاصيل العميل بنجاح."
              : "Client details saved successfully.",
        });
      }
      return true;
    }

    const serviceCreateRequests = servicesToAdd.map((service, index) => {
      const payload: EventServiceItemFormData = {
        eventId: numericEventId,
        serviceId: String(service.id),
        serviceNameSnapshot: service.name,
        category: service.category,
        notes: "",
        status: DEFAULT_EVENT_SERVICE_STATUS,
        sortOrder: String(serviceItems.length + index),
      };

      return createEventServiceMutation.mutateAsync(payload);
    });

    const serviceDeleteRequests = servicesToRemove.map((item) =>
      deleteEventServiceMutation.mutateAsync(item.id),
    );

    const vendorCreateRequests = vendorsToAdd.map((vendor) => {
      const payload: EventVendorLinkFormData = {
        eventId: numericEventId,
        vendorType: vendor.type,
        providedBy: "company",
        vendorId: String(vendor.id),
        companyNameSnapshot: vendor.name,
        selectedSubServiceIds: selectedVendorSubServices[vendor.id] ?? [],
        agreedPrice:
          vendorCalculatedAgreedPriceByVendorId[vendor.id] ?? "0.000",
        notes: "",
        status: DEFAULT_EVENT_VENDOR_STATUS,
      };

      return createEventVendorMutation.mutateAsync(payload);
    });

    const vendorUpdateRequests = vendorsToUpdate.map((link) => {
      const vendorId = link.vendorId as number;
      const payload: EventVendorLinkFormData = {
        eventId: numericEventId,
        vendorType: link.vendorType,
        providedBy: link.providedBy,
        vendorId: link.vendorId ? String(link.vendorId) : "",
        companyNameSnapshot:
          link.companyNameSnapshot ||
          link.resolvedCompanyName ||
          link.vendor?.name ||
          "",
        selectedSubServiceIds: selectedVendorSubServices[vendorId] ?? [],
        agreedPrice:
          vendorCalculatedAgreedPriceByVendorId[vendorId] ??
          formatDecimalInput(link.agreedPrice) ??
          "0.000",
        notes: link.notes ?? "",
        status: link.status,
      };

      return updateEventVendorMutation.mutateAsync({
        id: link.id,
        values: payload,
      });
    });

    const vendorDeleteRequests = vendorsToRemove.map((link) =>
      deleteEventVendorMutation.mutateAsync(link.id),
    );

    try {
      await Promise.all([
        Promise.all(serviceCreateRequests),
        Promise.all(serviceDeleteRequests),
        Promise.all(vendorCreateRequests),
        Promise.all(vendorUpdateRequests),
        Promise.all(vendorDeleteRequests),
      ]);

      setCommittedServiceIds(normalizeIds(selectedServiceIds));
      setCommittedVendorIds(normalizeIds(selectedVendorIds));
      setCommittedVendorSubServices(
        normalizeVendorSubServiceSelections(
          selectedVendorSubServices,
          selectedVendorIds,
        ),
      );

      return true;
    } catch {
      return false;
    }
  };

  const runAction = async (action: Exclude<PendingAction, null>) => {
    if (!numericEventId || isSaving) {
      return;
    }

    setPendingAction(action);

    try {
      const saved = await syncSelections({
        notifyIfUnchanged: action === "save",
      });

      if (!saved) {
        return;
      }

      if (action === "quotation") {
        onCreateQuotation?.({ eventId });
        return;
      }

      if (action === "contract") {
        onCreateContract?.({
          eventId,
          quotationId: latestQuotation ? String(latestQuotation.id) : undefined,
        });
      }
    } finally {
      setPendingAction(null);
    }
  };

  return {
    isRtl,
    isDirty,
    isSaving,
    pendingAction,
    servicesLoading,
    vendorsLoading,
    servicesLoadFailed,
    vendorsLoadFailed,
    serviceOptions,
    vendorOptions,
    selectedVendorSubServices,
    vendorCalculatedAgreedPriceByVendorId,
    linkedCatalogOnlyCounts: {
      services: externalServiceIds.length,
      vendors: externalVendorIds.length,
      manualServices: serviceItems.length - externalServiceIds.length,
      manualVendors: vendorLinks.length - externalVendorIds.length,
    },
    selectedCounts: {
      services: selectedServiceIds.length,
      vendors: selectedVendorIds.length,
    },
    toggleService,
    toggleVendor,
    toggleVendorSubService,
    setVendorCalculatedAgreedPrice,
    save: () => runAction("save"),
    createQuotation: () => runAction("quotation"),
    createContract: () => runAction("contract"),
    serviceItemsByServiceId,
    vendorLinksByVendorId,
    hasLatestQuotation: Boolean(latestQuotation),
  };
}
