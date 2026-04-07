import { Request, Response } from "express";
import { Op, WhereOptions } from "sequelize";
import { Appointment, Event, Venue } from "../models";
import type { VenueSpecifications } from "../models/venue.model";

export const createVenue = async (req: Request, res: Response) => {
  try {
    const data = req.body as {
      name: string;
      city?: string | null;
      area?: string | null;
      address?: string | null;
      phone?: string | null;
      contactPerson?: string | null;
      notes?: string | null;
      isActive?: boolean;
      specificationsJson?: VenueSpecifications | null;
    };

    const existing = await Venue.findOne({
      where: { name: data.name },
    });

    if (existing) {
      return res.status(409).json({ message: req.t("venues.name_exists") });
    }

    const venue = await Venue.create({
      name: data.name,
      city: data.city ?? null,
      area: data.area ?? null,
      address: data.address ?? null,
      phone: data.phone ?? null,
      contactPerson: data.contactPerson ?? null,
      notes: data.notes ?? null,
      isActive: data.isActive ?? true,
      specificationsJson: data.specificationsJson ?? null,
    });

    return res.status(201).json({
      message: req.t("venues.created_successfully"),
      data: venue,
    });
  } catch (err) {
    return res.status(500).json({ message: req.t("common.unexpected_error") });
  }
};
export const getVenues = async (req: Request, res: Response) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const search = String(req.query.search ?? "").trim();

  const rawIsActive = req.query.isActive;
  const isActive =
    rawIsActive === "true" ? true : rawIsActive === "false" ? false : undefined;

  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 20;
  const offset = (safePage - 1) * safeLimit;

  const orConditions = search
    ? [
        { name: { [Op.like]: `%${search}%` } },
        { city: { [Op.like]: `%${search}%` } },
        { area: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { contactPerson: { [Op.like]: `%${search}%` } },
      ]
    : undefined;

  const where: WhereOptions = {
    ...(orConditions ? { [Op.or]: orConditions } : {}),
    ...(typeof isActive === "boolean" ? { isActive } : {}),
  };

  const { count, rows } = await Venue.findAndCountAll({
    where,
    order: [["id", "DESC"]],
    limit: safeLimit,
    offset,
  });

  return res.json({
    data: rows,
    meta: {
      total: count,
      page: safePage,
      limit: safeLimit,
      pages: Math.ceil(count / safeLimit),
    },
  });
};
export const getVenueById = async (req: Request, res: Response) => {
  const { id } = req.params as unknown as { id: number };

  const venue = await Venue.findByPk(id);

  if (!venue) {
    return res.status(404).json({ message: req.t("common.not_found") });
  }

  return res.json({ data: venue });
};

export const updateVenue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };

    const data = req.body as {
      name?: string;
      city?: string | null;
      area?: string | null;
      address?: string | null;
      phone?: string | null;
      contactPerson?: string | null;
      notes?: string | null;
      isActive?: boolean;
      specificationsJson?: VenueSpecifications | null;
    };

    const venue = await Venue.findByPk(id);

    if (!venue) {
      return res.status(404).json({ message: req.t("common.not_found") });
    }

    if (typeof data.name !== "undefined" && data.name !== venue.name) {
      const exists = await Venue.findOne({
        where: {
          name: data.name,
          id: { [Op.ne]: id },
        },
      });

      if (exists) {
        return res.status(409).json({ message: req.t("venues.name_exists") });
      }
    }

    await venue.update({
      name: typeof data.name !== "undefined" ? data.name : venue.name,
      city: typeof data.city !== "undefined" ? data.city : venue.city,
      area: typeof data.area !== "undefined" ? data.area : venue.area,
      address:
        typeof data.address !== "undefined" ? data.address : venue.address,
      phone: typeof data.phone !== "undefined" ? data.phone : venue.phone,
      contactPerson:
        typeof data.contactPerson !== "undefined"
          ? data.contactPerson
          : venue.contactPerson,
      notes: typeof data.notes !== "undefined" ? data.notes : venue.notes,
      isActive:
        typeof data.isActive === "boolean" ? data.isActive : venue.isActive,
      specificationsJson:
        typeof data.specificationsJson !== "undefined"
          ? data.specificationsJson
          : venue.specificationsJson,
    });

    return res.json({
      message: req.t("common.updated_successfully"),
      data: venue,
    });
  } catch (err) {
    return res.status(500).json({ message: req.t("common.unexpected_error") });
  }
};

export const deleteVenue = async (req: Request, res: Response) => {
  const { id } = req.params as unknown as { id: number };

  const venue = await Venue.findByPk(id);

  if (!venue) {
    return res.status(404).json({ message: req.t("common.not_found") });
  }

  const [appointmentsCount, eventsCount] = await Promise.all([
    Appointment.count({
      where: {
        venueId: id,
      },
    }),
    Event.count({
      where: {
        venueId: id,
      },
    }),
  ]);

  if (appointmentsCount > 0 || eventsCount > 0) {
    return res.status(409).json({
      message: req.t("venues.cannot_delete_linked"),
      details: {
        appointmentsCount,
        eventsCount,
      },
    });
  }

  await venue.destroy();

  return res.json({ message: req.t("common.deleted_successfully") });
};
