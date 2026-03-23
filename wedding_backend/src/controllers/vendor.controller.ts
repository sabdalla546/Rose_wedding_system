import { Request, Response } from "express";
import { Op, Transaction } from "sequelize";
import { ZodError } from "zod";
import { AuthRequest } from "../middleware/auth.middleware";
import {
  sequelize,
  Vendor,
  VendorSubService,
  VendorPricingPlan,
  EventVendor,
  EventVendorSubService,
  Event,
  User,
} from "../models";
import {
  createVendorSchema,
  updateVendorSchema,
  createVendorSubServiceSchema,
  updateVendorSubServiceSchema,
  createVendorPricingPlanSchema,
  updateVendorPricingPlanSchema,
  createEventVendorSchema,
  updateEventVendorSchema,
} from "../validation/vendor.schemas";

const userAuditInclude = [
  { model: User, as: "createdByUser", attributes: ["id", "fullName"] },
  { model: User, as: "updatedByUser", attributes: ["id", "fullName"] },
];

const eventVendorInclude = [
  { model: Vendor, as: "vendor" },
  { model: Event, as: "event" },
  {
    model: VendorPricingPlan,
    as: "pricingPlan",
  },
  {
    model: EventVendorSubService,
    as: "selectedSubServices",
    include: [{ model: VendorSubService, as: "vendorSubService" }],
  },
  ...userAuditInclude,
];

const parseBooleanQuery = (value: unknown) => {
  if (typeof value === "undefined") {
    return undefined;
  }

  return String(value) === "true";
};

const normalizeIdList = (ids?: number[]) =>
  [...new Set((ids ?? []).filter((value) => Number.isInteger(value) && value > 0))];

const sanitizeEventVendorPayload = (eventVendor: any) => {
  if (!eventVendor) {
    return eventVendor;
  }

  const plain =
    typeof eventVendor.toJSON === "function" ? eventVendor.toJSON() : eventVendor;

  if (Array.isArray(plain.selectedSubServices)) {
    plain.selectedSubServices = [...plain.selectedSubServices]
      .sort((left, right) => {
        if ((left.sortOrder ?? 0) !== (right.sortOrder ?? 0)) {
          return (left.sortOrder ?? 0) - (right.sortOrder ?? 0);
        }

        return (left.id ?? 0) - (right.id ?? 0);
      })
      .map((selectedSubService: any) => ({
        ...selectedSubService,
      }));
  }

  return plain;
};

const findMatchingPricingPlan = async ({
  vendorType,
  selectedSubServicesCount,
  transaction,
}: {
  vendorType: string;
  selectedSubServicesCount: number;
  transaction: Transaction;
}) => {
  if (selectedSubServicesCount <= 0) {
    return null;
  }

  return VendorPricingPlan.findOne({
    where: {
      vendorType,
      isActive: true,
      minSubServices: { [Op.lte]: selectedSubServicesCount },
      [Op.or]: [
        { maxSubServices: { [Op.gte]: selectedSubServicesCount } },
        { maxSubServices: null },
      ],
    },
    order: [
      ["minSubServices", "DESC"],
      ["maxSubServices", "ASC"],
      ["id", "ASC"],
    ],
    transaction,
  });
};

const resolveSelectedVendorSubServices = async ({
  vendorType,
  selectedSubServiceIds,
  transaction,
}: {
  vendorType: string;
  selectedSubServiceIds?: number[];
  transaction: Transaction;
}) => {
  const normalizedIds = normalizeIdList(selectedSubServiceIds);

  if (!normalizedIds.length) {
    return [];
  }

  const selectedSubServices = await VendorSubService.findAll({
    where: {
      id: { [Op.in]: normalizedIds },
      vendorType,
    },
    order: [
      ["sortOrder", "ASC"],
      ["name", "ASC"],
      ["id", "ASC"],
    ],
    transaction,
  });

  if (selectedSubServices.length !== normalizedIds.length) {
    throw new Error("One or more selected vendor sub-services are invalid");
  }

  return selectedSubServices;
};

