import { useQuery } from "@tanstack/react-query";

import api from "@/lib/axios";
import type {
  Appointment,
  AppointmentResponse,
  AppointmentsCalendarResponse,
  AppointmentsResponse,
} from "@/pages/appointments/types";

interface UseAppointmentsParams {
  currentPage: number;
  itemsPerPage: number;
  status: "all" | Appointment["status"];
  customerId: string;
  venueId?: string;
  assignedToUserId?: string;
  dateFrom: string;
  dateTo: string;
}

export const useAppointments = ({
  currentPage,
  itemsPerPage,
  status,
  customerId,
  dateFrom,
  dateTo,
}: UseAppointmentsParams) => {
  return useQuery<AppointmentsResponse>({
    queryKey: [
      "appointments",
      currentPage,
      itemsPerPage,
      status,
      customerId,
      dateFrom,
      dateTo,
    ],
    queryFn: async () => {
      const res = await api.get("/appointments", {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          status: status === "all" ? undefined : status,
          customerId: customerId ? Number(customerId) : undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        },
      });

      return res.data;
    },
  });
};

export const useAppointment = (id?: string) => {
  return useQuery<Appointment>({
    queryKey: ["appointment", id],
    queryFn: async () => {
      const res = await api.get<AppointmentResponse>(`/appointments/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
};

export const useAppointmentsCalendar = ({
  dateFrom,
  dateTo,
  status = "all",
  assignedUserId = "",
}: {
  dateFrom: string;
  dateTo: string;
  status?: "all" | Appointment["status"];
  assignedUserId?: string;
}) => {
  return useQuery<Appointment[]>({
    queryKey: ["appointments-calendar", dateFrom, dateTo, status, assignedUserId],
    queryFn: async () => {
      const res = await api.get<AppointmentsCalendarResponse>(
        "/appointments/calendar",
        {
          params: {
            dateFrom,
            dateTo,
            status: status === "all" ? undefined : status,
            assignedUserId: assignedUserId ? Number(assignedUserId) : undefined,
          },
        },
      );

      return res.data.data;
    },
    enabled: Boolean(dateFrom && dateTo),
  });
};
