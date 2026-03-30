import { Request, Response } from "express";
import { Op, Transaction } from "sequelize";
import { ZodError } from "zod";
import { AuthRequest } from "../middleware/auth.middleware";
import {
  sequelize,
  Vendor,
  VendorType,
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

const buildUserAuditInclude = () => [
  { model: User, as: "createdByUser", attributes: ["id", "fullName"] },
  { model: User, as: "updatedByUser", attributes: ["id", "fullName"] },
];

const vendorTypeSummaryAttributes = [
  "id",
  "name",
  "nameAr",
  "slug",
  "isActive",
  "sortOrder",
];

const buildVendorTypeSummaryInclude = () => ({
  model: VendorType,
  as: "vendorType",
  attributes: vendorTypeSummaryAttributes,
});

const buildVendorInclude = () => [
  buildVendorTypeSummaryInclude(),
  ...buildUserAuditInclude(),
];

const buildVendorSummaryInclude = () => ({
  model: Vendor,
  as: "vendor",
  attributes: ["id", "name", "type", "typeId", "isActive"],
  include: [buildVendorTypeSummaryInclude()],
});

const buildEventVendorInclude = () => [
  buildVendorSummaryInclude(),
  { model: Event, as: "event" },
  {
    model: VendorPricingPlan,
    as: "pricingPlan",
    include: [buildVendorSummaryInclude()],
  },
  {
    model: EventVendorSubService,
    as: "selectedSubServices",
    include: [
      {
        model: VendorSubService,
        as: "vendorSubService",
        include: [buildVendorSummaryInclude()],
      },
    ],
  },
  ...buildUserAuditInclude(),
];

const buildVendorSubServiceInclude = () => [
  buildVendorSummaryInclude(),
  ...buildUserAuditInclude(),
];
const buildVendorPricingPlanInclude = () => [
  buildVendorSummaryInclude(),
  ...buildUserAuditInclude(),
];

const parseBooleanQuery = (value: unknown) => {
  if (typeof value === "undefined") {
    return undefined;
  }

  return String(value) === "true";
};

const normalizeIdList = (ids?: number[]) => [
  ...new Set(
    (ids ?? []).filter((value) => Number.isInteger(value) && value > 0),
  ),
];

const toNumberValue = (value?: number | string | null) => {
  if (value === null || typeof value === "undefined" || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const resolveVendorTypeSelection = async ({
  type,
  typeId,
}: {
  type?: string | null;
  typeId?: number | null;
}) => {
  // TODO(phase-2): remove the legacy string fallback once vendor flows
  // outside basic vendor CRUD fully consume typeId/vendorType records.
  const normalizedType = type?.trim() || null;
  const normalizedTypeId =
    typeof typeId === "number" && typeId > 0 ? typeId : null;

  let vendorType: VendorType | null = null;

  if (normalizedTypeId) {
    vendorType = await VendorType.findByPk(normalizedTypeId);

    if (!vendorType) {
      throw new Error("Vendor type not found");
    }
  }

  if (!vendorType && normalizedType) {
    vendorType = await VendorType.findOne({
      where: { slug: normalizedType },
    });
  }

  if (vendorType && normalizedType && vendorType.slug !== normalizedType) {
    throw new Error("Vendor type does not match the selected legacy type");
  }

  return {
    vendorType,
    legacyType: vendorType?.slug ?? normalizedType,
  };
};

const sanitizeEventVendorPayload = (eventVendor: any) => {
  if (!eventVendor) {
    return eventVendor;
  }

  const plain =
    typeof eventVendor.toJSON === "function"
      ? eventVendor.toJSON()
      : eventVendor;

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

  plain.resolvedCompanyName =
    plain.vendor?.name ?? plain.companyNameSnapshot ?? null;

  plain.resolvedPricingLabel = plain.pricingPlan
    ? plain.pricingPlan.name
    : null;

  const agreedPriceValue = toNumberValue(plain.agreedPrice);
  const pricingPlanPriceValue = toNumberValue(plain.pricingPlan?.price);

  plain.hasManualPriceOverride =
    agreedPriceValue !== null &&
    (pricingPlanPriceValue === null ||
      agreedPriceValue !== pricingPlanPriceValue);

  return plain;
};

const resolveVendorById = async ({
  vendorId,
  transaction,
}: {
  vendorId: number;
  transaction?: Transaction;
}) => {
  const vendor = await Vendor.findByPk(vendorId, { transaction });

  if (!vendor) {
    throw new Error("Vendor not found");
  }

  return vendor;
};

const findMatchingPricingPlan = async ({
  vendorId,
  selectedSubServicesCount,
  transaction,
}: {
  vendorId: number;
  selectedSubServicesCount: number;
  transaction: Transaction;
}) => {
  if (selectedSubServicesCount <= 0) {
    return null;
  }

  return VendorPricingPlan.findOne({
    where: {
      vendorId,
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

const parseEventVendorOrder = (
  sortByRaw: unknown,
  sortDirectionRaw: unknown,
): Array<[string, "ASC" | "DESC"]> => {
  const sortDirection =
    String(sortDirectionRaw ?? "").toLowerCase() === "asc" ? "ASC" : "DESC";

  const sortByMap: Record<string, string> = {
    createdAt: "createdAt",
    updatedAt: "updatedAt",
    vendorType: "vendorType",
    providedBy: "providedBy",
    status: "status",
    agreedPrice: "agreedPrice",
    selectedSubServicesCount: "selectedSubServicesCount",
  };

  const sortBy = sortByMap[String(sortByRaw ?? "")];

  if (!sortBy) {
    return [["id", "DESC"]];
  }

  return [
    [sortBy, sortDirection],
    ["id", "DESC"],
  ];
};

const resolveSelectedVendorSubServices = async ({
  vendorId,
  selectedSubServiceIds,
  transaction,
}: {
  vendorId: number;
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
      vendorId,
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
    const { vendorType, legacyType } = await resolveVendorTypeSelection({
      type: data.type,
      typeId: data.typeId,
    });

    if (!legacyType) {
      return res.status(400).json({
        message: "Vendor type is required",
      });
    }

    const vendor = await Vendor.create({
      name: data.name.trim(),
      type: legacyType as Vendor["type"],
      typeId: vendorType?.id ?? null,
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
      include: buildVendorInclude(),
    });

    return res.status(201).json({
      message: "Vendor created successfully",
      data: created,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.errors });
    }
    if (
      err instanceof Error &&
      (err.message === "Vendor type not found" ||
        err.message === "Vendor type does not match the selected legacy type")
    ) {
      return res.status(400).json({ message: err.message });
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
    include: buildVendorInclude(),
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
    include: buildVendorInclude(),
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

    const shouldResolveVendorType =
      typeof data.type !== "undefined" || typeof data.typeId !== "undefined";
    const resolvedVendorType = shouldResolveVendorType
      ? await resolveVendorTypeSelection({
          type: typeof data.type !== "undefined" ? data.type : undefined,
          typeId:
            typeof data.typeId !== "undefined" ? (data.typeId ?? null) : undefined,
        })
      : null;

    await vendor.update({
      name: data.name ?? vendor.name,
      type: resolvedVendorType?.legacyType ?? vendor.type,
      typeId:
        shouldResolveVendorType
          ? (resolvedVendorType?.vendorType?.id ?? null)
          : vendor.typeId ?? null,
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
      include: buildVendorInclude(),
    });

    return res.json({
      message: req.t("common.updated_successfully"),
      data: updated,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.errors });
    }
    if (
      err instanceof Error &&
      (err.message === "Vendor type not found" ||
        err.message === "Vendor type does not match the selected legacy type")
    ) {
      return res.status(400).json({ message: err.message });
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
    const vendor = await resolveVendorById({ vendorId: data.vendorId });

    const subService = await VendorSubService.create({
      vendorId: vendor.id,
      vendorType: vendor.type,
      name: data.name.trim(),
      code: data.code ?? null,
      description: data.description ?? null,
      sortOrder: data.sortOrder ?? 0,
      isActive: data.isActive ?? true,
      createdBy: req.user?.id ?? null,
      updatedBy: req.user?.id ?? null,
    });

    const created = await VendorSubService.findByPk(subService.id, {
      include: buildVendorSubServiceInclude(),
    });

    return res.status(201).json({
      message: "Vendor sub-service created successfully",
      data: created,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.errors });
    }
    if (err instanceof Error && err.message === "Vendor not found") {
      return res.status(404).json({ message: err.message });
    }

    return res.status(500).json({ message: req.t("common.unexpected_error") });
  }
};

export const listVendorSubServices = async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const search = String(req.query.search ?? "").trim();
  const vendorId = Number(req.query.vendorId) || undefined;
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

  if (vendorId) where.vendorId = vendorId;
  if (vendorType) where.vendorType = vendorType;
  if (typeof isActive === "boolean") where.isActive = isActive;

  const { count, rows } = await VendorSubService.findAndCountAll({
    where,
    include: buildVendorSubServiceInclude(),
    order: [
      ["vendorId", "ASC"],
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
    include: buildVendorSubServiceInclude(),
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

    const vendor =
      typeof data.vendorId !== "undefined"
        ? await resolveVendorById({ vendorId: data.vendorId })
        : subService.vendorId
          ? await resolveVendorById({ vendorId: subService.vendorId })
          : null;

    if (!vendor) {
      return res.status(400).json({
        message: "Vendor sub-service must be linked to a vendor",
      });
    }

    await subService.update({
      vendorId: vendor.id,
      vendorType: vendor.type,
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
      include: buildVendorSubServiceInclude(),
    });

    return res.json({
      message: req.t("common.updated_successfully"),
      data: updated,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.errors });
    }
    if (err instanceof Error && err.message === "Vendor not found") {
      return res.status(404).json({ message: err.message });
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
    const vendor = await resolveVendorById({ vendorId: data.vendorId });

    const pricingPlan = await VendorPricingPlan.create({
      vendorId: vendor.id,
      vendorType: vendor.type,
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
      include: buildVendorPricingPlanInclude(),
    });

    return res.status(201).json({
      message: "Vendor pricing plan created successfully",
      data: created,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.errors });
    }
    if (err instanceof Error && err.message === "Vendor not found") {
      return res.status(404).json({ message: err.message });
    }

    return res.status(500).json({ message: req.t("common.unexpected_error") });
  }
};

export const listVendorPricingPlans = async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const search = String(req.query.search ?? "").trim();
  const vendorId = Number(req.query.vendorId) || undefined;
  const vendorType = String(req.query.vendorType ?? "").trim();
  const isActive = parseBooleanQuery(req.query.isActive);

  const where: any = {};

  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { notes: { [Op.like]: `%${search}%` } },
    ];
  }

  if (vendorId) where.vendorId = vendorId;
  if (vendorType) where.vendorType = vendorType;
  if (typeof isActive === "boolean") where.isActive = isActive;

  const { count, rows } = await VendorPricingPlan.findAndCountAll({
    where,
    include: buildVendorPricingPlanInclude(),
    order: [
      ["vendorId", "ASC"],
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

export const getVendorPricingPlanById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ message: req.t("common.invalid_id") });
  }

  const pricingPlan = await VendorPricingPlan.findByPk(id, {
    include: buildVendorPricingPlanInclude(),
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

    const vendor =
      typeof data.vendorId !== "undefined"
        ? await resolveVendorById({ vendorId: data.vendorId })
        : pricingPlan.vendorId
          ? await resolveVendorById({ vendorId: pricingPlan.vendorId })
          : null;

    if (!vendor) {
      return res.status(400).json({
        message: "Vendor pricing plan must be linked to a vendor",
      });
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
      vendorId: vendor.id,
      vendorType: vendor.type,
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
      include: buildVendorPricingPlanInclude(),
    });

    return res.json({
      message: req.t("common.updated_successfully"),
      data: updated,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.errors });
    }
    if (err instanceof Error && err.message === "Vendor not found") {
      return res.status(404).json({ message: err.message });
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

    let selectedVendor: Vendor | null = null;

    if (data.vendorId) {
      selectedVendor = await resolveVendorById({ vendorId: data.vendorId });
    }

    if (selectedVendor && selectedVendor.type !== data.vendorType) {
      return res.status(400).json({
        message: "Selected vendor does not match the chosen vendor type",
      });
    }

    if (!selectedVendor && normalizeIdList(data.selectedSubServiceIds).length) {
      return res.status(400).json({
        message: "Select a vendor before choosing vendor sub-services",
      });
    }

    const eventVendor = await sequelize.transaction(async (transaction) => {
      const selectedSubServices = selectedVendor
        ? await resolveSelectedVendorSubServices({
            vendorId: selectedVendor.id,
            selectedSubServiceIds: data.selectedSubServiceIds,
            transaction,
          })
        : [];
      const selectedSubServicesCount = selectedSubServices.length;
      const pricingPlan = selectedVendor
        ? await findMatchingPricingPlan({
            vendorId: selectedVendor.id,
            selectedSubServicesCount,
            transaction,
          })
        : null;
      const agreedPrice =
        typeof data.agreedPrice !== "undefined"
          ? data.agreedPrice
          : (pricingPlan?.price ?? null);

      const createdEventVendor = await EventVendor.create(
        {
          eventId: data.eventId,
          vendorType: selectedVendor?.type ?? data.vendorType,
          providedBy: data.providedBy,
          vendorId: data.vendorId ?? null,
          companyNameSnapshot:
            data.companyNameSnapshot ?? selectedVendor?.name ?? null,
          pricingPlanId: pricingPlan?.id ?? null,
          selectedSubServicesCount,
          agreedPrice,
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
      include: buildEventVendorInclude(),
    });

    return res.status(201).json({
      message: "Event vendor created successfully",
      data: sanitizeEventVendorPayload(created),
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.errors });
    }
    if (err instanceof Error && err.message === "Vendor not found") {
      return res.status(404).json({ message: err.message });
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
  const order = parseEventVendorOrder(
    req.query.sortBy,
    req.query.sortDirection,
  );

  const where: any = {};

  if (eventId) where.eventId = eventId;
  if (vendorType) where.vendorType = vendorType;
  if (providedBy) where.providedBy = providedBy;
  if (status) where.status = status;

  const { count, rows } = await EventVendor.findAndCountAll({
    where,
    include: buildEventVendorInclude(),
    distinct: true,
    order,
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
    include: buildEventVendorInclude(),
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

    const nextProvidedBy = data.providedBy ?? eventVendor.providedBy;
    const nextVendorId =
      typeof data.vendorId !== "undefined"
        ? data.vendorId
        : (eventVendor.vendorId ?? null);
    let nextVendor: Vendor | null = null;

    if (nextVendorId) {
      nextVendor = await resolveVendorById({ vendorId: nextVendorId });
    }

    if (
      nextVendor &&
      typeof data.vendorType !== "undefined" &&
      data.vendorType !== nextVendor.type
    ) {
      return res.status(400).json({
        message: "Selected vendor does not match the chosen vendor type",
      });
    }

    const nextVendorType =
      nextVendor?.type ?? data.vendorType ?? eventVendor.vendorType;

    if (
      !nextVendor &&
      Array.isArray(data.selectedSubServiceIds) &&
      normalizeIdList(data.selectedSubServiceIds).length
    ) {
      return res.status(400).json({
        message: "Select a vendor before choosing vendor sub-services",
      });
    }

    await sequelize.transaction(async (transaction) => {
      const shouldReplaceSelectedSubServices =
        Array.isArray(data.selectedSubServiceIds) ||
        nextVendorType !== eventVendor.vendorType ||
        nextVendorId !== (eventVendor.vendorId ?? null) ||
        nextProvidedBy !== eventVendor.providedBy;

      let selectedSubServicesCount = eventVendor.selectedSubServicesCount ?? 0;
      let pricingPlanId = eventVendor.pricingPlanId ?? null;
      let agreedPrice = eventVendor.agreedPrice ?? null;

      if (shouldReplaceSelectedSubServices) {
        const selectedSubServices = nextVendor
          ? Array.isArray(data.selectedSubServiceIds)
            ? await resolveSelectedVendorSubServices({
                vendorId: nextVendor.id,
                selectedSubServiceIds: data.selectedSubServiceIds,
                transaction,
              })
            : []
          : [];

        selectedSubServicesCount = selectedSubServices.length;
        const pricingPlan = nextVendor
          ? await findMatchingPricingPlan({
              vendorId: nextVendor.id,
              selectedSubServicesCount,
              transaction,
            })
          : null;

        pricingPlanId = pricingPlan?.id ?? null;
        agreedPrice =
          typeof data.agreedPrice !== "undefined"
            ? data.agreedPrice
            : (pricingPlan?.price ?? null);

        await syncEventVendorSubServices({
          eventVendorId: eventVendor.id,
          selectedSubServices,
          userId: req.user?.id ?? null,
          transaction,
        });
      }

      if (
        !shouldReplaceSelectedSubServices &&
        typeof data.agreedPrice !== "undefined"
      ) {
        agreedPrice = data.agreedPrice;
      }

      const nextCompanyNameSnapshot =
        typeof data.companyNameSnapshot !== "undefined"
          ? data.companyNameSnapshot
          : nextVendorId !== (eventVendor.vendorId ?? null)
            ? (nextVendor?.name ?? null)
            : eventVendor.companyNameSnapshot;

      await eventVendor.update(
        {
          vendorType: nextVendorType,
          providedBy: nextProvidedBy,
          vendorId: nextVendorId,
          companyNameSnapshot: nextCompanyNameSnapshot,
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
      include: buildEventVendorInclude(),
    });

    return res.json({
      message: req.t("common.updated_successfully"),
      data: sanitizeEventVendorPayload(updated),
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.errors });
    }
    if (err instanceof Error && err.message === "Vendor not found") {
      return res.status(404).json({ message: err.message });
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
