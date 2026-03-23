import { Request, Response } from "express";
import { Op } from "sequelize";
import { ZodError } from "zod";

import { sequelize } from "../config/database";
import { AuthRequest } from "../middleware/auth.middleware";
import { Appointment, Customer, Venue, User } from "../models";
import {
  createAppointmentSchema,
  createAppointmentWithCustomerSchema,
  updateAppointmentSchema,
} from "../validation/appointment.schemas";
import {
  cancelAppointmentSchema,
  completeAppointmentSchema,
  confirmAppointmentSchema,
  rescheduleAppointmentSchema,
} from "../validation/appointment-action.schemas";

const appointmentInclude = [
  {
    model: Customer,
    as: "customer",
    include: [{ model: Venue, as: "venue" }],
  },
  {
    model: User,
    as: "assignedToUser",
    attributes: ["id", "fullName", "email"],
  },
  { model: User, as: "createdByUser", attributes: ["id", "fullName"] },
  { model: User, as: "updatedByUser", attributes: ["id", "fullName"] },
];

export const createAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const data = createAppointmentSchema.parse(req.body);

    const customer = await Customer.findByPk(data.customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    if (data.assignedToUserId) {
      const assignedUser = await User.findByPk(data.assignedToUserId);
      if (!assignedUser) {
        return res.status(404).json({ message: "Assigned user not found" });
      }
    }

    const appointment = await Appointment.create({
      customerId: data.customerId,
      appointmentDate: data.appointmentDate,
      appointmentStartTime: data.appointmentStartTime,
      appointmentEndTime: data.appointmentEndTime ?? null,
      status: data.status ?? "scheduled",
      meetingType: data.meetingType ?? "office_visit",
      assignedToUserId: data.assignedToUserId ?? null,
      notes: data.notes ?? null,
      result: data.result ?? null,
      nextStep: data.nextStep ?? null,
      createdBy: req.user?.id ?? null,
      updatedBy: req.user?.id ?? null,
    });

    const created = await Appointment.findByPk(appointment.id, {
      include: appointmentInclude,
    });

    return res.status(201).json({
      message: "Appointment created successfully",
      data: created,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.errors });
    }

    return res.status(500).json({ message: req.t("common.unexpected_error") });
  }
};

export const createAppointmentWithCustomer = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const data = createAppointmentWithCustomerSchema.parse(req.body);

    if (data.appointment.assignedToUserId) {
      const assignedUser = await User.findByPk(data.appointment.assignedToUserId);
      if (!assignedUser) {
        return res.status(404).json({ message: "Assigned user not found" });
      }
    }

    const transaction = await sequelize.transaction();

    try {
      let customer: Customer | null = null;

      if (data.customerId) {
        customer = await Customer.findByPk(data.customerId, { transaction });
        if (!customer) {
          await transaction.rollback();
          return res.status(404).json({ message: "Customer not found" });
        }
      } else if (data.customer) {
        const mobile = data.customer.mobile.trim();
        customer = await Customer.findOne({
          where: { mobile },
          transaction,
        });

        if (!customer) {
          if (data.customer.venueId) {
            const venue = await Venue.findByPk(data.customer.venueId, {
              transaction,
            });
            if (!venue) {
              await transaction.rollback();
              return res.status(404).json({ message: "Venue not found" });
            }
          }

          customer = await Customer.create(
            {
              fullName: data.customer.fullName.trim(),
              mobile,
              mobile2: data.customer.mobile2?.trim() || null,
              email: data.customer.email?.trim() || null,
              groomName: data.customer.groomName?.trim() || null,
              brideName: data.customer.brideName?.trim() || null,
              weddingDate: data.customer.weddingDate ?? null,
              guestCount: data.customer.guestCount ?? null,
              venueId: data.customer.venueId ?? null,
              notes: data.customer.notes ?? null,
              status: "active",
              createdBy: req.user?.id ?? null,
              updatedBy: req.user?.id ?? null,
            },
            { transaction },
          );
        }
      }

      if (!customer) {
        await transaction.rollback();
        return res
          .status(400)
          .json({ message: "Either customerId or customer is required" });
      }

      const appointment = await Appointment.create(
        {
          customerId: customer.id,
          appointmentDate: data.appointment.appointmentDate,
          appointmentStartTime: data.appointment.appointmentStartTime,
          appointmentEndTime: data.appointment.appointmentEndTime ?? null,
          status: "scheduled",
          meetingType: data.appointment.meetingType ?? "office_visit",
          assignedToUserId: data.appointment.assignedToUserId ?? null,
          notes: data.appointment.notes ?? null,
          result: data.appointment.result ?? null,
          nextStep: data.appointment.nextStep ?? null,
          createdBy: req.user?.id ?? null,
          updatedBy: req.user?.id ?? null,
        },
        { transaction },
      );

      await transaction.commit();

      const created = await Appointment.findByPk(appointment.id, {
        include: appointmentInclude,
      });

      return res.status(201).json({
        message: "Appointment created successfully",
        data: created,
      });
    } catch (transactionError) {
      await transaction.rollback();
      throw transactionError;
    }
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.errors });
    }

    return res.status(500).json({ message: req.t("common.unexpected_error") });
  }
};

