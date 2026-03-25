import { useEffect, useMemo, type ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { FileText, Plus, Trash2 } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { PageContainer } from "@/components/layout/page-container";
import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { useQuotation, useQuotations } from "@/hooks/quotations/useQuotations";
import { useEventServiceItems, useServices } from "@/hooks/services/useServices";
import { useEventVendorLinks } from "@/hooks/vendors/useVendors";
import { cn } from "@/lib/utils";
import { getEventDisplayTitle } from "@/pages/events/adapters";
import { getQuotationDisplayNumber } from "@/pages/quotations/adapters";
import {
  formatVendorType,
  getEventVendorDisplayName,
} from "@/pages/vendors/adapters";

import {
  computeContractItemTotal,
  computeContractTotals,
  CONTRACT_STATUS_OPTIONS,
  formatContractItemCategory,
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
  "min-h-[130px] w-full rounded-[22px] border px-4 py-3 text-sm text-[var(--lux-text)] placeholder:text-[var(--lux-text-muted)] outline-none transition-all focus:border-[var(--lux-gold-border)] focus:ring-2 focus:ring-[var(--lux-gold-glow)]";
const sectionTitleClass = "text-lg font-semibold text-[var(--lux-heading)]";
const sectionHintClass = "text-sm text-[var(--lux-text-secondary)]";

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
      (value) => !value || (Number.isInteger(Number(value)) && Number(value) >= 0),
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
            .refine((value) => Number(value) > 0, "Quantity must be greater than zero"),
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
      if ((isEditMode || values.createMode === "manual") && !values.eventId?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["eventId"],
          message: "Event is required",
        });
      }

      if (!isEditMode && values.createMode === "from_quotation" && !values.quotationId?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["quotationId"],
          message: "Quotation is required",
        });
      }

      if ((isEditMode || values.createMode === "manual") && values.items.length === 0) {
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

          if (item.itemType === "vendor" && !item.eventVendorId?.trim()) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["items", index, "eventVendorId"],
              message: "Vendor rows must come from an event vendor",
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
    itemsPerPage: 200,
    searchQuery: "",
    eventId: "",
    status: "all",
    issueDateFrom: "",
    issueDateTo: "",
  });
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
      items: [createEmptyContractItem()],
      paymentSchedules: [],
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
  const events = useMemo(() => eventsResponse?.data ?? [], [eventsResponse?.data]);
  const services = useMemo(
    () => servicesResponse?.data ?? [],
    [servicesResponse?.data],
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
    () => selectedQuotation?.items ?? [],
    [selectedQuotation?.items],
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
        quotationItemId: item.quotationItemId ? String(item.quotationItemId) : "",
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
        quotationItemId: item.quotationItemId ? String(item.quotationItemId) : "",
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
      form.setValue("quotationId", preselectedQuotationId, { shouldDirty: false });
    }
  }, [form, isEditMode, preselectedEventId, preselectedQuotationId]);

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

  useEffect(() => {
    if (isEditMode || watchedCreateMode !== "manual" || itemFields.length > 0) {
      return;
    }

    appendItem(createEmptyContractItem());
  }, [appendItem, isEditMode, itemFields.length, watchedCreateMode]);

  const isBusy =
    contractLoading ||
    createMutation.isPending ||
    createFromQuotationMutation.isPending ||
    updateMutation.isPending;

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

  const handleItemTypeChange = (index: number, nextItemType: ContractItemType) => {
    const currentItem = form.getValues(`items.${index}`);

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

  const handleQuotationItemSelect = (index: number, nextQuotationItemId: string) => {
    const selectedItem = linkedQuotationItems.find(
      (item) => String(item.id) === nextQuotationItemId,
    );

    form.setValue(`items.${index}.quotationItemId`, nextQuotationItemId, {
      shouldDirty: true,
    });

    if (!selectedItem) {
      return;
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

  const handleEventServiceSelect = (index: number, nextEventServiceId: string) => {
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
      eventServiceId: nextServiceId ? "" : form.getValues(`items.${index}.eventServiceId`),
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

  const handleEventVendorSelect = (index: number, nextEventVendorId: string) => {
    const selectedEventVendor = availableEventVendors.find(
      (item) => String(item.id) === nextEventVendorId,
    );

    if (!selectedEventVendor) {
      updateItemValues(index, {
        itemType: "vendor",
        eventVendorId: nextEventVendorId,
        vendorId: "",
        pricingPlanId: "",
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

          <Card className="overflow-hidden rounded-[24px]">
            <div className="p-6 md:p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                            "rounded-[20px] border p-4 text-left transition-all",
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
                            "rounded-[20px] border p-4 text-left transition-all",
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
                            {t("contracts.quotation", { defaultValue: "Quotation" })}
                          </span>
                          <Select
                            value={form.watch("quotationId") || "none"}
                            onValueChange={(value) =>
                              form.setValue("quotationId", value === "none" ? "" : value, {
                                shouldDirty: true,
                              })
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
                                <SelectItem key={quotation.id} value={String(quotation.id)}>
                                  {getQuotationDisplayNumber(quotation)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {form.formState.errors.quotationId ? (
                            <p className="text-[0.8rem] font-medium text-[var(--lux-danger)]">
                              {String(form.formState.errors.quotationId.message)}
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
                              form.setValue("eventId", value === "none" ? "" : value, {
                                shouldDirty: true,
                              })
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
                                <SelectItem key={event.id} value={String(event.id)}>
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
                          placeholder={t("contracts.contractNumberPlaceholder", {
                            defaultValue: "Enter contract number",
                          })}
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
                        <>
                        </>
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
                              {String(form.formState.errors.discountAmount.message)}
                            </p>
                          ) : null}
                        </label>
                      ) : null}

                      <label className="space-y-2">
                        <span className="text-sm font-medium text-[var(--lux-text)]">
                          {t("contracts.statusLabel", { defaultValue: "Status" })}
                        </span>
                        <Select
                          value={form.watch("status")}
                          onValueChange={(value) =>
                            form.setValue("status", value as ContractStatus, {
                              shouldDirty: true,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CONTRACT_STATUS_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {t(`contracts.status.${option.value}`, {
                                  defaultValue: option.label,
                                })}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </label>
                    </div>

                    {selectedQuotation && !isEditMode && watchedCreateMode === "from_quotation" ? (
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

                  {isEditMode || watchedCreateMode === "manual" ? (
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

                          {!isEditMode ? (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() =>
                                appendItem(createEmptyContractItem(itemFields.length))
                              }
                            >
                              <Plus className="h-4 w-4" />
                              {t("contracts.addItem", {
                                defaultValue: "Add Item",
                              })}
                            </Button>
                          ) : null}
                        </div>
                      </div>

                      <div className="space-y-4">
                        {itemFields.map((field, index) => {
                          const itemValues = watchedItems?.[index];
                          const itemType = itemValues?.itemType ?? "service";
                          const isVendorItem = itemType === "vendor";
                          const itemTotal =
                            computeContractItemTotal(
                              itemValues?.quantity,
                              itemValues?.unitPrice,
                            ) ?? 0;

                          return (
                            <div
                              key={field.id}
                              className="rounded-[22px] border p-4"
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
                                      <TypeBadge type={itemType} t={t} />
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

                                  {!isEditMode ? (
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      onClick={() => removeItem(index)}
                                      disabled={itemFields.length === 1}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      {t("contracts.removeItem", {
                                        defaultValue: "Remove",
                                      })}
                                    </Button>
                                  ) : null}
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                                  <label className="space-y-2">
                                    <span className="text-sm font-medium text-[var(--lux-text)]">
                                      {t("contracts.type", { defaultValue: "Type" })}
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
                                      value={form.watch(`items.${index}.quotationItemId`) || "none"}
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
                                          placeholder={t("contracts.selectQuotationItem", {
                                            defaultValue: "Select quotation item",
                                          })}
                                        />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="none">
                                          {t("contracts.noQuotationItemSelected", {
                                            defaultValue: "No quotation item selected",
                                          })}
                                        </SelectItem>
                                        {linkedQuotationItems.map((item) => (
                                          <SelectItem key={item.id} value={String(item.id)}>
                                            {getContractItemDisplayName(item as any)}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </label>

                                  {isVendorItem ? (
                                    <FieldInput
                                      label={t("contracts.linkedEventVendor", {
                                        defaultValue: "Event Vendor",
                                      })}
                                      error={
                                        form.formState.errors.items?.[index]?.eventVendorId?.message
                                      }
                                    >
                                      <Select
                                        value={form.watch(`items.${index}.eventVendorId`) || "none"}
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
                                            placeholder={t("contracts.selectEventVendor", {
                                              defaultValue: "Select event vendor",
                                            })}
                                          />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="none">
                                            {t("contracts.noEventVendorSelected", {
                                              defaultValue: "No event vendor selected",
                                            })}
                                          </SelectItem>
                                          {availableEventVendors.map((item) => (
                                            <SelectItem key={item.id} value={String(item.id)}>
                                              {`${getEventVendorDisplayName(item)} • ${t(
                                                `vendors.type.${item.vendorType}`,
                                                {
                                                  defaultValue: formatVendorType(item.vendorType),
                                                },
                                              )} • ${formatMoney(item.agreedPrice ?? 0)}`}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </FieldInput>
                                  ) : (
                                    <label className="space-y-2">
                                      <span className="text-sm font-medium text-[var(--lux-text)]">
                                        {t("contracts.linkedEventService", {
                                          defaultValue: "Event Service",
                                        })}
                                      </span>
                                      <Select
                                        value={form.watch(`items.${index}.eventServiceId`) || "none"}
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
                                            placeholder={t("contracts.selectEventService", {
                                              defaultValue: "Select event service",
                                            })}
                                          />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="none">
                                            {t("contracts.noEventServiceSelected", {
                                              defaultValue: "No event service selected",
                                            })}
                                          </SelectItem>
                                          {availableEventServices.map((item) => (
                                            <SelectItem key={item.id} value={String(item.id)}>
                                              {item.serviceNameSnapshot}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </label>
                                  )}

                                  {isVendorItem ? (
                                    <div
                                      className="rounded-[18px] border px-4 py-3 text-sm text-[var(--lux-text-secondary)]"
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
                                        {itemValues?.pricingPlanId
                                          ? `${t("contracts.pricingPlan", {
                                              defaultValue: "Pricing Plan",
                                            })}: #${itemValues.pricingPlanId}`
                                          : t("contracts.vendorAgreedPriceHint", {
                                              defaultValue:
                                                "Vendor rows use the event vendor agreed price as the default contract amount.",
                                            })}
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
                                        value={form.watch(`items.${index}.serviceId`) || "none"}
                                        onValueChange={(value) =>
                                          handleServiceSelect(
                                            index,
                                            value === "none" ? "" : value,
                                          )
                                        }
                                      >
                                        <SelectTrigger>
                                          <SelectValue
                                            placeholder={t("contracts.selectService", {
                                              defaultValue: "Select service",
                                            })}
                                          />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="none">
                                            {t("contracts.noServiceSelected", {
                                              defaultValue: "No service selected",
                                            })}
                                          </SelectItem>
                                          {services.map((service) => (
                                            <SelectItem key={service.id} value={String(service.id)}>
                                              {service.name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </label>
                                  )}
                                </div>

                                <div
                                  className="rounded-[18px] border px-4 py-3 text-sm text-[var(--lux-text-secondary)]"
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
                                          defaultValue: "Manual service pricing",
                                        })}
                                  </p>
                                  <p className="mt-1">
                                    {isVendorItem
                                      ? getContractItemOriginLabel(itemValues as any) || "-"
                                      : t("contracts.serviceManualPricingHint", {
                                          defaultValue:
                                            "Service selection only fills description and references. Enter the contract amount manually in this row.",
                                        })}
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
                                    error={form.formState.errors.items?.[index]?.itemName?.message}
                                  >
                                    <Input
                                      {...form.register(`items.${index}.itemName`)}
                                      placeholder={t("contracts.itemNamePlaceholder", {
                                        defaultValue: "Enter item name",
                                      })}
                                    />
                                  </FieldInput>

                                  <FieldInput
                                    label={t("contracts.category", {
                                      defaultValue: "Category",
                                    })}
                                  >
                                    <Input
                                      {...form.register(`items.${index}.category`)}
                                      placeholder={t("contracts.categoryPlaceholder", {
                                        defaultValue: "Enter item category",
                                      })}
                                    />
                                  </FieldInput>

                                  <FieldInput
                                    label={t("contracts.sortOrder", {
                                      defaultValue: "Sort Order",
                                    })}
                                    error={form.formState.errors.items?.[index]?.sortOrder?.message}
                                  >
                                    <Input
                                      type="number"
                                      min="0"
                                      {...form.register(`items.${index}.sortOrder`)}
                                    />
                                  </FieldInput>

                                  <FieldInput
                                    label={t("contracts.quantity", {
                                      defaultValue: "Quantity",
                                    })}
                                    error={form.formState.errors.items?.[index]?.quantity?.message}
                                  >
                                    <Input
                                      type="number"
                                      min="0.001"
                                      step="0.001"
                                      {...form.register(`items.${index}.quantity`)}
                                    />
                                  </FieldInput>

                                  <FieldInput
                                    label={t("contracts.unitPrice", {
                                      defaultValue: "Unit Price",
                                    })}
                                    error={form.formState.errors.items?.[index]?.unitPrice?.message}
                                  >
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.001"
                                      {...form.register(`items.${index}.unitPrice`)}
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
                                    {t("common.notes", { defaultValue: "Notes" })}
                                  </span>
                                  <textarea
                                    {...form.register(`items.${index}.notes`)}
                                    className={textareaClassName}
                                    placeholder={t("contracts.itemNotesPlaceholder", {
                                      defaultValue:
                                        "Add item notes, scope details, or commercial remarks...",
                                    })}
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
                          className="rounded-[20px] border px-4 py-3 text-sm text-[var(--lux-text-secondary)]"
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

                          <div className="rounded-[22px] border p-4">
                            <div className="overflow-x-auto">
                              <table className="min-w-full text-sm">
                                <thead>
                                  <tr className="border-b border-[var(--lux-row-border)] text-[var(--lux-text-muted)]">
                                    <th className="px-3 py-3 text-start">#</th>
                                    <th className="px-3 py-3 text-start">
                                      {t("contracts.type", {
                                        defaultValue: "Type",
                                      })}
                                    </th>
                                    <th className="px-3 py-3 text-start">
                                      {t("contracts.itemName", {
                                        defaultValue: "Item",
                                      })}
                                    </th>
                                    <th className="px-3 py-3 text-start">
                                      {t("contracts.category", {
                                        defaultValue: "Category",
                                      })}
                                    </th>
                                    <th className="px-3 py-3 text-start">
                                      {t("contracts.quantity", {
                                        defaultValue: "Quantity",
                                      })}
                                    </th>
                                    <th className="px-3 py-3 text-start">
                                      {t("contracts.totalPrice", {
                                        defaultValue: "Total Price",
                                      })}
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(selectedQuotation.items ?? []).map((item, index) => (
                                    <tr
                                      key={item.id}
                                      className="border-b border-[var(--lux-row-border)] last:border-b-0"
                                    >
                                      <td className="px-3 py-3">{index + 1}</td>
                                      <td className="px-3 py-3">
                                        <TypeBadge
                                          type={(item.itemType ?? "service") as ContractItemType}
                                          t={t}
                                        />
                                      </td>
                                      <td className="px-3 py-3">
                                        <div className="font-medium text-[var(--lux-text)]">
                                          {getContractItemDisplayName(item as any)}
                                        </div>
                                        <div className="mt-1 text-xs text-[var(--lux-text-secondary)]">
                                          {item.itemType === "vendor"
                                            ? `${t("contracts.vendorOrigin", {
                                                defaultValue: "Vendor-origin row",
                                              })}: ${getContractItemOriginLabel(item as any)}`
                                            : `${t("contracts.serviceOrigin", {
                                                defaultValue: "Service-origin row",
                                              })}: ${getContractItemOriginLabel(item as any)}`}
                                        </div>
                                      </td>
                                      <td className="px-3 py-3">
                                        {formatContractItemCategory(item.category)}
                                      </td>
                                      <td className="px-3 py-3">{item.quantity}</td>
                                      <td className="px-3 py-3">
                                        {formatMoney(item.totalPrice)}
                                      </td>
                                    </tr>
                                  ))}
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
                                createEmptyPaymentSchedule(paymentScheduleFields.length),
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
                              className="rounded-[22px] border p-4"
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
                                      form.formState.errors.paymentSchedules?.[index]
                                        ?.installmentName?.message
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
                                        {PAYMENT_SCHEDULE_TYPE_OPTIONS.map((option) => (
                                          <SelectItem
                                            key={option.value}
                                            value={option.value}
                                          >
                                            {t(`contracts.scheduleType.${option.value}`, {
                                              defaultValue: option.label,
                                            })}
                                          </SelectItem>
                                        ))}
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
                                      {...form.register(`paymentSchedules.${index}.dueDate`)}
                                    />
                                  </FieldInput>

                                  <FieldInput
                                    label={t("contracts.amount", {
                                      defaultValue: "Amount",
                                    })}
                                    error={
                                      form.formState.errors.paymentSchedules?.[index]?.amount
                                        ?.message
                                    }
                                  >
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.001"
                                      {...form.register(`paymentSchedules.${index}.amount`)}
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
                                        {PAYMENT_SCHEDULE_STATUS_OPTIONS.map((option) => (
                                          <SelectItem
                                            key={option.value}
                                            value={option.value}
                                          >
                                            {t(`contracts.paymentStatus.${option.value}`, {
                                              defaultValue: option.label,
                                            })}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </label>

                                  <FieldInput
                                    label={t("contracts.sortOrder", {
                                      defaultValue: "Sort Order",
                                    })}
                                    error={
                                      form.formState.errors.paymentSchedules?.[index]
                                        ?.sortOrder?.message
                                    }
                                  >
                                    <Input
                                      type="number"
                                      min="0"
                                      {...form.register(`paymentSchedules.${index}.sortOrder`)}
                                    />
                                  </FieldInput>
                                </div>

                                <label className="space-y-2">
                                  <span className="text-sm font-medium text-[var(--lux-text)]">
                                    {t("common.notes", { defaultValue: "Notes" })}
                                  </span>
                                  <textarea
                                    {...form.register(`paymentSchedules.${index}.notes`)}
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
                    <Button type="submit" disabled={isBusy}>
                      {isBusy
                        ? t("common.processing", {
                            defaultValue: "Processing...",
                          })
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

function ReadonlyInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      className="rounded-[20px] border px-4 py-3"
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

function TypeBadge({
  type,
  t,
}: {
  type: ContractItemType;
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
      {t(`contracts.${type}`, {
        defaultValue: getContractItemTypeLabel(type),
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

export default ContractFormPage;
