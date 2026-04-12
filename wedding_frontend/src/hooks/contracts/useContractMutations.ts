import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import api, { getApiErrorMessage } from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";
import type {
  ContractFormData,
  ContractFromQuotationFormData,
  ContractResponse,
  ContractUpdateFormData,
} from "@/pages/contracts/types";

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

const buildCreateContractPayload = (values: ContractFormData) => ({
  quotationId: values.quotationId ? Number(values.quotationId) : null,
  eventId: Number(values.eventId),
  contractNumber: normalizeOptionalString(values.contractNumber),
  signedDate: values.signedDate,
  eventDate: normalizeOptionalString(values.eventDate),
  discountAmount: normalizeOptionalNumber(values.discountAmount),
  notes: normalizeOptionalString(values.notes),
  status: values.status || undefined,
  items: values.items.map((item) => ({
    itemType: item.itemType,
    quotationItemId: item.quotationItemId ? Number(item.quotationItemId) : null,
    eventServiceId: item.eventServiceId ? Number(item.eventServiceId) : null,
    serviceId: item.serviceId ? Number(item.serviceId) : null,
    eventVendorId: item.eventVendorId ? Number(item.eventVendorId) : null,
    vendorId: item.vendorId ? Number(item.vendorId) : null,
    itemName: item.itemName.trim(),
    category: normalizeOptionalString(item.category),
    quantity: Number(item.quantity),
    unitPrice: Number(item.unitPrice),
    totalPrice: item.totalPrice ? Number(item.totalPrice) : undefined,
    notes: normalizeOptionalString(item.notes),
    sortOrder: item.sortOrder?.trim() ? Number(item.sortOrder) : undefined,
  })),
  paymentSchedules: values.paymentSchedules?.map((schedule) => ({
    installmentName: schedule.installmentName.trim(),
    scheduleType: schedule.scheduleType,
    dueDate: normalizeOptionalString(schedule.dueDate),
    amount: Number(schedule.amount),
    status: schedule.status || undefined,
    notes: normalizeOptionalString(schedule.notes),
    sortOrder: schedule.sortOrder?.trim()
      ? Number(schedule.sortOrder)
      : undefined,
  })),
});

const buildCreateFromQuotationPayload = (values: ContractFromQuotationFormData) => ({
  quotationId: Number(values.quotationId),
  contractNumber: normalizeOptionalString(values.contractNumber),
  signedDate: values.signedDate,
  eventDate: normalizeOptionalString(values.eventDate),
  notes: normalizeOptionalString(values.notes),
  status: values.status || undefined,
  paymentSchedules: values.paymentSchedules?.map((schedule) => ({
    installmentName: schedule.installmentName.trim(),
    scheduleType: schedule.scheduleType,
    dueDate: normalizeOptionalString(schedule.dueDate),
    amount: Number(schedule.amount),
    status: schedule.status || undefined,
    notes: normalizeOptionalString(schedule.notes),
    sortOrder: schedule.sortOrder?.trim()
      ? Number(schedule.sortOrder)
      : undefined,
  })),
});

const buildUpdateContractPayload = (values: ContractUpdateFormData) => ({
  contractNumber: normalizeNullableString(values.contractNumber),
  signedDate: values.signedDate || undefined,
  eventDate: normalizeNullableString(values.eventDate),
  discountAmount: normalizeNullableNumber(values.discountAmount),
  notes: normalizeNullableString(values.notes),
  status: values.status || undefined,
});

const buildUpdateContractItemPayload = (
  item: ContractUpdateFormData["items"][number],
) => ({
  itemType: item.itemType,
  quotationItemId: item.quotationItemId ? Number(item.quotationItemId) : null,
  eventServiceId: item.eventServiceId ? Number(item.eventServiceId) : null,
  serviceId: item.serviceId ? Number(item.serviceId) : null,
  eventVendorId: item.eventVendorId ? Number(item.eventVendorId) : null,
  vendorId: item.vendorId ? Number(item.vendorId) : null,
  itemName: item.itemName.trim(),
  category: normalizeNullableString(item.category),
  quantity: Number(item.quantity),
  unitPrice: Number(item.unitPrice),
  totalPrice: item.totalPrice ? Number(item.totalPrice) : null,
  notes: normalizeNullableString(item.notes),
  sortOrder: item.sortOrder?.trim() ? Number(item.sortOrder) : 0,
});

