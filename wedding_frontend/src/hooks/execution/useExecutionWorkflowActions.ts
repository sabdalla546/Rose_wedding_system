import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/axios";
import { executionBriefsApi } from "@/lib/api/execution-briefs";
import type { ExecutionBriefStatus } from "@/pages/execution/types";

export const useExecutionWorkflowAction = (
  briefId?: string | number,
  eventId?: string | number,
) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async ({
      status,
      notes,
    }: {
      status: ExecutionBriefStatus;
      notes?: {
        generalNotes?: string | null;
        clientNotes?: string | null;
        designerNotes?: string | null;
      };
    }) => executionBriefsApi.updateWorkflowStatus(briefId as string, status, notes),
    onSuccess: () => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("execution.workflowUpdated", {
          defaultValue: "Execution brief workflow updated successfully",
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["execution-briefs"] });
      queryClient.invalidateQueries({
        queryKey: ["execution-brief", String(briefId)],
      });
      if (eventId) {
        queryClient.invalidateQueries({
          queryKey: ["execution-brief-by-event", String(eventId)],
        });
        queryClient.invalidateQueries({ queryKey: ["event", String(eventId)] });
      }
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("execution.workflowUpdateFailed", {
            defaultValue: "Failed to update execution workflow",
          }),
        ),
      });
    },
  });
};
