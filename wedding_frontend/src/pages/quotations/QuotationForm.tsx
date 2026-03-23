import { useEffect, useMemo, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { FileText } from "lucide-react";
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
  useCreateQuotationFromEvent,
  useUpdateQuotation,
} from "@/hooks/quotations/useQuotationMutations";
import { useQuotation } from "@/hooks/quotations/useQuotations";
import { useEventServiceItems } from "@/hooks/services/useServices";
import { cn } from "@/lib/utils";
import { getEventDisplayTitle } from "@/pages/events/adapters";

import {
  computeQuotationTotals,
  formatMoney,
  formatQuotationItemCategory,
  QUOTATION_STATUS_OPTIONS,
} from "./adapters";
import type {
  QuotationFromEventFormData,
  QuotationStatus,
  QuotationUpdateFormData,
} from "./types";

const textAreaClass =
  "min-h-[120px] w-full rounded-[22px] border px-4 py-3 text-sm text-[var(--lux-text)] outline-none transition-all focus:border-[var(--lux-gold-border)] focus:ring-2 focus:ring-[var(--lux-gold-glow)]";

const schema = (isEditMode: boolean) =>
  z
    .object({
      eventId: z.string().min(1, "Event is required"),
      quotationNumber: z.string().max(100).optional(),
      issueDate: z.string().min(1, "Issue date is required"),
      validUntil: z.string().optional(),
      subtotal: z
        .string()
        .refine((value) => value.trim() !== "" && Number(value) >= 0, "Subtotal is required"),
      discountAmount: z
        .string()
        .optional()
        .refine((value) => !value || Number(value) >= 0, "Discount must be zero or greater"),
      notes: z.string().optional(),
      status: z.enum(
        QUOTATION_STATUS_OPTIONS.map((option) => option.value) as [
          QuotationStatus,
          ...QuotationStatus[],
        ],
      ),
      eventServiceIds: z.array(z.string()).default([]),
      items: z.array(
        z.object({
          id: z.number().optional(),
          eventServiceId: z.string().optional(),
          serviceId: z.string().optional(),
          itemName: z.string().max(150),
          category: z.string().max(100).optional(),
          notes: z.string().optional(),
          sortOrder: z.string().optional(),
        }),
      ),
    })
    .superRefine((values, ctx) => {
      if (!isEditMode && values.eventServiceIds.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["eventServiceIds"],
          message: "Select at least one event service",
        });
      }

      if (isEditMode) {
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

type FormValues = z.infer<ReturnType<typeof schema>>;

const QuotationFormPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEditMode = Boolean(id);
  const preselectedEventId = searchParams.get("eventId") ?? "";
  const autoFillKey = useRef("");

  const { data: quotation, isLoading: quotationLoading } = useQuotation(id);
  const createMutation = useCreateQuotationFromEvent();
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

  const form = useForm<FormValues>({
    resolver: zodResolver(schema(isEditMode)) as any,
    defaultValues: {
      eventId: preselectedEventId,
      quotationNumber: "",
      issueDate: new Date().toISOString().slice(0, 10),
      validUntil: "",
      subtotal: "0",
      discountAmount: "0",
      notes: "",
      status: "draft",
      eventServiceIds: [],
      items: [],
    },
  });
  const { fields } = useFieldArray({ control: form.control, name: "items" });
  const watchedEventId = useWatch({ control: form.control, name: "eventId" });
  const watchedSubtotal = useWatch({ control: form.control, name: "subtotal" });
  const watchedDiscount = useWatch({ control: form.control, name: "discountAmount" });
  const selectedEventServiceIds =
    useWatch({ control: form.control, name: "eventServiceIds" }) ?? [];

  const selectedEventId = watchedEventId ? Number(watchedEventId) : 0;
  const { data: eventServicesResponse } = useEventServiceItems({
    currentPage: 1,
    itemsPerPage: 200,
    eventId: selectedEventId || undefined,
    category: "all",
    status: "all",
  });

  const events = eventsResponse?.data ?? [];
  const eventServices = useMemo(
    () => (eventServicesResponse?.data ?? []).filter((item) => item.status !== "cancelled"),
    [eventServicesResponse?.data],
  );
  const totals = useMemo(
    () => computeQuotationTotals({ subtotal: watchedSubtotal, discountAmount: watchedDiscount }),
    [watchedDiscount, watchedSubtotal],
  );

  useEffect(() => {
    if (!isEditMode && preselectedEventId) {
      form.setValue("eventId", preselectedEventId);
    }
  }, [form, isEditMode, preselectedEventId]);

  useEffect(() => {
    if (!isEditMode || !quotation) return;
    form.reset({
      eventId: String(quotation.eventId),
      quotationNumber: quotation.quotationNumber ?? "",
      issueDate: quotation.issueDate,
      validUntil: quotation.validUntil ?? "",
      subtotal: quotation.subtotal != null ? String(quotation.subtotal) : "0",
      discountAmount:
        quotation.discountAmount != null ? String(quotation.discountAmount) : "0",
      notes: quotation.notes ?? "",
      status: quotation.status,
      eventServiceIds: [],
      items: (quotation.items ?? []).map((item) => ({
        id: item.id,
        eventServiceId: item.eventServiceId ? String(item.eventServiceId) : "",
        serviceId: item.serviceId ? String(item.serviceId) : "",
        itemName: item.itemName,
        category: item.category ?? "",
        notes: item.notes ?? "",
        sortOrder: String(item.sortOrder ?? 0),
      })),
    });
  }, [form, isEditMode, quotation]);

  useEffect(() => {
    if (isEditMode || !watchedEventId) return;
    const nextKey = `${watchedEventId}:${eventServices.map((item) => item.id).join(",")}`;
    if (autoFillKey.current === nextKey) return;
    autoFillKey.current = nextKey;
    form.setValue(
      "eventServiceIds",
      eventServices.map((item) => String(item.id)),
      { shouldDirty: true },
    );
  }, [eventServices, form, isEditMode, watchedEventId]);

  const isBusy = quotationLoading || createMutation.isPending || updateMutation.isPending;

  const toggleEventService = (id: string, checked: boolean) => {
    const current = form.getValues("eventServiceIds");
    form.setValue(
      "eventServiceIds",
      checked ? [...new Set([...current, id])] : current.filter((value) => value !== id),
      { shouldDirty: true, shouldValidate: true },
    );
  };

  const submit = (values: FormValues) => {
    if (isEditMode) {
      const payload: QuotationUpdateFormData = {
        quotationNumber: values.quotationNumber,
        issueDate: values.issueDate,
        validUntil: values.validUntil,
        subtotal: values.subtotal,
        discountAmount: values.discountAmount,
        notes: values.notes,
        status: values.status,
        items: values.items.map((item) => ({ ...item, itemName: item.itemName.trim() })),
      };
      updateMutation.mutate(payload);
      return;
    }

    const payload: QuotationFromEventFormData = {
      eventId: values.eventId,
      quotationNumber: values.quotationNumber,
      issueDate: values.issueDate,
      validUntil: values.validUntil,
      subtotal: values.subtotal,
      discountAmount: values.discountAmount,
      notes: values.notes,
      eventServiceIds: values.eventServiceIds,
      status: values.status,
    };
    createMutation.mutate(payload);
  };

  if (quotationLoading) {
    return <div className="flex min-h-[50vh] items-center justify-center text-sm text-[var(--lux-text-secondary)]">{t("common.loading", { defaultValue: "Loading..." })}</div>;
  }

  return (
    <ProtectedComponent permission={isEditMode ? "quotations.update" : "quotations.create"}>
      <PageContainer className="pb-4 pt-4 text-foreground">
        <div dir={i18n.dir()} className="mx-auto w-full max-w-6xl space-y-6">
          <button type="button" onClick={() => navigate(isEditMode && id ? `/quotations/${id}` : "/quotations")} className="inline-flex items-center gap-2 text-sm text-[var(--lux-text-secondary)] transition-colors hover:text-[var(--lux-gold)]">
            {"<-"} {isEditMode ? t("quotations.backToQuotation", { defaultValue: "Back to Quotation" }) : t("quotations.backToQuotations", { defaultValue: "Back to Quotations" })}
          </button>

          <div className="overflow-hidden rounded-[24px] border p-4 shadow-luxe" style={{ background: "var(--lux-panel-surface)", borderColor: "var(--lux-panel-border)" }}>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-[18px] border" style={{ background: "var(--lux-control-hover)", borderColor: "var(--lux-control-border)", color: "var(--lux-gold)" }}>
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[var(--lux-heading)]">{isEditMode ? t("quotations.editTitle", { defaultValue: "Edit Quotation" }) : t("quotations.createTitle", { defaultValue: "Create Quotation" })}</h1>
                <p className="text-sm text-[var(--lux-text-secondary)]">{isEditMode ? t("quotations.editDescription", { defaultValue: "Update quotation header values and descriptive included items." }) : t("quotations.createDescription", { defaultValue: "Select event services, enter one subtotal for all included services, and create the quotation." })}</p>
              </div>
            </div>
          </div>

          <Card className="overflow-hidden rounded-[24px]">
            <div className="p-6 md:p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(submit)} className="space-y-8">
                  <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <Select value={form.watch("eventId") || "none"} onValueChange={(value) => form.setValue("eventId", value === "none" ? "" : value, { shouldDirty: true, shouldValidate: true })} disabled={isEditMode}>
                      <SelectTrigger><SelectValue placeholder={t("quotations.selectEvent", { defaultValue: "Select event" })} /></SelectTrigger>
                      <SelectContent>
                        {!isEditMode ? <SelectItem value="none">{t("quotations.selectEvent", { defaultValue: "Select event" })}</SelectItem> : null}
                        {events.map((event) => <SelectItem key={event.id} value={String(event.id)}>{getEventDisplayTitle(event)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input placeholder={t("quotations.quotationNumber", { defaultValue: "Quotation Number" })} {...form.register("quotationNumber")} />
                    <Select value={form.watch("status")} onValueChange={(value) => form.setValue("status", value as QuotationStatus, { shouldDirty: true })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {QUOTATION_STATUS_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{t(`quotations.status.${option.value}`, { defaultValue: option.label })}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input type="date" {...form.register("issueDate")} />
                    <Input type="date" {...form.register("validUntil")} />
                    <Input type="number" min="0" step="0.001" placeholder={t("quotations.subtotal", { defaultValue: "Subtotal" })} {...form.register("subtotal")} />
                    <Input type="number" min="0" step="0.001" placeholder={t("quotations.discount", { defaultValue: "Discount" })} {...form.register("discountAmount")} />
                  </section>

                  <textarea {...form.register("notes")} className={textAreaClass} placeholder={t("common.notes", { defaultValue: "Notes" })} style={{ background: "var(--lux-control-surface)", borderColor: "var(--lux-control-border)" }} />

                  {!isEditMode ? (
                    <section className="space-y-3">
                      {eventServices.length === 0 ? (
                        <div className="rounded-[20px] border px-4 py-3 text-sm text-[var(--lux-text-secondary)]" style={{ background: "var(--lux-panel-surface)", borderColor: "var(--lux-row-border)" }}>
                          {watchedEventId ? t("quotations.noEventServicesForEvent", { defaultValue: "No active event services are available for the selected event." }) : t("quotations.selectEventBeforeServices", { defaultValue: "Select an event first to load its event services." })}
                        </div>
                      ) : (
                        eventServices.map((item) => {
                          const checked = selectedEventServiceIds.includes(String(item.id));
                          return (
                            <label key={item.id} className={cn("flex gap-4 rounded-[20px] border p-4 cursor-pointer", checked ? "border-[var(--lux-gold-border)] bg-[var(--lux-control-hover)]" : "border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)]")}>
                              <Checkbox checked={checked} onCheckedChange={(value) => toggleEventService(String(item.id), Boolean(value))} />
                              <div className="space-y-2">
                                <div className="font-semibold text-[var(--lux-heading)]">{item.serviceNameSnapshot}</div>
                                <div className="text-xs text-[var(--lux-text-secondary)]">{t(`services.category.${item.category}`, { defaultValue: formatQuotationItemCategory(item.category) })}</div>
                                {item.notes ? <div className="text-xs text-[var(--lux-text-secondary)]">{item.notes}</div> : null}
                              </div>
                            </label>
                          );
                        })
                      )}
                      {form.formState.errors.eventServiceIds ? <p className="text-sm font-medium text-[var(--lux-danger)]">{String(form.formState.errors.eventServiceIds.message)}</p> : null}
                    </section>
                  ) : (
                    <section className="space-y-4">
                      {fields.length === 0 ? (
                        <div className="rounded-[20px] border px-4 py-3 text-sm text-[var(--lux-text-secondary)]" style={{ background: "var(--lux-panel-surface)", borderColor: "var(--lux-row-border)" }}>
                          {t("quotations.noItems", { defaultValue: "No quotation items are linked to this quotation." })}
                        </div>
                      ) : (
                        fields.map((field, index) => (
                          <div key={field.id} className="rounded-[22px] border p-4" style={{ background: "var(--lux-row-surface)", borderColor: "var(--lux-row-border)" }}>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                              <Input {...form.register(`items.${index}.itemName`)} placeholder={t("quotations.itemName", { defaultValue: "Item" })} />
                              <Input {...form.register(`items.${index}.category`)} placeholder={t("quotations.category", { defaultValue: "Category" })} />
                              <Input type="number" min="0" {...form.register(`items.${index}.sortOrder`)} placeholder={t("services.sortOrder", { defaultValue: "Sort Order" })} />
                            </div>
                            <textarea {...form.register(`items.${index}.notes`)} className={`${textAreaClass} mt-4`} style={{ background: "var(--lux-control-surface)", borderColor: "var(--lux-control-border)" }} placeholder={t("common.notes", { defaultValue: "Notes" })} />
                          </div>
                        ))
                      )}
                    </section>
                  )}

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <SummaryTile label={t("quotations.subtotal", { defaultValue: "Subtotal" })} value={formatMoney(totals.subtotal)} />
                    <SummaryTile label={t("quotations.discount", { defaultValue: "Discount" })} value={formatMoney(totals.discountAmount)} />
                    <SummaryTile label={t("quotations.totalAmount", { defaultValue: "Total Amount" })} value={formatMoney(totals.totalAmount)} emphasis />
                  </div>

                  <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row sm:justify-end" style={{ borderColor: "var(--lux-row-border)" }}>
                    <Button type="button" variant="outline" onClick={() => navigate(isEditMode && id ? `/quotations/${id}` : "/quotations")} disabled={isBusy}>{t("common.cancel", { defaultValue: "Cancel" })}</Button>
                    <Button type="submit" disabled={isBusy}>{isBusy ? t("common.processing", { defaultValue: "Processing..." }) : isEditMode ? t("common.update", { defaultValue: "Update" }) : t("common.create", { defaultValue: "Create" })}</Button>
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

function SummaryTile({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="rounded-[20px] border px-4 py-4" style={{ background: "var(--lux-panel-surface)", borderColor: "var(--lux-row-border)" }}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">{label}</p>
      <p className={cn("mt-2 text-lg font-semibold", emphasis ? "text-[var(--lux-heading)]" : "text-[var(--lux-text)]")}>{value}</p>
    </div>
  );
}

export default QuotationFormPage;
