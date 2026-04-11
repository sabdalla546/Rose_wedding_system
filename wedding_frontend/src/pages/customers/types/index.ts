export type CustomerStatus = "active" | "inactive";
export type CustomerSource =
  | "facebook"
  | "instagram"
  | "tiktok"
  | "google_search"
  | "google_maps"
  | "snapchat"
  | "whatsapp"
  | "friend_referral"
  | "family_referral"
  | "existing_customer"
  | "walk_in"
  | "advertisement"
  | "exhibition"
  | "website"
  | "other";

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
  nationalId?: string | null;
  address?: string | null;
  source?: CustomerSource | null;
  sourceDetails?: string | null;
  notes?: string | null;
  status: CustomerStatus;
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
  nationalId?: string;
  address?: string;
  source?: CustomerSource | null;
  sourceDetails?: string | null;
  notes?: string | null;
  status: CustomerStatus;
}