const syncEventVendorSubServices = async ({
  eventVendorId,
  selectedSubServices,
  userId,
  transaction,
}: {
  eventVendorId: number;
  selectedSubServices: VendorSubService[];
  userId?: number | null;
  transaction: Transaction;
}) => {
  await EventVendorSubService.destroy({
    where: { eventVendorId },
    force: true,
    transaction,
  });

  if (!selectedSubServices.length) {
    return;
  }

  await EventVendorSubService.bulkCreate(
    selectedSubServices.map((subService, index) => ({
      eventVendorId,
      vendorSubServiceId: subService.id,
      nameSnapshot: subService.name,
      notes: null,
      sortOrder:
        typeof subService.sortOrder === "number" ? subService.sortOrder : index,
      createdBy: userId ?? null,
      updatedBy: userId ?? null,
    })),
    { transaction },
  );
};

export const createVendor = async (req: AuthRequest, res: Response) => {
  try {
    const data = createVendorSchema.parse(req.body);

    const vendor = await Vendor.create({
      name: data.name.trim(),
      type: data.type,
      contactPerson: data.contactPerson ?? data.contactName ?? null,
      phone: data.phone ?? data.mobile ?? null,
      phone2: data.phone2 ?? null,
      email: data.email ?? null,
      address: data.address ?? null,
      notes: data.notes ?? null,
      isActive: data.isActive ?? true,
      createdBy: req.user?.id ?? null,
      updatedBy: req.user?.id ?? null,
    });

    const created = await Vendor.findByPk(vendor.id, {
      include: userAuditInclude,
    });

    return res.status(201).json({
      message: "Vendor created successfully",
      data: created,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.errors });
    }
    return res.status(500).json({ message: req.t("common.unexpected_error") });
  }
};

export const getVendors = async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const search = String(req.query.search ?? "").trim();
  const type = String(req.query.type ?? "").trim();
  const isActive = parseBooleanQuery(req.query.isActive);

  const where: any = {};

  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { contactPerson: { [Op.like]: `%${search}%` } },
      { phone: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
    ];
  }

  if (type) where.type = type;
  if (typeof isActive === "boolean") where.isActive = isActive;

  const { count, rows } = await Vendor.findAndCountAll({
    where,
    include: userAuditInclude,
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

export const getVendorById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ message: req.t("common.invalid_id") });
  }

  const vendor = await Vendor.findByPk(id, {
    include: userAuditInclude,
  });

  if (!vendor) {
    return res.status(404).json({ message: req.t("common.not_found") });
  }

  return res.json({ data: vendor });
};

export const updateVendor = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ message: req.t("common.invalid_id") });
    }

    const data = updateVendorSchema.parse(req.body);

    const vendor = await Vendor.findByPk(id);
    if (!vendor) {
      return res.status(404).json({ message: req.t("common.not_found") });
    }

    await vendor.update({
      name: data.name ?? vendor.name,
      type: data.type ?? vendor.type,
      contactPerson:
        typeof data.contactPerson !== "undefined"
          ? data.contactPerson
          : typeof data.contactName !== "undefined"
            ? data.contactName
          : vendor.contactPerson,
      phone:
        typeof data.phone !== "undefined"
          ? data.phone
          : typeof data.mobile !== "undefined"
            ? data.mobile
            : vendor.phone,
      phone2: typeof data.phone2 !== "undefined" ? data.phone2 : vendor.phone2,
      email: typeof data.email !== "undefined" ? data.email : vendor.email,
      address:
        typeof data.address !== "undefined" ? data.address : vendor.address,
      notes: typeof data.notes !== "undefined" ? data.notes : vendor.notes,
      isActive:
        typeof data.isActive !== "undefined" ? data.isActive : vendor.isActive,
      updatedBy: req.user?.id ?? null,
    });

    const updated = await Vendor.findByPk(id, {
      include: userAuditInclude,
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

export const deleteVendor = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ message: req.t("common.invalid_id") });
  }

  const vendor = await Vendor.findByPk(id);
  if (!vendor) {
    return res.status(404).json({ message: req.t("common.not_found") });
  }

  await vendor.destroy();

  return res.json({ message: req.t("common.deleted_successfully") });
};

