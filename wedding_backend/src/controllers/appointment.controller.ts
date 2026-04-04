import { Request, Response } from "express";
import { Op, Transaction } from "sequelize";
import { ZodError } from "zod";
import ejs from "ejs";
import puppeteer from "puppeteer";
import { sequelize } from "../config/database";

import { AuthRequest } from "../middleware/auth.middleware";
import { Appointment, Customer, User, Venue } from "../models";
import {
  createAppointmentSchema,
  createAppointmentWithCustomerSchema,
  updateAppointmentSchema,
} from "../validation/appointment.schemas";
import { calendarFeedQuerySchema } from "../validation/calendar.schemas";
import {
  cancelAppointmentSchema,
  completeAppointmentSchema,
  confirmAppointmentSchema,
  rescheduleAppointmentSchema,
} from "../validation/appointment-action.schemas";
import { renderAppointmentReportHtml } from "../services/documents/appointment/appointmentReportPdf.service";
import { isWorkflowDomainError } from "../services/workflow/workflow.errors";
import {
  assertValidAppointmentTransition,
  expandAppointmentStatusesForQuery,
} from "../services/workflow/workflow.status";
import {
  cancelAppointmentWorkflow,
  completeAppointmentWorkflow,
  confirmAppointmentWorkflow,
  markAppointmentNoShow,
  rescheduleAppointmentWorkflow,
} from "../services/appointments/appointment.workflow.service";
import { invalidStatusTransitionError } from "../services/workflow/workflow.errors";

const APPOINTMENT_CONFLICT_MESSAGE =
  "This appointment overlaps with another appointment.";
const APPOINTMENT_END_TIME_REQUIRED_MESSAGE =
  "endTime is required for scheduling conflict checks.";

class AppointmentSchedulingError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "AppointmentSchedulingError";
    this.statusCode = statusCode;
  }
}
const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
const appointmentInclude = [
  { model: Customer, as: "customer" },
  { model: Venue, as: "venue" },
  { model: User, as: "createdByUser", attributes: ["id", "fullName"] },
  { model: User, as: "updatedByUser", attributes: ["id", "fullName"] },
];

const serializeAppointment = (instance: any) =>
  typeof instance?.toJSON === "function" ? instance.toJSON() : instance;

const normalizeOptionalTime = (value?: string | null) => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
};

const requireEndTimeForConflictChecks = (value?: string | null) => {
  const normalized = normalizeOptionalTime(value);

  if (!normalized) {
    throw new AppointmentSchedulingError(
      APPOINTMENT_END_TIME_REQUIRED_MESSAGE,
      400,
    );
  }

  return normalized;
};

const assertNoAppointmentTimeConflict = async ({
  appointmentDate,
  startTime,
  endTime,
  ignoreAppointmentId,
  transaction,
}: {
  appointmentDate: string;
  startTime: string;
  endTime?: string | null;
  ignoreAppointmentId?: number;
  transaction?: Transaction;
}) => {
  const normalizedStartTime = startTime.trim();
  const normalizedEndTime = requireEndTimeForConflictChecks(endTime);

  const where: any = {
    appointmentDate,
    status: {
      [Op.notIn]: ["cancelled", "no_show"],
    },
    startTime: {
      [Op.lt]: normalizedEndTime,
    },
    endTime: {
      [Op.gt]: normalizedStartTime,
    },
  };

  if (ignoreAppointmentId) {
    where.id = {
      [Op.ne]: ignoreAppointmentId,
    };
  }

  const conflictingAppointment = await Appointment.findOne({
    where,
    transaction,
  });

  if (conflictingAppointment) {
    throw new AppointmentSchedulingError(APPOINTMENT_CONFLICT_MESSAGE, 409);
  }
};

const handleAppointmentError = (req: Request, res: Response, err: unknown) => {
  if (err instanceof ZodError) {
    return res.status(400).json({ errors: err.errors });
  }

  if (err instanceof AppointmentSchedulingError) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  if (isWorkflowDomainError(err)) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  return res.status(500).json({ message: req.t("common.unexpected_error") });
};

