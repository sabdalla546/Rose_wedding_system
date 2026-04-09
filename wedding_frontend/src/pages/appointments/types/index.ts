import type { Venue } from "@/pages/venues/types";

export type AppointmentStatus =
  | "reserved"
  | "attended"
  | "converted"
  | "cancelled"
  | "no_show";

export type AppointmentType =
  | "New Appointment 1"
  | "New Appointment 2"
  | "New Appointment 3"
  | "Details Appointment 1"
  | "Details Appointment 2"
  | "Details Appointment 3"
  | "Office Visit 1"
  | "Office Visit 2"
  | "Office Visit 3";

export interface AppointmentCustomer {
  id: number;
  fullName: string;
  mobile: string;
  mobile2?: string | null;
  email?: string | null;
  nationalId?: string | null;
  address?: string | null;
  notes?: string | null;
  status?: string;
}

export interface AppointmentUserSummary {
  id: number;
  fullName: string;
  email?: string | null;
}

export interface Appointment {
  id: number;
  customerId: number;
  appointmentDate: string;
  startTime: string;
  endTime?: string | null;
  type: AppointmentType;
  weddingDate?: string | null;
  guestCount?: number | null;
  venueId?: number | null;
  notes?: string | null;
  status: AppointmentStatus;
  customer?: AppointmentCustomer | null;
  venue?: Venue | null;
  createdByUser?: AppointmentUserSummary | null;
  updatedByUser?: AppointmentUserSummary | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface AppointmentsResponse {
  data: Appointment[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface AppointmentResponse {
  data: Appointment;
}

export interface AppointmentsCalendarResponse {
  data: Appointment[];
}

export interface AppointmentMutationResponse {
  message?: string;
  data: Appointment;
}

export interface AttendAppointmentResponse extends AppointmentMutationResponse {
  eventId?: number;
}

export type AppointmentFormData = {
  customerId: string;
  appointmentDate: string;
  weddingDate?: string;
  guestCount?: string;
  venueId?: string;
  startTime: string;
  endTime: string;
  type: AppointmentType;
  notes?: string;
};

export interface ConfirmAppointmentData {
  notes?: string;
}

export interface AttendAppointmentData {
  notes?: string;
}

export interface CancelAppointmentData {
  reason?: string;
  notes?: string;
}

export interface RescheduleAppointmentData {
  appointmentDate: string;
  startTime: string;
  endTime: string;
  notes?: string;
}
