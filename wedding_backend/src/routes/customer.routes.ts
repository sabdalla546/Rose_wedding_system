import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { requirePermissions } from "../middleware/rbac.middleware";
import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customer.controller";

const router = Router();

router.get(
  "/",
  authMiddleware,
  requirePermissions("customers.read"),
  getCustomers,
);
router.get(
  "/:id",
  authMiddleware,
  requirePermissions("customers.read"),
  getCustomerById,
);
router.post(
  "/",
  authMiddleware,
  requirePermissions("customers.create"),
  createCustomer,
);
router.put(
  "/:id",
  authMiddleware,
  requirePermissions("customers.update"),
  updateCustomer,
);
router.delete(
  "/:id",
  authMiddleware,
  requirePermissions("customers.delete"),
  deleteCustomer,
);

export default router;