export const createAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const data = createAppointmentSchema.parse(req.body);

    const customer = await Customer.findByPk(data.customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    if (data.venueId) {
      const venue = await Venue.findByPk(data.venueId);
      if (!venue) {
        return res.status(404).json({ message: "Venue not found" });
      }
    }

    await assertNoAppointmentTimeConflict({
      appointmentDate: data.appointmentDate,
      startTime: data.startTime,
      endTime: data.endTime,
    });

    const appointment = await Appointment.create({
      customerId: data.customerId,
      appointmentDate: data.appointmentDate,
      startTime: data.startTime,
      endTime: data.endTime ?? null,
      type: data.type ?? "Office Visit",
      weddingDate: data.weddingDate ?? null,
      guestCount: data.guestCount ?? null,
      venueId: data.venueId ?? null,
      notes: data.notes ?? null,
      status: data.status ?? "scheduled",
      createdBy: req.user?.id ?? null,
      updatedBy: req.user?.id ?? null,
    });

    const created = await Appointment.findByPk(appointment.id, {
      include: appointmentInclude,
    });

    return res.status(201).json({
      message: "Appointment created successfully",
      data: created ? serializeAppointment(created) : created,
    });
  } catch (err) {
    return handleAppointmentError(req, res, err);
  }
};

export const createAppointmentWithCustomer = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const data = createAppointmentWithCustomerSchema.parse(req.body);
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
          customer = await Customer.create(
            {
              fullName: data.customer.fullName.trim(),
              mobile,
              mobile2: data.customer.mobile2?.trim() || null,
              email: data.customer.email?.trim() || null,
              nationalId: data.customer.nationalId?.trim() || null,
              address: data.customer.address?.trim() || null,
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

      if (data.appointment.venueId) {
        const venue = await Venue.findByPk(data.appointment.venueId, {
          transaction,
        });
        if (!venue) {
          await transaction.rollback();
          return res.status(404).json({ message: "Venue not found" });
        }
      }

      await assertNoAppointmentTimeConflict({
        appointmentDate: data.appointment.appointmentDate,
        startTime: data.appointment.startTime,
        endTime: data.appointment.endTime,
        transaction,
      });

      const appointment = await Appointment.create(
        {
          customerId: customer.id,
          appointmentDate: data.appointment.appointmentDate,
          startTime: data.appointment.startTime,
          endTime: data.appointment.endTime ?? null,
          type: data.appointment.type ?? "Office Visit",
          weddingDate: data.appointment.weddingDate ?? null,
          guestCount: data.appointment.guestCount ?? null,
          venueId: data.appointment.venueId ?? null,
          notes: data.appointment.notes ?? null,
          status: data.appointment.status ?? "scheduled",
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
        data: created ? serializeAppointment(created) : created,
      });
    } catch (transactionError) {
      await transaction.rollback();
      throw transactionError;
    }
  } catch (err) {
    return handleAppointmentError(req, res, err);
  }
};

