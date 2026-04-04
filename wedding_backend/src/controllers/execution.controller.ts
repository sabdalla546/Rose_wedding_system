import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { ExecutionBrief } from "../models/executionBrief.model";
import { ExecutionServiceDetail } from "../models/executionServiceDetail.model";
import { ExecutionAttachment } from "../models/executionAttachment.model";
import { Service } from "../models/service.model";
import {
  updateExecutionServiceDetailSchema,
  executionServiceDetailIdParamSchema,
  createExecutionAttachmentForBriefSchema,
  createExecutionAttachmentForServiceDetailSchema,
  executionAttachmentIdParamSchema,
  createExecutionBriefSchema,
  executionBriefIdParamSchema,
  updateExecutionBriefSchema,
  executionBriefByEventParamSchema,
} from "../validation/execution.validation";
import {
  assertExecutionBriefReferences,
  buildExecutionBriefInclude,
  createExecutionBriefWorkflow,
} from "../services/execution/execution.service";
import { isWorkflowDomainError } from "../services/workflow/workflow.errors";

const getUserIdFromRequest = (req: Request): number | null => {
  const maybeUser = (req as Request & { user?: { id?: number } }).user;
  return typeof maybeUser?.id === "number" ? maybeUser.id : null;
};

export const createExecutionBrief = async (req: Request, res: Response) => {
  const parsed = createExecutionBriefSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid execution brief payload",
      errors: parsed.error.flatten(),
    });
  }

  const {
    eventId,
    quotationId = null,
    contractId = null,
    status = "draft",
    generalNotes = null,
    clientNotes = null,
    designerNotes = null,
    initializeFromEventServices = true,
  } = parsed.data;

  try {
    const brief = await createExecutionBriefWorkflow({
      eventId,
      quotationId,
      contractId,
      status,
      generalNotes,
      clientNotes,
      designerNotes,
      initializeFromEventServices,
      userId: getUserIdFromRequest(req),
    });

    return res.status(201).json({
      message: "Execution brief created successfully",
      data: brief,
    });
  } catch (error) {
    if (isWorkflowDomainError(error)) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    return res.status(500).json({ message: "Unexpected error" });
  }
};

export const getExecutionBriefById = async (req: Request, res: Response) => {
  const parsed = executionBriefIdParamSchema.safeParse(req.params);

  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid brief id",
      errors: parsed.error.flatten(),
    });
  }

  const brief = await ExecutionBrief.findByPk(parsed.data.id, {
    include: buildExecutionBriefInclude(),
  });

  if (!brief) {
    return res.status(404).json({ message: "Execution brief not found" });
  }

  return res.json({
    message: "Execution brief fetched successfully",
    data: brief,
  });
};

export const getExecutionBriefByEventId = async (
  req: Request,
  res: Response,
) => {
  const parsed = executionBriefByEventParamSchema.safeParse(req.params);

  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid event id",
      errors: parsed.error.flatten(),
    });
  }

  const brief = await ExecutionBrief.findOne({
    where: { eventId: parsed.data.eventId },
    include: buildExecutionBriefInclude(),
  });

  if (!brief) {
    return res
      .status(404)
      .json({ message: "Execution brief not found for this event" });
  }

  return res.json({
    message: "Execution brief fetched successfully",
    data: brief,
  });
};

