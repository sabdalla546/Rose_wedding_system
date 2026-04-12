import { Transaction } from "sequelize";
import {
  ContractItem,
  EventService,
  EventVendor,
  EventVendorSubService,
  Service,
  Vendor,
  VendorSubService,
} from "../../models";

const MANUAL_SERVICES_SUMMARY_NAME = "إجمالي الخدمات";
const MANUAL_SERVICES_SUMMARY_CATEGORY = "service_summary";

const round3 = (value: number | string | null | undefined) => {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? Number(numeric.toFixed(3)) : 0;
};

const normalizeText = (value?: string | null) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const isManualServiceSummaryItem = (item: {
  itemName?: string | null;
  category?: string | null;
}) => {
  return (
    normalizeText(item.itemName) ===
      normalizeText(MANUAL_SERVICES_SUMMARY_NAME) ||
    normalizeText(item.category) ===
      normalizeText(MANUAL_SERVICES_SUMMARY_CATEGORY)
  );
};

const findMatchingEventService = async ({
  eventId,
  serviceId,
  serviceNameSnapshot,
  transaction,
}: {
  eventId: number;
  serviceId?: number | null;
  serviceNameSnapshot?: string | null;
  transaction?: Transaction;
}) => {
  if (typeof serviceId === "number" && serviceId > 0) {
    const existingByServiceId = await EventService.findOne({
      where: {
        eventId,
        serviceId,
      },
      order: [
        ["sortOrder", "ASC"],
        ["id", "ASC"],
      ],
      transaction,
    });

    if (existingByServiceId) return existingByServiceId;
  }

  const normalizedName = normalizeText(serviceNameSnapshot);
  if (!normalizedName) return null;

  const eventServices = await EventService.findAll({
    where: { eventId },
    order: [
      ["sortOrder", "ASC"],
      ["id", "ASC"],
    ],
    transaction,
  });

  return (
    eventServices.find(
      (row) => normalizeText(row.serviceNameSnapshot) === normalizedName,
    ) ?? null
  );
};

const getNextEventServiceSortOrder = async (
  eventId: number,
  transaction?: Transaction,
) => {
  const lastRow = await EventService.findOne({
    where: { eventId },
    order: [
      ["sortOrder", "DESC"],
      ["id", "DESC"],
    ],
    transaction,
  });

  return typeof lastRow?.sortOrder === "number" ? lastRow.sortOrder + 1 : 0;
};

const getNextEventVendorSubServiceSortOrder = async (
  eventVendorId: number,
  transaction?: Transaction,
) => {
  const lastRow = await EventVendorSubService.findOne({
    where: { eventVendorId },
    order: [
      ["sortOrder", "DESC"],
      ["id", "DESC"],
    ],
    transaction,
  });

  return typeof lastRow?.sortOrder === "number" ? lastRow.sortOrder + 1 : 0;
};

const findMatchingEventVendor = async ({
  eventId,
  vendorId,
  companyNameSnapshot,
  transaction,
}: {
  eventId: number;
  vendorId?: number | null;
  companyNameSnapshot?: string | null;
  transaction?: Transaction;
}) => {
  if (typeof vendorId === "number" && vendorId > 0) {
    const existingByVendor = await EventVendor.findOne({
      where: {
        eventId,
        vendorId,
      },
      order: [["id", "ASC"]],
      transaction,
    });

    if (existingByVendor) return existingByVendor;
  }

  const normalizedName = normalizeText(companyNameSnapshot);
  if (!normalizedName) return null;

  const eventVendors = await EventVendor.findAll({
    where: { eventId },
    order: [["id", "ASC"]],
    transaction,
  });

  return (
    eventVendors.find(
      (row) => normalizeText(row.companyNameSnapshot) === normalizedName,
    ) ?? null
  );
};