export const getAppointments = async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const status = String(req.query.status ?? "").trim();
  const customerId = Number(req.query.customerId) || undefined;
  const search = String(req.query.search ?? "").trim();
  const dateFrom = String(req.query.dateFrom ?? "").trim();
  const dateTo = String(req.query.dateTo ?? "").trim();

  const where: any = {};

  if (status) {
    where.status = { [Op.in]: expandAppointmentStatusesForQuery(status) };
  }
  if (customerId) where.customerId = customerId;

  if (search) {
    const like = `%${search}%`;
    where[Op.or] = [
      { notes: { [Op.like]: like } },
      { "$customer.fullName$": { [Op.like]: like } },
      { "$customer.mobile$": { [Op.like]: like } },
    ];
  }

  if (dateFrom || dateTo) {
    where.appointmentDate = {};
    if (dateFrom) where.appointmentDate[Op.gte] = dateFrom;
    if (dateTo) where.appointmentDate[Op.lte] = dateTo;
  }

  const { count, rows } = await Appointment.findAndCountAll({
    where,
    include: appointmentInclude,
    distinct: true,
    order: [
      ["appointmentDate", "ASC"],
      ["startTime", "ASC"],
      ["id", "DESC"],
    ],
    limit,
    offset,
  });

  return res.json({
    data: rows.map(serializeAppointment),
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

  return res.json({ data: serializeAppointment(appointment) });
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

    await confirmAppointmentWorkflow(
      appointment,
      req.user?.id ?? null,
      data.notes,
    );

    const updated = await Appointment.findByPk(id, {
      include: appointmentInclude,
    });

    return res.json({
      message: "Appointment confirmed successfully",
      data: updated ? serializeAppointment(updated) : updated,
    });
  } catch (err) {
    return handleAppointmentError(req, res, err);
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

    await completeAppointmentWorkflow(
      appointment,
      req.user?.id ?? null,
      data.notes,
    );

    const updated = await Appointment.findByPk(id, {
      include: appointmentInclude,
    });

    return res.json({
      message: "Appointment completed successfully",
      data: updated ? serializeAppointment(updated) : updated,
    });
  } catch (err) {
    return handleAppointmentError(req, res, err);
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

    await cancelAppointmentWorkflow(
      appointment,
      req.user?.id ?? null,
      data.reason,
      data.notes,
    );

    const updated = await Appointment.findByPk(id, {
      include: appointmentInclude,
    });

    return res.json({
      message: "Appointment cancelled successfully",
      data: updated ? serializeAppointment(updated) : updated,
    });
  } catch (err) {
    return handleAppointmentError(req, res, err);
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

    const nextEndTime =
      typeof data.endTime !== "undefined" ? data.endTime : appointment.endTime;

    await assertNoAppointmentTimeConflict({
      appointmentDate: data.appointmentDate,
      startTime: data.startTime,
      endTime: nextEndTime,
      ignoreAppointmentId: appointment.id,
    });

    await rescheduleAppointmentWorkflow(appointment, {
      appointmentDate: data.appointmentDate,
      startTime: data.startTime,
      endTime: nextEndTime ?? null,
      note: data.notes,
      userId: req.user?.id ?? null,
    });

    const updated = await Appointment.findByPk(id, {
      include: appointmentInclude,
    });

    return res.json({
      message: "Appointment rescheduled successfully",
      data: updated ? serializeAppointment(updated) : updated,
    });
  } catch (err) {
    return handleAppointmentError(req, res, err);
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

    if (typeof data.customerId !== "undefined") {
      const customer = await Customer.findByPk(data.customerId);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
    }

    if (typeof data.venueId !== "undefined" && data.venueId !== null) {
      const venue = await Venue.findByPk(data.venueId);
      if (!venue) {
        return res.status(404).json({ message: "Venue not found" });
      }
    }

    const nextAppointmentDate =
      data.appointmentDate ?? appointment.appointmentDate;
    const nextStartTime = data.startTime ?? appointment.startTime;
    const nextEndTime =
      typeof data.endTime !== "undefined" ? data.endTime : appointment.endTime;

    await assertNoAppointmentTimeConflict({
      appointmentDate: nextAppointmentDate,
      startTime: nextStartTime,
      endTime: nextEndTime,
      ignoreAppointmentId: appointment.id,
    });

    const nextStatus = data.status ?? appointment.status;
    if (nextStatus === "converted" && appointment.status !== "converted") {
      throw invalidStatusTransitionError(
        "Appointment can only be converted through event conversion",
      );
    }

    await appointment.update({
      customerId:
        typeof data.customerId !== "undefined"
          ? data.customerId
          : appointment.customerId,
      appointmentDate: nextAppointmentDate,
      startTime: nextStartTime,
      endTime: nextEndTime,
      type: data.type ?? appointment.type,
      weddingDate:
        typeof data.weddingDate !== "undefined"
          ? data.weddingDate
          : appointment.weddingDate,
      guestCount:
        typeof data.guestCount !== "undefined"
          ? data.guestCount
          : appointment.guestCount,
      venueId:
        typeof data.venueId !== "undefined"
          ? data.venueId
          : appointment.venueId,
      notes: typeof data.notes !== "undefined" ? data.notes : appointment.notes,
      updatedBy: req.user?.id ?? null,
    });

    if (nextStatus !== appointment.status) {
      if (nextStatus === "confirmed") {
        await confirmAppointmentWorkflow(
          appointment,
          req.user?.id ?? null,
          data.notes,
        );
      } else if (nextStatus === "completed") {
        await completeAppointmentWorkflow(
          appointment,
          req.user?.id ?? null,
          data.notes,
        );
      } else if (nextStatus === "cancelled") {
        await cancelAppointmentWorkflow(
          appointment,
          req.user?.id ?? null,
          undefined,
          data.notes,
        );
      } else if (nextStatus === "rescheduled") {
        await rescheduleAppointmentWorkflow(appointment, {
          appointmentDate: nextAppointmentDate,
          startTime: nextStartTime,
          endTime: nextEndTime ?? null,
          note: data.notes,
          userId: req.user?.id ?? null,
        });
      } else if (nextStatus === "no_show") {
        await markAppointmentNoShow(
          appointment,
          req.user?.id ?? null,
          data.notes,
        );
      } else {
        assertValidAppointmentTransition(appointment.status, nextStatus);
        await appointment.update({
          status: nextStatus,
          updatedBy: req.user?.id ?? null,
        });
      }
    }

    const updated = await Appointment.findByPk(id, {
      include: appointmentInclude,
    });

    return res.json({
      message: req.t("common.updated_successfully"),
      data: updated ? serializeAppointment(updated) : updated,
    });
  } catch (err) {
    return handleAppointmentError(req, res, err);
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
  const parsed = calendarFeedQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.errors });
  }

  const { dateFrom, dateTo, status, customerId, search } = parsed.data;

  const where: any = {};

  if (status) {
    where.status = { [Op.in]: expandAppointmentStatusesForQuery(status) };
  }
  if (customerId) where.customerId = customerId;

  if (search) {
    const like = `%${search}%`;
    where[Op.or] = [
      { notes: { [Op.like]: like } },
      { "$customer.fullName$": { [Op.like]: like } },
      { "$customer.mobile$": { [Op.like]: like } },
    ];
  }

  if (dateFrom || dateTo) {
    where.appointmentDate = {};
    if (dateFrom) where.appointmentDate[Op.gte] = dateFrom;
    if (dateTo) where.appointmentDate[Op.lte] = dateTo;
  }

  const appointments = await Appointment.findAll({
    where,
    include: appointmentInclude,
    order: [
      ["appointmentDate", "ASC"],
      ["startTime", "ASC"],
    ],
  });

  return res.json({ data: appointments.map(serializeAppointment) });
};