export const updateExecutionBrief = async (req: Request, res: Response) => {
  const paramsParsed = executionBriefIdParamSchema.safeParse(req.params);
  if (!paramsParsed.success) {
    return res.status(400).json({
      message: "Invalid brief id",
      errors: paramsParsed.error.flatten(),
    });
  }

  const bodyParsed = updateExecutionBriefSchema.safeParse(req.body);
  if (!bodyParsed.success) {
    return res.status(400).json({
      message: "Invalid execution brief payload",
      errors: bodyParsed.error.flatten(),
    });
  }

  const brief = await ExecutionBrief.findByPk(paramsParsed.data.id);
  if (!brief) {
    return res.status(404).json({ message: "Execution brief not found" });
  }

  try {
    await assertExecutionBriefReferences({
      eventId: brief.eventId,
      quotationId:
        bodyParsed.data.quotationId === undefined
          ? brief.quotationId
          : bodyParsed.data.quotationId,
      contractId:
        bodyParsed.data.contractId === undefined
          ? brief.contractId
          : bodyParsed.data.contractId,
    });
  } catch (error) {
    if (isWorkflowDomainError(error)) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    return res.status(500).json({ message: "Unexpected error" });
  }

  const userId = getUserIdFromRequest(req);

  const approvedByClientAt: Date | null | undefined =
    bodyParsed.data.approvedByClientAt === undefined
      ? undefined
      : bodyParsed.data.approvedByClientAt === null
        ? null
        : new Date(bodyParsed.data.approvedByClientAt);

  const handedToExecutorAt: Date | null | undefined =
    bodyParsed.data.handedToExecutorAt === undefined
      ? undefined
      : bodyParsed.data.handedToExecutorAt === null
        ? null
        : new Date(bodyParsed.data.handedToExecutorAt);

  await brief.update({
    quotationId: bodyParsed.data.quotationId,
    contractId: bodyParsed.data.contractId,
    status: bodyParsed.data.status,
    generalNotes: bodyParsed.data.generalNotes,
    clientNotes: bodyParsed.data.clientNotes,
    designerNotes: bodyParsed.data.designerNotes,
    approvedByClientAt,
    handedToExecutorAt,
    updatedBy: userId,
  });

  const hydrated = await ExecutionBrief.findByPk(brief.id, {
    include: buildExecutionBriefInclude(),
  });

  return res.json({
    message: "Execution brief updated successfully",
    data: hydrated,
  });
};

export const getExecutionBriefs = async (req: Request, res: Response) => {
  const eventId =
    typeof req.query.eventId === "string" && req.query.eventId.trim() !== ""
      ? Number(req.query.eventId)
      : undefined;

  const status =
    typeof req.query.status === "string" && req.query.status.trim() !== ""
      ? req.query.status.trim()
      : undefined;

  const search =
    typeof req.query.search === "string" && req.query.search.trim() !== ""
      ? req.query.search.trim()
      : undefined;

  const where: Record<string, unknown> = {};

  if (typeof eventId === "number" && Number.isFinite(eventId)) {
    where.eventId = eventId;
  }

  if (status) {
    where.status = status;
  }

  const briefs = await ExecutionBrief.findAll({
    where,
    include: buildExecutionBriefInclude(search),
    order: [["id", "DESC"]],
  });

  return res.json({
    message: "Execution briefs fetched successfully",
    data: briefs,
  });
};

const getPublicFileUrl = (req: Request, filePath: string) => {
  const normalized = filePath.replace(/\\/g, "/");
  const uploadsIndex = normalized.lastIndexOf("/uploads/");

  if (uploadsIndex >= 0) {
    const publicPart = normalized.substring(uploadsIndex + "/uploads".length);
    return `${req.protocol}://${req.get("host")}/uploads${publicPart}`;
  }

  const fileName = path.basename(filePath);
  return `${req.protocol}://${req.get("host")}/uploads/execution-details/${fileName}`;
};