const invalidateRelatedQueries = (
  queryClient: ReturnType<typeof useQueryClient>,
  {
    eventId,
    quotationId,
  }: {
    eventId?: number | null;
    quotationId?: number | null;
  },
) => {
  queryClient.invalidateQueries({ queryKey: ["contracts"] });

  if (eventId) {
    queryClient.invalidateQueries({ queryKey: ["event", String(eventId)] });
  }

  if (quotationId) {
    queryClient.invalidateQueries({ queryKey: ["quotation", String(quotationId)] });
    queryClient.invalidateQueries({ queryKey: ["quotations"] });
  }
};

export const useCreateContract = (options?: {
  navigateOnSuccess?: boolean;
  onSuccess?: (contractId: number) => void;
}) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (values: ContractFormData) =>
      api.post<ContractResponse>("/contracts", buildCreateContractPayload(values)),
    onSuccess: (response) => {
      const createdContract = response.data.data;

      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("contracts.toast.created", {
          defaultValue: "Contract created successfully",
        }),
      });

      invalidateRelatedQueries(queryClient, {
        eventId: createdContract.eventId,
        quotationId: createdContract.quotationId,
      });
      options?.onSuccess?.(createdContract.id);
      if (options?.navigateOnSuccess !== false) {
        navigate(`/contracts/${createdContract.id}`);
      }
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("contracts.toast.createFailed", {
            defaultValue: "Failed to create contract",
          }),
        ),
      });
    },
  });
};

export const useCreateContractFromQuotation = (options?: {
  navigateOnSuccess?: boolean;
  onSuccess?: (contractId: number) => void;
}) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (values: ContractFromQuotationFormData) =>
      api.post<ContractResponse>(
        "/contracts/create-from-quotation",
        buildCreateFromQuotationPayload(values),
      ),
    onSuccess: (response) => {
      const createdContract = response.data.data;

      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("contracts.toast.createdFromQuotation", {
          defaultValue: "Contract created from quotation successfully",
        }),
      });

      invalidateRelatedQueries(queryClient, {
        eventId: createdContract.eventId,
        quotationId: createdContract.quotationId,
      });
      options?.onSuccess?.(createdContract.id);
      if (options?.navigateOnSuccess !== false) {
        navigate(`/contracts/${createdContract.id}`);
      }
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("contracts.toast.createFromQuotationFailed", {
            defaultValue: "Failed to create contract from quotation",
          }),
        ),
      });
    },
  });
};

export const useUpdateContract = (id?: string) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (values: ContractUpdateFormData) => {
      if (!id) {
        throw new Error("Contract id is required");
      }

      const contractItemRequests = values.items
        .filter((item) => typeof item.id === "number")
        .map((item) =>
          api.put(
            `/contracts/items/${item.id}`,
            buildUpdateContractItemPayload(item),
          ),
        );

      await Promise.all(contractItemRequests);

      const contractResponse = await api.put<ContractResponse>(
        `/contracts/${id}`,
        buildUpdateContractPayload(values),
      );

      return contractResponse;
    },
    onSuccess: (response) => {
      const updatedContract = response.data.data;

      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("contracts.toast.updated", {
          defaultValue: "Contract updated successfully",
        }),
      });

      invalidateRelatedQueries(queryClient, {
        eventId: updatedContract.eventId,
        quotationId: updatedContract.quotationId,
      });
      queryClient.invalidateQueries({ queryKey: ["contract", id] });
      navigate(`/contracts/${updatedContract.id}`);
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("contracts.toast.updateFailed", {
            defaultValue: "Failed to update contract",
          }),
        ),
      });
    },
  });
};