export const getAppointments = async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const status = String(req.query.status ?? "").trim();
  const customerId = Number(req.query.customerId) || undefined;
  const venueId = Number(req.query.venueId) || undefined;
  const assignedToUserId = Number(req.query.assignedToUserId) || undefined;
  const dateFrom = String(req.query.dateFrom ?? "").trim();
  const dateTo = String(req.query.dateTo ?? "").trim();

  const where: any = {};
  const customerWhere: any = {};

  if (status) where.status = status;
  if (customerId) where.customerId = customerId;
  if (assignedToUserId) where.assignedToUserId = assignedToUserId;

  if (dateFrom || dateTo) {
    where.appointmentDate = {};
    if (dateFrom) where.appointmentDate[Op.gte] = dateFrom;
    if (dateTo) where.appointmentDate[Op.lte] = dateTo;
  }

  if (venueId) {
    customerWhere.venueId = venueId;
  }

  const { count, rows } = await Appointment.findAndCountAll({
    where,
    include: [
      {
        model: Customer,
        as: "customer",
        where: Object.keys(customerWhere).length ? customerWhere : undefined,
        include: [{ model: Venue, as: "venue" }],
      },
      {
        model: User,
        as: "assignedToUser",
        attributes: ["id", "fullName", "email"],
      },
      { model: User, as: "createdByUser", attributes: ["id", "fullName"] },
      { model: User, as: "updatedByUser", attributes: ["id", "fullName"] },
    ],
    order: [
      ["appointmentDate", "ASC"],
      ["appointmentStartTime", "ASC"],
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

export const getAppointmentById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ message: req.t("common.invalid_id") });
  }

  const appointment = await Appointment.findByPk(id, {
    include: appointmentInclude,
  });

  if (!appointment) {
    return res.status(404).json({ message: req.t("common.not_found") });
  }

  return res.json({ data: appointment });
};

export const confirmAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ message: req.t("common.invalid_id") });
    }

    const data = confirmAppointmentSchema.parse(req.body);

    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({ message: req.t("common.not_found") });
    }

    if (["completed", "cancelled"].includes(appointment.status)) {
      return res.status(400).json({
        message: "Only scheduled or rescheduled appointments can be confirmed",
      });
    }

    await appointment.update({
      status: "confirmed",
      notes: typeof data.notes !== "undefined" ? data.notes : appointment.notes,
      updatedBy: req.user?.id ?? null,
    });

    const updated = await Appointment.findByPk(id, {
      include: appointmentInclude,
    });

    return res.json({
      message: "Appointment confirmed successfully",
      data: updated,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.errors });
    }

    return res.status(500).json({ message: req.t("common.unexpected_error") });
  }
};

export const completeAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ message: req.t("common.invalid_id") });
    }

    const data = completeAppointmentSchema.parse(req.body);

    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({ message: req.t("common.not_found") });
    }

    if (appointment.status === "cancelled") {
      return res.status(400).json({
        message: "Cancelled appointment cannot be completed",
      });
    }

    await appointment.update({
      status: "completed",
      result:
        typeof data.result !== "undefined" ? data.result : appointment.result,
      notes: typeof data.notes !== "undefined" ? data.notes : appointment.notes,
      nextStep:
        typeof data.nextStep !== "undefined"
          ? data.nextStep
          : appointment.nextStep,
      updatedBy: req.user?.id ?? null,
    });

    const updated = await Appointment.findByPk(id, {
      include: appointmentInclude,
    });

    return res.json({
      message: "Appointment completed successfully",
      data: updated,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.errors });
    }

    return res.status(500).json({ message: req.t("common.unexpected_error") });
  }
};

export const cancelAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ message: req.t("common.invalid_id") });
    }

    const data = cancelAppointmentSchema.parse(req.body);

    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({ message: req.t("common.not_found") });
    }

    if (appointment.status === "completed") {
      return res.status(400).json({
        message: "Completed appointment cannot be cancelled",
      });
    }

    const mergedNote = [data.reason, data.notes].filter(Boolean).join(" | ");

    await appointment.update({
      status: "cancelled",
      notes: mergedNote || appointment.notes,
      updatedBy: req.user?.id ?? null,
    });

    const updated = await Appointment.findByPk(id, {
      include: appointmentInclude,
    });

    return res.json({
      message: "Appointment cancelled successfully",
      data: updated,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.errors });
    }

    return res.status(500).json({ message: req.t("common.unexpected_error") });
  }
};

