import { Includeable, Op, Order, Transaction } from "sequelize";
import type { ExecutionBriefStatus } from "../../models/executionBrief.model";
import {
  Contract,
  Event,
  EventService,
  ExecutionAttachment,
  ExecutionBrief,
  ExecutionServiceDetail,
  Quotation,
  Service,
  User,
  sequelize,
} from "../../models";
import { syncContractItemsToEventOperationalData } from "./executionOperationalSync.service";
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
  EXECUTION_BRIEF_TRANSITIONS,
  assertValidExecutionBriefTransition,
  normalizeContractStatus,
  normalizeExecutionBriefStatus,
  normalizeQuotationStatus,
  resolveTransitionPath,
} from "../workflow/workflow.status";

const serviceDetailsOrder: Order = [
  ["sortOrder", "ASC"],
  ["id", "ASC"],
];

export const getTemplateKeyFromService = (service: {
  name?: string | null;
  category?: string | null;
}) => {
  const source =
    `${service.category ?? ""} ${service.name ?? ""}`.toLowerCase();

  if (source.includes("ÙƒÙˆØ´") || source.includes("kosha"))
    return "kosha_setup";
  if (source.includes("ÙˆØ±Ø¯") || source.includes("flower")) {
    return "flowers_setup";
  }
  if (source.includes("Ù…Ø¯Ø®Ù„") || source.includes("entrance")) {
    return "entrance_setup";
  }
  if (source.includes("Ø¨ÙˆÙÙŠÙ‡") || source.includes("buffet")) {
    return "buffet_setup";
  }
  if (source.includes("Ø·Ù‚Ù…") || source.includes("seating")) {
    return "front_seating_setup";
  }

  return "generic_execution_setup";
};

export const buildExecutionBriefInclude = (search?: string): Includeable[] => {
  const eventInclude: Includeable = search
    ? {
        model: Event,
        as: "event",
        required: true,
        where: {
          [Op.or]: [
            { title: { [Op.like]: `%${search}%` } },
            { eventType: { [Op.like]: `%${search}%` } },
          ],
        },
      }
    : {
        model: Event,
        as: "event",
      };

  return [
    eventInclude,
    {
      model: Quotation,
      as: "quotation",
      required: false,
    },
    {
      model: Contract,
      as: "contract",
      required: false,
    },
    {
      model: User,
      as: "creator",
      required: false,
      attributes: ["id", "fullName", "email"],
    },
    {
      model: User,
      as: "updater",
      required: false,
      attributes: ["id", "fullName", "email"],
    },
    {
      model: ExecutionServiceDetail,
      as: "serviceDetails",
      required: false,
      separate: true,
      order: serviceDetailsOrder,
      include: [
        {
          model: Service,
          as: "service",
          required: false,
        },
        {
          model: ExecutionAttachment,
          as: "attachments",
          required: false,
        },
      ],
    },
    {
      model: ExecutionAttachment,
      as: "attachments",
      required: false,
    },
  ];
};
const buildExecutionDetailRowsFromEventServices = async ({
  briefId,
  eventId,
  transaction,
}: {
  briefId: number;
  eventId: number;
  transaction?: Transaction;
}) => {
  const eventServices = await EventService.findAll({
    where: { eventId },
    include: [
      {
        model: Service,
        as: "service",
        required: false,
      },
    ],
    order: [
      ["sortOrder", "ASC"],
      ["id", "ASC"],
    ],
    transaction,
  });

  return eventServices
    .filter((item) => {
      const hasServiceId =
        typeof item.serviceId === "number" && item.serviceId > 0;
      const hasSnapshotName =
        String(item.serviceNameSnapshot ?? "").trim() !== "";
      const hasRelatedServiceName =
        String(
          (item as EventService & { service?: Service | null }).service?.name ??
            "",
        ).trim() !== "";

      return hasServiceId || hasSnapshotName || hasRelatedServiceName;
    })
    .map((item, index) => {
      const serviceRecord = (
        item as EventService & { service?: Service | null }
      ).service;

      const serviceName =
        item.serviceNameSnapshot ?? serviceRecord?.name ?? null;

      const serviceCategory =
        item.category ??
        (serviceRecord as (Service & { category?: string | null }) | null)
          ?.category ??
        null;

      return {
        briefId,
        eventId,
        serviceId: item.serviceId as number,
        serviceNameSnapshot: serviceName,
        templateKey: getTemplateKeyFromService({
          name: serviceName,
          category: serviceCategory,
        }),
        sortOrder: index,
        detailsJson: null,
        status: "pending" as const,
      };
    })
    .filter((row) => typeof row.serviceId === "number" && row.serviceId > 0);
};

