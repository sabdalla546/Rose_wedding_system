/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { FileText, Plus, Trash2 } from "lucide-react";
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
import { useContracts } from "@/hooks/contracts/useContracts";
import {
  useCreateContract,
  useCreateContractFromQuotation,
  useUpdateContract,
} from "@/hooks/contracts/useContractMutations";
import { useContract } from "@/hooks/contracts/useContracts";
import { useEvents } from "@/hooks/events/useEvents";
import { getInitialEventsBusinessFilters } from "@/pages/events/event-query-params";
import { useQuotation, useQuotations } from "@/hooks/quotations/useQuotations";
import {
  useEventServiceItems,
  useServices,
} from "@/hooks/services/useServices";
import { useVendorPricingPlans } from "@/hooks/vendors/useVendorPricingPlans";
import { useVendorSubServices } from "@/hooks/vendors/useVendorSubServices";
import { useEventVendorLinks, useVendors } from "@/hooks/vendors/useVendors";
import { getContractLockMessage } from "@/lib/workflow/workflow";
import { cn } from "@/lib/utils";
import { getEventDisplayTitle } from "@/pages/events/adapters";
import {
  getQuotationDisplayNumber,
  getQuotationItemDisplayName,
} from "@/pages/quotations/adapters";
import type { QuotationItem } from "@/pages/quotations/types";
import {
  formatVendorType,
  getEventVendorDisplayName,
  formatMoney as formatVendorMoney,
} from "@/pages/vendors/adapters";
import type { EventServiceItem, Service } from "@/pages/services/types";
import type {
  EventVendorLink,
  VendorPricingPlan,
  VendorSubService,
  VendorType,
} from "@/pages/vendors/types";

import {
  computeContractItemTotal,
  computeContractTotals,
  CONTRACT_STATUS_OPTIONS,
  formatMoney,
  getContractItemDisplayName,
  getContractItemOriginLabel,
  getContractItemTypeLabel,
  toNumberValue,
  PAYMENT_SCHEDULE_STATUS_OPTIONS,
  PAYMENT_SCHEDULE_TYPE_OPTIONS,
} from "./adapters";
import type {
  ContractFormData,
  ContractFromQuotationFormData,
  ContractItemFormData,
  ContractItemType,
  ContractStatus,
  ContractUpdateFormData,
  PaymentScheduleStatus,
  PaymentScheduleType,
} from "./types";

const textareaClassName =
  "min-h-[130px] w-full rounded-[4px] border px-4 py-3 text-sm text-[var(--lux-text)] placeholder:text-[var(--lux-text-muted)] outline-none transition-all focus:border-[var(--lux-gold-border)] focus:ring-2 focus:ring-[var(--lux-gold-glow)] read-only:cursor-default read-only:border-dashed read-only:border-[var(--lux-row-border)] read-only:bg-[var(--lux-row-surface)] read-only:text-[var(--lux-text-secondary)] read-only:focus:border-[var(--lux-control-border)] read-only:focus:ring-0";
const sectionTitleClass = "text-lg font-semibold text-[var(--lux-heading)]";
const sectionHintClass = "text-sm text-[var(--lux-text-secondary)]";
type ContractVendorSource = "event_vendor" | "catalog_vendor";
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
        const matchesMax = !plan.maxSubServices || plan.maxSubServices >= count;
        return matchesMin && matchesMax;
      }) ?? null
  );
};

const isServiceSummaryItem = (
  item?: { itemType?: string; category?: string | null } | null,
) => item?.itemType === "service" && item?.category === "service_summary";

const getContractPreviewItemPrice = (
  item?: {
    totalPrice?: string | number | null;
    unitPrice?: string | number | null;
  } | null,
) => item?.totalPrice ?? item?.unitPrice ?? 0;

const formatPreviewCategory = (value?: string | null) =>
  value
    ? value
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    : null;

const getQuotationPreviewOriginLabel = (item: QuotationItem) => {
  if (item.itemType === "vendor") {
    const vendorType = item.category
      ? formatPreviewCategory(item.category)
      : null;
    const pricingPlanName = item.pricingPlan?.name || null;
    const vendorName =
      item.itemName ||
      (item.eventVendor ? getEventVendorDisplayName(item.eventVendor) : null) ||
      item.vendor?.name ||
      "Vendor";

    return [vendorName, vendorType, pricingPlanName]
      .filter(Boolean)
      .join(" - ");
  }

  const serviceName =
    item.itemName ||
    item.eventService?.serviceNameSnapshot ||
    item.service?.name ||
    "Service";
  const serviceCategory = formatPreviewCategory(item.category);

  return [serviceName, serviceCategory].filter(Boolean).join(" - ");
};

const createPaymentScheduleSchema = z.object({
  installmentName: z.string().max(150),
  scheduleType: z.enum(
    PAYMENT_SCHEDULE_TYPE_OPTIONS.map((option) => option.value) as [
      PaymentScheduleType,
      ...PaymentScheduleType[],
    ],
  ),
  dueDate: z.string().optional(),
  amount: z
    .string()
    .refine(
      (value) => value.trim() !== "" && Number(value) >= 0,
      "Amount must be zero or greater",
    ),
  status: z.enum(
    PAYMENT_SCHEDULE_STATUS_OPTIONS.map((option) => option.value) as [
      PaymentScheduleStatus,
      ...PaymentScheduleStatus[],
    ],
  ),
  notes: z.string().optional(),
  sortOrder: z
    .string()
    .optional()
    .refine(
      (value) =>
        !value || (Number.isInteger(Number(value)) && Number(value) >= 0),
      "Sort order must be zero or greater",
    ),
});

const createContractFormSchema = (isEditMode: boolean) =>
  z
    .object({
      createMode: z.enum(["manual", "from_quotation"]),
      quotationId: z.string().optional(),
      eventId: z.string().optional(),
      contractNumber: z.string().max(100).optional(),
      signedDate: z.string().min(1, "Signed date is required"),
      eventDate: z.string().optional(),
      discountAmount: z
        .string()
        .optional()
        .refine(
          (value) => !value || Number(value) >= 0,
          "Discount must be zero or greater",
        ),
      notes: z.string().optional(),
      status: z.enum(
        CONTRACT_STATUS_OPTIONS.map((option) => option.value) as [
          ContractStatus,
          ...ContractStatus[],
        ],
      ),
      items: z.array(
        z.object({
          id: z.number().optional(),
          itemType: z.enum(["service", "vendor"]),
          quotationItemId: z.string().optional(),
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
          totalPrice: z.string().optional(),
          notes: z.string().optional(),
          sortOrder: z
            .string()
            .optional()
            .refine(
              (value) =>
                !value ||
                (Number.isInteger(Number(value)) && Number(value) >= 0),
              "Sort order must be zero or greater",
            ),
        }),
      ),
      paymentSchedules: z.array(createPaymentScheduleSchema),
    })
    .superRefine((values, ctx) => {
      if (
        (isEditMode || values.createMode === "manual") &&
        !values.eventId?.trim()
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["eventId"],
          message: "Event is required",
        });
      }

      if (
        !isEditMode &&
        values.createMode === "from_quotation" &&
        !values.quotationId?.trim()
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["quotationId"],
          message: "Quotation is required",
        });
      }

      if (
        (isEditMode || values.createMode === "manual") &&
        values.items.length === 0
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["items"],
          message: "At least one contract item is required",
        });
      }

      if (isEditMode || values.createMode === "manual") {
        values.items.forEach((item, index) => {
          if (!item.itemName.trim()) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["items", index, "itemName"],
              message: "Item name is required",
            });
          }

          if (
            item.itemType === "vendor" &&
            !item.eventVendorId?.trim() &&
            !item.vendorId?.trim()
          ) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["items", index, "vendorId"],
              message: "Vendor rows must come from an event vendor or vendor",
            });
          }
        });
      }

      values.paymentSchedules.forEach((schedule, index) => {
        if (!schedule.installmentName.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["paymentSchedules", index, "installmentName"],
            message: "Installment name is required",
          });
        }
      });
    });

type ContractFormValues = z.infer<ReturnType<typeof createContractFormSchema>>;

const createEmptyContractItem = (
  sortOrder = 0,
  itemType: ContractItemType = "service",
): ContractItemFormData => ({
  itemType,
  quotationItemId: "",
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
});

const buildServiceItemFromEventService = (
  item: EventServiceItem,
  sortOrder: number,
): ContractItemFormData => ({
  ...createEmptyContractItem(sortOrder, "service"),
  eventServiceId: String(item.id),
  serviceId: item.serviceId ? String(item.serviceId) : "",
  itemName: item.serviceNameSnapshot || item.service?.name || "",
  category: item.category,
  quantity: "1",
  unitPrice: "0",
  totalPrice: "0",
  notes: item.notes ?? "",
});

const buildServiceItemFromCatalogService = (
  service: Service,
  sortOrder: number,
): ContractItemFormData => ({
  ...createEmptyContractItem(sortOrder, "service"),
  serviceId: String(service.id),
  itemName: service.name,
  category: service.category,
  quantity: "1",
  unitPrice: "0",
  totalPrice: "0",
  notes: "",
});

