import { z } from "zod";
import { EVENT_STATUSES } from "../constants/workflow-statuses";
import {
  optionalPositiveIntQuery,
  optionalTrimmedStringQuery,
  paginationQuerySchema,
} from "./common.schemas";

export const eventStatusEnum = z.enum(EVENT_STATUSES);

const optionalNullablePositiveInt = z.preprocess((value) => {
  if (value === "" || value === null || typeof value === "undefined") {
    return null;
  }

  return typeof value === "string" ? Number(value) : value;
}, z.number().int().positive().nullable().optional());

const optionalNullableNonNegativeInt = z.preprocess((value) => {
  if (value === "" || value === null || typeof value === "undefined") {
    return null;
  }

  return typeof value === "string" ? Number(value) : value;
}, z.number().int().min(0).nullable().optional());

export const createEventSchema = z.object({
  customerId: z.number().int().positive().optional().nullable(),
  sourceAppointmentId: optionalNullablePositiveInt,
  title: z.string().max(200).optional().nullable(),
  eventDate: z.string().min(1).optional(),
  venueId: optionalNullablePositiveInt,
  venueNameSnapshot: z.string().max(150).optional().nullable(),
  groomName: z.string().max(150).optional().nullable(),
  brideName: z.string().max(150).optional().nullable(),
  guestCount: optionalNullableNonNegativeInt,
  notes: z.string().optional().nullable(),
  status: eventStatusEnum.optional(),
});

export const updateEventSchema = z.object({
  customerId: z.number().int().positive().optional().nullable(),
  sourceAppointmentId: optionalNullablePositiveInt,
  title: z.string().max(200).optional().nullable(),
  eventDate: z.string().optional(),
  venueId: optionalNullablePositiveInt,
  venueNameSnapshot: z.string().max(150).optional().nullable(),
  groomName: z.string().max(150).optional().nullable(),
  brideName: z.string().max(150).optional().nullable(),
  guestCount: optionalNullableNonNegativeInt,
  notes: z.string().optional().nullable(),
  status: eventStatusEnum.optional(),
});

export const createEventFromSourceSchema = z.object({
  customerId: z.number().int().positive().optional().nullable(),
  sourceAppointmentId: optionalNullablePositiveInt,
  title: z.string().max(200).optional().nullable(),
  eventDate: z.string().min(1).optional(),
  venueId: optionalNullablePositiveInt,
  venueNameSnapshot: z.string().max(150).optional().nullable(),
  groomName: z.string().max(150).optional().nullable(),
  brideName: z.string().max(150).optional().nullable(),
  guestCount: optionalNullableNonNegativeInt,
  notes: z.string().optional().nullable(),
});

export const eventListQuerySchema = paginationQuerySchema.extend({
  status: optionalTrimmedStringQuery,
  customerId: optionalPositiveIntQuery,
  venueId: optionalPositiveIntQuery,
  dateFrom: optionalTrimmedStringQuery,
  dateTo: optionalTrimmedStringQuery,
  search: optionalTrimmedStringQuery,
});
