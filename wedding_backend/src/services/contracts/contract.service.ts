import { Op } from "sequelize";
import {
  Contract,
  ContractItem,
  Customer,
  Event,
  EventService,
  EventVendor,
  EventVendorSubService,
  PaymentSchedule,
  Quotation,
  QuotationItem,
  Service,
  User,
  Vendor,
  VendorPricingPlan,
  VendorSubService,
  Venue,
} from "../../models";
import type { ContractStatus } from "../../models/contract.model";
import {
  recordWorkflowAction,
  recordWorkflowBlock,
  recordWorkflowTransition,
} from "../workflow/workflow.audit";
import {
  invalidStatusTransitionError,
  WorkflowDomainError,
} from "../workflow/workflow.errors";
import {
  CONTRACT_TRANSITIONS,
  assertValidContractTransition,
  isContractTerminalForEdits,
  normalizeContractStatus,
  resolveTransitionPath,
} from "../workflow/workflow.status";

export function buildVendorSummaryInclude() {
  return {
    model: Vendor,
    as: "vendor",
    attributes: ["id", "name", "type", "isActive"],
  };
}

export const eventVendorDetailInclude = [
  buildVendorSummaryInclude(),
  {
    model: VendorPricingPlan,
    as: "pricingPlan",
    include: [buildVendorSummaryInclude()],
  },
  {
    model: EventVendorSubService,
    as: "selectedSubServices",
    include: [
      {
        model: VendorSubService,
        as: "vendorSubService",
        include: [buildVendorSummaryInclude()],
      },
    ],
  },
];

export const contractItemDetailInclude: any[] = [
  { model: QuotationItem, as: "quotationItem" },
  { model: EventService, as: "eventService" },
  { model: Service, as: "service" },
  {
    model: EventVendor,
    as: "eventVendor",
    include: eventVendorDetailInclude,
  },
  { model: Vendor, as: "vendor" },
  {
    model: VendorPricingPlan,
    as: "pricingPlan",
    include: [buildVendorSummaryInclude()],
  },
];

export function buildContractInclude(): any[] {
  return [
    { model: Quotation, as: "quotation" },
    {
      model: Event,
      as: "event",
      include: [
        { model: Customer, as: "customer" },
        { model: Venue, as: "venue" },
      ],
    },
    {
      model: ContractItem,
      as: "items",
      separate: true,
      order: [
        ["sortOrder", "ASC"],
        ["id", "ASC"],
      ],
      include: contractItemDetailInclude,
    },
    {
      model: PaymentSchedule,
      as: "paymentSchedules",
      separate: true,
      order: [
        ["sortOrder", "ASC"],
        ["id", "ASC"],
      ],
    },
    { model: User, as: "createdByUser", attributes: ["id", "fullName"] },
    { model: User, as: "updatedByUser", attributes: ["id", "fullName"] },
  ];
}

export async function loadContractById(id: number) {
  return Contract.findByPk(id, {
    include: buildContractInclude(),
  });
}

export async function assertApprovedQuotationForContract(
  quotationId: number,
  excludeContractId?: number,
) {
  const quotation = await Quotation.findByPk(quotationId, {
    include: [
      { model: Event, as: "event" },
      {
        model: QuotationItem,
        as: "items",
        separate: true,
        order: [
          ["sortOrder", "ASC"],
          ["id", "ASC"],
        ],
      },
    ],
  });

  if (!quotation) {
    throw new WorkflowDomainError("Quotation not found", 404);
  }

  if (quotation.status !== "approved") {
    recordWorkflowBlock({
      entityName: "quotation",
      entityId: quotation.id,
      actionName: "contract.create_from_quotation",
      currentStatus: quotation.status,
      attemptedBy: null,
      message: "Only approved quotation can create contract",
      sourceRefs: {
        eventId: quotation.eventId,
        quotationId: quotation.id,
      },
    });

    throw invalidStatusTransitionError("Only approved quotation can create contract");
  }

  const existingContract = await Contract.findOne({
    where: {
      quotationId: quotation.id,
      ...(excludeContractId
        ? {
            id: {
              [Op.ne]: excludeContractId,
            },
          }
        : {}),
    },
  });

  if (existingContract) {
    recordWorkflowBlock({
      entityName: "quotation",
      entityId: quotation.id,
      actionName: "contract.create_from_quotation",
      currentStatus: quotation.status,
      attemptedBy: null,
      message: "Contract already exists for this quotation",
      sourceRefs: {
        eventId: quotation.eventId,
        quotationId: quotation.id,
        contractId: existingContract.id,
      },
      metadata: {
        existingContractId: existingContract.id,
      },
    });

    throw new WorkflowDomainError(
      "Contract already exists for this quotation",
      400,
    );
  }

  return quotation;
}

