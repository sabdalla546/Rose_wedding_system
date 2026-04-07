import {
  useMutation,
  useQueryClient,
  type MutateOptions,
} from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getApiErrorMessage } from "@/lib/axios";
import { appointmentsApi } from "@/lib/api/appointments";
import { useToast } from "@/hooks/use-toast";
import type {
  AttendAppointmentData,
  CancelAppointmentData,
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
    mutationFn: async ({ id, values }: { id: number; values: TPayload }) => {
      const endpoint = endpointBuilder(id);

      if (endpoint.endsWith("/confirm")) {
        return appointmentsApi.confirm(id, values as ConfirmAppointmentData);
      }
      if (endpoint.endsWith("/attend")) {
        return appointmentsApi.attend(id, values as AttendAppointmentData);
      }
      if (endpoint.endsWith("/cancel")) {
        return appointmentsApi.cancel(id, values as CancelAppointmentData);
      }

      return appointmentsApi.reschedule(
        id,
        values as RescheduleAppointmentData,
      );
    },
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
      queryClient.invalidateQueries({ queryKey: ["events"] });
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

export const useAttendAppointment = () =>
  useAppointmentActionMutation<AttendAppointmentData>(
    (id) => `/appointments/${id}/attend`,
    "appointments.toast.attended",
    "Appointment attended successfully",
    "appointments.toast.attendFailed",
    "Failed to mark appointment as attended",
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
    startTime: string;
    endTime?: string | null;
    notes?: string;
  }>(
    (id) => `/appointments/${id}/reschedule`,
    "appointments.toast.rescheduled",
    "Appointment rescheduled successfully",
    "appointments.toast.rescheduleFailed",
    "Failed to reschedule appointment",
  );

  return {
    ...mutation,
    mutateReschedule: (
      {
        id,
        values,
      }: {
        id: number;
        values: RescheduleAppointmentData;
      },
      options?: MutateOptions<
        unknown,
        unknown,
        {
          id: number;
          values: {
            appointmentDate: string;
            startTime: string;
            endTime?: string | null;
            notes?: string;
          };
        },
        unknown
      >,
    ) =>
      mutation.mutate(
        {
          id,
          values: {
            appointmentDate: values.appointmentDate,
            startTime: values.startTime,
            endTime: values.endTime?.trim() || null,
            notes: values.notes?.trim() || undefined,
          },
        },
        options,
      ),
  };
};
