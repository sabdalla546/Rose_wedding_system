import { useEffect, useMemo, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useEvents } from "@/hooks/events/useEvents";
import {
  useCreateQuotation,
  useCreateQuotationFromEvent,
  useUpdateQuotation,
} from "@/hooks/quotations/useQuotationMutations";
import { useQuotation } from "@/hooks/quotations/useQuotations";
import { useEventServiceItems, useServices } from "@/hooks/services/useServices";
import { cn } from "@/lib/utils";
import { getEventDisplayTitle } from "@/pages/events/adapters";

import {
  computeQuotationItemTotal,
  computeQuotationTotals,
  formatMoney,
  formatQuotationItemCategory,
  QUOTATION_STATUS_OPTIONS,
} from "./adapters";
import type {
  QuotationFormData,
  QuotationFromEventFormData,
  QuotationItemFormData,
  QuotationStatus,
  QuotationUpdateFormData,
} from "./types";

const textareaClassName =
  "min-h-[130px] w-full rounded-[22px] border px-4 py-3 text-sm text-[var(--lux-text)] placeholder:text-[var(--lux-text-muted)] outline-none transition-all focus:border-[var(--lux-gold-border)] focus:ring-2 focus:ring-[var(--lux-gold-glow)]";
const sectionTitleClass = "text-lg font-semibold text-[var(--lux-heading)]";
const sectionHintClass = "text-sm text-[var(--lux-text-secondary)]";

