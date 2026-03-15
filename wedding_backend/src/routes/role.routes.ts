import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { requirePermissions } from "../middleware/rbac.middleware";
import {
  createRole,
  getRoles,
  getRoleById,
  updateRole,
  deleteRole,
} from "../controllers/role.controller";

const router = Router();

router.get("/", authMiddleware, requirePermissions("roles.read"), getRoles);

router.get(
  "/:id",
  authMiddleware,
  requirePermissions("roles.read"),
  getRoleById
);

router.post(
  "/",
  authMiddleware,
  requirePermissions("roles.create"),
  createRole
);

router.put(
  "/:id",
  authMiddleware,
  requirePermissions("roles.update"),
  updateRole
);

router.delete(
  "/:id",
  authMiddleware,
  requirePermissions("roles.delete"),
  deleteRole
);

export default router;
