export type LeadStatus =
  | "new"
  | "contacted"
  | "appointment_scheduled"
  | "appointment_completed"
  | "quotation_sent"
  | "contract_pending"
  | "converted"
  | "lost"
  | "cancelled";

export interface LeadVenue {
  id: number;
  name: string;
  city?: string | null;
  area?: string | null;
  address?: string | null;
}

export interface LeadUserSummary {
  id: number;
  fullName: string;
}

export interface LeadAppointmentSummary {
  id: number;
  appointmentDate: string;
  appointmentStartTime: string;
  appointmentEndTime?: string | null;
  status: string;
  meetingType: string;
  notes?: string | null;
  result?: string | null;
  nextStep?: string | null;
}

export interface LeadCustomerSummary {
  id: number;
  fullName: string;
  mobile: string;
  email?: string | null;
  weddingDate?: string | null;
  guestCount?: number | null;
  status: string;
  venue?: LeadVenue | null;
}

export interface Lead {
  id: number;
  fullName: string;
  mobile: string;
  mobile2?: string | null;
  email?: string | null;
  weddingDate: string;
  guestCount?: number | null;
  venueId?: number | null;
  venueNameSnapshot?: string | null;
  groomName?: string | null;
  brideName?: string | null;
  source?: string | null;
  status: LeadStatus;
  notes?: string | null;
  convertedToCustomer: boolean;
  convertedCustomerId?: number | null;
  venue?: LeadVenue | null;
  customer?: LeadCustomerSummary | null;
  appointments?: LeadAppointmentSummary[];
  createdByUser?: LeadUserSummary | null;
  updatedByUser?: LeadUserSummary | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface LeadsResponse {
  data: Lead[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface LeadResponse {
  data: Lead;
}

export interface LeadFormData {
  fullName: string;
  mobile: string;
  mobile2?: string;
  email?: string;
  weddingDate: string;
  guestCount?: string;
  venueId?: string;
  venueNameSnapshot?: string;
  groomName?: string;
  brideName?: string;
  source?: string;
  status: LeadStatus;
  notes?: string;
}

export interface MarkLeadLostData {
  reason?: string;
  notes?: string;
}

export interface ConvertLeadToCustomerData {
  notes?: string;
}
