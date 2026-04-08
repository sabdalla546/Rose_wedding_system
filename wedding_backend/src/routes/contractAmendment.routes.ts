import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { requirePermissions } from "../middleware/rbac.middleware";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../middleware/validation.middleware";
import {
  addContractAmendmentItemHandler,
  applyContractAmendmentHandler,
  approveContractAmendmentHandler,
  createContractAmendmentHandler,
  deleteContractAmendmentItemHandler,
  getContractAmendmentByIdHandler,
  listContractAmendmentsHandler,
  rejectContractAmendmentHandler,
  updateContractAmendmentItemHandler,
} from "../controllers/contractAmendment.controller";
import {
  applyContractAmendmentSchema,
  approveContractAmendmentSchema,
  contractAmendmentIdParamSchema,
  contractAmendmentItemIdParamSchema,
  contractAmendmentListQuerySchema,
  createContractAmendmentItemSchema,
  createContractAmendmentSchema,
  deleteContractAmendmentItemParamSchema,
  rejectContractAmendmentSchema,
  updateContractAmendmentItemSchema,
} from "../validation/contractAmendment.validation";

const router = Router();

router.get(
  "/",
  authMiddleware,
  requirePermissions("contracts.read"),
  validateQuery(contractAmendmentListQuerySchema),
  listContractAmendmentsHandler,
);

router.get(
  "/:id",
  authMiddleware,
  requirePermissions("contracts.read"),
  validateParams(contractAmendmentIdParamSchema),
  getContractAmendmentByIdHandler,
);

router.post(
  "/",
  authMiddleware,
  requirePermissions("contracts.update"),
  validateBody(createContractAmendmentSchema),
  createContractAmendmentHandler,
);

router.post(
  "/:id/items",
  authMiddleware,
  requirePermissions("contracts.update"),
  validateParams(contractAmendmentIdParamSchema),
  validateBody(createContractAmendmentItemSchema),
  addContractAmendmentItemHandler,
);

router.patch(
  "/:id/items/:itemId",
  authMiddleware,
  requirePermissions("contracts.update"),
  validateParams(contractAmendmentItemIdParamSchema),
  validateBody(updateContractAmendmentItemSchema),
  updateContractAmendmentItemHandler,
);

router.delete(
  "/items/:itemId",
  authMiddleware,
  requirePermissions("contracts.update"),
  validateParams(deleteContractAmendmentItemParamSchema),
  deleteContractAmendmentItemHandler,
);

router.post(
  "/:id/approve",
  authMiddleware,
  requirePermissions("contracts.update"),
  validateParams(contractAmendmentIdParamSchema),
  validateBody(approveContractAmendmentSchema),
  approveContractAmendmentHandler,
);

router.post(
  "/:id/reject",
  authMiddleware,
  requirePermissions("contracts.update"),
  validateParams(contractAmendmentIdParamSchema),
  validateBody(rejectContractAmendmentSchema),
  rejectContractAmendmentHandler,
);

router.post(
  "/:id/apply",
  authMiddleware,
  requirePermissions("contracts.update"),
  validateParams(contractAmendmentIdParamSchema),
  validateBody(applyContractAmendmentSchema),
  applyContractAmendmentHandler,
);

export default router;
