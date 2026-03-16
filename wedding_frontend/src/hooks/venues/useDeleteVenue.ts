import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import api, { getApiErrorMessage } from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";

export const useDeleteVenue = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (id: number) => api.delete(`/venues/${id}`),
    onSuccess: () => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("venues.toast.deleted", {
          defaultValue: "Venue deleted successfully",
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["venues"] });
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("venues.toast.deleteFailed", {
            defaultValue: "Failed to delete venue",
          }),
        ),
      });
    },
  });
};
