import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import api, { getApiErrorMessage } from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";
import type { ServiceFormData } from "@/pages/services/types";

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

const buildCreateServicePayload = (values: ServiceFormData) => ({
  name: values.name.trim(),
  code: normalizeOptionalString(values.code),
  category: values.category,
  pricingType: values.pricingType,
  basePrice: normalizeOptionalNumber(values.basePrice),
  unitName: normalizeOptionalString(values.unitName),
  description: normalizeOptionalString(values.description),
  isActive: values.isActive,
});

const buildUpdateServicePayload = (values: ServiceFormData) => ({
  name: values.name.trim(),
  code: normalizeNullableString(values.code),
  category: values.category,
  pricingType: values.pricingType,
  basePrice: normalizeNullableNumber(values.basePrice),
  unitName: normalizeNullableString(values.unitName),
  description: normalizeNullableString(values.description),
  isActive: values.isActive,
});

export const useCreateService = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (values: ServiceFormData) =>
      api.post("/services", buildCreateServicePayload(values)),
    onSuccess: () => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("services.toast.created", {
          defaultValue: "Service created successfully",
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["services"] });
      navigate("/settings/services");
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("services.toast.createFailed", {
            defaultValue: "Failed to create service",
          }),
        ),
      });
    },
  });
};

export const useUpdateService = (id?: string) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (values: ServiceFormData) =>
      api.put(`/services/${id}`, buildUpdateServicePayload(values)),
    onSuccess: () => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("services.toast.updated", {
          defaultValue: "Service updated successfully",
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["services"] });
      queryClient.invalidateQueries({ queryKey: ["service", id] });
      navigate("/settings/services");
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("services.toast.updateFailed", {
            defaultValue: "Failed to update service",
          }),
        ),
      });
    },
  });
};
