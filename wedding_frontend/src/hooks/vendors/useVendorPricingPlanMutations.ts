import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import api, { getApiErrorMessage } from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";
import type { VendorPricingPlanFormData } from "@/pages/vendors/types";

const normalizeOptionalString = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const normalizeNullableString = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const buildCreateVendorPricingPlanPayload = (
  values: VendorPricingPlanFormData,
) => ({
  vendorId: Number(values.vendorId),
  vendorType: values.vendorType,
  name: values.name.trim(),
  minSubServices: Number(values.minSubServices),
  maxSubServices: values.maxSubServices?.trim()
    ? Number(values.maxSubServices)
    : undefined,
  price: Number(values.price),
  notes: normalizeOptionalString(values.notes),
  isActive: values.isActive,
});

const buildUpdateVendorPricingPlanPayload = (
  values: VendorPricingPlanFormData,
) => ({
  vendorId: Number(values.vendorId),
  vendorType: values.vendorType,
  name: values.name.trim(),
  minSubServices: Number(values.minSubServices),
  maxSubServices: values.maxSubServices?.trim()
    ? Number(values.maxSubServices)
    : null,
  price: Number(values.price),
  notes: normalizeNullableString(values.notes),
  isActive: values.isActive,
});

export const useCreateVendorPricingPlan = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (values: VendorPricingPlanFormData) =>
      api.post(
        "/vendors/pricing-plans",
        buildCreateVendorPricingPlanPayload(values),
      ),
    onSuccess: () => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("vendors.pricingPlans.toast.created", {
          defaultValue: "Vendor pricing plan created successfully",
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["vendor-pricing-plans"] });
      navigate("/settings/vendors/pricing-plans");
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("vendors.pricingPlans.toast.createFailed", {
            defaultValue: "Failed to create vendor pricing plan",
          }),
        ),
      });
    },
  });
};

export const useUpdateVendorPricingPlan = (id?: string) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (values: VendorPricingPlanFormData) =>
      api.put(
        `/vendors/pricing-plans/${id}`,
        buildUpdateVendorPricingPlanPayload(values),
      ),
    onSuccess: () => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("vendors.pricingPlans.toast.updated", {
          defaultValue: "Vendor pricing plan updated successfully",
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["vendor-pricing-plans"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-pricing-plan", id] });
      navigate("/settings/vendors/pricing-plans");
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("vendors.pricingPlans.toast.updateFailed", {
            defaultValue: "Failed to update vendor pricing plan",
          }),
        ),
      });
    },
  });
};
