import { Op, Transaction, Includeable, Order, WhereOptions } from "sequelize";
import {
  Contract,
  ContractAmendment,
  ContractAmendmentItem,
  ContractItem,
  Event,
  EventService,
  ExecutionBrief,
  ExecutionServiceDetail,
  Service,
  User,
  sequelize,
} from "../../models";
import { WorkflowDomainError } from "../workflow/workflow.errors";

const round3 = (value: number | string | null | undefined) => {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? Number(numeric.toFixed(3)) : 0;
};

const normalizeText = (value?: string | null) =>
  String(value ?? "")
    .trim()
    .toLowerCase();
const amendmentItemsOrder: Order = [
  ["sortOrder", "ASC"],
  ["id", "ASC"],
];
const computeAmendmentTotals = (
  items: Array<{
    changeType: "add_service" | "remove_service";
    totalPrice?: number | string | null;
    status?: string | null;
  }>,
) => {
  const subtotalDelta = round3(
    items.reduce((sum, item) => {
      if (item.status === "cancelled") return sum;

      const lineTotal = round3(item.totalPrice ?? 0);

      if (item.changeType === "add_service") {
        return sum + lineTotal;
      }

      if (item.changeType === "remove_service") {
        return sum - lineTotal;
      }

      return sum;
    }, 0),
  );

  return {
    subtotalDelta,
    discountDelta: 0,
    totalDelta: subtotalDelta,
  };
};

const buildContractAmendmentInclude = (): Includeable[] => [
  {
    model: Contract,
    as: "contract",
    required: false,
  },
  {
    model: Event,
    as: "event",
    required: false,
  },
  {
    model: ContractAmendmentItem,
    as: "items",
    required: false,
    separate: true,
    order: amendmentItemsOrder,
    include: [
      {
        model: Service,
        as: "service",
        required: false,
      },
      {
        model: ContractItem,
        as: "targetContractItem",
        required: false,
        paranoid: false,
      },
      {
        model: EventService,
        as: "targetEventService",
        required: false,
        paranoid: false,
      },
      {
        model: ExecutionServiceDetail,
        as: "targetExecutionServiceDetail",
        required: false,
        paranoid: false,
      },
      {
        model: User,
        as: "createdByUser",
        required: false,
        attributes: ["id", "fullName", "email"],
      },
      {
        model: User,
        as: "updatedByUser",
        required: false,
        attributes: ["id", "fullName", "email"],
      },
    ],
  },
  {
    model: User,
    as: "createdByUser",
    required: false,
    attributes: ["id", "fullName", "email"],
  },
  {
    model: User,
    as: "updatedByUser",
    required: false,
    attributes: ["id", "fullName", "email"],
  },
  {
    model: User,
    as: "requestedByUser",
    required: false,
    attributes: ["id", "fullName", "email"],
  },
  {
    model: User,
    as: "approvedByUser",
    required: false,
    attributes: ["id", "fullName", "email"],
  },
];

const loadContractOrFail = async (
  contractId: number,
  transaction?: Transaction,
) => {
  const contract = await Contract.findByPk(contractId, {
    transaction,
  });

  if (!contract) {
    throw new WorkflowDomainError("Contract not found", 404);
  }

  return contract;
};

const loadAmendmentOrFail = async (
  amendmentId: number,
  transaction?: Transaction,
) => {
  const amendment = await ContractAmendment.findByPk(amendmentId, {
    transaction,
  });

  if (!amendment) {
    throw new WorkflowDomainError("Contract amendment not found", 404);
  }

  return amendment;
};

const loadAmendmentItemOrFail = async (
  amendmentId: number,
  itemId: number,
  transaction?: Transaction,
) => {
  const item = await ContractAmendmentItem.findOne({
    where: {
      id: itemId,
      amendmentId,
    },
    transaction,
  });

  if (!item) {
    throw new WorkflowDomainError("Contract amendment item not found", 404);
  }

  return item;
};

const getNextAmendmentItemSortOrder = async (
  amendmentId: number,
  transaction?: Transaction,
) => {
  const lastRow = await ContractAmendmentItem.findOne({
    where: { amendmentId },
    order: [
      ["sortOrder", "DESC"],
      ["id", "DESC"],
    ],
    transaction,
  });

  return typeof lastRow?.sortOrder === "number" ? lastRow.sortOrder + 1 : 0;
};

const countContractAmendments = async (
  contractId: number,
  transaction?: Transaction,
) => {
  return ContractAmendment.count({
    where: { contractId },
    transaction,
  });
};