export async function assertExecutionBriefReferences({
  eventId,
  quotationId,
  contractId,
}: {
  eventId: number;
  quotationId?: number | null;
  contractId?: number | null;
}) {
  const event = await Event.findByPk(eventId);
  if (!event) {
    throw new WorkflowDomainError("Event not found", 404);
  }

  let quotation: Quotation | null = null;
  if (quotationId) {
    quotation = await Quotation.findByPk(quotationId);
    if (!quotation) {
      throw new WorkflowDomainError("Quotation not found", 404);
    }

    if (quotation.eventId !== event.id) {
      throw new WorkflowDomainError("Quotation does not belong to event", 400);
    }
  }

  let contract: Contract | null = null;
  if (contractId) {
    contract = await Contract.findByPk(contractId);
    if (!contract) {
      throw new WorkflowDomainError("Contract not found", 404);
    }

    if (contract.eventId !== event.id) {
      throw new WorkflowDomainError("Contract does not belong to event", 400);
    }
  }

  return {
    event,
    quotation,
    contract,
  };
}

export async function assertExecutionBriefCreationAllowed({
  eventId,
  quotationId,
  contractId,
}: {
  eventId: number;
  quotationId?: number | null;
  contractId?: number | null;
}) {
  const existingBrief = await ExecutionBrief.findOne({ where: { eventId } });
  if (existingBrief) {
    recordWorkflowBlock({
      entityName: "execution_brief",
      entityId: existingBrief.id,
      actionName: "execution_brief.create_for_event",
      currentStatus: normalizeExecutionBriefStatus(existingBrief.status),
      attemptedBy: null,
      message: "Execution brief already exists for this event",
      sourceRefs: {
        eventId,
        quotationId: quotationId ?? null,
        contractId: contractId ?? null,
        executionBriefId: existingBrief.id,
      },
    });

    throw new WorkflowDomainError(
      "Execution brief already exists for this event",
      409,
    );
  }

  const refs = await assertExecutionBriefReferences({
    eventId,
    quotationId,
    contractId,
  });

  if (refs.event.status === "cancelled") {
    recordWorkflowBlock({
      entityName: "event",
      entityId: refs.event.id,
      actionName: "execution_brief.create_from_event",
      currentStatus: refs.event.status,
      attemptedBy: null,
      message: "Cannot create execution brief for cancelled event",
      sourceRefs: {
        sourceAppointmentId: refs.event.sourceAppointmentId ?? null,
        eventId: refs.event.id,
        quotationId: refs.quotation?.id ?? null,
        contractId: refs.contract?.id ?? null,
      },
    });

    throw new WorkflowDomainError(
      "Cannot create execution brief for cancelled event",
      400,
    );
  }

  if (refs.event.status !== "confirmed" && !contractId) {
    recordWorkflowBlock({
      entityName: "event",
      entityId: refs.event.id,
      actionName: "execution_brief.create_from_event",
      currentStatus: refs.event.status,
      attemptedBy: null,
      message: "Invalid status transition",
      sourceRefs: {
        sourceAppointmentId: refs.event.sourceAppointmentId ?? null,
        eventId: refs.event.id,
        quotationId: refs.quotation?.id ?? null,
        contractId: refs.contract?.id ?? null,
      },
      metadata: {
        requiresConfirmedEvent: true,
      },
    });

    throw invalidStatusTransitionError();
  }

  return refs;
}

export async function assertExecutionBriefCommercialReady(
  briefOrRefs:
    | ExecutionBrief
    | {
        event: Event;
        quotation?: Quotation | null;
        contract?: Contract | null;
      },
) {
  const refs =
    briefOrRefs instanceof ExecutionBrief
      ? await assertExecutionBriefReferences({
          eventId: briefOrRefs.eventId,
          quotationId: briefOrRefs.quotationId,
          contractId: briefOrRefs.contractId,
        })
      : briefOrRefs;

  if (refs.contract) {
    const contractStatus = normalizeContractStatus(refs.contract.status);
    if (
      contractStatus === "signed" ||
      contractStatus === "active" ||
      contractStatus === "completed"
    ) {
      return refs;
    }
  }

  if (
    !refs.quotation ||
    normalizeQuotationStatus(refs.quotation.status) !== "approved"
  ) {
    if (briefOrRefs instanceof ExecutionBrief) {
      recordWorkflowBlock({
        entityName: "execution_brief",
        entityId: briefOrRefs.id,
        actionName: "execution_brief.handoff",
        currentStatus: normalizeExecutionBriefStatus(briefOrRefs.status),
        attemptedBy: null,
        message:
          "Execution brief handoff requires approved quotation or contract",
        sourceRefs: {
          eventId: briefOrRefs.eventId,
          quotationId: briefOrRefs.quotationId ?? null,
          contractId: briefOrRefs.contractId ?? null,
          executionBriefId: briefOrRefs.id,
        },
      });
    }

    throw new WorkflowDomainError(
      "Execution brief handoff requires approved quotation or contract",
      400,
    );
  }

  return refs;
}

