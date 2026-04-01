import { z } from "zod";

import { appointmentStatusEnum } from "./appointment.schemas";
import { eventStatusEnum } from "./event.schemas";

const queryNumber = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : value;
}, z.number().int().positive().optional());

const queryString = z.preprocess((value) => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed || undefined;
}, z.string().optional());

export const calendarSourceTypeEnum = z.enum(["all", "appointment", "event"]);

const calendarStatusEnum = z.union([appointmentStatusEnum, eventStatusEnum]);

export const eventCalendarQuerySchema = z.object({
  dateFrom: queryString,
  dateTo: queryString,
  status: calendarStatusEnum.optional(),
  venueId: queryNumber,
  customerId: queryNumber,
  search: queryString,
});

export const calendarFeedQuerySchema = z.object({
  dateFrom: queryString,
  dateTo: queryString,
  sourceType: calendarSourceTypeEnum.default("all"),
  status: calendarStatusEnum.optional(),
  venueId: queryNumber,
  customerId: queryNumber,
  search: queryString,
});

export type EventCalendarQuery = z.infer<typeof eventCalendarQuerySchema>;
export type CalendarFeedQuery = z.infer<typeof calendarFeedQuerySchema>;