export const createVendorSubService = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const data = createVendorSubServiceSchema.parse(req.body);

    const subService = await VendorSubService.create({
      vendorType: data.vendorType,
      name: data.name.trim(),
      code: data.code ?? null,
      description: data.description ?? null,
      sortOrder: data.sortOrder ?? 0,
      isActive: data.isActive ?? true,
      createdBy: req.user?.id ?? null,
      updatedBy: req.user?.id ?? null,
    });

    const created = await VendorSubService.findByPk(subService.id, {
      include: userAuditInclude,
    });

    return res.status(201).json({
      message: "Vendor sub-service created successfully",
      data: created,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.errors });
    }

    return res.status(500).json({ message: req.t("common.unexpected_error") });
  }
};

export const listVendorSubServices = async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const search = String(req.query.search ?? "").trim();
  const vendorType = String(req.query.vendorType ?? "").trim();
  const isActive = parseBooleanQuery(req.query.isActive);

  const where: any = {};

  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { code: { [Op.like]: `%${search}%` } },
      { description: { [Op.like]: `%${search}%` } },
    ];
  }

  if (vendorType) where.vendorType = vendorType;
  if (typeof isActive === "boolean") where.isActive = isActive;

  const { count, rows } = await VendorSubService.findAndCountAll({
    where,
    include: userAuditInclude,
    order: [
      ["sortOrder", "ASC"],
      ["name", "ASC"],
      ["id", "ASC"],
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

export const getVendorSubServiceById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ message: req.t("common.invalid_id") });
  }

  const subService = await VendorSubService.findByPk(id, {
    include: userAuditInclude,
  });

  if (!subService) {
    return res.status(404).json({ message: req.t("common.not_found") });
  }

  return res.json({ data: subService });
};

export const updateVendorSubService = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ message: req.t("common.invalid_id") });
    }

    const data = updateVendorSubServiceSchema.parse(req.body);

    const subService = await VendorSubService.findByPk(id);
    if (!subService) {
      return res.status(404).json({ message: req.t("common.not_found") });
    }

    await subService.update({
      vendorType: data.vendorType ?? subService.vendorType,
      name: data.name ?? subService.name,
      code: typeof data.code !== "undefined" ? data.code : subService.code,
      description:
        typeof data.description !== "undefined"
          ? data.description
          : subService.description,
      sortOrder:
        typeof data.sortOrder !== "undefined"
          ? data.sortOrder
          : subService.sortOrder,
      isActive:
        typeof data.isActive !== "undefined"
          ? data.isActive
          : subService.isActive,
      updatedBy: req.user?.id ?? null,
    });

    const updated = await VendorSubService.findByPk(id, {
      include: userAuditInclude,
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

export const createVendorPricingPlan = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const data = createVendorPricingPlanSchema.parse(req.body);

    const pricingPlan = await VendorPricingPlan.create({
      vendorType: data.vendorType,
      name: data.name.trim(),
      minSubServices: data.minSubServices,
      maxSubServices: data.maxSubServices ?? null,
      price: data.price,
      notes: data.notes ?? null,
      isActive: data.isActive ?? true,
      createdBy: req.user?.id ?? null,
      updatedBy: req.user?.id ?? null,
    });

    const created = await VendorPricingPlan.findByPk(pricingPlan.id, {
      include: userAuditInclude,
    });

    return res.status(201).json({
      message: "Vendor pricing plan created successfully",
      data: created,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.errors });
    }

    return res.status(500).json({ message: req.t("common.unexpected_error") });
  }
};

export const listVendorPricingPlans = async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const search = String(req.query.search ?? "").trim();
  const vendorType = String(req.query.vendorType ?? "").trim();
  const isActive = parseBooleanQuery(req.query.isActive);

  const where: any = {};

  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { notes: { [Op.like]: `%${search}%` } },
    ];
  }

  if (vendorType) where.vendorType = vendorType;
  if (typeof isActive === "boolean") where.isActive = isActive;

  const { count, rows } = await VendorPricingPlan.findAndCountAll({
    where,
    include: userAuditInclude,
    order: [
      ["vendorType", "ASC"],
      ["minSubServices", "ASC"],
      ["id", "ASC"],
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

export const getVendorPricingPlanById = async (
  req: Request,
  res: Response,
) => {
  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ message: req.t("common.invalid_id") });
  }

  const pricingPlan = await VendorPricingPlan.findByPk(id, {
    include: userAuditInclude,
  });

  if (!pricingPlan) {
    return res.status(404).json({ message: req.t("common.not_found") });
  }

  return res.json({ data: pricingPlan });
};

