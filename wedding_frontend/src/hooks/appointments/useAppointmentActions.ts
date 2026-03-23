import {
  useMutation,
  useQueryClient,
  type MutateOptions,
} from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import api, { getApiErrorMessage } from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";
import type {
  CancelAppointmentData,
  CompleteAppointmentData,
  ConfirmAppointmentData,
  RescheduleAppointmentData,
} from "@/pages/appointments/types";

function useAppointmentActionMutation<TPayload>(
  endpointBuilder: (id: number) => string,
  successMessageKey: string,
  successMessageDefault: string,
  failureMessageKey: string,
  failureMessageDefault: string,
) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: number;
      values: TPayload;
    }) => api.patch(endpointBuilder(id), values),
    onSuccess: (_res, variables) => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t(successMessageKey, {
          defaultValue: successMessageDefault,
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointments-calendar"] });
      queryClient.invalidateQueries({
        queryKey: ["appointment", String(variables.id)],
      });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t(failureMessageKey, {
            defaultValue: failureMessageDefault,
          }),
        ),
      });
    },
  });
}

export const useConfirmAppointment = () =>
  useAppointmentActionMutation<ConfirmAppointmentData>(
    (id) => `/appointments/${id}/confirm`,
    "appointments.toast.confirmed",
    "Appointment confirmed successfully",
    "appointments.toast.confirmFailed",
    "Failed to confirm appointment",
  );

export const useCompleteAppointment = () =>
  useAppointmentActionMutation<CompleteAppointmentData>(
    (id) => `/appointments/${id}/complete`,
    "appointments.toast.completed",
    "Appointment completed successfully",
    "appointments.toast.completeFailed",
    "Failed to complete appointment",
  );

export const useCancelAppointment = () =>
  useAppointmentActionMutation<CancelAppointmentData>(
    (id) => `/appointments/${id}/cancel`,
    "appointments.toast.cancelled",
    "Appointment cancelled successfully",
    "appointments.toast.cancelFailed",
    "Failed to cancel appointment",
  );

export const useRescheduleAppointment = () => {
  const mutation = useAppointmentActionMutation<{
    appointmentDate: string;
    appointmentStartTime: string;
    appointmentEndTime?: string | null;
    assignedToUserId?: number | null;
    notes?: string;
    nextStep?: string;
  }>(
    (id) => `/appointments/${id}/reschedule`,
    "appointments.toast.rescheduled",
    "Appointment rescheduled successfully",
    "appointments.toast.rescheduleFailed",
    "Failed to reschedule appointment",
  );

  return {
    ...mutation,
    mutateReschedule: ({
      id,
      values,
    }: {
      id: number;
      values: RescheduleAppointmentData;
    }, options?: MutateOptions<unknown, unknown, { id: number; values: { appointmentDate: string; appointmentStartTime: string; appointmentEndTime?: string | null; assignedToUserId?: number | null; notes?: string; nextStep?: string } }, unknown>) =>
      mutation.mutate({
        id,
        values: {
          appointmentDate: values.appointmentDate,
          appointmentStartTime: values.appointmentStartTime,
          appointmentEndTime: values.appointmentEndTime?.trim() || null,
          assignedToUserId: values.assignedToUserId
            ? Number(values.assignedToUserId)
            : null,
          notes: values.notes?.trim() || undefined,
          nextStep: values.nextStep?.trim() || undefined,
        },
      }, options),
  };
};
