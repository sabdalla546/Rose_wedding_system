import { Router } from "express";

import { authMiddleware } from "../middleware/auth.middleware";
import { requirePermissions } from "../middleware/rbac.middleware";
import { uploadExecutionImages } from "../middleware/uploadExecutionImages";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../middleware/validation.middleware";

import {
  createExecutionBrief,
  getExecutionBriefByEventId,
  getExecutionBriefById,
  getExecutionBriefs,
  updateExecutionBrief,
  updateExecutionServiceDetail,
  uploadExecutionBriefAttachment,
  uploadExecutionServiceDetailAttachment,
  deleteExecutionAttachment,
} from "../controllers/execution.controller";
import {
  createExecutionAttachmentForBriefSchema,
  createExecutionAttachmentForServiceDetailSchema,
  createExecutionBriefSchema,
  executionAttachmentIdParamSchema,
  executionBriefByEventParamSchema,
  executionBriefIdParamSchema,
  executionBriefListQuerySchema,
  executionServiceDetailIdParamSchema,
  updateExecutionBriefSchema,
  updateExecutionServiceDetailSchema,
} from "../validation/execution.validation";

const router = Router();

router.get(
  "/",
  authMiddleware,
  requirePermissions("events.read"),
  validateQuery(executionBriefListQuerySchema),
  getExecutionBriefs,
);

router.get(
  "/by-event/:eventId",
  authMiddleware,
  requirePermissions("events.read"),
  validateParams(executionBriefByEventParamSchema),
  getExecutionBriefByEventId,
);

router.get(
  "/:id",
  authMiddleware,
  requirePermissions("events.read"),
  validateParams(executionBriefIdParamSchema),
  getExecutionBriefById,
);

router.post(
  "/",
  authMiddleware,
  requirePermissions("events.update"),
  validateBody(createExecutionBriefSchema),
  createExecutionBrief,
);

router.patch(
  "/:id",
  authMiddleware,
  requirePermissions("events.update"),
  validateParams(executionBriefIdParamSchema),
  validateBody(updateExecutionBriefSchema),
  updateExecutionBrief,
);

router.patch(
  "/service-details/:id",
  authMiddleware,
  requirePermissions("events.update"),
  validateParams(executionServiceDetailIdParamSchema),
  validateBody(updateExecutionServiceDetailSchema),
  updateExecutionServiceDetail,
);

router.post(
  "/:id/attachments",
  authMiddleware,
  requirePermissions("events.update"),
  validateParams(executionBriefIdParamSchema),
  uploadExecutionImages.single("file"),
  validateBody(createExecutionAttachmentForBriefSchema),
  uploadExecutionBriefAttachment,
);

router.post(
  "/service-details/:id/attachments",
  authMiddleware,
  requirePermissions("events.update"),
  validateParams(executionServiceDetailIdParamSchema),
  uploadExecutionImages.single("file"),
  validateBody(createExecutionAttachmentForServiceDetailSchema),
  uploadExecutionServiceDetailAttachment,
);

router.delete(
  "/attachments/:id",
  authMiddleware,
  requirePermissions("events.update"),
  validateParams(executionAttachmentIdParamSchema),
  deleteExecutionAttachment,
);

export default router;