const buildAmendmentNumber = async ({
  contractId,
  contractNumber,
  transaction,
}: {
  contractId: number;
  contractNumber?: string | null;
  transaction?: Transaction;
}) => {
  const count = await countContractAmendments(contractId, transaction);
  const sequence = count + 1;

  if (contractNumber && contractNumber.trim() !== "") {
    return `${contractNumber.trim()}-AMD-${sequence}`;
  }

  return `CONTRACT-${contractId}-AMD-${sequence}`;
};

const recomputeAmendmentTotals = async ({
  amendment,
  transaction,
}: {
  amendment: ContractAmendment;
  transaction?: Transaction;
}) => {
  const items = await ContractAmendmentItem.findAll({
    where: {
      amendmentId: amendment.id,
    },
    transaction,
  });

  const totals = computeAmendmentTotals(items);

  await amendment.update(
    {
      subtotalDelta: totals.subtotalDelta,
      discountDelta: totals.discountDelta,
      totalDelta: totals.totalDelta,
    },
    { transaction },
  );

  return totals;
};

const assertContractEligibleForAmendment = async (
  contractId: number,
  transaction?: Transaction,
) => {
  const contract = await loadContractOrFail(contractId, transaction);

  const normalizedStatus = normalizeText((contract as any).status);

  if (!["active", "signed", "completed", "draft"].includes(normalizedStatus)) {
    throw new WorkflowDomainError(
      "Contract is not eligible for amendment",
      400,
    );
  }

  return contract;
};

const assertAmendmentEditable = (amendment: ContractAmendment) => {
  if (amendment.status === "applied") {
    throw new WorkflowDomainError(
      "Applied contract amendment cannot be modified",
      400,
    );
  }

  if (amendment.status === "cancelled") {
    throw new WorkflowDomainError(
      "Cancelled contract amendment cannot be modified",
      400,
    );
  }

  if (amendment.status === "rejected") {
    throw new WorkflowDomainError(
      "Rejected contract amendment cannot be modified",
      400,
    );
  }

  if (amendment.status === "approved") {
    throw new WorkflowDomainError(
      "Approved contract amendment cannot be modified before apply",
      400,
    );
  }
};

const assertAmendmentCanBeApproved = (amendment: ContractAmendment) => {
  if (amendment.status === "approved") {
    throw new WorkflowDomainError("Contract amendment already approved", 409);
  }

  if (amendment.status === "applied") {
    throw new WorkflowDomainError(
      "Applied contract amendment cannot be approved again",
      400,
    );
  }

  if (amendment.status === "rejected") {
    throw new WorkflowDomainError(
      "Rejected contract amendment cannot be approved",
      400,
    );
  }

  if (amendment.status === "cancelled") {
    throw new WorkflowDomainError(
      "Cancelled contract amendment cannot be approved",
      400,
    );
  }

  if (amendment.status !== "draft") {
    throw new WorkflowDomainError(
      "Only draft contract amendment can be approved",
      400,
    );
  }
};

const assertAmendmentCanBeRejected = (amendment: ContractAmendment) => {
  if (amendment.status === "rejected") {
    throw new WorkflowDomainError("Contract amendment already rejected", 409);
  }

  if (amendment.status === "applied") {
    throw new WorkflowDomainError(
      "Applied contract amendment cannot be rejected",
      400,
    );
  }

  if (amendment.status === "cancelled") {
    throw new WorkflowDomainError(
      "Cancelled contract amendment cannot be rejected",
      400,
    );
  }

  if (!["draft", "approved"].includes(amendment.status)) {
    throw new WorkflowDomainError(
      "Contract amendment cannot be rejected in current state",
      400,
    );
  }
};

const assertAddServicePayload = async ({
  serviceId,
}: {
  serviceId?: number | null;
}) => {
  if (!(typeof serviceId === "number" && serviceId > 0)) {
    throw new WorkflowDomainError("serviceId is required", 400);
  }

  const service = await Service.findByPk(serviceId);

  if (!service) {
    throw new WorkflowDomainError("Service not found", 404);
  }

  return service;
};

const assertRemoveServicePayload = async ({
  amendment,
  targetContractItemId,
}: {
  amendment: ContractAmendment;
  targetContractItemId?: number | null;
}) => {
  if (!(typeof targetContractItemId === "number" && targetContractItemId > 0)) {
    throw new WorkflowDomainError("targetContractItemId is required", 400);
  }

  const contractItem = await ContractItem.findOne({
    where: {
      id: targetContractItemId,
      contractId: amendment.contractId,
    },
  });

  if (!contractItem) {
    throw new WorkflowDomainError("Target contract item not found", 404);
  }

  if (contractItem.itemType !== "service") {
    throw new WorkflowDomainError(
      "Only service contract item can be removed in this MVP",
      400,
    );
  }

  return contractItem;
};