export const updateVendorPricingPlan = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ message: req.t("common.invalid_id") });
    }

    const data = updateVendorPricingPlanSchema.parse(req.body);

    const pricingPlan = await VendorPricingPlan.findByPk(id);
    if (!pricingPlan) {
      return res.status(404).json({ message: req.t("common.not_found") });
    }

    const minSubServices =
      typeof data.minSubServices !== "undefined"
        ? data.minSubServices
        : pricingPlan.minSubServices;

    const maxSubServices =
      typeof data.maxSubServices !== "undefined"
        ? data.maxSubServices
        : pricingPlan.maxSubServices;

    if (
      maxSubServices !== null &&
      typeof maxSubServices !== "undefined" &&
      maxSubServices < minSubServices
    ) {
      return res.status(400).json({
        errors: [
          {
            path: ["maxSubServices"],
            message:
              "maxSubServices must be greater than or equal to minSubServices",
          },
        ],
      });
    }

    await pricingPlan.update({
      vendorType: data.vendorType ?? pricingPlan.vendorType,
      name: data.name ?? pricingPlan.name,
      minSubServices,
      maxSubServices: maxSubServices ?? null,
      price: typeof data.price !== "undefined" ? data.price : pricingPlan.price,
      notes: typeof data.notes !== "undefined" ? data.notes : pricingPlan.notes,
      isActive:
        typeof data.isActive !== "undefined"
          ? data.isActive
          : pricingPlan.isActive,
      updatedBy: req.user?.id ?? null,
    });

    const updated = await VendorPricingPlan.findByPk(id, {
      include: userAuditInclude,
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

export const createEventVendor = async (req: AuthRequest, res: Response) => {
  try {
    const data = createEventVendorSchema.parse(req.body);

    const event = await Event.findByPk(data.eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (data.vendorId) {
      const vendor = await Vendor.findByPk(data.vendorId);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
    }

    const eventVendor = await sequelize.transaction(async (transaction) => {
      const selectedSubServices = await resolveSelectedVendorSubServices({
        vendorType: data.vendorType,
        selectedSubServiceIds: data.selectedSubServiceIds,
        transaction,
      });
      const selectedSubServicesCount = selectedSubServices.length;
      const pricingPlan = await findMatchingPricingPlan({
        vendorType: data.vendorType,
        selectedSubServicesCount,
        transaction,
      });

      const createdEventVendor = await EventVendor.create(
        {
          eventId: data.eventId,
          vendorType: data.vendorType,
          providedBy: data.providedBy,
          vendorId: data.vendorId ?? null,
          companyNameSnapshot: data.companyNameSnapshot ?? null,
          pricingPlanId: pricingPlan?.id ?? null,
          selectedSubServicesCount,
          agreedPrice: pricingPlan?.price ?? null,
          notes: data.notes ?? null,
          status: data.status ?? "pending",
          createdBy: req.user?.id ?? null,
          updatedBy: req.user?.id ?? null,
        },
        { transaction },
      );

      await syncEventVendorSubServices({
        eventVendorId: createdEventVendor.id,
        selectedSubServices,
        userId: req.user?.id ?? null,
        transaction,
      });

      return createdEventVendor;
    });

    const created = await EventVendor.findByPk(eventVendor.id, {
      include: eventVendorInclude,
    });

    return res.status(201).json({
      message: "Event vendor created successfully",
      data: sanitizeEventVendorPayload(created),
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.errors });
    }
    if (
      err instanceof Error &&
      err.message === "One or more selected vendor sub-services are invalid"
    ) {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: req.t("common.unexpected_error") });
  }
};

export const getEventVendors = async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const eventId = Number(req.query.eventId) || undefined;
  const vendorType = String(req.query.vendorType ?? "").trim();
  const providedBy = String(req.query.providedBy ?? "").trim();
  const status = String(req.query.status ?? "").trim();

  const where: any = {};

  if (eventId) where.eventId = eventId;
  if (vendorType) where.vendorType = vendorType;
  if (providedBy) where.providedBy = providedBy;
  if (status) where.status = status;

  const { count, rows } = await EventVendor.findAndCountAll({
    where,
    include: eventVendorInclude,
    distinct: true,
    order: [["id", "DESC"]],
    limit,
    offset,
  });

  return res.json({
    data: rows.map((row) => sanitizeEventVendorPayload(row)),
    meta: {
      total: count,
      page,
      limit,
      pages: Math.ceil(count / limit),
    },
  });
};

