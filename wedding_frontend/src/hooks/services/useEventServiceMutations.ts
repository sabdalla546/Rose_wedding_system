import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import api, { getApiErrorMessage } from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";
import type {
  EventServiceItemFormData,
  EventServiceStatus,
} from "@/pages/services/types";

const normalizeNullableString = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const normalizeRequiredNumber = (value?: string, fallback = 0) => {
  const trimmed = value?.trim();
  return trimmed ? Number(trimmed) : fallback;
};

const buildUpdateEventServicePayload = (values: EventServiceItemFormData) => ({
  serviceId: values.serviceId ? Number(values.serviceId) : null,
  serviceNameSnapshot: normalizeNullableString(values.serviceNameSnapshot),
  category: values.category,
  notes: normalizeNullableString(values.notes),
  status: values.status,
  sortOrder: normalizeRequiredNumber(values.sortOrder, 0),
});

const normalizeOptionalString = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const buildCreateEventServicePayload = (values: EventServiceItemFormData) => ({
  eventId: values.eventId,
  serviceId: values.serviceId ? Number(values.serviceId) : undefined,
  serviceNameSnapshot: normalizeOptionalString(values.serviceNameSnapshot),
  category: values.category,
  notes: normalizeOptionalString(values.notes),
  status: (values.status || "confirmed") as EventServiceStatus,
  sortOrder: values.sortOrder?.trim() ? Number(values.sortOrder) : 0,
});

export const useCreateEventService = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (values: EventServiceItemFormData) =>
      api.post("/services/event-items", buildCreateEventServicePayload(values)),

    onSuccess: (_response, variables) => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("services.toast.eventServiceCreated", {
          defaultValue: "Event service added successfully",
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["event-service-items"] });
      queryClient.invalidateQueries({
        queryKey: ["event", String(variables.eventId)],
      });
    },

    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("services.toast.eventServiceCreateFailed", {
            defaultValue: "Failed to add event service",
          }),
        ),
      });
    },
  });
};
export const useUpdateEventService = (eventId: number) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: number;
      values: EventServiceItemFormData;
    }) =>
      api.put(
        `/services/event-items/${id}`,
        buildUpdateEventServicePayload(values),
      ),
    onSuccess: () => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("services.eventItemToast.updated", {
          defaultValue: "Event service updated successfully",
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["event-service-items"] });
      queryClient.invalidateQueries({ queryKey: ["event", String(eventId)] });
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("services.eventItemToast.updateFailed", {
            defaultValue: "Failed to update event service",
          }),
        ),
      });
    },
  });
};

export const useDeleteEventService = (eventId: number) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => api.delete(`/services/event-items/${id}`),
    onSuccess: () => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("services.eventItemToast.deleted", {
          defaultValue: "Event service deleted successfully",
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["event-service-items"] });
      queryClient.invalidateQueries({ queryKey: ["event", String(eventId)] });
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("services.eventItemToast.deleteFailed", {
            defaultValue: "Failed to delete event service",
          }),
        ),
      });
    },
  });
};
