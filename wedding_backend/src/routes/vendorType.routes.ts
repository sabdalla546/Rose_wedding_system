import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { requirePermissions } from "../middleware/rbac.middleware";
import {
  createVendorType,
  deleteVendorType,
  getVendorTypeById,
  getVendorTypes,
  updateVendorType,
} from "../controllers/vendorType.controller";

const router = Router();

router.get(
  "/",
  authMiddleware,
  requirePermissions("vendors.read"),
  getVendorTypes,
);
router.get(
  "/:id",
  authMiddleware,
  requirePermissions("vendors.read"),
  getVendorTypeById,
);
router.post(
  "/",
  authMiddleware,
  requirePermissions("vendors.create"),
  createVendorType,
);
router.put(
  "/:id",
  authMiddleware,
  requirePermissions("vendors.update"),
  updateVendorType,
);
router.delete(
  "/:id",
  authMiddleware,
  requirePermissions("vendors.delete"),
  deleteVendorType,
);

export default router;
