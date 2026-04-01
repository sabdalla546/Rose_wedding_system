import { Router } from "express";

import { authMiddleware } from "../middleware/auth.middleware";
import { requirePermissions } from "../middleware/rbac.middleware";
import { uploadExecutionImages } from "../middleware/uploadExecutionImages";

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

const router = Router();

router.get(
  "/",
  authMiddleware,
  requirePermissions("events.read"),
  getExecutionBriefs,
);

router.get(
  "/by-event/:eventId",
  authMiddleware,
  requirePermissions("events.read"),
  getExecutionBriefByEventId,
);

router.get(
  "/:id",
  authMiddleware,
  requirePermissions("events.read"),
  getExecutionBriefById,
);

router.post(
  "/",
  authMiddleware,
  requirePermissions("events.update"),
  createExecutionBrief,
);

router.patch(
  "/:id",
  authMiddleware,
  requirePermissions("events.update"),
  updateExecutionBrief,
);

router.patch(
  "/service-details/:id",
  authMiddleware,
  requirePermissions("events.update"),
  updateExecutionServiceDetail,
);

router.post(
  "/:id/attachments",
  authMiddleware,
  requirePermissions("events.update"),
  uploadExecutionImages.single("file"),
  uploadExecutionBriefAttachment,
);

router.post(
  "/service-details/:id/attachments",
  authMiddleware,
  requirePermissions("events.update"),
  uploadExecutionImages.single("file"),
  uploadExecutionServiceDetailAttachment,
);

router.delete(
  "/attachments/:id",
  authMiddleware,
  requirePermissions("events.update"),
  deleteExecutionAttachment,
);

export default router;
