import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import api, { getApiErrorMessage } from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";
import type {
  QuotationFormData,
  QuotationFromEventFormData,
  QuotationResponse,
  QuotationUpdateFormData,
} from "@/pages/quotations/types";

const normalizeOptionalString = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const normalizeNullableString = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const normalizeOptionalNumber = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? Number(trimmed) : undefined;
};

const normalizeNullableNumber = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? Number(trimmed) : null;
};

const buildCreateQuotationPayload = (values: QuotationFormData) => ({
  eventId: Number(values.eventId),
  customerId: values.customerId ? Number(values.customerId) : null,
  leadId: values.leadId ? Number(values.leadId) : null,
  quotationNumber: normalizeOptionalString(values.quotationNumber),
  issueDate: values.issueDate,
  validUntil: normalizeOptionalString(values.validUntil),
  discountAmount: normalizeOptionalNumber(values.discountAmount),
  notes: normalizeOptionalString(values.notes),
  status: values.status || undefined,
  items: values.items.map((item) => ({
    eventServiceId: item.eventServiceId ? Number(item.eventServiceId) : null,
    serviceId: item.serviceId ? Number(item.serviceId) : null,
    itemName: item.itemName.trim(),
    category: normalizeOptionalString(item.category),
    quantity: Number(item.quantity),
    unitPrice: Number(item.unitPrice),
    totalPrice: item.totalPrice ? Number(item.totalPrice) : undefined,
    notes: normalizeOptionalString(item.notes),
    sortOrder: item.sortOrder?.trim() ? Number(item.sortOrder) : undefined,
  })),
});

const buildCreateFromEventPayload = (values: QuotationFromEventFormData) => ({
  eventId: Number(values.eventId),
  quotationNumber: normalizeOptionalString(values.quotationNumber),
  issueDate: values.issueDate,
  validUntil: normalizeOptionalString(values.validUntil),
  discountAmount: normalizeOptionalNumber(values.discountAmount),
  notes: normalizeOptionalString(values.notes),
  eventServiceIds: values.eventServiceIds?.length
    ? values.eventServiceIds.map((value) => Number(value))
    : undefined,
  status: values.status || undefined,
});

const buildUpdateQuotationPayload = (values: QuotationUpdateFormData) => ({
  customerId: values.customerId ? Number(values.customerId) : null,
  leadId: values.leadId ? Number(values.leadId) : null,
  quotationNumber: normalizeNullableString(values.quotationNumber),
  issueDate: values.issueDate || undefined,
  validUntil: normalizeNullableString(values.validUntil),
  discountAmount: normalizeNullableNumber(values.discountAmount),
  notes: normalizeNullableString(values.notes),
  status: values.status || undefined,
});

const buildUpdateQuotationItemPayload = (
  item: QuotationUpdateFormData["items"][number],
) => ({
  itemName: item.itemName.trim(),
  category: normalizeNullableString(item.category),
  quantity: Number(item.quantity),
  unitPrice: Number(item.unitPrice),
  totalPrice: item.totalPrice ? Number(item.totalPrice) : null,
  notes: normalizeNullableString(item.notes),
  sortOrder: item.sortOrder?.trim() ? Number(item.sortOrder) : 0,
});

export const useCreateQuotation = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (values: QuotationFormData) =>
      api.post<QuotationResponse>("/quotations", buildCreateQuotationPayload(values)),
    onSuccess: (response) => {
      const createdQuotation = response.data.data;

      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("quotations.toast.created", {
          defaultValue: "Quotation created successfully",
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["event", String(createdQuotation.eventId)] });
      navigate(`/quotations/${createdQuotation.id}`);
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("quotations.toast.createFailed", {
            defaultValue: "Failed to create quotation",
          }),
        ),
      });
    },
  });
};

export const useCreateQuotationFromEvent = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (values: QuotationFromEventFormData) =>
      api.post<QuotationResponse>(
        "/quotations/create-from-event",
        buildCreateFromEventPayload(values),
      ),
    onSuccess: (response) => {
      const createdQuotation = response.data.data;

      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("quotations.toast.createdFromEvent", {
          defaultValue: "Quotation created from event services successfully",
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["event", String(createdQuotation.eventId)] });
      navigate(`/quotations/${createdQuotation.id}`);
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("quotations.toast.createFromEventFailed", {
            defaultValue: "Failed to create quotation from event services",
          }),
        ),
      });
    },
  });
};

export const useUpdateQuotation = (id?: string) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (values: QuotationUpdateFormData) => {
      if (!id) {
        throw new Error("Quotation id is required");
      }

      const quotationItemRequests = values.items
        .filter((item) => typeof item.id === "number")
        .map((item) =>
          api.put(`/quotations/items/${item.id}`, buildUpdateQuotationItemPayload(item)),
        );

      await Promise.all(quotationItemRequests);

      const quotationResponse = await api.put<QuotationResponse>(
        `/quotations/${id}`,
        buildUpdateQuotationPayload(values),
      );

      return quotationResponse;
    },
    onSuccess: (response) => {
      const updatedQuotation = response.data.data;

      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("quotations.toast.updated", {
          defaultValue: "Quotation updated successfully",
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["quotation", id] });
      queryClient.invalidateQueries({ queryKey: ["event", String(updatedQuotation.eventId)] });
      navigate(`/quotations/${updatedQuotation.id}`);
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("quotations.toast.updateFailed", {
            defaultValue: "Failed to update quotation",
          }),
        ),
      });
    },
  });
};