export const updateExecutionServiceDetail = async (
  req: Request,
  res: Response,
) => {
  const paramsParsed = executionServiceDetailIdParamSchema.safeParse(
    req.params,
  );
  if (!paramsParsed.success) {
    return res.status(400).json({
      message: "Invalid service detail id",
      errors: paramsParsed.error.flatten(),
    });
  }

  const bodyParsed = updateExecutionServiceDetailSchema.safeParse(req.body);
  if (!bodyParsed.success) {
    return res.status(400).json({
      message: "Invalid execution service detail payload",
      errors: bodyParsed.error.flatten(),
    });
  }

  const serviceDetail = await ExecutionServiceDetail.findByPk(
    paramsParsed.data.id,
    {
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
  );

  if (!serviceDetail) {
    return res
      .status(404)
      .json({ message: "Execution service detail not found" });
  }

  await serviceDetail.update({
    templateKey: bodyParsed.data.templateKey ?? serviceDetail.templateKey,
    sortOrder: bodyParsed.data.sortOrder ?? serviceDetail.sortOrder,
    detailsJson:
      bodyParsed.data.detailsJson !== undefined
        ? bodyParsed.data.detailsJson
        : serviceDetail.detailsJson,
    notes:
      bodyParsed.data.notes !== undefined
        ? bodyParsed.data.notes
        : serviceDetail.notes,
    executorNotes:
      bodyParsed.data.executorNotes !== undefined
        ? bodyParsed.data.executorNotes
        : serviceDetail.executorNotes,
    status: bodyParsed.data.status ?? serviceDetail.status,
  });

  const hydrated = await ExecutionServiceDetail.findByPk(serviceDetail.id, {
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
  });

  return res.json({
    message: "Execution service detail updated successfully",
    data: hydrated,
  });
};

export const uploadExecutionBriefAttachment = async (
  req: Request,
  res: Response,
) => {
  const paramsParsed = executionBriefIdParamSchema.safeParse(req.params);
  if (!paramsParsed.success) {
    return res.status(400).json({
      message: "Invalid brief id",
      errors: paramsParsed.error.flatten(),
    });
  }

  const bodyParsed = createExecutionAttachmentForBriefSchema.safeParse(
    req.body,
  );
  if (!bodyParsed.success) {
    return res.status(400).json({
      message: "Invalid attachment payload",
      errors: bodyParsed.error.flatten(),
    });
  }

  const brief = await ExecutionBrief.findByPk(paramsParsed.data.id);
  if (!brief) {
    return res.status(404).json({ message: "Execution brief not found" });
  }

  const file = req.file;
  if (!file) {
    return res.status(400).json({ message: "Attachment file is required" });
  }

  const userId = getUserIdFromRequest(req);

  const attachment = await ExecutionAttachment.create({
    briefId: brief.id,
    serviceDetailId: null,
    fileName: file.filename,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    filePath: file.path,
    fileUrl: getPublicFileUrl(req, file.path),
    label: bodyParsed.data.label ?? null,
    sortOrder: bodyParsed.data.sortOrder ?? 0,
    uploadedBy: userId,
  });

  return res.status(201).json({
    message: "Execution brief attachment uploaded successfully",
    data: attachment,
  });
};

export const uploadExecutionServiceDetailAttachment = async (
  req: Request,
  res: Response,
) => {
  const paramsParsed = executionServiceDetailIdParamSchema.safeParse(
    req.params,
  );
  if (!paramsParsed.success) {
    return res.status(400).json({
      message: "Invalid service detail id",
      errors: paramsParsed.error.flatten(),
    });
  }

  const bodyParsed = createExecutionAttachmentForServiceDetailSchema.safeParse(
    req.body,
  );
  if (!bodyParsed.success) {
    return res.status(400).json({
      message: "Invalid attachment payload",
      errors: bodyParsed.error.flatten(),
    });
  }

  const serviceDetail = await ExecutionServiceDetail.findByPk(
    paramsParsed.data.id,
  );
  if (!serviceDetail) {
    return res
      .status(404)
      .json({ message: "Execution service detail not found" });
  }

  const file = req.file;
  if (!file) {
    return res.status(400).json({ message: "Attachment file is required" });
  }

  const userId = getUserIdFromRequest(req);

  const attachment = await ExecutionAttachment.create({
    briefId: serviceDetail.briefId,
    serviceDetailId: serviceDetail.id,
    fileName: file.filename,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    filePath: file.path,
    fileUrl: getPublicFileUrl(req, file.path),
    label: bodyParsed.data.label ?? null,
    sortOrder: bodyParsed.data.sortOrder ?? 0,
    uploadedBy: userId,
  });

  return res.status(201).json({
    message: "Execution service detail attachment uploaded successfully",
    data: attachment,
  });
};

export const deleteExecutionAttachment = async (
  req: Request,
  res: Response,
) => {
  const paramsParsed = executionAttachmentIdParamSchema.safeParse(req.params);
  if (!paramsParsed.success) {
    return res.status(400).json({
      message: "Invalid attachment id",
      errors: paramsParsed.error.flatten(),
    });
  }

  const attachment = await ExecutionAttachment.findByPk(paramsParsed.data.id);

  if (!attachment) {
    return res.status(404).json({ message: "Execution attachment not found" });
  }

  if (attachment.filePath && fs.existsSync(attachment.filePath)) {
    try {
      fs.unlinkSync(attachment.filePath);
    } catch {
      // ignore file delete failure, still remove DB row
    }
  }

  await attachment.destroy();

  return res.json({
    message: "Execution attachment deleted successfully",
  });
};
