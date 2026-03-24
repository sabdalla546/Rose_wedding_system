import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import api, { getApiErrorMessage } from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";
import type { VendorSubServiceFormData } from "@/pages/vendors/types";

const normalizeOptionalString = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const normalizeNullableString = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const buildCreateVendorSubServicePayload = (
  values: VendorSubServiceFormData,
) => ({
  vendorId: Number(values.vendorId),
  vendorType: values.vendorType,
  name: values.name.trim(),
  code: normalizeOptionalString(values.code),
  description: normalizeOptionalString(values.description),
  sortOrder: Number(values.sortOrder),
  isActive: values.isActive,
});

const buildUpdateVendorSubServicePayload = (
  values: VendorSubServiceFormData,
) => ({
  vendorId: Number(values.vendorId),
  vendorType: values.vendorType,
  name: values.name.trim(),
  code: normalizeNullableString(values.code),
  description: normalizeNullableString(values.description),
  sortOrder: Number(values.sortOrder),
  isActive: values.isActive,
});

export const useCreateVendorSubService = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (values: VendorSubServiceFormData) =>
      api.post("/vendors/sub-services", buildCreateVendorSubServicePayload(values)),
    onSuccess: () => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("vendors.subServices.toast.created", {
          defaultValue: "Vendor sub-service created successfully",
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["vendor-sub-services"] });
      navigate("/settings/vendors/sub-services");
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("vendors.subServices.toast.createFailed", {
            defaultValue: "Failed to create vendor sub-service",
          }),
        ),
      });
    },
  });
};

export const useUpdateVendorSubService = (id?: string) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (values: VendorSubServiceFormData) =>
      api.put(
        `/vendors/sub-services/${id}`,
        buildUpdateVendorSubServicePayload(values),
      ),
    onSuccess: () => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("vendors.subServices.toast.updated", {
          defaultValue: "Vendor sub-service updated successfully",
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["vendor-sub-services"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-sub-service", id] });
      navigate("/settings/vendors/sub-services");
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("vendors.subServices.toast.updateFailed", {
            defaultValue: "Failed to update vendor sub-service",
          }),
        ),
      });
    },
  });
};