const loadVendorSubServicesForEventVendor = async ({
  vendorId,
  vendorType,
  transaction,
}: {
  vendorId?: number | null;
  vendorType?: string | null;
  transaction?: Transaction;
}) => {
  const where: Record<string, unknown> = {
    isActive: true,
  };

  if (typeof vendorId === "number" && vendorId > 0) {
    where.vendorId = vendorId;
  } else if (vendorType) {
    where.vendorType = vendorType;
  } else {
    return [];
  }

  return VendorSubService.findAll({
    where,
    order: [
      ["sortOrder", "ASC"],
      ["id", "ASC"],
    ],
    transaction,
  });
};

const ensureEventVendorSubServices = async ({
  eventVendor,
  vendorId,
  vendorType,
  userId,
  transaction,
}: {
  eventVendor: EventVendor;
  vendorId?: number | null;
  vendorType?: string | null;
  userId: number | null;
  transaction?: Transaction;
}) => {
  const existingSelections = await EventVendorSubService.findAll({
    where: { eventVendorId: eventVendor.id },
    transaction,
  });

  if (existingSelections.length > 0) {
    await eventVendor.update(
      {
        selectedSubServicesCount: existingSelections.length,
        updatedBy: userId,
      },
      { transaction },
    );

    return existingSelections;
  }

  const subServices = await loadVendorSubServicesForEventVendor({
    vendorId,
    vendorType,
    transaction,
  });

  if (subServices.length === 0) {
    await eventVendor.update(
      {
        selectedSubServicesCount: 0,
        updatedBy: userId,
      },
      { transaction },
    );
    return [];
  }

  let nextSortOrder = await getNextEventVendorSubServiceSortOrder(
    eventVendor.id,
    transaction,
  );

  const createdRows = [];

  for (const subService of subServices) {
    const alreadyExists = existingSelections.find((row) => {
      if (
        typeof row.vendorSubServiceId === "number" &&
        typeof subService.id === "number"
      ) {
        return row.vendorSubServiceId === subService.id;
      }

      return normalizeText(row.nameSnapshot) === normalizeText(subService.name);
    });

    if (alreadyExists) {
      continue;
    }

    const created = await EventVendorSubService.create(
      {
        eventVendorId: eventVendor.id,
        vendorSubServiceId: subService.id,
        nameSnapshot: subService.name,
        notes: subService.description ?? null,
        sortOrder: nextSortOrder++,
        createdBy: userId,
        updatedBy: userId,
      },
      { transaction },
    );

    createdRows.push(created);
  }

  const finalCount = existingSelections.length + createdRows.length;

  await eventVendor.update(
    {
      selectedSubServicesCount: finalCount,
      updatedBy: userId,
    },
    { transaction },
  );

  return [...existingSelections, ...createdRows];
};

const ensureEventServiceFromContractItem = async ({
  eventId,
  item,
  userId,
  transaction,
}: {
  eventId: number;
  item: ContractItem;
  userId: number | null;
  transaction?: Transaction;
}) => {
  if (item.itemType !== "service") return null;
  if (isManualServiceSummaryItem(item)) return null;

  if (item.eventServiceId) {
    const existingLinked = await EventService.findOne({
      where: {
        id: item.eventServiceId,
        eventId,
      },
      transaction,
    });

    if (existingLinked) return existingLinked;
  }

  const serviceName = String(item.itemName ?? "").trim();

  if (
    !serviceName &&
    !(typeof item.serviceId === "number" && item.serviceId > 0)
  ) {
    return null;
  }

  const existing = await findMatchingEventService({
    eventId,
    serviceId: item.serviceId ?? null,
    serviceNameSnapshot: item.itemName ?? null,
    transaction,
  });

  if (existing) {
    return existing;
  }

  let category = item.category ?? null;

  if ((!category || String(category).trim() === "") && item.serviceId) {
    const service = await Service.findByPk(item.serviceId, { transaction });
    category = service?.category ?? null;
  }

  const nextSortOrder = await getNextEventServiceSortOrder(
    eventId,
    transaction,
  );

  return EventService.create(
    {
      eventId,
      serviceId:
        typeof item.serviceId === "number" && item.serviceId > 0
          ? item.serviceId
          : null,
      serviceNameSnapshot: item.itemName ?? "Service",
      category: category ?? "general",
      quantity: round3(item.quantity),
      unitPrice: round3(item.unitPrice),
      totalPrice: round3(item.totalPrice),
      notes: item.notes ?? null,
      status: "confirmed",
      sortOrder: nextSortOrder,
      createdBy: userId,
      updatedBy: userId,
    },
    { transaction },
  );
};

