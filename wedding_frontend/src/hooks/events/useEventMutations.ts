import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/axios";
import { eventsApi } from "@/lib/api/events";
import type { EventFormData } from "@/pages/events/types";

export const useCreateEvent = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (values: EventFormData) => eventsApi.create(values),
    onSuccess: () => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("events.toast.created", {
          defaultValue: "Event created successfully",
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["events-calendar"] });
      navigate("/events");
    },
    onError: (error) => {
      console.log(error);
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
    mutationFn: (values: EventFormData) => eventsApi.createFromSource(values),
    onSuccess: () => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("events.toast.createdFromSource", {
          defaultValue: "Event created from source successfully",
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["events-calendar"] });
      navigate("/events");
    },
    onError: (error) => {
      console.log(error);
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

export const useUpdateEvent = (
  id?: string,
  options?: {
    navigateOnSuccess?: boolean;
    onSuccess?: () => void;
  },
) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (values: EventFormData) => eventsApi.update(id as string, values),
    onSuccess: () => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("events.toast.updated", {
          defaultValue: "Event updated successfully",
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["event", id] });
      queryClient.invalidateQueries({ queryKey: ["events-calendar"] });
      options?.onSuccess?.();
      if (options?.navigateOnSuccess !== false) {
        navigate("/events");
      }
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
