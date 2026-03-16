import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import api, { getApiErrorMessage } from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (id: number) => api.delete(`/customers/${id}`),
    onSuccess: () => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("customers.toast.deleted", {
          defaultValue: "Customer deleted successfully",
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("customers.toast.deleteFailed", {
            defaultValue: "Failed to delete customer",
          }),
        ),
      });
    },
  });
};
