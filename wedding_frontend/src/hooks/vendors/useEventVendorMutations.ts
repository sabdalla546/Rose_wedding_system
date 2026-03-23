import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import api, { getApiErrorMessage } from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";
import type { EventVendorLinkFormData } from "@/pages/vendors/types";

const normalizeOptionalString = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const normalizeNullableString = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const buildCreateEventVendorPayload = (values: EventVendorLinkFormData) => ({
  eventId: values.eventId,
  vendorType: values.vendorType,
  providedBy: values.providedBy,
  vendorId: values.vendorId ? Number(values.vendorId) : null,
  companyNameSnapshot: normalizeOptionalString(values.companyNameSnapshot),
  selectedSubServiceIds: values.selectedSubServiceIds ?? [],
  notes: normalizeOptionalString(values.notes),
  status: values.status,
});

const buildUpdateEventVendorPayload = (values: EventVendorLinkFormData) => ({
  vendorType: values.vendorType,
  providedBy: values.providedBy,
  vendorId: values.vendorId ? Number(values.vendorId) : null,
  companyNameSnapshot: normalizeNullableString(values.companyNameSnapshot),
  selectedSubServiceIds: values.selectedSubServiceIds ?? [],
  notes: normalizeNullableString(values.notes),
  status: values.status,
});

export const useCreateEventVendor = (eventId: number) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (values: EventVendorLinkFormData) =>
      api.post("/vendors/event-links", buildCreateEventVendorPayload(values)),
    onSuccess: () => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("vendors.eventLinkToast.created", {
          defaultValue: "Vendor assignment created successfully",
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["event-vendor-links"] });
      queryClient.invalidateQueries({ queryKey: ["event", String(eventId)] });
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("vendors.eventLinkToast.createFailed", {
            defaultValue: "Failed to create vendor assignment",
          }),
        ),
      });
    },
  });
};

export const useUpdateEventVendor = (eventId: number) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: number;
      values: EventVendorLinkFormData;
    }) => api.put(`/vendors/event-links/${id}`, buildUpdateEventVendorPayload(values)),
    onSuccess: () => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("vendors.eventLinkToast.updated", {
          defaultValue: "Vendor assignment updated successfully",
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["event-vendor-links"] });
      queryClient.invalidateQueries({ queryKey: ["event", String(eventId)] });
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("vendors.eventLinkToast.updateFailed", {
            defaultValue: "Failed to update vendor assignment",
          }),
        ),
      });
    },
  });
};

export const useDeleteEventVendor = (eventId: number) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => api.delete(`/vendors/event-links/${id}`),
    onSuccess: () => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("vendors.eventLinkToast.deleted", {
          defaultValue: "Vendor assignment deleted successfully",
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["event-vendor-links"] });
      queryClient.invalidateQueries({ queryKey: ["event", String(eventId)] });
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("vendors.eventLinkToast.deleteFailed", {
            defaultValue: "Failed to delete vendor assignment",
          }),
        ),
      });
    },
  });
};
