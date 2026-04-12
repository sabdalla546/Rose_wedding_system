import { Request, Response } from "express";
import { Op } from "sequelize";
import { AuthRequest } from "../middleware/auth.middleware";
import type { ContractStatus } from "../models/contract.model";
import type {
  PaymentScheduleStatus,
  PaymentScheduleType,
} from "../models/paymentSchedule.model";
import {
  Contract,
  ContractItem,
  PaymentSchedule,
  Quotation,
  QuotationItem,
  Event,
  EventService,
  EventVendor,
  Vendor,
  Service,
} from "../models";
import { DocumentServiceError } from "../services/documents/document.types";
import { generateContractPdfDocument } from "../services/documents/contract/contractPdf.service";
import {
  assertContractHeaderEditable,
  assertContractStructureEditable,
  assertApprovedQuotationForContract,
  buildVendorSummaryInclude,
  contractItemDetailInclude,
  eventVendorDetailInclude,
  listContractsPage,
  loadContractById,
  recordContractCreatedAction,
  transitionContractToStatus,
} from "../services/contracts/contract.service";
import {
  invalidStatusTransitionError,
  isWorkflowDomainError,
  WorkflowDomainError,
} from "../services/workflow/workflow.errors";

class HttpError extends Error {
  public status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type ContractItemType = "service" | "vendor";

type PreparedContractItem = {
  itemType: ContractItemType;
  quotationItemId: number | null;
  eventServiceId: number | null;
  serviceId: number | null;
  eventVendorId: number | null;
  vendorId: number | null;
  itemName: string;
  category: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes: string | null;
  sortOrder: number;
  createdBy: number | null;
  updatedBy: number | null;
};

type ContractRequestItem = {
  itemType?: ContractItemType;
  quotationItemId?: number | null;
  eventServiceId?: number | null;
  serviceId?: number | null;
  eventVendorId?: number | null;
  vendorId?: number | null;
  itemName: string;
  category?: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
  notes?: string | null;
  sortOrder?: number;
};

type ContractUpdateItem = Partial<ContractRequestItem>;

function round3(value: number) {
  return Number(value.toFixed(3));
}

function toNumberValue(value?: number | string | null) {
  if (value === null || typeof value === "undefined" || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function computeItemTotal(
  quantity: number,
  unitPrice: number,
  totalPrice?: number | null,
) {
  if (typeof totalPrice === "number") {
    return round3(totalPrice);
  }

  return round3(quantity * unitPrice);
}

function computeContractTotals(
  items: Array<{ totalPrice?: number | string | null }>,
  discountAmount?: number | null,
) {
  const subtotal = round3(
    items.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0),
  );
  const discount = round3(Number(discountAmount || 0));
  const totalAmount = round3(Math.max(0, subtotal - discount));

  return {
    subtotal,
    discountAmount: discount,
    totalAmount,
  };
}

async function loadEventServiceForEvent(eventId: number, eventServiceId: number) {
  const eventService = await EventService.findOne({
    where: {
      id: eventServiceId,
      eventId,
    },
  });

  if (!eventService) {
    throw new HttpError(400, "Invalid event service for this event");
  }

  return eventService;
}

async function loadServiceById(serviceId: number) {
  const service = await Service.findByPk(serviceId);

  if (!service) {
    throw new HttpError(400, "Service not found");
  }

  return service;
}

async function loadQuotationItemById(quotationItemId: number) {
  const quotationItem = await QuotationItem.findByPk(quotationItemId);

  if (!quotationItem) {
    throw new HttpError(400, "Quotation item not found");
  }

  return quotationItem;
}

async function loadEventVendorForEvent(eventId: number, eventVendorId: number) {
  const eventVendor = await EventVendor.findOne({
    where: {
      id: eventVendorId,
      eventId,
    },
    include: eventVendorDetailInclude,
  });

  if (!eventVendor) {
    throw new HttpError(400, "Invalid event vendor for this event");
  }

  if (eventVendor.status === "cancelled") {
    throw new HttpError(400, "Cancelled event vendor cannot be used");
  }

  return eventVendor;
}

async function loadVendorById(vendorId: number) {
  const vendor = await Vendor.findByPk(vendorId);

  if (!vendor) {
    throw new HttpError(400, "Vendor not found");
  }

  if (vendor.isActive === false) {
    throw new HttpError(400, "Inactive vendor cannot be used");
  }

  return vendor;
}

async function prepareContractItem(
  item: ContractRequestItem,
  eventId: number,
  userId: number | null,
  fallbackSortOrder: number,
): Promise<PreparedContractItem> {
  const itemType = item.itemType ?? "service";
  const sortOrder =
    typeof item.sortOrder === "number" ? item.sortOrder : fallbackSortOrder;

  if (item.quotationItemId) {
    await loadQuotationItemById(item.quotationItemId);
  }

  const quantity = round3(item.quantity);
  const unitPrice = round3(item.unitPrice);

  if (itemType === "vendor") {
    if (item.eventVendorId) {
      const eventVendor = await loadEventVendorForEvent(eventId, item.eventVendorId);

      if (
        typeof item.vendorId !== "undefined"
        && item.vendorId !== null
        && item.vendorId !== (eventVendor.vendorId ?? null)
      ) {
        throw new HttpError(400, "vendorId must match the selected event vendor");
      }

      return {
        itemType: "vendor",
        quotationItemId: item.quotationItemId ?? null,
        eventServiceId: null,
        serviceId: null,
        eventVendorId: eventVendor.id,
        vendorId: eventVendor.vendorId ?? null,
        itemName: item.itemName,
        category: item.category ?? eventVendor.vendorType ?? null,
        quantity,
        unitPrice,
        totalPrice: computeItemTotal(quantity, unitPrice, item.totalPrice),
        notes: item.notes ?? null,
        sortOrder,
        createdBy: userId,
        updatedBy: userId,
      };
    }

    if (!item.vendorId) {
      throw new HttpError(
        400,
        "vendorId is required for vendor contract items when eventVendorId is not provided",
      );
    }

    const vendor = await loadVendorById(item.vendorId);

    return {
      itemType: "vendor",
      quotationItemId: item.quotationItemId ?? null,
      eventServiceId: null,
      serviceId: null,
      eventVendorId: null,
      vendorId: vendor.id,
      itemName: item.itemName,
      category: item.category ?? vendor.type ?? null,
      quantity,
      unitPrice,
      totalPrice: computeItemTotal(quantity, unitPrice, item.totalPrice),
      notes: item.notes ?? null,
      sortOrder,
      createdBy: userId,
      updatedBy: userId,
    };
  }

  if (item.eventServiceId) {
    await loadEventServiceForEvent(eventId, item.eventServiceId);
  }

  if (item.serviceId) {
    await loadServiceById(item.serviceId);
  }

  return {
    itemType: "service",
    quotationItemId: item.quotationItemId ?? null,
    eventServiceId: item.eventServiceId ?? null,
    serviceId: item.serviceId ?? null,
    eventVendorId: null,
    vendorId: null,
    itemName: item.itemName,
    category: item.category ?? null,
    quantity,
    unitPrice,
    totalPrice: computeItemTotal(quantity, unitPrice, item.totalPrice),
    notes: item.notes ?? null,
    sortOrder,
    createdBy: userId,
    updatedBy: userId,
  };
}

async function recomputeContractHeader(
  contract: Contract,
  userId: number | null,
  discountAmount?: number | null,
) {
  const items = await ContractItem.findAll({
    where: { contractId: contract.id },
  });

  const totals = computeContractTotals(
    items.map((item) => ({ totalPrice: item.totalPrice })),
    typeof discountAmount !== "undefined"
      ? discountAmount
      : Number(contract.discountAmount || 0),
  );

  await contract.update({
    subtotal: totals.subtotal,
    discountAmount: totals.discountAmount,
    totalAmount: totals.totalAmount,
    updatedBy: userId,
  });

  return totals;
}

export const createContract = async (req: AuthRequest, res: Response) => {
  try {
    const data = req.body as {
      quotationId?: number | null;
      eventId: number;
      contractNumber?: string | null;
      signedDate: string;
      eventDate?: string | null;
      discountAmount?: number | null;
      notes?: string | null;
      status?: ContractStatus | null;
      items: ContractRequestItem[];
      paymentSchedules?: Array<{
        installmentName: string;
        scheduleType: PaymentScheduleType;
        dueDate?: string | null;
        amount: number;
        status?: PaymentScheduleStatus | null;
        notes?: string | null;
        sortOrder?: number;
      }>;
    };

    if (!data.quotationId) {
      throw new WorkflowDomainError("Only approved quotation can create contract");
    }

    const quotation = await assertApprovedQuotationForContract(data.quotationId);
    const event = await Event.findByPk(quotation.eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (data.eventId !== quotation.eventId) {
      throw new WorkflowDomainError("Quotation does not belong to event");
    }

    const preparedItems = await Promise.all(
      data.items.map((item, index) =>
        prepareContractItem(
          item as ContractRequestItem,
          data.eventId,
          req.user?.id ?? null,
          index,
        ),
      ),
    );

    const totals = computeContractTotals(preparedItems, data.discountAmount);

    const requestedStatus = data.status ?? "draft";

    const contract = await Contract.create({
      quotationId: quotation.id,
      eventId: quotation.eventId,
      customerId: quotation.customerId ?? event.customerId ?? null,
      contractNumber: data.contractNumber ?? null,
      signedDate: data.signedDate,
      eventDate: data.eventDate ?? event.eventDate ?? null,
      subtotal: totals.subtotal,
      discountAmount: totals.discountAmount,
      totalAmount: totals.totalAmount,
      notes: data.notes ?? null,
      status: "draft",
      createdBy: req.user?.id ?? null,
      updatedBy: req.user?.id ?? null,
    });

    await ContractItem.bulkCreate(
      preparedItems.map((item) => ({
        contractId: contract.id,
        ...item,
      })),
    );

    if (data.paymentSchedules?.length) {
      await PaymentSchedule.bulkCreate(
        data.paymentSchedules.map((row) => ({
          contractId: contract.id,
          installmentName: row.installmentName,
          scheduleType: row.scheduleType,
          dueDate: row.dueDate ?? null,
          amount: round3(row.amount),
          status: row.status ?? "pending",
          notes: row.notes ?? null,
          sortOrder: row.sortOrder ?? 0,
          createdBy: req.user?.id ?? null,
          updatedBy: req.user?.id ?? null,
        })),
      );
    }

    recordContractCreatedAction({
      contract,
      userId: req.user?.id ?? null,
      itemCount: preparedItems.length,
      paymentScheduleCount: data.paymentSchedules?.length ?? 0,
      sourceMode: "manual",
    });

    if (requestedStatus !== "draft") {
      await transitionContractToStatus({
        contract,
        targetStatus: requestedStatus,
        userId: req.user?.id ?? null,
        note: data.notes,
      });
    }

    const created = await loadContractById(contract.id);

    return res.status(201).json({
      message: "Contract created successfully",
      data: created,
    });
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ message: err.message });
    }

    if (isWorkflowDomainError(err)) {
      return res.status(err.statusCode).json({ message: err.message });
    }

    return res.status(500).json({ message: req.t("common.unexpected_error") });
  }
};

