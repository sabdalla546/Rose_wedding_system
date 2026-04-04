import { useQuery } from "@tanstack/react-query";

import { appointmentsApi } from "@/lib/api/appointments";
import type {
  Appointment,
  AppointmentsResponse,
} from "@/pages/appointments/types";

interface UseAppointmentsParams {
  currentPage: number;
  itemsPerPage: number;
  status: "all" | Appointment["status"];
  customerId: string;
  search?: string;
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
  search,
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
      search ?? "",
      dateFrom,
      dateTo,
    ],
    queryFn: () =>
      appointmentsApi.list({
        page: currentPage,
        limit: itemsPerPage,
        status: status === "all" ? undefined : status,
        customerId: customerId ? Number(customerId) : undefined,
        search: search?.trim() ? search.trim() : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      }),
  });
};

export const useAppointment = (id?: string) => {
  return useQuery<Appointment>({
    queryKey: ["appointment", id],
    queryFn: () => appointmentsApi.get(id as string),
    enabled: !!id,
  });
};

export const useAppointmentsCalendar = ({
  dateFrom,
  dateTo,
  status = "all",
  assignedUserId = "",
  customerId = "",
  search = "",
}: {
  dateFrom: string;
  dateTo: string;
  status?: "all" | Appointment["status"];
  assignedUserId?: string;
  customerId?: string;
  search?: string;
}) => {
  return useQuery<Appointment[]>({
    queryKey: [
      "appointments-calendar",
      dateFrom,
      dateTo,
      status,
      assignedUserId,
      customerId,
      search,
    ],
    queryFn: () =>
      appointmentsApi.listCalendar({
        dateFrom,
        dateTo,
        status: status === "all" ? undefined : status,
        assignedUserId: assignedUserId ? Number(assignedUserId) : undefined,
        customerId: customerId ? Number(customerId) : undefined,
        search: search?.trim() ? search.trim() : undefined,
      }),
    enabled: Boolean(dateFrom && dateTo),
  });
};
