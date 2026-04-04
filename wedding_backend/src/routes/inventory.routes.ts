import { Router } from "express";

import { authMiddleware } from "../middleware/auth.middleware";
import { requirePermissions } from "../middleware/rbac.middleware";
import { uploadInventoryImage } from "../middleware/uploadInventoryImage";
import {
  createInventoryItem,
  deleteInventoryItem,
  getInventoryItemById,
  getInventoryItems,
  updateInventoryItem,
} from "../controllers/inventory.controller";

const router = Router();

router.get(
  "/",
  authMiddleware,
  requirePermissions("inventory.read"),
  getInventoryItems,
);

router.get(
  "/:id",
  authMiddleware,
  requirePermissions("inventory.read"),
  getInventoryItemById,
);

router.post(
  "/",
  authMiddleware,
  requirePermissions("inventory.create"),
  uploadInventoryImage.single("image"),
  createInventoryItem,
);

router.put(
  "/:id",
  authMiddleware,
  requirePermissions("inventory.update"),
  uploadInventoryImage.single("image"),
  updateInventoryItem,
);

router.delete(
  "/:id",
  authMiddleware,
  requirePermissions("inventory.delete"),
  deleteInventoryItem,
);

export default router;
