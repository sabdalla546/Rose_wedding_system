import { Transaction } from "sequelize";
import {
  Contract,
  ContractAmendment,
  ContractAmendmentItem,
  ContractItem,
  EventService,
  ExecutionBrief,
  ExecutionServiceDetail,
  Service,
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

const getTemplateKeyFromService = (service: {
  name?: string | null;
  category?: string | null;
}) => {
  const source =
    `${service.category ?? ""} ${service.name ?? ""}`.toLowerCase();

  if (source.includes("كوش") || source.includes("kosha")) {
    return "kosha_setup";
  }

  if (source.includes("ورد") || source.includes("flower")) {
    return "flowers_setup";
  }

  if (source.includes("مدخل") || source.includes("entrance")) {
    return "entrance_setup";
  }

  if (source.includes("بوفيه") || source.includes("buffet")) {
    return "buffet_setup";
  }

  if (source.includes("طقم") || source.includes("seating")) {
    return "front_seating_setup";
  }

  return "generic_execution_setup";
};

const computeItemTotal = ({
  quantity,
  unitPrice,
  totalPrice,
}: {
  quantity: number | string | null | undefined;
  unitPrice: number | string | null | undefined;
  totalPrice?: number | string | null;
}) => {
  if (typeof totalPrice !== "undefined" && totalPrice !== null) {
    return round3(totalPrice);
  }

  return round3(Number(quantity ?? 0) * Number(unitPrice ?? 0));
};

const computeContractTotals = (
  items: Array<{ totalPrice?: number | string | null }>,
  discountAmount?: number | string | null,
) => {
  const subtotal = round3(
    items.reduce((sum, item) => sum + Number(item.totalPrice ?? 0), 0),
  );

  const discount = round3(discountAmount ?? 0);
  const totalAmount = round3(Math.max(0, subtotal - discount));

  return {
    subtotal,
    discountAmount: discount,
    totalAmount,
  };
};

const getNextContractItemSortOrder = async (
  contractId: number,
  transaction?: Transaction,
) => {
  const lastRow = await ContractItem.findOne({
    where: { contractId },
    order: [
      ["sortOrder", "DESC"],
      ["id", "DESC"],
    ],
    transaction,
  });

  return typeof lastRow?.sortOrder === "number" ? lastRow.sortOrder + 1 : 0;
};

const getNextEventServiceSortOrder = async (
  eventId: number,
  transaction?: Transaction,
) => {
  const lastRow = await EventService.findOne({
    where: { eventId },
    order: [
      ["sortOrder", "DESC"],
      ["id", "DESC"],
    ],
    transaction,
  });

  return typeof lastRow?.sortOrder === "number" ? lastRow.sortOrder + 1 : 0;
};

const getNextExecutionServiceDetailSortOrder = async (
  briefId: number,
  transaction?: Transaction,
) => {
  const lastRow = await ExecutionServiceDetail.findOne({
    where: { briefId },
    order: [
      ["sortOrder", "DESC"],
      ["id", "DESC"],
    ],
    transaction,
  });

  return typeof lastRow?.sortOrder === "number" ? lastRow.sortOrder + 1 : 0;
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

const loadAmendmentItems = async (
  amendmentId: number,
  transaction?: Transaction,
) => {
  return ContractAmendmentItem.findAll({
    where: { amendmentId },
    order: [
      ["sortOrder", "ASC"],
      ["id", "ASC"],
    ],
    transaction,
  });
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

  const totalDelta = subtotalDelta;

  await amendment.update(
    {
      subtotalDelta,
      discountDelta: 0,
      totalDelta,
    },
    { transaction },
  );

  return {
    subtotalDelta,
    discountDelta: 0,
    totalDelta,
  };
};

const recomputeContractHeader = async ({
  contract,
  userId,
  transaction,
}: {
  contract: Contract;
  userId: number | null;
  transaction?: Transaction;
}) => {
  const items = await ContractItem.findAll({
    where: { contractId: contract.id },
    transaction,
  });

  const totals = computeContractTotals(items, contract.discountAmount ?? 0);

  await contract.update(
    {
      subtotal: totals.subtotal,
      discountAmount: totals.discountAmount,
      totalAmount: totals.totalAmount,
      updatedBy: userId,
    },
    { transaction },
  );

  return totals;
};

const findMatchingEventService = async ({
  eventId,
  serviceId,
  itemName,
  transaction,
}: {
  eventId: number;
  serviceId?: number | null;
  itemName?: string | null;
  transaction?: Transaction;
}) => {
  if (typeof serviceId === "number" && serviceId > 0) {
    const byServiceId = await EventService.findOne({
      where: {
        eventId,
        serviceId,
      },
      order: [
        ["sortOrder", "ASC"],
        ["id", "ASC"],
      ],
      transaction,
    });

    if (byServiceId) return byServiceId;
  }

  const normalizedName = normalizeText(itemName);
  if (!normalizedName) return null;

  const rows = await EventService.findAll({
    where: { eventId },
    order: [
      ["sortOrder", "ASC"],
      ["id", "ASC"],
    ],
    transaction,
  });

  return (
    rows.find(
      (row) => normalizeText(row.serviceNameSnapshot) === normalizedName,
    ) ?? null
  );
};

const ensureEventServiceForAddItem = async ({
  amendmentItem,
  eventId,
  userId,
  transaction,
}: {
  amendmentItem: ContractAmendmentItem;
  eventId: number;
  userId: number | null;
  transaction?: Transaction;
}) => {
  if (amendmentItem.targetEventServiceId) {
    const linked = await EventService.findOne({
      where: {
        id: amendmentItem.targetEventServiceId,
        eventId,
      },
      transaction,
    });

    if (linked) {
      await linked.update(
        {
          status: "confirmed",
          serviceNameSnapshot:
            amendmentItem.itemName ?? linked.serviceNameSnapshot,
          category: amendmentItem.category ?? linked.category,
          quantity: round3(amendmentItem.quantity ?? linked.quantity),
          unitPrice: round3(amendmentItem.unitPrice ?? linked.unitPrice),
          totalPrice: computeItemTotal({
            quantity: amendmentItem.quantity ?? linked.quantity,
            unitPrice: amendmentItem.unitPrice ?? linked.unitPrice,
            totalPrice: amendmentItem.totalPrice ?? linked.totalPrice,
          }),
          notes:
            typeof amendmentItem.notes !== "undefined"
              ? amendmentItem.notes
              : linked.notes,
          updatedBy: userId,
        },
        { transaction },
      );

      return linked;
    }
  }

  const existing = await findMatchingEventService({
    eventId,
    serviceId: amendmentItem.serviceId ?? null,
    itemName: amendmentItem.itemName ?? null,
    transaction,
  });

  if (existing) {
    await existing.update(
      {
        status: "confirmed",
        serviceNameSnapshot:
          amendmentItem.itemName ?? existing.serviceNameSnapshot,
        category: amendmentItem.category ?? existing.category,
        quantity: round3(amendmentItem.quantity ?? existing.quantity),
        unitPrice: round3(amendmentItem.unitPrice ?? existing.unitPrice),
        totalPrice: computeItemTotal({
          quantity: amendmentItem.quantity ?? existing.quantity,
          unitPrice: amendmentItem.unitPrice ?? existing.unitPrice,
          totalPrice: amendmentItem.totalPrice ?? existing.totalPrice,
        }),
        notes:
          typeof amendmentItem.notes !== "undefined"
            ? amendmentItem.notes
            : existing.notes,
        updatedBy: userId,
      },
      { transaction },
    );

    return existing;
  }

  let category = amendmentItem.category ?? null;

  if (
    (!category || String(category).trim() === "") &&
    amendmentItem.serviceId
  ) {
    const service = await Service.findByPk(amendmentItem.serviceId, {
      transaction,
    });

    category = service?.category ?? null;
  }

  const nextSortOrder = await getNextEventServiceSortOrder(
    eventId,
    transaction,
  );

  return EventService.create(
    {
      eventId,
      serviceId:
        typeof amendmentItem.serviceId === "number" &&
        amendmentItem.serviceId > 0
          ? amendmentItem.serviceId
          : null,
      serviceNameSnapshot: amendmentItem.itemName ?? "Service",
      category: category ?? "general",
      quantity: round3(amendmentItem.quantity),
      unitPrice: round3(amendmentItem.unitPrice),
      totalPrice: computeItemTotal({
        quantity: amendmentItem.quantity,
        unitPrice: amendmentItem.unitPrice,
        totalPrice: amendmentItem.totalPrice,
      }),
      notes: amendmentItem.notes ?? null,
      status: "confirmed",
      sortOrder: nextSortOrder,
      createdBy: userId,
      updatedBy: userId,
    },
    { transaction },
  );
};

const ensureExecutionServiceDetailForEventService = async ({
  executionBrief,
  eventService,
  userId,
  transaction,
}: {
  executionBrief: ExecutionBrief;
  eventService: EventService;
  userId: number | null;
  transaction?: Transaction;
}) => {
  const existing = await ExecutionServiceDetail.findOne({
    where: {
      briefId: executionBrief.id,
      serviceId: eventService.serviceId as number,
    },
    paranoid: false,
    transaction,
  });

  const templateKey = getTemplateKeyFromService({
    name: eventService.serviceNameSnapshot,
    category: eventService.category,
  });

  if (existing) {
    if (
      typeof (existing as any).deletedAt !== "undefined" &&
      (existing as any).deletedAt
    ) {
      await (existing as any).restore({ transaction });
    }

    await existing.update(
      {
        serviceNameSnapshot:
          eventService.serviceNameSnapshot ?? existing.serviceNameSnapshot,
        templateKey,
        status: "pending",
      },
      { transaction },
    );

    return existing;
  }

  const nextSortOrder = await getNextExecutionServiceDetailSortOrder(
    executionBrief.id,
    transaction,
  );

  return ExecutionServiceDetail.create(
    {
      briefId: executionBrief.id,
      eventId: executionBrief.eventId,
      serviceId: eventService.serviceId as number,
      serviceNameSnapshot: eventService.serviceNameSnapshot ?? null,
      templateKey,
      sortOrder: nextSortOrder,
      detailsJson: null,
      status: "pending",
    },
    { transaction },
  );
};

const applyAddServiceItem = async ({
  amendmentItem,
  contract,
  executionBrief,
  userId,
  transaction,
}: {
  amendmentItem: ContractAmendmentItem;
  contract: Contract;
  executionBrief: ExecutionBrief | null;
  userId: number | null;
  transaction?: Transaction;
}) => {
  if (
    typeof amendmentItem.serviceId !== "number" ||
    amendmentItem.serviceId <= 0
  ) {
    throw new WorkflowDomainError(
      "Add service amendment item requires valid serviceId",
      400,
    );
  }

  const service = await Service.findByPk(amendmentItem.serviceId, {
    transaction,
  });

  if (!service) {
    throw new WorkflowDomainError("Service not found", 404);
  }

  const nextContractItemSortOrder = await getNextContractItemSortOrder(
    contract.id,
    transaction,
  );

  const contractItem = await ContractItem.create(
    {
      contractId: contract.id,
      itemType: "service",
      eventServiceId: null,
      serviceId: service.id,
      itemName: amendmentItem.itemName ?? service.name,
      category: amendmentItem.category ?? service.category ?? null,
      quantity: round3(amendmentItem.quantity),
      unitPrice: round3(amendmentItem.unitPrice),
      totalPrice: computeItemTotal({
        quantity: amendmentItem.quantity,
        unitPrice: amendmentItem.unitPrice,
        totalPrice: amendmentItem.totalPrice,
      }),
      notes: amendmentItem.notes ?? null,
      sortOrder:
        typeof amendmentItem.sortOrder === "number"
          ? amendmentItem.sortOrder
          : nextContractItemSortOrder,
      createdBy: userId,
      updatedBy: userId,
    },
    { transaction },
  );

  const eventService = await ensureEventServiceForAddItem({
    amendmentItem,
    eventId: contract.eventId,
    userId,
    transaction,
  });

  await contractItem.update(
    {
      eventServiceId: eventService.id,
      updatedBy: userId,
    },
    { transaction },
  );

  let executionServiceDetail: ExecutionServiceDetail | null = null;

  if (executionBrief && eventService.serviceId) {
    executionServiceDetail = await ensureExecutionServiceDetailForEventService({
      executionBrief,
      eventService,
      userId,
      transaction,
    });
  }

  await amendmentItem.update(
    {
      targetContractItemId: contractItem.id,
      targetEventServiceId: eventService.id,
      targetExecutionServiceDetailId: executionServiceDetail?.id ?? null,
      totalPrice: contractItem.totalPrice,
      status: "applied",
      updatedBy: userId,
    },
    { transaction },
  );

  return {
    contractItem,
    eventService,
    executionServiceDetail,
  };
};

const resolveExecutionServiceDetailForRemoval = async ({
  amendmentItem,
  executionBrief,
  serviceId,
  transaction,
}: {
  amendmentItem: ContractAmendmentItem;
  executionBrief: ExecutionBrief | null;
  serviceId?: number | null;
  transaction?: Transaction;
}) => {
  if (amendmentItem.targetExecutionServiceDetailId) {
    const byId = await ExecutionServiceDetail.findOne({
      where: { id: amendmentItem.targetExecutionServiceDetailId },
      transaction,
    });

    if (byId) return byId;
  }

  if (!executionBrief || !(typeof serviceId === "number" && serviceId > 0)) {
    return null;
  }

  return ExecutionServiceDetail.findOne({
    where: {
      briefId: executionBrief.id,
      serviceId,
    },
    transaction,
  });
};

const applyRemoveServiceItem = async ({
  amendmentItem,
  contract,
  executionBrief,
  userId,
  transaction,
}: {
  amendmentItem: ContractAmendmentItem;
  contract: Contract;
  executionBrief: ExecutionBrief | null;
  userId: number | null;
  transaction?: Transaction;
}) => {
  if (
    typeof amendmentItem.targetContractItemId !== "number" ||
    amendmentItem.targetContractItemId <= 0
  ) {
    throw new WorkflowDomainError(
      "Remove service amendment item requires targetContractItemId",
      400,
    );
  }

  const contractItem = await ContractItem.findOne({
    where: {
      id: amendmentItem.targetContractItemId,
      contractId: contract.id,
    },
    transaction,
  });

  if (!contractItem) {
    throw new WorkflowDomainError("Target contract item not found", 404);
  }

  if (contractItem.itemType !== "service") {
    throw new WorkflowDomainError(
      "Target contract item is not a service item",
      400,
    );
  }

  let eventService: EventService | null = null;

  if (amendmentItem.targetEventServiceId) {
    eventService = await EventService.findOne({
      where: {
        id: amendmentItem.targetEventServiceId,
        eventId: contract.eventId,
      },
      transaction,
    });
  }

  if (!eventService && contractItem.eventServiceId) {
    eventService = await EventService.findOne({
      where: {
        id: contractItem.eventServiceId,
        eventId: contract.eventId,
      },
      transaction,
    });
  }

  if (!eventService && contractItem.serviceId) {
    eventService = await EventService.findOne({
      where: {
        eventId: contract.eventId,
        serviceId: contractItem.serviceId,
      },
      order: [
        ["sortOrder", "ASC"],
        ["id", "ASC"],
      ],
      transaction,
    });
  }

  const executionServiceDetail = await resolveExecutionServiceDetailForRemoval({
    amendmentItem,
    executionBrief,
    serviceId: eventService?.serviceId ?? contractItem.serviceId ?? null,
    transaction,
  });

  if (eventService) {
    await eventService.update(
      {
        status: "cancelled",
        updatedBy: userId,
      },
      { transaction },
    );
  }

  if (executionServiceDetail) {
    await executionServiceDetail.destroy({ transaction });
  }

  const removedTotalPrice = round3(contractItem.totalPrice);

  await contractItem.destroy({ transaction });

  await amendmentItem.update(
    {
      targetEventServiceId:
        eventService?.id ?? amendmentItem.targetEventServiceId ?? null,
      targetExecutionServiceDetailId:
        executionServiceDetail?.id ??
        amendmentItem.targetExecutionServiceDetailId ??
        null,
      serviceId: amendmentItem.serviceId ?? contractItem.serviceId ?? null,
      itemName: amendmentItem.itemName ?? contractItem.itemName,
      category: amendmentItem.category ?? contractItem.category ?? null,
      quantity: amendmentItem.quantity ?? round3(contractItem.quantity),
      unitPrice: amendmentItem.unitPrice ?? round3(contractItem.unitPrice),
      totalPrice: amendmentItem.totalPrice ?? removedTotalPrice,
      status: "applied",
      updatedBy: userId,
    },
    { transaction },
  );

  return {
    removedContractItemId: contractItem.id,
    cancelledEventServiceId: eventService?.id ?? null,
    removedExecutionServiceDetailId: executionServiceDetail?.id ?? null,
  };
};

const assertAmendmentCanBeApplied = (amendment: ContractAmendment) => {
  if (amendment.status === "applied") {
    throw new WorkflowDomainError("Contract amendment already applied", 409);
  }

  if (amendment.status === "rejected") {
    throw new WorkflowDomainError(
      "Rejected contract amendment cannot be applied",
      400,
    );
  }

  if (amendment.status === "cancelled") {
    throw new WorkflowDomainError(
      "Cancelled contract amendment cannot be applied",
      400,
    );
  }

  if (amendment.status !== "approved") {
    throw new WorkflowDomainError(
      "Only approved contract amendment can be applied",
      400,
    );
  }
};

export const applyContractAmendment = async ({
  amendmentId,
  userId,
}: {
  amendmentId: number;
  userId: number | null;
}) => {
  return sequelize.transaction(async (transaction) => {
    const amendment = await loadAmendmentOrFail(amendmentId, transaction);

    assertAmendmentCanBeApplied(amendment);

    const contract = await loadContractOrFail(
      amendment.contractId,
      transaction,
    );

    const executionBrief = await ExecutionBrief.findOne({
      where: {
        eventId: amendment.eventId,
      },
      transaction,
    });

    const items = await loadAmendmentItems(amendment.id, transaction);

    if (items.length === 0) {
      throw new WorkflowDomainError(
        "Cannot apply empty contract amendment",
        400,
      );
    }

    for (const amendmentItem of items) {
      if (amendmentItem.status === "cancelled") {
        continue;
      }

      if (amendmentItem.status === "applied") {
        continue;
      }

      if (amendmentItem.changeType === "add_service") {
        await applyAddServiceItem({
          amendmentItem,
          contract,
          executionBrief,
          userId,
          transaction,
        });
        continue;
      }

      if (amendmentItem.changeType === "remove_service") {
        await applyRemoveServiceItem({
          amendmentItem,
          contract,
          executionBrief,
          userId,
          transaction,
        });
      }
    }

    await recomputeContractHeader({
      contract,
      userId,
      transaction,
    });

    await recomputeAmendmentTotals({
      amendment,
      transaction,
    });

    await amendment.update(
      {
        status: "applied",
        appliedAt: new Date(),
        updatedBy: userId,
      },
      { transaction },
    );

    const freshAmendment = await ContractAmendment.findByPk(amendment.id, {
      include: [
        {
          model: ContractAmendmentItem,
          as: "items",
          required: false,
        },
      ],
      transaction,
    });

    return freshAmendment;
  });
};
