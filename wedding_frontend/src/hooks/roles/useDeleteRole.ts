import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import api, { getApiErrorMessage } from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";

export const useDeleteRole = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (id: number) => api.delete(`/roles/${id}`),
    onSuccess: () => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("roles.toast.deleted", {
          defaultValue: "Role deleted successfully",
        }),
        variant: "success",
      });

      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
    onError: (error: unknown) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("roles.toast.deleteFailed", {
            defaultValue: "Failed to delete role",
          }),
        ),
      });
    },
  });
};
