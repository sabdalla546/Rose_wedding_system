export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "completed"
  | "rescheduled"
  | "cancelled"
  | "no_show";

export type AppointmentMeetingType =
  | "office_visit"
  | "phone_call"
  | "video_call"
  | "venue_visit";

export interface AppointmentLeadVenue {
  id: number;
  name: string;
  city?: string | null;
  area?: string | null;
  address?: string | null;
}

export interface AppointmentLead {
  id: number;
  fullName: string;
  mobile: string;
  mobile2?: string | null;
  email?: string | null;
  weddingDate: string;
  guestCount?: number | null;
  venueId?: number | null;
  venueNameSnapshot?: string | null;
  source?: string | null;
  notes?: string | null;
  status: string;
  convertedToCustomer?: boolean;
  convertedCustomerId?: number | null;
  venue?: AppointmentLeadVenue | null;
}

export interface AppointmentUserSummary {
  id: number;
  fullName: string;
  email?: string | null;
}

export interface Appointment {
  id: number;
  leadId: number;
  appointmentDate: string;
  appointmentStartTime: string;
  appointmentEndTime?: string | null;
  status: AppointmentStatus;
  meetingType: AppointmentMeetingType;
  assignedToUserId?: number | null;
  notes?: string | null;
  result?: string | null;
  nextStep?: string | null;
  lead?: AppointmentLead | null;
  assignedToUser?: AppointmentUserSummary | null;
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
  leadId: string;
  appointmentDate: string;
  appointmentStartTime: string;
  appointmentEndTime?: string;
  status: AppointmentStatus;
  meetingType: AppointmentMeetingType;
  assignedToUserId?: string;
  notes?: string;
  result?: string;
  nextStep?: string;
}

export interface ConfirmAppointmentData {
  notes?: string;
}

export interface CompleteAppointmentData {
  result?: string;
  notes?: string;
  nextStep?: string;
}

export interface CancelAppointmentData {
  reason?: string;
  notes?: string;
}

export interface RescheduleAppointmentData {
  appointmentDate: string;
  appointmentStartTime: string;
  appointmentEndTime?: string;
  assignedToUserId?: string;
  notes?: string;
  nextStep?: string;
}
