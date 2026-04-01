import { Op, type WhereOptions } from "sequelize";

import { Appointment, Customer, Event, Venue } from "../../models";
import type {
  AppointmentCalendarRecord,
  CalendarFeedFilters,
  CalendarFeedItem,
  CalendarSourceType,
  EventCalendarRecord,
} from "./calendar.types";

type AppointmentInstance = Appointment & {
  customer?: Customer | null;
};

type EventInstance = Event & {
  customer?: Customer | null;
  venue?: Venue | null;
};

const buildDateWhere = (
  field: "appointmentDate" | "eventDate",
  dateFrom?: string,
  dateTo?: string,
) => {
  if (!dateFrom && !dateTo) {
    return undefined;
  }

  const dateWhere: Record<symbol, string> = {} as Record<symbol, string>;

  if (dateFrom) {
    dateWhere[Op.gte] = dateFrom;
  }

  if (dateTo) {
    dateWhere[Op.lte] = dateTo;
  }

  return { [field]: dateWhere };
};

const buildSearchMatcher = (search?: string) => {
  const normalized = search?.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  return (value: string | null | undefined) =>
    Boolean(value?.toLowerCase().includes(normalized));
};

const formatAppointmentType = (value: string) => {
  if (!value) return "";
  return value;
};

const buildEventTitle = (event: EventCalendarRecord) => {
  const partyNames = [event.groomName, event.brideName]
    .filter(Boolean)
    .join(" & ");

  return event.title?.trim() || partyNames || `Event #${event.id}`;
};

const combineDateTime = (date: string, time: string) => `${date}T${time}:00`;

const computeAppointmentEnd = (
  appointmentDate: string,
  startTime: string,
  endTime: string | null,
) => {
  if (!endTime) {
    return null;
  }

  const startAt = new Date(combineDateTime(appointmentDate, startTime));
  const endAt = new Date(combineDateTime(appointmentDate, endTime));

  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
    return null;
  }

  if (endAt.getTime() <= startAt.getTime()) {
    return null;
  }

  return endAt.toISOString();
};

const buildConflictPreparationMeta = (item: {
  sourceType: CalendarSourceType;
  customerId?: number | null;
  venueId?: number | null;
  startAt: string;
  endAt: string | null;
}) => ({
  conflictScope: {
    customerId: item.customerId ?? null,
    venueId: item.venueId ?? null,
  },
  conflictWindow: {
    startAt: item.startAt,
    endAt: item.endAt,
  },
  sourceType: item.sourceType,
});

export const listAppointmentsCalendarRecords = async (
  filters: Omit<CalendarFeedFilters, "sourceType" | "venueId">,
): Promise<AppointmentCalendarRecord[]> => {
  const where: WhereOptions = {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.customerId ? { customerId: filters.customerId } : {}),
    ...buildDateWhere("appointmentDate", filters.dateFrom, filters.dateTo),
  };

  const appointments = (await Appointment.findAll({
    where,
    attributes: [
      "id",
      "customerId",
      "appointmentDate",
      "startTime",
      "endTime",
      "type",
      "notes",
      "status",
    ],
    include: [
      {
        model: Customer,
        as: "customer",
        attributes: ["id", "fullName"],
      },
    ],
    order: [
      ["appointmentDate", "ASC"],
      ["startTime", "ASC"],
      ["id", "ASC"],
    ],
  })) as AppointmentInstance[];

  const matchesSearch = buildSearchMatcher(filters.search);

  return appointments
    .map((appointment) => ({
      id: appointment.id,
      customerId: appointment.customerId,
      appointmentDate: appointment.appointmentDate,
      startTime: appointment.startTime,
      endTime: appointment.endTime ?? null,
      type: appointment.type,
      notes: appointment.notes ?? null,
      status: appointment.status,
      customerName: appointment.customer?.fullName ?? null,
    }))
    .filter((appointment) => {
      if (!matchesSearch) {
        return true;
      }

      return (
        matchesSearch(appointment.customerName) ||
        matchesSearch(formatAppointmentType(appointment.type)) ||
        matchesSearch(appointment.notes)
      );
    });
};

