export type ServiceCategory =
  | "internal_setup"
  | "external_service"
  | "flowers"
  | "stage"
  | "entrance"
  | "chairs"
  | "tables"
  | "buffet"
  | "lighting"
  | "photography"
  | "audio"
  | "hospitality"
  | "female_supplies"
  | "transport"
  | "other";

export type ServicePricingType = "fixed" | "per_guest" | "per_unit" | "custom";
export type EventServiceStatus =
  | "draft"
  | "approved"
  | "confirmed"
  | "cancelled"
  | "completed";

export type DecimalValue = number | string;

export interface ServiceUserSummary {
  id: number;
  fullName: string;
}

export interface Service {
  id: number;
  name: string;
  code?: string | null;
  category: ServiceCategory;
  pricingType: ServicePricingType;
  basePrice?: DecimalValue | null;
  unitName?: string | null;
  description?: string | null;
  isActive: boolean;
  createdByUser?: ServiceUserSummary | null;
  updatedByUser?: ServiceUserSummary | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface ServicesResponse {
  data: Service[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface ServiceResponse {
  data: Service;
}

export interface ServiceFormData {
  name: string;
  code?: string;
  category: ServiceCategory;
  pricingType: ServicePricingType;
  basePrice?: string;
  unitName?: string;
  description?: string;
  isActive: boolean;
}

export interface EventServiceEventSummary {
  id: number;
  title?: string | null;
  eventDate?: string | null;
}

export interface EventServiceItem {
  id: number;
  eventId: number;
  serviceId?: number | null;
  serviceNameSnapshot: string;
  category: ServiceCategory;
  quantity: DecimalValue;
  unitPrice?: DecimalValue | null;
  totalPrice?: DecimalValue | null;
  notes?: string | null;
  status: EventServiceStatus;
  sortOrder: number;
  service?: Service | null;
  event?: EventServiceEventSummary | null;
  createdByUser?: ServiceUserSummary | null;
  updatedByUser?: ServiceUserSummary | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface EventServiceItemsResponse {
  data: EventServiceItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface EventServiceItemResponse {
  data: EventServiceItem;
}

export interface EventServiceItemFormData {
  eventId: number;
  serviceId?: string;
  serviceNameSnapshot?: string;
  category: ServiceCategory;
  quantity: string;
  unitPrice?: string;
  notes?: string;
  status: EventServiceStatus;
  sortOrder: string;
}
