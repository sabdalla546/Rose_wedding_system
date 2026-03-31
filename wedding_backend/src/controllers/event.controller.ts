import { Request, Response } from "express";
import { Op } from "sequelize";
import { ZodError } from "zod";
import { AuthRequest } from "../middleware/auth.middleware";
import { Appointment, Event, Customer, Venue, User } from "../models";
import { listEventsCalendarRecords } from "../services/calendar/calendar.service";
import {
  createEventSchema,
  updateEventSchema,
  createEventFromSourceSchema,
} from "../validation/event.schemas";
import { eventCalendarQuerySchema } from "../validation/calendar.schemas";

const eventInclude: any = [
  { model: Customer, as: "customer" },
  { model: Venue, as: "venue" },
  {
    model: Appointment,
    as: "sourceAppointment",
    include: [
      { model: Customer, as: "customer" },
      { model: Venue, as: "venue" },
    ],
  },

  { model: User, as: "createdByUser", attributes: ["id", "fullName"] },
  { model: User, as: "updatedByUser", attributes: ["id", "fullName"] },
];

const normalizeNullableString = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const ACTIVE_EVENT_STATUSES = [
  "draft",
  "designing",
  "confirmed",
  "in_progress",
  "completed",
] as const;

const getSourceAppointmentDefaults = async (
  sourceAppointmentId?: number | null,
) => {
  if (!sourceAppointmentId) {
    return null;
  }

  return Appointment.findByPk(sourceAppointmentId, {
    include: [
      { model: Customer, as: "customer" },
      { model: Venue, as: "venue" },
    ],
  });
};

export const createEvent = async (req: AuthRequest, res: Response) => {
  try {
    const data = createEventSchema.parse(req.body);

    const sourceAppointment = await getSourceAppointmentDefaults(
      data.sourceAppointmentId ?? null,
    );
    if (data.sourceAppointmentId && !sourceAppointment) {
      return res.status(404).json({ message: "Source appointment not found" });
    }

    if (data.sourceAppointmentId) {
      const existingEvent = await Event.findOne({
        where: {
          sourceAppointmentId: data.sourceAppointmentId,
          status: {
            [Op.in]: ACTIVE_EVENT_STATUSES,
          },
        },
      });

      if (existingEvent) {
        return res.status(409).json({
          message: "An event has already been created from this appointment",
        });
      }
    }

    const resolvedCustomerId =
      typeof data.customerId !== "undefined" && data.customerId !== null
        ? data.customerId
        : (sourceAppointment?.customerId ?? null);
    const resolvedEventDate =
      data.eventDate ||
      sourceAppointment?.weddingDate ||
      sourceAppointment?.appointmentDate ||
      null;
    const resolvedVenueId =
      typeof data.venueId !== "undefined"
        ? data.venueId
        : (sourceAppointment?.venueId ?? null);
    const resolvedGuestCount =
      typeof data.guestCount !== "undefined"
        ? data.guestCount
        : (sourceAppointment?.guestCount ?? null);

    if (!resolvedCustomerId) {
      return res.status(400).json({ message: "Customer is required" });
    }

    if (!resolvedEventDate) {
      return res.status(400).json({ message: "Event date is required" });
    }

    const customer = await Customer.findByPk(resolvedCustomerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    if (resolvedVenueId) {
      const venue = await Venue.findByPk(resolvedVenueId);
      if (!venue) {
        return res.status(404).json({ message: "Venue not found" });
      }
    }

    const event = await Event.create({
      customerId: resolvedCustomerId,
      sourceAppointmentId: data.sourceAppointmentId ?? null,
      title: normalizeNullableString(data.title),
      eventDate: resolvedEventDate,
      venueId: resolvedVenueId,
      venueNameSnapshot: normalizeNullableString(data.venueNameSnapshot),
      groomName: normalizeNullableString(data.groomName),
      brideName: normalizeNullableString(data.brideName),
      guestCount: resolvedGuestCount,
      notes: data.notes ?? null,
      status: data.status ?? "draft",
      createdBy: req.user?.id ?? null,
      updatedBy: req.user?.id ?? null,
    });

    const created = await Event.findByPk(event.id, {
      include: eventInclude,
    });

    return res.status(201).json({
      message: "Event created successfully",
      data: created,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.errors });
    }
    return res.status(500).json({ message: req.t("common.unexpected_error") });
  }
};

