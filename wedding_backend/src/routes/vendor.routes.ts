import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { requirePermissions } from "../middleware/rbac.middleware";
import {
  createVendor,
  getVendors,
  getVendorById,
  updateVendor,
  deleteVendor,
  createVendorSubService,
  listVendorSubServices,
  getVendorSubServiceById,
  updateVendorSubService,
  createVendorPricingPlan,
  listVendorPricingPlans,
  getVendorPricingPlanById,
  updateVendorPricingPlan,
  createEventVendor,
  getEventVendors,
  getEventVendorById,
  updateEventVendor,
  deleteEventVendor,
} from "../controllers/vendor.controller";

const router = Router();

router.get("/", authMiddleware, requirePermissions("vendors.read"), getVendors);
router.get(
  "/sub-services",
  authMiddleware,
  requirePermissions("vendors.read"),
  listVendorSubServices,
);
router.get(
  "/sub-services/:id",
  authMiddleware,
  requirePermissions("vendors.read"),
  getVendorSubServiceById,
);
router.post(
  "/sub-services",
  authMiddleware,
  requirePermissions("vendors.create"),
  createVendorSubService,
);
router.put(
  "/sub-services/:id",
  authMiddleware,
  requirePermissions("vendors.update"),
  updateVendorSubService,
);
router.get(
  "/pricing-plans",
  authMiddleware,
  requirePermissions("vendors.read"),
  listVendorPricingPlans,
);
router.get(
  "/pricing-plans/:id",
  authMiddleware,
  requirePermissions("vendors.read"),
  getVendorPricingPlanById,
);
router.post(
  "/pricing-plans",
  authMiddleware,
  requirePermissions("vendors.create"),
  createVendorPricingPlan,
);
router.put(
  "/pricing-plans/:id",
  authMiddleware,
  requirePermissions("vendors.update"),
  updateVendorPricingPlan,
);
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
