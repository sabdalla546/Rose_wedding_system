export type VendorType =
  | "dj"
  | "lighting"
  | "barcode"
  | "photography"
  | "perfumes"
  | "coffee_station"
  | "cheese"
  | "ac_generator"
  | "bleachers"
  | "instant_photography"
  | "valet"
  | "female_supplies"
  | "family_services"
  | "sweets_savories"
  | "other";

export type EventVendorProvidedBy = "company" | "client";
export type EventVendorStatus =
  | "pending"
  | "approved"
  | "confirmed"
  | "cancelled";

export interface VendorUserSummary {
  id: number;
  fullName: string;
}

export interface Vendor {
  id: number;
  name: string;
  type: VendorType;
  contactPerson?: string | null;
  phone?: string | null;
  phone2?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  isActive: boolean;
  createdByUser?: VendorUserSummary | null;
  updatedByUser?: VendorUserSummary | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface VendorsResponse {
  data: Vendor[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface VendorResponse {
  data: Vendor;
}

export interface VendorFormData {
  name: string;
  type: VendorType;
  contactPerson?: string;
  phone?: string;
  phone2?: string;
  email?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
}

export interface EventVendorEventSummary {
  id: number;
  title?: string | null;
  eventDate?: string | null;
}

export interface EventVendorLink {
  id: number;
  eventId: number;
  vendorType: VendorType;
  providedBy: EventVendorProvidedBy;
  vendorId?: number | null;
  companyNameSnapshot?: string | null;
  notes?: string | null;
  status: EventVendorStatus;
  vendor?: Vendor | null;
  event?: EventVendorEventSummary | null;
  createdByUser?: VendorUserSummary | null;
  updatedByUser?: VendorUserSummary | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface EventVendorLinksResponse {
  data: EventVendorLink[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface EventVendorLinkResponse {
  data: EventVendorLink;
}

export interface EventVendorLinkFormData {
  eventId: number;
  vendorType: VendorType;
  providedBy: EventVendorProvidedBy;
  vendorId?: string;
  companyNameSnapshot?: string;
  notes?: string;
  status?: EventVendorStatus;
}