export async function assertNoOtherActiveContractForEvent(
  eventId: number,
  excludeContractId?: number,
  audit?: {
    contractId?: number;
    userId: number | null;
  },
) {
  const existingActiveContract = await Contract.findOne({
    where: {
      eventId,
      status: "active",
      ...(excludeContractId
        ? {
            id: {
              [Op.ne]: excludeContractId,
            },
          }
        : {}),
    },
  });

  if (existingActiveContract) {
    if (audit?.contractId) {
      recordWorkflowBlock({
        entityName: "contract",
        entityId: audit.contractId,
        actionName: "contract.activate",
        currentStatus: "active_conflict",
        attemptedBy: audit.userId,
        message: "Active contract already exists for this event",
        sourceRefs: {
          eventId,
          contractId: audit.contractId,
        },
        metadata: {
          eventId,
          conflictingContractId: existingActiveContract.id,
        },
      });
    }

    throw new WorkflowDomainError(
      "Active contract already exists for this event",
      409,
    );
  }
}

export async function listContractsPage({
  page,
  limit,
  quotationId,
  eventId,
  status,
  search,
  signedDateFrom,
  signedDateTo,
}: {
  page: number;
  limit: number;
  quotationId?: number;
  eventId?: number;
  status?: string;
  search?: string;
  signedDateFrom?: string;
  signedDateTo?: string;
}) {
  const where: any = {};

  if (quotationId) where.quotationId = quotationId;
  if (eventId) where.eventId = eventId;
  if (status) where.status = status;

  if (search) {
    where[Op.or] = [
      { contractNumber: { [Op.like]: `%${search}%` } },
      { notes: { [Op.like]: `%${search}%` } },
    ];
  }

  if (signedDateFrom || signedDateTo) {
    where.signedDate = {};
    if (signedDateFrom) where.signedDate[Op.gte] = signedDateFrom;
    if (signedDateTo) where.signedDate[Op.lte] = signedDateTo;
  }

  return Contract.findAndCountAll({
    where,
    include: [
      { model: Quotation, as: "quotation" },
      {
        model: Event,
        as: "event",
        include: [
          { model: Customer, as: "customer" },
          { model: Venue, as: "venue" },
        ],
      },
      { model: User, as: "createdByUser", attributes: ["id", "fullName"] },
      { model: User, as: "updatedByUser", attributes: ["id", "fullName"] },
    ],
    order: [
      ["signedDate", "DESC"],
      ["id", "DESC"],
    ],
    limit,
    offset: (page - 1) * limit,
  });
}

type ContractStatusActionInput = {
  contract: Contract;
  nextStatus: ContractStatus;
  actionName: string;
  userId: number | null;
  note?: string | null;
  reason?: string | null;
};

const applyContractStatusAction = async ({
  contract,
  nextStatus,
  actionName,
  userId,
  note = null,
  reason = null,
}: ContractStatusActionInput) => {
  const previousStatus = contract.status;
  assertValidContractTransition(previousStatus, nextStatus);

  await contract.update({
    status: nextStatus,
    updatedBy: userId,
  });

  recordWorkflowTransition({
    entityName: "contract",
    entityId: contract.id,
    previousStatus: normalizeContractStatus(previousStatus),
    nextStatus: normalizeContractStatus(nextStatus),
    actionName,
    changedBy: userId,
    note,
    reason,
    sourceRefs: {
      eventId: contract.eventId,
      quotationId: contract.quotationId ?? null,
      contractId: contract.id,
    },
    metadata: {
      eventId: contract.eventId,
      quotationId: contract.quotationId ?? null,
    },
  });

  return contract;
};

export const issueContract = (
  contract: Contract,
  userId: number | null,
  note?: string | null,
) =>
  applyContractStatusAction({
    contract,
    nextStatus: "issued",
    actionName: "contract.issue",
    userId,
    note,
  });

export const signContract = (
  contract: Contract,
  userId: number | null,
  note?: string | null,
) =>
  applyContractStatusAction({
    contract,
    nextStatus: "signed",
    actionName: "contract.sign",
    userId,
    note,
  });

export const activateContract = (
  contract: Contract,
  userId: number | null,
  note?: string | null,
) =>
  assertNoOtherActiveContractForEvent(contract.eventId, contract.id, {
    contractId: contract.id,
    userId,
  }).then(() =>
    applyContractStatusAction({
      contract,
      nextStatus: "active",
      actionName: "contract.activate",
      userId,
      note,
    }),
  );

export const completeContractWorkflow = (
  contract: Contract,
  userId: number | null,
  note?: string | null,
) =>
  applyContractStatusAction({
    contract,
    nextStatus: "completed",
    actionName: "contract.complete",
    userId,
    note,
  });

