import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/axios";
import { contractsApi } from "@/lib/api/contracts";
import type { ContractStatus } from "@/pages/contracts/types";

export const useContractWorkflowAction = (
  contractId?: string | number,
  options?: { eventId?: string | number; quotationId?: string | number },
) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async ({
      status,
      notes,
    }: {
      status: ContractStatus;
      notes?: string;
    }) => contractsApi.updateWorkflowStatus(contractId as string, status, notes),
    onSuccess: () => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("contracts.workflowUpdated", {
          defaultValue: "Contract workflow updated successfully",
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({
        queryKey: ["contract", String(contractId)],
      });
      if (options?.eventId) {
        queryClient.invalidateQueries({
          queryKey: ["event", String(options.eventId)],
        });
      }
      if (options?.quotationId) {
        queryClient.invalidateQueries({
          queryKey: ["quotation", String(options.quotationId)],
        });
        queryClient.invalidateQueries({ queryKey: ["quotations"] });
      }
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("contracts.workflowUpdateFailed", {
            defaultValue: "Failed to update contract workflow",
          }),
        ),
      });
    },
  });
};
