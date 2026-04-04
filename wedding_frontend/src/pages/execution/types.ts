export type ExecutionBriefStatus =
  | "draft"
  | "under_review"
  | "approved"
  | "handed_off"
  | "handed_to_executor"
  | "in_progress"
  | "completed"
  | "cancelled";

export type ExecutionServiceDetailStatus =
  | "pending"
  | "draft"
  | "ready"
  | "in_progress"
  | "done";

export interface ExecutionAttachment {
  id: number;
  briefId: number;
  serviceDetailId?: number | null;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  filePath: string;
  fileUrl?: string | null;
  label?: string | null;
  sortOrder: number;
  uploadedBy?: number | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface ExecutionServiceDetail {
  id: number;
  briefId: number;
  eventId: number;
  serviceId: number;
  serviceNameSnapshot?: string | null;
  templateKey: string;
  sortOrder: number;
  detailsJson?: Record<string, unknown> | null;
  notes?: string | null;
  executorNotes?: string | null;
  status: ExecutionServiceDetailStatus;
  service?: {
    id: number;
    name?: string | null;
    category?: string | null;
  } | null;
  attachments?: ExecutionAttachment[];
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface ExecutionBrief {
  id: number;
  eventId: number;
  quotationId?: number | null;
  contractId?: number | null;
  status: ExecutionBriefStatus;
  generalNotes?: string | null;
  clientNotes?: string | null;
  designerNotes?: string | null;
  approvedByClientAt?: string | null;
  handedToExecutorAt?: string | null;
  createdBy?: number | null;
  updatedBy?: number | null;
  event?: unknown;
  quotation?: unknown;
  contract?: unknown;
  creator?: {
    id: number;
    name?: string | null;
    email?: string | null;
  } | null;
  updater?: {
    id: number;
    name?: string | null;
    email?: string | null;
  } | null;
  serviceDetails?: ExecutionServiceDetail[];
  attachments?: ExecutionAttachment[];
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface ExecutionBriefResponse {
  message: string;
  data: ExecutionBrief;
}

export interface ExecutionBriefsResponse {
  message: string;
  data: ExecutionBrief[];
}

export interface ExecutionServiceDetailResponse {
  message: string;
  data: ExecutionServiceDetail;
}

export interface ExecutionAttachmentResponse {
  message: string;
  data: ExecutionAttachment;
}

export interface CreateExecutionBriefPayload {
  eventId: number;
  quotationId?: number | null;
  contractId?: number | null;
  status?: ExecutionBriefStatus;
  generalNotes?: string | null;
  clientNotes?: string | null;
  designerNotes?: string | null;
  initializeFromEventServices?: boolean;
}

export interface UpdateExecutionBriefPayload {
  quotationId?: number | null;
  contractId?: number | null;
  status?: ExecutionBriefStatus;
  generalNotes?: string | null;
  clientNotes?: string | null;
  designerNotes?: string | null;
  approvedByClientAt?: string | null;
  handedToExecutorAt?: string | null;
}

export interface UpdateExecutionServiceDetailPayload {
  templateKey?: string;
  sortOrder?: number;
  detailsJson?: Record<string, unknown> | null;
  notes?: string | null;
  executorNotes?: string | null;
  status?: ExecutionServiceDetailStatus;
}

export interface UploadExecutionAttachmentPayload {
  file: File;
  label?: string | null;
  sortOrder?: number;
}
