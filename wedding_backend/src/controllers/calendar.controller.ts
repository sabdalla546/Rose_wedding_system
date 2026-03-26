import type { Response } from "express";
import { ZodError } from "zod";

import type { AuthRequest } from "../middleware/auth.middleware";
import { calendarFeedQuerySchema } from "../validation/calendar.schemas";
import { getUnifiedCalendarFeed } from "../services/calendar/calendar.service";

const APPOINTMENTS_CALENDAR_PERMISSION = "appointments.calendar.read";
const EVENTS_CALENDAR_PERMISSION = "events.read";

export const getCalendarFeed = async (req: AuthRequest, res: Response) => {
  try {
    const query = calendarFeedQuerySchema.parse(req.query);
    const permissions = req.user?.permissions ?? [];
    const canReadAppointments = permissions.includes(
      APPOINTMENTS_CALENDAR_PERMISSION,
    );
    const canReadEvents = permissions.includes(EVENTS_CALENDAR_PERMISSION);

    if (!canReadAppointments && !canReadEvents) {
      return res.status(403).json({ message: req.t("auth.forbidden") });
    }

    if (query.sourceType === "appointment" && !canReadAppointments) {
      return res.status(403).json({ message: req.t("auth.forbidden") });
    }

    if (query.sourceType === "event" && !canReadEvents) {
      return res.status(403).json({ message: req.t("auth.forbidden") });
    }

    const sourceType =
      query.sourceType === "all"
        ? canReadAppointments && canReadEvents
          ? "all"
          : canReadAppointments
            ? "appointment"
            : "event"
        : query.sourceType;

    const data = await getUnifiedCalendarFeed({
      ...query,
      sourceType,
    });

    return res.json({ data });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ errors: error.errors });
    }

    return res.status(500).json({ message: req.t("common.unexpected_error") });
  }
};
