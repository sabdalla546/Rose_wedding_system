import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import api, { getApiErrorMessage } from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";
import type { MarkLeadLostData } from "@/pages/leads/types";

export const useMarkLeadLost = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: number;
      values: MarkLeadLostData;
    }) =>
      api.post(`/leads/${id}/mark-lost`, {
        reason: values.reason?.trim() || undefined,
        notes: values.notes?.trim() || undefined,
      }),
    onSuccess: (_res, variables) => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("leads.toast.markedLost", {
          defaultValue: "Lead marked as lost",
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({
        queryKey: ["lead", String(variables.id)],
      });
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("leads.toast.markLostFailed", {
            defaultValue: "Failed to mark lead as lost",
          }),
        ),
      });
    },
  });
};