export const getEventVendorById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ message: req.t("common.invalid_id") });
  }

  const eventVendor = await EventVendor.findByPk(id, {
    include: eventVendorInclude,
  });

  if (!eventVendor) {
    return res.status(404).json({ message: req.t("common.not_found") });
  }

  return res.json({ data: sanitizeEventVendorPayload(eventVendor) });
};

export const updateEventVendor = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ message: req.t("common.invalid_id") });
    }

    const data = updateEventVendorSchema.parse(req.body);

    const eventVendor = await EventVendor.findByPk(id, {
      include: [{ model: EventVendorSubService, as: "selectedSubServices" }],
    });
    if (!eventVendor) {
      return res.status(404).json({ message: req.t("common.not_found") });
    }

    if (typeof data.vendorId !== "undefined" && data.vendorId !== null) {
      const vendor = await Vendor.findByPk(data.vendorId);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
    }

    await sequelize.transaction(async (transaction) => {
      const nextVendorType = data.vendorType ?? eventVendor.vendorType;
      const shouldReplaceSelectedSubServices =
        Array.isArray(data.selectedSubServiceIds) ||
        nextVendorType !== eventVendor.vendorType;

      let selectedSubServicesCount = eventVendor.selectedSubServicesCount ?? 0;
      let pricingPlanId = eventVendor.pricingPlanId ?? null;
      let agreedPrice = eventVendor.agreedPrice ?? null;

      if (shouldReplaceSelectedSubServices) {
        const selectedSubServices = Array.isArray(data.selectedSubServiceIds)
          ? await resolveSelectedVendorSubServices({
              vendorType: nextVendorType,
              selectedSubServiceIds: data.selectedSubServiceIds,
              transaction,
            })
          : [];

        selectedSubServicesCount = selectedSubServices.length;
        const pricingPlan = await findMatchingPricingPlan({
          vendorType: nextVendorType,
          selectedSubServicesCount,
          transaction,
        });

        pricingPlanId = pricingPlan?.id ?? null;
        agreedPrice = pricingPlan?.price ?? null;

        await syncEventVendorSubServices({
          eventVendorId: eventVendor.id,
          selectedSubServices,
          userId: req.user?.id ?? null,
          transaction,
        });
      }

      await eventVendor.update(
        {
          vendorType: nextVendorType,
          providedBy: data.providedBy ?? eventVendor.providedBy,
          vendorId:
            typeof data.vendorId !== "undefined"
              ? data.vendorId
              : eventVendor.vendorId,
          companyNameSnapshot:
            typeof data.companyNameSnapshot !== "undefined"
              ? data.companyNameSnapshot
              : eventVendor.companyNameSnapshot,
          pricingPlanId,
          selectedSubServicesCount,
          agreedPrice,
          notes:
            typeof data.notes !== "undefined" ? data.notes : eventVendor.notes,
          status: data.status ?? eventVendor.status,
          updatedBy: req.user?.id ?? null,
        },
        { transaction },
      );
    });

    const updated = await EventVendor.findByPk(id, {
      include: eventVendorInclude,
    });

    return res.json({
      message: req.t("common.updated_successfully"),
      data: sanitizeEventVendorPayload(updated),
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.errors });
    }
    if (
      err instanceof Error &&
      err.message === "One or more selected vendor sub-services are invalid"
    ) {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: req.t("common.unexpected_error") });
  }
};

export const deleteEventVendor = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ message: req.t("common.invalid_id") });
  }

  const eventVendor = await EventVendor.findByPk(id);
  if (!eventVendor) {
    return res.status(404).json({ message: req.t("common.not_found") });
  }

  await sequelize.transaction(async (transaction) => {
    await EventVendorSubService.destroy({
      where: { eventVendorId: id },
      transaction,
    });

    await eventVendor.destroy({ transaction });
  });

  return res.json({ message: req.t("common.deleted_successfully") });
};
