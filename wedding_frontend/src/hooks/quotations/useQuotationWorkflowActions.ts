import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/axios";
import { quotationsApi } from "@/lib/api/quotations";
import type { QuotationStatus } from "@/pages/quotations/types";

export const useQuotationWorkflowAction = (
  quotationId?: string | number,
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
      status: QuotationStatus;
      notes?: string;
    }) => quotationsApi.updateWorkflowStatus(quotationId as string, status, notes),
    onSuccess: () => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("quotations.workflowUpdated", {
          defaultValue: "Quotation workflow updated successfully",
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({
        queryKey: ["quotation", String(quotationId)],
      });
      if (eventId) {
        queryClient.invalidateQueries({ queryKey: ["event", String(eventId)] });
      }
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("quotations.workflowUpdateFailed", {
            defaultValue: "Failed to update quotation workflow",
          }),
        ),
      });
    },
  });
};
