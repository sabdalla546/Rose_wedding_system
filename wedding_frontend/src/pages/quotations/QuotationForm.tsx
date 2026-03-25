import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch, type FieldErrors } from "react-hook-form";
import { z } from "zod";
import { FileText, Plus, Trash2 } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { PageContainer } from "@/components/layout/page-container";
import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
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
import {
  useCreateQuotation,
  useCreateQuotationFromEvent,
  useUpdateQuotation,
} from "@/hooks/quotations/useQuotationMutations";
import { useQuotation } from "@/hooks/quotations/useQuotations";
import { useEventServiceItems, useServices } from "@/hooks/services/useServices";
import { useToast } from "@/hooks/use-toast";
import { useEventVendorLinks } from "@/hooks/vendors/useVendors";
import { cn } from "@/lib/utils";
import { getEventDisplayTitle } from "@/pages/events/adapters";
import {
  formatMoney as formatVendorMoney,
  formatVendorType,
  getEventVendorDisplayName,
  toNumberValue as toVendorNumberValue,
} from "@/pages/vendors/adapters";
import type { EventServiceItem, Service } from "@/pages/services/types";
import type { EventVendorLink } from "@/pages/vendors/types";

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
  "min-h-[110px] w-full rounded-[22px] border px-4 py-3 text-sm text-[var(--lux-text)] outline-none transition-all focus:border-[var(--lux-gold-border)] focus:ring-2 focus:ring-[var(--lux-gold-glow)]";
const sectionTitleClass = "text-lg font-semibold text-[var(--lux-heading)]";
const sectionHintClass = "text-sm text-[var(--lux-text-secondary)]";

type CreateMode = "manual" | "from_event";
const MANUAL_SERVICES_SUMMARY_CATEGORY = "service_summary";
const MANUAL_SERVICES_SUMMARY_NAME = "Total Services";

const getFirstErrorMessage = (value: unknown): string | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  if ("message" in value && typeof value.message === "string" && value.message.trim()) {
    return value.message;
  }

  const nestedValues = Array.isArray(value)
    ? value
    : Object.values(value as Record<string, unknown>);

  for (const nestedValue of nestedValues) {
    const message = getFirstErrorMessage(nestedValue);

    if (message) {
      return message;
    }
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
            .refine((value) => Number(value) > 0, "Quantity must be greater than zero"),
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

      if (
        !isEditMode &&
        values.createMode === "manual" &&
        values.items.length === 0 &&
        (Number(values.manualServicesTotal || 0) <= 0)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["items"],
          message: "Add a vendor row or enter a total services amount",
        });
      }

      values.items.forEach((item, index) => {
        if (!item.itemName.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["items", index, "itemName"],
            message: "Item name is required",
          });
        }

        if (!isEditMode && item.itemType === "service" && !item.eventServiceId && !item.serviceId) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["items", index, "serviceId"],
            message: "Service rows must come from a service or event service",
          });
        }

        if (item.itemType === "vendor" && !item.eventVendorId) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["items", index, "eventVendorId"],
            message: "Vendor rows must come from an event vendor",
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

const getEventVendorDisabledReason = (item: EventVendorLink) => {
  if (item.status === "cancelled") {
    return "cancelled";
  }

  if (toVendorNumberValue(item.agreedPrice) === null) {
    return "missing_price";
  }

  return null;
};

const getManualServicesTotalValue = (value?: string) =>
  Number(Math.max(0, toVendorNumberValue(value) ?? 0).toFixed(3));

const buildManualServicesSummaryItem = (
  manualServicesTotal?: string,
  sortOrder = 0,
): QuotationItemFormData => {
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
};

const isManualServicesSummaryItem = (item: Partial<QuotationItemFormData>) =>
  item.itemType === "service" && item.category === MANUAL_SERVICES_SUMMARY_CATEGORY;

