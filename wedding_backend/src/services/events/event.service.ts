import { Op } from "sequelize";
import { Appointment, Customer, Event, User, Venue } from "../../models";
import {
  appointmentAlreadyConvertedError,
  invalidStatusTransitionError,
  WorkflowDomainError,
} from "../workflow/workflow.errors";

export const eventInclude: any[] = [
  { model: Customer, as: "customer" },
  { model: Venue, as: "venue" },
  {
    model: Appointment,
    as: "sourceAppointment",
    include: [
      { model: Customer, as: "customer" },
      { model: Venue, as: "venue" },
    ],
  },
  { model: User, as: "createdByUser", attributes: ["id", "fullName"] },
  { model: User, as: "updatedByUser", attributes: ["id", "fullName"] },
];

export const ACTIVE_EVENT_STATUSES = [
  "draft",
  "designing",
  "confirmed",
  "in_progress",
  "completed",
] as const;

export const normalizeNullableString = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

export const getSourceAppointmentDefaults = async (
  sourceAppointmentId?: number | null,
) => {
  if (!sourceAppointmentId) {
    return null;
  }

  return Appointment.findByPk(sourceAppointmentId, {
    include: [
      { model: Customer, as: "customer" },
      { model: Venue, as: "venue" },
    ],
  });
};

export const assertAppointmentCanConvertToEvent = async (
  sourceAppointmentId: number,
  excludeEventId?: number,
) => {
  const appointment = await getSourceAppointmentDefaults(sourceAppointmentId);

  if (!appointment) {
    throw new WorkflowDomainError("Source appointment not found", 404);
  }

  if (appointment.status === "cancelled" || appointment.status === "no_show") {
    throw invalidStatusTransitionError();
  }

  if (appointment.status !== "completed") {
    throw invalidStatusTransitionError();
  }

  const existingEvent = await Event.findOne({
    where: {
      sourceAppointmentId,
      ...(excludeEventId
        ? {
            id: {
              [Op.ne]: excludeEventId,
            },
          }
        : {}),
    },
  });

  if (existingEvent) {
    throw appointmentAlreadyConvertedError();
  }

  return appointment;
};

export const findActiveEventBySourceAppointment = async (
  sourceAppointmentId: number,
  excludeEventId?: number,
) =>
  Event.findOne({
    where: {
      sourceAppointmentId,
      ...(excludeEventId
        ? {
            id: {
              [Op.ne]: excludeEventId,
            },
          }
        : {}),
      status: {
        [Op.in]: ACTIVE_EVENT_STATUSES,
      },
    },
  });

export const assertEventStatusTransition = (
  currentStatus: Event["status"],
  nextStatus?: string | null,
) => {
  if (!nextStatus || nextStatus === currentStatus) {
    return;
  }

  if (nextStatus === "in_progress" && currentStatus !== "confirmed") {
    throw invalidStatusTransitionError();
  }
};

export const listEventsPage = async ({
  page,
  limit,
  status,
  customerId,
  venueId,
  dateFrom,
  dateTo,
  search,
}: {
  page: number;
  limit: number;
  status?: string;
  customerId?: number;
  venueId?: number;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}) => {
  const where: any = {};

  if (status) where.status = status;
  if (customerId) where.customerId = customerId;
  if (venueId) where.venueId = venueId;

  if (dateFrom || dateTo) {
    where.eventDate = {};
    if (dateFrom) where.eventDate[Op.gte] = dateFrom;
    if (dateTo) where.eventDate[Op.lte] = dateTo;
  }

  if (search) {
    const like = `%${search}%`;
    where[Op.or] = [
      { title: { [Op.like]: like } },
      { groomName: { [Op.like]: like } },
      { brideName: { [Op.like]: like } },
      { venueNameSnapshot: { [Op.like]: like } },
      { "$customer.fullName$": { [Op.like]: like } },
    ];
  }

  return Event.findAndCountAll({
    where,
    include: [
      { model: Customer, as: "customer" },
      { model: Venue, as: "venue" },
      { model: User, as: "createdByUser", attributes: ["id", "fullName"] },
      { model: User, as: "updatedByUser", attributes: ["id", "fullName"] },
    ],
    order: [
      ["eventDate", "ASC"],
      ["id", "DESC"],
    ],
    limit,
    offset: (page - 1) * limit,
  });
};

export const loadEventById = async (id: number) =>
  Event.findByPk(id, {
    include: eventInclude,
  });
