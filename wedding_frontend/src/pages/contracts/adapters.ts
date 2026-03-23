import { getEventDisplayTitle } from "@/pages/events/adapters";
import {
  formatMoney,
  formatQuotationItemCategory,
  toNumberValue,
} from "@/pages/quotations/adapters";
import type {
  Contract,
  ContractItem,
  ContractStatus,
  ContractsResponse,
  PaymentSchedule,
  PaymentScheduleStatus,
  PaymentScheduleType,
} from "@/pages/contracts/types";

export type TableContract = Contract & {
  contractNumberDisplay: string;
  quotationDisplay: string;
  eventDisplay: string;
  customerLeadDisplay: string;
  subtotalDisplay: string;
  discountAmountDisplay: string;
  totalAmountDisplay: string;
};

export type TableContractsResponse = {
  data: { contracts: TableContract[] };
  total: number;
  totalPages: number;
};

export const formatContractStatus = (value: ContractStatus) =>
  value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const formatPaymentScheduleType = (value: PaymentScheduleType) =>
  value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const formatPaymentScheduleStatus = (value: PaymentScheduleStatus) =>
  value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const getContractDisplayNumber = (
  contract: Pick<Contract, "id" | "contractNumber">,
) => contract.contractNumber?.trim() || `CT-${contract.id}`;

export const getContractQuotationDisplay = (
  contract: Pick<Contract, "quotation" | "quotationId">,
) =>
  contract.quotation
    ? contract.quotation.quotationNumber?.trim() || `QT-${contract.quotation.id}`
    : contract.quotationId
      ? `QT-${contract.quotationId}`
      : "-";

export const getContractPartyDisplay = (
  contract: Pick<Contract, "customer" | "lead" | "event">,
) =>
  contract.event?.customer?.fullName ||
  contract.customer?.fullName ||
  contract.lead?.fullName ||
  "-";

export const getContractItemDisplayName = (item: ContractItem) =>
  item.itemName ||
  item.service?.name ||
  item.eventService?.serviceNameSnapshot ||
  item.quotationItem?.itemName ||
  "-";

export const getPaymentScheduleDisplayName = (
  schedule: Pick<PaymentSchedule, "installmentName">,
) => schedule.installmentName?.trim() || "-";

export const computeContractItemTotal = (
  quantity?: number | string | null,
  unitPrice?: number | string | null,
) => {
  const quantityValue = toNumberValue(quantity);
  const unitPriceValue = toNumberValue(unitPrice);

  if (
    quantityValue === null ||
    quantityValue <= 0 ||
    unitPriceValue === null ||
    unitPriceValue < 0
  ) {
    return null;
  }

  return Number((quantityValue * unitPriceValue).toFixed(3));
};

export const computeContractTotals = ({
  items,
  discountAmount,
}: {
  items: Array<{
    quantity?: number | string | null;
    unitPrice?: number | string | null;
    totalPrice?: number | string | null;
  }>;
  discountAmount?: number | string | null;
}) => {
  const subtotal = Number(
    items
      .reduce((sum, item) => {
        const total =
          toNumberValue(item.totalPrice) ??
          computeContractItemTotal(item.quantity, item.unitPrice) ??
          0;

        return sum + total;
      }, 0)
      .toFixed(3),
  );
  const discount = Number((toNumberValue(discountAmount) ?? 0).toFixed(3));
  const totalAmount = Number(Math.max(0, subtotal - discount).toFixed(3));

  return {
    subtotal,
    discountAmount: discount,
    totalAmount,
  };
};

export function toTableContracts(
  res?: ContractsResponse,
): TableContractsResponse {
  const contracts = (res?.data ?? []).map<TableContract>((contract) => ({
    ...contract,
    contractNumberDisplay: getContractDisplayNumber(contract),
    quotationDisplay: getContractQuotationDisplay(contract),
    eventDisplay: contract.event
      ? getEventDisplayTitle(contract.event)
      : `Event #${contract.eventId}`,
    customerLeadDisplay: getContractPartyDisplay(contract),
    subtotalDisplay: formatMoney(contract.subtotal),
    discountAmountDisplay: formatMoney(contract.discountAmount),
    totalAmountDisplay: formatMoney(contract.totalAmount),
  }));

  return {
    data: { contracts },
    total: res?.meta?.total ?? contracts.length,
    totalPages: res?.meta?.pages ?? 1,
  };
}

export const computePaymentScheduleTotal = (schedules?: PaymentSchedule[]) =>
  Number(
    (schedules ?? [])
      .reduce((sum, schedule) => sum + (toNumberValue(schedule.amount) ?? 0), 0)
      .toFixed(3),
  );

export {
  formatMoney,
  formatQuotationItemCategory as formatContractItemCategory,
  toNumberValue,
};

export const CONTRACT_STATUS_OPTIONS: Array<{
  value: ContractStatus;
  label: string;
}> = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "terminated", label: "Terminated" },
];

export const PAYMENT_SCHEDULE_TYPE_OPTIONS: Array<{
  value: PaymentScheduleType;
  label: string;
}> = [
  { value: "deposit", label: "Deposit" },
  { value: "installment", label: "Installment" },
  { value: "final", label: "Final Payment" },
];

export const PAYMENT_SCHEDULE_STATUS_OPTIONS: Array<{
  value: PaymentScheduleStatus;
  label: string;
}> = [
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "cancelled", label: "Cancelled" },
  { value: "overdue", label: "Overdue" },
];
