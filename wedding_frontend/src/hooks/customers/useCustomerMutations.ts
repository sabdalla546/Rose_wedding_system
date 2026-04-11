import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import api, { getApiErrorMessage } from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";
import type { CustomerFormData } from "@/pages/customers/types";

const normalizeOptionalString = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const normalizeNullableString = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const buildCreateCustomerPayload = (values: CustomerFormData) => ({
  fullName: values.fullName.trim(),
  mobile: values.mobile.trim(),
  mobile2: normalizeOptionalString(values.mobile2),
  email: normalizeOptionalString(values.email),
  nationalId: normalizeOptionalString(values.nationalId),
  address: normalizeOptionalString(values.address),
  source: normalizeOptionalString(values.source ?? undefined),
  sourceDetails: normalizeOptionalString(values.sourceDetails ?? undefined),
  notes: normalizeOptionalString(values.notes),
  status: values.status,
});

const buildUpdateCustomerPayload = (values: CustomerFormData) => ({
  fullName: values.fullName.trim(),
  mobile: values.mobile.trim(),
  mobile2: normalizeNullableString(values.mobile2),
  email: normalizeNullableString(values.email),
  nationalId: normalizeNullableString(values.nationalId),
  address: normalizeNullableString(values.address),
  source: normalizeNullableString(values.source ?? undefined),
  sourceDetails: normalizeNullableString(values.sourceDetails ?? undefined),
  notes: normalizeNullableString(values.notes),
  status: values.status,
});

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (values: CustomerFormData) =>
      api.post("/customers", buildCreateCustomerPayload(values)),
    onSuccess: () => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("customers.toast.created", {
          defaultValue: "Customer created successfully",
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["customers"] });
      navigate("/customers");
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("customers.toast.createFailed", {
            defaultValue: "Failed to create customer",
          }),
        ),
      });
    },
  });
};

export const useUpdateCustomer = (id?: string) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (values: CustomerFormData) =>
      api.put(`/customers/${id}`, buildUpdateCustomerPayload(values)),
    onSuccess: () => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("customers.toast.updated", {
          defaultValue: "Customer updated successfully",
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer", id] });
      navigate("/customers");
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("customers.toast.updateFailed", {
            defaultValue: "Failed to update customer",
          }),
        ),
      });
    },
  });
};