const ensureEventVendorFromContractItem = async ({
  eventId,
  item,
  userId,
  transaction,
}: {
  eventId: number;
  item: ContractItem;
  userId: number | null;
  transaction?: Transaction;
}) => {
  if (item.itemType !== "vendor") return null;

  if (item.eventVendorId) {
    const existingLinked = await EventVendor.findOne({
      where: {
        id: item.eventVendorId,
        eventId,
      },
      transaction,
    });

    if (existingLinked) {
      await ensureEventVendorSubServices({
        eventVendor: existingLinked,
        vendorId: existingLinked.vendorId ?? null,
        vendorType: existingLinked.vendorType,
        userId,
        transaction,
      });

      return existingLinked;
    }
  }

  let companyNameSnapshot = item.itemName ?? null;
  let vendorType = item.category ?? null;

  if (item.vendorId) {
    const vendor = await Vendor.findByPk(item.vendorId, { transaction });
    if (vendor) {
      companyNameSnapshot = companyNameSnapshot ?? vendor.name ?? null;
      vendorType = vendorType ?? vendor.type ?? null;
    }
  }

  vendorType = vendorType ?? "external_vendor";

  const existing = await findMatchingEventVendor({
    eventId,
    vendorId: item.vendorId ?? null,
    companyNameSnapshot,
    transaction,
  });

  if (existing) {
    await ensureEventVendorSubServices({
      eventVendor: existing,
      vendorId: existing.vendorId ?? null,
      vendorType: existing.vendorType,
      userId,
      transaction,
    });

    return existing;
  }

  const created = await EventVendor.create(
    {
      eventId,
      vendorType,
      providedBy: "company",
      vendorId:
        typeof item.vendorId === "number" && item.vendorId > 0
          ? item.vendorId
          : null,
      companyNameSnapshot: companyNameSnapshot ?? "Vendor",
      selectedSubServicesCount: 0,
      agreedPrice: round3(item.totalPrice ?? item.unitPrice),
      notes: item.notes ?? null,
      status: "confirmed",
      createdBy: userId,
      updatedBy: userId,
    },
    { transaction },
  );

  await ensureEventVendorSubServices({
    eventVendor: created,
    vendorId: created.vendorId ?? null,
    vendorType: created.vendorType,
    userId,
    transaction,
  });

  return created;
};

export const syncContractItemsToEventOperationalData = async ({
  eventId,
  contractId,
  userId,
  transaction,
}: {
  eventId: number;
  contractId: number;
  userId: number | null;
  transaction?: Transaction;
}) => {
  const contractItems = await ContractItem.findAll({
    where: { contractId },
    order: [
      ["sortOrder", "ASC"],
      ["id", "ASC"],
    ],
    transaction,
  });

  const ensuredEventServices: EventService[] = [];
  const ensuredEventVendors: EventVendor[] = [];

  for (const item of contractItems) {
    if (item.itemType === "service") {
      const ensuredService = await ensureEventServiceFromContractItem({
        eventId,
        item,
        userId,
        transaction,
      });

      if (ensuredService) {
        ensuredEventServices.push(ensuredService);
      }

      continue;
    }

    if (item.itemType === "vendor") {
      const ensuredVendor = await ensureEventVendorFromContractItem({
        eventId,
        item,
        userId,
        transaction,
      });

      if (ensuredVendor) {
        ensuredEventVendors.push(ensuredVendor);
      }
    }
  }

  return {
    ensuredEventServices,
    ensuredEventVendors,
  };
};
