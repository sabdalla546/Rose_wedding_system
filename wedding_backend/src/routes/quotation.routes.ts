import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { requirePermissions } from "../middleware/rbac.middleware";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../middleware/validation.middleware";
import {
  createQuotation,
  createQuotationFromEvent,
  getQuotations,
  getQuotationById,
  downloadQuotationPdf,
  updateQuotation,
  deleteQuotation,
  updateQuotationItem,
} from "../controllers/quotation.controller";
import { idParamSchema } from "../validation/common.schemas";
import {
  createQuotationFromEventSchema,
  createQuotationSchema,
  quotationListQuerySchema,
  updateQuotationItemSchema,
  updateQuotationSchema,
} from "../validation/quotation.schemas";

const router = Router();

router.get(
  "/",
  authMiddleware,
  requirePermissions("quotations.read"),
  validateQuery(quotationListQuerySchema),
  getQuotations,
);
router.get(
  "/:id",
  authMiddleware,
  requirePermissions("quotations.read"),
  validateParams(idParamSchema),
  getQuotationById,
);
router.get(
  "/:id/pdf",
  authMiddleware,
  requirePermissions("quotations.read"),
  validateParams(idParamSchema),
  downloadQuotationPdf,
);

router.post(
  "/",
  authMiddleware,
  requirePermissions("quotations.create"),
  validateBody(createQuotationSchema),
  createQuotation,
);

router.post(
  "/create-from-event",
  authMiddleware,
  requirePermissions("quotations.create"),
  validateBody(createQuotationFromEventSchema),
  createQuotationFromEvent,
);

router.put(
  "/:id",
  authMiddleware,
  requirePermissions("quotations.update"),
  validateParams(idParamSchema),
  validateBody(updateQuotationSchema),
  updateQuotation,
);
router.delete(
  "/:id",
  authMiddleware,
  requirePermissions("quotations.delete"),
  validateParams(idParamSchema),
  deleteQuotation,
);

router.put(
  "/items/:id",
  authMiddleware,
  requirePermissions("quotations.update"),
  validateParams(idParamSchema),
  validateBody(updateQuotationItemSchema),
  updateQuotationItem,
);

export default router;
