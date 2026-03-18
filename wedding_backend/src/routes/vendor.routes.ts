import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { requirePermissions } from "../middleware/rbac.middleware";
import {
  createVendor,
  getVendors,
  getVendorById,
  updateVendor,
  deleteVendor,
  createEventVendor,
  getEventVendors,
  getEventVendorById,
  updateEventVendor,
  deleteEventVendor,
} from "../controllers/vendor.controller";

const router = Router();

router.get("/", authMiddleware, requirePermissions("vendors.read"), getVendors);
router.get(
  "/:id",
  authMiddleware,
  requirePermissions("vendors.read"),
  getVendorById,
);
router.post(
  "/",
  authMiddleware,
  requirePermissions("vendors.create"),
  createVendor,
);
router.put(
  "/:id",
  authMiddleware,
  requirePermissions("vendors.update"),
  updateVendor,
);
router.delete(
  "/:id",
  authMiddleware,
  requirePermissions("vendors.delete"),
  deleteVendor,
);

router.get(
  "/event-links/list",
  authMiddleware,
  requirePermissions("events.read"),
  getEventVendors,
);

router.get(
  "/event-links/:id",
  authMiddleware,
  requirePermissions("events.read"),
  getEventVendorById,
);

router.post(
  "/event-links",
  authMiddleware,
  requirePermissions("events.update"),
  createEventVendor,
);

router.put(
  "/event-links/:id",
  authMiddleware,
  requirePermissions("events.update"),
  updateEventVendor,
);

router.delete(
  "/event-links/:id",
  authMiddleware,
  requirePermissions("events.update"),
  deleteEventVendor,
);

export default router;
