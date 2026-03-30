import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import api, { getApiErrorMessage } from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";
import type { VendorFormData } from "@/pages/vendors/types";

const normalizeOptionalString = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const normalizeNullableString = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const buildCreateVendorPayload = (values: VendorFormData) => ({
  name: values.name.trim(),
  typeId: values.typeId,
  type: values.type,
  contactPerson: normalizeOptionalString(values.contactPerson),
  phone: normalizeOptionalString(values.phone),
  phone2: normalizeOptionalString(values.phone2),
  email: normalizeOptionalString(values.email),
  address: normalizeOptionalString(values.address),
  notes: normalizeOptionalString(values.notes),
  isActive: values.isActive,
});

const buildUpdateVendorPayload = (values: VendorFormData) => ({
  name: values.name.trim(),
  typeId: values.typeId,
  type: values.type,
  contactPerson: normalizeNullableString(values.contactPerson),
  phone: normalizeNullableString(values.phone),
  phone2: normalizeNullableString(values.phone2),
  email: normalizeNullableString(values.email),
  address: normalizeNullableString(values.address),
  notes: normalizeNullableString(values.notes),
  isActive: values.isActive,
});

export const useCreateVendor = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (values: VendorFormData) =>
      api.post("/vendors", buildCreateVendorPayload(values)),
    onSuccess: () => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("vendors.toast.created", {
          defaultValue: "Vendor created successfully",
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      navigate("/settings/vendors");
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("vendors.toast.createFailed", {
            defaultValue: "Failed to create vendor",
          }),
        ),
      });
    },
  });
};

export const useUpdateVendor = (id?: string) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (values: VendorFormData) =>
      api.put(`/vendors/${id}`, buildUpdateVendorPayload(values)),
    onSuccess: () => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("vendors.toast.updated", {
          defaultValue: "Vendor updated successfully",
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      queryClient.invalidateQueries({ queryKey: ["vendor", id] });
      navigate("/settings/vendors");
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("vendors.toast.updateFailed", {
            defaultValue: "Failed to update vendor",
          }),
        ),
      });
    },
  });
};
