import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { requirePermissions } from "../middleware/rbac.middleware";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../middleware/validation.middleware";
import {
  createVenue,
  getVenues,
  getVenueById,
  updateVenue,
  deleteVenue,
} from "../controllers/venue.controller";
import { idParamSchema } from "../validation/common.schemas";
import {
  createVenueSchema,
  updateVenueSchema,
  venueListQuerySchema,
} from "../validation/venue.schemas";

const router = Router();

router.get(
  "/",
  authMiddleware,
  requirePermissions("venues.read"),
  validateQuery(venueListQuerySchema),
  getVenues,
);

router.get(
  "/:id",
  authMiddleware,
  requirePermissions("venues.read"),
  validateParams(idParamSchema),
  getVenueById,
);

router.post(
  "/",
  authMiddleware,
  requirePermissions("venues.create"),
  validateBody(createVenueSchema),
  createVenue,
);

router.put(
  "/:id",
  authMiddleware,
  requirePermissions("venues.update"),
  validateParams(idParamSchema),
  validateBody(updateVenueSchema),
  updateVenue,
);

router.delete(
  "/:id",
  authMiddleware,
  requirePermissions("venues.delete"),
  validateParams(idParamSchema),
  deleteVenue,
);

export default router;