export const createContractFromQuotation = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const data = req.body as {
      quotationId: number;
      contractNumber?: string | null;
      signedDate: string;
      eventDate?: string | null;
      discountAmount?: number | null;
      notes?: string | null;
      status?: ContractStatus | null;
      paymentSchedules?: Array<{
        installmentName: string;
        scheduleType: PaymentScheduleType;
        dueDate?: string | null;
        amount: number;
        status?: PaymentScheduleStatus | null;
        notes?: string | null;
        sortOrder?: number;
      }>;
    };

    const quotation = await assertApprovedQuotationForContract(data.quotationId);

    const items = (quotation as any).items as QuotationItem[];
    if (!items?.length) {
      return res.status(400).json({
        message: "Quotation has no items",
      });
    }

    const preparedItems: PreparedContractItem[] = items.map((item) => {
      const quantity = round3(toNumberValue(item.quantity) ?? 1);
      const unitPrice = round3(toNumberValue(item.unitPrice) ?? 0);

      return {
        itemType: item.itemType,
        quotationItemId: item.id,
        eventServiceId: item.eventServiceId ?? null,
        serviceId: item.serviceId ?? null,
        eventVendorId: item.eventVendorId ?? null,
        vendorId: item.vendorId ?? null,
        itemName: item.itemName,
        category: item.category ?? null,
        quantity,
        unitPrice,
        totalPrice: computeItemTotal(
          quantity,
          unitPrice,
          toNumberValue(item.totalPrice),
        ),
        notes: item.notes ?? null,
        sortOrder: item.sortOrder ?? 0,
        createdBy: req.user?.id ?? null,
        updatedBy: req.user?.id ?? null,
      };
    });

    const quotationEvent = (quotation as any).event as Event | undefined;
    const totals = computeContractTotals(
      preparedItems,
      typeof data.discountAmount !== "undefined"
        ? data.discountAmount
        : Number(quotation.discountAmount || 0),
    );

    const requestedStatus = data.status ?? "active";

    const contract = await Contract.create({
      quotationId: quotation.id,
      eventId: quotation.eventId,
      customerId: quotation.customerId ?? null,
      contractNumber: data.contractNumber ?? null,
      signedDate: data.signedDate,
      eventDate: data.eventDate ?? quotationEvent?.eventDate ?? null,
      subtotal: totals.subtotal,
      discountAmount: totals.discountAmount,
      totalAmount: totals.totalAmount,
      notes: data.notes ?? quotation.notes ?? null,
      status: "draft",
      createdBy: req.user?.id ?? null,
      updatedBy: req.user?.id ?? null,
    });

    await ContractItem.bulkCreate(
      preparedItems.map((item) => ({
        contractId: contract.id,
        ...item,
      })),
    );

    if (data.paymentSchedules?.length) {
      await PaymentSchedule.bulkCreate(
        data.paymentSchedules.map((row) => ({
          contractId: contract.id,
          installmentName: row.installmentName,
          scheduleType: row.scheduleType,
          dueDate: row.dueDate ?? null,
          amount: round3(row.amount),
          status: row.status ?? "pending",
          notes: row.notes ?? null,
          sortOrder: row.sortOrder ?? 0,
          createdBy: req.user?.id ?? null,
          updatedBy: req.user?.id ?? null,
        })),
      );
    }

    recordContractCreatedAction({
      contract,
      userId: req.user?.id ?? null,
      itemCount: preparedItems.length,
      paymentScheduleCount: data.paymentSchedules?.length ?? 0,
      sourceMode: "quotation_snapshot",
    });

    if (requestedStatus !== "draft") {
      await transitionContractToStatus({
        contract,
        targetStatus: requestedStatus,
        userId: req.user?.id ?? null,
        note: data.notes ?? quotation.notes ?? null,
      });
    }

    const created = await loadContractById(contract.id);

    return res.status(201).json({
      message: "Contract created from quotation successfully",
      data: created,
    });
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ message: err.message });
    }

    if (isWorkflowDomainError(err)) {
      return res.status(err.statusCode).json({ message: err.message });
    }

    return res.status(500).json({ message: req.t("common.unexpected_error") });
  }
};

