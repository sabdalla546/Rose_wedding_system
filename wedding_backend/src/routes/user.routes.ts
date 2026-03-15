import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { requirePermissions } from "../middleware/rbac.middleware";
import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "../controllers/user.controller";

const router = Router();

// GET /api/users
router.get("/", authMiddleware, requirePermissions("users.read"), getUsers);

// GET /api/users/:id
router.get(
  "/:id",
  authMiddleware,
  requirePermissions("users.read"),
  getUserById
);

// POST /api/users
router.post(
  "/",
  authMiddleware,
  requirePermissions("users.create"),
  createUser
);

// PUT /api/users/:id
router.put(
  "/:id",
  authMiddleware,
  requirePermissions("users.update"),
  updateUser
);

// DELETE /api/users/:id
router.delete(
  "/:id",
  authMiddleware,
  requirePermissions("users.delete"),
  deleteUser
);

export default router;
