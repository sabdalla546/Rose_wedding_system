import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useToast } from "@/hooks/use-toast";
import { getApiErrorMessage } from "@/lib/axios";
import { contractAmendmentsApi } from "@/lib/api/contract-amendments";
import type {
  ContractAmendmentApplyFormData,
  ContractAmendmentApproveFormData,
  ContractAmendmentCreateFormData,
  ContractAmendmentItemCreateFormData,
  ContractAmendmentItemUpdateFormData,
  ContractAmendmentRejectFormData,
} from "@/pages/contracts/amendments/types";

import { contractAmendmentKeys } from "./useContractAmendments";

const invalidateContractAmendmentQueries = async ({
  amendmentId,
  contractId,
  queryClient,
}: {
  amendmentId?: string | number;
  contractId?: string | number;
  queryClient: ReturnType<typeof useQueryClient>;
}) => {
  await queryClient.invalidateQueries({
    queryKey: contractAmendmentKeys.all,
  });

  if (amendmentId) {
    await queryClient.invalidateQueries({
      queryKey: contractAmendmentKeys.detail(amendmentId),
    });
  }

  if (contractId) {
    await queryClient.invalidateQueries({
      queryKey: ["contract", String(contractId)],
    });
  }
};

export const useCreateContractAmendment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (values: ContractAmendmentCreateFormData) =>
      contractAmendmentsApi.create(values),
    onSuccess: async (amendment) => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("contracts.amendments.toast.created", {
          defaultValue: "Contract amendment created successfully",
        }),
      });

      await invalidateContractAmendmentQueries({
        amendmentId: amendment.id,
        contractId: amendment.contractId,
        queryClient,
      });
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("contracts.amendments.toast.createFailed", {
            defaultValue: "Failed to create contract amendment",
          }),
        ),
      });
    },
  });
};

export const useAddContractAmendmentItem = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({
      amendmentId,
      values,
    }: {
      amendmentId: string | number;
      values: ContractAmendmentItemCreateFormData;
    }) => contractAmendmentsApi.addItem(amendmentId, values),
    onSuccess: async (item) => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("contracts.amendments.toast.itemCreated", {
          defaultValue: "Amendment item added successfully",
        }),
      });

      await invalidateContractAmendmentQueries({
        amendmentId: item.amendmentId,
        queryClient,
      });
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("contracts.amendments.toast.itemCreateFailed", {
            defaultValue: "Failed to add amendment item",
          }),
        ),
      });
    },
  });
};

export const useUpdateContractAmendmentItem = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({
      amendmentId,
      itemId,
      values,
    }: {
      amendmentId: string | number;
      itemId: string | number;
      values: ContractAmendmentItemUpdateFormData;
    }) => contractAmendmentsApi.updateItem(amendmentId, itemId, values),
    onSuccess: async (item) => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("contracts.amendments.toast.itemUpdated", {
          defaultValue: "Amendment item updated successfully",
        }),
      });

      await invalidateContractAmendmentQueries({
        amendmentId: item.amendmentId,
        queryClient,
      });
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("contracts.amendments.toast.itemUpdateFailed", {
            defaultValue: "Failed to update amendment item",
          }),
        ),
      });
    },
  });
};

export const useDeleteContractAmendmentItem = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({
      itemId,
      amendmentId,
    }: {
      itemId: string | number;
      amendmentId: string | number;
    }) =>
      contractAmendmentsApi.deleteItem(itemId).then(() => ({
        itemId,
        amendmentId,
      })),
    onSuccess: async ({ amendmentId }) => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("contracts.amendments.toast.itemDeleted", {
          defaultValue: "Amendment item deleted successfully",
        }),
      });

      await invalidateContractAmendmentQueries({
        amendmentId,
        queryClient,
      });
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("contracts.amendments.toast.itemDeleteFailed", {
            defaultValue: "Failed to delete amendment item",
          }),
        ),
      });
    },
  });
};

export const useApproveContractAmendment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({
      amendmentId,
      values,
    }: {
      amendmentId: string | number;
      values?: ContractAmendmentApproveFormData;
    }) => contractAmendmentsApi.approve(amendmentId, values),
    onSuccess: async (amendment) => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("contracts.amendments.toast.approved", {
          defaultValue: "Contract amendment approved successfully",
        }),
      });

      await invalidateContractAmendmentQueries({
        amendmentId: amendment.id,
        queryClient,
      });
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("contracts.amendments.toast.approveFailed", {
            defaultValue: "Failed to approve contract amendment",
          }),
        ),
      });
    },
  });
};

export const useRejectContractAmendment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({
      amendmentId,
      values,
    }: {
      amendmentId: string | number;
      values: ContractAmendmentRejectFormData;
    }) => contractAmendmentsApi.reject(amendmentId, values),
    onSuccess: async (amendment) => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("contracts.amendments.toast.rejected", {
          defaultValue: "Contract amendment rejected successfully",
        }),
      });

      await invalidateContractAmendmentQueries({
        amendmentId: amendment.id,
        queryClient,
      });
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("contracts.amendments.toast.rejectFailed", {
            defaultValue: "Failed to reject contract amendment",
          }),
        ),
      });
    },
  });
};

export const useApplyContractAmendment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({
      amendmentId,
      contractId,
      values,
    }: {
      amendmentId: string | number;
      contractId: string | number;
      values?: ContractAmendmentApplyFormData;
    }) =>
      contractAmendmentsApi.apply(amendmentId, values).then((amendment) => ({
        amendment,
        contractId,
      })),
    onSuccess: async ({ amendment, contractId }) => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("contracts.amendments.toast.applied", {
          defaultValue: "Contract amendment applied successfully",
        }),
      });

      await invalidateContractAmendmentQueries({
        amendmentId: amendment.id,
        contractId,
        queryClient,
      });
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("contracts.amendments.toast.applyFailed", {
            defaultValue: "Failed to apply contract amendment",
          }),
        ),
      });
    },
  });
};
