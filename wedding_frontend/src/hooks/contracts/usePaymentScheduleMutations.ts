import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import api, { getApiErrorMessage } from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";
import type {
  PaymentSchedule,
  PaymentScheduleCreateFormData,
  PaymentScheduleUpdateFormData,
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

const buildCreatePaymentSchedulePayload = (
  values: PaymentScheduleCreateFormData,
) => ({
  contractId: values.contractId,
  installmentName: values.installmentName.trim(),
  scheduleType: values.scheduleType,
  dueDate: normalizeOptionalString(values.dueDate),
  amount: Number(values.amount),
  status: values.status || undefined,
  notes: normalizeOptionalString(values.notes),
  sortOrder: values.sortOrder?.trim() ? Number(values.sortOrder) : undefined,
});

const buildUpdatePaymentSchedulePayload = (
  values: PaymentScheduleUpdateFormData,
) => ({
  installmentName: values.installmentName?.trim() || undefined,
  scheduleType: values.scheduleType || undefined,
  dueDate:
    typeof values.dueDate !== "undefined"
      ? normalizeNullableString(values.dueDate)
      : undefined,
  amount:
    typeof values.amount !== "undefined"
      ? normalizeOptionalNumber(values.amount)
      : undefined,
  status: values.status || undefined,
  notes:
    typeof values.notes !== "undefined"
      ? normalizeNullableString(values.notes)
      : undefined,
  sortOrder:
    typeof values.sortOrder !== "undefined"
      ? values.sortOrder?.trim()
        ? Number(values.sortOrder)
        : 0
      : undefined,
});

type PaymentScheduleResponse = {
  data: PaymentSchedule;
};

export const useCreatePaymentSchedule = (contractId?: number) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (values: PaymentScheduleCreateFormData) =>
      api.post<PaymentScheduleResponse>(
        "/contracts/payment-schedules",
        buildCreatePaymentSchedulePayload(values),
      ),
    onSuccess: () => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("contracts.paymentScheduleToast.created", {
          defaultValue: "Payment schedule created successfully",
        }),
      });

      if (contractId) {
        queryClient.invalidateQueries({
          queryKey: ["contract", String(contractId)],
        });
      }
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("contracts.paymentScheduleToast.createFailed", {
            defaultValue: "Failed to create payment schedule",
          }),
        ),
      });
    },
  });
};

export const useUpdatePaymentSchedule = (contractId?: number) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: number;
      values: PaymentScheduleUpdateFormData;
    }) =>
      api.put<PaymentScheduleResponse>(
        `/contracts/payment-schedules/${id}`,
        buildUpdatePaymentSchedulePayload(values),
      ),
    onSuccess: () => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("contracts.paymentScheduleToast.updated", {
          defaultValue: "Payment schedule updated successfully",
        }),
      });

      if (contractId) {
        queryClient.invalidateQueries({
          queryKey: ["contract", String(contractId)],
        });
      }
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("contracts.paymentScheduleToast.updateFailed", {
            defaultValue: "Failed to update payment schedule",
          }),
        ),
      });
    },
  });
};

export const useDeletePaymentSchedule = (contractId?: number) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/contracts/payment-schedules/${id}`);
      return id;
    },
    onSuccess: () => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("contracts.paymentScheduleToast.deleted", {
          defaultValue: "Payment schedule deleted successfully",
        }),
      });

      if (contractId) {
        queryClient.invalidateQueries({
          queryKey: ["contract", String(contractId)],
        });
      }
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("contracts.paymentScheduleToast.deleteFailed", {
            defaultValue: "Failed to delete payment schedule",
          }),
        ),
      });
    },
  });
};
