import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useFieldArray,
  useForm,
  useWatch,
  type FieldErrors,
} from "react-hook-form";
import { z } from "zod";
import { FileText, Trash2 } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { PageContainer } from "@/components/layout/page-container";
import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import {
  FormFeedbackBanner,
  getFirstFormErrorMessage,
} from "@/components/shared/form-feedback-banner";
import { WorkflowLockBanner } from "@/components/workflow/workflow-lock-banner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEvents } from "@/hooks/events/useEvents";
import { getInitialEventsBusinessFilters } from "@/pages/events/event-query-params";
import {
  useCreateQuotation,
  useCreateQuotationFromEvent,
  useUpdateQuotation,
} from "@/hooks/quotations/useQuotationMutations";
import { useQuotation } from "@/hooks/quotations/useQuotations";
import {
  useEventServiceItems,
  useServices,
} from "@/hooks/services/useServices";
import { useToast } from "@/hooks/use-toast";
import { useVendorPricingPlans } from "@/hooks/vendors/useVendorPricingPlans";
import { useVendorSubServices } from "@/hooks/vendors/useVendorSubServices";
import { useEventVendorLinks, useVendors } from "@/hooks/vendors/useVendors";
import { getQuotationLockMessage } from "@/lib/workflow/workflow";
import { cn } from "@/lib/utils";
import { getEventDisplayTitle } from "@/pages/events/adapters";
import {
  formatMoney as formatVendorMoney,
  formatVendorType,
  getEventVendorDisplayName,
  toNumberValue as toVendorNumberValue,
} from "@/pages/vendors/adapters";
import type { EventServiceItem, Service } from "@/pages/services/types";
import type {
  EventVendorLink,
  VendorPricingPlan,
  VendorSubService,
  VendorType,
} from "@/pages/vendors/types";

import {
  computeQuotationItemTotal,
  computeQuotationTotals,
  formatMoney,
  formatQuotationItemCategory,
  getQuotationItemLabel,
  safeMoney,
  QUOTATION_STATUS_OPTIONS,
} from "./adapters";
import type {
  QuotationFormData,
  QuotationFromEventFormData,
  QuotationItemFormData,
  QuotationItemType,
  QuotationStatus,
  QuotationUpdateFormData,
} from "./types";

const textAreaClass =
  "min-h-[110px] w-full rounded-[4px] border px-4 py-3 text-sm text-[var(--lux-text)] outline-none transition-all focus:border-[var(--lux-gold-border)] focus:ring-2 focus:ring-[var(--lux-gold-glow)] read-only:cursor-default read-only:border-dashed read-only:border-[var(--lux-row-border)] read-only:bg-[var(--lux-row-surface)] read-only:text-[var(--lux-text-secondary)] read-only:focus:border-[var(--lux-control-border)] read-only:focus:ring-0";
const sectionTitleClass = "text-lg font-semibold text-[var(--lux-heading)]";
const sectionHintClass = "text-sm text-[var(--lux-text-secondary)]";

type CreateMode = "manual" | "from_event";
const MANUAL_SERVICES_SUMMARY_CATEGORY = "service_summary";
const MANUAL_SERVICES_SUMMARY_NAME = "إجمالي الخدمات";
type QuotationFromEventSubmitPayload = QuotationFromEventFormData & {
  manualServicesTotal: number;
};
type CatalogVendorLike = {
  id: number | string;
  name: string;
  type?: VendorType | null;
  isActive?: boolean | null;
};
type SelectedCatalogVendorConfig = {
  vendorId: string;
  selectedSubServiceIds: number[];
  pricingPlanId: string;
  calculatedPrice: string;
  agreedPrice: string;
  isPriceOverride: boolean;
};

const createDefaultCatalogVendorConfig = (
  vendorId: string | number,
): SelectedCatalogVendorConfig => ({
  vendorId: String(vendorId),
  selectedSubServiceIds: [],
  pricingPlanId: "",
  calculatedPrice: "",
  agreedPrice: "",
  isPriceOverride: false,
});

const formatDecimalInput = (value?: number | string | null) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return "";
  return parsed.toFixed(3);
};

const findMatchingVendorPricingPlan = (
  plans: VendorPricingPlan[],
  count: number,
) => {
  if (count <= 0) return null;

  return (
    [...plans]
      .sort((a, b) => {
        if (a.minSubServices !== b.minSubServices) {
          return b.minSubServices - a.minSubServices;
        }

        const aMax =
          typeof a.maxSubServices === "number"
            ? a.maxSubServices
            : Number.MAX_SAFE_INTEGER;
        const bMax =
          typeof b.maxSubServices === "number"
            ? b.maxSubServices
            : Number.MAX_SAFE_INTEGER;

        if (aMax !== bMax) {
          return aMax - bMax;
        }

        return a.id - b.id;
      })
      .find((plan) => {
        const matchesMin = plan.minSubServices <= count;
        const matchesMax =
          !plan.maxSubServices || plan.maxSubServices >= count;
        return matchesMin && matchesMax;
      }) ?? null
  );
};

const getFirstErrorMessage = (value: unknown): string | null => {
  if (!value || typeof value !== "object") return null;
  if (
    "message" in value &&
    typeof (value as any).message === "string" &&
    (value as any).message.trim()
  ) {
    return (value as any).message;
  }
  const nestedValues = Array.isArray(value)
    ? value
    : Object.values(value as Record<string, unknown>);
  for (const nestedValue of nestedValues) {
    const message = getFirstErrorMessage(nestedValue);
    if (message) return message;
  }
  return null;
};

const quotationFormSchema = (isEditMode: boolean) =>
  z
    .object({
      createMode: z.enum(["manual", "from_event"]),
      eventId: z.string().default(""),
      quotationNumber: z.string().max(100).optional(),
      issueDate: z.string().min(1, "Issue date is required"),
      validUntil: z.string().optional(),
      discountAmount: z
        .string()
        .optional()
        .refine(
          (value) => !value || Number(value) >= 0,
          "Discount must be zero or greater",
        ),
      manualServicesTotal: z
        .string()
        .optional()
        .refine(
          (value) => !value || Number(value) >= 0,
          "Services total must be zero or greater",
        ),
      notes: z.string().optional(),
      status: z.enum(
        QUOTATION_STATUS_OPTIONS.map((option) => option.value) as [
          QuotationStatus,
          ...QuotationStatus[],
        ],
      ),
      eventServiceIds: z.array(z.string()).default([]),
      eventVendorIds: z.array(z.string()).default([]),
      items: z.array(
        z.object({
          id: z.number().optional(),
          itemType: z.enum(["service", "vendor"]),
          eventServiceId: z.string().optional(),
          serviceId: z.string().optional(),
          eventVendorId: z.string().optional(),
          vendorId: z.string().optional(),
          pricingPlanId: z.string().optional(),
          itemName: z.string().max(150),
          category: z.string().max(100).optional(),
          quantity: z
            .string()
            .refine(
              (value) => Number(value) > 0,
              "Quantity must be greater than zero",
            ),
          unitPrice: z
            .string()
            .refine(
              (value) => value.trim() !== "" && Number(value) >= 0,
              "Unit price must be zero or greater",
            ),
          totalPrice: z
            .string()
            .optional()
            .refine(
              (value) => !value || Number(value) >= 0,
              "Total price must be zero or greater",
            ),
          notes: z.string().optional(),
          sortOrder: z.string().optional(),
          isTotalManual: z.boolean().optional(),
        }),
      ),
    })
    .superRefine((values, ctx) => {
      if (!isEditMode && !values.eventId.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["eventId"],
          message: "Event is required",
        });
      }

      if (!isEditMode && values.createMode === "from_event") {
        if (
          values.eventServiceIds.length === 0 &&
          values.eventVendorIds.length === 0
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["eventServiceIds"],
            message: "Select at least one event service or event vendor",
          });
        }
        return;
      }

      if (!isEditMode && values.createMode === "manual") {
        const hasManualServicesTotal =
          Number(values.manualServicesTotal || 0) > 0;
        const hasVendorRows = values.items.some(
          (item) => item.itemType === "vendor",
        );
        const hasServiceRows = values.items.some(
          (item) => item.itemType === "service",
        );
        if (!hasManualServicesTotal && !hasVendorRows && !hasServiceRows) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["items"],
            message:
              "Select at least one service or vendor, or enter a total services amount",
          });
        }
      }

      values.items.forEach((item, index) => {
        if (!item.itemName.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["items", index, "itemName"],
            message: "Item name is required",
          });
        }
        if (
          !isEditMode &&
          item.itemType === "service" &&
          !item.eventServiceId &&
          !item.serviceId
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["items", index, "serviceId"],
            message: "Service rows must come from a service or event service",
          });
        }
        if (
          item.itemType === "vendor" &&
          !item.eventVendorId &&
          !item.vendorId
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["items", index, "vendorId"],
            message: "Vendor rows must come from an event vendor or vendor",
          });
        }
      });
    });

type FormValues = z.infer<ReturnType<typeof quotationFormSchema>>;

const createEmptyQuotationItem = (
  itemType: QuotationItemType = "service",
  sortOrder = 0,
): QuotationItemFormData => ({
  itemType,
  eventServiceId: "",
  serviceId: "",
  eventVendorId: "",
  vendorId: "",
  pricingPlanId: "",
  itemName: "",
  category: "",
  quantity: "1",
  unitPrice: "0",
  totalPrice: "0",
  notes: "",
  sortOrder: String(sortOrder),
  isTotalManual: false,
});

const buildServiceItemFromEventService = (
  item: EventServiceItem,
  sortOrder: number,
): QuotationItemFormData => ({
  ...createEmptyQuotationItem("service", sortOrder),
  eventServiceId: String(item.id),
  serviceId: item.serviceId ? String(item.serviceId) : "",
  itemName: item.serviceNameSnapshot || item.service?.name || "",
  category: item.category,
  quantity: String(item.quantity ?? 1),
  unitPrice: "0",
  totalPrice: "0",
  notes: item.notes ?? "",
});

const buildServiceItemFromService = (
  service: Service,
  sortOrder: number,
): QuotationItemFormData => ({
  ...createEmptyQuotationItem("service", sortOrder),
  serviceId: String(service.id),
  itemName: service.name,
  category: service.category,
});

const buildVendorItemFromEventVendor = (
  item: EventVendorLink,
  sortOrder: number,
): QuotationItemFormData => {
  const agreedPrice = toVendorNumberValue(item.agreedPrice) ?? 0;
  return {
    ...createEmptyQuotationItem("vendor", sortOrder),
    eventVendorId: String(item.id),
    vendorId: item.vendorId ? String(item.vendorId) : "",
    pricingPlanId: item.pricingPlanId ? String(item.pricingPlanId) : "",
    itemName: getEventVendorDisplayName(item),
    category: item.vendorType,
    quantity: "1",
    unitPrice: String(agreedPrice),
    totalPrice: String(agreedPrice),
    notes: item.notes ?? "",
  };
};

const buildVendorItemFromCatalogVendor = (
  vendor: CatalogVendorLike,
  config: SelectedCatalogVendorConfig,
  sortOrder: number,
): QuotationItemFormData => ({
  ...createEmptyQuotationItem("vendor", sortOrder),
  vendorId: String(vendor.id),
  pricingPlanId: config.pricingPlanId || "",
  itemName: vendor.name,
  category: vendor.type ?? "vendor",
  quantity: "1",
  unitPrice: config.agreedPrice || config.calculatedPrice || "0",
  totalPrice: config.agreedPrice || config.calculatedPrice || "0",
  notes: "",
});

