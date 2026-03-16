import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import api, { getApiErrorMessage } from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";
import type { LeadFormData } from "@/pages/leads/types";

const normalizeOptionalString = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const normalizeNullableString = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const normalizeGuestCountForCreate = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? Number(trimmed) : undefined;
};

const normalizeGuestCountForUpdate = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? Number(trimmed) : null;
};

const buildCreateLeadPayload = (values: LeadFormData) => ({
  fullName: values.fullName.trim(),
  mobile: values.mobile.trim(),
  mobile2: normalizeOptionalString(values.mobile2),
  email: normalizeOptionalString(values.email),
  weddingDate: values.weddingDate,
  guestCount: normalizeGuestCountForCreate(values.guestCount),
  venueId: values.venueId ? Number(values.venueId) : null,
  venueNameSnapshot: normalizeOptionalString(values.venueNameSnapshot),
  source: normalizeOptionalString(values.source),
  status: values.status,
  notes: normalizeOptionalString(values.notes),
});

const buildUpdateLeadPayload = (values: LeadFormData) => ({
  fullName: values.fullName.trim(),
  mobile: values.mobile.trim(),
  mobile2: normalizeNullableString(values.mobile2),
  email: normalizeNullableString(values.email),
  weddingDate: values.weddingDate,
  guestCount: normalizeGuestCountForUpdate(values.guestCount),
  venueId: values.venueId ? Number(values.venueId) : null,
  venueNameSnapshot: normalizeNullableString(values.venueNameSnapshot),
  source: normalizeNullableString(values.source),
  status: values.status,
  notes: normalizeNullableString(values.notes),
});

export const useCreateLead = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (values: LeadFormData) =>
      api.post("/leads", buildCreateLeadPayload(values)),
    onSuccess: () => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("leads.toast.created", {
          defaultValue: "Lead created successfully",
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["leads"] });
      navigate("/leads");
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("leads.toast.createFailed", {
            defaultValue: "Failed to create lead",
          }),
        ),
      });
    },
  });
};

export const useUpdateLead = (id?: string) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (values: LeadFormData) =>
      api.put(`/leads/${id}`, buildUpdateLeadPayload(values)),
    onSuccess: () => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("leads.toast.updated", {
          defaultValue: "Lead updated successfully",
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["lead", id] });
      navigate("/leads");
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("leads.toast.updateFailed", {
            defaultValue: "Failed to update lead",
          }),
        ),
      });
    },
  });
};
