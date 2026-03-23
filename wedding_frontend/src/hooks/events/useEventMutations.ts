import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useToast } from "@/hooks/use-toast";
import api, { getApiErrorMessage } from "@/lib/axios";
import type { EventFormData } from "@/pages/events/types";

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

const buildCreateEventPayload = (values: EventFormData) => ({
  customerId: values.customerId ? Number(values.customerId) : null,
  eventDate: values.eventDate,
  venueId: values.venueId ? Number(values.venueId) : null,
  venueNameSnapshot: normalizeOptionalString(values.venueNameSnapshot),
  groomName: normalizeOptionalString(values.groomName),
  brideName: normalizeOptionalString(values.brideName),
  guestCount: normalizeGuestCountForCreate(values.guestCount),
  contractNumber: normalizeOptionalString(values.contractNumber),
  title: normalizeOptionalString(values.title),
  notes: normalizeOptionalString(values.notes),
  status: values.status || undefined,
});

const buildCreateEventFromSourcePayload = (values: EventFormData) => ({
  customerId: values.customerId ? Number(values.customerId) : null,
  eventDate: normalizeOptionalString(values.eventDate),
  groomName: normalizeNullableString(values.groomName),
  brideName: normalizeNullableString(values.brideName),
  contractNumber: normalizeNullableString(values.contractNumber),
  title: normalizeNullableString(values.title),
  notes: normalizeNullableString(values.notes),
});

const buildUpdateEventPayload = (values: EventFormData) => ({
  customerId: values.customerId ? Number(values.customerId) : null,
  eventDate: normalizeOptionalString(values.eventDate),
  venueId: values.venueId ? Number(values.venueId) : null,
  venueNameSnapshot: normalizeNullableString(values.venueNameSnapshot),
  groomName: normalizeNullableString(values.groomName),
  brideName: normalizeNullableString(values.brideName),
  guestCount: normalizeGuestCountForUpdate(values.guestCount),
  contractNumber: normalizeNullableString(values.contractNumber),
  title: normalizeNullableString(values.title),
  notes: normalizeNullableString(values.notes),
  status: values.status || undefined,
});

export const useCreateEvent = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (values: EventFormData) =>
      api.post("/events", buildCreateEventPayload(values)),
    onSuccess: () => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("events.toast.created", {
          defaultValue: "Event created successfully",
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["events"] });
      navigate("/events");
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("events.toast.createFailed", {
            defaultValue: "Failed to create event",
          }),
        ),
      });
    },
  });
};

export const useCreateEventFromSource = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (values: EventFormData) =>
      api.post("/events/create-from-source", buildCreateEventFromSourcePayload(values)),
    onSuccess: () => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("events.toast.createdFromSource", {
          defaultValue: "Event created from source successfully",
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["events"] });
      navigate("/events");
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("events.toast.createFromSourceFailed", {
            defaultValue: "Failed to create event from source",
          }),
        ),
      });
    },
  });
};

export const useUpdateEvent = (id?: string) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (values: EventFormData) =>
      api.put(`/events/${id}`, buildUpdateEventPayload(values)),
    onSuccess: () => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("events.toast.updated", {
          defaultValue: "Event updated successfully",
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["event", id] });
      navigate("/events");
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("events.toast.updateFailed", {
            defaultValue: "Failed to update event",
          }),
        ),
      });
    },
  });
};
