import { Includeable, Op, Order } from "sequelize";
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
} from "../../models";
import {
  invalidStatusTransitionError,
  WorkflowDomainError,
} from "../workflow/workflow.errors";

const serviceDetailsOrder: Order = [
  ["sortOrder", "ASC"],
  ["id", "ASC"],
];

export const getTemplateKeyFromService = (service: {
  name?: string | null;
  category?: string | null;
}) => {
  const source = `${service.category ?? ""} ${service.name ?? ""}`.toLowerCase();

  if (source.includes("ÙƒÙˆØ´") || source.includes("kosha")) return "kosha_setup";
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
    throw new WorkflowDomainError(
      "Cannot create execution brief for cancelled event",
      400,
    );
  }

  if (refs.event.status !== "confirmed" && !contractId) {
    throw invalidStatusTransitionError();
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

  const brief = await ExecutionBrief.create({
    eventId,
    quotationId,
    contractId,
    status,
    generalNotes,
    clientNotes,
    designerNotes,
    createdBy: userId,
    updatedBy: userId,
  });

  if (initializeFromEventServices) {
    const eventServices = await EventService.findAll({
      where: { eventId },
      include: [
        {
          model: Service,
          as: "service",
          required: false,
        },
      ],
      order: [["id", "ASC"]],
    });

    const detailRows = eventServices
      .filter((item) => typeof item.serviceId === "number" && item.serviceId > 0)
      .map((item, index) => {
        const serviceRecord = (item as EventService & { service?: Service | null })
          .service;
        const serviceName = serviceRecord?.name ?? null;
        const serviceCategory = (
          serviceRecord as (Service & { category?: string | null }) | null
        )?.category ?? null;

        return {
          briefId: brief.id,
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
      });

    if (detailRows.length > 0) {
      await ExecutionServiceDetail.bulkCreate(detailRows, {
        ignoreDuplicates: true,
      });
    }
  }

  return ExecutionBrief.findByPk(brief.id, {
    include: buildExecutionBriefInclude(),
  });
}
