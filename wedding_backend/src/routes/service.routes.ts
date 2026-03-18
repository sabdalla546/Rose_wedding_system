import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { requirePermissions } from "../middleware/rbac.middleware";
import {
  createService,
  getServices,
  getServiceById,
  updateService,
  deleteService,
  createEventService,
  getEventServices,
  getEventServiceById,
  updateEventService,
  deleteEventService,
} from "../controllers/service.controller";

const router = Router();

router.get(
  "/",
  authMiddleware,
  requirePermissions("services.read"),
  getServices,
);
router.get(
  "/:id",
  authMiddleware,
  requirePermissions("services.read"),
  getServiceById,
);
router.post(
  "/",
  authMiddleware,
  requirePermissions("services.create"),
  createService,
);
router.put(
  "/:id",
  authMiddleware,
  requirePermissions("services.update"),
  updateService,
);
router.delete(
  "/:id",
  authMiddleware,
  requirePermissions("services.delete"),
  deleteService,
);

router.get(
  "/event-items/list",
  authMiddleware,
  requirePermissions("events.read"),
  getEventServices,
);

router.get(
  "/event-items/:id",
  authMiddleware,
  requirePermissions("events.read"),
  getEventServiceById,
);

router.post(
  "/event-items",
  authMiddleware,
  requirePermissions("events.update"),
  createEventService,
);

router.put(
  "/event-items/:id",
  authMiddleware,
  requirePermissions("events.update"),
  updateEventService,
);

router.delete(
  "/event-items/:id",
  authMiddleware,
  requirePermissions("events.update"),
  deleteEventService,
);

export default router;