const exportAppointmentsPdfLegacy = async (req: Request, res: Response) => {
  try {
    const status = String(req.query.status ?? "").trim();
    const customerId = Number(req.query.customerId) || undefined;
    const search = String(req.query.search ?? "").trim();
    const dateFrom = String(req.query.dateFrom ?? "").trim();
    const dateTo = String(req.query.dateTo ?? "").trim();

    const where: any = {};

    if (status) {
      where.status = { [Op.in]: expandAppointmentStatusesForQuery(status) };
    }
    if (customerId) where.customerId = customerId;

    if (search) {
      const like = `%${search}%`;
      where[Op.or] = [
        { notes: { [Op.like]: like } },
        { "$customer.fullName$": { [Op.like]: like } },
        { "$customer.mobile$": { [Op.like]: like } },
      ];
    }

    if (dateFrom || dateTo) {
      where.appointmentDate = {};
      if (dateFrom) where.appointmentDate[Op.gte] = dateFrom;
      if (dateTo) where.appointmentDate[Op.lte] = dateTo;
    }
    const appointments = await Appointment.findAll({
      where,
      include: appointmentInclude,
      order: [
        ["appointmentDate", "ASC"],
        ["startTime", "ASC"],
        ["id", "DESC"],
      ],
    });

    const rows = appointments.map((item) => serializeAppointment(item));

    const html = await ejs.render(
      `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8" />
          <title>Appointments Report</title>
          <style>
            body {
              font-family: Arial, Tahoma, sans-serif;
              margin: 24px;
              color: #222;
              font-size: 12px;
            }

            .header {
              margin-bottom: 18px;
            }

            .title {
              font-size: 22px;
              font-weight: 700;
              margin-bottom: 6px;
            }

            .subtitle {
              color: #666;
              margin-bottom: 4px;
            }

            .filters {
              background: #f7f7f7;
              border: 1px solid #ddd;
              border-radius: 8px;
              padding: 12px;
              margin-bottom: 18px;
            }

            .filters-row {
              margin-bottom: 4px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              table-layout: fixed;
            }

            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: center;
              vertical-align: top;
              word-wrap: break-word;
            }

            th {
              background: #f0f0f0;
              font-weight: 700;
            }

            .footer {
              margin-top: 16px;
              font-size: 11px;
              color: #666;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">تقرير المواعيد</div>
            <div class="subtitle">عدد النتائج: <%= total %></div>
            <div class="subtitle">تاريخ الإنشاء: <%= generatedAt %></div>
          </div>

          <div class="filters">
            <div class="filters-row"><strong>من:</strong> <%= dateFrom || "الكل" %></div>
            <div class="filters-row"><strong>إلى:</strong> <%= dateTo || "الكل" %></div>
            <div class="filters-row"><strong>الحالة:</strong> <%= status || "الكل" %></div>
            <div class="filters-row"><strong>العميل:</strong> <%= customerId || "الكل" %></div>
            <div class="filters-row"><strong>البحث:</strong> <%= search || "—" %></div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 5%;">#</th>
                <th style="width: 22%;">العميل</th>
                <th style="width: 14%;">رقم الهاتف</th>
                <th style="width: 14%;">تاريخ الموعد</th>
                <th style="width: 14%;">الوقت</th>
                <th style="width: 13%;">النوع</th>
                <th style="width: 10%;">الحالة</th>
                <th style="width: 18%;">الملاحظات</th>
              </tr>
            </thead>
            <tbody>
              <% if (!rows.length) { %>
                <tr>
                  <td colspan="8">لا توجد مواعيد ضمن الفلاتر المحددة.</td>
                </tr>
              <% } %>

              <% rows.forEach((row, index) => { %>
                <tr>
                  <td><%= index + 1 %></td>
                  <td><%= row.customer?.fullName || "—" %></td>
                  <td><%= row.customer?.mobile || "—" %></td>
                  <td><%= row.appointmentDate || "—" %></td>
                  <td>
                    <%= row.startTime || "—" %>
                    <% if (row.endTime) { %>
                      - <%= row.endTime %>
                    <% } %>
                  </td>
                  <td><%= row.type || "—" %></td>
                  <td><%= row.status || "—" %></td>
                  <td><%= row.notes || "—" %></td>
                </tr>
              <% }) %>
            </tbody>
          </table>

          <div class="footer">
            Wedding System - Appointments PDF Report
          </div>
        </body>
      </html>
      `,
      {
        rows,
        total: rows.length,
        generatedAt: new Date().toLocaleString("en-GB"),
        dateFrom,
        dateTo,
        status,
        customerId,
        search,
      },
    );

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      executablePath: puppeteer.executablePath(), // مهم
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html);
      console.log("HTML LENGTH:", html.length);

      const pdfBytes = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
          top: "20px",
          right: "20px",
          bottom: "20px",
          left: "20px",
        },
      });

      const pdfBuffer = Buffer.from(pdfBytes);
      console.log("PDF BYTE LENGTH:", pdfBuffer.length);

      const fileName = `appointments-report-${new Date()
        .toISOString()
        .slice(0, 10)}.pdf`;

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}"`,
      );
      res.setHeader("Content-Length", pdfBuffer.length.toString());

      return res.end(pdfBuffer);
    } finally {
      await browser.close();
    }
  } catch (err) {
    console.error("EXPORT PDF ERROR:", err);

    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.errors });
    }

    return res.status(500).json({
      message: "PDF generation failed",
      error: err instanceof Error ? err.message : String(err),
    });
  }
};

