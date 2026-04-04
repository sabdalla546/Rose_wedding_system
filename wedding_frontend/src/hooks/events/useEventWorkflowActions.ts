import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/axios";
import { eventsApi } from "@/lib/api/events";
import type { EventStatus } from "@/pages/events/types";

export const useEventWorkflowAction = (eventId?: string | number) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async ({
      status,
      notes,
    }: {
      status: EventStatus;
      notes?: string;
    }) => eventsApi.updateWorkflowStatus(eventId as string, status, notes),
    onSuccess: () => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("events.workflowUpdated", {
          defaultValue: "Event workflow updated successfully",
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["events-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["event", String(eventId)] });
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["execution-brief-by-event"] });
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("events.workflowUpdateFailed", {
            defaultValue: "Failed to update event workflow",
          }),
        ),
      });
    },
  });
};