const buildVendorItemFromEventVendor = (
  item: EventVendorLink,
  sortOrder: number,
): ContractItemFormData => {
  const agreedPrice = toNumberValue(item.agreedPrice) ?? 0;

  return {
    ...createEmptyContractItem(sortOrder, "vendor"),
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

const buildVendorItemFromCatalogVendorConfig = (
  vendor: CatalogVendorLike,
  config: SelectedCatalogVendorConfig,
  sortOrder: number,
): ContractItemFormData => ({
  ...createEmptyContractItem(sortOrder, "vendor"),
  vendorId: String(vendor.id),
  pricingPlanId: config.pricingPlanId || "",
  itemName: vendor.name,
  category: vendor.type ?? "vendor",
  quantity: "1",
  unitPrice: config.agreedPrice || config.calculatedPrice || "0",
  totalPrice: config.agreedPrice || config.calculatedPrice || "0",
  notes: "",
});

const normalizeContractSortOrder = (items: ContractItemFormData[]) =>
  items.map((item, index) => ({
    ...item,
    sortOrder: String(index),
  }));

const getEventVendorDisabledReason = (item: EventVendorLink) => {
  if (item.status === "cancelled") return "cancelled";
  if (toNumberValue(item.agreedPrice) === null) return "missing_price";
  return null;
};

const createEmptyPaymentSchedule = (
  sortOrder = 0,
): ContractFormValues["paymentSchedules"][number] => ({
  installmentName: "",
  scheduleType: "deposit",
  dueDate: "",
  amount: "",
  status: "pending",
  notes: "",
  sortOrder: String(sortOrder),
});

const ContractFormPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEditMode = Boolean(id);
  const requestedMode =
    searchParams.get("mode") === "from-quotation" ? "from_quotation" : "manual";
  const preselectedEventId = searchParams.get("eventId") ?? "";
  const preselectedQuotationId = searchParams.get("quotationId") ?? "";
  const previousEventIdRef = useRef("");
  const [catalogVendorConfigs, setCatalogVendorConfigs] = useState<
    Record<string, SelectedCatalogVendorConfig>
  >({});
  const [vendorSources, setVendorSources] = useState<
    Record<string, ContractVendorSource>
  >({});

  const { data: contract, isLoading: contractLoading } = useContract(id);
  const createMutation = useCreateContract();
  const createFromQuotationMutation = useCreateContractFromQuotation();
  const updateMutation = useUpdateContract(id);
  const { data: contractsResponse } = useContracts({
    currentPage: 1,
    itemsPerPage: 200,
    searchQuery: "",
    quotationId: "",
    eventId: "",
    status: "all",
    signedDateFrom: "",
    signedDateTo: "",
  });
  const { data: quotationsResponse } = useQuotations({
    currentPage: 1,
    itemsPerPage: 100,
    searchQuery: "",
    eventId: "",
    status: "all",
    issueDateFrom: "",
    issueDateTo: "",
  });
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

  const form = useForm<ContractFormValues>({
    resolver: zodResolver(createContractFormSchema(isEditMode)) as any,
    defaultValues: {
      createMode: requestedMode,
      quotationId: preselectedQuotationId,
      eventId: preselectedEventId,
      contractNumber: "",
      signedDate: new Date().toISOString().slice(0, 10),
      eventDate: "",
      discountAmount: "0",
      notes: "",
      status: "draft",
      items: [],
      paymentSchedules: [],
    },
  });

  const {
    fields: itemFields,
    replace: replaceItems,
  } = useFieldArray({
    control: form.control,
    name: "items",
  });
  const {
    fields: paymentScheduleFields,
    append: appendPaymentSchedule,
    remove: removePaymentSchedule,
  } = useFieldArray({
    control: form.control,
    name: "paymentSchedules",
  });

  const watchedCreateMode = useWatch({
    control: form.control,
    name: "createMode",
  });
  const watchedQuotationId = useWatch({
    control: form.control,
    name: "quotationId",
  });
  const watchedEventId = useWatch({
    control: form.control,
    name: "eventId",
  });
  const watchedDiscountAmount = useWatch({
    control: form.control,
    name: "discountAmount",
  });
  const watchedItems = useWatch({
    control: form.control,
    name: "items",
  });

  const { data: selectedQuotation } = useQuotation(
    watchedQuotationId || preselectedQuotationId || undefined,
  );
  const selectedEventIdNumber = watchedEventId ? Number(watchedEventId) : 0;
  const { data: eventServicesResponse } = useEventServiceItems({
    currentPage: 1,
    itemsPerPage: 200,
    eventId: selectedEventIdNumber || undefined,
    category: "all",
    status: "all",
  });
  const { data: eventVendorsResponse } = useEventVendorLinks({
    currentPage: 1,
    itemsPerPage: 200,
    eventId: selectedEventIdNumber || undefined,
    vendorType: "all",
    providedBy: "all",
    status: "all",
  });
  const existingContracts = useMemo(
    () => contractsResponse?.data ?? [],
    [contractsResponse?.data],
  );
  const quotations = useMemo(
    () => quotationsResponse?.data ?? [],
    [quotationsResponse?.data],
  );
  const events = useMemo(
    () => eventsResponse?.data ?? [],
    [eventsResponse?.data],
  );
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
  const availableEventServices = useMemo(
    () => eventServicesResponse?.data ?? [],
    [eventServicesResponse?.data],
  );
  const availableEventVendors = useMemo(
    () => eventVendorsResponse?.data ?? [],
    [eventVendorsResponse?.data],
  );
  const selectedEvent = useMemo(
    () => events.find((event) => String(event.id) === watchedEventId),
    [events, watchedEventId],
  );
  const linkedQuotationItems = useMemo(
    () =>
      [...(selectedQuotation?.items ?? [])].sort(
        (left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0),
    ),
    [selectedQuotation?.items],
  );
  const selectedManualEventServiceIds = useMemo(
    () =>
      watchedItems
        ?.filter(
          (item) => item.itemType === "service" && item.eventServiceId?.trim(),
        )
        .map((item) => item.eventServiceId as string) ?? [],
    [watchedItems],
  );
  const selectedManualCatalogServiceIds = useMemo(
    () =>
      watchedItems
        ?.filter(
          (item) =>
            item.itemType === "service" &&
            item.serviceId?.trim() &&
            !item.eventServiceId?.trim(),
        )
        .map((item) => item.serviceId as string) ?? [],
    [watchedItems],
  );
  const selectedManualEventVendorIds = useMemo(
    () =>
      watchedItems
        ?.filter(
          (item) => item.itemType === "vendor" && item.eventVendorId?.trim(),
        )
        .map((item) => item.eventVendorId as string) ?? [],
    [watchedItems],
  );
  const selectedManualCatalogVendorIds = useMemo(
    () =>
      watchedItems
        ?.filter(
          (item) =>
            item.itemType === "vendor" &&
            item.vendorId?.trim() &&
            !item.eventVendorId?.trim(),
        )
        .map((item) => item.vendorId as string) ?? [],
    [watchedItems],
  );
  const selectableQuotations = useMemo(
    () =>
      quotations.filter((quotation) => {
        if (String(quotation.id) === watchedQuotationId) {
          return true;
        }

        if (
          preselectedEventId &&
          String(quotation.eventId) !== preselectedEventId
        ) {
          return false;
        }

        return !existingContracts.some(
          (contractItem) => contractItem.quotationId === quotation.id,
        );
      }),
    [existingContracts, preselectedEventId, quotations, watchedQuotationId],
  );
  const contractTotals = useMemo(
    () =>
      computeContractTotals({
        items:
          watchedItems?.map((item) => ({
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })) ?? [],
        discountAmount: watchedDiscountAmount,
      }),
    [watchedDiscountAmount, watchedItems],
  );
  const selectedQuotationTotals = useMemo(
    () => ({
      subtotal: selectedQuotation?.subtotal ?? 0,
      discountAmount: selectedQuotation?.discountAmount ?? 0,
      totalAmount: selectedQuotation?.totalAmount ?? 0,
    }),
    [
      selectedQuotation?.discountAmount,
      selectedQuotation?.subtotal,
      selectedQuotation?.totalAmount,
    ],
  );
  const quotationPreviewServiceItems = useMemo(
    () => linkedQuotationItems.filter((item) => item.itemType === "service"),
    [linkedQuotationItems],
  );
  const quotationPreviewVendorItems = useMemo(
    () => linkedQuotationItems.filter((item) => item.itemType === "vendor"),
    [linkedQuotationItems],
  );
  const quotationPreviewVendorTotalAmount = useMemo(
    () =>
      quotationPreviewVendorItems.reduce((sum, item) => {
        return sum + (toNumberValue(getContractPreviewItemPrice(item)) ?? 0);
      }, 0),
    [quotationPreviewVendorItems],
  );
  const quotationPreviewPairedItems = useMemo(
    () =>
      Array.from(
        {
          length: Math.max(
            quotationPreviewServiceItems.length,
            quotationPreviewVendorItems.length,
          ),
        },
        (_, index) => ({
          serviceItem: quotationPreviewServiceItems[index],
          vendorItem: quotationPreviewVendorItems[index],
        }),
      ),
    [quotationPreviewServiceItems, quotationPreviewVendorItems],
  );

  useEffect(() => {
    if (!isEditMode || !contract) {
      return;
    }

    form.reset({
      createMode: "manual",
      quotationId: contract.quotationId ? String(contract.quotationId) : "",
      eventId: String(contract.eventId),
      contractNumber: contract.contractNumber ?? "",
      signedDate: contract.signedDate,
      eventDate: contract.eventDate ?? "",
      discountAmount:
        typeof contract.discountAmount !== "undefined" &&
        contract.discountAmount !== null
          ? String(contract.discountAmount)
          : "0",
      notes: contract.notes ?? "",
      status: contract.status,
      items: (contract.items ?? []).map((item) => ({
        id: item.id,
        itemType: item.itemType ?? "service",
        quotationItemId: item.quotationItemId
          ? String(item.quotationItemId)
          : "",
        eventServiceId: item.eventServiceId ? String(item.eventServiceId) : "",
        serviceId: item.serviceId ? String(item.serviceId) : "",
        eventVendorId: item.eventVendorId ? String(item.eventVendorId) : "",
        vendorId: item.vendorId ? String(item.vendorId) : "",
        pricingPlanId: item.pricingPlanId ? String(item.pricingPlanId) : "",
        itemName: item.itemName,
        category: item.category ?? "",
        quantity: String(item.quantity),
        unitPrice: String(item.unitPrice),
        totalPrice: String(item.totalPrice),
        notes: item.notes ?? "",
        sortOrder: String(item.sortOrder ?? 0),
      })),
      paymentSchedules: [],
    });

    replaceItems(
      (contract.items ?? []).map((item) => ({
        id: item.id,
        itemType: item.itemType ?? "service",
        quotationItemId: item.quotationItemId
          ? String(item.quotationItemId)
          : "",
        eventServiceId: item.eventServiceId ? String(item.eventServiceId) : "",
        serviceId: item.serviceId ? String(item.serviceId) : "",
        eventVendorId: item.eventVendorId ? String(item.eventVendorId) : "",
        vendorId: item.vendorId ? String(item.vendorId) : "",
        pricingPlanId: item.pricingPlanId ? String(item.pricingPlanId) : "",
        itemName: item.itemName,
        category: item.category ?? "",
        quantity: String(item.quantity),
        unitPrice: String(item.unitPrice),
        totalPrice: String(item.totalPrice),
        notes: item.notes ?? "",
        sortOrder: String(item.sortOrder ?? 0),
      })),
    );
  }, [contract, form, isEditMode, replaceItems]);

  useEffect(() => {
    if (!isEditMode && preselectedEventId) {
      form.setValue("eventId", preselectedEventId, { shouldDirty: false });
    }

    if (!isEditMode && preselectedQuotationId) {
      form.setValue("quotationId", preselectedQuotationId, {
        shouldDirty: false,
      });
    }
  }, [form, isEditMode, preselectedEventId, preselectedQuotationId]);

  useEffect(() => {
    if (isEditMode || watchedCreateMode !== "manual") {
      return;
    }

    if (!watchedEventId) {
      previousEventIdRef.current = "";
      replaceItems([]);
      setCatalogVendorConfigs({});
      return;
    }

    if (!previousEventIdRef.current) {
      previousEventIdRef.current = watchedEventId;
      return;
    }

    if (previousEventIdRef.current !== watchedEventId) {
      replaceItems([]);
      setCatalogVendorConfigs({});
    }

    previousEventIdRef.current = watchedEventId;
  }, [isEditMode, replaceItems, watchedCreateMode, watchedEventId]);

  useEffect(() => {
    if (isEditMode || !selectedQuotation) {
      return;
    }

    if (!form.getValues("eventId")) {
      form.setValue("eventId", String(selectedQuotation.eventId), {
        shouldDirty: true,
      });
    }

    if (!form.getValues("eventDate") && selectedQuotation.event?.eventDate) {
      form.setValue("eventDate", selectedQuotation.event.eventDate, {
        shouldDirty: true,
      });
    }
  }, [form, isEditMode, selectedQuotation]);

  useEffect(() => {
    if (!selectedEvent || isEditMode) {
      return;
    }

    if (!form.getValues("eventDate") && selectedEvent.eventDate) {
      form.setValue("eventDate", selectedEvent.eventDate, {
        shouldDirty: true,
      });
    }
  }, [form, isEditMode, selectedEvent]);

  const isBusy =
    contractLoading ||
    createMutation.isPending ||
    createFromQuotationMutation.isPending ||
    updateMutation.isPending;
  const contractLockMessage =
    isEditMode && contract ? getContractLockMessage(contract.status) : null;
  const isWorkflowLocked = Boolean(contractLockMessage);
  const formErrorMessage =
    form.formState.submitCount > 0
      ? getFirstFormErrorMessage(form.formState.errors)
      : null;

  const updateCatalogVendorConfig = (
    rowKey: string,
    updater: (
      current: SelectedCatalogVendorConfig,
    ) => SelectedCatalogVendorConfig,
  ) => {
    setCatalogVendorConfigs((current) => ({
      ...current,
      [rowKey]: updater(
        current[rowKey] ?? createDefaultCatalogVendorConfig(""),
      ),
    }));
  };

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

      Object.keys(current).forEach((key) => {
        if (!selectedVendorIds.has(key)) {
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
      const nextVendorItem = buildVendorItemFromCatalogVendorConfig(
        vendor,
        config,
        index,
      );
      const mergedItem: ContractItemFormData = {
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

  const getVendorSource = (
    rowKey: string,
    item?: Partial<ContractItemFormData> | null,
  ): ContractVendorSource =>
    vendorSources[rowKey] ??
    (item?.eventVendorId?.trim()
      ? "event_vendor"
      : item?.vendorId?.trim()
        ? "catalog_vendor"
        : "event_vendor");

  const updateItemValues = (
    index: number,
    values: Partial<Omit<ContractItemFormData, "id">>,
  ) => {
    Object.entries(values).forEach(([key, value]) => {
      form.setValue(`items.${index}.${key}` as any, value as any, {
        shouldDirty: true,
        shouldValidate: key === "itemType" || key === "eventVendorId",
      });
    });
  };

  const handleItemTypeChange = (
    index: number,
    nextItemType: ContractItemType,
  ) => {
    const currentItem = form.getValues(`items.${index}`);
    const rowKey = itemFields[index]?.id;

    if (rowKey && nextItemType !== "vendor") {
      setVendorSources((current) => {
        if (!(rowKey in current)) return current;
        const next = { ...current };
        delete next[rowKey];
        return next;
      });
    }

    form.setValue(
      `items.${index}`,
      {
        ...createEmptyContractItem(
          Number(currentItem.sortOrder || index),
          nextItemType,
        ),
        id: currentItem.id,
        sortOrder: currentItem.sortOrder || String(index),
      },
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    );
  };

  const handleQuotationItemSelect = (
    index: number,
    nextQuotationItemId: string,
  ) => {
    const rowKey = itemFields[index]?.id;
    const selectedItem = linkedQuotationItems.find(
      (item) => String(item.id) === nextQuotationItemId,
    );

    form.setValue(`items.${index}.quotationItemId`, nextQuotationItemId, {
      shouldDirty: true,
    });

    if (!selectedItem) {
      return;
    }

    if (rowKey && selectedItem.itemType === "vendor") {
      setVendorSources((current) => ({
        ...current,
        [rowKey]: selectedItem.eventVendorId
          ? "event_vendor"
          : selectedItem.vendorId
            ? "catalog_vendor"
            : "event_vendor",
      }));

      if (!selectedItem.eventVendorId && selectedItem.vendorId) {
              setCatalogVendorConfigs((current) => ({
          ...current,
          [rowKey]: {
            ...(current[rowKey] ??
              createDefaultCatalogVendorConfig(selectedItem.vendorId ?? "")),
            vendorId: String(selectedItem.vendorId),
            pricingPlanId: selectedItem.pricingPlanId
              ? String(selectedItem.pricingPlanId)
              : "",
            calculatedPrice: formatDecimalInput(selectedItem.unitPrice),
            agreedPrice: formatDecimalInput(selectedItem.unitPrice),
            isPriceOverride: true,
          },
        }));
      }
    }

    updateItemValues(index, {
      itemType: selectedItem.itemType ?? "service",
      itemName: selectedItem.itemName,
      category: selectedItem.category ?? "",
      quantity: String(selectedItem.quantity ?? 1),
      unitPrice: String(selectedItem.unitPrice ?? 0),
      totalPrice: String(selectedItem.totalPrice ?? 0),
      notes: selectedItem.notes ?? "",
      sortOrder: String(selectedItem.sortOrder ?? index),
      eventServiceId:
        selectedItem.itemType === "vendor"
          ? ""
          : selectedItem.eventServiceId
            ? String(selectedItem.eventServiceId)
            : "",
      serviceId:
        selectedItem.itemType === "vendor"
          ? ""
          : selectedItem.serviceId
            ? String(selectedItem.serviceId)
            : "",
      eventVendorId:
        selectedItem.itemType === "vendor" && selectedItem.eventVendorId
          ? String(selectedItem.eventVendorId)
          : "",
      vendorId:
        selectedItem.itemType === "vendor" && selectedItem.vendorId
          ? String(selectedItem.vendorId)
          : "",
      pricingPlanId:
        selectedItem.itemType === "vendor" && selectedItem.pricingPlanId
          ? String(selectedItem.pricingPlanId)
          : "",
    });
  };

  const handleEventServiceSelect = (
    index: number,
    nextEventServiceId: string,
  ) => {
    const selectedEventService = availableEventServices.find(
      (item) => String(item.id) === nextEventServiceId,
    );

    form.setValue(`items.${index}.eventServiceId`, nextEventServiceId, {
      shouldDirty: true,
    });

    updateItemValues(index, {
      itemType: "service",
      eventVendorId: "",
      vendorId: "",
      pricingPlanId: "",
    });

    if (!selectedEventService) {
      return;
    }

    updateItemValues(index, {
      serviceId: selectedEventService.serviceId
        ? String(selectedEventService.serviceId)
        : "",
      itemName:
        selectedEventService.serviceNameSnapshot ||
        selectedEventService.service?.name ||
        "",
      category: selectedEventService.category,
    });
  };

  const handleServiceSelect = (index: number, nextServiceId: string) => {
    const selectedService = services.find(
      (service) => String(service.id) === nextServiceId,
    );

    form.setValue(`items.${index}.serviceId`, nextServiceId, {
      shouldDirty: true,
    });

    updateItemValues(index, {
      itemType: "service",
      eventServiceId: nextServiceId
        ? ""
        : form.getValues(`items.${index}.eventServiceId`),
      eventVendorId: "",
      vendorId: "",
      pricingPlanId: "",
    });

    if (!selectedService) {
      return;
    }

    updateItemValues(index, {
      eventServiceId: "",
      itemName: selectedService.name,
      category: selectedService.category,
    });
  };

  const handleEventVendorSelect = (
    index: number,
    nextEventVendorId: string,
  ) => {
    const rowKey = itemFields[index]?.id;
    const selectedEventVendor = availableEventVendors.find(
      (item) => String(item.id) === nextEventVendorId,
    );

    if (rowKey) {
      setVendorSources((current) => ({
        ...current,
        [rowKey]: "event_vendor",
      }));
    }

    if (!selectedEventVendor) {
      updateItemValues(index, {
        itemType: "vendor",
        quotationItemId: "",
        eventVendorId: nextEventVendorId,
        vendorId: "",
        pricingPlanId: "",
        itemName: "",
        category: "",
        unitPrice: "0",
        totalPrice: "0",
      });
      return;
    }

    const agreedPrice = toNumberValue(selectedEventVendor.agreedPrice) ?? 0;

    updateItemValues(index, {
      itemType: "vendor",
      quotationItemId: "",
      eventServiceId: "",
      serviceId: "",
      eventVendorId: nextEventVendorId,
      vendorId: selectedEventVendor.vendorId
        ? String(selectedEventVendor.vendorId)
        : "",
      pricingPlanId: selectedEventVendor.pricingPlanId
        ? String(selectedEventVendor.pricingPlanId)
        : "",
      itemName: getEventVendorDisplayName(selectedEventVendor),
      category: selectedEventVendor.vendorType,
      quantity: "1",
      unitPrice: String(agreedPrice),
      totalPrice: String(agreedPrice),
      notes: "",
    });
  };

  const handleVendorSourceChange = (
    index: number,
    rowKey: string,
    nextSource: ContractVendorSource,
  ) => {
    setVendorSources((current) => ({
      ...current,
      [rowKey]: nextSource,
    }));

    if (nextSource === "catalog_vendor") {
      const existingConfig =
        catalogVendorConfigs[rowKey] ?? createDefaultCatalogVendorConfig("");

      updateItemValues(index, {
        itemType: "vendor",
        quotationItemId: "",
        eventServiceId: "",
        serviceId: "",
        eventVendorId: "",
        vendorId: existingConfig.vendorId || "",
        pricingPlanId: existingConfig.pricingPlanId || "",
        itemName: existingConfig.vendorId
          ? catalogVendors.find(
              (vendor) => String(vendor.id) === existingConfig.vendorId,
            )?.name || ""
          : "",
        category: existingConfig.vendorId
          ? catalogVendors.find(
              (vendor) => String(vendor.id) === existingConfig.vendorId,
            )?.type || ""
          : "",
        quantity: "1",
        unitPrice:
          existingConfig.agreedPrice || existingConfig.calculatedPrice || "0",
        totalPrice:
          existingConfig.agreedPrice || existingConfig.calculatedPrice || "0",
      });
      return;
    }

    updateItemValues(index, {
      itemType: "vendor",
      quotationItemId: "",
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
    });
  };

  const handleCatalogVendorSelect = (
    index: number,
    rowKey: string,
    nextVendorId: string,
  ) => {
    const selectedVendor = catalogVendors.find(
      (vendor) => String(vendor.id) === nextVendorId,
    );
    const nextConfig = nextVendorId
      ? {
          ...(catalogVendorConfigs[rowKey] ??
            createDefaultCatalogVendorConfig(nextVendorId)),
          vendorId: nextVendorId,
        }
      : createDefaultCatalogVendorConfig("");

    setVendorSources((current) => ({
      ...current,
      [rowKey]: "catalog_vendor",
    }));
    setCatalogVendorConfigs((current) => ({
      ...current,
      [rowKey]: nextConfig,
    }));

    updateItemValues(index, {
      itemType: "vendor",
      quotationItemId: "",
      eventServiceId: "",
      serviceId: "",
      eventVendorId: "",
      vendorId: nextVendorId,
      pricingPlanId: nextConfig.pricingPlanId || "",
      itemName: selectedVendor?.name ?? "",
      category: selectedVendor?.type ?? "",
      quantity: "1",
      unitPrice: nextConfig.agreedPrice || nextConfig.calculatedPrice || "0",
      totalPrice: nextConfig.agreedPrice || nextConfig.calculatedPrice || "0",
    });
  };

  const handleCatalogVendorResolvedValues = (
    index: number,
    values: Partial<Omit<ContractItemFormData, "id">>,
  ) => {
    const currentItem = form.getValues(`items.${index}`);
    const changedEntries = Object.entries(values).filter(
      ([key, value]) => (currentItem as Record<string, unknown>)[key] !== value,
    );

    if (!changedEntries.length) {
      return;
    }

    updateItemValues(index, Object.fromEntries(changedEntries) as Partial<
      Omit<ContractItemFormData, "id">
    >);
  };

  const replaceManualItems = (nextItems: ContractItemFormData[]) => {
    replaceItems(normalizeContractSortOrder(nextItems));
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
      ) {
        return;
      }

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
      ) {
        return;
      }

      replaceManualItems([
        ...current,
        buildServiceItemFromCatalogService(service, current.length),
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
    if (getEventVendorDisabledReason(item)) {
      return;
    }

    const current = form.getValues("items");

    if (checked) {
      if (
        current.some(
          (row) =>
            row.itemType === "vendor" && row.eventVendorId === String(item.id),
        )
      ) {
        return;
      }

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
      ) {
        return;
      }

      const config =
        catalogVendorConfigs[vendorId] ??
        createDefaultCatalogVendorConfig(vendorId);

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
        buildVendorItemFromCatalogVendorConfig(vendor, config, current.length),
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

  const handleManualCatalogVendorResolvedValues = (
    vendorId: string,
    values: Partial<Omit<ContractItemFormData, "id">>,
  ) => {
    const current = form.getValues("items");
    const index = current.findIndex(
      (item) =>
        item.itemType === "vendor" &&
        item.vendorId === vendorId &&
        !item.eventVendorId,
    );

    if (index < 0) {
      return;
    }

    const nextItems = [...current];
    nextItems[index] = {
      ...nextItems[index],
      ...values,
    };

    replaceManualItems(nextItems);
  };

  const onSubmit = (values: ContractFormValues) => {
    if (isEditMode) {
      const payload: ContractUpdateFormData = {
        contractNumber: values.contractNumber,
        signedDate: values.signedDate,
        eventDate: values.eventDate,
        discountAmount: values.discountAmount,
        notes: values.notes,
        status: values.status,
        items: values.items.map((item) => ({
          ...item,
          totalPrice: String(
            computeContractItemTotal(item.quantity, item.unitPrice) ?? 0,
          ),
        })),
      };

      updateMutation.mutate(payload);
      return;
    }

    if (values.createMode === "from_quotation") {
      const payload: ContractFromQuotationFormData = {
        quotationId: values.quotationId || "",
        contractNumber: values.contractNumber,
        signedDate: values.signedDate,
        eventDate: values.eventDate,
        notes: values.notes,
        status: values.status,
        paymentSchedules: values.paymentSchedules,
      };

      createFromQuotationMutation.mutate(payload);
      return;
    }

    const payload: ContractFormData = {
      quotationId: values.quotationId,
      eventId: values.eventId || "",
      contractNumber: values.contractNumber,
      signedDate: values.signedDate,
      eventDate: values.eventDate,
      discountAmount: values.discountAmount,
      notes: values.notes,
      status: values.status,
      items: values.items.map((item) => ({
        ...item,
        totalPrice: String(
          computeContractItemTotal(item.quantity, item.unitPrice) ?? 0,
        ),
      })),
      paymentSchedules: values.paymentSchedules,
    };

    createMutation.mutate(payload);
  };

  if (contractLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-sm text-[var(--lux-text-secondary)]">
          {t("common.loading", { defaultValue: "Loading..." })}
        </div>
      </div>
    );
  }

  return (
    <ProtectedComponent
      permission={isEditMode ? "contracts.update" : "contracts.create"}
    >
      <PageContainer className="pb-4 pt-4 text-foreground">
        <div dir={i18n.dir()} className="mx-auto w-full max-w-6xl space-y-6">
          <button
            type="button"
            onClick={() =>
              navigate(isEditMode && id ? `/contracts/${id}` : "/contracts")
            }
            className="inline-flex items-center gap-2 text-sm text-[var(--lux-text-secondary)] transition-colors hover:text-[var(--lux-gold)]"
          >
            {"<-"}{" "}
            {isEditMode
              ? t("contracts.backToContract", {
                  defaultValue: "Back to Contract",
                })
              : t("contracts.backToContracts", {
                  defaultValue: "Back to Contracts",
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

              <div className="space-y-1">
                <h1 className="text-xl font-bold text-[var(--lux-heading)]">
                  {isEditMode
                    ? t("contracts.editTitle", {
                        defaultValue: "Edit Contract",
                      })
                    : t("contracts.createTitle", {
                        defaultValue: "Create Contract",
                      })}
                </h1>
                <p className="text-sm text-[var(--lux-text-secondary)]">
                  {isEditMode
                    ? t("contracts.editDescription", {
                        defaultValue:
                          "Update contract header details and revise the existing contract items.",
                      })
                    : t("contracts.createDescription", {
                        defaultValue:
                          "Create a manual contract or build one directly from a quotation.",
                      })}
                </p>
              </div>
            </div>
          </div>

          <Card className="overflow-hidden rounded-[4px]">
            <div className="p-6 md:p-8">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
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
                      title={t("contracts.editLockedTitle", {
                        defaultValue: "Contract Editing Locked",
                      })}
                      message={
                        contractLockMessage ??
                        t("contracts.editLockedHint", {
                          defaultValue:
                            "This contract is locked by workflow state. Review it from the detail page and use workflow actions there instead of editing the commitment form.",
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
                      <div
                        className="border-b pb-3"
                        style={{ borderColor: "var(--lux-row-border)" }}
                      >
                        <h2 className={sectionTitleClass}>
                          {t("contracts.createModeTitle", {
                            defaultValue: "Creation Mode",
                          })}
                        </h2>
                        <p className={sectionHintClass}>
                          {t("contracts.createModeHint", {
                            defaultValue:
                              "Choose whether to prepare the contract manually or create it from a quotation.",
                          })}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <button
                          type="button"
                          className={cn(
                            "rounded-[4px] border p-4 text-left transition-all",
                            watchedCreateMode === "manual"
                              ? "border-[var(--lux-gold-border)] bg-[var(--lux-control-hover)]"
                              : "border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)]",
                          )}
                          onClick={() => form.setValue("createMode", "manual")}
                        >
                          <p className="text-sm font-semibold text-[var(--lux-text)]">
                            {t("contracts.manualMode", {
                              defaultValue: "Manual Contract",
                            })}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-[var(--lux-text-secondary)]">
                            {t("contracts.manualModeHint", {
                              defaultValue:
                                "Build the contract items manually and control each line directly.",
                            })}
                          </p>
                        </button>

                        <button
                          type="button"
                          className={cn(
                            "rounded-[4px] border p-4 text-left transition-all",
                            watchedCreateMode === "from_quotation"
                              ? "border-[var(--lux-gold-border)] bg-[var(--lux-control-hover)]"
                              : "border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)]",
                          )}
                          onClick={() =>
                            form.setValue("createMode", "from_quotation")
                          }
                        >
                          <p className="text-sm font-semibold text-[var(--lux-text)]">
                            {t("contracts.fromQuotationMode", {
                              defaultValue: "Create From Quotation",
                            })}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-[var(--lux-text-secondary)]">
                            {t("contracts.fromQuotationModeHint", {
                              defaultValue:
                                "Select a quotation and convert it into a contract.",
                            })}
                          </p>
                        </button>
                      </div>
                    </section>
                  ) : null}

                  <section className="space-y-4">
                    <div
                      className="border-b pb-3"
                      style={{ borderColor: "var(--lux-row-border)" }}
                    >
                      <h2 className={sectionTitleClass}>
                        {t("contracts.headerInformation", {
                          defaultValue: "Contract Header",
                        })}
                      </h2>
                      <p className={sectionHintClass}>
                        {t("contracts.headerInformationHint", {
                          defaultValue:
                            "Set the contract reference details, linked records, and commercial dates.",
                        })}
                      </p>
                    </div>

                    {isEditMode ? (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <ReadonlyInfo
                          label={t("contracts.quotation", {
                            defaultValue: "Quotation",
                          })}
                          value={
                            contract?.quotation
                              ? getQuotationDisplayNumber(contract.quotation)
                              : contract?.quotationId
                                ? `QT-${contract.quotationId}`
                                : "-"
                          }
                        />
                        <ReadonlyInfo
                          label={t("contracts.event", {
                            defaultValue: "Event",
                          })}
                          value={
                            contract?.event
                              ? getEventDisplayTitle(contract.event)
                              : contract?.eventId
                                ? `Event #${contract.eventId}`
                                : "-"
                          }
                        />
                        <ReadonlyInfo
                          label={t("contracts.customer", {
                            defaultValue: "Customer",
                          })}
                          value={
                            contract?.event?.customer?.fullName ||
                            contract?.customer?.fullName ||
                            "-"
                          }
                        />
                      </div>
                    ) : null}

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {!isEditMode ? (
                        <label className="space-y-2">
                          <span className="text-sm font-medium text-[var(--lux-text)]">
                            {t("contracts.quotation", {
                              defaultValue: "Quotation",
                            })}
                          </span>
                          <Select
                            value={form.watch("quotationId") || "none"}
                            onValueChange={(value) =>
                              form.setValue(
                                "quotationId",
                                value === "none" ? "" : value,
                                {
                                  shouldDirty: true,
                                },
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue
                                placeholder={t("contracts.selectQuotation", {
                                  defaultValue: "Select quotation",
                                })}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">
                                {t("contracts.noQuotationSelected", {
                                  defaultValue: "No quotation selected",
                                })}
                              </SelectItem>
                              {selectableQuotations.map((quotation) => (
                                <SelectItem
                                  key={quotation.id}
                                  value={String(quotation.id)}
                                >
                                  {getQuotationDisplayNumber(quotation)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {form.formState.errors.quotationId ? (
                            <p className="text-[0.8rem] font-medium text-[var(--lux-danger)]">
                              {String(
                                form.formState.errors.quotationId.message,
                              )}
                            </p>
                          ) : null}
                        </label>
                      ) : null}

                      {!isEditMode && watchedCreateMode === "manual" ? (
                        <label className="space-y-2">
                          <span className="text-sm font-medium text-[var(--lux-text)]">
                            {t("contracts.event", { defaultValue: "Event" })}
                          </span>
                          <Select
                            value={form.watch("eventId") || "none"}
                            onValueChange={(value) =>
                              form.setValue(
                                "eventId",
                                value === "none" ? "" : value,
                                {
                                  shouldDirty: true,
                                },
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue
                                placeholder={t("contracts.selectEvent", {
                                  defaultValue: "Select event",
                                })}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">
                                {t("contracts.noEventSelected", {
                                  defaultValue: "No event selected",
                                })}
                              </SelectItem>
                              {events.map((event) => (
                                <SelectItem
                                  key={event.id}
                                  value={String(event.id)}
                                >
                                  {getEventDisplayTitle(event)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {form.formState.errors.eventId ? (
                            <p className="text-[0.8rem] font-medium text-[var(--lux-danger)]">
                              {String(form.formState.errors.eventId.message)}
                            </p>
                          ) : null}
                        </label>
                      ) : null}

                      <label className="space-y-2">
                        <span className="text-sm font-medium text-[var(--lux-text)]">
                          {t("contracts.contractNumber", {
                            defaultValue: "Contract Number",
                          })}
                        </span>
                        <Input
                          {...form.register("contractNumber")}
                          placeholder={t(
                            "contracts.contractNumberPlaceholder",
                            {
                              defaultValue: "Enter contract number",
                            },
                          )}
                        />
                      </label>

                      <label className="space-y-2">
                        <span className="text-sm font-medium text-[var(--lux-text)]">
                          {t("contracts.signedDate", {
                            defaultValue: "Signed Date",
                          })}
                        </span>
                        <Input type="date" {...form.register("signedDate")} />
                        {form.formState.errors.signedDate ? (
                          <p className="text-[0.8rem] font-medium text-[var(--lux-danger)]">
                            {String(form.formState.errors.signedDate.message)}
                          </p>
                        ) : null}
                      </label>

                      <label className="space-y-2">
                        <span className="text-sm font-medium text-[var(--lux-text)]">
                          {t("contracts.eventDate", {
                            defaultValue: "Event Date",
                          })}
                        </span>
                        <Input type="date" {...form.register("eventDate")} />
                      </label>

                      {!isEditMode && watchedCreateMode === "manual" ? (
                        <></>
                      ) : null}

                      {isEditMode || watchedCreateMode === "manual" ? (
                        <label className="space-y-2">
                          <span className="text-sm font-medium text-[var(--lux-text)]">
                            {t("contracts.discount", {
                              defaultValue: "Discount",
                            })}
                          </span>
                          <Input
                            type="number"
                            min="0"
                            step="0.001"
                            {...form.register("discountAmount")}
                            placeholder={t("contracts.discountPlaceholder", {
                              defaultValue: "Enter discount amount",
                            })}
                          />
                          {form.formState.errors.discountAmount ? (
                            <p className="text-[0.8rem] font-medium text-[var(--lux-danger)]">
                              {String(
                                form.formState.errors.discountAmount.message,
                              )}
                            </p>
                          ) : null}
                        </label>
                      ) : null}

                      <div className="md:col-span-2">
                        <WorkflowLockBanner
                          title={t("contracts.statusManagedByWorkflow", {
                            defaultValue: "Status Managed by Workflow",
                          })}
                          message={t("contracts.statusManagedByWorkflowHint", {
                            defaultValue:
                              "Contracts start in draft. Use the contract detail screen workflow actions to issue, sign, activate, complete, cancel, or terminate the commitment.",
                          })}
                        />
                      </div>
                    </div>

                    {selectedQuotation &&
                    !isEditMode &&
                    watchedCreateMode === "from_quotation" ? (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                        <ReadonlyInfo
                          label={t("contracts.quotation", {
                            defaultValue: "Quotation",
                          })}
                          value={getQuotationDisplayNumber(selectedQuotation)}
                        />
                        <ReadonlyInfo
                          label={t("contracts.event", {
                            defaultValue: "Event",
                          })}
                          value={
                            selectedQuotation.event
                              ? getEventDisplayTitle(selectedQuotation.event)
                              : `Event #${selectedQuotation.eventId}`
                          }
                        />
                        <ReadonlyInfo
                          label={t("contracts.customer", {
                            defaultValue: "Customer",
                          })}
                          value={
                            selectedQuotation.event?.customer?.fullName ||
                            selectedQuotation.customer?.fullName ||
                            "-"
                          }
                        />
                      </div>
                    ) : null}

                    <label className="space-y-2">
                      <span className="text-sm font-medium text-[var(--lux-text)]">
                        {t("common.notes", { defaultValue: "Notes" })}
                      </span>
                      <textarea
                        {...form.register("notes")}
                        className={textareaClassName}
                        placeholder={t("contracts.notesPlaceholder", {
                          defaultValue:
                            "Add contract notes, commercial conditions, or internal remarks...",
                        })}
                        style={{
                          background: "var(--lux-control-surface)",
                          borderColor: "var(--lux-control-border)",
                        }}
                      />
                    </label>
                  </section>

                  {!isEditMode && watchedCreateMode === "manual" ? (
                    <section className="space-y-6">
                      <div className="space-y-1">
                        <h2 className={sectionTitleClass}>
                          {t("contracts.manualChecklistTitle", {
                            defaultValue: "Select services and vendors",
                          })}
                        </h2>
                        <p className={sectionHintClass}>
                          {t("contracts.manualChecklistHint", {
                            defaultValue:
                              "Choose event-linked items first when available, or use the system catalogs to build the contract rows automatically.",
                          })}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                        <SelectionCard
                          title={t("contracts.servicesChecklistTitle", {
                            defaultValue: "Services",
                          })}
                          hint={t("contracts.servicesChecklistHint", {
                            defaultValue:
                              "Selected services create editable service rows with references preserved for the contract snapshot.",
                          })}
                        >
                          <div className="space-y-4">
                            <div>
                              <div className="mb-2 text-sm font-semibold text-[var(--lux-heading)]">
                                {t("contracts.eventServices", {
                                  defaultValue: "Event Services",
                                })}
                              </div>
                              {!watchedEventId ? (
                                <EmptyHint
                                  text={t(
                                    "contracts.selectEventBeforeServices",
                                    {
                                      defaultValue: "Select an event first.",
                                    },
                                  )}
                                />
                              ) : availableEventServices.length === 0 ? (
                                <EmptyHint
                                  text={t(
                                    "contracts.noEventServicesForEvent",
                                    {
                                      defaultValue:
                                        "This event has no services yet.",
                                    },
                                  )}
                                />
                              ) : (
                                <div className="space-y-3">
                                  {availableEventServices.map((item) => (
                                    <SelectableCard
                                      key={`contract-event-service-${item.id}`}
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
                                          defaultValue: item.category,
                                        },
                                      )}
                                      meta={[
                                        `${t("contracts.quantity", {
                                          defaultValue: "Quantity",
                                        })}: ${item.quantity ?? 1}`,
                                        t("contracts.serviceManualPricingHintShort", {
                                          defaultValue:
                                            "Price stays editable in the contract row",
                                        }),
                                      ]}
                                      helperText={item.notes ?? undefined}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>

                            <div>
                              <div className="mb-2 text-sm font-semibold text-[var(--lux-heading)]">
                                {t("contracts.catalogServices", {
                                  defaultValue: "Catalog Services",
                                })}
                              </div>
                              {services.length === 0 ? (
                                <EmptyHint
                                  text={t("contracts.noCatalogServices", {
                                    defaultValue: "No catalog services found.",
                                  })}
                                />
                              ) : (
                                <div className="space-y-3">
                                  {services.map((service) => (
                                    <SelectableCard
                                      key={`contract-catalog-service-${service.id}`}
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
                                      subtitle={service.category || undefined}
                                      meta={[
                                        t("contracts.catalogServiceSource", {
                                          defaultValue:
                                            "Source: service catalog",
                                        }),
                                        t("contracts.serviceManualPricingHintShort", {
                                          defaultValue:
                                            "Price stays editable in the contract row",
                                        }),
                                      ]}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </SelectionCard>

                        <SelectionCard
                          title={t("contracts.vendorsChecklistTitle", {
                            defaultValue: "Vendors",
                          })}
                          hint={t("contracts.vendorsChecklistHint", {
                            defaultValue:
                              "Event vendors use agreed prices directly. Catalog vendors can match pricing plans from selected sub-services.",
                          })}
                        >
                          <div className="space-y-4">
                            <div>
                              <div className="mb-2 text-sm font-semibold text-[var(--lux-heading)]">
                                {t("contracts.eventVendors", {
                                  defaultValue: "Event Vendors",
                                })}
                              </div>
                              {!watchedEventId ? (
                                <EmptyHint
                                  text={t("contracts.selectEventBeforeVendors", {
                                    defaultValue: "Select an event first.",
                                  })}
                                />
                              ) : availableEventVendors.length === 0 ? (
                                <EmptyHint
                                  text={t("contracts.noEventVendorsForEvent", {
                                    defaultValue:
                                      "This event has no vendors yet.",
                                  })}
                                />
                              ) : (
                                <div className="space-y-3">
                                  {availableEventVendors.map((item) => {
                                    const disabledReason =
                                      getEventVendorDisabledReason(item);

                                    return (
                                      <SelectableCard
                                        key={`contract-event-vendor-${item.id}`}
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
                                          `${t("contracts.agreedPrice", {
                                            defaultValue: "Agreed Price",
                                          })}: ${formatVendorMoney(item.agreedPrice ?? 0)}`,
                                          `${t("contracts.itemStatus", {
                                            defaultValue: "Status",
                                          })}: ${item.status}`,
                                        ]}
                                        helperText={
                                          disabledReason === "cancelled"
                                            ? t(
                                                "contracts.cannotSelectCancelledVendor",
                                                {
                                                  defaultValue:
                                                    "Cannot select cancelled vendor",
                                                },
                                              )
                                            : disabledReason === "missing_price"
                                              ? t(
                                                  "contracts.vendorHasNoAgreedPrice",
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
                                {t("contracts.catalogVendors", {
                                  defaultValue: "Vendor Catalog",
                                })}
                              </div>
                              {catalogVendors.length === 0 ? (
                                <EmptyHint
                                  text={t("contracts.noCatalogVendors", {
                                    defaultValue: "No catalog vendors found.",
                                  })}
                                />
                              ) : (
                                <div className="space-y-3">
                                  {catalogVendors.map((vendor) => (
                                    <ContractCatalogVendorSelectionCard
                                      key={`contract-catalog-vendor-${vendor.id}`}
                                      vendor={vendor}
                                      checked={selectedManualCatalogVendorIds.includes(
                                        String(vendor.id),
                                      )}
                                      currentItem={watchedItems.find(
                                        (item) =>
                                          item.itemType === "vendor" &&
                                          item.vendorId === String(vendor.id) &&
                                          !item.eventVendorId,
                                      )}
                                      config={
                                        catalogVendorConfigs[String(vendor.id)]
                                      }
                                      t={t}
                                      onCheckedChange={(value) =>
                                        toggleManualCatalogVendor(vendor, value)
                                      }
                                      onConfigChange={updateCatalogVendorConfig}
                                      onResolvedValuesChange={(values) =>
                                        handleManualCatalogVendorResolvedValues(
                                          String(vendor.id),
                                          values,
                                        )
                                      }
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </SelectionCard>
                      </div>

                      <EditableContractItemsSection
                        t={t}
                        fields={itemFields}
                        items={watchedItems ?? []}
                        form={form}
                        onRemove={handleRemoveManualRow}
                      />

                      {form.formState.errors.items ? (
                        <p className="text-sm font-medium text-[var(--lux-danger)]">
                          {String(form.formState.errors.items.message)}
                        </p>
                      ) : null}
                    </section>
                  ) : null}

                  {isEditMode ? (
                    <section className="space-y-4">
                      <div
                        className="border-b pb-3"
                        style={{ borderColor: "var(--lux-row-border)" }}
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <h2 className={sectionTitleClass}>
                              {t("contracts.itemsTitle", {
                                defaultValue: "Contract Items",
                              })}
                            </h2>
                            <p className={sectionHintClass}>
                              {isEditMode
                                ? t("contracts.editItemsHint", {
                                    defaultValue:
                                  "Update the existing contract items. Adding or deleting items will be connected in a later backend phase.",
                                  })
                                : t("contracts.itemsHint", {
                                    defaultValue:
                                      "Add the commercial lines that should appear on this contract.",
                                  })}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {itemFields.map((field, index) => {
                          const itemValues = watchedItems?.[index];
                          const itemType = itemValues?.itemType ?? "service";
                          const isVendorItem = itemType === "vendor";
                          const rowKey = field.id;
                          const currentVendorSource = getVendorSource(
                            rowKey,
                            itemValues,
                          );
                          const itemTotal =
                            computeContractItemTotal(
                              itemValues?.quantity,
                              itemValues?.unitPrice,
                            ) ?? 0;

                          return (
                            <div
                              key={field.id}
                              className="rounded-[4px] border p-4"
                              style={{
                                background: isVendorItem
                                  ? "var(--lux-control-hover)"
                                  : "var(--lux-row-surface)",
                                borderColor: "var(--lux-row-border)",
                              }}
                            >
                              <div className="flex flex-col gap-4">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm font-semibold text-[var(--lux-heading)]">
                                        {t("contracts.itemLabel", {
                                          defaultValue: "Item",
                                        })}{" "}
                                        #{index + 1}
                                      </p>
                                      <TypeBadge item={itemValues} t={t} />
                                    </div>
                                    {isEditMode && itemValues?.id ? (
                                      <p className="text-xs text-[var(--lux-text-secondary)]">
                                        {t("contracts.itemReference", {
                                          defaultValue: "Line Reference",
                                        })}
                                        : {itemValues.id}
                                      </p>
                                    ) : null}
                                  </div>

                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                                  <label className="space-y-2">
                                    <span className="text-sm font-medium text-[var(--lux-text)]">
                                      {t("contracts.type", {
                                        defaultValue: "Type",
                                      })}
                                    </span>
                                    <Select
                                      value={itemType}
                                      onValueChange={(value) =>
                                        handleItemTypeChange(
                                          index,
                                          value as ContractItemType,
                                        )
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="service">
                                          {t("contracts.service", {
                                            defaultValue: "Service",
                                          })}
                                        </SelectItem>
                                        <SelectItem value="vendor">
                                          {t("contracts.vendor", {
                                            defaultValue: "Vendor",
                                          })}
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </label>

                                  <label className="space-y-2">
                                    <span className="text-sm font-medium text-[var(--lux-text)]">
                                      {t("contracts.linkedQuotationItem", {
                                        defaultValue: "Quotation Item",
                                      })}
                                    </span>
                                    <Select
                                      value={
                                        form.watch(
                                          `items.${index}.quotationItemId`,
                                        ) || "none"
                                      }
                                      onValueChange={(value) =>
                                        handleQuotationItemSelect(
                                          index,
                                          value === "none" ? "" : value,
                                        )
                                      }
                                      disabled={!linkedQuotationItems.length}
                                    >
                                      <SelectTrigger>
                                        <SelectValue
                                          placeholder={t(
                                            "contracts.selectQuotationItem",
                                            {
                                              defaultValue:
                                                "Select quotation item",
                                            },
                                          )}
                                        />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="none">
                                          {t(
                                            "contracts.noQuotationItemSelected",
                                            {
                                              defaultValue:
                                                "No quotation item selected",
                                            },
                                          )}
                                        </SelectItem>
                                        {linkedQuotationItems.map((item) => (
                                          <SelectItem
                                            key={item.id}
                                            value={String(item.id)}
                                          >
                                            {getContractItemDisplayName(
                                              item as any,
                                            )}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </label>

                                  {isVendorItem ? (
                                    <label className="space-y-2">
                                      <span className="text-sm font-medium text-[var(--lux-text)]">
                                        {t("contracts.vendorSource", {
                                          defaultValue: "Vendor Source",
                                        })}
                                      </span>
                                      <Select
                                        value={currentVendorSource}
                                        onValueChange={(value) =>
                                          handleVendorSourceChange(
                                            index,
                                            rowKey,
                                            value as ContractVendorSource,
                                          )
                                        }
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="event_vendor">
                                            {t("contracts.eventVendorSource", {
                                              defaultValue: "Event Vendor",
                                            })}
                                          </SelectItem>
                                          <SelectItem value="catalog_vendor">
                                            {t("contracts.catalogVendorSource", {
                                              defaultValue: "Catalog Vendor",
                                            })}
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </label>
                                  ) : null}

                                  {isVendorItem ? (
                                    currentVendorSource === "event_vendor" ? (
                                    <FieldInput
                                      label={t("contracts.linkedEventVendor", {
                                        defaultValue: "Event Vendor",
                                      })}
                                      error={
                                        form.formState.errors.items?.[index]
                                          ?.eventVendorId?.message
                                      }
                                    >
                                      <Select
                                        value={
                                          form.watch(
                                            `items.${index}.eventVendorId`,
                                          ) || "none"
                                        }
                                        onValueChange={(value) =>
                                          handleEventVendorSelect(
                                            index,
                                            value === "none" ? "" : value,
                                          )
                                        }
                                        disabled={!watchedEventId}
                                      >
                                        <SelectTrigger>
                                          <SelectValue
                                            placeholder={t(
                                              "contracts.selectEventVendor",
                                              {
                                                defaultValue:
                                                  "Select event vendor",
                                              },
                                            )}
                                          />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="none">
                                            {t(
                                              "contracts.noEventVendorSelected",
                                              {
                                                defaultValue:
                                                  "No event vendor selected",
                                              },
                                            )}
                                          </SelectItem>
                                          {availableEventVendors.map((item) => (
                                            <SelectItem
                                              key={item.id}
                                              value={String(item.id)}
                                            >
                                              {`${getEventVendorDisplayName(item)} • ${t(
                                                `vendors.type.${item.vendorType}`,
                                                {
                                                  defaultValue:
                                                    formatVendorType(
                                                      item.vendorType,
                                                    ),
                                                },
                                              )} • ${formatMoney(item.agreedPrice ?? 0)}`}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </FieldInput>
                                    ) : (
                                      <FieldInput
                                        label={t("contracts.linkedVendor", {
                                          defaultValue: "Catalog Vendor",
                                        })}
                                        error={
                                          form.formState.errors.items?.[index]
                                            ?.vendorId?.message
                                        }
                                      >
                                        <Select
                                          value={
                                            form.watch(
                                              `items.${index}.vendorId`,
                                            ) || "none"
                                          }
                                          onValueChange={(value) =>
                                            handleCatalogVendorSelect(
                                              index,
                                              rowKey,
                                              value === "none" ? "" : value,
                                            )
                                          }
                                        >
                                          <SelectTrigger>
                                            <SelectValue
                                              placeholder={t(
                                                "contracts.selectVendor",
                                                {
                                                  defaultValue:
                                                    "Select vendor",
                                                },
                                              )}
                                            />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="none">
                                              {t("contracts.noVendorSelected", {
                                                defaultValue:
                                                  "No vendor selected",
                                              })}
                                            </SelectItem>
                                            {catalogVendors.map((vendor) => (
                                              <SelectItem
                                                key={vendor.id}
                                                value={String(vendor.id)}
                                              >
                                                {vendor.name}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </FieldInput>
                                    )
                                  ) : (
                                    <label className="space-y-2">
                                      <span className="text-sm font-medium text-[var(--lux-text)]">
                                        {t("contracts.linkedEventService", {
                                          defaultValue: "Event Service",
                                        })}
                                      </span>
                                      <Select
                                        value={
                                          form.watch(
                                            `items.${index}.eventServiceId`,
                                          ) || "none"
                                        }
                                        onValueChange={(value) =>
                                          handleEventServiceSelect(
                                            index,
                                            value === "none" ? "" : value,
                                          )
                                        }
                                        disabled={!watchedEventId}
                                      >
                                        <SelectTrigger>
                                          <SelectValue
                                            placeholder={t(
                                              "contracts.selectEventService",
                                              {
                                                defaultValue:
                                                  "Select event service",
                                              },
                                            )}
                                          />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="none">
                                            {t(
                                              "contracts.noEventServiceSelected",
                                              {
                                                defaultValue:
                                                  "No event service selected",
                                              },
                                            )}
                                          </SelectItem>
                                          {availableEventServices.map(
                                            (item) => (
                                              <SelectItem
                                                key={item.id}
                                                value={String(item.id)}
                                              >
                                                {item.serviceNameSnapshot}
                                              </SelectItem>
                                            ),
                                          )}
                                        </SelectContent>
                                      </Select>
                                    </label>
                                  )}

                                  {isVendorItem ? (
                                    <div
                                      className="rounded-[4px] border px-4 py-3 text-sm text-[var(--lux-text-secondary)]"
                                      style={{
                                        background: "var(--lux-panel-surface)",
                                        borderColor: "var(--lux-row-border)",
                                      }}
                                    >
                                      <p className="font-medium text-[var(--lux-text)]">
                                        {t("contracts.vendorSnapshotOnly", {
                                          defaultValue:
                                            "This changes the contract snapshot only",
                                        })}
                                      </p>
                                      <p className="mt-1 text-xs">
                                        {currentVendorSource ===
                                        "catalog_vendor"
                                          ? t("contracts.catalogVendorPricingHint", {
                                              defaultValue:
                                                "Catalog vendor rows can match pricing plans from the selected sub-services, then allow a manual override when needed.",
                                            })
                                          : itemValues?.pricingPlanId
                                          ? `${t("contracts.pricingPlan", {
                                              defaultValue: "Pricing Plan",
                                            })}: #${itemValues.pricingPlanId}`
                                          : t(
                                              "contracts.vendorAgreedPriceHint",
                                              {
                                                defaultValue:
                                                  "Vendor rows use the event vendor agreed price as the default contract amount.",
                                              },
                                        )}
                                      </p>
                                    </div>
                                  ) : (
                                    <label className="space-y-2">
                                      <span className="text-sm font-medium text-[var(--lux-text)]">
                                        {t("contracts.linkedService", {
                                          defaultValue: "Catalog Service",
                                        })}
                                      </span>
                                      <Select
                                        value={
                                          form.watch(
                                            `items.${index}.serviceId`,
                                          ) || "none"
                                        }
                                        onValueChange={(value) =>
                                          handleServiceSelect(
                                            index,
                                            value === "none" ? "" : value,
                                          )
                                        }
                                      >
                                        <SelectTrigger>
                                          <SelectValue
                                            placeholder={t(
                                              "contracts.selectService",
                                              {
                                                defaultValue: "Select service",
                                              },
                                            )}
                                          />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="none">
                                            {t("contracts.noServiceSelected", {
                                              defaultValue:
                                                "No service selected",
                                            })}
                                          </SelectItem>
                                          {services.map((service) => (
                                            <SelectItem
                                              key={service.id}
                                              value={String(service.id)}
                                            >
                                              {service.name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </label>
                                  )}

                                  {isVendorItem &&
                                  currentVendorSource === "catalog_vendor" ? (
                                    <ContractCatalogVendorConfigurator
                                      rowKey={rowKey}
                                      vendorId={itemValues?.vendorId || ""}
                                      currentItem={itemValues}
                                      config={catalogVendorConfigs[rowKey]}
                                      vendors={catalogVendors}
                                      onConfigChange={updateCatalogVendorConfig}
                                      onResolvedValuesChange={(values) =>
                                        handleCatalogVendorResolvedValues(
                                          index,
                                          values,
                                        )
                                      }
                                      t={t}
                                    />
                                  ) : null}
                                </div>

                                <div
                                  className="rounded-[4px] border px-4 py-3 text-sm text-[var(--lux-text-secondary)]"
                                  style={{
                                    background: "var(--lux-panel-surface)",
                                    borderColor: "var(--lux-row-border)",
                                  }}
                                >
                                  <p className="font-medium text-[var(--lux-text)]">
                                    {isVendorItem
                                      ? t("contracts.vendorOrigin", {
                                          defaultValue: "Vendor-origin row",
                                        })
                                      : t("contracts.serviceManualPricing", {
                                          defaultValue:
                                            "Manual service pricing",
                                        })}
                                  </p>
                                  <p className="mt-1">
                                    {isVendorItem
                                      ? getContractItemOriginLabel(
                                          itemValues as any,
                                        ) || "-"
                                      : t(
                                          "contracts.serviceManualPricingHint",
                                          {
                                            defaultValue:
                                              "Service selection only fills description and references. Enter the contract amount manually in this row.",
                                          },
                                        )}
                                  </p>
                                  <p className="mt-1 text-xs">
                                    {itemValues?.quotationItemId
                                      ? `${t("contracts.linkedQuotationItem", {
                                          defaultValue: "Quotation Item",
                                        })}: #${itemValues.quotationItemId}`
                                      : null}
                                    {itemValues?.eventServiceId
                                      ? `${itemValues?.quotationItemId ? " • " : ""}${t(
                                          "contracts.linkedEventService",
                                          {
                                            defaultValue: "Event Service",
                                          },
                                        )}: #${itemValues.eventServiceId}`
                                      : null}
                                    {itemValues?.serviceId
                                      ? `${itemValues?.quotationItemId || itemValues?.eventServiceId ? " • " : ""}${t(
                                          "contracts.linkedService",
                                          {
                                            defaultValue: "Catalog Service",
                                          },
                                        )}: #${itemValues.serviceId}`
                                      : null}
                                    {itemValues?.eventVendorId
                                      ? `${itemValues?.quotationItemId ? " • " : ""}${t(
                                          "contracts.linkedEventVendor",
                                          {
                                            defaultValue: "Event Vendor",
                                          },
                                        )}: #${itemValues.eventVendorId}`
                                      : null}
                                  </p>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                                  <FieldInput
                                    label={t("contracts.itemName", {
                                      defaultValue: "Item Name",
                                    })}
                                    error={
                                      form.formState.errors.items?.[index]
                                        ?.itemName?.message
                                    }
                                  >
                                    <Input
                                      {...form.register(
                                        `items.${index}.itemName`,
                                      )}
                                      placeholder={t(
                                        "contracts.itemNamePlaceholder",
                                        {
                                          defaultValue: "Enter item name",
                                        },
                                      )}
                                    />
                                  </FieldInput>

                                  <FieldInput
                                    label={t("contracts.category", {
                                      defaultValue: "Category",
                                    })}
                                  >
                                    <Input
                                      {...form.register(
                                        `items.${index}.category`,
                                      )}
                                      placeholder={t(
                                        "contracts.categoryPlaceholder",
                                        {
                                          defaultValue: "Enter item category",
                                        },
                                      )}
                                    />
                                  </FieldInput>

                                  <FieldInput
                                    label={t("contracts.sortOrder", {
                                      defaultValue: "Sort Order",
                                    })}
                                    error={
                                      form.formState.errors.items?.[index]
                                        ?.sortOrder?.message
                                    }
                                  >
                                    <Input
                                      type="number"
                                      min="0"
                                      {...form.register(
                                        `items.${index}.sortOrder`,
                                      )}
                                    />
                                  </FieldInput>

                                  <FieldInput
                                    label={t("contracts.quantity", {
                                      defaultValue: "Quantity",
                                    })}
                                    error={
                                      form.formState.errors.items?.[index]
                                        ?.quantity?.message
                                    }
                                  >
                                    <Input
                                      type="number"
                                      min="0.001"
                                      step="0.001"
                                      {...form.register(
                                        `items.${index}.quantity`,
                                      )}
                                    />
                                  </FieldInput>

                                  <FieldInput
                                    label={t("contracts.unitPrice", {
                                      defaultValue: "Unit Price",
                                    })}
                                    error={
                                      form.formState.errors.items?.[index]
                                        ?.unitPrice?.message
                                    }
                                  >
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.001"
                                      {...form.register(
                                        `items.${index}.unitPrice`,
                                      )}
                                    />
                                  </FieldInput>

                                  <FieldInput
                                    label={t("contracts.totalPrice", {
                                      defaultValue: "Total Price",
                                    })}
                                  >
                                    <Input readOnly value={String(itemTotal)} />
                                  </FieldInput>
                                </div>

                                <label className="space-y-2">
                                  <span className="text-sm font-medium text-[var(--lux-text)]">
                                    {t("common.notes", {
                                      defaultValue: "Notes",
                                    })}
                                  </span>
                                  <textarea
                                    {...form.register(`items.${index}.notes`)}
                                    className={textareaClassName}
                                    placeholder={t(
                                      "contracts.itemNotesPlaceholder",
                                      {
                                        defaultValue:
                                          "Add item notes, scope details, or commercial remarks...",
                                      },
                                    )}
                                    style={{
                                      background: "var(--lux-control-surface)",
                                      borderColor: "var(--lux-control-border)",
                                    }}
                                  />
                                </label>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {form.formState.errors.items?.message ? (
                        <p className="text-sm font-medium text-[var(--lux-danger)]">
                          {String(form.formState.errors.items.message)}
                        </p>
                      ) : null}

                      {isEditMode ? (
                        <div
                          className="rounded-[4px] border px-4 py-3 text-sm text-[var(--lux-text-secondary)]"
                          style={{
                            background: "var(--lux-control-hover)",
                            borderColor: "var(--lux-row-border)",
                          }}
                        >
                          {t("contracts.editItemsRestriction", {
                            defaultValue:
                              "This phase supports updating existing contract items only. Adding or deleting lines will be enabled when backend endpoints are available.",
                          })}
                        </div>
                      ) : null}
                    </section>
                  ) : (
                    <section className="space-y-4">
                      <div
                        className="border-b pb-3"
                        style={{ borderColor: "var(--lux-row-border)" }}
                      >
                        <h2 className={sectionTitleClass}>
                          {t("contracts.fromQuotationPreviewTitle", {
                            defaultValue: "Quotation Preview",
                          })}
                        </h2>
                        <p className={sectionHintClass}>
                          {t("contracts.fromQuotationPreviewHint", {
                            defaultValue:
                              "Review the quotation summary and items that will be converted into this contract.",
                          })}
                        </p>
                      </div>

                      {selectedQuotation ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                            <ReadonlyInfo
                              label={t("contracts.quotation", {
                                defaultValue: "Quotation",
                              })}
                              value={getQuotationDisplayNumber(
                                selectedQuotation,
                              )}
                            />
                            <ReadonlyInfo
                              label={t("contracts.event", {
                                defaultValue: "Event",
                              })}
                              value={
                                selectedQuotation.event
                                  ? getEventDisplayTitle(
                                      selectedQuotation.event,
                                    )
                                  : `Event #${selectedQuotation.eventId}`
                              }
                            />
                            <ReadonlyInfo
                              label={t("contracts.customer", {
                                defaultValue: "Customer",
                              })}
                              value={
                                selectedQuotation.event?.customer?.fullName ||
                                selectedQuotation.customer?.fullName ||
                                "-"
                              }
                            />
                          </div>

                          <div className="rounded-[4px] border p-4">
                            <div className="overflow-x-auto">
                              <table className="min-w-full text-sm">
                                <thead>
                                  <tr className="border-b border-[var(--lux-row-border)] text-[var(--lux-text-muted)]">
                                    <th className="px-3 py-3 text-start">
                                      {t("contracts.serviceColumn", {
                                        defaultValue: "Services",
                                      })}
                                    </th>
                                    <th className="px-3 py-3 text-start">
                                      {t("contracts.priceColumn", {
                                        defaultValue: "Price",
                                      })}
                                    </th>
                                    <th className="px-3 py-3 text-start">
                                      {t("contracts.companyColumn", {
                                        defaultValue: "Companies",
                                      })}
                                    </th>
                                    <th className="px-3 py-3 text-start">
                                      {t("contracts.priceColumn", {
                                        defaultValue: "Price",
                                      })}
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {quotationPreviewPairedItems.map(
                                    ({ serviceItem, vendorItem }, index) => (
                                      <tr
                                        key={`${serviceItem?.id ?? "service-none"}-${vendorItem?.id ?? "vendor-none"}-${index}`}
                                        className="border-b border-[var(--lux-row-border)] align-top last:border-b-0"
                                        style={{
                                          background:
                                            serviceItem &&
                                            isServiceSummaryItem(serviceItem)
                                              ? "var(--lux-control-hover)"
                                              : "transparent",
                                        }}
                                      >
                                        <td className="px-3 py-3">
                                          {serviceItem ? (
                                            <div className="space-y-1">
                                              <div className="font-medium text-[var(--lux-text)]">
                                                {getQuotationItemDisplayName(
                                                  serviceItem,
                                                )}
                                              </div>
                                              <div className="text-xs text-[var(--lux-text-secondary)]">
                                                <TypeBadge
                                                  item={serviceItem}
                                                  t={t}
                                                />
                                              </div>
                                              <div className="text-xs text-[var(--lux-text-secondary)]">
                                                {`${t(
                                                  "contracts.serviceOrigin",
                                                  {
                                                    defaultValue:
                                                      "Service-origin row",
                                                  },
                                                )}: ${getQuotationPreviewOriginLabel(serviceItem)}`}
                                              </div>
                                            </div>
                                          ) : (
                                            "-"
                                          )}
                                        </td>
                                        <td className="px-3 py-3 text-[var(--lux-text-secondary)]">
                                          {serviceItem
                                            ? formatMoney(
                                                getContractPreviewItemPrice(
                                                  serviceItem,
                                                ),
                                              )
                                            : "-"}
                                        </td>
                                        <td className="px-3 py-3">
                                          {vendorItem ? (
                                            <div className="space-y-1">
                                              <div className="font-medium text-[var(--lux-text)]">
                                                {getQuotationItemDisplayName(
                                                  vendorItem,
                                                )}
                                              </div>
                                              <div className="text-xs text-[var(--lux-text-secondary)]">
                                                <TypeBadge
                                                  item={vendorItem}
                                                  t={t}
                                                />
                                              </div>
                                              <div className="text-xs text-[var(--lux-text-secondary)]">
                                                {`${t(
                                                  "contracts.vendorOrigin",
                                                  {
                                                    defaultValue:
                                                      "Vendor-origin row",
                                                  },
                                                )}: ${getQuotationPreviewOriginLabel(vendorItem)}`}
                                              </div>
                                            </div>
                                          ) : serviceItem &&
                                            isServiceSummaryItem(
                                              serviceItem,
                                            ) ? (
                                            <div className="space-y-1">
                                              <div className="font-medium text-[var(--lux-text)]">
                                                {t("contracts.totalCompanies", {
                                                  defaultValue:
                                                    "إجمالي الشركات",
                                                })}
                                              </div>
                                              <div className="text-xs text-[var(--lux-text-secondary)]">
                                                <span
                                                  className="inline-flex rounded-[4px] border px-3 py-1 text-xs font-semibold"
                                                  style={{
                                                    borderColor:
                                                      "var(--lux-gold-border)",
                                                    color: "var(--lux-gold)",
                                                  }}
                                                >
                                                  {t(
                                                    "contracts.totalCompanies",
                                                    {
                                                      defaultValue:
                                                        "إجمالي الشركات",
                                                    },
                                                  )}
                                                </span>
                                              </div>
                                            </div>
                                          ) : (
                                            "-"
                                          )}
                                        </td>
                                        <td className="px-3 py-3 text-[var(--lux-text-secondary)]">
                                          {vendorItem
                                            ? formatMoney(
                                                getContractPreviewItemPrice(
                                                  vendorItem,
                                                ),
                                              )
                                            : serviceItem &&
                                                isServiceSummaryItem(
                                                  serviceItem,
                                                )
                                              ? formatMoney(
                                                  quotationPreviewVendorTotalAmount,
                                                )
                                              : "-"}
                                        </td>
                                      </tr>
                                    ),
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-[var(--lux-text-secondary)]">
                          {t("contracts.selectQuotationToPreview", {
                            defaultValue:
                              "Select a quotation to preview the contract lines.",
                          })}
                        </p>
                      )}
                    </section>
                  )}

                  {!isEditMode ? (
                    <section className="space-y-4">
                      <div
                        className="border-b pb-3"
                        style={{ borderColor: "var(--lux-row-border)" }}
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <h2 className={sectionTitleClass}>
                              {t("contracts.paymentScheduleTitle", {
                                defaultValue: "Payment Schedule",
                              })}
                            </h2>
                            <p className={sectionHintClass}>
                              {t("contracts.paymentScheduleHint", {
                                defaultValue:
                                  "Plan the contract installments here. This is a payment plan only, not actual payment collection.",
                              })}
                            </p>
                          </div>

                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              appendPaymentSchedule(
                                createEmptyPaymentSchedule(
                                  paymentScheduleFields.length,
                                ),
                              )
                            }
                          >
                            <Plus className="h-4 w-4" />
                            {t("contracts.addPaymentSchedule", {
                              defaultValue: "Add Payment Schedule",
                            })}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {paymentScheduleFields.length > 0 ? (
                          paymentScheduleFields.map((field, index) => (
                            <div
                              key={field.id}
                              className="rounded-[4px] border p-4"
                              style={{
                                background: "var(--lux-row-surface)",
                                borderColor: "var(--lux-row-border)",
                              }}
                            >
                              <div className="flex flex-col gap-4">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                  <p className="text-sm font-semibold text-[var(--lux-heading)]">
                                    {t("contracts.installmentLabel", {
                                      defaultValue: "Installment",
                                    })}{" "}
                                    #{index + 1}
                                  </p>

                                  <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={() => removePaymentSchedule(index)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    {t("contracts.removePaymentSchedule", {
                                      defaultValue: "Remove",
                                    })}
                                  </Button>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                                  <FieldInput
                                    label={t("contracts.installmentName", {
                                      defaultValue: "Installment Name",
                                    })}
                                    error={
                                      form.formState.errors.paymentSchedules?.[
                                        index
                                      ]?.installmentName?.message
                                    }
                                  >
                                    <Input
                                      {...form.register(
                                        `paymentSchedules.${index}.installmentName`,
                                      )}
                                    />
                                  </FieldInput>

                                  <label className="space-y-2">
                                    <span className="text-sm font-medium text-[var(--lux-text)]">
                                      {t("contracts.scheduleTypeLabel", {
                                        defaultValue: "Schedule Type",
                                      })}
                                    </span>
                                    <Select
                                      value={
                                        form.watch(
                                          `paymentSchedules.${index}.scheduleType`,
                                        ) || "deposit"
                                      }
                                      onValueChange={(value) =>
                                        form.setValue(
                                          `paymentSchedules.${index}.scheduleType`,
                                          value as PaymentScheduleType,
                                          { shouldDirty: true },
                                        )
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {PAYMENT_SCHEDULE_TYPE_OPTIONS.map(
                                          (option) => (
                                            <SelectItem
                                              key={option.value}
                                              value={option.value}
                                            >
                                              {t(
                                                `contracts.scheduleType.${option.value}`,
                                                {
                                                  defaultValue: option.label,
                                                },
                                              )}
                                            </SelectItem>
                                          ),
                                        )}
                                      </SelectContent>
                                    </Select>
                                  </label>

                                  <FieldInput
                                    label={t("contracts.dueDate", {
                                      defaultValue: "Due Date",
                                    })}
                                  >
                                    <Input
                                      type="date"
                                      {...form.register(
                                        `paymentSchedules.${index}.dueDate`,
                                      )}
                                    />
                                  </FieldInput>

                                  <FieldInput
                                    label={t("contracts.amount", {
                                      defaultValue: "Amount",
                                    })}
                                    error={
                                      form.formState.errors.paymentSchedules?.[
                                        index
                                      ]?.amount?.message
                                    }
                                  >
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.001"
                                      {...form.register(
                                        `paymentSchedules.${index}.amount`,
                                      )}
                                    />
                                  </FieldInput>

                                  <label className="space-y-2">
                                    <span className="text-sm font-medium text-[var(--lux-text)]">
                                      {t("contracts.paymentStatusLabel", {
                                        defaultValue: "Payment Status",
                                      })}
                                    </span>
                                    <Select
                                      value={
                                        form.watch(
                                          `paymentSchedules.${index}.status`,
                                        ) || "pending"
                                      }
                                      onValueChange={(value) =>
                                        form.setValue(
                                          `paymentSchedules.${index}.status`,
                                          value as PaymentScheduleStatus,
                                          { shouldDirty: true },
                                        )
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {PAYMENT_SCHEDULE_STATUS_OPTIONS.map(
                                          (option) => (
                                            <SelectItem
                                              key={option.value}
                                              value={option.value}
                                            >
                                              {t(
                                                `contracts.paymentStatus.${option.value}`,
                                                {
                                                  defaultValue: option.label,
                                                },
                                              )}
                                            </SelectItem>
                                          ),
                                        )}
                                      </SelectContent>
                                    </Select>
                                  </label>

                                  <FieldInput
                                    label={t("contracts.sortOrder", {
                                      defaultValue: "Sort Order",
                                    })}
                                    error={
                                      form.formState.errors.paymentSchedules?.[
                                        index
                                      ]?.sortOrder?.message
                                    }
                                  >
                                    <Input
                                      type="number"
                                      min="0"
                                      {...form.register(
                                        `paymentSchedules.${index}.sortOrder`,
                                      )}
                                    />
                                  </FieldInput>
                                </div>

                                <label className="space-y-2">
                                  <span className="text-sm font-medium text-[var(--lux-text)]">
                                    {t("common.notes", {
                                      defaultValue: "Notes",
                                    })}
                                  </span>
                                  <textarea
                                    {...form.register(
                                      `paymentSchedules.${index}.notes`,
                                    )}
                                    className={textareaClassName}
                                    placeholder={t(
                                      "contracts.paymentScheduleNotesPlaceholder",
                                      {
                                        defaultValue:
                                          "Add installment notes, conditions, or office remarks...",
                                      },
                                    )}
                                    style={{
                                      background: "var(--lux-control-surface)",
                                      borderColor: "var(--lux-control-border)",
                                    }}
                                  />
                                </label>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-[var(--lux-text-secondary)]">
                            {t("contracts.noPaymentSchedulesDraft", {
                              defaultValue:
                                "No payment schedule lines have been added yet.",
                            })}
                          </p>
                        )}
                      </div>
                    </section>
                  ) : null}

                  <section className="space-y-4">
                    <div
                      className="border-b pb-3"
                      style={{ borderColor: "var(--lux-row-border)" }}
                    >
                      <h2 className={sectionTitleClass}>
                        {t("contracts.totals", { defaultValue: "Totals" })}
                      </h2>
                      <p className={sectionHintClass}>
                        {t("contracts.totalsHint", {
                          defaultValue:
                            "Review the commercial totals before saving the contract.",
                        })}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <SummaryTile
                        label={t("contracts.subtotal", {
                          defaultValue: "Subtotal",
                        })}
                        value={formatMoney(
                          isEditMode || watchedCreateMode === "manual"
                            ? contractTotals.subtotal
                            : selectedQuotationTotals.subtotal,
                        )}
                      />
                      <SummaryTile
                        label={t("contracts.discount", {
                          defaultValue: "Discount",
                        })}
                        value={formatMoney(
                          isEditMode || watchedCreateMode === "manual"
                            ? contractTotals.discountAmount
                            : selectedQuotationTotals.discountAmount,
                        )}
                      />
                      <SummaryTile
                        label={t("contracts.totalAmount", {
                          defaultValue: "Total Amount",
                        })}
                        value={formatMoney(
                          isEditMode || watchedCreateMode === "manual"
                            ? contractTotals.totalAmount
                            : selectedQuotationTotals.totalAmount,
                        )}
                        emphasis
                      />
                    </div>
                  </section>
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
                          isEditMode && id ? `/contracts/${id}` : "/contracts",
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
                            isEditMode && id ? `/contracts/${id}` : "/contracts",
                          )
                        }
                      >
                        {t("contracts.returnToDetails", {
                          defaultValue: "Return to Contract",
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

function ContractCatalogVendorSelectionCard({
  vendor,
  checked,
  currentItem,
  config,
  t,
  onCheckedChange,
  onConfigChange,
  onResolvedValuesChange,
}: {
  vendor: CatalogVendorLike;
  checked: boolean;
  currentItem?: Partial<ContractItemFormData>;
  config?: SelectedCatalogVendorConfig;
  t: (key: string, options?: Record<string, unknown>) => string;
  onCheckedChange: (checked: boolean) => void;
  onConfigChange: (
    vendorId: string,
    updater: (
      current: SelectedCatalogVendorConfig,
    ) => SelectedCatalogVendorConfig,
  ) => void;
  onResolvedValuesChange: (
    values: Partial<Omit<ContractItemFormData, "id">>,
  ) => void;
}) {
  const vendorId = String(vendor.id);
  const resolvedConfig = config ?? createDefaultCatalogVendorConfig(vendorId);

  return (
    <div className="space-y-3">
      <SelectableCard
        checked={checked}
        onCheckedChange={onCheckedChange}
        title={vendor.name}
        subtitle={vendor.type ? formatVendorType(vendor.type) : undefined}
        meta={[
          t("contracts.catalogVendorSource", {
            defaultValue: "Source: vendor catalog",
          }),
          checked
            ? resolvedConfig.pricingPlanId
              ? `${t("contracts.pricingPlan", {
                  defaultValue: "Pricing Plan",
                })}: ${resolvedConfig.pricingPlanId}`
              : t("contracts.vendorPriceAutoMatched", {
                  defaultValue: "Price updates from matched pricing plans",
                })
            : t("contracts.vendorConfigAppearsAfterSelection", {
                defaultValue: "Sub-services and pricing appear after selection",
              }),
        ]}
        helperText={
          checked
            ? t("contracts.catalogVendorSelectedHint", {
                defaultValue:
                  "Configure vendor sub-services and override the price only if needed.",
              })
            : t("contracts.catalogVendorUnselectedHint", {
                defaultValue: "Select to configure this vendor for the contract.",
              })
        }
      />

      {checked ? (
        <ContractCatalogVendorConfigurator
          rowKey={vendorId}
          vendorId={vendorId}
          currentItem={currentItem}
          config={config}
          vendors={[vendor]}
          onConfigChange={onConfigChange}
          onResolvedValuesChange={onResolvedValuesChange}
          t={t}
        />
      ) : null}
    </div>
  );
}

function EditableContractItemsSection({
  t,
  fields,
  items,
  form,
  onRemove,
}: {
  t: (key: string, options?: Record<string, unknown>) => string;
  fields: Array<{ id: string }>;
  items: ContractItemFormData[];
  form: ReturnType<typeof useForm<ContractFormValues>>;
  onRemove: (index: number) => void;
}) {
  if (fields.length === 0) {
    return (
      <EmptyHint
        text={t("contracts.noManualItemsSelected", {
          defaultValue:
            "No contract rows have been selected yet. Use the checklist above to build the contract.",
        })}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className={sectionTitleClass}>
          {t("contracts.itemsTitle", {
            defaultValue: "Contract Items",
          })}
        </h2>
        <p className={sectionHintClass}>
          {t("contracts.manualItemsEditorHint", {
            defaultValue:
              "Selected checklist items become editable contract rows here. References stay linked while commercial details remain editable.",
          })}
        </p>
      </div>

      <div
        className="overflow-x-auto rounded-[4px] border"
        style={{ borderColor: "var(--lux-row-border)" }}
      >
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--lux-row-border)] text-[var(--lux-text-muted)]">
              <th className="px-3 py-3 text-start">
                {t("contracts.type", { defaultValue: "Type" })}
              </th>
              <th className="px-3 py-3 text-start">
                {t("contracts.itemName", { defaultValue: "Item Name" })}
              </th>
              <th className="px-3 py-3 text-start">
                {t("contracts.category", { defaultValue: "Category" })}
              </th>
              <th className="px-3 py-3 text-start">
                {t("contracts.quantity", { defaultValue: "Quantity" })}
              </th>
              <th className="px-3 py-3 text-start">
                {t("contracts.unitPrice", { defaultValue: "Unit Price" })}
              </th>
              <th className="px-3 py-3 text-start">
                {t("contracts.totalPrice", { defaultValue: "Total Price" })}
              </th>
              <th className="px-3 py-3 text-start">
                {t("common.notes", { defaultValue: "Notes" })}
              </th>
              <th className="px-3 py-3 text-start">
                {t("common.actions", { defaultValue: "Actions" })}
              </th>
            </tr>
          </thead>
          <tbody>
            {fields.map((field, index) => {
              const itemValues = items[index];
              const isVendorItem = itemValues?.itemType === "vendor";
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
                    background: isVendorItem
                      ? "var(--lux-control-hover)"
                      : "var(--lux-panel-surface)",
                  }}
                >
                  <td className="min-w-[120px] px-3 py-3">
                    <TypeBadge item={itemValues} t={t} />
                  </td>
                  <td className="min-w-[260px] px-3 py-3">
                    <Input
                      {...itemNameField}
                      placeholder={t("contracts.itemNamePlaceholder", {
                        defaultValue: "Enter item name",
                      })}
                    />
                    <div className="mt-2 text-xs text-[var(--lux-text-secondary)]">
                      {getContractItemOriginLabel(itemValues as any) || "-"}
                    </div>
                    <div className="mt-1 text-xs text-[var(--lux-text-secondary)]">
                      {itemValues?.eventServiceId
                        ? `${t("contracts.linkedEventService", {
                            defaultValue: "Event Service",
                          })}: #${itemValues.eventServiceId}`
                        : itemValues?.serviceId
                          ? `${t("contracts.linkedService", {
                              defaultValue: "Catalog Service",
                            })}: #${itemValues.serviceId}`
                          : itemValues?.eventVendorId
                            ? `${t("contracts.linkedEventVendor", {
                                defaultValue: "Event Vendor",
                              })}: #${itemValues.eventVendorId}`
                            : itemValues?.vendorId
                              ? `${t("contracts.linkedVendor", {
                                  defaultValue: "Catalog Vendor",
                                })}: #${itemValues.vendorId}`
                              : "-"}
                      {itemValues?.pricingPlanId
                        ? ` • ${t("contracts.pricingPlan", {
                            defaultValue: "Pricing Plan",
                          })}: #${itemValues.pricingPlanId}`
                        : ""}
                    </div>
                  </td>
                  <td className="min-w-[180px] px-3 py-3">
                    <Input
                      {...categoryField}
                      placeholder={t("contracts.categoryPlaceholder", {
                        defaultValue: "Enter item category",
                      })}
                    />
                  </td>
                  <td className="min-w-[120px] px-3 py-3">
                    <Input
                      type="number"
                      min="0.001"
                      step="0.001"
                      {...quantityField}
                    />
                  </td>
                  <td className="min-w-[150px] px-3 py-3">
                    <Input
                      type="number"
                      min="0"
                      step="0.001"
                      {...unitPriceField}
                    />
                  </td>
                  <td className="min-w-[150px] px-3 py-3">
                    <Input
                      type="number"
                      min="0"
                      step="0.001"
                      {...totalPriceField}
                    />
                  </td>
                  <td className="min-w-[260px] px-3 py-3">
                    <textarea
                      {...notesField}
                      className={textareaClassName}
                      placeholder={t("contracts.itemNotesPlaceholder", {
                        defaultValue:
                          "Add scope notes, commercial remarks, or delivery details...",
                      })}
                      style={{
                        background: "var(--lux-control-surface)",
                        borderColor: "var(--lux-control-border)",
                        minHeight: "100px",
                      }}
                    />
                  </td>
                  <td className="w-[90px] px-3 py-3">
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => onRemove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                      {t("contracts.removeItem", {
                        defaultValue: "Remove",
                      })}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ContractCatalogVendorConfigurator({
  rowKey,
  vendorId,
  currentItem,
  config,
  vendors,
  onConfigChange,
  onResolvedValuesChange,
  t,
}: {
  rowKey: string;
  vendorId: string;
  currentItem?: Partial<ContractItemFormData>;
  config?: SelectedCatalogVendorConfig;
  vendors: CatalogVendorLike[];
  onConfigChange: (
    rowKey: string,
    updater: (
      current: SelectedCatalogVendorConfig,
    ) => SelectedCatalogVendorConfig,
  ) => void;
  onResolvedValuesChange: (
    values: Partial<Omit<ContractItemFormData, "id">>,
  ) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  const selectedVendor = useMemo(
    () => vendors.find((vendor) => String(vendor.id) === vendorId),
    [vendorId, vendors],
  );
  const resolvedConfig =
    config ??
    (vendorId
      ? {
          vendorId,
          selectedSubServiceIds: [],
          pricingPlanId: currentItem?.pricingPlanId || "",
          calculatedPrice: currentItem?.unitPrice || "",
          agreedPrice: currentItem?.unitPrice || "",
          isPriceOverride: true,
        }
      : createDefaultCatalogVendorConfig(""));
  const { data: subServicesResponse, isLoading: subServicesLoading } =
    useVendorSubServices({
      currentPage: 1,
      itemsPerPage: 200,
      searchQuery: "",
      vendorId: vendorId ? Number(vendorId) : undefined,
      vendorType: selectedVendor?.type ?? "all",
      isActive: "all",
      enabled: Boolean(vendorId),
    });
  const { data: pricingPlansResponse, isLoading: pricingPlansLoading } =
    useVendorPricingPlans({
      currentPage: 1,
      itemsPerPage: 200,
      searchQuery: "",
      vendorId: vendorId ? Number(vendorId) : undefined,
      vendorType: selectedVendor?.type ?? "all",
      isActive: "all",
      enabled: Boolean(vendorId),
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
    if (!vendorId || resolvedConfig.isPriceOverride) {
      return;
    }

    const nextPricingPlanId = matchedPricingPlan
      ? String(matchedPricingPlan.id)
      : "";
    const nextCalculatedPrice = calculatedPrice;

    if (
      resolvedConfig.vendorId === vendorId &&
      resolvedConfig.pricingPlanId === nextPricingPlanId &&
      resolvedConfig.calculatedPrice === nextCalculatedPrice &&
      resolvedConfig.agreedPrice === nextCalculatedPrice
    ) {
      return;
    }

    onConfigChange(rowKey, (current) => ({
      ...current,
      vendorId,
      pricingPlanId: nextPricingPlanId,
      calculatedPrice: nextCalculatedPrice,
      agreedPrice: nextCalculatedPrice,
    }));
  }, [
    calculatedPrice,
    matchedPricingPlan,
    onConfigChange,
    resolvedConfig.agreedPrice,
    resolvedConfig.calculatedPrice,
    resolvedConfig.isPriceOverride,
    resolvedConfig.pricingPlanId,
    resolvedConfig.vendorId,
    rowKey,
    vendorId,
  ]);

  useEffect(() => {
    if (!selectedVendor) {
      return;
    }

    const nextPrice = resolvedConfig.isPriceOverride
      ? resolvedConfig.agreedPrice || resolvedConfig.calculatedPrice || "0"
      : resolvedConfig.calculatedPrice || "0";

    onResolvedValuesChange({
      itemType: "vendor",
      eventVendorId: "",
      vendorId: String(selectedVendor.id),
      pricingPlanId:
        resolvedConfig.pricingPlanId ||
        (matchedPricingPlan ? String(matchedPricingPlan.id) : ""),
      itemName: selectedVendor.name,
      category: selectedVendor.type ?? "vendor",
      quantity: "1",
      unitPrice: nextPrice,
      totalPrice: nextPrice,
    });
  }, [
    matchedPricingPlan,
    onResolvedValuesChange,
    resolvedConfig.agreedPrice,
    resolvedConfig.calculatedPrice,
    resolvedConfig.isPriceOverride,
    resolvedConfig.pricingPlanId,
    selectedVendor,
  ]);

  return (
    <div
      className="space-y-4 rounded-[4px] border p-4"
      style={{
        background: "var(--lux-panel-surface)",
        borderColor: "var(--lux-row-border)",
      }}
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr,1fr]">
        <div className="space-y-3">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-[var(--lux-heading)]">
              {t("contracts.vendorSubServices", {
                defaultValue: "Vendor Sub-Services",
              })}
            </h4>
            <p className="text-xs text-[var(--lux-text-secondary)]">
              {t("contracts.vendorSubServicesHint", {
                defaultValue:
                  "Select the vendor sub-services that should shape the contract pricing for this row.",
              })}
            </p>
          </div>

          {!vendorId ? (
            <EmptyInlineHint
              text={t("contracts.selectVendorFirstForSubServices", {
                defaultValue:
                  "Select a catalog vendor first to load sub-services.",
              })}
            />
          ) : subServicesLoading ? (
            <EmptyInlineHint
              text={t("contracts.loadingVendorSubServices", {
                defaultValue: "Loading vendor sub-services...",
              })}
            />
          ) : subServices.length ? (
            <div className="grid grid-cols-1 gap-2">
              {subServices.map((subService: VendorSubService) => {
                const checked = resolvedConfig.selectedSubServiceIds.includes(
                  subService.id,
                );

                return (
                  <label
                    key={subService.id}
                    className="flex items-start gap-3 rounded-[4px] border p-3"
                    style={{
                      background: checked
                        ? "var(--lux-control-hover)"
                        : "var(--lux-control-surface)",
                      borderColor: checked
                        ? "var(--lux-gold-border)"
                        : "var(--lux-row-border)",
                    }}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(value) =>
                        onConfigChange(rowKey, (current) => ({
                          ...current,
                          vendorId,
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
                          t("contracts.noDescription", {
                            defaultValue: "No description",
                          })}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          ) : (
            <EmptyInlineHint
              text={t("contracts.noVendorSubServicesConfigured", {
                defaultValue:
                  "No vendor sub-services are configured for this vendor yet.",
              })}
            />
          )}
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-[var(--lux-heading)]">
              {t("contracts.vendorPricingSummary", {
                defaultValue: "Pricing Summary",
              })}
            </h4>
            <p className="text-xs text-[var(--lux-text-secondary)]">
              {t("contracts.vendorPricingSummaryHint", {
                defaultValue:
                  "The matched pricing plan fills the row amount automatically until manual override is enabled.",
              })}
            </p>
          </div>

          <InfoMiniTile
            label={t("contracts.pricingPlan", {
              defaultValue: "Pricing Plan",
            })}
            value={
              !vendorId
                ? t("contracts.noVendorSelected", {
                    defaultValue: "No vendor selected",
                  })
                : pricingPlansLoading
                  ? t("common.loading", { defaultValue: "Loading..." })
                  : matchedPricingPlan?.name ||
                    (resolvedConfig.selectedSubServiceIds.length
                      ? t("contracts.noMatchingPricingPlan", {
                          defaultValue: "No matching pricing plan",
                        })
                      : t("contracts.noPricingPlanSelected", {
                          defaultValue: "No pricing plan selected",
                        }))
            }
          />

          <div className="grid grid-cols-2 gap-3">
            <InfoMiniTile
              label={t("contracts.selectedSubServicesCount", {
                defaultValue: "Selected Count",
              })}
              value={String(resolvedConfig.selectedSubServiceIds.length)}
            />
            <InfoMiniTile
              label={t("contracts.calculatedPrice", {
                defaultValue: "Calculated Price",
              })}
              value={
                resolvedConfig.calculatedPrice
                  ? formatVendorMoney(resolvedConfig.calculatedPrice)
                  : "-"
              }
            />
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
                onConfigChange(rowKey, (current) => {
                  const nextChecked = Boolean(value);

                  return {
                    ...current,
                    vendorId,
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
                {t("contracts.manualPriceOverride", {
                  defaultValue: "Manual Price Override",
                })}
              </p>
              <p className="text-xs text-[var(--lux-text-secondary)]">
                {t("contracts.manualPriceOverrideHint", {
                  defaultValue:
                    "Enable this only when the final contract amount differs from the matched pricing plan.",
                })}
              </p>
            </div>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-[var(--lux-text)]">
              {t("contracts.agreedPrice", {
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
                onConfigChange(rowKey, (current) => ({
                  ...current,
                  vendorId,
                  agreedPrice: event.target.value,
                }))
              }
              placeholder={t("contracts.agreedPricePlaceholder", {
                defaultValue: "Calculated automatically when available",
              })}
            />
            <p className="text-xs text-[var(--lux-text-secondary)]">
              {resolvedConfig.isPriceOverride
                ? t("contracts.manualPriceOverrideActiveHint", {
                    defaultValue:
                      "Manual override is active. The matched pricing plan stays linked for reference.",
                  })
                : t("contracts.agreedPriceAutoHint", {
                    defaultValue:
                      "The contract amount follows the matched pricing plan until manual override is enabled.",
                  })}
            </p>
          </label>
        </div>
      </div>
    </div>
  );
}

function ReadonlyInfo({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-[4px] border px-4 py-3"
      style={{
        background: "var(--lux-panel-surface)",
        borderColor: "var(--lux-row-border)",
      }}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
        {label}
      </p>
      <p className="mt-1 text-sm text-[var(--lux-text)]">{value || "-"}</p>
    </div>
  );
}

function InfoMiniTile({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-[4px] border px-4 py-3"
      style={{
        background: "var(--lux-control-surface)",
        borderColor: "var(--lux-row-border)",
      }}
    >
      <div className="text-xs text-[var(--lux-text-secondary)]">{label}</div>
      <div className="mt-1 text-sm font-medium text-[var(--lux-heading)]">
        {value}
      </div>
    </div>
  );
}

function EmptyInlineHint({ text }: { text: string }) {
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

function FieldInput({
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

function TypeBadge({
  item,
  t,
}: {
  item?:
    | Partial<ContractItemFormData>
    | { itemType?: ContractItemType; category?: string | null }
    | null;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  const type = item?.itemType ?? "service";
  const isVendor = type === "vendor";
  const isSummary = type === "service" && item?.category === "service_summary";

  return (
    <span
      className={cn(
        "inline-flex rounded-[4px] border px-3 py-1 text-xs font-semibold",
        isVendor || isSummary
          ? "border-[var(--lux-gold-border)] text-[var(--lux-gold)]"
          : "border-[var(--lux-row-border)] text-[var(--lux-text-secondary)]",
      )}
    >
      {isSummary
        ? t("contracts.totalServices", { defaultValue: "إجمالي الخدمات" })
        : t(`contracts.${type}`, {
            defaultValue: isVendor ? "شركة" : getContractItemTypeLabel(type),
          })}
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

export default ContractFormPage;