export const rescheduleAppointment = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ message: req.t("common.invalid_id") });
    }

    const data = rescheduleAppointmentSchema.parse(req.body);

    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({ message: req.t("common.not_found") });
    }

    if (appointment.status === "completed") {
      return res.status(400).json({
        message: "Completed appointment cannot be rescheduled",
      });
    }

    if (
      typeof data.assignedToUserId !== "undefined" &&
      data.assignedToUserId !== null
    ) {
      const assignedUser = await User.findByPk(data.assignedToUserId);
      if (!assignedUser) {
        return res.status(404).json({ message: "Assigned user not found" });
      }
    }

    await appointment.update({
      appointmentDate: data.appointmentDate,
      appointmentStartTime: data.appointmentStartTime,
      appointmentEndTime:
        typeof data.appointmentEndTime !== "undefined"
          ? data.appointmentEndTime
          : appointment.appointmentEndTime,
      assignedToUserId:
        typeof data.assignedToUserId !== "undefined"
          ? data.assignedToUserId
          : appointment.assignedToUserId,
      notes: typeof data.notes !== "undefined" ? data.notes : appointment.notes,
      nextStep:
        typeof data.nextStep !== "undefined"
          ? data.nextStep
          : appointment.nextStep,
      status: "rescheduled",
      updatedBy: req.user?.id ?? null,
    });

    const updated = await Appointment.findByPk(id, {
      include: appointmentInclude,
    });

    return res.json({
      message: "Appointment rescheduled successfully",
      data: updated,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.errors });
    }

    return res.status(500).json({ message: req.t("common.unexpected_error") });
  }
};

export const updateAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ message: req.t("common.invalid_id") });
    }

    const data = updateAppointmentSchema.parse(req.body);

    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({ message: req.t("common.not_found") });
    }

    if (
      typeof data.assignedToUserId !== "undefined" &&
      data.assignedToUserId !== null
    ) {
      const assignedUser = await User.findByPk(data.assignedToUserId);
      if (!assignedUser) {
        return res.status(404).json({ message: "Assigned user not found" });
      }
    }

    await appointment.update({
      appointmentDate:
        data.appointmentDate ?? (appointment.appointmentDate as any),
      appointmentStartTime:
        data.appointmentStartTime ?? appointment.appointmentStartTime,
      appointmentEndTime:
        typeof data.appointmentEndTime !== "undefined"
          ? data.appointmentEndTime
          : appointment.appointmentEndTime,
      status: data.status ?? appointment.status,
      meetingType: data.meetingType ?? appointment.meetingType,
      assignedToUserId:
        typeof data.assignedToUserId !== "undefined"
          ? data.assignedToUserId
          : appointment.assignedToUserId,
      notes: typeof data.notes !== "undefined" ? data.notes : appointment.notes,
      result:
        typeof data.result !== "undefined" ? data.result : appointment.result,
      nextStep:
        typeof data.nextStep !== "undefined"
          ? data.nextStep
          : appointment.nextStep,
      updatedBy: req.user?.id ?? null,
    });

    const updated = await Appointment.findByPk(id, {
      include: appointmentInclude,
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

export const deleteAppointment = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ message: req.t("common.invalid_id") });
  }

  const appointment = await Appointment.findByPk(id);

  if (!appointment) {
    return res.status(404).json({ message: req.t("common.not_found") });
  }

  await appointment.destroy();

  return res.json({ message: req.t("common.deleted_successfully") });
};

export const getAppointmentsCalendar = async (req: Request, res: Response) => {
  const dateFrom = String(req.query.dateFrom ?? "").trim();
  const dateTo = String(req.query.dateTo ?? "").trim();
  const assignedToUserId = Number(req.query.assignedToUserId) || undefined;
  const status = String(req.query.status ?? "").trim();

  const where: any = {};

  if (assignedToUserId) where.assignedToUserId = assignedToUserId;
  if (status) where.status = status;

  if (dateFrom || dateTo) {
    where.appointmentDate = {};
    if (dateFrom) where.appointmentDate[Op.gte] = dateFrom;
    if (dateTo) where.appointmentDate[Op.lte] = dateTo;
  }

  const appointments = await Appointment.findAll({
    where,
    include: [
      {
        model: Customer,
        as: "customer",
        include: [{ model: Venue, as: "venue" }],
      },
      {
        model: User,
        as: "assignedToUser",
        attributes: ["id", "fullName"],
      },
    ],
    order: [
      ["appointmentDate", "ASC"],
      ["appointmentStartTime", "ASC"],
    ],
  });

  return res.json({
    data: appointments,
  });
};
