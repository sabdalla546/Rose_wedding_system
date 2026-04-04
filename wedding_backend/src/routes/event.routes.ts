import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { requirePermissions } from "../middleware/rbac.middleware";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../middleware/validation.middleware";
import {
  createEvent,
  createEventFromSource,
  getEvents,
  getEventsCalendar,
  getEventById,
  updateEvent,
  deleteEvent,
  exportEventsPdf,
} from "../controllers/event.controller";
import { idParamSchema } from "../validation/common.schemas";
import {
  createEventFromSourceSchema,
  createEventSchema,
  eventListQuerySchema,
  updateEventSchema,
} from "../validation/event.schemas";
import { eventCalendarQuerySchema } from "../validation/calendar.schemas";

const router = Router();

router.get(
  "/",
  authMiddleware,
  requirePermissions("events.read"),
  validateQuery(eventListQuerySchema),
  getEvents,
);
router.get(
  "/calendar",
  authMiddleware,
  requirePermissions("events.read"),
  validateQuery(eventCalendarQuerySchema),
  getEventsCalendar,
);
router.get(
  "/export/pdf",
  authMiddleware,
  requirePermissions("events.read"),
  validateQuery(eventListQuerySchema),
  exportEventsPdf,
);
router.get(
  "/:id",
  authMiddleware,
  requirePermissions("events.read"),
  validateParams(idParamSchema),
  getEventById,
);

router.post(
  "/",
  authMiddleware,
  requirePermissions("events.create"),
  validateBody(createEventSchema),
  createEvent,
);

router.post(
  "/create-from-source",
  authMiddleware,
  requirePermissions("events.create"),
  validateBody(createEventFromSourceSchema),
  createEventFromSource,
);

router.put(
  "/:id",
  authMiddleware,
  requirePermissions("events.update"),
  validateParams(idParamSchema),
  validateBody(updateEventSchema),
  updateEvent,
);
router.delete(
  "/:id",
  authMiddleware,
  requirePermissions("events.delete"),
  validateParams(idParamSchema),
  deleteEvent,
);

export default router;