export const createEventFromSource = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const data = createEventFromSourceSchema.parse(req.body);

    const sourceAppointment = await getSourceAppointmentDefaults(
      data.sourceAppointmentId ?? null,
    );

    if (data.sourceAppointmentId && !sourceAppointment) {
      return res.status(404).json({ message: "Source appointment not found" });
    }

    if (data.sourceAppointmentId) {
      const existingEvent = await Event.findOne({
        where: {
          sourceAppointmentId: data.sourceAppointmentId,
          status: {
            [Op.in]: ACTIVE_EVENT_STATUSES,
          },
        },
      });

      if (existingEvent) {
        return res.status(409).json({
          message: "An event has already been created from this appointment",
        });
      }
    }

    const resolvedCustomerId =
      typeof data.customerId !== "undefined" && data.customerId !== null
        ? data.customerId
        : (sourceAppointment?.customerId ?? null);

    const resolvedEventDate =
      data.eventDate ||
      sourceAppointment?.weddingDate ||
      sourceAppointment?.appointmentDate ||
      null;

    const resolvedVenueId =
      typeof data.venueId !== "undefined"
        ? data.venueId
        : (sourceAppointment?.venueId ?? null);

    const resolvedGuestCount =
      typeof data.guestCount !== "undefined"
        ? data.guestCount
        : (sourceAppointment?.guestCount ?? null);

    if (!resolvedCustomerId) {
      return res.status(400).json({ message: "Customer is required" });
    }

    if (!resolvedEventDate) {
      return res.status(400).json({ message: "Event date is required" });
    }

    const customer = await Customer.findByPk(resolvedCustomerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    if (resolvedVenueId) {
      const venue = await Venue.findByPk(resolvedVenueId);
      if (!venue) {
        return res.status(404).json({ message: "Venue not found" });
      }
    }

    const event = await Event.create({
      customerId: customer.id,
      sourceAppointmentId: data.sourceAppointmentId ?? null,
      title:
        normalizeNullableString(data.title) ||
        `Wedding Event - ${customer.fullName}`,
      eventDate: resolvedEventDate,
      venueId: resolvedVenueId,
      venueNameSnapshot: normalizeNullableString(data.venueNameSnapshot),
      groomName: normalizeNullableString(data.groomName),
      brideName: normalizeNullableString(data.brideName),
      guestCount: resolvedGuestCount,
      notes: data.notes ?? null,
      status: "draft",
      createdBy: req.user?.id ?? null,
      updatedBy: req.user?.id ?? null,
    });

    const created = await Event.findByPk(event.id, {
      include: eventInclude,
    });

    return res.status(201).json({
      message: "Event created from source successfully",
      data: created,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.errors });
    }

    return res.status(500).json({ message: req.t("common.unexpected_error") });
  }
};

export const getEvents = async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const status = String(req.query.status ?? "").trim();
  const customerId = Number(req.query.customerId) || undefined;
  const venueId = Number(req.query.venueId) || undefined;
  const dateFrom = String(req.query.dateFrom ?? "").trim();
  const dateTo = String(req.query.dateTo ?? "").trim();
  const search = String(req.query.search ?? "").trim();

  const where: any = {};

  if (status) where.status = status;
  if (customerId) where.customerId = customerId;
  if (venueId) where.venueId = venueId;

  if (dateFrom || dateTo) {
    where.eventDate = {};
    if (dateFrom) where.eventDate[Op.gte] = dateFrom;
    if (dateTo) where.eventDate[Op.lte] = dateTo;
  }

  if (search) {
    const like = `%${search}%`;
    where[Op.or] = [
      { title: { [Op.like]: like } },
      { groomName: { [Op.like]: like } },
      { brideName: { [Op.like]: like } },
      { venueNameSnapshot: { [Op.like]: like } },
      { "$customer.fullName$": { [Op.like]: like } },
    ];
  }

  const { count, rows } = await Event.findAndCountAll({
    where,
    include: [
      { model: Customer, as: "customer" },
      { model: Venue, as: "venue" },
      { model: User, as: "createdByUser", attributes: ["id", "fullName"] },
      { model: User, as: "updatedByUser", attributes: ["id", "fullName"] },
    ],
    order: [
      ["eventDate", "ASC"],
      ["id", "DESC"],
    ],
    limit,
    offset,
  });

  return res.json({
    data: rows,
    meta: {
      total: count,
      page,
      limit,
      pages: Math.ceil(count / limit),
    },
  });
};

