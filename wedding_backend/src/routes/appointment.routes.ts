import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { requirePermissions } from "../middleware/rbac.middleware";
import {
  createAppointment,
  createAppointmentWithCustomer,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
  getAppointmentsCalendar,
  completeAppointment,
  cancelAppointment,
  rescheduleAppointment,
  confirmAppointment,
} from "../controllers/appointment.controller";

const router = Router();

router.get(
  "/calendar",
  authMiddleware,
  requirePermissions("appointments.calendar.read"),
  getAppointmentsCalendar,
);

router.get(
  "/",
  authMiddleware,
  requirePermissions("appointments.read"),
  getAppointments,
);

router.get(
  "/:id",
  authMiddleware,
  requirePermissions("appointments.read"),
  getAppointmentById,
);

router.post(
  "/",
  authMiddleware,
  requirePermissions("appointments.create"),
  createAppointment,
);

router.post(
  "/create-with-customer",
  authMiddleware,
  requirePermissions("appointments.create"),
  createAppointmentWithCustomer,
);
router.patch(
  "/:id/confirm",
  authMiddleware,
  requirePermissions("appointments.confirm"),
  confirmAppointment,
);

router.patch(
  "/:id/complete",
  authMiddleware,
  requirePermissions("appointments.complete"),
  completeAppointment,
);

router.patch(
  "/:id/cancel",
  authMiddleware,
  requirePermissions("appointments.cancel"),
  cancelAppointment,
);

router.patch(
  "/:id/reschedule",
  authMiddleware,
  requirePermissions("appointments.reschedule"),
  rescheduleAppointment,
);
router.put(
  "/:id",
  authMiddleware,
  requirePermissions("appointments.update"),
  updateAppointment,
);

router.delete(
  "/:id",
  authMiddleware,
  requirePermissions("appointments.delete"),
  deleteAppointment,
);

export default router;
