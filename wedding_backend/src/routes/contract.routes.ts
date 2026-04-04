import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { requirePermissions } from "../middleware/rbac.middleware";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../middleware/validation.middleware";
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
import { idParamSchema } from "../validation/common.schemas";
import {
  contractListQuerySchema,
  createContractFromQuotationSchema,
  createContractSchema,
  createPaymentScheduleSchema,
  updateContractItemSchema,
  updateContractSchema,
  updatePaymentScheduleSchema,
} from "../validation/contract.schemas";

const router = Router();

router.get(
  "/",
  authMiddleware,
  requirePermissions("contracts.read"),
  validateQuery(contractListQuerySchema),
  getContracts,
);
router.get(
  "/:id",
  authMiddleware,
  requirePermissions("contracts.read"),
  validateParams(idParamSchema),
  getContractById,
);
router.get(
  "/:id/pdf",
  authMiddleware,
  requirePermissions("contracts.read"),
  validateParams(idParamSchema),
  downloadContractPdf,
);

router.post(
  "/",
  authMiddleware,
  requirePermissions("contracts.create"),
  validateBody(createContractSchema),
  createContract,
);

router.post(
  "/create-from-quotation",
  authMiddleware,
  requirePermissions("contracts.create"),
  validateBody(createContractFromQuotationSchema),
  createContractFromQuotation,
);

router.put(
  "/:id",
  authMiddleware,
  requirePermissions("contracts.update"),
  validateParams(idParamSchema),
  validateBody(updateContractSchema),
  updateContract,
);
router.delete(
  "/:id",
  authMiddleware,
  requirePermissions("contracts.delete"),
  validateParams(idParamSchema),
  deleteContract,
);

router.put(
  "/items/:id",
  authMiddleware,
  requirePermissions("contracts.update"),
  validateParams(idParamSchema),
  validateBody(updateContractItemSchema),
  updateContractItem,
);

router.post(
  "/payment-schedules",
  authMiddleware,
  requirePermissions("contracts.update"),
  validateBody(createPaymentScheduleSchema),
  createPaymentSchedule,
);

router.put(
  "/payment-schedules/:id",
  authMiddleware,
  requirePermissions("contracts.update"),
  validateParams(idParamSchema),
  validateBody(updatePaymentScheduleSchema),
  updatePaymentSchedule,
);

router.delete(
  "/payment-schedules/:id",
  authMiddleware,
  requirePermissions("contracts.update"),
  validateParams(idParamSchema),
  deletePaymentSchedule,
);

export default router;
