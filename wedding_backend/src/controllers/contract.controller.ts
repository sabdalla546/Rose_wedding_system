import { Request, Response } from "express";
import { Op } from "sequelize";
import { ZodError } from "zod";
import { AuthRequest } from "../middleware/auth.middleware";
import {
  Contract,
  ContractItem,
  PaymentSchedule,
  Quotation,
  QuotationItem,
  Event,
  EventService,
  Service,
  Customer,
  Lead,
  User,
} from "../models";
import {
  createContractSchema,
  updateContractSchema,
  createContractFromQuotationSchema,
  updateContractItemSchema,
  createPaymentScheduleSchema,
  updatePaymentScheduleSchema,
} from "../validation/contract.schemas";

function round3(value: number) {
  return Number(value.toFixed(3));
}

function computeItemTotal(
  quantity: number,
  unitPrice: number,
  totalPrice?: number | null,
) {
  if (typeof totalPrice === "number") return round3(totalPrice);
  return round3(quantity * unitPrice);
}

function computeContractTotals(
  items: Array<{ totalPrice: number }>,
  discountAmount?: number | null,
) {
  const subtotal = round3(
    items.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0),
  );
  const discount = round3(Number(discountAmount || 0));
  const totalAmount = round3(Math.max(0, subtotal - discount));
  return { subtotal, discountAmount: discount, totalAmount };
}

