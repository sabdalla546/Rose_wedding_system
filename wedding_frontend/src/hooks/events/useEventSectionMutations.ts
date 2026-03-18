import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useToast } from "@/hooks/use-toast";
import api, { getApiErrorMessage } from "@/lib/axios";
import type { EventSectionType } from "@/pages/events/types";

type EventSectionPayload = {
  eventId: number;
  sectionType: EventSectionType;
  title?: string;
  sortOrder?: number;
  data: Record<string, unknown>;
  notes?: string;
  isCompleted?: boolean;
};

type UpdateEventSectionPayload = Omit<EventSectionPayload, "eventId">;

const normalizeOptionalString = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const normalizeNullableString = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const buildCreateSectionPayload = (values: EventSectionPayload) => ({
  eventId: values.eventId,
  sectionType: values.sectionType,
  title: normalizeOptionalString(values.title),
  sortOrder: values.sortOrder ?? 0,
  data: values.data,
  notes: normalizeOptionalString(values.notes),
  isCompleted: values.isCompleted ?? false,
});

const buildUpdateSectionPayload = (values: UpdateEventSectionPayload) => ({
  sectionType: values.sectionType,
  title: normalizeNullableString(values.title),
  sortOrder: values.sortOrder ?? 0,
  data: values.data,
  notes: normalizeNullableString(values.notes),
  isCompleted: values.isCompleted ?? false,
});

export const useCreateEventSection = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (values: EventSectionPayload) =>
      api.post("/events/sections", buildCreateSectionPayload(values)),
    onSuccess: (_response, variables) => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("events.sectionsToast.created", {
          defaultValue: "Section created successfully",
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["event", String(variables.eventId)] });
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("events.sectionsToast.createFailed", {
            defaultValue: "Failed to create section",
          }),
        ),
      });
    },
  });
};

export const useUpdateEventSection = (eventId: number) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: number;
      values: UpdateEventSectionPayload;
    }) => api.put(`/events/sections/${id}`, buildUpdateSectionPayload(values)),
    onSuccess: () => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("events.sectionsToast.updated", {
          defaultValue: "Section updated successfully",
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["event", String(eventId)] });
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("events.sectionsToast.updateFailed", {
            defaultValue: "Failed to update section",
          }),
        ),
      });
    },
  });
};

export const useDeleteEventSection = (eventId: number) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => api.delete(`/events/sections/${id}`),
    onSuccess: () => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("events.sectionsToast.deleted", {
          defaultValue: "Section deleted successfully",
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["event", String(eventId)] });
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("events.sectionsToast.deleteFailed", {
            defaultValue: "Failed to delete section",
          }),
        ),
      });
    },
  });
};
