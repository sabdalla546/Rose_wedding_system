import type {
  Contract,
  ContractItem,
  ContractUserSummary,
  DecimalValue,
} from "@/pages/contracts/types";
import type { ExecutionServiceDetail } from "@/pages/execution/types";
import type { EventServiceItem, Service } from "@/pages/services/types";

export type ContractAmendmentStatus =
  | "draft"
  | "approved"
  | "applied"
  | "rejected"
  | "cancelled";

export type ContractAmendmentItemChangeType = "add_service" | "remove_service";

export type ContractAmendmentItemStatus = "pending" | "applied" | "cancelled";

export interface ContractAmendmentUserSummary extends ContractUserSummary {
  email?: string | null;
}

export interface ContractAmendmentItem {
  id: number;
  amendmentId: number;
  changeType: ContractAmendmentItemChangeType;
  targetContractItemId?: number | null;
  targetEventServiceId?: number | null;
  targetExecutionServiceDetailId?: number | null;
  serviceId?: number | null;
  itemName?: string | null;
  category?: string | null;
  quantity?: DecimalValue | null;
  unitPrice?: DecimalValue | null;
  totalPrice?: DecimalValue | null;
  notes?: string | null;
  sortOrder: number;
  status: ContractAmendmentItemStatus;
  service?: Service | null;
  targetContractItem?: ContractItem | null;
  targetEventService?: EventServiceItem | null;
  targetExecutionServiceDetail?: ExecutionServiceDetail | null;
  createdByUser?: ContractAmendmentUserSummary | null;
  updatedByUser?: ContractAmendmentUserSummary | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface ContractAmendment {
  id: number;
  contractId: number;
  eventId: number;
  amendmentNumber?: string | null;
  reason?: string | null;
  notes?: string | null;
  status: ContractAmendmentStatus;
  subtotalDelta: DecimalValue;
  discountDelta: DecimalValue;
  totalDelta: DecimalValue;
  requestedBy?: number | null;
  approvedBy?: number | null;
  requestedAt?: string | null;
  approvedAt?: string | null;
  appliedAt?: string | null;
  contract?: Contract | null;
  event?: Contract["event"] | null;
  items?: ContractAmendmentItem[];
  createdByUser?: ContractAmendmentUserSummary | null;
  updatedByUser?: ContractAmendmentUserSummary | null;
  requestedByUser?: ContractAmendmentUserSummary | null;
  approvedByUser?: ContractAmendmentUserSummary | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface ContractAmendmentsResponse {
  data: ContractAmendment[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface ContractAmendmentResponse {
  data: ContractAmendment;
}

export interface ContractAmendmentItemResponse {
  data: ContractAmendmentItem;
}

export interface ContractAmendmentCreateFormData {
  contractId: number;
  reason?: string;
  notes?: string;
}

export interface ContractAmendmentApproveFormData {
  notes?: string;
}

export interface ContractAmendmentRejectFormData {
  reason: string;
  notes?: string;
}

export interface ContractAmendmentApplyFormData {
  notes?: string;
}

export interface ContractAmendmentAddServiceItemFormData {
  changeType: "add_service";
  serviceId: string;
  itemName: string;
  category: string;
  quantity: string;
  unitPrice: string;
  totalPrice?: string;
  notes?: string;
  sortOrder?: string;
}

export interface ContractAmendmentRemoveServiceItemFormData {
  changeType: "remove_service";
  targetContractItemId: string;
  targetEventServiceId?: string;
  targetExecutionServiceDetailId?: string;
  notes?: string;
  sortOrder?: string;
}

export type ContractAmendmentItemCreateFormData =
  | ContractAmendmentAddServiceItemFormData
  | ContractAmendmentRemoveServiceItemFormData;

export interface ContractAmendmentItemUpdateFormData {
  itemName?: string;
  category?: string;
  quantity?: string;
  unitPrice?: string;
  totalPrice?: string;
  notes?: string;
  sortOrder?: string;
  status?: ContractAmendmentItemStatus;
}
