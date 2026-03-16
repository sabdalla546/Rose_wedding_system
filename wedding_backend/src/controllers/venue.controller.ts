import { Request, Response } from "express";
import { Op } from "sequelize";
import { ZodError } from "zod";
import { Venue } from "../models";
import {
  createVenueSchema,
  updateVenueSchema,
} from "../validation/venue.schemas";

export const createVenue = async (req: Request, res: Response) => {
  try {
    const data = createVenueSchema.parse(req.body);

    const existing = await Venue.findOne({
      where: { name: data.name.trim() },
    });

    if (existing) {
      return res.status(409).json({ message: "Venue name already exists" });
    }

    const venue = await Venue.create({
      name: data.name.trim(),
      city: data.city ?? null,
      area: data.area ?? null,
      address: data.address ?? null,
      phone: data.phone ?? null,
      contactPerson: data.contactPerson ?? null,
      notes: data.notes ?? null,
      isActive: data.isActive ?? true,
    });

    return res.status(201).json({
      message: "Venue created successfully",
      data: venue,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.errors });
    }

    return res.status(500).json({ message: req.t("common.unexpected_error") });
  }
};

export const getVenues = async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const search = String(req.query.search ?? "").trim();
  const isActive =
    typeof req.query.isActive !== "undefined"
      ? String(req.query.isActive) === "true"
      : undefined;

  const where: any = {};

  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { city: { [Op.like]: `%${search}%` } },
      { area: { [Op.like]: `%${search}%` } },
      { phone: { [Op.like]: `%${search}%` } },
      { contactPerson: { [Op.like]: `%${search}%` } },
    ];
  }

  if (typeof isActive === "boolean") {
    where.isActive = isActive;
  }

  const { count, rows } = await Venue.findAndCountAll({
    where,
    order: [["id", "DESC"]],
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

export const getVenueById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ message: req.t("common.invalid_id") });
  }

  const venue = await Venue.findByPk(id);

  if (!venue) {
    return res.status(404).json({ message: req.t("common.not_found") });
  }

  return res.json({ data: venue });
};

export const updateVenue = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ message: req.t("common.invalid_id") });
    }

    const data = updateVenueSchema.parse(req.body);

    const venue = await Venue.findByPk(id);

    if (!venue) {
      return res.status(404).json({ message: req.t("common.not_found") });
    }

    if (data.name && data.name.trim() !== venue.name) {
      const exists = await Venue.findOne({
        where: { name: data.name.trim() },
      });

      if (exists) {
        return res.status(409).json({ message: "Venue name already exists" });
      }
    }

    await venue.update({
      name: data.name?.trim() ?? venue.name,
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
    });

    return res.json({
      message: req.t("common.updated_successfully"),
      data: venue,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.errors });
    }

    return res.status(500).json({ message: req.t("common.unexpected_error") });
  }
};

export const deleteVenue = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ message: req.t("common.invalid_id") });
  }

  const venue = await Venue.findByPk(id);

  if (!venue) {
    return res.status(404).json({ message: req.t("common.not_found") });
  }

  await venue.destroy();

  return res.json({ message: req.t("common.deleted_successfully") });
};