export const getEventsCalendar = async (req: Request, res: Response) => {
  try {
    const query = eventCalendarQuerySchema.parse(req.query);
    const data = await listEventsCalendarRecords({
      ...query,
      assignedUserId: undefined,
    });

    return res.json({ data });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ errors: error.errors });
    }

    return res.status(500).json({ message: req.t("common.unexpected_error") });
  }
};

export const getEventById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ message: req.t("common.invalid_id") });
  }

  const event = await Event.findByPk(id, {
    include: eventInclude,
  });

  if (!event) {
    return res.status(404).json({ message: req.t("common.not_found") });
  }

  return res.json({ data: event });
};

export const updateEvent = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ message: req.t("common.invalid_id") });
    }

    const data = updateEventSchema.parse(req.body);
    const event = await Event.findByPk(id);

    if (!event) {
      return res.status(404).json({ message: req.t("common.not_found") });
    }

    if (typeof data.customerId !== "undefined" && data.customerId !== null) {
      const customer = await Customer.findByPk(data.customerId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
    }

    if (typeof data.sourceAppointmentId !== "undefined") {
      if (data.sourceAppointmentId) {
        const sourceAppointment = await Appointment.findByPk(
          data.sourceAppointmentId,
        );
        if (!sourceAppointment) {
          return res
            .status(404)
            .json({ message: "Source appointment not found" });
        }

        const duplicateEvent = await Event.findOne({
          where: {
            sourceAppointmentId: data.sourceAppointmentId,
            id: {
              [Op.ne]: event.id,
            },
            status: {
              [Op.in]: ACTIVE_EVENT_STATUSES,
            },
          },
        });

        if (duplicateEvent) {
          return res.status(409).json({
            message: "An event has already been created from this appointment",
          });
        }
      }
    }

    if (typeof data.venueId !== "undefined" && data.venueId !== null) {
      const venue = await Venue.findByPk(data.venueId);
      if (!venue) {
        return res.status(404).json({ message: "Venue not found" });
      }
    }

    await event.update({
      customerId:
        typeof data.customerId !== "undefined"
          ? data.customerId
          : event.customerId,
      sourceAppointmentId:
        typeof data.sourceAppointmentId !== "undefined"
          ? data.sourceAppointmentId
          : event.sourceAppointmentId,
      title:
        typeof data.title !== "undefined"
          ? normalizeNullableString(data.title)
          : event.title,
      eventDate: data.eventDate ?? event.eventDate,
      venueId:
        typeof data.venueId !== "undefined" ? data.venueId : event.venueId,
      venueNameSnapshot:
        typeof data.venueNameSnapshot !== "undefined"
          ? normalizeNullableString(data.venueNameSnapshot)
          : event.venueNameSnapshot,
      groomName:
        typeof data.groomName !== "undefined"
          ? normalizeNullableString(data.groomName)
          : event.groomName,
      brideName:
        typeof data.brideName !== "undefined"
          ? normalizeNullableString(data.brideName)
          : event.brideName,
      guestCount:
        typeof data.guestCount !== "undefined"
          ? data.guestCount
          : event.guestCount,
      notes: typeof data.notes !== "undefined" ? data.notes : event.notes,
      status: data.status ?? event.status,
      updatedBy: req.user?.id ?? null,
    });

    const updated = await Event.findByPk(id, {
      include: eventInclude,
    });

    return res.json({
      message: req.t("common.updated_successfully"),
      data: updated,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.errors });
    }
    return res.status(500).json({ message: req.t("common.unexpected_error") });
  }
};

export const deleteEvent = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ message: req.t("common.invalid_id") });
  }

  const event = await Event.findByPk(id);
  if (!event) {
    return res.status(404).json({ message: req.t("common.not_found") });
  }

  await event.destroy();

  return res.json({ message: req.t("common.deleted_successfully") });
};