export const exportAppointmentsPdf = async (req: Request, res: Response) => {
  try {
    const status = String(req.query.status ?? "").trim();
    const customerId = Number(req.query.customerId) || undefined;
    const search = String(req.query.search ?? "").trim();
    const dateFrom = String(req.query.dateFrom ?? "").trim();
    const dateTo = String(req.query.dateTo ?? "").trim();

    const where: any = {};

    if (status) {
      where.status = { [Op.in]: expandAppointmentStatusesForQuery(status) };
    }
    if (customerId) where.customerId = customerId;

    if (search) {
      const like = `%${search}%`;
      where[Op.or] = [
        { notes: { [Op.like]: like } },
        { "$customer.fullName$": { [Op.like]: like } },
        { "$customer.mobile$": { [Op.like]: like } },
      ];
    }

    if (dateFrom || dateTo) {
      where.appointmentDate = {};
      if (dateFrom) where.appointmentDate[Op.gte] = dateFrom;
      if (dateTo) where.appointmentDate[Op.lte] = dateTo;
    }

    const appointments = await Appointment.findAll({
      where,
      include: appointmentInclude,
      order: [
        ["appointmentDate", "ASC"],
        ["startTime", "ASC"],
        ["id", "DESC"],
      ],
    });

    const rows = appointments.map((item) => serializeAppointment(item));

    const formatArabicDate = (value?: string | null) => {
      if (!value) return "—";

      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        return value;
      }

      return new Intl.DateTimeFormat("ar-KW", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(date);
    };

    const formatArabicDateTimeRange = (
      appointmentDate?: string | null,
      startTime?: string | null,
      endTime?: string | null,
    ) => {
      const datePart = formatArabicDate(appointmentDate);
      const timePart = [startTime, endTime].filter(Boolean).join(" - ");

      if (datePart === "—" && !timePart) return "—";
      if (datePart === "—") return timePart || "—";
      if (!timePart) return datePart;
      return `${datePart} / ${timePart}`;
    };

    const resolveReportMonth = () => {
      const seed =
        dateFrom || rows[0]?.appointmentDate || rows[0]?.weddingDate || null;

      if (!seed) {
        return "................";
      }

      const date = new Date(seed);
      if (Number.isNaN(date.getTime())) {
        return "................";
      }

      return new Intl.DateTimeFormat("ar-KW", {
        month: "long",
        year: "numeric",
      }).format(date);
    };

    const printableRows: Array<{
      index: number | string;
      customerName: string;
      weddingDate: string;
      venueName: string;
      customerPhone: string;
      appointmentSlot: string;
    }> = rows.map((row, index) => ({
      index: index + 1,
      customerName: row.customer?.fullName || "—",
      weddingDate: formatArabicDate(row.weddingDate || row.appointmentDate),
      venueName: row.venue?.name || "—",
      customerPhone: row.customer?.mobile || "—",
      appointmentSlot: formatArabicDateTimeRange(
        row.appointmentDate,
        row.startTime,
        row.endTime,
      ),
    }));

    const rowsPerPage = 14;
    const pagedRows = Array.from(
      { length: Math.max(1, Math.ceil(printableRows.length / rowsPerPage)) },
      (_, pageIndex) => {
        const slice = printableRows.slice(
          pageIndex * rowsPerPage,
          (pageIndex + 1) * rowsPerPage,
        );

        while (slice.length < rowsPerPage) {
          slice.push({
            index: "",
            customerName: "",
            weddingDate: "",
            venueName: "",
            customerPhone: "",
            appointmentSlot: "",
          });
        }

        return slice;
      },
    );

    const generatedAt = new Intl.DateTimeFormat("ar-KW", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date());
    const reportMonth = resolveReportMonth();

    const html = await renderAppointmentReportHtml({
      pagedRows,
      generatedAt,
      reportMonth,
      dateFrom,
      dateTo,
      status,
      customerId,
      search,
    });

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      executablePath: puppeteer.executablePath(),
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });

      const pdfBytes = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
          top: "0",
          right: "0",
          bottom: "0",
          left: "0",
        },
      });

      const pdfBuffer = Buffer.from(pdfBytes);
      const fileName = `appointments-report-${new Date()
        .toISOString()
        .slice(0, 10)}.pdf`;

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}"`,
      );
      res.setHeader("Content-Length", pdfBuffer.length.toString());

      return res.end(pdfBuffer);
    } finally {
      await browser.close();
    }
  } catch (err) {
    console.error("EXPORT PDF ERROR:", err);

    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.errors });
    }

    return res.status(500).json({
      message: "PDF generation failed",
      error: err instanceof Error ? err.message : String(err),
    });
  }
};
