export type CustomerStatus = "active" | "inactive";

export interface CustomerVenue {
  id: number;
  name: string;
  city?: string | null;
  area?: string | null;
  address?: string | null;
}

export interface CustomerLeadSummary {
  id: number;
  fullName: string;
  mobile: string;
  mobile2?: string | null;
  email?: string | null;
  weddingDate: string;
  guestCount?: number | null;
  source?: string | null;
  status: string;
}

export interface CustomerUserSummary {
  id: number;
  fullName: string;
}

export interface Customer {
  id: number;
  fullName: string;
  mobile: string;
  mobile2?: string | null;
  email?: string | null;
  weddingDate?: string | null;
  guestCount?: number | null;
  venueId?: number | null;
  venueNameSnapshot?: string | null;
  groomName?: string | null;
  brideName?: string | null;
  sourceLeadId?: number | null;
  notes?: string | null;
  status: CustomerStatus;
  venue?: CustomerVenue | null;
  sourceLead?: CustomerLeadSummary | null;
  createdByUser?: CustomerUserSummary | null;
  updatedByUser?: CustomerUserSummary | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface CustomersResponse {
  data: Customer[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface CustomerResponse {
  data: Customer;
}

export interface CustomerFormData {
  fullName: string;
  mobile: string;
  mobile2?: string;
  email?: string;
  weddingDate?: string;
  guestCount?: string;
  venueId?: string;
  venueNameSnapshot?: string;
  groomName?: string;
  brideName?: string;
  sourceLeadId?: string;
  notes?: string;
  status: CustomerStatus;
}