export const cancelContract = (
  contract: Contract,
  userId: number | null,
  reason?: string | null,
  note?: string | null,
) =>
  applyContractStatusAction({
    contract,
    nextStatus: "cancelled",
    actionName: "contract.cancel",
    userId,
    note,
    reason,
  });

export const terminateContract = (
  contract: Contract,
  userId: number | null,
  reason?: string | null,
  note?: string | null,
) =>
  applyContractStatusAction({
    contract,
    nextStatus: "terminated",
    actionName: "contract.terminate",
    userId,
    note,
    reason,
  });

export const transitionContractToStatus = async ({
  contract,
  targetStatus,
  userId,
  note,
  reason,
}: {
  contract: Contract;
  targetStatus: ContractStatus;
  userId: number | null;
  note?: string | null;
  reason?: string | null;
}) => {
  const path = resolveTransitionPath(
    CONTRACT_TRANSITIONS,
    normalizeContractStatus(contract.status),
    normalizeContractStatus(targetStatus),
  );

  for (const nextStatus of path) {
    if (nextStatus === "issued") {
      await issueContract(contract, userId, note);
      continue;
    }

    if (nextStatus === "signed") {
      await signContract(contract, userId, note);
      continue;
    }

    if (nextStatus === "active") {
      await activateContract(contract, userId, note);
      continue;
    }

    if (nextStatus === "completed") {
      await completeContractWorkflow(contract, userId, note);
      continue;
    }

    if (nextStatus === "cancelled") {
      await cancelContract(contract, userId, reason, note);
      continue;
    }

    if (nextStatus === "terminated") {
      await terminateContract(contract, userId, reason, note);
    }
  }

  return contract;
};

export const assertContractHeaderEditable = (
  contract: Contract,
  payload: Partial<{
    quotationId: number | null;
    contractNumber: string | null;
    signedDate: string;
    eventDate: string | null;
    discountAmount: number | null;
    notes: string | null;
  }>,
  audit?: {
    userId: number | null;
    attemptedFields?: string[];
  },
) => {
  if (!isContractTerminalForEdits(contract.status)) {
    return;
  }

  const hasCommitmentChange =
    typeof payload.quotationId !== "undefined"
    || typeof payload.contractNumber !== "undefined"
    || typeof payload.signedDate !== "undefined"
    || typeof payload.eventDate !== "undefined"
    || typeof payload.discountAmount !== "undefined"
    || typeof payload.notes !== "undefined";

  if (hasCommitmentChange) {
    if (audit) {
      recordWorkflowBlock({
        entityName: "contract",
        entityId: contract.id,
        actionName: "contract.update_header",
        currentStatus: normalizeContractStatus(contract.status),
        attemptedBy: audit.userId,
        message: "Cannot modify active contract commitment fields",
        sourceRefs: {
          eventId: contract.eventId,
          quotationId: contract.quotationId ?? null,
          contractId: contract.id,
        },
        metadata: {
          attemptedFields: audit.attemptedFields,
        },
      });
    }

    throw invalidStatusTransitionError(
      "Cannot modify active contract commitment fields",
    );
  }
};

export const assertContractStructureEditable = (
  contract: Contract,
  audit?: {
    userId: number | null;
    area?: string;
  },
) => {
  if (isContractTerminalForEdits(contract.status)) {
    if (audit) {
      recordWorkflowBlock({
        entityName: "contract",
        entityId: contract.id,
        actionName: "contract.update_structure",
        currentStatus: normalizeContractStatus(contract.status),
        attemptedBy: audit.userId,
        message: "Cannot modify active contract commitment fields",
        sourceRefs: {
          eventId: contract.eventId,
          quotationId: contract.quotationId ?? null,
          contractId: contract.id,
        },
        metadata: {
          area: audit.area,
        },
      });
    }

    throw invalidStatusTransitionError(
      "Cannot modify active contract commitment fields",
    );
  }
};

export const recordContractCreatedAction = ({
  contract,
  userId,
  itemCount,
  paymentScheduleCount,
  sourceMode,
}: {
  contract: Contract;
  userId: number | null;
  itemCount: number;
  paymentScheduleCount: number;
  sourceMode: "manual" | "quotation_snapshot";
}) =>
  recordWorkflowAction({
    entityName: "contract",
    entityId: contract.id,
    actionName: "contract.create",
    actorId: userId,
    note:
      sourceMode === "quotation_snapshot"
        ? "Created contract from approved quotation snapshot"
        : "Created contract from provided contract snapshot",
    sourceRefs: {
      eventId: contract.eventId,
      quotationId: contract.quotationId ?? null,
      contractId: contract.id,
    },
    metadata: {
      itemCount,
      paymentScheduleCount,
      sourceMode,
      customerId: contract.customerId ?? null,
    },
  });
