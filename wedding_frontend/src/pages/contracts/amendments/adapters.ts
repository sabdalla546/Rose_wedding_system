import { formatMoney, toNumberValue } from "@/pages/contracts/adapters";

import type {
  ContractAmendment,
  ContractAmendmentItem,
  ContractAmendmentItemChangeType,
  ContractAmendmentItemStatus,
  ContractAmendmentStatus,
} from "./types";

export const CONTRACT_AMENDMENT_STATUS_LABELS: Record<
  ContractAmendmentStatus,
  string
> = {
  draft: "Draft",
  approved: "Approved",
  applied: "Applied",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export const CONTRACT_AMENDMENT_ITEM_CHANGE_TYPE_LABELS: Record<
  ContractAmendmentItemChangeType,
  string
> = {
  add_service: "Add Service",
  remove_service: "Remove Service",
};

export const CONTRACT_AMENDMENT_ITEM_STATUS_LABELS: Record<
  ContractAmendmentItemStatus,
  string
> = {
  pending: "Pending",
  applied: "Applied",
  cancelled: "Cancelled",
};

export const getContractAmendmentDisplayNumber = (
  amendment: Pick<ContractAmendment, "id" | "amendmentNumber">,
) => amendment.amendmentNumber?.trim() || `AMD-${amendment.id}`;

export const getContractAmendmentItemDisplayName = (
  item: ContractAmendmentItem,
) =>
  item.itemName?.trim() ||
  item.service?.name ||
  item.targetContractItem?.itemName ||
  item.targetEventService?.serviceNameSnapshot ||
  item.targetExecutionServiceDetail?.serviceNameSnapshot ||
  "Service";

export const formatContractAmendmentDelta = (
  value?: number | string | null,
) => {
  const numericValue = toNumberValue(value) ?? 0;
  const sign = numericValue > 0 ? "+" : numericValue < 0 ? "-" : "";
  return `${sign}${formatMoney(Math.abs(numericValue))}`;
};

export const getContractAmendmentDeltaTone = (value?: number | string | null) => {
  const numericValue = toNumberValue(value) ?? 0;

  if (numericValue > 0) {
    return "text-emerald-600";
  }

  if (numericValue < 0) {
    return "text-rose-600";
  }

  return "text-[var(--lux-text-secondary)]";
};

export const canEditContractAmendment = (
  status: ContractAmendmentStatus,
) => status === "draft";

export const canApproveContractAmendment = (
  status: ContractAmendmentStatus,
) => status === "draft";

export const canRejectContractAmendment = (
  status: ContractAmendmentStatus,
) => status === "draft" || status === "approved";

export const canApplyContractAmendment = (
  status: ContractAmendmentStatus,
) => status === "approved";
