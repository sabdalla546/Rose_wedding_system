import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import api, { getApiErrorMessage } from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";
import type { VenueFormData } from "@/pages/venues/types";

const normalizeOptionalString = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const buildVenuePayload = (values: VenueFormData) => ({
  name: values.name.trim(),
  city: normalizeOptionalString(values.city),
  area: normalizeOptionalString(values.area),
  address: normalizeOptionalString(values.address),
  phone: normalizeOptionalString(values.phone),
  contactPerson: normalizeOptionalString(values.contactPerson),
  notes: normalizeOptionalString(values.notes),
  isActive: values.isActive,
});

export const useCreateVenue = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (values: VenueFormData) =>
      api.post("/venues", buildVenuePayload(values)),
    onSuccess: () => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("venues.toast.created", {
          defaultValue: "Venue created successfully",
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["venues"] });
      navigate("/settings/venues");
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("venues.toast.createFailed", {
            defaultValue: "Failed to create venue",
          }),
        ),
      });
    },
  });
};

export const useUpdateVenue = (id?: string) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (values: VenueFormData) =>
      api.put(`/venues/${id}`, buildVenuePayload(values)),
    onSuccess: () => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("venues.toast.updated", {
          defaultValue: "Venue updated successfully",
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["venues"] });
      queryClient.invalidateQueries({ queryKey: ["venue", id] });
      navigate("/settings/venues");
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("venues.toast.updateFailed", {
            defaultValue: "Failed to update venue",
          }),
        ),
      });
    },
  });
};