export const getContracts = async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;

  const quotationId = Number(req.query.quotationId) || undefined;
  const eventId = Number(req.query.eventId) || undefined;
  const status = String(req.query.status ?? "").trim();
  const search = String(req.query.search ?? "").trim();
  const signedDateFrom = String(req.query.signedDateFrom ?? "").trim();
  const signedDateTo = String(req.query.signedDateTo ?? "").trim();

  const { count, rows } = await listContractsPage({
    page,
    limit,
    quotationId,
    eventId,
    status,
    search,
    signedDateFrom,
    signedDateTo,
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

export const getContractById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ message: req.t("common.invalid_id") });
  }

  const contract = await loadContractById(id);

  if (!contract) {
    return res.status(404).json({ message: req.t("common.not_found") });
  }

  return res.json({ data: contract });
};

export const downloadContractPdf = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ message: req.t("common.invalid_id") });
    }

    const document = await generateContractPdfDocument(id);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${document.filename}"`,
    );
    res.setHeader("Content-Length", String(document.buffer.length));

    return res.send(document.buffer);
  } catch (err) {
    if (err instanceof DocumentServiceError) {
      return res.status(err.status).json({ message: err.message });
    }

    return res.status(500).json({ message: req.t("common.unexpected_error") });
  }
};

export const updateContract = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ message: req.t("common.invalid_id") });
    }

    const data = req.body;

    const contract = await Contract.findByPk(id);
    if (!contract) {
      return res.status(404).json({ message: req.t("common.not_found") });
    }

    if (typeof data.quotationId !== "undefined") {
      if (!data.quotationId) {
        throw invalidStatusTransitionError();
      }

      const quotation = await assertApprovedQuotationForContract(
        data.quotationId,
        contract.id,
      );

      if (quotation.eventId !== contract.eventId) {
        throw new WorkflowDomainError("Quotation does not belong to event");
      }
    }

    assertContractHeaderEditable(contract, {
      quotationId: data.quotationId,
      contractNumber: data.contractNumber,
      signedDate: data.signedDate,
      eventDate: data.eventDate,
      discountAmount: data.discountAmount,
      notes: data.notes,
    }, {
      userId: req.user?.id ?? null,
      attemptedFields: Object.keys(data),
    });

    const items = await ContractItem.findAll({
      where: { contractId: contract.id },
    });

    const totals = computeContractTotals(
      items.map((item) => ({ totalPrice: item.totalPrice })),
      typeof data.discountAmount !== "undefined"
        ? data.discountAmount
        : Number(contract.discountAmount || 0),
    );

    await contract.update({
      quotationId:
        typeof data.quotationId !== "undefined"
          ? data.quotationId
          : contract.quotationId,
      contractNumber:
        typeof data.contractNumber !== "undefined"
          ? data.contractNumber
          : contract.contractNumber,
      signedDate: data.signedDate ?? contract.signedDate,
      eventDate:
        typeof data.eventDate !== "undefined"
          ? data.eventDate
          : contract.eventDate,
      subtotal: totals.subtotal,
      discountAmount: totals.discountAmount,
      totalAmount: totals.totalAmount,
      notes: typeof data.notes !== "undefined" ? data.notes : contract.notes,
      updatedBy: req.user?.id ?? null,
    });

    const nextStatus = data.status ?? contract.status;
    if (nextStatus !== contract.status) {
      await transitionContractToStatus({
        contract,
        targetStatus: nextStatus,
        userId: req.user?.id ?? null,
        note: typeof data.notes === "string" ? data.notes : undefined,
      });
    }

    const updated = await loadContractById(id);

    return res.json({
      message: req.t("common.updated_successfully"),
      data: updated,
    });
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ message: err.message });
    }

    if (isWorkflowDomainError(err)) {
      return res.status(err.statusCode).json({ message: err.message });
    }

    return res.status(500).json({ message: req.t("common.unexpected_error") });
  }
};

