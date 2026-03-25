import type { Customer } from "@/pages/customers/types";
import type { Event } from "@/pages/events/types";
import type { Lead } from "@/pages/leads/types";
import type { EventServiceItem, Service } from "@/pages/services/types";
import type {
  EventVendorLink,
  Vendor,
  VendorPricingPlan,
} from "@/pages/vendors/types";

export type QuotationStatus =
  | "draft"
  | "sent"
  | "approved"
  | "rejected"
  | "expired"
  | "converted_to_contract";

export type DecimalValue = number | string;
export type QuotationItemType = "service" | "vendor";

export interface QuotationUserSummary {
  id: number;
  fullName: string;
}

export interface QuotationItem {
  id: number;
  quotationId: number;
  itemType: QuotationItemType;
  eventServiceId?: number | null;
  serviceId?: number | null;
  eventVendorId?: number | null;
  vendorId?: number | null;
  pricingPlanId?: number | null;
  itemName: string;
  category?: string | null;
  quantity?: DecimalValue | null;
  unitPrice?: DecimalValue | null;
  totalPrice?: DecimalValue | null;
  notes?: string | null;
  sortOrder: number;
  eventService?: EventServiceItem | null;
  service?: Service | null;
  eventVendor?: EventVendorLink | null;
  vendor?: Vendor | null;
  pricingPlan?: VendorPricingPlan | null;
  createdByUser?: QuotationUserSummary | null;
  updatedByUser?: QuotationUserSummary | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface Quotation {
  id: number;
  eventId: number;
  customerId?: number | null;
  leadId?: number | null;
  quotationNumber?: string | null;
  issueDate: string;
  validUntil?: string | null;
  subtotal?: DecimalValue | null;
  discountAmount?: DecimalValue | null;
  totalAmount?: DecimalValue | null;
  notes?: string | null;
  status: QuotationStatus;
  event?: Event | null;
  customer?: Customer | null;
  lead?: Lead | null;
  items?: QuotationItem[];
  createdByUser?: QuotationUserSummary | null;
  updatedByUser?: QuotationUserSummary | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface QuotationsResponse {
  data: Quotation[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface QuotationResponse {
  data: Quotation;
}

export interface QuotationItemFormData {
  id?: number;
  itemType: QuotationItemType;
  eventServiceId?: string;
  serviceId?: string;
  eventVendorId?: string;
  vendorId?: string;
  pricingPlanId?: string;
  itemName: string;
  category?: string;
  quantity: string;
  unitPrice: string;
  totalPrice?: string;
  notes?: string;
  sortOrder?: string;
  isTotalManual?: boolean;
}

export interface QuotationFormData {
  eventId: string;
  quotationNumber?: string;
  issueDate: string;
  validUntil?: string;
  subtotal?: string;
  discountAmount?: string;
  notes?: string;
  status?: QuotationStatus;
  items: QuotationItemFormData[];
}

export interface QuotationFromEventFormData {
  eventId: string;
  quotationNumber?: string;
  issueDate: string;
  validUntil?: string;
  subtotal?: string;
  discountAmount?: string;
  notes?: string;
  eventServiceIds: string[];
  eventVendorIds: string[];
  status?: QuotationStatus;
}

export interface QuotationUpdateFormData {
  quotationNumber?: string;
  issueDate?: string;
  validUntil?: string;
  subtotal?: string;
  discountAmount?: string;
  notes?: string;
  status?: QuotationStatus;
  items: QuotationItemFormData[];
}
