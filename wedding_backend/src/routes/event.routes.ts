import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { requirePermissions } from "../middleware/rbac.middleware";
import {
  createEvent,
  createEventFromSource,
  getEvents,
  getEventsCalendar,
  getEventById,
  updateEvent,
  deleteEvent,
} from "../controllers/event.controller";

const router = Router();

router.get("/", authMiddleware, requirePermissions("events.read"), getEvents);
router.get(
  "/calendar",
  authMiddleware,
  requirePermissions("events.read"),
  getEventsCalendar,
);
router.get(
  "/:id",
  authMiddleware,
  requirePermissions("events.read"),
  getEventById,
);

router.post(
  "/",
  authMiddleware,
  requirePermissions("events.create"),
  createEvent,
);

router.post(
  "/create-from-source",
  authMiddleware,
  requirePermissions("events.create"),
  createEventFromSource,
);

router.put(
  "/:id",
  authMiddleware,
  requirePermissions("events.update"),
  updateEvent,
);
router.delete(
  "/:id",
  authMiddleware,
  requirePermissions("events.delete"),
  deleteEvent,
);

export default router;
