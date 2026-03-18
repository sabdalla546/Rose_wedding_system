import type { Customer } from "@/pages/customers/types";
import type { Event } from "@/pages/events/types";
import type { Lead } from "@/pages/leads/types";
import type { Quotation, QuotationItem } from "@/pages/quotations/types";
import type { EventServiceItem, Service } from "@/pages/services/types";

export type ContractStatus =
  | "draft"
  | "active"
  | "completed"
  | "cancelled"
  | "terminated";

export type PaymentScheduleType = "deposit" | "installment" | "final";

export type PaymentScheduleStatus =
  | "pending"
  | "paid"
  | "cancelled"
  | "overdue";

export type DecimalValue = number | string;

export interface ContractUserSummary {
  id: number;
  fullName: string;
}

export interface PaymentSchedule {
  id: number;
  contractId: number;
  installmentName: string;
  scheduleType: PaymentScheduleType;
  dueDate?: string | null;
  amount: DecimalValue;
  status: PaymentScheduleStatus;
  notes?: string | null;
  sortOrder: number;
  createdByUser?: ContractUserSummary | null;
  updatedByUser?: ContractUserSummary | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface ContractItem {
  id: number;
  contractId: number;
  quotationItemId?: number | null;
  eventServiceId?: number | null;
  serviceId?: number | null;
  itemName: string;
  category?: string | null;
  quantity: DecimalValue;
  unitPrice: DecimalValue;
  totalPrice: DecimalValue;
  notes?: string | null;
  sortOrder: number;
  quotationItem?: QuotationItem | null;
  eventService?: EventServiceItem | null;
  service?: Service | null;
  createdByUser?: ContractUserSummary | null;
  updatedByUser?: ContractUserSummary | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface Contract {
  id: number;
  quotationId?: number | null;
  eventId: number;
  customerId?: number | null;
  leadId?: number | null;
  contractNumber?: string | null;
  signedDate: string;
  eventDate?: string | null;
  subtotal?: DecimalValue | null;
  discountAmount?: DecimalValue | null;
  totalAmount?: DecimalValue | null;
  notes?: string | null;
  status: ContractStatus;
  quotation?: Quotation | null;
  event?: Event | null;
  customer?: Customer | null;
  lead?: Lead | null;
  items?: ContractItem[];
  paymentSchedules?: PaymentSchedule[];
  createdByUser?: ContractUserSummary | null;
  updatedByUser?: ContractUserSummary | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface ContractsResponse {
  data: Contract[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface ContractResponse {
  data: Contract;
}

export interface ContractItemFormData {
  id?: number;
  quotationItemId?: string;
  eventServiceId?: string;
  serviceId?: string;
  itemName: string;
  category?: string;
  quantity: string;
  unitPrice: string;
  totalPrice?: string;
  notes?: string;
  sortOrder?: string;
}

export interface PaymentScheduleFormData {
  id?: number;
  installmentName: string;
  scheduleType: PaymentScheduleType;
  dueDate?: string;
  amount: string;
  status?: PaymentScheduleStatus;
  notes?: string;
  sortOrder?: string;
}

export interface ContractFormData {
  quotationId?: string;
  eventId: string;
  customerId?: string;
  leadId?: string;
  contractNumber?: string;
  signedDate: string;
  eventDate?: string;
  discountAmount?: string;
  notes?: string;
  status?: ContractStatus;
  items: ContractItemFormData[];
  paymentSchedules?: PaymentScheduleFormData[];
}

export interface ContractFromQuotationFormData {
  quotationId: string;
  contractNumber?: string;
  signedDate: string;
  eventDate?: string;
  notes?: string;
  status?: ContractStatus;
  paymentSchedules?: PaymentScheduleFormData[];
}

export interface ContractUpdateFormData {
  contractNumber?: string;
  signedDate?: string;
  eventDate?: string;
  discountAmount?: string;
  notes?: string;
  status?: ContractStatus;
  items: ContractItemFormData[];
}

export interface PaymentScheduleCreateFormData {
  contractId: number;
  installmentName: string;
  scheduleType: PaymentScheduleType;
  dueDate?: string;
  amount: string;
  status?: PaymentScheduleStatus;
  notes?: string;
  sortOrder?: string;
}

export interface PaymentScheduleUpdateFormData {
  installmentName?: string;
  scheduleType?: PaymentScheduleType;
  dueDate?: string;
  amount?: string;
  status?: PaymentScheduleStatus;
  notes?: string;
  sortOrder?: string;
}