export const createContract = async (req: AuthRequest, res: Response) => {
  try {
    const data = createContractSchema.parse(req.body);

    const event = await Event.findByPk(data.eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (data.quotationId) {
      const quotation = await Quotation.findByPk(data.quotationId);
      if (!quotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }
    }

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

    const preparedItems = data.items.map((item) => ({
      quotationItemId: item.quotationItemId ?? null,
      eventServiceId: item.eventServiceId ?? null,
      serviceId: item.serviceId ?? null,
      itemName: item.itemName,
      category: item.category ?? null,
      quantity: round3(item.quantity),
      unitPrice: round3(item.unitPrice),
      totalPrice: computeItemTotal(
        item.quantity,
        item.unitPrice,
        item.totalPrice,
      ),
      notes: item.notes ?? null,
      sortOrder: item.sortOrder ?? 0,
    }));

    const totals = computeContractTotals(preparedItems, data.discountAmount);

    const contract = await Contract.create({
      quotationId: data.quotationId ?? null,
      eventId: data.eventId,
      customerId: data.customerId ?? event.customerId ?? null,
      //  leadId: data.leadId ?? event.leadId ?? null,
      contractNumber: data.contractNumber ?? null,
      signedDate: data.signedDate,
      eventDate: data.eventDate ?? event.eventDate ?? null,
      subtotal: totals.subtotal,
      discountAmount: totals.discountAmount,
      totalAmount: totals.totalAmount,
      notes: data.notes ?? null,
      status: data.status ?? "draft",
      createdBy: req.user?.id ?? null,
      updatedBy: req.user?.id ?? null,
    });

    await ContractItem.bulkCreate(
      preparedItems.map((item) => ({
        contractId: contract.id,
        ...item,
        createdBy: req.user?.id ?? null,
        updatedBy: req.user?.id ?? null,
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

    const created = await Contract.findByPk(contract.id, {
      include: [
        { model: Quotation, as: "quotation" },
        { model: Event, as: "event" },
        { model: Customer, as: "customer" },
        { model: Lead, as: "lead" },
        {
          model: ContractItem,
          as: "items",
          separate: true,
          order: [
            ["sortOrder", "ASC"],
            ["id", "ASC"],
          ],
        },
        {
          model: PaymentSchedule,
          as: "paymentSchedules",
          separate: true,
          order: [
            ["sortOrder", "ASC"],
            ["id", "ASC"],
          ],
        },
      ],
    });

    return res.status(201).json({
      message: "Contract created successfully",
      data: created,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.errors });
    }
    return res.status(500).json({ message: req.t("common.unexpected_error") });
  }
};

export const createContractFromQuotation = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const data = createContractFromQuotationSchema.parse(req.body);

    const quotation = await Quotation.findByPk(data.quotationId, {
      include: [
        { model: Event, as: "event" },
        {
          model: QuotationItem,
          as: "items",
          separate: true,
          order: [
            ["sortOrder", "ASC"],
            ["id", "ASC"],
          ],
        },
      ],
    });

    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    const existingContract = await Contract.findOne({
      where: { quotationId: quotation.id },
    });

    if (existingContract) {
      return res.status(400).json({
        message: "Contract already exists for this quotation",
      });
    }

    const items = (quotation as any).items as QuotationItem[];
    if (!items?.length) {
      return res.status(400).json({
        message: "Quotation has no items",
      });
    }

    const preparedItems = items.map((item) => ({
      quotationItemId: item.id,
      eventServiceId: item.eventServiceId ?? null,
      serviceId: item.serviceId ?? null,
      itemName: item.itemName,
      category: item.category ?? null,
      quantity: round3(Number(item.quantity)),
      unitPrice: round3(Number(item.unitPrice)),
      totalPrice: round3(Number(item.totalPrice)),
      notes: item.notes ?? null,
      sortOrder: item.sortOrder ?? 0,
    }));
    const quotationEvent = (quotation as any).event;
    const contract = await Contract.create({
      quotationId: quotation.id,
      eventId: quotation.eventId,
      customerId: quotation.customerId ?? null,
      leadId: quotation.leadId ?? null,
      contractNumber: data.contractNumber ?? null,
      signedDate: data.signedDate,
      eventDate: data.eventDate ?? quotationEvent?.eventDate ?? null,
      subtotal: quotation.subtotal ?? null,
      discountAmount: quotation.discountAmount ?? 0,
      totalAmount: quotation.totalAmount ?? null,
      notes: data.notes ?? quotation.notes ?? null,
      status: data.status ?? "active",
      createdBy: req.user?.id ?? null,
      updatedBy: req.user?.id ?? null,
    });

    await ContractItem.bulkCreate(
      preparedItems.map((item) => ({
        contractId: contract.id,
        ...item,
        createdBy: req.user?.id ?? null,
        updatedBy: req.user?.id ?? null,
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

    await quotation.update({
      status: "converted_to_contract",
      updatedBy: req.user?.id ?? null,
    });

    const created = await Contract.findByPk(contract.id, {
      include: [
        { model: Quotation, as: "quotation" },
        { model: Event, as: "event" },
        { model: Customer, as: "customer" },
        { model: Lead, as: "lead" },
        {
          model: ContractItem,
          as: "items",
          separate: true,
          order: [
            ["sortOrder", "ASC"],
            ["id", "ASC"],
          ],
        },
        {
          model: PaymentSchedule,
          as: "paymentSchedules",
          separate: true,
          order: [
            ["sortOrder", "ASC"],
            ["id", "ASC"],
          ],
        },
      ],
    });

    return res.status(201).json({
      message: "Contract created from quotation successfully",
      data: created,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.errors });
    }
    return res.status(500).json({ message: req.t("common.unexpected_error") });
  }
};

export const getContracts = async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const quotationId = Number(req.query.quotationId) || undefined;
  const eventId = Number(req.query.eventId) || undefined;
  const customerId = Number(req.query.customerId) || undefined;
  const leadId = Number(req.query.leadId) || undefined;
  const status = String(req.query.status ?? "").trim();
  const search = String(req.query.search ?? "").trim();
  const signedDateFrom = String(req.query.signedDateFrom ?? "").trim();
  const signedDateTo = String(req.query.signedDateTo ?? "").trim();

  const where: any = {};

  if (quotationId) where.quotationId = quotationId;
  if (eventId) where.eventId = eventId;
  if (customerId) where.customerId = customerId;
  if (leadId) where.leadId = leadId;
  if (status) where.status = status;

  if (search) {
    where[Op.or] = [
      { contractNumber: { [Op.like]: `%${search}%` } },
      { notes: { [Op.like]: `%${search}%` } },
    ];
  }

  if (signedDateFrom || signedDateTo) {
    where.signedDate = {};
    if (signedDateFrom) where.signedDate[Op.gte] = signedDateFrom;
    if (signedDateTo) where.signedDate[Op.lte] = signedDateTo;
  }

  const { count, rows } = await Contract.findAndCountAll({
    where,
    include: [
      { model: Quotation, as: "quotation" },
      { model: Event, as: "event" },
      { model: Customer, as: "customer" },
      { model: Lead, as: "lead" },
      { model: User, as: "createdByUser", attributes: ["id", "fullName"] },
      { model: User, as: "updatedByUser", attributes: ["id", "fullName"] },
    ],
    order: [
      ["signedDate", "DESC"],
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

export const getContractById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ message: req.t("common.invalid_id") });
  }

  const contract = await Contract.findByPk(id, {
    include: [
      { model: Quotation, as: "quotation" },
      { model: Event, as: "event" },
      { model: Customer, as: "customer" },
      { model: Lead, as: "lead" },
      {
        model: ContractItem,
        as: "items",
        separate: true,
        order: [
          ["sortOrder", "ASC"],
          ["id", "ASC"],
        ],
        include: [
          { model: QuotationItem, as: "quotationItem" },
          { model: EventService, as: "eventService" },
          { model: Service, as: "service" },
        ],
      },
      {
        model: PaymentSchedule,
        as: "paymentSchedules",
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

  if (!contract) {
    return res.status(404).json({ message: req.t("common.not_found") });
  }

  return res.json({ data: contract });
};

export const updateContract = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ message: req.t("common.invalid_id") });
    }

    const data = updateContractSchema.parse(req.body);

    const contract = await Contract.findByPk(id);
    if (!contract) {
      return res.status(404).json({ message: req.t("common.not_found") });
    }

    await contract.update({
      quotationId:
        typeof data.quotationId !== "undefined"
          ? data.quotationId
          : contract.quotationId,
      customerId:
        typeof data.customerId !== "undefined"
          ? data.customerId
          : contract.customerId,
      leadId:
        typeof data.leadId !== "undefined" ? data.leadId : contract.leadId,
      contractNumber:
        typeof data.contractNumber !== "undefined"
          ? data.contractNumber
          : contract.contractNumber,
      signedDate: data.signedDate ?? contract.signedDate,
      eventDate:
        typeof data.eventDate !== "undefined"
          ? data.eventDate
          : contract.eventDate,
      discountAmount:
        typeof data.discountAmount !== "undefined"
          ? data.discountAmount
          : contract.discountAmount,
      notes: typeof data.notes !== "undefined" ? data.notes : contract.notes,
      status: data.status ?? contract.status,
      updatedBy: req.user?.id ?? null,
    });

    const items = await ContractItem.findAll({
      where: { contractId: contract.id },
    });

    const totals = computeContractTotals(
      items.map((i) => ({ totalPrice: Number(i.totalPrice) })),
      typeof data.discountAmount !== "undefined"
        ? data.discountAmount
        : Number(contract.discountAmount || 0),
    );

    await contract.update({
      subtotal: totals.subtotal,
      discountAmount: totals.discountAmount,
      totalAmount: totals.totalAmount,
      updatedBy: req.user?.id ?? null,
    });

    const updated = await Contract.findByPk(id, {
      include: [
        { model: Quotation, as: "quotation" },
        { model: Event, as: "event" },
        { model: Customer, as: "customer" },
        { model: Lead, as: "lead" },
        {
          model: ContractItem,
          as: "items",
          separate: true,
          order: [
            ["sortOrder", "ASC"],
            ["id", "ASC"],
          ],
        },
        {
          model: PaymentSchedule,
          as: "paymentSchedules",
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

    const data = updateContractItemSchema.parse(req.body);

    const item = await ContractItem.findByPk(id);
    if (!item) {
      return res.status(404).json({ message: req.t("common.not_found") });
    }

    const quantity =
      typeof data.quantity === "number" ? data.quantity : Number(item.quantity);
    const unitPrice =
      typeof data.unitPrice === "number"
        ? data.unitPrice
        : Number(item.unitPrice);

    await item.update({
      itemName: data.itemName ?? item.itemName,
      category:
        typeof data.category !== "undefined" ? data.category : item.category,
      quantity: round3(quantity),
      unitPrice: round3(unitPrice),
      totalPrice: computeItemTotal(quantity, unitPrice, data.totalPrice),
      notes: typeof data.notes !== "undefined" ? data.notes : item.notes,
      sortOrder:
        typeof data.sortOrder !== "undefined" ? data.sortOrder : item.sortOrder,
      updatedBy: req.user?.id ?? null,
    });

    const contract = await Contract.findByPk(item.contractId);
    if (contract) {
      const items = await ContractItem.findAll({
        where: { contractId: contract.id },
      });

      const totals = computeContractTotals(
        items.map((i) => ({ totalPrice: Number(i.totalPrice) })),
        Number(contract.discountAmount || 0),
      );

      await contract.update({
        subtotal: totals.subtotal,
        totalAmount: totals.totalAmount,
        updatedBy: req.user?.id ?? null,
      });
    }

    const updated = await ContractItem.findByPk(id, {
      include: [
        { model: QuotationItem, as: "quotationItem" },
        { model: EventService, as: "eventService" },
        { model: Service, as: "service" },
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

export const createPaymentSchedule = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const data = createPaymentScheduleSchema.parse(req.body);

    const contract = await Contract.findByPk(data.contractId);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

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
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.errors });
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

    const data = updatePaymentScheduleSchema.parse(req.body);

    const payment = await PaymentSchedule.findByPk(id);
    if (!payment) {
      return res.status(404).json({ message: req.t("common.not_found") });
    }

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
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.errors });
    }
    return res.status(500).json({ message: req.t("common.unexpected_error") });
  }
};

export const deletePaymentSchedule = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ message: req.t("common.invalid_id") });
  }

  const payment = await PaymentSchedule.findByPk(id);
  if (!payment) {
    return res.status(404).json({ message: req.t("common.not_found") });
  }

  await payment.destroy();

  return res.json({ message: req.t("common.deleted_successfully") });
};
