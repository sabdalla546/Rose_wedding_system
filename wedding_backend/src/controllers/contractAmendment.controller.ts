import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import {
  applyContractAmendmentSchema,
  approveContractAmendmentSchema,
  contractAmendmentIdParamSchema,
  contractAmendmentItemIdParamSchema,
  contractAmendmentListQuerySchema,
  createContractAmendmentItemSchema,
  createContractAmendmentSchema,
  deleteContractAmendmentItemParamSchema,
  rejectContractAmendmentSchema,
  updateContractAmendmentItemSchema,
} from "../validation/contractAmendment.validation";
import {
  approveContractAmendment,
  addContractAmendmentItem,
  createContractAmendment,
  deleteContractAmendmentItem,
  getContractAmendmentById,
  listContractAmendments,
  rejectContractAmendment,
  updateContractAmendmentItem,
} from "../services/contracts/contractAmendment.service";
import { applyContractAmendment } from "../services/contracts/contractAmendmentApply.service";
import { WorkflowDomainError } from "../services/workflow/workflow.errors";

const getUserId = (req: Request) => {
  const maybeUser = (req as AuthRequest).user;
  return typeof maybeUser?.id === "number" ? maybeUser.id : null;
};

const handleError = (res: Response, error: unknown) => {
  if (error instanceof WorkflowDomainError) {
    return res.status(error.statusCode).json({
      message: error.message,
    });
  }

  console.error(error);

  return res.status(500).json({
    message: "Unexpected error",
  });
};

export const createContractAmendmentHandler = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const parsed = createContractAmendmentSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid contract amendment payload",
        errors: parsed.error.flatten(),
      });
    }

    const amendment = await createContractAmendment({
      contractId: parsed.data.contractId,
      reason: parsed.data.reason ?? null,
      notes: parsed.data.notes ?? null,
      userId: getUserId(req),
    });

    return res.status(201).json({
      message: "Contract amendment created successfully",
      data: amendment,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

export const listContractAmendmentsHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const parsed = contractAmendmentListQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid contract amendment list query",
        errors: parsed.error.flatten(),
      });
    }

    const result = await listContractAmendments({
      contractId: parsed.data.contractId,
      eventId: parsed.data.eventId,
      status: parsed.data.status,
      search: parsed.data.search,
      page: parsed.data.page ?? 1,
      limit: parsed.data.limit ?? 20,
    });

    return res.json({
      message: "Contract amendments fetched successfully",
      data: result.rows,
      meta: {
        total: result.count,
        page: result.page,
        limit: result.limit,
        pages: result.pages,
      },
    });
  } catch (error) {
    return handleError(res, error);
  }
};

export const getContractAmendmentByIdHandler = async (
  req: Request,
  res: Response,
) => {
  try {
    const parsed = contractAmendmentIdParamSchema.safeParse(req.params);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid contract amendment id",
        errors: parsed.error.flatten(),
      });
    }

    const amendment = await getContractAmendmentById(parsed.data.id);

    return res.json({
      message: "Contract amendment fetched successfully",
      data: amendment,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

export const addContractAmendmentItemHandler = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const paramsParsed = contractAmendmentIdParamSchema.safeParse(req.params);

    if (!paramsParsed.success) {
      return res.status(400).json({
        message: "Invalid contract amendment id",
        errors: paramsParsed.error.flatten(),
      });
    }

    const bodyParsed = createContractAmendmentItemSchema.safeParse(req.body);

    if (!bodyParsed.success) {
      return res.status(400).json({
        message: "Invalid contract amendment item payload",
        errors: bodyParsed.error.flatten(),
      });
    }

    const item = await addContractAmendmentItem({
      amendmentId: paramsParsed.data.id,
      payload: bodyParsed.data,
      userId: getUserId(req),
    });

    return res.status(201).json({
      message: "Contract amendment item created successfully",
      data: item,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

export const updateContractAmendmentItemHandler = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const paramsParsed = contractAmendmentItemIdParamSchema.safeParse(
      req.params,
    );

    if (!paramsParsed.success) {
      return res.status(400).json({
        message: "Invalid contract amendment item identifiers",
        errors: paramsParsed.error.flatten(),
      });
    }

    const bodyParsed = updateContractAmendmentItemSchema.safeParse(req.body);

    if (!bodyParsed.success) {
      return res.status(400).json({
        message: "Invalid contract amendment item payload",
        errors: bodyParsed.error.flatten(),
      });
    }

    const item = await updateContractAmendmentItem({
      amendmentId: paramsParsed.data.id,
      itemId: paramsParsed.data.itemId,
      payload: bodyParsed.data,
      userId: getUserId(req),
    });

    return res.json({
      message: "Contract amendment item updated successfully",
      data: item,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

export const deleteContractAmendmentItemHandler = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const parsed = deleteContractAmendmentItemParamSchema.safeParse(req.params);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid contract amendment item id",
        errors: parsed.error.flatten(),
      });
    }

    await deleteContractAmendmentItem({
      itemId: parsed.data.itemId,
      userId: getUserId(req),
    });

    return res.json({
      message: "Contract amendment item deleted successfully",
    });
  } catch (error) {
    return handleError(res, error);
  }
};

export const approveContractAmendmentHandler = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const paramsParsed = contractAmendmentIdParamSchema.safeParse(req.params);

    if (!paramsParsed.success) {
      return res.status(400).json({
        message: "Invalid contract amendment id",
        errors: paramsParsed.error.flatten(),
      });
    }

    const bodyParsed = approveContractAmendmentSchema.safeParse(req.body);

    if (!bodyParsed.success) {
      return res.status(400).json({
        message: "Invalid approve payload",
        errors: bodyParsed.error.flatten(),
      });
    }

    const amendment = await approveContractAmendment({
      amendmentId: paramsParsed.data.id,
      notes: bodyParsed.data.notes ?? null,
      userId: getUserId(req),
    });

    return res.json({
      message: "Contract amendment approved successfully",
      data: amendment,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

export const rejectContractAmendmentHandler = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const paramsParsed = contractAmendmentIdParamSchema.safeParse(req.params);

    if (!paramsParsed.success) {
      return res.status(400).json({
        message: "Invalid contract amendment id",
        errors: paramsParsed.error.flatten(),
      });
    }

    const bodyParsed = rejectContractAmendmentSchema.safeParse(req.body);

    if (!bodyParsed.success) {
      return res.status(400).json({
        message: "Invalid reject payload",
        errors: bodyParsed.error.flatten(),
      });
    }

    const amendment = await rejectContractAmendment({
      amendmentId: paramsParsed.data.id,
      reason: bodyParsed.data.reason,
      notes: bodyParsed.data.notes ?? null,
      userId: getUserId(req),
    });

    return res.json({
      message: "Contract amendment rejected successfully",
      data: amendment,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

export const applyContractAmendmentHandler = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const paramsParsed = contractAmendmentIdParamSchema.safeParse(req.params);

    if (!paramsParsed.success) {
      return res.status(400).json({
        message: "Invalid contract amendment id",
        errors: paramsParsed.error.flatten(),
      });
    }

    const bodyParsed = applyContractAmendmentSchema.safeParse(req.body);

    if (!bodyParsed.success) {
      return res.status(400).json({
        message: "Invalid apply payload",
        errors: bodyParsed.error.flatten(),
      });
    }

    const amendment = await applyContractAmendment({
      amendmentId: paramsParsed.data.id,
      userId: getUserId(req),
    });

    return res.json({
      message: "Contract amendment applied successfully",
      data: amendment,
    });
  } catch (error) {
    return handleError(res, error);
  }
};