export const createContractAmendment = async ({
  contractId,
  reason,
  notes,
  userId,
}: {
  contractId: number;
  reason?: string | null;
  notes?: string | null;
  userId: number | null;
}) => {
  return sequelize.transaction(async (transaction) => {
    const contract = await assertContractEligibleForAmendment(
      contractId,
      transaction,
    );

    const amendmentNumber = await buildAmendmentNumber({
      contractId: contract.id,
      contractNumber: (contract as any).contractNumber ?? null,
      transaction,
    });

    const amendment = await ContractAmendment.create(
      {
        contractId: contract.id,
        eventId: contract.eventId,
        amendmentNumber,
        reason: reason ?? null,
        notes: notes ?? null,
        status: "draft",
        subtotalDelta: 0,
        discountDelta: 0,
        totalDelta: 0,
        requestedBy: userId,
        requestedAt: new Date(),
        createdBy: userId,
        updatedBy: userId,
      },
      { transaction },
    );

    return ContractAmendment.findByPk(amendment.id, {
      include: buildContractAmendmentInclude(),
      transaction,
    });
  });
};

export const getContractAmendmentById = async (id: number) => {
  const amendment = await ContractAmendment.findByPk(id, {
    include: buildContractAmendmentInclude(),
  });

  if (!amendment) {
    throw new WorkflowDomainError("Contract amendment not found", 404);
  }

  return amendment;
};