export const listEventsCalendarRecords = async (
  filters: Omit<CalendarFeedFilters, "sourceType">,
): Promise<EventCalendarRecord[]> => {
  const where: WhereOptions = {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.customerId ? { customerId: filters.customerId } : {}),
    ...(filters.venueId ? { venueId: filters.venueId } : {}),
    ...buildDateWhere("eventDate", filters.dateFrom, filters.dateTo),
  };

  const events = (await Event.findAll({
    where,
    attributes: [
      "id",
      "customerId",
      "title",
      "eventDate",
      "venueId",
      "venueNameSnapshot",
      "groomName",
      "brideName",
      "guestCount",
      "notes",
      "status",
    ],
    include: [
      {
        model: Customer,
        as: "customer",
        attributes: ["id", "fullName"],
      },
      {
        model: Venue,
        as: "venue",
        attributes: ["id", "name"],
      },
    ],
    order: [
      ["eventDate", "ASC"],
      ["id", "ASC"],
    ],
  })) as EventInstance[];

  const matchesSearch = buildSearchMatcher(filters.search);

  return events
    .map((event) => ({
      id: event.id,
      customerId: event.customerId ?? null,
      title: event.title ?? null,
      eventDate: event.eventDate,
      venueId: event.venueId ?? null,
      venueName: event.venue?.name ?? event.venueNameSnapshot ?? null,
      groomName: event.groomName ?? null,
      brideName: event.brideName ?? null,
      guestCount: event.guestCount ?? null,
      notes: event.notes ?? null,
      status: event.status,
      customerName: event.customer?.fullName ?? null,
    }))
    .filter((event) => {
      if (!matchesSearch) {
        return true;
      }

      return (
        matchesSearch(event.title) ||
        matchesSearch(event.customerName) ||
        matchesSearch(event.venueName) ||
        matchesSearch(event.groomName) ||
        matchesSearch(event.brideName) ||
        matchesSearch(event.notes)
      );
    });
};

export const appointmentToCalendarFeedItem = (
  appointment: AppointmentCalendarRecord,
): CalendarFeedItem => {
  const startAt = combineDateTime(
    appointment.appointmentDate,
    appointment.startTime,
  );

  const item: CalendarFeedItem = {
    id: `appointment-${appointment.id}`,
    sourceType: "appointment",
    sourceId: appointment.id,
    title: appointment.customerName
      ? `${appointment.customerName} Appointment`
      : `Appointment #${appointment.id}`,
    startAt,
    endAt: computeAppointmentEnd(
      appointment.appointmentDate,
      appointment.startTime,
      appointment.endTime,
    ),
    allDay: false,
    status: appointment.status,
    customerId: appointment.customerId,
    customerName: appointment.customerName,
    subtitle: formatAppointmentType(appointment.type),
    notes: appointment.notes,
    colorToken: `appointment.${appointment.status}`,
  };

  item.meta = {
    type: appointment.type,
    ...buildConflictPreparationMeta(item),
  };

  return item;
};

export const eventToCalendarFeedItem = (
  event: EventCalendarRecord,
): CalendarFeedItem => {
  const item: CalendarFeedItem = {
    id: `event-${event.id}`,
    sourceType: "event",
    sourceId: event.id,
    title: buildEventTitle(event),
    startAt: event.eventDate,
    endAt: null,
    allDay: true,
    status: event.status,
    venueId: event.venueId,
    venueName: event.venueName,
    customerId: event.customerId,
    customerName: event.customerName,
    subtitle:
      [event.groomName, event.brideName].filter(Boolean).join(" / ") ||
      event.customerName ||
      null,
    notes: event.notes,
    colorToken: `event.${event.status}`,
  };

  item.meta = {
    guestCount: event.guestCount,
    groomName: event.groomName,
    brideName: event.brideName,
    ...buildConflictPreparationMeta(item),
  };

  return item;
};

export const getUnifiedCalendarFeed = async (
  filters: CalendarFeedFilters,
): Promise<CalendarFeedItem[]> => {
  const feedItems: CalendarFeedItem[] = [];

  if (filters.sourceType === "all" || filters.sourceType === "appointment") {
    const {
      venueId: _venueId,
      sourceType: _sourceType,
      ...appointmentFilters
    } = filters;
    const appointments =
      await listAppointmentsCalendarRecords(appointmentFilters);
    feedItems.push(...appointments.map(appointmentToCalendarFeedItem));
  }

  if (filters.sourceType === "all" || filters.sourceType === "event") {
    const events = await listEventsCalendarRecords(filters);
    feedItems.push(...events.map(eventToCalendarFeedItem));
  }

  return feedItems.sort((left, right) => {
    const startDelta =
      new Date(left.startAt).getTime() - new Date(right.startAt).getTime();

    if (startDelta !== 0) {
      return startDelta;
    }

    return String(left.id).localeCompare(String(right.id));
  });
};