export async function createExecutionBriefWorkflow({
  eventId,
  quotationId = null,
  contractId = null,
  status = "draft",
  generalNotes = null,
  clientNotes = null,
  designerNotes = null,
  initializeFromEventServices = true,
  userId,
}: {
  eventId: number;
  quotationId?: number | null;
  contractId?: number | null;
  status?: ExecutionBriefStatus;
  generalNotes?: string | null;
  clientNotes?: string | null;
  designerNotes?: string | null;
  initializeFromEventServices?: boolean;
  userId: number | null;
}) {
  await assertExecutionBriefCreationAllowed({
    eventId,
    quotationId,
    contractId,
  });

  return sequelize.transaction(async (transaction) => {
    const brief = await ExecutionBrief.create(
      {
        eventId,
        quotationId,
        contractId,
        status,
        generalNotes,
        clientNotes,
        designerNotes,
        createdBy: userId,
        updatedBy: userId,
      },
      { transaction },
    );

    if (initializeFromEventServices) {
      if (contractId) {
        await syncContractItemsToEventOperationalData({
          eventId,
          contractId,
          userId,
          transaction,
        });
      }

      const detailRows = await buildExecutionDetailRowsFromEventServices({
        briefId: brief.id,
        eventId,
        transaction,
      });

      if (detailRows.length > 0) {
        await ExecutionServiceDetail.bulkCreate(detailRows, {
          ignoreDuplicates: true,
          transaction,
        });
      }
    }

    recordWorkflowAction({
      entityName: "execution_brief",
      entityId: brief.id,
      actionName: contractId
        ? "execution_brief.create_from_contract"
        : quotationId
          ? "execution_brief.create_from_quotation"
          : "execution_brief.create_from_event",
      actorId: userId,
      note: "Created execution brief operational snapshot",
      sourceRefs: {
        eventId,
        quotationId,
        contractId,
        executionBriefId: brief.id,
      },
      metadata: {
        initializeFromEventServices,
      },
    });

    return ExecutionBrief.findByPk(brief.id, {
      include: buildExecutionBriefInclude(),
      transaction,
    });
  });
}
type ExecutionBriefStatusActionInput = {
  brief: ExecutionBrief;
  nextStatus: ExecutionBriefStatus;
  actionName: string;
  userId: number | null;
  note?: string | null;
  reason?: string | null;
};

const applyExecutionBriefStatusAction = async ({
  brief,
  nextStatus,
  actionName,
  userId,
  note = null,
  reason = null,
}: ExecutionBriefStatusActionInput) => {
  const previousStatus = brief.status;
  assertValidExecutionBriefTransition(previousStatus, nextStatus);

  if (nextStatus === "handed_off" || nextStatus === "in_progress") {
    await assertExecutionBriefCommercialReady(brief);
  }

  await brief.update({
    status: nextStatus,
    updatedBy: userId,
  });

  recordWorkflowTransition({
    entityName: "execution_brief",
    entityId: brief.id,
    previousStatus: normalizeExecutionBriefStatus(previousStatus),
    nextStatus: normalizeExecutionBriefStatus(nextStatus),
    actionName,
    changedBy: userId,
    note,
    reason,
    sourceRefs: {
      eventId: brief.eventId,
      quotationId: brief.quotationId ?? null,
      contractId: brief.contractId ?? null,
      executionBriefId: brief.id,
    },
    metadata: {
      eventId: brief.eventId,
      quotationId: brief.quotationId ?? null,
      contractId: brief.contractId ?? null,
    },
  });

  return brief;
};

export const submitExecutionBriefForReview = (
  brief: ExecutionBrief,
  userId: number | null,
  note?: string | null,
) =>
  applyExecutionBriefStatusAction({
    brief,
    nextStatus: "under_review",
    actionName: "execution_brief.submit_for_review",
    userId,
    note,
  });

export const approveExecutionBrief = (
  brief: ExecutionBrief,
  userId: number | null,
  note?: string | null,
) =>
  applyExecutionBriefStatusAction({
    brief,
    nextStatus: "approved",
    actionName: "execution_brief.approve",
    userId,
    note,
  });

export const handoffExecutionBrief = (
  brief: ExecutionBrief,
  userId: number | null,
  note?: string | null,
) =>
  applyExecutionBriefStatusAction({
    brief,
    nextStatus: "handed_off",
    actionName: "execution_brief.handoff",
    userId,
    note,
  });

