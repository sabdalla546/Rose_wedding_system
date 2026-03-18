import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import api, { getApiErrorMessage } from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";

export const useDeleteContract = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async ({
      id,
      eventId,
      quotationId,
      redirectToList,
    }: {
      id: number;
      eventId?: number | null;
      quotationId?: number | null;
      redirectToList?: boolean;
    }) => {
      await api.delete(`/contracts/${id}`);
      return { id, eventId, quotationId, redirectToList };
    },
    onSuccess: ({ id, eventId, quotationId, redirectToList }) => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("contracts.toast.deleted", {
          defaultValue: "Contract deleted successfully",
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.removeQueries({ queryKey: ["contract", String(id)] });

      if (eventId) {
        queryClient.invalidateQueries({ queryKey: ["event", String(eventId)] });
      }

      if (quotationId) {
        queryClient.invalidateQueries({ queryKey: ["quotation", String(quotationId)] });
        queryClient.invalidateQueries({ queryKey: ["quotations"] });
      }

      if (redirectToList) {
        navigate("/contracts");
      }
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("contracts.toast.deleteFailed", {
            defaultValue: "Failed to delete contract",
          }),
        ),
      });
    },
  });
};