export const deleteContract = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ message: req.t("common.invalid_id") });
  }

  const contract = await Contract.findByPk(id);
  if (!contract) {
    return res.status(404).json({ message: req.t("common.not_found") });
  }

  await contract.destroy();

  return res.json({ message: req.t("common.deleted_successfully") });
};

export const updateContractItem = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ message: req.t("common.invalid_id") });
    }

    const data = req.body as ContractUpdateItem;

    const item = await ContractItem.findByPk(id);
    if (!item) {
      return res.status(404).json({ message: req.t("common.not_found") });
    }

    const contract = await Contract.findByPk(item.contractId);
    if (!contract) {
      return res.status(404).json({ message: req.t("common.not_found") });
    }

    assertContractStructureEditable(contract, {
      userId: req.user?.id ?? null,
      area: "contract_items",
    });

    if (typeof data.quotationItemId !== "undefined" && data.quotationItemId) {
      await loadQuotationItemById(data.quotationItemId);
    }

    const nextItemType = data.itemType ?? item.itemType;

    if (nextItemType === "vendor") {
      const nextEventVendorId =
        typeof data.eventVendorId !== "undefined"
          ? data.eventVendorId
          : item.eventVendorId;
      const nextVendorId =
        typeof data.vendorId !== "undefined" ? data.vendorId : item.vendorId;

      const quantity =
        typeof data.quantity === "number"
          ? round3(data.quantity)
          : round3(Number(item.quantity || 1));
      const unitPrice =
        typeof data.unitPrice === "number"
          ? round3(data.unitPrice)
          : round3(Number(item.unitPrice || 0));

      if (nextEventVendorId) {
        const eventVendor = await loadEventVendorForEvent(
          contract.eventId,
          nextEventVendorId,
        );

        if (
          typeof data.vendorId !== "undefined"
          && data.vendorId !== null
          && data.vendorId !== (eventVendor.vendorId ?? null)
        ) {
          throw new HttpError(400, "vendorId must match the selected event vendor");
        }

        await item.update({
          itemType: "vendor",
          quotationItemId:
            typeof data.quotationItemId !== "undefined"
              ? data.quotationItemId
              : item.quotationItemId,
          eventServiceId: null,
          serviceId: null,
          eventVendorId: eventVendor.id,
          vendorId: eventVendor.vendorId ?? null,
          itemName: data.itemName ?? item.itemName,
          category:
            typeof data.category !== "undefined" ? data.category : item.category,
          quantity,
          unitPrice,
          totalPrice: computeItemTotal(quantity, unitPrice, data.totalPrice),
          notes: typeof data.notes !== "undefined" ? data.notes : item.notes,
          sortOrder:
            typeof data.sortOrder !== "undefined"
              ? data.sortOrder
              : item.sortOrder,
          updatedBy: req.user?.id ?? null,
        });
      } else {
        if (!nextVendorId) {
          throw new HttpError(
            400,
            "vendorId is required for vendor contract items when eventVendorId is not provided",
          );
        }

        const vendor = await loadVendorById(nextVendorId);
        await item.update({
          itemType: "vendor",
          quotationItemId:
            typeof data.quotationItemId !== "undefined"
              ? data.quotationItemId
              : item.quotationItemId,
          eventServiceId: null,
          serviceId: null,
          eventVendorId: null,
          vendorId: vendor.id,
          itemName: data.itemName ?? item.itemName,
          category:
            typeof data.category !== "undefined"
              ? data.category
              : (item.category ?? vendor.type),
          quantity,
          unitPrice,
          totalPrice: computeItemTotal(quantity, unitPrice, data.totalPrice),
          notes: typeof data.notes !== "undefined" ? data.notes : item.notes,
          sortOrder:
            typeof data.sortOrder !== "undefined"
              ? data.sortOrder
              : item.sortOrder,
          updatedBy: req.user?.id ?? null,
        });
      }
    } else {
      if (typeof data.eventServiceId !== "undefined" && data.eventServiceId) {
        await loadEventServiceForEvent(contract.eventId, data.eventServiceId);
      }

      if (typeof data.serviceId !== "undefined" && data.serviceId) {
        await loadServiceById(data.serviceId);
      }

      const quantity =
        typeof data.quantity === "number"
          ? round3(data.quantity)
          : round3(Number(item.quantity || 1));
      const unitPrice =
        typeof data.unitPrice === "number"
          ? round3(data.unitPrice)
          : round3(Number(item.unitPrice || 0));

      await item.update({
        itemType: "service",
        quotationItemId:
          typeof data.quotationItemId !== "undefined"
            ? data.quotationItemId
            : item.quotationItemId,
        eventServiceId:
          typeof data.eventServiceId !== "undefined"
            ? data.eventServiceId
            : item.eventServiceId,
        serviceId:
          typeof data.serviceId !== "undefined" ? data.serviceId : item.serviceId,
        eventVendorId: null,
        vendorId: null,
        itemName: data.itemName ?? item.itemName,
        category:
          typeof data.category !== "undefined" ? data.category : item.category,
        quantity,
        unitPrice,
        totalPrice: computeItemTotal(quantity, unitPrice, data.totalPrice),
        notes: typeof data.notes !== "undefined" ? data.notes : item.notes,
        sortOrder:
          typeof data.sortOrder !== "undefined" ? data.sortOrder : item.sortOrder,
        updatedBy: req.user?.id ?? null,
      });
    }

    await recomputeContractHeader(
      contract,
      req.user?.id ?? null,
      Number(contract.discountAmount || 0),
    );

    const updated = await ContractItem.findByPk(id, {
      include: contractItemDetailInclude,
    });

    return res.json({
      message: req.t("common.updated_successfully"),
      data: updated,
    });
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ message: err.message });
    }

    if (isWorkflowDomainError(err)) {
      return res.status(err.statusCode).json({ message: err.message });
    }

    return res.status(500).json({ message: req.t("common.unexpected_error") });
  }
};