const buildManualModePayloadItems = (
  items: QuotationItemFormData[],
  manualServicesTotal?: string,
) => {
  const summaryAmount = getManualServicesTotalValue(manualServicesTotal);
  const vendorItems = items.filter((item) => item.itemType === "vendor");
  const serviceReferenceItems = items
    .filter(
      (item) => item.itemType === "service" && !isManualServicesSummaryItem(item),
    )
    .map((item) => ({
      ...item,
      unitPrice: "0",
      totalPrice: "0",
      isTotalManual: false,
    }));

  const combinedItems = [
    ...(summaryAmount > 0 ? [buildManualServicesSummaryItem(manualServicesTotal, 0)] : []),
    ...serviceReferenceItems,
    ...vendorItems,
  ];

  return combinedItems.map((item, index) => ({
    ...item,
    sortOrder: String(index),
    totalPrice:
      item.itemType === "vendor"
        ? item.totalPrice?.trim()
          || String(computeQuotationItemTotal(item.quantity, item.unitPrice))
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

  const [selectedEventServiceSourceId, setSelectedEventServiceSourceId] = useState("");
  const [selectedCatalogServiceId, setSelectedCatalogServiceId] = useState("");
  const [selectedEventVendorSourceId, setSelectedEventVendorSourceId] = useState("");

  const { data: quotation, isLoading: quotationLoading } = useQuotation(id);
  const createMutation = useCreateQuotation();
  const createFromEventMutation = useCreateQuotationFromEvent();
  const updateMutation = useUpdateQuotation(id);
  const { data: eventsResponse } = useEvents({
    currentPage: 1,
    itemsPerPage: 200,
    searchQuery: "",
    status: "all",
    customerId: "",
    venueId: "",
    dateFrom: "",
    dateTo: "",
  });
  const { data: servicesResponse } = useServices({
    currentPage: 1,
    itemsPerPage: 200,
    searchQuery: "",
    category: "all",
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
    append: appendItem,
    remove: removeItem,
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
  const services = servicesResponse?.data ?? [];
  const eventServices = useMemo(
    () => (eventServicesResponse?.data ?? []).filter((item) => item.status !== "cancelled"),
    [eventServicesResponse?.data],
  );
  const eventVendors = useMemo(
    () => eventVendorsResponse?.data ?? [],
    [eventVendorsResponse?.data],
  );

  const selectedEventServices = useMemo(
    () =>
      eventServices.filter((item) => watchedEventServiceIds.includes(String(item.id))),
    [eventServices, watchedEventServiceIds],
  );
  const selectedEventVendors = useMemo(
    () =>
      eventVendors.filter((item) => watchedEventVendorIds.includes(String(item.id))),
    [eventVendors, watchedEventVendorIds],
  );

  const fromEventPreviewItems = useMemo(
    () => [
      ...(getManualServicesTotalValue(watchedManualServicesTotal) > 0
        ? [buildManualServicesSummaryItem(watchedManualServicesTotal, 0)]
        : []),
      ...selectedEventVendors
        .filter((item) => !getEventVendorDisabledReason(item))
        .map((item, index) =>
          buildVendorItemFromEventVendor(
            item,
            index + (getManualServicesTotalValue(watchedManualServicesTotal) > 0 ? 1 : 0),
          ),
        ),
    ],
    [selectedEventVendors, watchedManualServicesTotal],
  );

  const manualModePayloadItems = useMemo(
    () => buildManualModePayloadItems(watchedItems, watchedManualServicesTotal),
    [watchedItems, watchedManualServicesTotal],
  );

  const editorTotals = useMemo(
    () =>
      computeQuotationTotals({
        items:
          !isEditMode && watchedCreateMode === "manual"
            ? manualModePayloadItems
            : watchedItems,
        discountAmount: watchedDiscountAmount,
      }),
    [isEditMode, manualModePayloadItems, watchedCreateMode, watchedDiscountAmount, watchedItems],
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
    !isEditMode && watchedCreateMode === "from_event" ? fromEventTotals : editorTotals;

  const isBusy =
    quotationLoading ||
    createMutation.isPending ||
    createFromEventMutation.isPending ||
    updateMutation.isPending;

  useEffect(() => {
    if (!isEditMode && preselectedEventId) {
      form.setValue("eventId", preselectedEventId, { shouldDirty: false });
    }
  }, [form, isEditMode, preselectedEventId]);

  useEffect(() => {
    if (!isEditMode || !quotation) {
      return;
    }

    const mappedItems = (quotation.items ?? []).map((item) => {
      const quantity = String(item.quantity ?? 1);
      const unitPrice = String(item.unitPrice ?? 0);
      const totalPrice = String(item.totalPrice ?? 0);
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
        isTotalManual: totalPrice !== computedTotal,
      } satisfies QuotationItemFormData;
    });

    form.reset({
      createMode: "manual",
      eventId: String(quotation.eventId),
      quotationNumber: quotation.quotationNumber ?? "",
      issueDate: quotation.issueDate,
      validUntil: quotation.validUntil ?? "",
      discountAmount:
        quotation.discountAmount != null ? String(quotation.discountAmount) : "0",
      manualServicesTotal: String(
        (quotation.items ?? []).find((item) =>
          item.itemType === "service" &&
          item.category === MANUAL_SERVICES_SUMMARY_CATEGORY,
        )?.totalPrice ?? 0,
      ),
      notes: quotation.notes ?? "",
      status: quotation.status,
      eventServiceIds: [],
      eventVendorIds: [],
      items: mappedItems,
    });
    replaceItems(mappedItems);
  }, [form, isEditMode, quotation, replaceItems]);

  useEffect(() => {
    if (isEditMode) {
      return;
    }

    if (!watchedEventId) {
      previousEventIdRef.current = "";
      replaceItems([]);
      form.setValue("eventServiceIds", []);
      form.setValue("eventVendorIds", []);
      setSelectedEventServiceSourceId("");
      setSelectedCatalogServiceId("");
      setSelectedEventVendorSourceId("");
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
      setSelectedEventServiceSourceId("");
      setSelectedCatalogServiceId("");
      setSelectedEventVendorSourceId("");
    }

    previousEventIdRef.current = watchedEventId;
  }, [form, isEditMode, replaceItems, watchedEventId]);

  const syncComputedTotal = (
    index: number,
    nextQuantity: string,
    nextUnitPrice: string,
  ) => {
    if (form.getValues(`items.${index}.isTotalManual`)) {
      return;
    }

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
    syncComputedTotal(index, event.target.value, form.getValues(`items.${index}.unitPrice`));
  };

  const handleUnitPriceChange = (
    index: number,
    event: ChangeEvent<HTMLInputElement>,
    onChange: (...event: any[]) => void,
  ) => {
    onChange(event);
    syncComputedTotal(index, form.getValues(`items.${index}.quantity`), event.target.value);
  };

  const handleTotalPriceChange = (
    index: number,
    event: ChangeEvent<HTMLInputElement>,
    onChange: (...event: any[]) => void,
  ) => {
    onChange(event);
    const nextValue = event.target.value.trim();

    if (!nextValue) {
      form.setValue(`items.${index}.isTotalManual`, false, { shouldDirty: true });
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

  const appendManualItem = (item: QuotationItemFormData) => {
    appendItem({
      ...item,
      sortOrder: String(form.getValues("items").length),
    });
  };

  const handleAddEventServiceItem = () => {
    const selectedItem = eventServices.find(
      (item) => String(item.id) === selectedEventServiceSourceId,
    );

    if (!selectedItem) {
      return;
    }

    appendManualItem(
      buildServiceItemFromEventService(selectedItem, form.getValues("items").length),
    );
    setSelectedEventServiceSourceId("");
  };

  const handleAddCatalogServiceItem = () => {
    const selectedItem = services.find(
      (item) => String(item.id) === selectedCatalogServiceId,
    );

    if (!selectedItem) {
      return;
    }

    appendManualItem(
      buildServiceItemFromService(selectedItem, form.getValues("items").length),
    );
    setSelectedCatalogServiceId("");
  };

  const handleAddEventVendorItem = () => {
    const selectedItem = eventVendors.find(
      (item) => String(item.id) === selectedEventVendorSourceId,
    );

    if (!selectedItem || getEventVendorDisabledReason(selectedItem)) {
      return;
    }

    appendManualItem(
      buildVendorItemFromEventVendor(selectedItem, form.getValues("items").length),
    );
    setSelectedEventVendorSourceId("");
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
      const payload: QuotationUpdateFormData = {
        quotationNumber: values.quotationNumber,
        issueDate: values.issueDate,
        validUntil: values.validUntil,
        subtotal: String(editorTotals.subtotal),
        discountAmount: values.discountAmount,
        notes: values.notes,
        status: values.status,
        items: values.items.map((item, index) => ({
          ...item,
          sortOrder: String(index),
          totalPrice:
            item.totalPrice?.trim()
            || String(computeQuotationItemTotal(item.quantity, item.unitPrice)),
        })),
      };

      updateMutation.mutate(payload);
      return;
    }

    if (values.createMode === "from_event") {
      const payload: QuotationFromEventFormData = {
        eventId: values.eventId,
        quotationNumber: values.quotationNumber,
        issueDate: values.issueDate,
        validUntil: values.validUntil,
        subtotal: String(fromEventTotals.subtotal),
        discountAmount: values.discountAmount,
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
      description: getFirstErrorMessage(errors)
        ?? t("common.invalidForm", {
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
    <ProtectedComponent permission={isEditMode ? "quotations.update" : "quotations.create"}>
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
              ? t("quotations.backToQuotation", { defaultValue: "Back to Quotation" })
              : t("quotations.backToQuotations", { defaultValue: "Back to Quotations" })}
          </button>

          <div
            className="overflow-hidden rounded-[24px] border p-4 shadow-luxe"
            style={{
              background: "var(--lux-panel-surface)",
              borderColor: "var(--lux-panel-border)",
            }}
          >
            <div className="flex items-start gap-4">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-[18px] border"
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
                    ? t("quotations.editTitle", { defaultValue: "Edit Quotation" })
                    : t("quotations.createTitle", { defaultValue: "Create Quotation" })}
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

          <Card className="overflow-hidden rounded-[24px]">
            <div className="p-6 md:p-8">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(submit, handleInvalidSubmit)}
                  className="space-y-8"
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
                            "rounded-[22px] border p-5 text-start transition-all",
                            watchedCreateMode === "manual"
                              ? "border-[var(--lux-gold-border)] bg-[var(--lux-control-hover)]"
                              : "border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)]",
                          )}
                          onClick={() =>
                            form.setValue("createMode", "manual", { shouldDirty: true })
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
                                "Add service and vendor rows into one mixed quotation document.",
                            })}
                          </p>
                        </button>

                        <button
                          type="button"
                          className={cn(
                            "rounded-[22px] border p-5 text-start transition-all",
                            watchedCreateMode === "from_event"
                              ? "border-[var(--lux-gold-border)] bg-[var(--lux-control-hover)]"
                              : "border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)]",
                          )}
                          onClick={() =>
                            form.setValue("createMode", "from_event", { shouldDirty: true })
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
                          form.setValue("eventId", value === "none" ? "" : value, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
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

                    <FieldBlock
                      label={t("quotations.statusLabel", {
                        defaultValue: "Status",
                      })}
                    >
                      <Select
                        value={form.watch("status")}
                        onValueChange={(value) =>
                          form.setValue("status", value as QuotationStatus, {
                            shouldDirty: true,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {QUOTATION_STATUS_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {t(`quotations.status.${option.value}`, {
                                defaultValue: option.label,
                              })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FieldBlock>

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
                        placeholder={t("quotations.discount", {
                          defaultValue: "Discount",
                        })}
                        {...form.register("discountAmount")}
                      />
                    </FieldBlock>

                    {!isEditMode ? (
                      <div className="md:col-span-2 xl:col-span-3">
                        <FieldBlock
                          label={t("quotations.totalServicesAmount", {
                            defaultValue: "Total Services Amount",
                          })}
                          error={form.formState.errors.manualServicesTotal?.message}
                        >
                          <div className="space-y-2">
                            <Input
                              type="number"
                              min="0"
                              step="0.001"
                              placeholder={t("quotations.totalServicesAmount", {
                                defaultValue: "Total Services Amount",
                              })}
                              {...form.register("manualServicesTotal")}
                            />
                            <p className="text-xs text-[var(--lux-text-secondary)]">
                              {t("quotations.totalServicesAmountHint", {
                                defaultValue:
                                  "Service pricing is entered here as one overall amount. Vendor/company costs are added as separate rows.",
                              })}
                            </p>
                          </div>
                        </FieldBlock>
                      </div>
                    ) : null}
                  </section>

                  <FieldBlock label={t("common.notes", { defaultValue: "Notes" })}>
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
                          {t("quotations.mixedQuotationItems", {
                            defaultValue: "Mixed quotation items",
                          })}
                        </h2>
                        <p className={sectionHintClass}>
                          {t("quotations.mixedQuotationItemsHint", {
                            defaultValue:
                              "Choose service and vendor sources first, then review everything together in one quotation items table.",
                          })}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                        <SourceCard
                          title={t("quotations.companyServices", {
                            defaultValue: "Company Services",
                          })}
                          hint={t("quotations.companyServicesHint", {
                            defaultValue:
                              "Add rows from event services or the service catalog for scope/reference. Pricing comes from the Total Services Amount field.",
                            })}
                        >
                          {!watchedEventId ? (
                            <EmptyHint
                              text={t("quotations.selectEventBeforeServices", {
                                defaultValue:
                                  "Select an event first to load its service sources.",
                              })}
                            />
                          ) : (
                            <div className="space-y-3">
                              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                                <Select
                                  value={selectedEventServiceSourceId || "none"}
                                  onValueChange={(value) =>
                                    setSelectedEventServiceSourceId(
                                      value === "none" ? "" : value,
                                    )
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue
                                      placeholder={t("quotations.selectEventService", {
                                        defaultValue: "Select event service",
                                      })}
                                    />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">
                                      {t("quotations.selectEventService", {
                                        defaultValue: "Select event service",
                                      })}
                                    </SelectItem>
                                    {eventServices.map((item) => (
                                      <SelectItem key={item.id} value={String(item.id)}>
                                        {item.serviceNameSnapshot}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={handleAddEventServiceItem}
                                  disabled={!selectedEventServiceSourceId}
                                >
                                  <Plus className="h-4 w-4" />
                                  {t("quotations.addServiceItem", {
                                    defaultValue: "Add service item",
                                  })}
                                </Button>
                              </div>

                              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                                <Select
                                  value={selectedCatalogServiceId || "none"}
                                  onValueChange={(value) =>
                                    setSelectedCatalogServiceId(value === "none" ? "" : value)
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue
                                      placeholder={t("quotations.selectService", {
                                        defaultValue: "Select service",
                                      })}
                                    />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">
                                      {t("quotations.selectService", {
                                        defaultValue: "Select service",
                                      })}
                                    </SelectItem>
                                    {services.map((service) => (
                                      <SelectItem key={service.id} value={String(service.id)}>
                                        {service.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={handleAddCatalogServiceItem}
                                  disabled={!selectedCatalogServiceId}
                                >
                                  <Plus className="h-4 w-4" />
                                  {t("quotations.addServiceItem", {
                                    defaultValue: "Add service item",
                                  })}
                                </Button>
                              </div>
                            </div>
                          )}
                        </SourceCard>

                        <SourceCard
                          title={t("quotations.companyVendors", {
                            defaultValue: "Company Vendors",
                          })}
                          hint={t("quotations.companyVendorsHint", {
                            defaultValue:
                              "Vendor quotation rows come from event vendors and use agreed price as the default snapshot.",
                          })}
                        >
                          {!watchedEventId ? (
                            <EmptyHint
                              text={t("quotations.selectEventBeforeVendors", {
                                defaultValue:
                                  "Select an event first to load its event vendors.",
                              })}
                            />
                          ) : (
                            <div className="space-y-3">
                              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                                <Select
                                  value={selectedEventVendorSourceId || "none"}
                                  onValueChange={(value) =>
                                    setSelectedEventVendorSourceId(
                                      value === "none" ? "" : value,
                                    )
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue
                                      placeholder={t("quotations.selectEventVendor", {
                                        defaultValue: "Select event vendor",
                                      })}
                                    />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">
                                      {t("quotations.selectEventVendor", {
                                        defaultValue: "Select event vendor",
                                      })}
                                    </SelectItem>
                                    {eventVendors
                                      .filter((item) => !getEventVendorDisabledReason(item))
                                      .map((item) => (
                                        <SelectItem key={item.id} value={String(item.id)}>
                                          {`${getEventVendorDisplayName(item)} • ${formatVendorMoney(item.agreedPrice)}`}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={handleAddEventVendorItem}
                                  disabled={!selectedEventVendorSourceId}
                                >
                                  <Plus className="h-4 w-4" />
                                  {t("quotations.addVendorItem", {
                                    defaultValue: "Add vendor item",
                                  })}
                                </Button>
                              </div>

                              <p className="text-xs text-[var(--lux-text-secondary)]">
                                {t("quotations.snapshotOnlyHint", {
                                  defaultValue:
                                    "This changes the quotation snapshot only. It does not change the original vendor pricing on the event.",
                                })}
                              </p>
                            </div>
                          )}
                        </SourceCard>
                      </div>

                      <EditableItemsSection
                        t={t}
                        fields={itemFields}
                        items={watchedItems}
                        form={form}
                        isEditMode={false}
                        onRemove={removeItem}
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
                                defaultValue: "Select an event first to preview its service lines.",
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
                                const checked = watchedEventServiceIds.includes(String(item.id));
                                return (
                                  <SelectableCard
                                    key={item.id}
                                    checked={checked}
                                    onCheckedChange={(value) =>
                                      toggleEventService(String(item.id), value)
                                    }
                                    title={item.serviceNameSnapshot}
                                    subtitle={t(`services.category.${item.category}`, {
                                      defaultValue: formatQuotationItemCategory(item.category),
                                    })}
                                    meta={[
                                      `${t("quotations.quantity", {
                                        defaultValue: "Quantity",
                                      })}: ${item.quantity ?? 1}`,
                                      t("quotations.totalServicesAmountHintShort", {
                                        defaultValue:
                                          "Pricing handled by Total Services Amount",
                                      }),
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
                                const checked = watchedEventVendorIds.includes(String(item.id));
                                const disabledReason = getEventVendorDisabledReason(item);
                                return (
                                  <SelectableCard
                                    key={item.id}
                                    checked={checked}
                                    disabled={Boolean(disabledReason)}
                                    onCheckedChange={(value) =>
                                      toggleEventVendor(String(item.id), value)
                                    }
                                    title={getEventVendorDisplayName(item)}
                                    subtitle={t(`vendors.type.${item.vendorType}`, {
                                      defaultValue: formatVendorType(item.vendorType),
                                    })}
                                    meta={[
                                      `${t("quotations.agreedPrice", {
                                        defaultValue: "Agreed Price",
                                      })}: ${safeMoney(item.agreedPrice)}`,
                                      `${t("quotations.pricingPlan", {
                                        defaultValue: "Pricing Plan",
                                      })}: ${item.pricingPlan?.name || "-"}`,
                                      `${t("quotations.vendorType", {
                                        defaultValue: "Vendor Type",
                                      })}: ${t(`vendors.type.${item.vendorType}`, {
                                        defaultValue: formatVendorType(item.vendorType),
                                      })}`,
                                      `${t("quotations.selectedSubServicesCount", {
                                        defaultValue: "Selected Sub-Services",
                                      })}: ${item.selectedSubServicesCount ?? 0}`,
                                      `${t("quotations.itemStatus", {
                                        defaultValue: "Status",
                                      })}: ${item.status}`,
                                    ]}
                                    helperText={
                                      disabledReason === "cancelled"
                                        ? t("quotations.cannotSelectCancelledVendor", {
                                            defaultValue: "Cannot select cancelled vendor",
                                          })
                                        : disabledReason === "missing_price"
                                          ? t("quotations.vendorHasNoAgreedPrice", {
                                              defaultValue: "Vendor has no agreed price",
                                            })
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
                          {String(form.formState.errors.eventServiceIds.message)}
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
                        form={form}
                        isEditMode
                        onRemove={removeItem}
                        onQuantityChange={handleQuantityChange}
                        onUnitPriceChange={handleUnitPriceChange}
                        onTotalPriceChange={handleTotalPriceChange}
                      />
                    </section>
                  ) : null}

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <SummaryTile
                      label={t("quotations.subtotal", { defaultValue: "Subtotal" })}
                      value={formatMoney(totals.subtotal)}
                    />
                    <SummaryTile
                      label={t("quotations.discount", { defaultValue: "Discount" })}
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

                  <div
                    className="flex flex-col gap-3 border-t pt-6 sm:flex-row sm:justify-end"
                    style={{ borderColor: "var(--lux-row-border)" }}
                  >
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        navigate(isEditMode && id ? `/quotations/${id}` : "/quotations")
                      }
                      disabled={isBusy}
                    >
                      {t("common.cancel", { defaultValue: "Cancel" })}
                    </Button>
                    <Button type="submit" disabled={isBusy}>
                      {isBusy
                        ? t("common.processing", { defaultValue: "Processing..." })
                        : isEditMode
                          ? t("common.update", { defaultValue: "Update" })
                          : t("common.create", { defaultValue: "Create" })}
                    </Button>
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

function SourceCard({
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
      className="rounded-[22px] border p-5"
      style={{
        background: "var(--lux-panel-surface)",
        borderColor: "var(--lux-row-border)",
      }}
    >
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-[var(--lux-heading)]">{title}</h3>
        <p className="text-sm text-[var(--lux-text-secondary)]">{hint}</p>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

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
      className="rounded-[22px] border p-5"
      style={{
        background: "var(--lux-panel-surface)",
        borderColor: "var(--lux-row-border)",
      }}
    >
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-[var(--lux-heading)]">{title}</h3>
        <p className="text-sm text-[var(--lux-text-secondary)]">{hint}</p>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div
      className="rounded-[18px] border px-4 py-3 text-sm text-[var(--lux-text-secondary)]"
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
        "flex gap-4 rounded-[20px] border p-4",
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
          <div className="text-xs text-[var(--lux-text-secondary)]">{subtitle}</div>
        ) : null}
        <div className="grid grid-cols-1 gap-2 text-xs text-[var(--lux-text-secondary)] md:grid-cols-2">
          {meta.map((item) => (
            <div key={item}>{item}</div>
          ))}
        </div>
        {helperText ? (
          <div className="text-xs text-[var(--lux-text-secondary)]">{helperText}</div>
        ) : null}
      </div>
    </label>
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
        <span className="rounded-full border px-3 py-1 text-[var(--lux-text-secondary)]">
          {t("quotations.selectedServices", { defaultValue: "Selected Services" })}:{" "}
          {selectedServicesCount}
        </span>
        <span className="rounded-full border px-3 py-1 text-[var(--lux-text-secondary)]">
          {t("quotations.selectedVendors", { defaultValue: "Selected Vendors" })}:{" "}
          {selectedVendorsCount}
        </span>
        <span className="rounded-full border px-3 py-1 text-[var(--lux-text-secondary)]">
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
  if (fields.length === 0) {
    return (
      <EmptyHint
        text={t("quotations.noItems", {
          defaultValue: "No quotation items are linked to this quotation.",
        })}
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-[22px] border" style={{ borderColor: "var(--lux-row-border)" }}>
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--lux-row-border)] text-[var(--lux-text-muted)]">
            <th className="px-3 py-3 text-start">{t("quotations.type", { defaultValue: "Type" })}</th>
            <th className="px-3 py-3 text-start">{t("quotations.itemName", { defaultValue: "Item Name" })}</th>
            <th className="px-3 py-3 text-start">{t("quotations.category", { defaultValue: "Category" })}</th>
            <th className="px-3 py-3 text-start">{t("quotations.quantity", { defaultValue: "Quantity" })}</th>
            <th className="px-3 py-3 text-start">{t("quotations.unitPrice", { defaultValue: "Unit Price" })}</th>
            <th className="px-3 py-3 text-start">{t("quotations.totalPrice", { defaultValue: "Total Price" })}</th>
            <th className="px-3 py-3 text-start">{t("common.notes", { defaultValue: "Notes" })}</th>
            {!isEditMode ? (
              <th className="px-3 py-3 text-start">{t("common.actions", { defaultValue: "Actions" })}</th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {fields.map((field, index) => {
            const itemValues = items[index];
            const isCreateServiceReference = !isEditMode && itemValues?.itemType === "service";
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
                  <TypeBadge type={itemValues?.itemType ?? "service"} t={t} />
                </td>
                <td className="min-w-[220px] px-3 py-3">
                  <Input {...itemNameField} placeholder={t("quotations.itemName", { defaultValue: "Item Name" })} />
                  <div className="mt-2 text-xs text-[var(--lux-text-secondary)]">
                    {itemValues?.itemType === "vendor" ? (
                      <>
                        {itemValues.eventVendorId
                          ? `${t("quotations.linkedEventVendor", {
                              defaultValue: "Event Vendor",
                            })}: #${itemValues.eventVendorId}`
                          : null}
                        {itemValues.pricingPlanId
                          ? ` • ${t("quotations.pricingPlan", {
                              defaultValue: "Pricing Plan",
                            })}: #${itemValues.pricingPlanId}`
                          : null}
                        <div className="mt-1">
                          {t("quotations.snapshotOnlyHint", {
                            defaultValue:
                              "This changes the quotation snapshot only. It does not change the original vendor pricing on the event.",
                          })}
                        </div>
                      </>
                    ) : (
                      <>
                        {itemValues?.eventServiceId
                          ? `${t("quotations.linkedEventService", {
                              defaultValue: "Event Service",
                            })}: #${itemValues.eventServiceId}`
                          : null}
                        {itemValues?.serviceId
                          ? `${itemValues.eventServiceId ? " • " : ""}${t(
                              "quotations.linkedService",
                              { defaultValue: "Catalog Service" },
                            )}: #${itemValues.serviceId}`
                          : null}
                        {isCreateServiceReference ? (
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
                  <Input {...categoryField} placeholder={t("quotations.category", { defaultValue: "Category" })} />
                </td>
                <td className="min-w-[120px] px-3 py-3">
                  <Input
                    type="number"
                    min="0.001"
                    step="0.001"
                    {...quantityField}
                    onChange={(event) => onQuantityChange(index, event, quantityField.onChange)}
                  />
                </td>
                <td className="min-w-[140px] px-3 py-3">
                  <Input
                    type="number"
                    min="0"
                    step="0.001"
                    {...unitPriceField}
                    readOnly={isCreateServiceReference}
                    onChange={
                      isCreateServiceReference
                        ? undefined
                        : (event) =>
                            onUnitPriceChange(index, event, unitPriceField.onChange)
                    }
                  />
                </td>
                <td className="min-w-[140px] px-3 py-3">
                  <Input
                    type="number"
                    min="0"
                    step="0.001"
                    {...totalPriceField}
                    readOnly={isCreateServiceReference}
                    onChange={
                      isCreateServiceReference
                        ? undefined
                        : (event) =>
                            onTotalPriceChange(index, event, totalPriceField.onChange)
                    }
                  />
                </td>
                <td className="min-w-[220px] px-3 py-3">
                  <textarea
                    {...notesField}
                    className="min-h-[96px] w-full rounded-[18px] border px-3 py-2 text-sm text-[var(--lux-text)] outline-none transition-all focus:border-[var(--lux-gold-border)] focus:ring-2 focus:ring-[var(--lux-gold-glow)]"
                    style={{
                      background: "var(--lux-control-surface)",
                      borderColor: "var(--lux-control-border)",
                    }}
                    placeholder={t("common.notes", { defaultValue: "Notes" })}
                  />
                </td>
                {!isEditMode ? (
                  <td className="w-[80px] px-3 py-3">
                    <Button type="button" variant="outline" size="icon" onClick={() => onRemove(index)}>
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
    <div className="overflow-x-auto rounded-[22px] border" style={{ borderColor: "var(--lux-row-border)" }}>
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--lux-row-border)] text-[var(--lux-text-muted)]">
            <th className="px-3 py-3 text-start">{t("quotations.type", { defaultValue: "Type" })}</th>
            <th className="px-3 py-3 text-start">{t("quotations.itemName", { defaultValue: "Item Name" })}</th>
            <th className="px-3 py-3 text-start">{t("quotations.category", { defaultValue: "Category" })}</th>
            <th className="px-3 py-3 text-start">{t("quotations.quantity", { defaultValue: "Quantity" })}</th>
            <th className="px-3 py-3 text-start">{t("quotations.unitPrice", { defaultValue: "Unit Price" })}</th>
            <th className="px-3 py-3 text-start">{t("quotations.totalPrice", { defaultValue: "Total Price" })}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr
              key={`${item.itemType}-${index}-${item.eventServiceId || item.eventVendorId || item.serviceId || item.itemName}`}
              className="border-b border-[var(--lux-row-border)] last:border-b-0"
            >
              <td className="px-3 py-3">
                <TypeBadge type={item.itemType} t={t} />
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
              <td className="px-3 py-3 text-[var(--lux-text-secondary)]">{item.quantity}</td>
              <td className="px-3 py-3 text-[var(--lux-text-secondary)]">{safeMoney(item.unitPrice)}</td>
              <td className="px-3 py-3 text-[var(--lux-text-secondary)]">
                {safeMoney(
                  item.totalPrice || computeQuotationItemTotal(item.quantity, item.unitPrice),
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
  type,
  t,
}: {
  type: QuotationItemType;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  const isVendor = type === "vendor";

  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
        isVendor
          ? "border-[var(--lux-gold-border)] text-[var(--lux-gold)]"
          : "border-[var(--lux-row-border)] text-[var(--lux-text-secondary)]",
      )}
    >
      {isVendor
        ? t("quotations.vendor", { defaultValue: "Vendor" })
        : t("quotations.service", { defaultValue: "Service" })}
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
      className="rounded-[20px] border px-4 py-4"
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
      <span className="text-sm font-medium text-[var(--lux-text)]">{label}</span>
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
