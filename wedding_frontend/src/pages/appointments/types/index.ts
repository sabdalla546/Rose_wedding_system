export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "completed"
  | "rescheduled"
  | "cancelled"
  | "no_show";

export type AppointmentType =
  | "New Appointment 1"
  | "New Appointment 2"
  | "New Appointment 3"
  | "Details Appointment 1"
  | "Details Appointment 2"
  | "Details Appointment 3"
  | "Office Visit";

export interface AppointmentCustomer {
  id: number;
  fullName: string;
  mobile: string;
  mobile2?: string | null;
  email?: string | null;
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
  notes?: string | null;
  status: AppointmentStatus;
  customer?: AppointmentCustomer | null;
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

export interface AppointmentFormData {
  customerId: string;
  appointmentDate: string;
  startTime: string;
  endTime?: string;
  status: AppointmentStatus;
  type: AppointmentType;
  notes?: string;
}

export interface ConfirmAppointmentData {
  notes?: string;
}

export interface CompleteAppointmentData {
  notes?: string;
}

export interface CancelAppointmentData {
  reason?: string;
  notes?: string;
}

export interface RescheduleAppointmentData {
  appointmentDate: string;
  startTime: string;
  endTime?: string;
  notes?: string;
}
