import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { requirePermissions } from "../middleware/rbac.middleware";
import {
  createQuotation,
  createQuotationFromEvent,
  getQuotations,
  getQuotationById,
  updateQuotation,
  deleteQuotation,
  updateQuotationItem,
} from "../controllers/quotation.controller";

const router = Router();

router.get(
  "/",
  authMiddleware,
  requirePermissions("quotations.read"),
  getQuotations,
);
router.get(
  "/:id",
  authMiddleware,
  requirePermissions("quotations.read"),
  getQuotationById,
);

router.post(
  "/",
  authMiddleware,
  requirePermissions("quotations.create"),
  createQuotation,
);

router.post(
  "/create-from-event",
  authMiddleware,
  requirePermissions("quotations.create"),
  createQuotationFromEvent,
);

router.put(
  "/:id",
  authMiddleware,
  requirePermissions("quotations.update"),
  updateQuotation,
);
router.delete(
  "/:id",
  authMiddleware,
  requirePermissions("quotations.delete"),
  deleteQuotation,
);

router.put(
  "/items/:id",
  authMiddleware,
  requirePermissions("quotations.update"),
  updateQuotationItem,
);

export default router;
