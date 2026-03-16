import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import api, { getApiErrorMessage } from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";

export const useDeleteLead = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (id: number) => api.delete(`/leads/${id}`),
    onSuccess: () => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("leads.toast.deleted", {
          defaultValue: "Lead deleted successfully",
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("leads.toast.deleteFailed", {
            defaultValue: "Failed to delete lead",
          }),
        ),
      });
    },
  });
};
