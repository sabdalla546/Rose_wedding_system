export interface Venue {
  id: number;
  name: string;
  city?: string | null;
  area?: string | null;
  address?: string | null;
  phone?: string | null;
  contactPerson?: string | null;
  notes?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface VenuesResponse {
  data: Venue[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface VenueResponse {
  data: Venue;
}

export interface VenueFormData {
  id?: number;
  name: string;
  city?: string;
  area?: string;
  address?: string;
  phone?: string;
  contactPerson?: string;
  notes?: string;
  isActive: boolean;
}
