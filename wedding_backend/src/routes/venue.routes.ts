import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { requirePermissions } from "../middleware/rbac.middleware";
import {
  createVenue,
  getVenues,
  getVenueById,
  updateVenue,
  deleteVenue,
} from "../controllers/venue.controller";

const router = Router();

router.get("/", authMiddleware, requirePermissions("venues.read"), getVenues);
router.get(
  "/:id",
  authMiddleware,
  requirePermissions("venues.read"),
  getVenueById,
);
router.post(
  "/",
  authMiddleware,
  requirePermissions("venues.create"),
  createVenue,
);
router.put(
  "/:id",
  authMiddleware,
  requirePermissions("venues.update"),
  updateVenue,
);
router.delete(
  "/:id",
  authMiddleware,
  requirePermissions("venues.delete"),
  deleteVenue,
);

export default router;
