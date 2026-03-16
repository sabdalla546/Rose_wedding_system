import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import api, { getApiErrorMessage } from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";
import type { ConvertLeadToCustomerData } from "@/pages/leads/types";

export const useConvertLeadToCustomer = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: number;
      values: ConvertLeadToCustomerData;
    }) =>
      api.post(`/leads/${id}/convert-to-customer`, {
        notes: values.notes?.trim() || undefined,
      }),
    onSuccess: (res, variables) => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("leads.toast.converted", {
          defaultValue: "Lead converted to customer successfully",
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({
        queryKey: ["lead", String(variables.id)],
      });
      queryClient.invalidateQueries({ queryKey: ["customers"] });

      const customerId = res.data?.data?.customer?.id;
      if (customerId) {
        navigate(`/customers/${customerId}`);
      }
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("leads.toast.convertFailed", {
            defaultValue: "Failed to convert lead to customer",
          }),
        ),
      });
    },
  });
};
