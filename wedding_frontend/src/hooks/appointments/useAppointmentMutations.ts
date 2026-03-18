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
  leadId: Number(values.leadId),
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
      queryClient.invalidateQueries({ queryKey: ["leads"] });
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

type CreateAppointmentWithLeadValues = {
  lead: {
    fullName: string;
    mobile: string;
    mobile2?: string;
    email?: string;
    weddingDate: string;
    guestCount?: string;
    venueId?: string;
    venueNameSnapshot?: string;
    source?: string;
    notes?: string;
  };
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

const buildCreateAppointmentWithLeadPayload = (
  values: CreateAppointmentWithLeadValues,
) => ({
  lead: {
    fullName: values.lead.fullName.trim(),
    mobile: values.lead.mobile.trim(),
    mobile2: normalizeOptionalString(values.lead.mobile2),
    email: normalizeOptionalString(values.lead.email),
    weddingDate: values.lead.weddingDate,
    guestCount: values.lead.guestCount?.trim()
      ? Number(values.lead.guestCount)
      : undefined,
    venueId: values.lead.venueId ? Number(values.lead.venueId) : null,
    venueNameSnapshot: normalizeOptionalString(values.lead.venueNameSnapshot),
    source: normalizeOptionalString(values.lead.source),
    notes: normalizeOptionalString(values.lead.notes),
  },
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

export const useCreateAppointmentWithLead = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (values: CreateAppointmentWithLeadValues) =>
      api.post(
        "/appointments/create-with-lead",
        buildCreateAppointmentWithLeadPayload(values),
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
      queryClient.invalidateQueries({ queryKey: ["leads"] });
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