const getEventVendorDisabledReason = (item: EventVendorLink) => {
  if (item.status === "cancelled") return "cancelled";
  if (toVendorNumberValue(item.agreedPrice) === null) return "missing_price";
  return null;
};

const getManualServicesTotalValue = (value?: string) =>
  Number(Math.max(0, toVendorNumberValue(value) ?? 0).toFixed(3));

function buildManualServiceItem(
  manualServicesTotal?: string,
  sortOrder = 0,
): QuotationItemFormData {
  const amount = getManualServicesTotalValue(manualServicesTotal);
  const amountString = String(amount);
  return {
    ...createEmptyQuotationItem("service", sortOrder),
    itemName: MANUAL_SERVICES_SUMMARY_NAME,
    category: MANUAL_SERVICES_SUMMARY_CATEGORY,
    quantity: "1",
    unitPrice: amountString,
    totalPrice: amountString,
    sortOrder: String(sortOrder),
    isTotalManual: true,
  };
}

const isManualServicesSummaryItem = (item: Partial<QuotationItemFormData>) =>
  item.itemType === "service" &&
  item.category === MANUAL_SERVICES_SUMMARY_CATEGORY;

const normalizeSortOrder = (items: QuotationItemFormData[]) =>
  items.map((item, index) => ({
    ...item,
    sortOrder: String(index),
  }));

const buildManualModePayloadItems = (
  items: QuotationItemFormData[],
  manualServicesTotal?: string,
) => {
  const summaryAmount = getManualServicesTotalValue(manualServicesTotal);
  const vendorItems = items.filter((item) => item.itemType === "vendor");
  const serviceReferenceItems = items
    .filter(
      (item) =>
        item.itemType === "service" && !isManualServicesSummaryItem(item),
    )
    .map((item) => ({
      ...item,
      unitPrice: "0",
      totalPrice: "0",
      isTotalManual: false,
    }));

  const combinedItems = [
    ...serviceReferenceItems,
    ...(summaryAmount > 0
      ? [
          buildManualServiceItem(
            manualServicesTotal,
            serviceReferenceItems.length,
          ),
        ]
      : []),
    ...vendorItems,
  ];

  return combinedItems.map((item, index) => ({
    ...item,
    sortOrder: String(index),
    totalPrice:
      item.itemType === "vendor"
        ? item.totalPrice?.trim() ||
          String(computeQuotationItemTotal(item.quantity, item.unitPrice))
        : isManualServicesSummaryItem(item)
          ? String(summaryAmount)
          : "0",
    unitPrice:
      item.itemType === "vendor"
        ? item.unitPrice
        : isManualServicesSummaryItem(item)
          ? String(summaryAmount)
          : "0",
  }));
};

const buildEditModePayloadItems = (
  items: QuotationItemFormData[],
  manualServicesTotal?: string,
  serviceSummaryItemId?: number,
) => {
  const summaryAmount = getManualServicesTotalValue(manualServicesTotal);
  const normalizedItems = items
    .filter((item) => !isManualServicesSummaryItem(item))
    .map((item) => ({
      ...item,
      unitPrice: item.itemType === "vendor" ? item.unitPrice : "0",
      totalPrice: item.itemType === "vendor" ? item.totalPrice : "0",
      isTotalManual: item.itemType === "vendor" ? item.isTotalManual : false,
    }));

  const combinedItems = [
    ...(summaryAmount > 0 || typeof serviceSummaryItemId === "number"
      ? [
          {
            ...buildManualServiceItem(manualServicesTotal, 0),
            id: serviceSummaryItemId,
          },
        ]
      : []),
    ...normalizedItems,
  ];

  return combinedItems.map((item, index) => ({
    ...item,
    sortOrder: String(index),
    totalPrice:
      item.itemType === "vendor"
        ? item.totalPrice?.trim() ||
          String(computeQuotationItemTotal(item.quantity, item.unitPrice))
        : isManualServicesSummaryItem(item)
          ? String(summaryAmount)
          : "0",
    unitPrice:
      item.itemType === "vendor"
        ? item.unitPrice
        : isManualServicesSummaryItem(item)
          ? String(summaryAmount)
          : "0",
  }));
};

const QuotationFormPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEditMode = Boolean(id);
  const requestedMode: CreateMode =
    searchParams.get("mode") === "from-event" ? "from_event" : "manual";
  const preselectedEventId = searchParams.get("eventId") ?? "";
  const previousEventIdRef = useRef("");
  const previousAutoSelectSignatureRef = useRef("");
  const serviceSummaryItemIdRef = useRef<number | undefined>(undefined);
  const [catalogVendorConfigs, setCatalogVendorConfigs] = useState<
    Record<string, SelectedCatalogVendorConfig>
  >({});

  const { data: quotation, isLoading: quotationLoading } = useQuotation(id);
  const createMutation = useCreateQuotation();
  const createFromEventMutation = useCreateQuotationFromEvent();
  const updateMutation = useUpdateQuotation(id);
  const { data: eventsResponse } = useEvents({
    currentPage: 1,
    itemsPerPage: 200,
    filters: getInitialEventsBusinessFilters(),
  });
  const { data: servicesResponse } = useServices({
    currentPage: 1,
    itemsPerPage: 200,
    searchQuery: "",
    category: "all",
    isActive: "all",
  });
  const { data: vendorsResponse } = useVendors({
    currentPage: 1,
    itemsPerPage: 200,
    searchQuery: "",
    type: "all",
    isActive: "all",
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(quotationFormSchema(isEditMode)) as any,
    defaultValues: {
      createMode: requestedMode,
      eventId: preselectedEventId,
      quotationNumber: "",
      issueDate: new Date().toISOString().slice(0, 10),
      validUntil: "",
      discountAmount: "0",
      manualServicesTotal: "0",
      notes: "",
      status: "draft",
      eventServiceIds: [],
      eventVendorIds: [],
      items: [],
    },
  });

  const {
    fields: itemFields,
    replace: replaceItems,
  } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedCreateMode = useWatch({
    control: form.control,
    name: "createMode",
  });
  const watchedEventId = useWatch({ control: form.control, name: "eventId" });
  const watchedDiscountAmount = useWatch({
    control: form.control,
    name: "discountAmount",
  });
  const watchedManualServicesTotal = useWatch({
    control: form.control,
    name: "manualServicesTotal",
  });
  const watchedItems = useWatch({ control: form.control, name: "items" }) ?? [];
  const watchedEventServiceIds =
    useWatch({ control: form.control, name: "eventServiceIds" }) ?? [];
  const watchedEventVendorIds =
    useWatch({ control: form.control, name: "eventVendorIds" }) ?? [];

  const selectedEventId = watchedEventId ? Number(watchedEventId) : 0;
  const { data: eventServicesResponse } = useEventServiceItems({
    currentPage: 1,
    itemsPerPage: 200,
    eventId: selectedEventId || undefined,
    category: "all",
    status: "all",
  });
  const { data: eventVendorsResponse } = useEventVendorLinks({
    currentPage: 1,
    itemsPerPage: 200,
    eventId: selectedEventId || undefined,
    vendorType: "all",
    providedBy: "all",
    status: "all",
  });

  const events = eventsResponse?.data ?? [];
  const services = useMemo(
    () => servicesResponse?.data ?? [],
    [servicesResponse?.data],
  );
  const catalogVendors = useMemo(
    () =>
      (vendorsResponse?.data ?? []).filter(
        (item: CatalogVendorLike) => item.isActive !== false,
      ),
    [vendorsResponse?.data],
  );
  const eventServices = useMemo(
    () =>
      (eventServicesResponse?.data ?? []).filter(
        (item) => item.status !== "cancelled",
      ),
    [eventServicesResponse?.data],
  );
  const eventVendors = useMemo(
    () => eventVendorsResponse?.data ?? [],
    [eventVendorsResponse?.data],
  );

  const selectedEventServices = useMemo(
    () =>
      eventServices.filter((item) =>
        watchedEventServiceIds.includes(String(item.id)),
      ),
    [eventServices, watchedEventServiceIds],
  );
  const selectedEventVendors = useMemo(
    () =>
      eventVendors.filter((item) =>
        watchedEventVendorIds.includes(String(item.id)),
      ),
    [eventVendors, watchedEventVendorIds],
  );

  const selectedManualEventServiceIds = useMemo(
    () =>
      watchedItems
        .filter(
          (item) => item.itemType === "service" && item.eventServiceId?.trim(),
        )
        .map((item) => item.eventServiceId as string),
    [watchedItems],
  );
  const selectedManualCatalogServiceIds = useMemo(
    () =>
      watchedItems
        .filter(
          (item) =>
            item.itemType === "service" &&
            item.serviceId?.trim() &&
            !item.eventServiceId?.trim() &&
            !isManualServicesSummaryItem(item),
        )
        .map((item) => item.serviceId as string),
    [watchedItems],
  );
  const selectedManualEventVendorIds = useMemo(
    () =>
      watchedItems
        .filter(
          (item) => item.itemType === "vendor" && item.eventVendorId?.trim(),
        )
        .map((item) => item.eventVendorId as string),
    [watchedItems],
  );
  const selectedManualCatalogVendorIds = useMemo(
    () =>
      watchedItems
        .filter(
          (item) =>
            item.itemType === "vendor" &&
            item.vendorId?.trim() &&
            !item.eventVendorId?.trim(),
        )
        .map((item) => item.vendorId as string),
    [watchedItems],
  );

  const fromEventPreviewItems = useMemo(
    () => [
      ...selectedEventServices.map((item, index) =>
        buildServiceItemFromEventService(item, index),
      ),
      ...(getManualServicesTotalValue(watchedManualServicesTotal) > 0
        ? [
            buildManualServiceItem(
              watchedManualServicesTotal,
              selectedEventServices.length,
            ),
          ]
        : []),
      ...selectedEventVendors
        .filter((item) => !getEventVendorDisabledReason(item))
        .map((item, index) =>
          buildVendorItemFromEventVendor(
            item,
            index +
              selectedEventServices.length +
              (getManualServicesTotalValue(watchedManualServicesTotal) > 0
                ? 1
                : 0),
          ),
        ),
    ],
    [selectedEventServices, selectedEventVendors, watchedManualServicesTotal],
  );

  const manualModePayloadItems = useMemo(
    () => buildManualModePayloadItems(watchedItems, watchedManualServicesTotal),
    [watchedItems, watchedManualServicesTotal],
  );
  const editModePayloadItems = useMemo(
    () =>
      buildEditModePayloadItems(
        watchedItems,
        watchedManualServicesTotal,
        serviceSummaryItemIdRef.current,
      ),
    [watchedItems, watchedManualServicesTotal],
  );

  const editorTotals = useMemo(
    () =>
      computeQuotationTotals({
        items: isEditMode
          ? editModePayloadItems
          : watchedCreateMode === "manual"
            ? manualModePayloadItems
            : watchedItems,
        discountAmount: watchedDiscountAmount,
      }),
    [
      editModePayloadItems,
      isEditMode,
      manualModePayloadItems,
      watchedCreateMode,
      watchedDiscountAmount,
      watchedItems,
    ],
  );
  const fromEventTotals = useMemo(
    () =>
      computeQuotationTotals({
        items: fromEventPreviewItems,
        discountAmount: watchedDiscountAmount,
      }),
    [fromEventPreviewItems, watchedDiscountAmount],
  );
  const totals =
    !isEditMode && watchedCreateMode === "from_event"
      ? fromEventTotals
      : editorTotals;

  const isBusy =
    quotationLoading ||
    createMutation.isPending ||
    createFromEventMutation.isPending ||
    updateMutation.isPending;
  const quotationLockMessage =
    isEditMode && quotation ? getQuotationLockMessage(quotation.status) : null;
  const isWorkflowLocked = Boolean(quotationLockMessage);
  const formErrorMessage =
    form.formState.submitCount > 0
      ? getFirstFormErrorMessage(form.formState.errors)
      : null;

  const updateCatalogVendorConfig = (
    vendorId: string,
    updater: (
      current: SelectedCatalogVendorConfig,
    ) => SelectedCatalogVendorConfig,
  ) => {
    setCatalogVendorConfigs((current) => ({
      ...current,
      [vendorId]: updater(
        current[vendorId] ?? createDefaultCatalogVendorConfig(vendorId),
      ),
    }));
  };

  useEffect(() => {
    if (!isEditMode && preselectedEventId) {
      form.setValue("eventId", preselectedEventId, { shouldDirty: false });
    }
  }, [form, isEditMode, preselectedEventId]);

  useEffect(() => {
    if (isEditMode || watchedCreateMode !== "manual") {
      return;
    }

    const selectedVendorIds = new Set(selectedManualCatalogVendorIds);

    setCatalogVendorConfigs((current) => {
      let changed = false;
      const nextConfigs: Record<string, SelectedCatalogVendorConfig> = {};

      selectedManualCatalogVendorIds.forEach((vendorId) => {
        if (current[vendorId]) {
          nextConfigs[vendorId] = current[vendorId];
          return;
        }

        changed = true;
        nextConfigs[vendorId] = createDefaultCatalogVendorConfig(vendorId);
      });

      Object.keys(current).forEach((vendorId) => {
        if (!selectedVendorIds.has(vendorId)) {
          changed = true;
        }
      });

      return changed ? nextConfigs : current;
    });
  }, [isEditMode, selectedManualCatalogVendorIds, watchedCreateMode]);

  useEffect(() => {
    if (isEditMode || watchedCreateMode !== "manual") {
      return;
    }

    const currentItems = form.getValues("items");
    let hasChanges = false;

    const nextItems = currentItems.map((item, index) => {
      if (
        item.itemType !== "vendor" ||
        !item.vendorId?.trim() ||
        item.eventVendorId?.trim()
      ) {
        return item;
      }

      const vendor = catalogVendors.find(
        (entry) => String(entry.id) === item.vendorId,
      );

      if (!vendor) {
        return item;
      }

      const config =
        catalogVendorConfigs[item.vendorId] ??
        createDefaultCatalogVendorConfig(item.vendorId);
      const nextVendorItem = buildVendorItemFromCatalogVendor(
        vendor,
        config,
        index,
      );
      const mergedItem: QuotationItemFormData = {
        ...item,
        vendorId: nextVendorItem.vendorId,
        pricingPlanId: nextVendorItem.pricingPlanId,
        itemName: nextVendorItem.itemName,
        category: nextVendorItem.category,
        quantity: nextVendorItem.quantity,
        unitPrice: nextVendorItem.unitPrice,
        totalPrice: nextVendorItem.totalPrice,
        sortOrder: String(index),
      };

      if (
        mergedItem.pricingPlanId !== item.pricingPlanId ||
        mergedItem.unitPrice !== item.unitPrice ||
        mergedItem.totalPrice !== item.totalPrice ||
        mergedItem.itemName !== item.itemName ||
        mergedItem.category !== item.category ||
        mergedItem.quantity !== item.quantity ||
        mergedItem.sortOrder !== item.sortOrder
      ) {
        hasChanges = true;
      }

      return mergedItem;
    });

    if (hasChanges) {
      replaceItems(nextItems);
    }
  }, [
    catalogVendorConfigs,
    catalogVendors,
    form,
    isEditMode,
    replaceItems,
    watchedCreateMode,
    watchedItems,
  ]);

  useEffect(() => {
    if (!isEditMode || !quotation) return;

    const serviceSummaryItem = (quotation.items ?? []).find(
      (item) =>
        item.itemType === "service" &&
        item.category === MANUAL_SERVICES_SUMMARY_CATEGORY,
    );
    const editableItems = (quotation.items ?? []).filter(
      (item) =>
        !(
          item.itemType === "service" &&
          item.category === MANUAL_SERVICES_SUMMARY_CATEGORY
        ),
    );

    serviceSummaryItemIdRef.current = serviceSummaryItem?.id;

    const mappedItems = editableItems.map((item) => {
      const quantity = String(item.quantity ?? 1);
      const isVendorItem = item.itemType === "vendor";
      const unitPrice = isVendorItem ? String(item.unitPrice ?? 0) : "0";
      const totalPrice = isVendorItem ? String(item.totalPrice ?? 0) : "0";
      const computedTotal = String(
        computeQuotationItemTotal(item.quantity ?? 1, item.unitPrice ?? 0),
      );

      return {
        id: item.id,
        itemType: item.itemType ?? "service",
        eventServiceId: item.eventServiceId ? String(item.eventServiceId) : "",
        serviceId: item.serviceId ? String(item.serviceId) : "",
        eventVendorId: item.eventVendorId ? String(item.eventVendorId) : "",
        vendorId: item.vendorId ? String(item.vendorId) : "",
        pricingPlanId: item.pricingPlanId ? String(item.pricingPlanId) : "",
        itemName: item.itemName,
        category: item.category ?? "",
        quantity,
        unitPrice,
        totalPrice,
        notes: item.notes ?? "",
        sortOrder: String(item.sortOrder ?? 0),
        isTotalManual: isVendorItem ? totalPrice !== computedTotal : false,
      } satisfies QuotationItemFormData;
    });

    form.reset({
      createMode: "manual",
      eventId: String(quotation.eventId),
      quotationNumber: quotation.quotationNumber ?? "",
      issueDate: quotation.issueDate,
      validUntil: quotation.validUntil ?? "",
      discountAmount:
        quotation.discountAmount != null
          ? String(quotation.discountAmount)
          : "0",
      manualServicesTotal: String(serviceSummaryItem?.totalPrice ?? 0),
      notes: quotation.notes ?? "",
      status: quotation.status,
      eventServiceIds: [],
      eventVendorIds: [],
      items: mappedItems,
    });
    replaceItems(mappedItems);
  }, [form, isEditMode, quotation, replaceItems]);

  useEffect(() => {
    if (isEditMode) return;

    if (!watchedEventId) {
      previousEventIdRef.current = "";
      replaceItems([]);
      form.setValue("eventServiceIds", []);
      form.setValue("eventVendorIds", []);
      return;
    }

    if (!previousEventIdRef.current) {
      previousEventIdRef.current = watchedEventId;
      return;
    }

    if (previousEventIdRef.current !== watchedEventId) {
      replaceItems([]);
      form.setValue("eventServiceIds", [], { shouldDirty: true });
      form.setValue("eventVendorIds", [], { shouldDirty: true });
    }

    previousEventIdRef.current = watchedEventId;
  }, [form, isEditMode, replaceItems, watchedEventId]);

  useEffect(() => {
    if (isEditMode || watchedCreateMode !== "from_event" || !watchedEventId) {
      previousAutoSelectSignatureRef.current = "";
      return;
    }
    if (!eventServicesResponse || !eventVendorsResponse) return;

    const signature = `${watchedCreateMode}:${watchedEventId}`;
    if (previousAutoSelectSignatureRef.current === signature) return;

    form.setValue(
      "eventServiceIds",
      eventServices.map((item) => String(item.id)),
      { shouldDirty: true, shouldValidate: true },
    );
    form.setValue(
      "eventVendorIds",
      eventVendors
        .filter((item) => !getEventVendorDisabledReason(item))
        .map((item) => String(item.id)),
      { shouldDirty: true, shouldValidate: true },
    );
    previousAutoSelectSignatureRef.current = signature;
  }, [
    eventServices,
    eventServicesResponse,
    eventVendors,
    eventVendorsResponse,
    form,
    isEditMode,
    watchedCreateMode,
    watchedEventId,
  ]);

  const syncComputedTotal = (
    index: number,
    nextQuantity: string,
    nextUnitPrice: string,
  ) => {
    if (form.getValues(`items.${index}.isTotalManual`)) return;
    form.setValue(
      `items.${index}.totalPrice`,
      String(computeQuotationItemTotal(nextQuantity, nextUnitPrice)),
      { shouldDirty: true, shouldValidate: true },
    );
  };

  const handleQuantityChange = (
    index: number,
    event: ChangeEvent<HTMLInputElement>,
    onChange: (...event: any[]) => void,
  ) => {
    onChange(event);
    syncComputedTotal(
      index,
      event.target.value,
      form.getValues(`items.${index}.unitPrice`),
    );
  };

  const handleUnitPriceChange = (
    index: number,
    event: ChangeEvent<HTMLInputElement>,
    onChange: (...event: any[]) => void,
  ) => {
    onChange(event);
    syncComputedTotal(
      index,
      form.getValues(`items.${index}.quantity`),
      event.target.value,
    );
  };

  const handleTotalPriceChange = (
    index: number,
    event: ChangeEvent<HTMLInputElement>,
    onChange: (...event: any[]) => void,
  ) => {
    onChange(event);
    const nextValue = event.target.value.trim();
    if (!nextValue) {
      form.setValue(`items.${index}.isTotalManual`, false, {
        shouldDirty: true,
      });
      form.setValue(
        `items.${index}.totalPrice`,
        String(
          computeQuotationItemTotal(
            form.getValues(`items.${index}.quantity`),
            form.getValues(`items.${index}.unitPrice`),
          ),
        ),
        { shouldDirty: true, shouldValidate: true },
      );
      return;
    }
    form.setValue(`items.${index}.isTotalManual`, true, { shouldDirty: true });
  };

  const replaceManualItems = (nextItems: QuotationItemFormData[]) => {
    replaceItems(normalizeSortOrder(nextItems));
  };

  const toggleManualEventService = (
    item: EventServiceItem,
    checked: boolean,
  ) => {
    const current = form.getValues("items");
    if (checked) {
      if (
        current.some(
          (row) =>
            row.itemType === "service" &&
            row.eventServiceId === String(item.id),
        )
      )
        return;
      replaceManualItems([
        ...current,
        buildServiceItemFromEventService(item, current.length),
      ]);
      return;
    }
    replaceManualItems(
      current.filter(
        (row) =>
          !(
            row.itemType === "service" && row.eventServiceId === String(item.id)
          ),
      ),
    );
  };

  const toggleManualCatalogService = (service: Service, checked: boolean) => {
    const current = form.getValues("items");
    if (checked) {
      if (
        current.some(
          (row) =>
            row.itemType === "service" &&
            row.serviceId === String(service.id) &&
            !row.eventServiceId,
        )
      )
        return;
      replaceManualItems([
        ...current,
        buildServiceItemFromService(service, current.length),
      ]);
      return;
    }
    replaceManualItems(
      current.filter(
        (row) =>
          !(
            row.itemType === "service" &&
            row.serviceId === String(service.id) &&
            !row.eventServiceId
          ),
      ),
    );
  };

  const toggleManualEventVendor = (item: EventVendorLink, checked: boolean) => {
    if (getEventVendorDisabledReason(item)) return;
    const current = form.getValues("items");
    if (checked) {
      if (
        current.some(
          (row) =>
            row.itemType === "vendor" && row.eventVendorId === String(item.id),
        )
      )
        return;
      replaceManualItems([
        ...current,
        buildVendorItemFromEventVendor(item, current.length),
      ]);
      return;
    }
    replaceManualItems(
      current.filter(
        (row) =>
          !(row.itemType === "vendor" && row.eventVendorId === String(item.id)),
      ),
    );
  };

  const toggleManualCatalogVendor = (
    vendor: CatalogVendorLike,
    checked: boolean,
  ) => {
    const current = form.getValues("items");
    const vendorId = String(vendor.id);

    if (checked) {
      if (
        current.some(
          (row) =>
            row.itemType === "vendor" &&
            row.vendorId === vendorId &&
            !row.eventVendorId,
        )
      )
        return;

      const config =
        catalogVendorConfigs[vendorId] ?? createDefaultCatalogVendorConfig(vendorId);

      setCatalogVendorConfigs((previous) =>
        previous[vendorId]
          ? previous
          : {
              ...previous,
              [vendorId]: config,
            },
      );

      replaceManualItems([
        ...current,
        buildVendorItemFromCatalogVendor(vendor, config, current.length),
      ]);
      return;
    }

    setCatalogVendorConfigs((previous) => {
      if (!previous[vendorId]) {
        return previous;
      }

      const next = { ...previous };
      delete next[vendorId];
      return next;
    });

    replaceManualItems(
      current.filter(
        (row) =>
          !(
            row.itemType === "vendor" &&
            row.vendorId === vendorId &&
            !row.eventVendorId
          ),
      ),
    );
  };

  const handleRemoveManualRow = (index: number) => {
    const current = [...form.getValues("items")];
    current.splice(index, 1);
    replaceManualItems(current);
  };

  const toggleEventService = (serviceId: string, checked: boolean) => {
    const current = form.getValues("eventServiceIds");
    form.setValue(
      "eventServiceIds",
      checked
        ? [...new Set([...current, serviceId])]
        : current.filter((value) => value !== serviceId),
      { shouldDirty: true, shouldValidate: true },
    );
  };

  const toggleEventVendor = (vendorId: string, checked: boolean) => {
    const current = form.getValues("eventVendorIds");
    form.setValue(
      "eventVendorIds",
      checked
        ? [...new Set([...current, vendorId])]
        : current.filter((value) => value !== vendorId),
      { shouldDirty: true, shouldValidate: true },
    );
  };

  const submit = (values: FormValues) => {
    if (isEditMode) {
      const editPayloadItems = buildEditModePayloadItems(
        values.items,
        values.manualServicesTotal,
        serviceSummaryItemIdRef.current,
      );
      const editTotals = computeQuotationTotals({
        items: editPayloadItems,
        discountAmount: values.discountAmount,
      });
      const payload: QuotationUpdateFormData = {
        quotationNumber: values.quotationNumber,
        issueDate: values.issueDate,
        validUntil: values.validUntil,
        subtotal: String(editTotals.subtotal),
        discountAmount: values.discountAmount,
        notes: values.notes,
        status: values.status,
        items: editPayloadItems,
      };
      updateMutation.mutate(payload);
      return;
    }

    if (values.createMode === "from_event") {
      const payload: QuotationFromEventSubmitPayload = {
        eventId: values.eventId,
        quotationNumber: values.quotationNumber,
        issueDate: values.issueDate,
        validUntil: values.validUntil,
        subtotal: String(fromEventTotals.subtotal),
        discountAmount: values.discountAmount,
        manualServicesTotal: values.manualServicesTotal
          ? Number(values.manualServicesTotal)
          : 0,
        notes: values.notes,
        eventServiceIds: values.eventServiceIds,
        eventVendorIds: values.eventVendorIds,
        status: values.status,
      };
      createFromEventMutation.mutate(payload);
      return;
    }

    const manualPayloadItems = buildManualModePayloadItems(
      values.items,
      values.manualServicesTotal,
    );
    const payload: QuotationFormData = {
      eventId: values.eventId,
      quotationNumber: values.quotationNumber,
      issueDate: values.issueDate,
      validUntil: values.validUntil,
      subtotal: String(
        computeQuotationTotals({
          items: manualPayloadItems,
          discountAmount: values.discountAmount,
        }).subtotal,
      ),
      discountAmount: values.discountAmount,
      notes: values.notes,
      status: values.status,
      items: manualPayloadItems,
    };
    createMutation.mutate(payload);
  };

  const handleInvalidSubmit = (errors: FieldErrors<FormValues>) => {
    toast({
      variant: "error",
      title: t("common.error", { defaultValue: "Error" }),
      description:
        getFirstErrorMessage(errors) ??
        t("common.invalidForm", {
          defaultValue: "Please review the quotation form and try again.",
        }),
    });
  };

  if (quotationLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-[var(--lux-text-secondary)]">
        {t("common.loading", { defaultValue: "Loading..." })}
      </div>
    );
  }

  return (
    <ProtectedComponent
      permission={isEditMode ? "quotations.update" : "quotations.create"}
    >
      <PageContainer className="pb-4 pt-4 text-foreground">
        <div dir={i18n.dir()} className="mx-auto w-full max-w-7xl space-y-6">
          <button
            type="button"
            onClick={() =>
              navigate(isEditMode && id ? `/quotations/${id}` : "/quotations")
            }
            className="inline-flex items-center gap-2 text-sm text-[var(--lux-text-secondary)] transition-colors hover:text-[var(--lux-gold)]"
          >
            {"<-"}{" "}
            {isEditMode
              ? t("quotations.backToQuotation", {
                  defaultValue: "Back to Quotation",
                })
              : t("quotations.backToQuotations", {
                  defaultValue: "Back to Quotations",
                })}
          </button>

          <div
            className="overflow-hidden rounded-[4px] border p-4 shadow-luxe"
            style={{
              background: "var(--lux-panel-surface)",
              borderColor: "var(--lux-panel-border)",
            }}
          >
            <div className="flex items-start gap-4">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-[4px] border"
                style={{
                  background: "var(--lux-control-hover)",
                  borderColor: "var(--lux-control-border)",
                  color: "var(--lux-gold)",
                }}
              >
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[var(--lux-heading)]">
                  {isEditMode
                    ? t("quotations.editTitle", {
                        defaultValue: "Edit Quotation",
                      })
                    : t("quotations.createTitle", {
                        defaultValue: "Create Quotation",
                      })}
                </h1>
                <p className="text-sm text-[var(--lux-text-secondary)]">
                  {isEditMode
                    ? t("quotations.editDescription", {
                        defaultValue:
                          "Update quotation header details and revise the existing line items.",
                      })
                    : t("quotations.createDescription", {
                        defaultValue:
                          "Create one quotation with mixed service and vendor items, or build it directly from event selections.",
                      })}
                </p>
              </div>
            </div>
          </div>

          <Card className="overflow-hidden rounded-[4px]">
            <div className="p-6 md:p-8">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(submit, handleInvalidSubmit)}
                  className="space-y-8"
                >
                  {formErrorMessage ? (
                    <FormFeedbackBanner
                      tone="error"
                      title={t("common.validationError", {
                        defaultValue: "Review the highlighted fields",
                      })}
                      message={formErrorMessage}
                    />
                  ) : null}

                  {isWorkflowLocked ? (
                    <WorkflowLockBanner
                      title={t("quotations.editLockedTitle", {
                        defaultValue: "Quotation Editing Locked",
                      })}
                      message={
                        quotationLockMessage ??
                        t("quotations.editLockedHint", {
                          defaultValue:
                            "This quotation is locked by workflow state. Review it from the detail page and use workflow actions there instead of editing the commercial form.",
                        })
                      }
                    />
                  ) : null}

                  <fieldset
                    disabled={isBusy || isWorkflowLocked}
                    className="space-y-8 [&_textarea:disabled]:border-dashed [&_textarea:disabled]:border-[var(--lux-row-border)] [&_textarea:disabled]:bg-[var(--lux-row-surface)] [&_textarea:disabled]:text-[var(--lux-text-secondary)]"
                  >
                  {!isEditMode ? (
                    <section className="space-y-4">
                      <div className="space-y-1">
                        <h2 className={sectionTitleClass}>
                          {t("quotations.createModeTitle", {
                            defaultValue: "Creation Mode",
                          })}
                        </h2>
                        <p className={sectionHintClass}>
                          {t("quotations.createModeHint", {
                            defaultValue:
                              "Choose whether to prepare the quotation manually or create it from event selections.",
                          })}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <button
                          type="button"
                          className={cn(
                            "rounded-[4px] border p-5 text-start transition-all",
                            watchedCreateMode === "manual"
                              ? "border-[var(--lux-gold-border)] bg-[var(--lux-control-hover)]"
                              : "border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)]",
                          )}
                          onClick={() =>
                            form.setValue("createMode", "manual", {
                              shouldDirty: true,
                            })
                          }
                        >
                          <div className="font-semibold text-[var(--lux-heading)]">
                            {t("quotations.manualMode", {
                              defaultValue: "Manual Quotation",
                            })}
                          </div>
                          <p className="mt-2 text-sm text-[var(--lux-text-secondary)]">
                            {t("quotations.manualModeHint", {
                              defaultValue:
                                "Choose services and companies from checklists, even when the event is still empty.",
                            })}
                          </p>
                        </button>

                        <button
                          type="button"
                          className={cn(
                            "rounded-[4px] border p-5 text-start transition-all",
                            watchedCreateMode === "from_event"
                              ? "border-[var(--lux-gold-border)] bg-[var(--lux-control-hover)]"
                              : "border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)]",
                          )}
                          onClick={() =>
                            form.setValue("createMode", "from_event", {
                              shouldDirty: true,
                            })
                          }
                        >
                          <div className="font-semibold text-[var(--lux-heading)]">
                            {t("quotations.fromEventMode", {
                              defaultValue: "Create From Event",
                            })}
                          </div>
                          <p className="mt-2 text-sm text-[var(--lux-text-secondary)]">
                            {t("quotations.fromEventModeHint", {
                              defaultValue:
                                "Select event services and event vendors together, then create one quotation.",
                            })}
                          </p>
                        </button>
                      </div>
                    </section>
                  ) : null}

                  <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <FieldBlock
                      label={t("quotations.event", { defaultValue: "Event" })}
                      error={form.formState.errors.eventId?.message}
                    >
                      <Select
                        value={form.watch("eventId") || "none"}
                        onValueChange={(value) =>
                          form.setValue(
                            "eventId",
                            value === "none" ? "" : value,
                            {
                              shouldDirty: true,
                              shouldValidate: true,
                            },
                          )
                        }
                        disabled={isEditMode}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t("quotations.selectEvent", {
                              defaultValue: "Select event",
                            })}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {!isEditMode ? (
                            <SelectItem value="none">
                              {t("quotations.selectEvent", {
                                defaultValue: "Select event",
                              })}
                            </SelectItem>
                          ) : null}
                          {events.map((event) => (
                            <SelectItem key={event.id} value={String(event.id)}>
                              {getEventDisplayTitle(event)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FieldBlock>

                    <FieldBlock
                      label={t("quotations.quotationNumber", {
                        defaultValue: "Quotation Number",
                      })}
                    >
                      <Input
                        placeholder={t("quotations.quotationNumber", {
                          defaultValue: "Quotation Number",
                        })}
                        {...form.register("quotationNumber")}
                      />
                    </FieldBlock>

                    <div className="md:col-span-2">
                      <WorkflowLockBanner
                        title={t("quotations.statusManagedByWorkflow", {
                          defaultValue: "Status Managed by Workflow",
                        })}
                        message={t("quotations.statusManagedByWorkflowHint", {
                          defaultValue:
                            "Quotations start in draft. Use the quotation detail screen workflow actions to send, approve, reject, expire, or supersede the document.",
                        })}
                      />
                    </div>

                    <FieldBlock
                      label={t("quotations.issueDate", {
                        defaultValue: "Issue Date",
                      })}
                      error={form.formState.errors.issueDate?.message}
                    >
                      <Input type="date" {...form.register("issueDate")} />
                    </FieldBlock>

                    <FieldBlock
                      label={t("quotations.validUntil", {
                        defaultValue: "Valid Until",
                      })}
                    >
                      <Input type="date" {...form.register("validUntil")} />
                    </FieldBlock>

                    <FieldBlock
                      label={t("quotations.subtotal", {
                        defaultValue: "Subtotal",
                      })}
                    >
                      <Input value={String(totals.subtotal)} readOnly />
                    </FieldBlock>

                    <FieldBlock
                      label={t("quotations.discount", {
                        defaultValue: "Discount",
                      })}
                      error={form.formState.errors.discountAmount?.message}
                    >
                      <Input
                        type="number"
                        min="0"
                        step="0.001"
                        {...form.register("discountAmount")}
                      />
                    </FieldBlock>

                    <div className="md:col-span-2 xl:col-span-3">
                      <FieldBlock
                        label={t("quotations.totalServicesAmount", {
                          defaultValue: "Total Services Amount",
                        })}
                        error={
                          form.formState.errors.manualServicesTotal?.message
                        }
                      >
                        <div className="space-y-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.001"
                            {...form.register("manualServicesTotal")}
                          />
                          <p className="text-xs text-[var(--lux-text-secondary)]">
                            {t("quotations.totalServicesAmountHint", {
                              defaultValue:
                                "Service pricing is entered here as one overall amount. Company/vendor costs are added as separate rows.",
                            })}
                          </p>
                        </div>
                      </FieldBlock>
                    </div>
                  </section>

                  <FieldBlock
                    label={t("common.notes", { defaultValue: "Notes" })}
                  >
                    <textarea
                      {...form.register("notes")}
                      className={textAreaClass}
                      placeholder={t("common.notes", { defaultValue: "Notes" })}
                      style={{
                        background: "var(--lux-control-surface)",
                        borderColor: "var(--lux-control-border)",
                      }}
                    />
                  </FieldBlock>

                  {!isEditMode && watchedCreateMode === "manual" ? (
                    <section className="space-y-6">
                      <div className="space-y-1">
                        <h2 className={sectionTitleClass}>
                          {t("quotations.manualChecklistTitle", {
                            defaultValue: "Select services and companies",
                          })}
                        </h2>
                        <p className={sectionHintClass}>
                          {t("quotations.manualChecklistHint", {
                            defaultValue:
                              "Use event-linked items when they exist, or choose from the full system catalogs when the event is empty.",
                          })}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                        <SelectionCard
                          title={t("quotations.servicesChecklistTitle", {
                            defaultValue: "Services",
                          })}
                          hint={t("quotations.servicesChecklistHint", {
                            defaultValue:
                              "Choose from event services or from the service catalog. Selected items are added directly to the quotation rows.",
                          })}
                        >
                          <div className="space-y-4">
                            <div>
                              <div className="mb-2 text-sm font-semibold text-[var(--lux-heading)]">
                                {t("quotations.eventServices", {
                                  defaultValue: "Event Services",
                                })}
                              </div>
                              {!watchedEventId ? (
                                <EmptyHint
                                  text={t(
                                    "quotations.selectEventBeforeServices",
                                    { defaultValue: "Select an event first." },
                                  )}
                                />
                              ) : eventServices.length === 0 ? (
                                <EmptyHint
                                  text={t(
                                    "quotations.noEventServicesForEvent",
                                    {
                                      defaultValue:
                                        "This event has no services yet.",
                                    },
                                  )}
                                />
                              ) : (
                                <div className="space-y-3">
                                  {eventServices.map((item) => (
                                    <SelectableCard
                                      key={`event-service-${item.id}`}
                                      checked={selectedManualEventServiceIds.includes(
                                        String(item.id),
                                      )}
                                      onCheckedChange={(value) =>
                                        toggleManualEventService(item, value)
                                      }
                                      title={item.serviceNameSnapshot}
                                      subtitle={t(
                                        `services.category.${item.category}`,
                                        {
                                          defaultValue:
                                            formatQuotationItemCategory(
                                              item.category,
                                            ),
                                        },
                                      )}
                                      meta={[
                                        `${t("quotations.quantity", { defaultValue: "Quantity" })}: ${item.quantity ?? 1}`,
                                        t(
                                          "quotations.totalServicesAmountHintShort",
                                          {
                                            defaultValue:
                                              "Pricing handled by Total Services Amount",
                                          },
                                        ),
                                      ]}
                                      helperText={item.notes ?? undefined}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>

                            <div>
                              <div className="mb-2 text-sm font-semibold text-[var(--lux-heading)]">
                                {t("quotations.catalogServices", {
                                  defaultValue: "Catalog Services",
                                })}
                              </div>
                              {services.length === 0 ? (
                                <EmptyHint
                                  text={t("quotations.noCatalogServices", {
                                    defaultValue: "No catalog services found.",
                                  })}
                                />
                              ) : (
                                <div className="space-y-3">
                                  {services.map((service) => (
                                    <SelectableCard
                                      key={`catalog-service-${service.id}`}
                                      checked={selectedManualCatalogServiceIds.includes(
                                        String(service.id),
                                      )}
                                      onCheckedChange={(value) =>
                                        toggleManualCatalogService(
                                          service,
                                          value,
                                        )
                                      }
                                      title={service.name}
                                      subtitle={t(
                                        `services.category.${service.category}`,
                                        {
                                          defaultValue:
                                            formatQuotationItemCategory(
                                              service.category,
                                            ),
                                        },
                                      )}
                                      meta={[
                                        t("quotations.catalogServiceSource", {
                                          defaultValue:
                                            "Source: service catalog",
                                        }),
                                        t(
                                          "quotations.totalServicesAmountHintShort",
                                          {
                                            defaultValue:
                                              "Pricing handled by Total Services Amount",
                                          },
                                        ),
                                      ]}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </SelectionCard>

                        <SelectionCard
                          title={t("quotations.companiesChecklistTitle", {
                            defaultValue: "Companies / Vendors",
                          })}
                          hint={t("quotations.companiesChecklistHint", {
                            defaultValue:
                              "Choose from event companies when they exist, or from the vendor catalog when the event is empty.",
                          })}
                        >
                          <div className="space-y-4">
                            <div>
                              <div className="mb-2 text-sm font-semibold text-[var(--lux-heading)]">
                                {t("quotations.eventVendors", {
                                  defaultValue: "Event Companies",
                                })}
                              </div>
                              {!watchedEventId ? (
                                <EmptyHint
                                  text={t(
                                    "quotations.selectEventBeforeVendors",
                                    { defaultValue: "Select an event first." },
                                  )}
                                />
                              ) : eventVendors.length === 0 ? (
                                <EmptyHint
                                  text={t("quotations.noEventVendorsForEvent", {
                                    defaultValue:
                                      "This event has no companies yet.",
                                  })}
                                />
                              ) : (
                                <div className="space-y-3">
                                  {eventVendors.map((item) => {
                                    const disabledReason =
                                      getEventVendorDisabledReason(item);
                                    return (
                                      <SelectableCard
                                        key={`event-vendor-${item.id}`}
                                        checked={selectedManualEventVendorIds.includes(
                                          String(item.id),
                                        )}
                                        disabled={Boolean(disabledReason)}
                                        onCheckedChange={(value) =>
                                          toggleManualEventVendor(item, value)
                                        }
                                        title={getEventVendorDisplayName(item)}
                                        subtitle={t(
                                          `vendors.type.${item.vendorType}`,
                                          {
                                            defaultValue: formatVendorType(
                                              item.vendorType,
                                            ),
                                          },
                                        )}
                                        meta={[
                                          `${t("quotations.agreedPrice", { defaultValue: "Agreed Price" })}: ${safeMoney(item.agreedPrice)}`,
                                          `${t("quotations.itemStatus", { defaultValue: "Status" })}: ${item.status}`,
                                        ]}
                                        helperText={
                                          disabledReason === "cancelled"
                                            ? t(
                                                "quotations.cannotSelectCancelledVendor",
                                                {
                                                  defaultValue:
                                                    "Cannot select cancelled vendor",
                                                },
                                              )
                                            : disabledReason === "missing_price"
                                              ? t(
                                                  "quotations.vendorHasNoAgreedPrice",
                                                  {
                                                    defaultValue:
                                                      "Vendor has no agreed price",
                                                  },
                                                )
                                              : item.notes || undefined
                                        }
                                      />
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            <div>
                              <div className="mb-2 text-sm font-semibold text-[var(--lux-heading)]">
                                {t("quotations.catalogVendors", {
                                  defaultValue: "Vendor Catalog",
                                })}
                              </div>
                              {catalogVendors.length === 0 ? (
                                <EmptyHint
                                  text={t("quotations.noCatalogVendors", {
                                    defaultValue: "No catalog vendors found.",
                                  })}
                                />
                              ) : (
                                <div className="space-y-3">
                                  {catalogVendors.map((vendor) => (
                                    <CatalogVendorSelectionCard
                                      key={`catalog-vendor-${vendor.id}`}
                                      vendor={vendor}
                                      checked={selectedManualCatalogVendorIds.includes(
                                        String(vendor.id),
                                      )}
                                      config={
                                        catalogVendorConfigs[String(vendor.id)]
                                      }
                                      t={t}
                                      onCheckedChange={(value) =>
                                        toggleManualCatalogVendor(vendor, value)
                                      }
                                      onConfigChange={updateCatalogVendorConfig}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </SelectionCard>
                      </div>

                      <EditableItemsSection
                        t={t}
                        fields={itemFields}
                        items={watchedItems}
                        manualServiceSummaryItem={
                          getManualServicesTotalValue(
                            watchedManualServicesTotal,
                          ) > 0
                            ? buildManualServiceItem(
                                watchedManualServicesTotal,
                                0,
                              )
                            : null
                        }
                        form={form}
                        isEditMode={false}
                        onRemove={handleRemoveManualRow}
                        onQuantityChange={handleQuantityChange}
                        onUnitPriceChange={handleUnitPriceChange}
                        onTotalPriceChange={handleTotalPriceChange}
                      />
                    </section>
                  ) : null}

                  {!isEditMode && watchedCreateMode === "from_event" ? (
                    <section className="space-y-6">
                      <div className="space-y-1">
                        <h2 className={sectionTitleClass}>
                          {t("quotations.createFromEvent", {
                            defaultValue: "Create quotation from event",
                          })}
                        </h2>
                        <p className={sectionHintClass}>
                          {t("quotations.fromEventSelectionHint", {
                            defaultValue:
                              "Select event services and event vendors together, then review the mixed preview before creating the quotation.",
                          })}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                        <SelectionCard
                          title={t("quotations.selectedServicesSourceTitle", {
                            defaultValue: "Event Services",
                          })}
                          hint={t("quotations.selectedServicesSourceHint", {
                            defaultValue:
                              "Choose the event service rows to include for scope/reference. Pricing comes from the Total Services Amount field.",
                          })}
                        >
                          {!watchedEventId ? (
                            <EmptyHint
                              text={t("quotations.selectEventBeforeServices", {
                                defaultValue:
                                  "Select an event first to preview its service lines.",
                              })}
                            />
                          ) : eventServices.length === 0 ? (
                            <EmptyHint
                              text={t("quotations.noEventServicesForEvent", {
                                defaultValue:
                                  "No active event services are available for the selected event.",
                              })}
                            />
                          ) : (
                            <div className="space-y-3">
                              {eventServices.map((item) => {
                                const checked = watchedEventServiceIds.includes(
                                  String(item.id),
                                );
                                return (
                                  <SelectableCard
                                    key={item.id}
                                    checked={checked}
                                    onCheckedChange={(value) =>
                                      toggleEventService(String(item.id), value)
                                    }
                                    title={item.serviceNameSnapshot}
                                    subtitle={t(
                                      `services.category.${item.category}`,
                                      {
                                        defaultValue:
                                          formatQuotationItemCategory(
                                            item.category,
                                          ),
                                      },
                                    )}
                                    meta={[
                                      `${t("quotations.quantity", { defaultValue: "Quantity" })}: ${item.quantity ?? 1}`,
                                      t(
                                        "quotations.totalServicesAmountHintShort",
                                        {
                                          defaultValue:
                                            "Pricing handled by Total Services Amount",
                                        },
                                      ),
                                    ]}
                                    helperText={item.notes ?? undefined}
                                  />
                                );
                              })}
                            </div>
                          )}
                        </SelectionCard>

                        <SelectionCard
                          title={t("quotations.selectedVendorsSourceTitle", {
                            defaultValue: "Event Vendors",
                          })}
                          hint={t("quotations.selectedVendorsSourceHint", {
                            defaultValue:
                              "Choose the event vendor rows to include in this quotation.",
                          })}
                        >
                          {!watchedEventId ? (
                            <EmptyHint
                              text={t("quotations.selectEventBeforeVendors", {
                                defaultValue:
                                  "Select an event first to preview its event vendors.",
                              })}
                            />
                          ) : eventVendors.length === 0 ? (
                            <EmptyHint
                              text={t("quotations.noEventVendorsForEvent", {
                                defaultValue:
                                  "No event vendors are available for the selected event.",
                              })}
                            />
                          ) : (
                            <div className="space-y-3">
                              {eventVendors.map((item) => {
                                const checked = watchedEventVendorIds.includes(
                                  String(item.id),
                                );
                                const disabledReason =
                                  getEventVendorDisabledReason(item);
                                return (
                                  <SelectableCard
                                    key={item.id}
                                    checked={checked}
                                    disabled={Boolean(disabledReason)}
                                    onCheckedChange={(value) =>
                                      toggleEventVendor(String(item.id), value)
                                    }
                                    title={getEventVendorDisplayName(item)}
                                    subtitle={t(
                                      `vendors.type.${item.vendorType}`,
                                      {
                                        defaultValue: formatVendorType(
                                          item.vendorType,
                                        ),
                                      },
                                    )}
                                    meta={[
                                      `${t("quotations.agreedPrice", { defaultValue: "Agreed Price" })}: ${safeMoney(item.agreedPrice)}`,
                                      `${t("quotations.pricingPlan", { defaultValue: "Pricing Plan" })}: ${item.pricingPlan?.name || "-"}`,
                                      `${t("quotations.vendorType", { defaultValue: "Vendor Type" })}: ${t(`vendors.type.${item.vendorType}`, { defaultValue: formatVendorType(item.vendorType) })}`,
                                      `${t("quotations.selectedSubServicesCount", { defaultValue: "Selected Sub-Services" })}: ${item.selectedSubServicesCount ?? 0}`,
                                      `${t("quotations.itemStatus", { defaultValue: "Status" })}: ${item.status}`,
                                    ]}
                                    helperText={
                                      disabledReason === "cancelled"
                                        ? t(
                                            "quotations.cannotSelectCancelledVendor",
                                            {
                                              defaultValue:
                                                "Cannot select cancelled vendor",
                                            },
                                          )
                                        : disabledReason === "missing_price"
                                          ? t(
                                              "quotations.vendorHasNoAgreedPrice",
                                              {
                                                defaultValue:
                                                  "Vendor has no agreed price",
                                              },
                                            )
                                          : item.notes || undefined
                                    }
                                  />
                                );
                              })}
                            </div>
                          )}
                        </SelectionCard>
                      </div>

                      {form.formState.errors.eventServiceIds ? (
                        <p className="text-sm font-medium text-[var(--lux-danger)]">
                          {String(
                            form.formState.errors.eventServiceIds.message,
                          )}
                        </p>
                      ) : null}

                      <PreviewSummary
                        t={t}
                        selectedServicesCount={selectedEventServices.length}
                        selectedVendorsCount={
                          selectedEventVendors.filter(
                            (item) => !getEventVendorDisabledReason(item),
                          ).length
                        }
                        manualServicesTotal={watchedManualServicesTotal || "0"}
                        previewItems={fromEventPreviewItems}
                      />
                    </section>
                  ) : null}

                  {isEditMode ? (
                    <section className="space-y-6">
                      <div className="space-y-1">
                        <h2 className={sectionTitleClass}>
                          {t("quotations.itemsTitle", {
                            defaultValue: "Quotation Items",
                          })}
                        </h2>
                        <p className={sectionHintClass}>
                          {t("quotations.editItemsHint", {
                            defaultValue:
                              "Update the existing quotation items, including mixed service and vendor rows.",
                          })}
                        </p>
                      </div>

                      <EditableItemsSection
                        t={t}
                        fields={itemFields}
                        items={watchedItems}
                        manualServiceSummaryItem={
                          getManualServicesTotalValue(
                            watchedManualServicesTotal,
                          ) > 0 ||
                          typeof serviceSummaryItemIdRef.current === "number"
                            ? buildManualServiceItem(
                                watchedManualServicesTotal,
                                0,
                              )
                            : null
                        }
                        form={form}
                        isEditMode
                        onRemove={handleRemoveManualRow}
                        onQuantityChange={handleQuantityChange}
                        onUnitPriceChange={handleUnitPriceChange}
                        onTotalPriceChange={handleTotalPriceChange}
                      />
                    </section>
                  ) : null}

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <SummaryTile
                      label={t("quotations.subtotal", {
                        defaultValue: "Subtotal",
                      })}
                      value={formatMoney(totals.subtotal)}
                    />
                    <SummaryTile
                      label={t("quotations.discount", {
                        defaultValue: "Discount",
                      })}
                      value={formatMoney(totals.discountAmount)}
                    />
                    <SummaryTile
                      label={t("quotations.totalAmount", {
                        defaultValue: "Total Amount",
                      })}
                      value={formatMoney(totals.totalAmount)}
                      emphasis
                    />
                  </div>
                  </fieldset>

                  <div
                    className="flex flex-col gap-3 border-t pt-6 sm:flex-row sm:justify-end"
                    style={{ borderColor: "var(--lux-row-border)" }}
                  >
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        navigate(
                          isEditMode && id
                            ? `/quotations/${id}`
                            : "/quotations",
                        )
                      }
                      disabled={isBusy}
                    >
                      {t("common.cancel", { defaultValue: "Cancel" })}
                    </Button>
                    {isWorkflowLocked ? (
                      <Button
                        type="button"
                        onClick={() =>
                          navigate(
                            isEditMode && id
                              ? `/quotations/${id}`
                              : "/quotations",
                          )
                        }
                      >
                        {t("quotations.returnToDetails", {
                          defaultValue: "Return to Quotation",
                        })}
                      </Button>
                    ) : (
                      <Button type="submit" disabled={isBusy}>
                        {isBusy
                          ? t("common.processing", {
                              defaultValue: "Processing...",
                            })
                          : isEditMode
                            ? t("common.update", { defaultValue: "Update" })
                            : t("common.create", { defaultValue: "Create" })}
                      </Button>
                    )}
                  </div>
                </form>
              </Form>
            </div>
          </Card>
        </div>
      </PageContainer>
    </ProtectedComponent>
  );
};

function SelectionCard({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <div
      className="rounded-[4px] border p-5"
      style={{
        background: "var(--lux-panel-surface)",
        borderColor: "var(--lux-row-border)",
      }}
    >
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-[var(--lux-heading)]">
          {title}
        </h3>
        <p className="text-sm text-[var(--lux-text-secondary)]">{hint}</p>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div
      className="rounded-[4px] border px-4 py-3 text-sm text-[var(--lux-text-secondary)]"
      style={{
        background: "var(--lux-control-surface)",
        borderColor: "var(--lux-row-border)",
      }}
    >
      {text}
    </div>
  );
}

function SelectableCard({
  checked,
  disabled,
  onCheckedChange,
  title,
  subtitle,
  meta,
  helperText,
}: {
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
  title: string;
  subtitle?: string;
  meta: string[];
  helperText?: string;
}) {
  return (
    <label
      className={cn(
        "flex gap-4 rounded-[4px] border p-4",
        disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer",
        checked
          ? "border-[var(--lux-gold-border)] bg-[var(--lux-control-hover)]"
          : "border-[var(--lux-row-border)] bg-[var(--lux-control-surface)]",
      )}
    >
      <Checkbox
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) => onCheckedChange(Boolean(value))}
      />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="font-semibold text-[var(--lux-heading)]">{title}</div>
        {subtitle ? (
          <div className="text-xs text-[var(--lux-text-secondary)]">
            {subtitle}
          </div>
        ) : null}
        <div className="grid grid-cols-1 gap-2 text-xs text-[var(--lux-text-secondary)] md:grid-cols-2">
          {meta.map((item) => (
            <div key={item}>{item}</div>
          ))}
        </div>
        {helperText ? (
          <div className="text-xs text-[var(--lux-text-secondary)]">
            {helperText}
          </div>
        ) : null}
      </div>
    </label>
  );
}

function CatalogVendorSelectionCard({
  vendor,
  checked,
  config,
  t,
  onCheckedChange,
  onConfigChange,
}: {
  vendor: CatalogVendorLike;
  checked: boolean;
  config?: SelectedCatalogVendorConfig;
  t: (key: string, options?: Record<string, unknown>) => string;
  onCheckedChange: (checked: boolean) => void;
  onConfigChange: (
    vendorId: string,
    updater: (
      current: SelectedCatalogVendorConfig,
    ) => SelectedCatalogVendorConfig,
  ) => void;
}) {
  const vendorId = String(vendor.id);
  const resolvedConfig = config ?? createDefaultCatalogVendorConfig(vendorId);
  const { data: subServicesResponse, isLoading: subServicesLoading } =
    useVendorSubServices({
      currentPage: 1,
      itemsPerPage: 200,
      searchQuery: "",
      vendorId: Number(vendor.id),
      vendorType: vendor.type ?? "all",
      isActive: "all",
      enabled: checked,
    });
  const { data: pricingPlansResponse, isLoading: pricingPlansLoading } =
    useVendorPricingPlans({
      currentPage: 1,
      itemsPerPage: 200,
      searchQuery: "",
      vendorId: Number(vendor.id),
      vendorType: vendor.type ?? "all",
      isActive: "all",
      enabled: checked,
    });

  const subServices = useMemo(
    () =>
      [...(subServicesResponse?.data ?? [])].sort((left, right) => {
        if (left.isActive !== right.isActive) {
          return left.isActive ? -1 : 1;
        }

        if (left.sortOrder !== right.sortOrder) {
          return left.sortOrder - right.sortOrder;
        }

        return left.name.localeCompare(right.name);
      }),
    [subServicesResponse?.data],
  );
  const pricingPlans = useMemo(
    () => pricingPlansResponse?.data ?? [],
    [pricingPlansResponse?.data],
  );
  const matchedPricingPlan = useMemo(
    () =>
      findMatchingVendorPricingPlan(
        pricingPlans,
        resolvedConfig.selectedSubServiceIds.length,
      ),
    [pricingPlans, resolvedConfig.selectedSubServiceIds.length],
  );
  const calculatedPrice = useMemo(
    () => formatDecimalInput(matchedPricingPlan?.price),
    [matchedPricingPlan?.price],
  );

  useEffect(() => {
    if (!checked || resolvedConfig.isPriceOverride) {
      return;
    }

    const nextPricingPlanId = matchedPricingPlan
      ? String(matchedPricingPlan.id)
      : "";
    const nextCalculatedPrice = calculatedPrice;

    if (
      resolvedConfig.pricingPlanId === nextPricingPlanId &&
      resolvedConfig.calculatedPrice === nextCalculatedPrice &&
      resolvedConfig.agreedPrice === nextCalculatedPrice
    ) {
      return;
    }

    onConfigChange(vendorId, (current) => ({
      ...current,
      pricingPlanId: nextPricingPlanId,
      calculatedPrice: nextCalculatedPrice,
      agreedPrice: nextCalculatedPrice,
    }));
  }, [
    calculatedPrice,
    checked,
    matchedPricingPlan,
    onConfigChange,
    resolvedConfig.agreedPrice,
    resolvedConfig.calculatedPrice,
    resolvedConfig.isPriceOverride,
    resolvedConfig.pricingPlanId,
    vendorId,
  ]);

  return (
    <div className="space-y-3">
      <SelectableCard
        checked={checked}
        onCheckedChange={onCheckedChange}
        title={vendor.name}
        subtitle={vendor.type ? formatVendorType(vendor.type) : undefined}
        meta={[
          t("quotations.catalogVendorSource", {
            defaultValue: "Source: vendor catalog",
          }),
          checked
            ? resolvedConfig.pricingPlanId
              ? `${t("quotations.pricingPlan", {
                  defaultValue: "Pricing Plan",
                })}: ${matchedPricingPlan?.name ?? resolvedConfig.pricingPlanId}`
              : t("quotations.vendorPriceAutoMatched", {
                  defaultValue: "Price updates from matched pricing plans",
                })
            : t("quotations.vendorPriceNeedsReview", {
                defaultValue: "Set the price manually after selection",
              }),
        ]}
        helperText={
          checked
            ? t("quotations.catalogVendorSelectionHint", {
                defaultValue:
                  "Choose sub-services to match the vendor pricing plan, then override the agreed amount only if needed.",
              })
            : undefined
        }
      />

      {checked ? (
        <div
          className="space-y-4 rounded-[4px] border px-4 py-4"
          style={{
            background: "var(--lux-panel-surface)",
            borderColor: "var(--lux-row-border)",
          }}
        >
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr,1fr]">
            <div className="space-y-3">
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-[var(--lux-heading)]">
                  {t("quotations.vendorSubServices", {
                    defaultValue: "Vendor Sub-Services",
                  })}
                </h4>
                <p className="text-xs text-[var(--lux-text-secondary)]">
                  {t("quotations.vendorSubServicesHint", {
                    defaultValue:
                      "Select the sub-services included for this vendor in the quotation.",
                  })}
                </p>
              </div>

              {subServicesLoading ? (
                <EmptyHint
                  text={t("quotations.loadingVendorSubServices", {
                    defaultValue: "Loading vendor sub-services...",
                  })}
                />
              ) : subServices.length ? (
                <div className="grid grid-cols-1 gap-2">
                  {subServices.map((subService: VendorSubService) => {
                    const isSelected =
                      resolvedConfig.selectedSubServiceIds.includes(
                        subService.id,
                      );

                    return (
                      <label
                        key={subService.id}
                        className="flex items-start gap-3 rounded-[4px] border p-3"
                        style={{
                          background: isSelected
                            ? "var(--lux-control-hover)"
                            : "var(--lux-control-surface)",
                          borderColor: isSelected
                            ? "var(--lux-gold-border)"
                            : "var(--lux-row-border)",
                        }}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(value) =>
                            onConfigChange(vendorId, (current) => ({
                              ...current,
                              selectedSubServiceIds: Boolean(value)
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
                        <div className="min-w-0 space-y-1">
                          <p className="text-sm font-medium text-[var(--lux-text)]">
                            {subService.name}
                          </p>
                          <p className="text-xs text-[var(--lux-text-secondary)]">
                            {subService.description ||
                              subService.code ||
                              t("quotations.noDescription", {
                                defaultValue: "No description",
                              })}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <EmptyHint
                  text={t("quotations.noVendorSubServicesConfigured", {
                    defaultValue:
                      "No vendor sub-services are configured for this vendor yet.",
                  })}
                />
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-[var(--lux-heading)]">
                  {t("quotations.vendorPricingSummary", {
                    defaultValue: "Pricing Summary",
                  })}
                </h4>
                <p className="text-xs text-[var(--lux-text-secondary)]">
                  {t("quotations.vendorPricingSummaryHint", {
                    defaultValue:
                      "Pricing plans are matched from the selected sub-service count and remain linked even when the agreed amount is overridden.",
                  })}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div
                  className="rounded-[4px] border px-4 py-3"
                  style={{
                    background: "var(--lux-control-surface)",
                    borderColor: "var(--lux-row-border)",
                  }}
                >
                  <div className="text-xs text-[var(--lux-text-secondary)]">
                    {t("quotations.pricingPlan", {
                      defaultValue: "Pricing Plan",
                    })}
                  </div>
                  <div className="mt-1 text-sm font-medium text-[var(--lux-heading)]">
                    {pricingPlansLoading
                      ? t("common.loading", { defaultValue: "Loading..." })
                      : matchedPricingPlan?.name ||
                        (resolvedConfig.selectedSubServiceIds.length
                          ? t("quotations.noMatchingPricingPlan", {
                              defaultValue: "No matching pricing plan",
                            })
                          : t("quotations.noPricingPlanSelected", {
                              defaultValue: "No pricing plan selected",
                            }))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div
                    className="rounded-[4px] border px-4 py-3"
                    style={{
                      background: "var(--lux-control-surface)",
                      borderColor: "var(--lux-row-border)",
                    }}
                  >
                    <div className="text-xs text-[var(--lux-text-secondary)]">
                      {t("quotations.selectedSubServicesCount", {
                        defaultValue: "Selected Count",
                      })}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-[var(--lux-heading)]">
                      {resolvedConfig.selectedSubServiceIds.length}
                    </div>
                  </div>

                  <div
                    className="rounded-[4px] border px-4 py-3"
                    style={{
                      background: "var(--lux-control-surface)",
                      borderColor: "var(--lux-row-border)",
                    }}
                  >
                    <div className="text-xs text-[var(--lux-text-secondary)]">
                      {t("quotations.calculatedPrice", {
                        defaultValue: "Calculated Price",
                      })}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-[var(--lux-heading)]">
                      {resolvedConfig.calculatedPrice
                        ? formatVendorMoney(resolvedConfig.calculatedPrice)
                        : "-"}
                    </div>
                  </div>
                </div>

                <label
                  className="flex items-start gap-3 rounded-[4px] border p-3"
                  style={{
                    background: "var(--lux-control-surface)",
                    borderColor: "var(--lux-row-border)",
                  }}
                >
                  <Checkbox
                    checked={resolvedConfig.isPriceOverride}
                    onCheckedChange={(value) =>
                      onConfigChange(vendorId, (current) => {
                        const nextChecked = Boolean(value);

                        return {
                          ...current,
                          isPriceOverride: nextChecked,
                          agreedPrice: nextChecked
                            ? current.agreedPrice || current.calculatedPrice
                            : current.calculatedPrice,
                        };
                      })
                    }
                  />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[var(--lux-text)]">
                      {t("quotations.manualPriceOverride", {
                        defaultValue: "Manual Price Override",
                      })}
                    </p>
                    <p className="text-xs text-[var(--lux-text-secondary)]">
                      {t("quotations.manualPriceOverrideHint", {
                        defaultValue:
                          "Enable this only when the final agreed amount differs from the matched pricing plan.",
                      })}
                    </p>
                  </div>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-[var(--lux-text)]">
                    {t("quotations.agreedPrice", {
                      defaultValue: "Agreed Price",
                    })}
                  </span>
                  <Input
                    type="number"
                    min="0"
                    step="0.001"
                    value={resolvedConfig.agreedPrice}
                    disabled={!resolvedConfig.isPriceOverride}
                    onChange={(event) =>
                      onConfigChange(vendorId, (current) => ({
                        ...current,
                        agreedPrice: event.target.value,
                      }))
                    }
                    placeholder={t("quotations.agreedPricePlaceholder", {
                      defaultValue: "Calculated automatically when available",
                    })}
                  />
                  <p className="text-xs text-[var(--lux-text-secondary)]">
                    {resolvedConfig.isPriceOverride
                      ? t("quotations.manualPriceOverrideActiveHint", {
                          defaultValue:
                            "Manual override is active. The matched pricing plan remains linked for reference.",
                        })
                      : t("quotations.agreedPriceAutoHint", {
                          defaultValue:
                            "Agreed price follows the matched pricing plan until manual override is enabled.",
                        })}
                  </p>
                </label>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PreviewSummary({
  t,
  selectedServicesCount,
  selectedVendorsCount,
  manualServicesTotal,
  previewItems,
}: {
  t: (key: string, options?: Record<string, unknown>) => string;
  selectedServicesCount: number;
  selectedVendorsCount: number;
  manualServicesTotal: string;
  previewItems: QuotationItemFormData[];
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 text-sm">
        <span className="rounded-[4px] border px-3 py-1 text-[var(--lux-text-secondary)]">
          {t("quotations.selectedServices", {
            defaultValue: "Selected Services",
          })}
          : {selectedServicesCount}
        </span>
        <span className="rounded-[4px] border px-3 py-1 text-[var(--lux-text-secondary)]">
          {t("quotations.selectedVendors", {
            defaultValue: "Selected Vendors",
          })}
          : {selectedVendorsCount}
        </span>
        <span className="rounded-[4px] border px-3 py-1 text-[var(--lux-text-secondary)]">
          {t("quotations.totalServicesAmount", {
            defaultValue: "Total Services Amount",
          })}
          : {formatMoney(getManualServicesTotalValue(manualServicesTotal))}
        </span>
      </div>
      <PreviewTable t={t} items={previewItems} />
    </div>
  );
}

function EditableItemsSection({
  t,
  fields,
  items,
  manualServiceSummaryItem,
  form,
  isEditMode,
  onRemove,
  onQuantityChange,
  onUnitPriceChange,
  onTotalPriceChange,
}: {
  t: (key: string, options?: Record<string, unknown>) => string;
  fields: Array<{ id: string }>;
  items: QuotationItemFormData[];
  manualServiceSummaryItem?: QuotationItemFormData | null;
  form: ReturnType<typeof useForm<FormValues>>;
  isEditMode: boolean;
  onRemove: (index: number) => void;
  onQuantityChange: (
    index: number,
    event: ChangeEvent<HTMLInputElement>,
    onChange: (...event: any[]) => void,
  ) => void;
  onUnitPriceChange: (
    index: number,
    event: ChangeEvent<HTMLInputElement>,
    onChange: (...event: any[]) => void,
  ) => void;
  onTotalPriceChange: (
    index: number,
    event: ChangeEvent<HTMLInputElement>,
    onChange: (...event: any[]) => void,
  ) => void;
}) {
  if (fields.length === 0 && !manualServiceSummaryItem) {
    return (
      <EmptyHint
        text={t("quotations.noItems", {
          defaultValue: "No quotation items are linked to this quotation.",
        })}
      />
    );
  }

  return (
    <div
      className="overflow-x-auto rounded-[4px] border"
      style={{ borderColor: "var(--lux-row-border)" }}
    >
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--lux-row-border)] text-[var(--lux-text-muted)]">
            <th className="px-3 py-3 text-start">
              {t("quotations.type", { defaultValue: "Type" })}
            </th>
            <th className="px-3 py-3 text-start">
              {t("quotations.itemName", { defaultValue: "Item Name" })}
            </th>
            <th className="px-3 py-3 text-start">
              {t("quotations.category", { defaultValue: "Category" })}
            </th>
            <th className="px-3 py-3 text-start">
              {t("quotations.quantity", { defaultValue: "Quantity" })}
            </th>
            <th className="px-3 py-3 text-start">
              {t("quotations.unitPrice", { defaultValue: "Unit Price" })}
            </th>
            <th className="px-3 py-3 text-start">
              {t("quotations.totalPrice", { defaultValue: "Total Price" })}
            </th>
            <th className="px-3 py-3 text-start">
              {t("common.notes", { defaultValue: "Notes" })}
            </th>
            {!isEditMode ? (
              <th className="px-3 py-3 text-start">
                {t("common.actions", { defaultValue: "Actions" })}
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {manualServiceSummaryItem ? (
            <tr
              className="border-b border-[var(--lux-row-border)] align-top"
              style={{ background: "var(--lux-panel-surface)" }}
            >
              <td className="min-w-[120px] px-3 py-3">
                <TypeBadge item={manualServiceSummaryItem} t={t} />
              </td>
              <td className="min-w-[220px] px-3 py-3">
                <div className="font-medium text-[var(--lux-text)]">
                  {manualServiceSummaryItem.itemName}
                </div>
                <div className="mt-2 text-xs text-[var(--lux-text-secondary)]">
                  {t("quotations.totalServicesAmountHint", {
                    defaultValue:
                      "Service pricing is entered here as one overall amount. Company/vendor costs are added as separate rows.",
                  })}
                </div>
              </td>
              <td className="min-w-[160px] px-3 py-3 text-[var(--lux-text-secondary)]">
                {formatQuotationItemCategory(manualServiceSummaryItem.category)}
              </td>
              <td className="min-w-[120px] px-3 py-3 text-[var(--lux-text-secondary)]">
                {manualServiceSummaryItem.quantity}
              </td>
              <td className="min-w-[140px] px-3 py-3 text-[var(--lux-text-secondary)]">
                {safeMoney(manualServiceSummaryItem.unitPrice)}
              </td>
              <td className="min-w-[140px] px-3 py-3 text-[var(--lux-text-secondary)]">
                {safeMoney(manualServiceSummaryItem.totalPrice)}
              </td>
              <td className="min-w-[220px] px-3 py-3 text-[var(--lux-text-secondary)]">
                -
              </td>
              {!isEditMode ? <td className="w-[80px] px-3 py-3" /> : null}
            </tr>
          ) : null}

          {fields.map((field, index) => {
            const itemValues = items[index];
            const isServiceReferenceItem = itemValues?.itemType === "service";
            const itemNameField = form.register(`items.${index}.itemName`);
            const categoryField = form.register(`items.${index}.category`);
            const quantityField = form.register(`items.${index}.quantity`);
            const unitPriceField = form.register(`items.${index}.unitPrice`);
            const totalPriceField = form.register(`items.${index}.totalPrice`);
            const notesField = form.register(`items.${index}.notes`);

            return (
              <tr
                key={field.id}
                className="border-b border-[var(--lux-row-border)] align-top last:border-b-0"
                style={{
                  background:
                    itemValues?.itemType === "vendor"
                      ? "var(--lux-control-hover)"
                      : "var(--lux-panel-surface)",
                }}
              >
                <td className="min-w-[120px] px-3 py-3">
                  <TypeBadge item={itemValues} t={t} />
                </td>
                <td className="min-w-[220px] px-3 py-3">
                  <Input
                    {...itemNameField}
                    placeholder={t("quotations.itemName", {
                      defaultValue: "Item Name",
                    })}
                  />
                  <div className="mt-2 text-xs text-[var(--lux-text-secondary)]">
                    {itemValues?.itemType === "vendor" ? (
                      <>
                        {itemValues.eventVendorId
                          ? `${t("quotations.linkedEventVendor", { defaultValue: "Event Vendor" })}: #${itemValues.eventVendorId}`
                          : itemValues.vendorId
                            ? `${t("quotations.linkedVendor", { defaultValue: "Vendor" })}: #${itemValues.vendorId}`
                            : null}
                        {itemValues.pricingPlanId
                          ? ` • ${t("quotations.pricingPlan", { defaultValue: "Pricing Plan" })}: #${itemValues.pricingPlanId}`
                          : null}
                        <div className="mt-1">
                          {t("quotations.snapshotOnlyHint", {
                            defaultValue:
                              "This changes the quotation snapshot only. It does not change the original event or vendor setup.",
                          })}
                        </div>
                      </>
                    ) : (
                      <>
                        {itemValues?.eventServiceId
                          ? `${t("quotations.linkedEventService", { defaultValue: "Event Service" })}: #${itemValues.eventServiceId}`
                          : null}
                        {itemValues?.serviceId
                          ? `${itemValues.eventServiceId ? " • " : ""}${t("quotations.linkedService", { defaultValue: "Catalog Service" })}: #${itemValues.serviceId}`
                          : null}
                        {isServiceReferenceItem ? (
                          <div className="mt-1">
                            {t("quotations.serviceReferencePricingHint", {
                              defaultValue:
                                "Pricing for service work is handled by Total Services Amount.",
                            })}
                          </div>
                        ) : null}
                      </>
                    )}
                  </div>
                </td>
                <td className="min-w-[160px] px-3 py-3">
                  <Input
                    {...categoryField}
                    placeholder={t("quotations.category", {
                      defaultValue: "Category",
                    })}
                  />
                </td>
                <td className="min-w-[120px] px-3 py-3">
                  <Input
                    type="number"
                    min="0.001"
                    step="0.001"
                    {...quantityField}
                    onChange={(event) =>
                      onQuantityChange(index, event, quantityField.onChange)
                    }
                  />
                </td>
                <td className="min-w-[140px] px-3 py-3">
                  <Input
                    type="number"
                    min="0"
                    step="0.001"
                    {...unitPriceField}
                    readOnly={isServiceReferenceItem}
                    onChange={
                      isServiceReferenceItem
                        ? undefined
                        : (event) =>
                            onUnitPriceChange(
                              index,
                              event,
                              unitPriceField.onChange,
                            )
                    }
                  />
                </td>
                <td className="min-w-[140px] px-3 py-3">
                  <Input
                    type="number"
                    min="0"
                    step="0.001"
                    {...totalPriceField}
                    readOnly={isServiceReferenceItem}
                    onChange={
                      isServiceReferenceItem
                        ? undefined
                        : (event) =>
                            onTotalPriceChange(
                              index,
                              event,
                              totalPriceField.onChange,
                            )
                    }
                  />
                </td>
                <td className="min-w-[220px] px-3 py-3">
                  <textarea
                    {...notesField}
                    className="min-h-[96px] w-full rounded-[4px] border px-3 py-2 text-sm text-[var(--lux-text)] outline-none transition-all focus:border-[var(--lux-gold-border)] focus:ring-2 focus:ring-[var(--lux-gold-glow)]"
                    style={{
                      background: "var(--lux-control-surface)",
                      borderColor: "var(--lux-control-border)",
                    }}
                    placeholder={t("common.notes", { defaultValue: "Notes" })}
                  />
                </td>
                {!isEditMode ? (
                  <td className="w-[80px] px-3 py-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => onRemove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PreviewTable({
  t,
  items,
}: {
  t: (key: string, options?: Record<string, unknown>) => string;
  items: QuotationItemFormData[];
}) {
  if (items.length === 0) {
    return (
      <EmptyHint
        text={t("quotations.noItemsSelected", {
          defaultValue: "No quotation items have been selected yet.",
        })}
      />
    );
  }

  return (
    <div
      className="overflow-x-auto rounded-[4px] border"
      style={{ borderColor: "var(--lux-row-border)" }}
    >
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--lux-row-border)] text-[var(--lux-text-muted)]">
            <th className="px-3 py-3 text-start">
              {t("quotations.type", { defaultValue: "Type" })}
            </th>
            <th className="px-3 py-3 text-start">
              {t("quotations.itemName", { defaultValue: "Item Name" })}
            </th>
            <th className="px-3 py-3 text-start">
              {t("quotations.category", { defaultValue: "Category" })}
            </th>
            <th className="px-3 py-3 text-start">
              {t("quotations.quantity", { defaultValue: "Quantity" })}
            </th>
            <th className="px-3 py-3 text-start">
              {t("quotations.unitPrice", { defaultValue: "Unit Price" })}
            </th>
            <th className="px-3 py-3 text-start">
              {t("quotations.totalPrice", { defaultValue: "Total Price" })}
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr
              key={`${item.itemType}-${index}-${item.eventServiceId || item.eventVendorId || item.serviceId || item.vendorId || item.itemName}`}
              className="border-b border-[var(--lux-row-border)] last:border-b-0"
            >
              <td className="px-3 py-3">
                <TypeBadge item={item} t={t} />
              </td>
              <td className="px-3 py-3 font-medium text-[var(--lux-text)]">
                {getQuotationItemLabel({
                  itemType: item.itemType,
                  itemName: item.itemName,
                })}
              </td>
              <td className="px-3 py-3 text-[var(--lux-text-secondary)]">
                {item.category
                  ? t(`services.category.${item.category}`, {
                      defaultValue: formatQuotationItemCategory(item.category),
                    })
                  : "-"}
              </td>
              <td className="px-3 py-3 text-[var(--lux-text-secondary)]">
                {item.quantity}
              </td>
              <td className="px-3 py-3 text-[var(--lux-text-secondary)]">
                {safeMoney(item.unitPrice)}
              </td>
              <td className="px-3 py-3 text-[var(--lux-text-secondary)]">
                {safeMoney(
                  item.totalPrice ||
                    computeQuotationItemTotal(item.quantity, item.unitPrice),
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TypeBadge({
  item,
  t,
}: {
  item?: Partial<QuotationItemFormData> | null;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  const type = item?.itemType ?? "service";
  const isVendor = type === "vendor";
  const isSummary = isManualServicesSummaryItem(item ?? {});
  return (
    <span
      className={cn(
        "inline-flex rounded-[4px] border px-3 py-1 text-xs font-semibold",
        isVendor || isSummary
          ? "border-[var(--lux-gold-border)] text-[var(--lux-gold)]"
          : "border-[var(--lux-row-border)] text-[var(--lux-text-secondary)]",
      )}
    >
      {isVendor
        ? t("quotations.vendor", { defaultValue: "شركة" })
        : isSummary
          ? t("quotations.totalServices", { defaultValue: "إجمالي الخدمات" })
          : t("quotations.service", { defaultValue: "خدمة" })}
    </span>
  );
}

function SummaryTile({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className="rounded-[4px] border px-4 py-4"
      style={{
        background: "var(--lux-panel-surface)",
        borderColor: "var(--lux-row-border)",
      }}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 text-lg font-semibold",
          emphasis ? "text-[var(--lux-heading)]" : "text-[var(--lux-text)]",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function FieldBlock({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-[var(--lux-text)]">
        {label}
      </span>
      {children}
      {error ? (
        <p className="text-[0.8rem] font-medium text-[var(--lux-danger)]">
          {String(error)}
        </p>
      ) : null}
    </label>
  );
}

export default QuotationFormPage;
