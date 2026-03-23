import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import api, { getApiErrorMessage } from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";
import type { AppointmentFormData } from "@/pages/appointments/types";

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
  appointmentStartTime: values.appointmentStartTime,
  appointmentEndTime: normalizeOptionalString(values.appointmentEndTime),
  meetingType: values.meetingType,
  assignedToUserId: values.assignedToUserId
    ? Number(values.assignedToUserId)
    : null,
  notes: normalizeOptionalString(values.notes),
  nextStep: normalizeOptionalString(values.nextStep),
});

const buildUpdateAppointmentPayload = (values: AppointmentFormData) => ({
  appointmentDate: values.appointmentDate,
  appointmentStartTime: values.appointmentStartTime,
  appointmentEndTime: normalizeNullableString(values.appointmentEndTime),
  status: values.status,
  meetingType: values.meetingType,
  assignedToUserId: values.assignedToUserId
    ? Number(values.assignedToUserId)
    : null,
  notes: normalizeNullableString(values.notes),
  result: normalizeNullableString(values.result),
  nextStep: normalizeNullableString(values.nextStep),
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

type CreateAppointmentWithCustomerValues = {
  customer?: {
    fullName: string;
    mobile: string;
    mobile2?: string;
    email?: string;
    groomName?: string;
    brideName?: string;
    weddingDate?: string;
    guestCount?: string;
    venueId?: string;
    notes?: string;
  };
  customerId?: string;
  appointment: {
    appointmentDate: string;
    appointmentStartTime: string;
    appointmentEndTime?: string;
    assignedToUserId?: string;
    meetingType: AppointmentFormData["meetingType"];
    notes?: string;
    nextStep?: string;
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
        groomName: normalizeOptionalString(values.customer.groomName),
        brideName: normalizeOptionalString(values.customer.brideName),
        weddingDate: normalizeOptionalString(values.customer.weddingDate),
        guestCount: values.customer.guestCount?.trim()
          ? Number(values.customer.guestCount)
          : undefined,
        venueId: values.customer.venueId ? Number(values.customer.venueId) : null,
        notes: normalizeOptionalString(values.customer.notes),
      }
    : undefined,
  appointment: {
    appointmentDate: values.appointment.appointmentDate,
    appointmentStartTime: values.appointment.appointmentStartTime,
    appointmentEndTime: normalizeOptionalString(
      values.appointment.appointmentEndTime,
    ),
    assignedToUserId: values.appointment.assignedToUserId
      ? Number(values.appointment.assignedToUserId)
      : null,
    meetingType: values.appointment.meetingType,
    notes: normalizeOptionalString(values.appointment.notes),
    nextStep: normalizeOptionalString(values.appointment.nextStep),
  },
});

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
      console.log(error)
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