export const createPaymentSchedule = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const data = req.body;

    const contract = await Contract.findByPk(data.contractId);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    assertContractStructureEditable(contract, {
      userId: req.user?.id ?? null,
      area: "payment_schedules",
    });

    const payment = await PaymentSchedule.create({
      contractId: data.contractId,
      installmentName: data.installmentName,
      scheduleType: data.scheduleType,
      dueDate: data.dueDate ?? null,
      amount: round3(data.amount),
      status: data.status ?? "pending",
      notes: data.notes ?? null,
      sortOrder: data.sortOrder ?? 0,
      createdBy: req.user?.id ?? null,
      updatedBy: req.user?.id ?? null,
    });

    return res.status(201).json({
      message: "Payment schedule created successfully",
      data: payment,
    });
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ message: err.message });
    }

    if (isWorkflowDomainError(err)) {
      return res.status(err.statusCode).json({ message: err.message });
    }

    return res.status(500).json({ message: req.t("common.unexpected_error") });
  }
};

export const updatePaymentSchedule = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ message: req.t("common.invalid_id") });
    }

    const data = req.body;

    const payment = await PaymentSchedule.findByPk(id);
    if (!payment) {
      return res.status(404).json({ message: req.t("common.not_found") });
    }

    const contract = await Contract.findByPk(payment.contractId);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    assertContractStructureEditable(contract, {
      userId: req.user?.id ?? null,
      area: "payment_schedules",
    });

    await payment.update({
      installmentName: data.installmentName ?? payment.installmentName,
      scheduleType: data.scheduleType ?? payment.scheduleType,
      dueDate:
        typeof data.dueDate !== "undefined" ? data.dueDate : payment.dueDate,
      amount:
        typeof data.amount === "number" ? round3(data.amount) : payment.amount,
      status: data.status ?? payment.status,
      notes: typeof data.notes !== "undefined" ? data.notes : payment.notes,
      sortOrder:
        typeof data.sortOrder !== "undefined"
          ? data.sortOrder
          : payment.sortOrder,
      updatedBy: req.user?.id ?? null,
    });

    return res.json({
      message: req.t("common.updated_successfully"),
      data: payment,
    });
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ message: err.message });
    }

    if (isWorkflowDomainError(err)) {
      return res.status(err.statusCode).json({ message: err.message });
    }

    return res.status(500).json({ message: req.t("common.unexpected_error") });
  }
};

export const deletePaymentSchedule = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ message: req.t("common.invalid_id") });
    }

    const payment = await PaymentSchedule.findByPk(id);
    if (!payment) {
      return res.status(404).json({ message: req.t("common.not_found") });
    }

    const contract = await Contract.findByPk(payment.contractId);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    assertContractStructureEditable(contract, {
      userId: null,
      area: "payment_schedules",
    });

    await payment.destroy();

    return res.json({ message: req.t("common.deleted_successfully") });
  } catch (err) {
    if (isWorkflowDomainError(err)) {
      return res.status(err.statusCode).json({ message: err.message });
    }

    return res.status(500).json({ message: req.t("common.unexpected_error") });
  }
};