const createQuotationFormSchema = (isEditMode: boolean) =>
  z
    .object({
      createMode: z.enum(["manual", "from_event"]),
      eventId: z.string().min(1, "Event is required"),
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
      notes: z.string().optional(),
      status: z.enum(
        QUOTATION_STATUS_OPTIONS.map((option) => option.value) as [
          QuotationStatus,
          ...QuotationStatus[],
        ],
      ),
      items: z.array(
        z.object({
          id: z.number().optional(),
          eventServiceId: z.string().optional(),
          serviceId: z.string().optional(),
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
    })
    .superRefine((values, ctx) => {
      if ((isEditMode || values.createMode === "manual") && values.items.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["items"],
          message: "At least one quotation item is required",
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
        });
      }
    });

type QuotationFormValues = z.infer<ReturnType<typeof createQuotationFormSchema>>;

const createEmptyQuotationItem = (sortOrder = 0): QuotationItemFormData => ({
  eventServiceId: "",
  serviceId: "",
  itemName: "",
  category: "",
  quantity: "1",
  unitPrice: "0",
  totalPrice: "0",
  notes: "",
  sortOrder: String(sortOrder),
});

const QuotationFormPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEditMode = Boolean(id);
  const requestedMode =
    searchParams.get("mode") === "from-event" ? "from_event" : "manual";
  const preselectedEventId = searchParams.get("eventId") ?? "";

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
    pricingType: "all",
    isActive: "all",
  });

  const form = useForm<QuotationFormValues>({
    resolver: zodResolver(createQuotationFormSchema(isEditMode)) as any,
    defaultValues: {
      createMode: requestedMode,
      eventId: preselectedEventId,
      quotationNumber: "",
      issueDate: new Date().toISOString().slice(0, 10),
      validUntil: "",
      discountAmount: "0",
      notes: "",
      status: "draft",
      items: [createEmptyQuotationItem()],
    },
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });
  const watchedCreateMode = useWatch({
    control: form.control,
    name: "createMode",
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
  const [fromEventSelectionMode, setFromEventSelectionMode] = useState<
    "all" | "selected"
  >("all");
  const [selectedEventServiceIds, setSelectedEventServiceIds] = useState<string[]>([]);

  const selectedEventIdNumber = watchedEventId ? Number(watchedEventId) : 0;
  const { data: eventServicesResponse } = useEventServiceItems({
    currentPage: 1,
    itemsPerPage: 200,
    eventId: selectedEventIdNumber || undefined,
    category: "all",
    status: "all",
  });

  const events = useMemo(() => eventsResponse?.data ?? [], [eventsResponse?.data]);
  const services = useMemo(
    () => servicesResponse?.data ?? [],
    [servicesResponse?.data],
  );
  const availableEventServices = useMemo(
    () =>
      (eventServicesResponse?.data ?? []).filter(
        (item) => item.status !== "cancelled",
      ),
    [eventServicesResponse?.data],
  );
  const selectedCreateFromEventItems = useMemo(() => {
    if (fromEventSelectionMode === "all") {
      return availableEventServices;
    }

    return availableEventServices.filter((item) =>
      selectedEventServiceIds.includes(String(item.id)),
    );
  }, [availableEventServices, fromEventSelectionMode, selectedEventServiceIds]);
  const quotationTotals = useMemo(
    () =>
      computeQuotationTotals({
        items:
          watchedItems?.map((item) => ({
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice:
              item.totalPrice ||
              String(
                computeQuotationItemTotal(item.quantity, item.unitPrice) ?? 0,
              ),
          })) ?? [],
        discountAmount: watchedDiscountAmount,
      }),
    [watchedDiscountAmount, watchedItems],
  );
  const createFromEventTotals = useMemo(
    () =>
      computeQuotationTotals({
        items: selectedCreateFromEventItems.map((item) => ({
          totalPrice: item.totalPrice,
        })),
        discountAmount: watchedDiscountAmount,
      }),
    [selectedCreateFromEventItems, watchedDiscountAmount],
  );
  const canSubmitFromEvent =
    Boolean(watchedEventId) &&
    (fromEventSelectionMode === "all" ||
      selectedEventServiceIds.length > 0);

  useEffect(() => {
    if (!isEditMode || !quotation) {
      return;
    }

    form.reset({
      createMode: "manual",
      eventId: String(quotation.eventId),
      quotationNumber: quotation.quotationNumber ?? "",
      issueDate: quotation.issueDate,
      validUntil: quotation.validUntil ?? "",
      discountAmount:
        typeof quotation.discountAmount !== "undefined" &&
        quotation.discountAmount !== null
          ? String(quotation.discountAmount)
          : "0",
      notes: quotation.notes ?? "",
      status: quotation.status,
      items: (quotation.items ?? []).map((item) => ({
        id: item.id,
        eventServiceId: item.eventServiceId ? String(item.eventServiceId) : "",
        serviceId: item.serviceId ? String(item.serviceId) : "",
        itemName: item.itemName,
        category: item.category ?? "",
        quantity: String(item.quantity),
        unitPrice: String(item.unitPrice),
        totalPrice: String(item.totalPrice),
        notes: item.notes ?? "",
        sortOrder: String(item.sortOrder ?? 0),
      })),
    });
  }, [form, isEditMode, quotation]);

  useEffect(() => {
    if (!isEditMode && preselectedEventId) {
      form.setValue("eventId", preselectedEventId, {
        shouldDirty: false,
      });
    }
  }, [form, isEditMode, preselectedEventId]);

  useEffect(() => {
    if (!availableEventServices.length) {
      setSelectedEventServiceIds([]);
      return;
    }

    setSelectedEventServiceIds(
      availableEventServices.map((item) => String(item.id)),
    );
  }, [selectedEventIdNumber, availableEventServices]);

  const isBusy =
    quotationLoading ||
    createMutation.isPending ||
    createFromEventMutation.isPending ||
    updateMutation.isPending;

  const handleAppendItem = () => {
    append(createEmptyQuotationItem(fields.length));
  };

  const handleServiceSelect = (index: number, nextServiceId: string) => {
    const selectedService = services.find(
      (service) => String(service.id) === nextServiceId,
    );

    form.setValue(`items.${index}.serviceId`, nextServiceId, {
      shouldDirty: true,
    });

    if (!selectedService) {
      return;
    }

    form.setValue(`items.${index}.itemName`, selectedService.name, {
      shouldDirty: true,
    });
    form.setValue(`items.${index}.category`, selectedService.category, {
      shouldDirty: true,
    });
    form.setValue(
      `items.${index}.unitPrice`,
      selectedService.basePrice !== null &&
        typeof selectedService.basePrice !== "undefined"
        ? String(selectedService.basePrice)
        : form.getValues(`items.${index}.unitPrice`),
      {
        shouldDirty: true,
      },
    );
  };

  const handleEventServiceSelect = (index: number, nextEventServiceId: string) => {
    const selectedEventService = availableEventServices.find(
      (item) => String(item.id) === nextEventServiceId,
    );

    form.setValue(`items.${index}.eventServiceId`, nextEventServiceId, {
      shouldDirty: true,
    });

    if (!selectedEventService) {
      return;
    }

    form.setValue(
      `items.${index}.serviceId`,
      selectedEventService.serviceId ? String(selectedEventService.serviceId) : "",
      {
        shouldDirty: true,
      },
    );
    form.setValue(
      `items.${index}.itemName`,
      selectedEventService.serviceNameSnapshot ||
        selectedEventService.service?.name ||
        "",
      {
        shouldDirty: true,
      },
    );
    form.setValue(`items.${index}.category`, selectedEventService.category, {
      shouldDirty: true,
    });
    form.setValue(`items.${index}.quantity`, String(selectedEventService.quantity), {
      shouldDirty: true,
    });
    form.setValue(
      `items.${index}.unitPrice`,
      selectedEventService.unitPrice !== null &&
        typeof selectedEventService.unitPrice !== "undefined"
        ? String(selectedEventService.unitPrice)
        : "0",
      {
        shouldDirty: true,
      },
    );
  };

  const onSubmit = (values: QuotationFormValues) => {
    if (isEditMode) {
      const payload: QuotationUpdateFormData = {
        quotationNumber: values.quotationNumber,
        issueDate: values.issueDate,
        validUntil: values.validUntil,
        discountAmount: values.discountAmount,
        notes: values.notes,
        status: values.status,
        items: values.items.map((item) => ({
          ...item,
          totalPrice: String(
            computeQuotationItemTotal(item.quantity, item.unitPrice) ?? 0,
          ),
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
        discountAmount: values.discountAmount,
        notes: values.notes,
        eventServiceIds:
          fromEventSelectionMode === "selected"
            ? selectedEventServiceIds
            : undefined,
        status: values.status,
      };

      createFromEventMutation.mutate(payload);
      return;
    }

    const payload: QuotationFormData = {
      eventId: values.eventId,
      quotationNumber: values.quotationNumber,
      issueDate: values.issueDate,
      validUntil: values.validUntil,
      discountAmount: values.discountAmount,
      notes: values.notes,
      status: values.status,
      items: values.items.map((item) => ({
        ...item,
        totalPrice: String(
          computeQuotationItemTotal(item.quantity, item.unitPrice) ?? 0,
        ),
      })),
    };

    createMutation.mutate(payload);
  };

  if (quotationLoading) {
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
      permission={isEditMode ? "quotations.update" : "quotations.create"}
    >
      <PageContainer className="pb-4 pt-4 text-foreground">
        <div dir={i18n.dir()} className="mx-auto w-full max-w-6xl space-y-6">
          <button
            type="button"
            onClick={() => navigate(isEditMode && id ? `/quotations/${id}` : "/quotations")}
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
                          "Create a manual quotation or build one directly from event services.",
                      })}
                </p>
              </div>
            </div>
          </div>

          <Card className="overflow-hidden rounded-[24px]">
            <div className="p-6 md:p-8">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-8"
                >
                  {!isEditMode ? (
                    <section className="space-y-4">
                      <div
                        className="border-b pb-3"
                        style={{ borderColor: "var(--lux-row-border)" }}
                      >
                        <h2 className={sectionTitleClass}>
                          {t("quotations.createModeTitle", {
                            defaultValue: "Creation Mode",
                          })}
                        </h2>
                        <p className={sectionHintClass}>
                          {t("quotations.createModeHint", {
                            defaultValue:
                              "Choose whether to prepare the quotation manually or create it from event services.",
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
                            {t("quotations.manualMode", {
                              defaultValue: "Manual Quotation",
                            })}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-[var(--lux-text-secondary)]">
                            {t("quotations.manualModeHint", {
                              defaultValue:
                                "Build the quotation lines manually and control each item directly.",
                            })}
                          </p>
                        </button>

                        <button
                          type="button"
                          className={cn(
                            "rounded-[20px] border p-4 text-left transition-all",
                            watchedCreateMode === "from_event"
                              ? "border-[var(--lux-gold-border)] bg-[var(--lux-control-hover)]"
                              : "border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)]",
                          )}
                          onClick={() => form.setValue("createMode", "from_event")}
                        >
                          <p className="text-sm font-semibold text-[var(--lux-text)]">
                            {t("quotations.fromEventMode", {
                              defaultValue: "Create From Event Services",
                            })}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-[var(--lux-text-secondary)]">
                            {t("quotations.fromEventModeHint", {
                              defaultValue:
                                "Select an event and convert its service lines into a quotation.",
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
                        {t("quotations.headerInformation", {
                          defaultValue: "Quotation Header",
                        })}
                      </h2>
                      <p className={sectionHintClass}>
                        {t("quotations.headerInformationHint", {
                          defaultValue:
                            "Set the quotation reference details, linked event, and commercial dates.",
                        })}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-[var(--lux-text)]">
                          {t("quotations.event", { defaultValue: "Event" })}
                        </span>
                        <Select
                          value={form.watch("eventId") || "none"}
                          onValueChange={(value) =>
                            form.setValue("eventId", value === "none" ? "" : value, {
                              shouldDirty: true,
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
                            <SelectItem value="none">
                              {t("quotations.noEventSelected", {
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

                      <label className="space-y-2">
                        <span className="text-sm font-medium text-[var(--lux-text)]">
                          {t("quotations.quotationNumber", {
                            defaultValue: "Quotation Number",
                          })}
                        </span>
                        <Input
                          {...form.register("quotationNumber")}
                          placeholder={t("quotations.quotationNumberPlaceholder", {
                            defaultValue: "Enter quotation number",
                          })}
                        />
                      </label>

                      <label className="space-y-2">
                        <span className="text-sm font-medium text-[var(--lux-text)]">
                          {t("quotations.issueDate", { defaultValue: "Issue Date" })}
                        </span>
                        <Input type="date" {...form.register("issueDate")} />
                        {form.formState.errors.issueDate ? (
                          <p className="text-[0.8rem] font-medium text-[var(--lux-danger)]">
                            {String(form.formState.errors.issueDate.message)}
                          </p>
                        ) : null}
                      </label>

                      <label className="space-y-2">
                        <span className="text-sm font-medium text-[var(--lux-text)]">
                          {t("quotations.validUntil", {
                            defaultValue: "Valid Until",
                          })}
                        </span>
                        <Input type="date" {...form.register("validUntil")} />
                      </label>

                      <label className="space-y-2">
                        <span className="text-sm font-medium text-[var(--lux-text)]">
                          {t("quotations.discount", { defaultValue: "Discount" })}
                        </span>
                        <Input
                          type="number"
                          min="0"
                          step="0.001"
                          {...form.register("discountAmount")}
                          placeholder={t("quotations.discountPlaceholder", {
                            defaultValue: "Enter discount amount",
                          })}
                        />
                        {form.formState.errors.discountAmount ? (
                          <p className="text-[0.8rem] font-medium text-[var(--lux-danger)]">
                            {String(form.formState.errors.discountAmount.message)}
                          </p>
                        ) : null}
                      </label>

                      <label className="space-y-2">
                        <span className="text-sm font-medium text-[var(--lux-text)]">
                          {t("quotations.statusLabel", { defaultValue: "Status" })}
                        </span>
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
                      </label>
                    </div>

                    <label className="space-y-2">
                      <span className="text-sm font-medium text-[var(--lux-text)]">
                        {t("common.notes", { defaultValue: "Notes" })}
                      </span>
                      <textarea
                        {...form.register("notes")}
                        className={textareaClassName}
                        placeholder={t("quotations.notesPlaceholder", {
                          defaultValue:
                            "Add commercial notes, assumptions, or internal remarks...",
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
                              {t("quotations.itemsTitle", {
                                defaultValue: "Quotation Items",
                              })}
                            </h2>
                            <p className={sectionHintClass}>
                              {isEditMode
                                ? t("quotations.editItemsHint", {
                                    defaultValue:
                                      "Update the existing quotation items. Adding or deleting items will be connected in a later backend phase.",
                                  })
                                : t("quotations.itemsHint", {
                                    defaultValue:
                                      "Add the commercial lines that should appear on this quotation.",
                                  })}
                            </p>
                          </div>

                          {!isEditMode ? (
                            <Button type="button" variant="outline" onClick={handleAppendItem}>
                              <Plus className="h-4 w-4" />
                              {t("quotations.addItem", {
                                defaultValue: "Add Item",
                              })}
                            </Button>
                          ) : null}
                        </div>
                      </div>

                      <div className="space-y-4">
                        {fields.map((field, index) => {
                          const itemValues = watchedItems?.[index];
                          const itemTotal =
                            computeQuotationItemTotal(
                              itemValues?.quantity,
                              itemValues?.unitPrice,
                            ) ?? 0;

                          return (
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
                                  <div>
                                    <p className="text-sm font-semibold text-[var(--lux-heading)]">
                                      {t("quotations.itemLabel", {
                                        defaultValue: "Item",
                                      })}{" "}
                                      #{index + 1}
                                    </p>
                                    {isEditMode && itemValues?.id ? (
                                      <p className="text-xs text-[var(--lux-text-secondary)]">
                                        {t("quotations.itemReference", {
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
                                      onClick={() => remove(index)}
                                      disabled={fields.length === 1}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      {t("quotations.removeItem", {
                                        defaultValue: "Remove",
                                      })}
                                    </Button>
                                  ) : null}
                                </div>

                                {!isEditMode ? (
                                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <label className="space-y-2">
                                      <span className="text-sm font-medium text-[var(--lux-text)]">
                                        {t("quotations.linkedEventService", {
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
                                            placeholder={t("quotations.selectEventService", {
                                              defaultValue: "Select event service",
                                            })}
                                          />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="none">
                                            {t("quotations.noEventServiceSelected", {
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

                                    <label className="space-y-2">
                                      <span className="text-sm font-medium text-[var(--lux-text)]">
                                        {t("quotations.linkedService", {
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
                                            placeholder={t("quotations.selectService", {
                                              defaultValue: "Select service",
                                            })}
                                          />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="none">
                                            {t("quotations.noServiceSelected", {
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
                                  </div>
                                ) : itemValues?.serviceId || itemValues?.eventServiceId ? (
                                  <div
                                    className="rounded-[18px] border px-4 py-3 text-sm text-[var(--lux-text-secondary)]"
                                    style={{
                                      background: "var(--lux-panel-surface)",
                                      borderColor: "var(--lux-row-border)",
                                    }}
                                  >
                                    {itemValues.eventServiceId
                                      ? `${t("quotations.linkedEventService", {
                                          defaultValue: "Event Service",
                                        })}: ${itemValues.eventServiceId}`
                                      : null}
                                    {itemValues.eventServiceId && itemValues.serviceId ? " • " : ""}
                                    {itemValues.serviceId
                                      ? `${t("quotations.linkedService", {
                                          defaultValue: "Catalog Service",
                                        })}: ${itemValues.serviceId}`
                                      : null}
                                  </div>
                                ) : null}

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                                  <label className="space-y-2">
                                    <span className="text-sm font-medium text-[var(--lux-text)]">
                                      {t("quotations.itemName", {
                                        defaultValue: "Item Name",
                                      })}
                                    </span>
                                    <Input
                                      {...form.register(`items.${index}.itemName`)}
                                      placeholder={t("quotations.itemNamePlaceholder", {
                                        defaultValue: "Enter item name",
                                      })}
                                    />
                                    {form.formState.errors.items?.[index]?.itemName ? (
                                      <p className="text-[0.8rem] font-medium text-[var(--lux-danger)]">
                                        {String(
                                          form.formState.errors.items[index]?.itemName
                                            ?.message,
                                        )}
                                      </p>
                                    ) : null}
                                  </label>

                                  <label className="space-y-2">
                                    <span className="text-sm font-medium text-[var(--lux-text)]">
                                      {t("quotations.category", {
                                        defaultValue: "Category",
                                      })}
                                    </span>
                                    <Input
                                      {...form.register(`items.${index}.category`)}
                                      placeholder={t("quotations.categoryPlaceholder", {
                                        defaultValue: "Enter item category",
                                      })}
                                    />
                                  </label>

                                  <label className="space-y-2">
                                    <span className="text-sm font-medium text-[var(--lux-text)]">
                                      {t("quotations.sortOrder", {
                                        defaultValue: "Sort Order",
                                      })}
                                    </span>
                                    <Input
                                      type="number"
                                      min="0"
                                      {...form.register(`items.${index}.sortOrder`)}
                                    />
                                    {form.formState.errors.items?.[index]?.sortOrder ? (
                                      <p className="text-[0.8rem] font-medium text-[var(--lux-danger)]">
                                        {String(
                                          form.formState.errors.items[index]?.sortOrder
                                            ?.message,
                                        )}
                                      </p>
                                    ) : null}
                                  </label>

                                  <label className="space-y-2">
                                    <span className="text-sm font-medium text-[var(--lux-text)]">
                                      {t("quotations.quantity", {
                                        defaultValue: "Quantity",
                                      })}
                                    </span>
                                    <Input
                                      type="number"
                                      min="0.001"
                                      step="0.001"
                                      {...form.register(`items.${index}.quantity`)}
                                    />
                                    {form.formState.errors.items?.[index]?.quantity ? (
                                      <p className="text-[0.8rem] font-medium text-[var(--lux-danger)]">
                                        {String(
                                          form.formState.errors.items[index]?.quantity
                                            ?.message,
                                        )}
                                      </p>
                                    ) : null}
                                  </label>

                                  <label className="space-y-2">
                                    <span className="text-sm font-medium text-[var(--lux-text)]">
                                      {t("quotations.unitPrice", {
                                        defaultValue: "Unit Price",
                                      })}
                                    </span>
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.001"
                                      {...form.register(`items.${index}.unitPrice`)}
                                    />
                                    {form.formState.errors.items?.[index]?.unitPrice ? (
                                      <p className="text-[0.8rem] font-medium text-[var(--lux-danger)]">
                                        {String(
                                          form.formState.errors.items[index]?.unitPrice
                                            ?.message,
                                        )}
                                      </p>
                                    ) : null}
                                  </label>

                                  <label className="space-y-2">
                                    <span className="text-sm font-medium text-[var(--lux-text)]">
                                      {t("quotations.totalPrice", {
                                        defaultValue: "Total Price",
                                      })}
                                    </span>
                                    <Input readOnly disabled value={String(itemTotal)} />
                                  </label>
                                </div>

                                <label className="space-y-2">
                                  <span className="text-sm font-medium text-[var(--lux-text)]">
                                    {t("common.notes", { defaultValue: "Notes" })}
                                  </span>
                                  <textarea
                                    {...form.register(`items.${index}.notes`)}
                                    className={textareaClassName}
                                    placeholder={t("quotations.itemNotesPlaceholder", {
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
                          {t("quotations.editItemsRestriction", {
                            defaultValue:
                              "This phase supports updating existing quotation items only. Adding or deleting lines will be enabled when backend endpoints are available.",
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
                          {t("quotations.fromEventSelectionTitle", {
                            defaultValue: "Event Service Selection",
                          })}
                        </h2>
                        <p className={sectionHintClass}>
                          {t("quotations.fromEventSelectionHint", {
                            defaultValue:
                              "Choose whether to use all event services or only selected lines for the quotation.",
                          })}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <button
                          type="button"
                          className={cn(
                            "rounded-[20px] border p-4 text-left transition-all",
                            fromEventSelectionMode === "all"
                              ? "border-[var(--lux-gold-border)] bg-[var(--lux-control-hover)]"
                              : "border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)]",
                          )}
                          onClick={() => setFromEventSelectionMode("all")}
                        >
                          <p className="text-sm font-semibold text-[var(--lux-text)]">
                            {t("quotations.selectionModeAll", {
                              defaultValue: "Use All Event Services",
                            })}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-[var(--lux-text-secondary)]">
                            {t("quotations.selectionModeAllHint", {
                              defaultValue:
                                "Every active event service line will be converted into the quotation.",
                            })}
                          </p>
                        </button>

                        <button
                          type="button"
                          className={cn(
                            "rounded-[20px] border p-4 text-left transition-all",
                            fromEventSelectionMode === "selected"
                              ? "border-[var(--lux-gold-border)] bg-[var(--lux-control-hover)]"
                              : "border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)]",
                          )}
                          onClick={() => setFromEventSelectionMode("selected")}
                        >
                          <p className="text-sm font-semibold text-[var(--lux-text)]">
                            {t("quotations.selectionModeSelected", {
                              defaultValue: "Choose Specific Services",
                            })}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-[var(--lux-text-secondary)]">
                            {t("quotations.selectionModeSelectedHint", {
                              defaultValue:
                                "Pick only the service lines that should appear on the quotation.",
                            })}
                          </p>
                        </button>
                      </div>

                      {!watchedEventId ? (
                        <div
                          className="rounded-[20px] border px-4 py-3 text-sm text-[var(--lux-text-secondary)]"
                          style={{
                            background: "var(--lux-panel-surface)",
                            borderColor: "var(--lux-row-border)",
                          }}
                        >
                          {t("quotations.selectEventBeforeServices", {
                            defaultValue:
                              "Select an event first to preview its service lines.",
                          })}
                        </div>
                      ) : availableEventServices.length === 0 ? (
                        <div
                          className="rounded-[20px] border px-4 py-3 text-sm text-[var(--lux-text-secondary)]"
                          style={{
                            background: "var(--lux-panel-surface)",
                            borderColor: "var(--lux-row-border)",
                          }}
                        >
                          {t("quotations.noEventServicesForEvent", {
                            defaultValue:
                              "No active event services are available for the selected event.",
                          })}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {availableEventServices.map((item) => {
                            const isSelected =
                              fromEventSelectionMode === "all"
                                ? true
                                : selectedEventServiceIds.includes(String(item.id));

                            return (
                              <label
                                key={item.id}
                                className={cn(
                                  "flex gap-4 rounded-[20px] border p-4",
                                  isSelected
                                    ? "border-[var(--lux-gold-border)] bg-[var(--lux-control-hover)]"
                                    : "border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)]",
                                  fromEventSelectionMode === "selected"
                                    ? "cursor-pointer"
                                    : "cursor-default",
                                )}
                              >
                                <Checkbox
                                  checked={isSelected}
                                  disabled={fromEventSelectionMode === "all"}
                                  onCheckedChange={(checked) =>
                                    setSelectedEventServiceIds((current) =>
                                      Boolean(checked)
                                        ? current.includes(String(item.id))
                                          ? current
                                          : [...current, String(item.id)]
                                        : current.filter(
                                            (value) => value !== String(item.id),
                                          ),
                                    )
                                  }
                                />

                                <div className="min-w-0 flex-1 space-y-2">
                                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                      <p className="font-semibold text-[var(--lux-heading)]">
                                        {item.serviceNameSnapshot}
                                      </p>
                                      <p className="text-xs text-[var(--lux-text-secondary)]">
                                        {t(`services.category.${item.category}`, {
                                          defaultValue: formatQuotationItemCategory(
                                            item.category,
                                          ),
                                        })}
                                      </p>
                                    </div>
                                    <div className="text-sm font-semibold text-[var(--lux-text)]">
                                      {formatMoney(item.totalPrice)}
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 gap-2 text-sm text-[var(--lux-text-secondary)] md:grid-cols-3">
                                    <div>
                                      {t("quotations.quantity", {
                                        defaultValue: "Quantity",
                                      })}
                                      : {item.quantity}
                                    </div>
                                    <div>
                                      {t("quotations.unitPrice", {
                                        defaultValue: "Unit Price",
                                      })}
                                      : {formatMoney(item.unitPrice)}
                                    </div>
                                    <div>
                                      {t("quotations.itemStatus", {
                                        defaultValue: "Status",
                                      })}
                                      :{" "}
                                      {t(`services.eventStatus.${item.status}`, {
                                        defaultValue: item.status,
                                      })}
                                    </div>
                                  </div>

                                  {item.notes ? (
                                    <p className="text-xs leading-5 text-[var(--lux-text-secondary)]">
                                      {item.notes}
                                    </p>
                                  ) : null}
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {fromEventSelectionMode === "selected" &&
                      watchedEventId &&
                      availableEventServices.length > 0 &&
                      selectedEventServiceIds.length === 0 ? (
                        <p className="text-sm font-medium text-[var(--lux-danger)]">
                          {t("quotations.fromEventSelectionRequired", {
                            defaultValue:
                              "Select at least one event service to continue.",
                          })}
                        </p>
                      ) : null}
                    </section>
                  )}

                  <section className="space-y-4">
                    <div
                      className="border-b pb-3"
                      style={{ borderColor: "var(--lux-row-border)" }}
                    >
                      <h2 className={sectionTitleClass}>
                        {t("quotations.totals", { defaultValue: "Totals" })}
                      </h2>
                      <p className={sectionHintClass}>
                        {t("quotations.totalsHint", {
                          defaultValue:
                            "Review the commercial totals before saving the quotation.",
                        })}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <SummaryTile
                        label={t("quotations.subtotal", {
                          defaultValue: "Subtotal",
                        })}
                        value={formatMoney(
                          isEditMode || watchedCreateMode === "manual"
                            ? quotationTotals.subtotal
                            : createFromEventTotals.subtotal,
                        )}
                      />
                      <SummaryTile
                        label={t("quotations.discount", {
                          defaultValue: "Discount",
                        })}
                        value={formatMoney(
                          isEditMode || watchedCreateMode === "manual"
                            ? quotationTotals.discountAmount
                            : createFromEventTotals.discountAmount,
                        )}
                      />
                      <SummaryTile
                        label={t("quotations.totalAmount", {
                          defaultValue: "Total Amount",
                        })}
                        value={formatMoney(
                          isEditMode || watchedCreateMode === "manual"
                            ? quotationTotals.totalAmount
                            : createFromEventTotals.totalAmount,
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
                          isEditMode && id ? `/quotations/${id}` : "/quotations",
                        )
                      }
                      disabled={isBusy}
                    >
                      {t("common.cancel", { defaultValue: "Cancel" })}
                    </Button>
                    <Button
                      type="submit"
                      disabled={
                        isBusy ||
                        (!isEditMode &&
                          watchedCreateMode === "from_event" &&
                          !canSubmitFromEvent)
                      }
                    >
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

export default QuotationFormPage;
