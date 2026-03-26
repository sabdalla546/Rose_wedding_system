import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { requirePermissions } from "../middleware/rbac.middleware";
import {
  createContract,
  createContractFromQuotation,
  getContracts,
  getContractById,
  downloadContractPdf,
  updateContract,
  deleteContract,
  updateContractItem,
  createPaymentSchedule,
  updatePaymentSchedule,
  deletePaymentSchedule,
} from "../controllers/contract.controller";

const router = Router();

router.get(
  "/",
  authMiddleware,
  requirePermissions("contracts.read"),
  getContracts,
);
router.get(
  "/:id",
  authMiddleware,
  requirePermissions("contracts.read"),
  getContractById,
);
router.get(
  "/:id/pdf",
  authMiddleware,
  requirePermissions("contracts.read"),
  downloadContractPdf,
);

router.post(
  "/",
  authMiddleware,
  requirePermissions("contracts.create"),
  createContract,
);

router.post(
  "/create-from-quotation",
  authMiddleware,
  requirePermissions("contracts.create"),
  createContractFromQuotation,
);

router.put(
  "/:id",
  authMiddleware,
  requirePermissions("contracts.update"),
  updateContract,
);
router.delete(
  "/:id",
  authMiddleware,
  requirePermissions("contracts.delete"),
  deleteContract,
);

router.put(
  "/items/:id",
  authMiddleware,
  requirePermissions("contracts.update"),
  updateContractItem,
);

router.post(
  "/payment-schedules",
  authMiddleware,
  requirePermissions("contracts.update"),
  createPaymentSchedule,
);

router.put(
  "/payment-schedules/:id",
  authMiddleware,
  requirePermissions("contracts.update"),
  updatePaymentSchedule,
);

router.delete(
  "/payment-schedules/:id",
  authMiddleware,
  requirePermissions("contracts.update"),
  deletePaymentSchedule,
);

export default router;