export const listContractAmendments = async ({
  contractId,
  eventId,
  status,
  search,
  page = 1,
  limit = 20,
}: {
  contractId?: number;
  eventId?: number;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const offset = (page - 1) * limit;
  const where: WhereOptions = {};

  if (typeof contractId === "number" && contractId > 0) {
    where.contractId = contractId;
  }

  if (typeof eventId === "number" && eventId > 0) {
    where.eventId = eventId;
  }

  if (status && status.trim() !== "") {
    where.status = status.trim();
  }

  if (search && search.trim() !== "") {
    Object.assign(where, {
      [Op.or]: [
        { amendmentNumber: { [Op.like]: `%${search.trim()}%` } },
        { reason: { [Op.like]: `%${search.trim()}%` } },
        { notes: { [Op.like]: `%${search.trim()}%` } },
      ],
    });
  }

  const { count, rows } = await ContractAmendment.findAndCountAll({
    where,
    include: [
      {
        model: Contract,
        as: "contract",
        required: false,
      },
      {
        model: Event,
        as: "event",
        required: false,
      },
      {
        model: User,
        as: "requestedByUser",
        required: false,
        attributes: ["id", "fullName", "email"],
      },
      {
        model: User,
        as: "approvedByUser",
        required: false,
        attributes: ["id", "fullName", "email"],
      },
    ],
    order: [["id", "DESC"]],
    limit,
    offset,
    distinct: true,
  });

  return {
    count,
    rows,
    page,
    limit,
    pages: Math.ceil(count / limit),
  };
};

export const addContractAmendmentItem = async ({
  amendmentId,
  payload,
  userId,
}: {
  amendmentId: number;
  payload: {
    changeType: "add_service" | "remove_service";
    targetContractItemId?: number | null;
    targetEventServiceId?: number | null;
    targetExecutionServiceDetailId?: number | null;
    serviceId?: number | null;
    itemName?: string | null;
    category?: string | null;
    quantity?: number | string | null;
    unitPrice?: number | string | null;
    totalPrice?: number | string | null;
    notes?: string | null;
    sortOrder?: number;
  };
  userId: number | null;
}) => {
  return sequelize.transaction(async (transaction) => {
    const amendment = await loadAmendmentOrFail(amendmentId, transaction);
    assertAmendmentEditable(amendment);

    if (payload.changeType === "add_service") {
      const service = await assertAddServicePayload({
        serviceId: payload.serviceId ?? null,
      });

      const sortOrder =
        typeof payload.sortOrder === "number"
          ? payload.sortOrder
          : await getNextAmendmentItemSortOrder(amendment.id, transaction);

      const item = await ContractAmendmentItem.create(
        {
          amendmentId: amendment.id,
          changeType: "add_service",
          serviceId: service.id,
          itemName: payload.itemName ?? service.name,
          category: payload.category ?? service.category ?? null,
          quantity: round3(payload.quantity),
          unitPrice: round3(payload.unitPrice),
          totalPrice:
            typeof payload.totalPrice !== "undefined" &&
            payload.totalPrice !== null
              ? round3(payload.totalPrice)
              : round3(
                  Number(payload.quantity ?? 0) *
                    Number(payload.unitPrice ?? 0),
                ),
          notes: payload.notes ?? null,
          sortOrder,
          status: "pending",
          createdBy: userId,
          updatedBy: userId,
        },
        { transaction },
      );

      await recomputeAmendmentTotals({
        amendment,
        transaction,
      });

      return ContractAmendmentItem.findByPk(item.id, {
        include: [
          {
            model: Service,
            as: "service",
            required: false,
          },
        ],
        transaction,
      });
    }

    if (payload.changeType === "remove_service") {
      const contractItem = await assertRemoveServicePayload({
        amendment,
        targetContractItemId: payload.targetContractItemId ?? null,
      });

      let targetEventServiceId =
        payload.targetEventServiceId ?? contractItem.eventServiceId ?? null;
      let targetExecutionServiceDetailId =
        payload.targetExecutionServiceDetailId ?? null;

      if (!targetExecutionServiceDetailId && contractItem.serviceId) {
        const executionBrief = await ExecutionBrief.findOne({
          where: { eventId: amendment.eventId },
          transaction,
        });

        if (executionBrief) {
          const executionServiceDetail = await ExecutionServiceDetail.findOne({
            where: {
              briefId: executionBrief.id,
              serviceId: contractItem.serviceId,
            },
            transaction,
          });

          targetExecutionServiceDetailId = executionServiceDetail?.id ?? null;
        }
      }

      const sortOrder =
        typeof payload.sortOrder === "number"
          ? payload.sortOrder
          : await getNextAmendmentItemSortOrder(amendment.id, transaction);

      const item = await ContractAmendmentItem.create(
        {
          amendmentId: amendment.id,
          changeType: "remove_service",
          targetContractItemId: contractItem.id,
          targetEventServiceId,
          targetExecutionServiceDetailId,
          serviceId: contractItem.serviceId ?? null,
          itemName: contractItem.itemName,
          category: contractItem.category ?? null,
          quantity: round3(contractItem.quantity),
          unitPrice: round3(contractItem.unitPrice),
          totalPrice: round3(contractItem.totalPrice),
          notes: payload.notes ?? contractItem.notes ?? null,
          sortOrder,
          status: "pending",
          createdBy: userId,
          updatedBy: userId,
        },
        { transaction },
      );

      await recomputeAmendmentTotals({
        amendment,
        transaction,
      });

      return ContractAmendmentItem.findByPk(item.id, {
        include: [
          {
            model: Service,
            as: "service",
            required: false,
          },
          {
            model: ContractItem,
            as: "targetContractItem",
            required: false,
            paranoid: false,
          },
          {
            model: EventService,
            as: "targetEventService",
            required: false,
            paranoid: false,
          },
          {
            model: ExecutionServiceDetail,
            as: "targetExecutionServiceDetail",
            required: false,
            paranoid: false,
          },
        ],
        transaction,
      });
    }

    throw new WorkflowDomainError(
      "Unsupported amendment item change type",
      400,
    );
  });
};

export const updateContractAmendmentItem = async ({
  amendmentId,
  itemId,
  payload,
  userId,
}: {
  amendmentId: number;
  itemId: number;
  payload: {
    itemName?: string;
    category?: string;
    quantity?: number;
    unitPrice?: number;
    totalPrice?: number | null;
    notes?: string | null;
    sortOrder?: number;
    status?: "pending" | "applied" | "cancelled";
  };
  userId: number | null;
}) => {
  return sequelize.transaction(async (transaction) => {
    const amendment = await loadAmendmentOrFail(amendmentId, transaction);
    assertAmendmentEditable(amendment);

    const item = await loadAmendmentItemOrFail(
      amendment.id,
      itemId,
      transaction,
    );

    if (item.changeType === "remove_service") {
      if (
        typeof payload.itemName !== "undefined" ||
        typeof payload.category !== "undefined" ||
        typeof payload.quantity !== "undefined" ||
        typeof payload.unitPrice !== "undefined" ||
        typeof payload.totalPrice !== "undefined"
      ) {
        throw new WorkflowDomainError(
          "remove_service item allows only notes, sortOrder, and status updates in this MVP",
          400,
        );
      }
    }

    const nextQuantity =
      typeof payload.quantity !== "undefined"
        ? round3(payload.quantity)
        : item.quantity;

    const nextUnitPrice =
      typeof payload.unitPrice !== "undefined"
        ? round3(payload.unitPrice)
        : item.unitPrice;

    const nextTotalPrice =
      typeof payload.totalPrice !== "undefined"
        ? payload.totalPrice === null
          ? round3(Number(nextQuantity ?? 0) * Number(nextUnitPrice ?? 0))
          : round3(payload.totalPrice)
        : item.totalPrice;

    await item.update(
      {
        itemName:
          typeof payload.itemName !== "undefined"
            ? payload.itemName
            : item.itemName,
        category:
          typeof payload.category !== "undefined"
            ? payload.category
            : item.category,
        quantity:
          typeof payload.quantity !== "undefined"
            ? nextQuantity
            : item.quantity,
        unitPrice:
          typeof payload.unitPrice !== "undefined"
            ? nextUnitPrice
            : item.unitPrice,
        totalPrice: nextTotalPrice,
        notes:
          typeof payload.notes !== "undefined" ? payload.notes : item.notes,
        sortOrder:
          typeof payload.sortOrder !== "undefined"
            ? payload.sortOrder
            : item.sortOrder,
        status:
          typeof payload.status !== "undefined" ? payload.status : item.status,
        updatedBy: userId,
      },
      { transaction },
    );

    await recomputeAmendmentTotals({
      amendment,
      transaction,
    });

    return ContractAmendmentItem.findByPk(item.id, {
      include: [
        {
          model: Service,
          as: "service",
          required: false,
        },
        {
          model: ContractItem,
          as: "targetContractItem",
          required: false,
          paranoid: false,
        },
        {
          model: EventService,
          as: "targetEventService",
          required: false,
          paranoid: false,
        },
        {
          model: ExecutionServiceDetail,
          as: "targetExecutionServiceDetail",
          required: false,
          paranoid: false,
        },
      ],
      transaction,
    });
  });
};

export const deleteContractAmendmentItem = async ({
  itemId,
  userId,
}: {
  itemId: number;
  userId: number | null;
}) => {
  return sequelize.transaction(async (transaction) => {
    const item = await ContractAmendmentItem.findByPk(itemId, {
      transaction,
    });

    if (!item) {
      throw new WorkflowDomainError("Contract amendment item not found", 404);
    }

    const amendment = await loadAmendmentOrFail(item.amendmentId, transaction);
    assertAmendmentEditable(amendment);

    await item.update(
      {
        updatedBy: userId,
      },
      { transaction },
    );

    await item.destroy({ transaction });

    await recomputeAmendmentTotals({
      amendment,
      transaction,
    });

    return {
      success: true,
    };
  });
};

export const approveContractAmendment = async ({
  amendmentId,
  notes,
  userId,
}: {
  amendmentId: number;
  notes?: string | null;
  userId: number | null;
}) => {
  return sequelize.transaction(async (transaction) => {
    const amendment = await loadAmendmentOrFail(amendmentId, transaction);

    assertAmendmentCanBeApproved(amendment);

    const items = await ContractAmendmentItem.count({
      where: {
        amendmentId: amendment.id,
        status: {
          [Op.ne]: "cancelled",
        },
      },
      transaction,
    });

    if (items === 0) {
      throw new WorkflowDomainError(
        "Cannot approve empty contract amendment",
        400,
      );
    }

    await recomputeAmendmentTotals({
      amendment,
      transaction,
    });

    await amendment.update(
      {
        status: "approved",
        notes: notes ?? amendment.notes ?? null,
        approvedBy: userId,
        approvedAt: new Date(),
        updatedBy: userId,
      },
      { transaction },
    );

    return ContractAmendment.findByPk(amendment.id, {
      include: buildContractAmendmentInclude(),
      transaction,
    });
  });
};

export const rejectContractAmendment = async ({
  amendmentId,
  reason,
  notes,
  userId,
}: {
  amendmentId: number;
  reason: string;
  notes?: string | null;
  userId: number | null;
}) => {
  return sequelize.transaction(async (transaction) => {
    const amendment = await loadAmendmentOrFail(amendmentId, transaction);

    assertAmendmentCanBeRejected(amendment);

    const composedReason = reason?.trim();
    if (!composedReason) {
      throw new WorkflowDomainError("reason is required", 400);
    }

    await amendment.update(
      {
        status: "rejected",
        reason: composedReason,
        notes: notes ?? amendment.notes ?? null,
        updatedBy: userId,
      },
      { transaction },
    );

    return ContractAmendment.findByPk(amendment.id, {
      include: buildContractAmendmentInclude(),
      transaction,
    });
  });
};
