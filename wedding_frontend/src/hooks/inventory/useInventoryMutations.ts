import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  createInventoryItem,
  deleteInventoryItem,
  updateInventoryItem,
} from "@/lib/api/inventory";
import { getApiErrorMessage } from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";
import type { InventoryFormData } from "@/pages/inventory/types";

export const useCreateInventoryItem = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (values: InventoryFormData) => createInventoryItem(values),
    onSuccess: () => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("inventory.toast.created", {
          defaultValue: "Inventory item created successfully",
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      navigate("/inventory");
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("inventory.toast.createFailed", {
            defaultValue: "Failed to create inventory item",
          }),
        ),
      });
    },
  });
};

export const useUpdateInventoryItem = (id?: string) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (values: InventoryFormData) => updateInventoryItem(id!, values),
    onSuccess: async () => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("inventory.toast.updated", {
          defaultValue: "Inventory item updated successfully",
        }),
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["inventory"] }),
        queryClient.invalidateQueries({ queryKey: ["inventory-item", id] }),
      ]);

      navigate("/inventory");
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("inventory.toast.updateFailed", {
            defaultValue: "Failed to update inventory item",
          }),
        ),
      });
    },
  });
};

export const useDeleteInventoryItem = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number | string) => deleteInventoryItem(id),
    onSuccess: async (_result, id) => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("inventory.toast.deleted", {
          defaultValue: "Inventory item deleted successfully",
        }),
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["inventory"] }),
        queryClient.removeQueries({
          queryKey: ["inventory-item", String(id)],
        }),
      ]);
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("inventory.toast.deleteFailed", {
            defaultValue: "Failed to delete inventory item",
          }),
        ),
      });
    },
  });
};
