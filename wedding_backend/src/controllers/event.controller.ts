import { Request, Response } from "express";
import { Op } from "sequelize";
import { ZodError } from "zod";
import { AuthRequest } from "../middleware/auth.middleware";
import { Event, EventSection, Customer, Lead, Venue, User } from "../models";
import {
  createEventSchema,
  updateEventSchema,
  createEventSectionSchema,
  updateEventSectionSchema,
  createEventFromSourceSchema,
} from "../validation/event.schemas";

export const createEvent = async (req: AuthRequest, res: Response) => {
  try {
    const data = createEventSchema.parse(req.body);

    if (data.customerId) {
      const customer = await Customer.findByPk(data.customerId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
    }

    if (data.leadId) {
      const lead = await Lead.findByPk(data.leadId);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
    }

    if (data.venueId) {
      const venue = await Venue.findByPk(data.venueId);
      if (!venue) {
        return res.status(404).json({ message: "Venue not found" });
      }
    }

    const event = await Event.create({
      customerId: data.customerId ?? null,
      leadId: data.leadId ?? null,
      eventDate: data.eventDate,
      venueId: data.venueId ?? null,
      venueNameSnapshot: data.venueNameSnapshot ?? null,
      groomName: data.groomName ?? null,
      brideName: data.brideName ?? null,
      guestCount: data.guestCount ?? null,
      contractNumber: data.contractNumber ?? null,
      title: data.title ?? null,
      notes: data.notes ?? null,
      status: data.status ?? "draft",
      createdBy: req.user?.id ?? null,
      updatedBy: req.user?.id ?? null,
    });

    const created = await Event.findByPk(event.id, {
      include: [
        { model: Customer, as: "customer" },
        { model: Lead, as: "lead" },
        { model: Venue, as: "venue" },
        { model: EventSection, as: "sections" },
      ],
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

    let customer: Customer | null = null;
    let lead: Lead | null = null;

    if (data.customerId) {
      customer = await Customer.findByPk(data.customerId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
    }

    if (data.leadId) {
      lead = await Lead.findByPk(data.leadId);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
    }

    const sourceVenueId = customer?.venueId ?? lead?.venueId ?? null;
    const sourceVenueName =
      customer?.venueNameSnapshot ?? lead?.venueNameSnapshot ?? null;

    const sourceGroomName = customer?.groomName ?? lead?.groomName ?? null;
    const sourceBrideName = customer?.brideName ?? lead?.brideName ?? null;

    if (sourceVenueId) {
      const venue = await Venue.findByPk(sourceVenueId);
      if (!venue) {
        return res.status(404).json({ message: "Source venue not found" });
      }
    }

    const resolvedEventDate =
      data.eventDate ?? customer?.weddingDate ?? lead?.weddingDate ?? "";

    const resolvedGroomName =
      typeof data.groomName !== "undefined"
        ? data.groomName
          ? data.groomName.trim()
          : data.groomName
        : sourceGroomName;

    const resolvedBrideName =
      typeof data.brideName !== "undefined"
        ? data.brideName
          ? data.brideName.trim()
          : data.brideName
        : sourceBrideName;

    const resolvedTitle =
      typeof data.title !== "undefined" && data.title !== null
        ? data.title.trim()
        : `Wedding Event - ${customer?.fullName ?? lead?.fullName ?? "Client"}`;

    const resolvedContractNumber =
      typeof data.contractNumber !== "undefined"
        ? data.contractNumber
          ? data.contractNumber.trim()
          : data.contractNumber
        : null;

    const event = await Event.create({
      customerId: customer?.id ?? null,
      leadId: lead?.id ?? null,
      eventDate: resolvedEventDate,
      venueId: sourceVenueId,
      venueNameSnapshot: sourceVenueName,
      guestCount: customer?.guestCount ?? lead?.guestCount ?? null,

      groomName: resolvedGroomName,
      brideName: resolvedBrideName,

      contractNumber: resolvedContractNumber,
      title: resolvedTitle,
      notes: typeof data.notes !== "undefined" ? data.notes : null,
      status: "draft",
      createdBy: req.user?.id ?? null,
      updatedBy: req.user?.id ?? null,
    });

    if (data.sections?.length) {
      await EventSection.bulkCreate(
        data.sections.map((section) => ({
          eventId: event.id,
          sectionType: section.sectionType,
          title:
            typeof section.title !== "undefined" && section.title !== null
              ? section.title.trim()
              : null,
          sortOrder: section.sortOrder ?? 0,
          data: section.data ?? {},
          notes: typeof section.notes !== "undefined" ? section.notes : null,
          isCompleted: section.isCompleted ?? false,
          createdBy: req.user?.id ?? null,
          updatedBy: req.user?.id ?? null,
        })),
      );
    }

    const created = await Event.findByPk(event.id, {
      include: [
        { model: Customer, as: "customer" },
        { model: Lead, as: "lead" },
        { model: Venue, as: "venue" },
        {
          model: EventSection,
          as: "sections",
          separate: true,
          order: [
            ["sortOrder", "ASC"],
            ["id", "ASC"],
          ],
        },
      ],
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
  const leadId = Number(req.query.leadId) || undefined;
  const venueId = Number(req.query.venueId) || undefined;
  const dateFrom = String(req.query.dateFrom ?? "").trim();
  const dateTo = String(req.query.dateTo ?? "").trim();
  const search = String(req.query.search ?? "").trim();

  const where: any = {};

  if (status) where.status = status;
  if (customerId) where.customerId = customerId;
  if (leadId) where.leadId = leadId;
  if (venueId) where.venueId = venueId;

  if (dateFrom || dateTo) {
    where.eventDate = {};
    if (dateFrom) where.eventDate[Op.gte] = dateFrom;
    if (dateTo) where.eventDate[Op.lte] = dateTo;
  }

  if (search) {
    where[Op.or] = [
      { title: { [Op.like]: `%${search}%` } },
      { contractNumber: { [Op.like]: `%${search}%` } },
      { groomName: { [Op.like]: `%${search}%` } },
      { brideName: { [Op.like]: `%${search}%` } },
      { venueNameSnapshot: { [Op.like]: `%${search}%` } },
    ];
  }

  const { count, rows } = await Event.findAndCountAll({
    where,
    include: [
      { model: Customer, as: "customer" },
      { model: Lead, as: "lead" },
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

export const getEventById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ message: req.t("common.invalid_id") });
  }

  const event = await Event.findByPk(id, {
    include: [
      { model: Customer, as: "customer" },
      { model: Lead, as: "lead" },
      { model: Venue, as: "venue" },
      {
        model: EventSection,
        as: "sections",
        separate: true,
        order: [
          ["sortOrder", "ASC"],
          ["id", "ASC"],
        ],
      },
      { model: User, as: "createdByUser", attributes: ["id", "fullName"] },
      { model: User, as: "updatedByUser", attributes: ["id", "fullName"] },
    ],
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

    if (typeof data.leadId !== "undefined" && data.leadId !== null) {
      const lead = await Lead.findByPk(data.leadId);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
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
      leadId: typeof data.leadId !== "undefined" ? data.leadId : event.leadId,
      eventDate: data.eventDate ?? event.eventDate,
      venueId:
        typeof data.venueId !== "undefined" ? data.venueId : event.venueId,
      venueNameSnapshot:
        typeof data.venueNameSnapshot !== "undefined"
          ? data.venueNameSnapshot
          : event.venueNameSnapshot,
      groomName:
        typeof data.groomName !== "undefined"
          ? data.groomName
          : event.groomName,
      brideName:
        typeof data.brideName !== "undefined"
          ? data.brideName
          : event.brideName,
      guestCount:
        typeof data.guestCount !== "undefined"
          ? data.guestCount
          : event.guestCount,
      contractNumber:
        typeof data.contractNumber !== "undefined"
          ? data.contractNumber
          : event.contractNumber,
      title: typeof data.title !== "undefined" ? data.title : event.title,
      notes: typeof data.notes !== "undefined" ? data.notes : event.notes,
      status: data.status ?? event.status,
      updatedBy: req.user?.id ?? null,
    });

    const updated = await Event.findByPk(id, {
      include: [
        { model: Customer, as: "customer" },
        { model: Lead, as: "lead" },
        { model: Venue, as: "venue" },
        {
          model: EventSection,
          as: "sections",
          separate: true,
          order: [
            ["sortOrder", "ASC"],
            ["id", "ASC"],
          ],
        },
      ],
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

export const createEventSection = async (req: AuthRequest, res: Response) => {
  try {
    const data = createEventSectionSchema.parse(req.body);

    const event = await Event.findByPk(data.eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const section = await EventSection.create({
      eventId: data.eventId,
      sectionType: data.sectionType,
      title: data.title ?? null,
      sortOrder: data.sortOrder ?? 0,
      data: data.data ?? {},
      notes: data.notes ?? null,
      isCompleted: data.isCompleted ?? false,
      createdBy: req.user?.id ?? null,
      updatedBy: req.user?.id ?? null,
    });

    return res.status(201).json({
      message: "Event section created successfully",
      data: section,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.errors });
    }
    return res.status(500).json({ message: req.t("common.unexpected_error") });
  }
};

export const updateEventSection = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ message: req.t("common.invalid_id") });
    }

    const data = updateEventSectionSchema.parse(req.body);

    const section = await EventSection.findByPk(id);
    if (!section) {
      return res.status(404).json({ message: req.t("common.not_found") });
    }

    await section.update({
      sectionType: data.sectionType ?? section.sectionType,
      title: typeof data.title !== "undefined" ? data.title : section.title,
      sortOrder:
        typeof data.sortOrder !== "undefined"
          ? data.sortOrder
          : section.sortOrder,
      data: typeof data.data !== "undefined" ? data.data : section.data,
      notes: typeof data.notes !== "undefined" ? data.notes : section.notes,
      isCompleted:
        typeof data.isCompleted !== "undefined"
          ? data.isCompleted
          : section.isCompleted,
      updatedBy: req.user?.id ?? null,
    });

    return res.json({
      message: req.t("common.updated_successfully"),
      data: section,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.errors });
    }
    return res.status(500).json({ message: req.t("common.unexpected_error") });
  }
};

export const deleteEventSection = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ message: req.t("common.invalid_id") });
  }

  const section = await EventSection.findByPk(id);
  if (!section) {
    return res.status(404).json({ message: req.t("common.not_found") });
  }

  await section.destroy();

  return res.json({ message: req.t("common.deleted_successfully") });
};
