import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { requirePermissions } from "../middleware/rbac.middleware";
import {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  deleteLead,
  markLeadLost,
  convertLeadToCustomer,
} from "../controllers/lead.controller";

const router = Router();

router.get("/", authMiddleware, requirePermissions("leads.read"), getLeads);
router.get(
  "/:id",
  authMiddleware,
  requirePermissions("leads.read"),
  getLeadById,
);
router.post(
  "/",
  authMiddleware,
  requirePermissions("leads.create"),
  createLead,
);

router.post(
  "/:id/mark-lost",
  authMiddleware,
  requirePermissions("leads.update"),
  markLeadLost,
);

router.post(
  "/:id/convert-to-customer",
  authMiddleware,
  requirePermissions("leads.convert"),
  convertLeadToCustomer,
);

router.put(
  "/:id",
  authMiddleware,
  requirePermissions("leads.update"),
  updateLead,
);
router.delete(
  "/:id",
  authMiddleware,
  requirePermissions("leads.delete"),
  deleteLead,
);

export default router;
