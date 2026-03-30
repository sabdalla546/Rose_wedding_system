import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import api, { getApiErrorMessage } from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";
import type { VendorTypeFormData } from "@/pages/vendors/types";

const normalizeOptionalString = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const buildVendorTypePayload = (values: VendorTypeFormData) => ({
  name: values.name.trim(),
  nameAr: values.nameAr.trim(),
  slug: normalizeOptionalString(values.slug),
  isActive: values.isActive,
  sortOrder: values.sortOrder,
});

export const useCreateVendorType = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (values: VendorTypeFormData) =>
      api.post("/vendor-types", buildVendorTypePayload(values)),
    onSuccess: () => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("vendors.types.toast.created", {
          defaultValue: "Vendor type created successfully",
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["vendor-types"] });
      navigate("/settings/vendors/types");
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("vendors.types.toast.createFailed", {
            defaultValue: "Failed to create vendor type",
          }),
        ),
      });
    },
  });
};

export const useUpdateVendorType = (id?: string) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (values: VendorTypeFormData) =>
      api.put(`/vendor-types/${id}`, buildVendorTypePayload(values)),
    onSuccess: () => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("vendors.types.toast.updated", {
          defaultValue: "Vendor type updated successfully",
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["vendor-types"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-type", id] });
      navigate("/settings/vendors/types");
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("vendors.types.toast.updateFailed", {
            defaultValue: "Failed to update vendor type",
          }),
        ),
      });
    },
  });
};
