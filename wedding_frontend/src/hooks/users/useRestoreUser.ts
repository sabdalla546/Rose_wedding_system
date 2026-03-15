/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import api, { getApiErrorMessage } from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";

export const useRestoreUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (id: number) => api.patch(`/users/${id}/restore`),
    onSuccess: () => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("users.toast.restored", {
          defaultValue: "User restored successfully",
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
            t("users.toast.restoreFailed", {
              defaultValue: "Failed to restore user",
            }),
          ) ||
          t("users.toast.restoreFailed", {
            defaultValue: "Failed to restore user",
          }),
      });
    },
  });
};
