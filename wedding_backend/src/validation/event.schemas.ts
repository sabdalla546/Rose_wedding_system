import { z } from "zod";

export const eventStatusEnum = z.enum([
  "draft",
  "designing",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
]);

export const eventSectionTypeEnum = z.enum([
  "client_info",
  "stage",
  "chairs",
  "floor",
  "hall_sides",
  "entrance",
  "vip_front",
  "back_seating",
  "buffet",
  "flowers",
  "groom_stage",
  "external_companies",
  "summary",
  "designer_notes",
  "general_notes",
]);

export const createEventSchema = z.object({
  customerId: z.number().int().positive(),
  title: z.string().max(200).optional().nullable(),
  eventDate: z.string().min(1),
  venueId: z.number().int().positive().optional().nullable(),
  venueNameSnapshot: z.string().max(150).optional().nullable(),
  groomName: z.string().max(150).optional().nullable(),
  brideName: z.string().max(150).optional().nullable(),
  guestCount: z.number().int().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: eventStatusEnum.optional(),
});

export const updateEventSchema = z.object({
  customerId: z.number().int().positive().optional().nullable(),
  title: z.string().max(200).optional().nullable(),
  eventDate: z.string().optional(),
  venueId: z.number().int().positive().optional().nullable(),
  venueNameSnapshot: z.string().max(150).optional().nullable(),
  groomName: z.string().max(150).optional().nullable(),
  brideName: z.string().max(150).optional().nullable(),
  guestCount: z.number().int().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: eventStatusEnum.optional(),
});

export const createEventSectionSchema = z.object({
  eventId: z.number().int().positive(),
  sectionType: eventSectionTypeEnum,
  title: z.string().max(150).optional(),
  sortOrder: z.number().int().min(0).optional(),
  data: z.record(z.any()).default({}),
  notes: z.string().optional(),
  isCompleted: z.boolean().optional(),
});

export const updateEventSectionSchema = z.object({
  sectionType: eventSectionTypeEnum.optional(),
  title: z.string().max(150).optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
  data: z.record(z.any()).optional(),
  notes: z.string().optional().nullable(),
  isCompleted: z.boolean().optional(),
});

export const createEventFromSourceSchema = z.object({
  customerId: z.number().int().positive(),
  title: z.string().max(200).optional().nullable(),
  eventDate: z.string().min(1),
  venueId: z.number().int().positive().optional().nullable(),
  venueNameSnapshot: z.string().max(150).optional().nullable(),
  groomName: z.string().max(150).optional().nullable(),
  brideName: z.string().max(150).optional().nullable(),
  guestCount: z.number().int().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
  sections: z
    .array(
      z.object({
        sectionType: eventSectionTypeEnum,
        title: z.string().max(150).optional(),
        sortOrder: z.number().int().min(0).optional(),
        data: z.record(z.any()).default({}),
        notes: z.string().optional(),
        isCompleted: z.boolean().optional(),
      }),
    )
    .optional(),
});
