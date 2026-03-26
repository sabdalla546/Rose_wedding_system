import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api, { getApiErrorMessage } from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";
import type { AppointmentFormData, AppointmentType } from "@/pages/appointments/types";

const normalizeOptionalString = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const normalizeNullableString = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const buildCreateAppointmentPayload = (values: AppointmentFormData) => ({
  customerId: Number(values.customerId),
  appointmentDate: values.appointmentDate,
  startTime: values.startTime,
  endTime: normalizeOptionalString(values.endTime),
  type: values.type,
  notes: normalizeOptionalString(values.notes),
});

const buildUpdateAppointmentPayload = (values: AppointmentFormData) => ({
  customerId: Number(values.customerId),
  appointmentDate: values.appointmentDate,
  startTime: values.startTime,
  endTime: normalizeNullableString(values.endTime),
  type: values.type,
  notes: normalizeNullableString(values.notes),
  status: values.status,
});

type CreateAppointmentWithCustomerValues = {
  customer?: {
    fullName: string;
    mobile: string;
    mobile2?: string;
    email?: string;
    notes?: string;
  };
  customerId?: string;
  appointment: {
    appointmentDate: string;
    startTime: string;
    endTime?: string;
    type: AppointmentType;
    notes?: string;
  };
};

const buildCreateAppointmentWithCustomerPayload = (
  values: CreateAppointmentWithCustomerValues,
) => ({
  customerId: values.customerId?.trim() ? Number(values.customerId) : undefined,
  customer: values.customer
    ? {
        fullName: values.customer.fullName.trim(),
        mobile: values.customer.mobile.trim(),
        mobile2: normalizeOptionalString(values.customer.mobile2),
        email: normalizeOptionalString(values.customer.email),
        notes: normalizeOptionalString(values.customer.notes),
      }
    : undefined,
  appointment: {
    appointmentDate: values.appointment.appointmentDate,
    startTime: values.appointment.startTime,
    endTime: normalizeOptionalString(values.appointment.endTime),
    type: values.appointment.type,
    notes: normalizeOptionalString(values.appointment.notes),
  },
});

export const useCreateAppointment = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (values: AppointmentFormData) =>
      api.post("/appointments", buildCreateAppointmentPayload(values)),
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
      navigate("/appointments");
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

  return useMutation({
    mutationFn: async (values: CreateAppointmentWithCustomerValues) =>
      api.post(
        "/appointments/create-with-customer",
        buildCreateAppointmentWithCustomerPayload(values),
      ),
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
      navigate("/appointments");
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

  return useMutation({
    mutationFn: async (values: AppointmentFormData) =>
      api.put(`/appointments/${id}`, buildUpdateAppointmentPayload(values)),
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
      navigate("/appointments");
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
