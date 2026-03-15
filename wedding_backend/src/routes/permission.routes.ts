import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { requirePermissions } from "../middleware/rbac.middleware";
import {
  createPermission,
  getPermissions,
  getPermissionById,
  updatePermission,
  deletePermission,
} from "../controllers/permission.controller";

const router = Router();

router.get(
  "/",
  authMiddleware,
  requirePermissions("permissions.read"),
  getPermissions
);

router.get(
  "/:id",
  authMiddleware,
  requirePermissions("permissions.read"),
  getPermissionById
);

router.post(
  "/",
  authMiddleware,
  requirePermissions("permissions.create"),
  createPermission
);

router.put(
  "/:id",
  authMiddleware,
  requirePermissions("permissions.update"),
  updatePermission
);

router.delete(
  "/:id",
  authMiddleware,
  requirePermissions("permissions.delete"),
  deletePermission
);

export default router;