export const startExecutionBrief = (
  brief: ExecutionBrief,
  userId: number | null,
  note?: string | null,
) =>
  applyExecutionBriefStatusAction({
    brief,
    nextStatus: "in_progress",
    actionName: "execution_brief.start",
    userId,
    note,
  });

export const completeExecutionBriefWorkflow = (
  brief: ExecutionBrief,
  userId: number | null,
  note?: string | null,
) =>
  applyExecutionBriefStatusAction({
    brief,
    nextStatus: "completed",
    actionName: "execution_brief.complete",
    userId,
    note,
  });

export const cancelExecutionBrief = (
  brief: ExecutionBrief,
  userId: number | null,
  reason?: string | null,
  note?: string | null,
) =>
  applyExecutionBriefStatusAction({
    brief,
    nextStatus: "cancelled",
    actionName: "execution_brief.cancel",
    userId,
    note,
    reason,
  });

export const transitionExecutionBriefToStatus = async ({
  brief,
  targetStatus,
  userId,
  note,
  reason,
}: {
  brief: ExecutionBrief;
  targetStatus: ExecutionBriefStatus;
  userId: number | null;
  note?: string | null;
  reason?: string | null;
}) => {
  const path = resolveTransitionPath(
    EXECUTION_BRIEF_TRANSITIONS,
    normalizeExecutionBriefStatus(brief.status),
    normalizeExecutionBriefStatus(targetStatus),
  );

  for (const nextStatus of path) {
    if (nextStatus === "under_review") {
      await submitExecutionBriefForReview(brief, userId, note);
      continue;
    }

    if (nextStatus === "approved") {
      await approveExecutionBrief(brief, userId, note);
      continue;
    }

    if (nextStatus === "handed_off") {
      await handoffExecutionBrief(brief, userId, note);
      continue;
    }

    if (nextStatus === "in_progress") {
      await startExecutionBrief(brief, userId, note);
      continue;
    }

    if (nextStatus === "completed") {
      await completeExecutionBriefWorkflow(brief, userId, note);
      continue;
    }

    if (nextStatus === "cancelled") {
      await cancelExecutionBrief(brief, userId, reason, note);
    }
  }

  return brief;
};

const EXECUTION_LOCKED_STATUSES = new Set([
  "handed_off",
  "in_progress",
  "completed",
]);

export const assertExecutionBriefStructureEditable = (
  brief: ExecutionBrief,
  audit?: {
    userId: number | null;
    area?: string;
  },
) => {
  if (
    EXECUTION_LOCKED_STATUSES.has(normalizeExecutionBriefStatus(brief.status))
  ) {
    if (audit) {
      recordWorkflowBlock({
        entityName: "execution_brief",
        entityId: brief.id,
        actionName: "execution_brief.update_structure",
        currentStatus: normalizeExecutionBriefStatus(brief.status),
        attemptedBy: audit.userId,
        message: "Cannot structurally modify handed-off execution brief",
        sourceRefs: {
          eventId: brief.eventId,
          quotationId: brief.quotationId ?? null,
          contractId: brief.contractId ?? null,
          executionBriefId: brief.id,
        },
        metadata: {
          area: audit.area,
        },
      });
    }

    throw invalidStatusTransitionError(
      "Cannot structurally modify handed-off execution brief",
    );
  }
};

export const assertExecutionBriefHeaderEditable = (
  brief: ExecutionBrief,
  payload: Partial<{
    quotationId: number | null;
    contractId: number | null;
    generalNotes: string | null;
    clientNotes: string | null;
    designerNotes: string | null;
  }>,
  audit?: {
    userId: number | null;
    attemptedFields?: string[];
  },
) => {
  if (
    !EXECUTION_LOCKED_STATUSES.has(normalizeExecutionBriefStatus(brief.status))
  ) {
    return;
  }

  const hasProtectedChange =
    typeof payload.quotationId !== "undefined" ||
    typeof payload.contractId !== "undefined" ||
    typeof payload.generalNotes !== "undefined" ||
    typeof payload.clientNotes !== "undefined" ||
    typeof payload.designerNotes !== "undefined";

  if (hasProtectedChange) {
    if (audit) {
      recordWorkflowBlock({
        entityName: "execution_brief",
        entityId: brief.id,
        actionName: "execution_brief.update_header",
        currentStatus: normalizeExecutionBriefStatus(brief.status),
        attemptedBy: audit.userId,
        message: "Cannot structurally modify handed-off execution brief",
        sourceRefs: {
          eventId: brief.eventId,
          quotationId: brief.quotationId ?? null,
          contractId: brief.contractId ?? null,
          executionBriefId: brief.id,
        },
        metadata: {
          attemptedFields: audit.attemptedFields,
        },
      });
    }

    throw invalidStatusTransitionError(
      "Cannot structurally modify handed-off execution brief",
    );
  }
};
