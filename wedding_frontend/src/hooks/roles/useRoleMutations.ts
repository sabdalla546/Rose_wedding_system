import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import api, { getApiErrorMessage } from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";

export interface RoleFormValues {
  name: string;
  description?: string;
  permissionIds: number[];
}

export const useCreateRole = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (values: RoleFormValues) =>
      api.post("/roles", {
        name: values.name,
        description: values.description?.trim() || undefined,
        permissionIds: values.permissionIds,
      }),
    onSuccess: () => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("roles.toast.created", {
          defaultValue: "Role created successfully",
        }),
        variant: "success",
      });

      queryClient.invalidateQueries({ queryKey: ["roles"] });
      navigate("/settings/team/roles");
    },
    onError: (error: unknown) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("roles.toast.createFailed", {
            defaultValue: "Failed to create role",
          }),
        ),
      });
    },
  });
};

export const useUpdateRole = (id?: string) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (values: RoleFormValues) =>
      api.put(`/roles/${id}`, {
        name: values.name,
        description: values.description?.trim() || undefined,
        permissionIds: values.permissionIds,
      }),
    onSuccess: () => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("roles.toast.updated", {
          defaultValue: "Role updated successfully",
        }),
        variant: "success",
      });

      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.invalidateQueries({ queryKey: ["role", id] });
      navigate("/settings/team/roles");
    },
    onError: (error: unknown) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("roles.toast.updateFailed", {
            defaultValue: "Failed to update role",
          }),
        ),
      });
    },
  });
};
