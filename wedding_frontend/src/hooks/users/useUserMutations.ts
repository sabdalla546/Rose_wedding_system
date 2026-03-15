/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import api, { getApiErrorMessage } from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";

export interface UserFormValues {
  fullName: string;
  email: string;
  phone?: string;
  roleIds: number[];
  isActive: boolean;
  password?: string;
}

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (values: UserFormValues) => {
      return api.post("/users", {
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        roleIds: values.roleIds || [],
        isActive: values.isActive,
        password: values.password,
      });
    },
    onSuccess: () => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("users.toast.created", {
          defaultValue: "User created successfully",
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["users"] });
      navigate("/settings/team/users");
    },
    onError: (error: any) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description:
          getApiErrorMessage(
            error,
            t("users.toast.createFailed", {
              defaultValue: "Failed to create user",
            }),
          ) ||
          t("users.toast.createFailed", {
            defaultValue: "Failed to create user",
          }),
      });
    },
  });
};

export const useUpdateUser = (id?: string) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (values: UserFormValues) => {
      const payload: Record<string, unknown> = {
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        roleIds: values.roleIds || [],
        isActive: values.isActive,
      };

      if (values.password?.trim()) {
        payload.password = values.password;
      }

      return api.put(`/users/${id}`, payload);
    },
    onSuccess: () => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("users.toast.updated", {
          defaultValue: "User updated successfully",
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user", id] });
      navigate("/settings/team/users");
    },
    onError: (error: any) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description:
          getApiErrorMessage(
            error,
            t("users.toast.updateFailed", {
              defaultValue: "Failed to update user",
            }),
          ) ||
          t("users.toast.updateFailed", {
            defaultValue: "Failed to update user",
          }),
      });
    },
  });
};
