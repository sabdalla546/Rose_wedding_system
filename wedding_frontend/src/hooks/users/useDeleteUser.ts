/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import api, { getApiErrorMessage } from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (id: number) => api.delete(`/users/${id}`),
    onSuccess: () => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("users.toast.deleted", {
          defaultValue: "User deleted successfully",
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error: any) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description:
          getApiErrorMessage(
            error,
            t("users.toast.deleteFailed", {
              defaultValue: "Failed to delete user",
            }),
          ) ||
          t("users.toast.deleteFailed", {
            defaultValue: "Failed to delete user",
          }),
      });
    },
  });
};
