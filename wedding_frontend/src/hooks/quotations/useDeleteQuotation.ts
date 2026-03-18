import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import api, { getApiErrorMessage } from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";

export const useDeleteQuotation = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async ({
      id,
      eventId,
      redirectToList,
    }: {
      id: number;
      eventId?: number | null;
      redirectToList?: boolean;
    }) => {
      await api.delete(`/quotations/${id}`);
      return { id, eventId, redirectToList };
    },
    onSuccess: ({ id, eventId, redirectToList }) => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("quotations.toast.deleted", {
          defaultValue: "Quotation deleted successfully",
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.removeQueries({ queryKey: ["quotation", String(id)] });

      if (eventId) {
        queryClient.invalidateQueries({ queryKey: ["event", String(eventId)] });
      }

      if (redirectToList) {
        navigate("/quotations");
      }
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("quotations.toast.deleteFailed", {
            defaultValue: "Failed to delete quotation",
          }),
        ),
      });
    },
  });
};
