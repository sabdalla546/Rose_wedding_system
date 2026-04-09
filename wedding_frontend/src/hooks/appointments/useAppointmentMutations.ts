import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getApiErrorMessage } from "@/lib/axios";
import {
  appointmentsApi,
  type CreateAppointmentWithCustomerValues,
} from "@/lib/api/appointments";
import { useHasPermission } from "@/hooks/useHasPermission";
import { useToast } from "@/hooks/use-toast";
import type {
  AppointmentFormData,
} from "@/pages/appointments/types";

const getAppointmentsSuccessRoute = (canReadCalendar: boolean) =>
  canReadCalendar ? "/appointments?view=calendar" : "/appointments";

export const useCreateAppointment = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const canReadCalendar = useHasPermission("appointments.calendar.read");

  return useMutation({
    mutationFn: (values: AppointmentFormData) => appointmentsApi.create(values),
    onSuccess: () => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("appointments.toast.created", {
          defaultValue: "Appointment created successfully",
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointments-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      navigate(getAppointmentsSuccessRoute(canReadCalendar));
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("appointments.toast.createFailed", {
            defaultValue: "Failed to create appointment",
          }),
        ),
      });
    },
  });
};

export const useCreateAppointmentWithCustomer = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const canReadCalendar = useHasPermission("appointments.calendar.read");

  return useMutation({
    mutationFn: (values: CreateAppointmentWithCustomerValues) =>
      appointmentsApi.createWithCustomer(values),
    onSuccess: () => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("appointments.toast.created", {
          defaultValue: "Appointment created successfully",
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointments-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      navigate(getAppointmentsSuccessRoute(canReadCalendar));
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("appointments.toast.createFailed", {
            defaultValue: "Failed to create appointment",
          }),
        ),
      });
    },
  });
};

export const useUpdateAppointment = (id?: string) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const canReadCalendar = useHasPermission("appointments.calendar.read");

  return useMutation({
    mutationFn: (values: AppointmentFormData) =>
      appointmentsApi.update(id as string, values),
    onSuccess: () => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("appointments.toast.updated", {
          defaultValue: "Appointment updated successfully",
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointments-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["appointment", id] });
      navigate(getAppointmentsSuccessRoute(canReadCalendar));
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("appointments.toast.updateFailed", {
            defaultValue: "Failed to update appointment",
          }),
        ),
      });
    },
  });
};
