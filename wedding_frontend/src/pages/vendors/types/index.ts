export type VendorType = string;

export type EventVendorProvidedBy = "company" | "client";
export type EventVendorStatus =
  | "pending"
  | "approved"
  | "confirmed"
  | "cancelled";
export type DecimalValue = number | string;

export interface VendorUserSummary {
  id: number;
  fullName: string;
}

export interface VendorTypeRecord {
  id: number;
  name: string;
  nameAr: string;
  slug: string;
  isActive: boolean;
  sortOrder: number;
  createdByUser?: VendorUserSummary | null;
  updatedByUser?: VendorUserSummary | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface VendorTypesResponse {
  data: VendorTypeRecord[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface VendorTypeResponse {
  data: VendorTypeRecord;
}

export interface VendorTypeFormData {
  name: string;
  nameAr: string;
  slug?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface Vendor {
  id: number;
  name: string;
  type: VendorType;
  typeId?: number | null;
  vendorType?: VendorTypeRecord | null;
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
  typeId: number;
  type?: VendorType;
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
  pricingPlanId?: number | null;
  selectedSubServicesCount: number;
  agreedPrice?: DecimalValue | null;
  resolvedCompanyName?: string | null;
  resolvedPricingLabel?: string | null;
  hasManualPriceOverride?: boolean;
  notes?: string | null;
  status: EventVendorStatus;
  vendor?: Vendor | null;
  pricingPlan?: VendorPricingPlan | null;
  selectedSubServices?: EventVendorSelectedSubService[];
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

export interface EventVendorSelectedSubService {
  id: number;
  eventVendorId: number;
  vendorSubServiceId?: number | null;
  nameSnapshot: string;
  notes?: string | null;
  sortOrder: number;
  vendorSubService?: VendorSubService | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface EventVendorLinkFormData {
  eventId: number;
  vendorType: VendorType;
  providedBy: EventVendorProvidedBy;
  vendorId?: string;
  companyNameSnapshot?: string;
  selectedSubServiceIds?: number[];
  agreedPrice?: string;
  notes?: string;
  status?: EventVendorStatus;
}

export interface VendorSubService {
  id: number;
  vendorId?: number | null;
  vendorType: VendorType;
  name: string;
  code?: string | null;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
  vendor?: Vendor | null;
  createdByUser?: VendorUserSummary | null;
  updatedByUser?: VendorUserSummary | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface VendorSubServicesResponse {
  data: VendorSubService[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface VendorSubServiceResponse {
  data: VendorSubService;
}

export interface VendorSubServiceFormData {
  vendorId: string;
  vendorType?: VendorType;
  name: string;
  code?: string;
  description?: string;
  sortOrder: string;
  isActive: boolean;
}

export interface VendorPricingPlan {
  id: number;
  vendorId?: number | null;
  vendorType: VendorType;
  name: string;
  minSubServices: number;
  maxSubServices?: number | null;
  price: DecimalValue;
  notes?: string | null;
  isActive: boolean;
  vendor?: Vendor | null;
  createdByUser?: VendorUserSummary | null;
  updatedByUser?: VendorUserSummary | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface VendorPricingPlansResponse {
  data: VendorPricingPlan[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface VendorPricingPlanResponse {
  data: VendorPricingPlan;
}

export interface VendorPricingPlanFormData {
  vendorId: string;
  vendorType?: VendorType;
  name: string;
  minSubServices: string;
  maxSubServices?: string;
  price: string;
  notes?: string;
  isActive: boolean;
}
