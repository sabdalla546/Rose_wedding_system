import api from "@/lib/axios";
import type {
  AppointmentFormData,
  AppointmentMutationResponse,
  AppointmentResponse,
  AppointmentsCalendarResponse,
  AppointmentsResponse,
  AttendAppointmentData,
  AttendAppointmentResponse,
  CancelAppointmentData,
  ConfirmAppointmentData,
  RescheduleAppointmentData,
  AppointmentStatus,
} from "@/pages/appointments/types";

export type ListAppointmentsParams = {
  page: number;
  limit: number;
  status?: AppointmentStatus;
  customerId?: number;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type ExportAppointmentsPdfParams = Pick<
  ListAppointmentsParams,
  "status" | "customerId" | "search" | "dateFrom" | "dateTo"
>;

export type CreateAppointmentWithCustomerValues = {
  customer?: {
    fullName: string;
    mobile: string;
    mobile2?: string;
    email?: string;
    nationalId?: string;
    address?: string;
    notes?: string;
  };
  customerId?: string;
  appointment: {
    appointmentDate: string;
    startTime: string;
    endTime: string;
    type: AppointmentFormData["type"];
    weddingDate?: string;
    guestCount?: string;
    venueId?: string;
    notes?: string;
  };
};

const normalizeOptionalString = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const normalizeNullableString = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const requireTrimmedTime = (value: string | undefined, field: string) => {
  const trimmed = value?.trim();

  if (!trimmed) {
    throw new Error(`${field} is required`);
  }

  return trimmed;
};

const buildCreateAppointmentPayload = (values: AppointmentFormData) => ({
  customerId: Number(values.customerId),
  appointmentDate: values.appointmentDate,
  startTime: values.startTime,
  endTime: requireTrimmedTime(values.endTime, "endTime"),
  type: values.type,
  weddingDate: normalizeOptionalString(values.weddingDate),
  guestCount: values.guestCount?.trim() ? Number(values.guestCount) : undefined,
  venueId: values.venueId?.trim() ? Number(values.venueId) : undefined,
  notes: normalizeOptionalString(values.notes),
});

const buildUpdateAppointmentPayload = (values: AppointmentFormData) => ({
  customerId: Number(values.customerId),
  appointmentDate: values.appointmentDate,
  startTime: values.startTime,
  endTime: requireTrimmedTime(values.endTime, "endTime"),
  type: values.type,
  weddingDate: normalizeNullableString(values.weddingDate),
  guestCount: values.guestCount?.trim() ? Number(values.guestCount) : null,
  venueId: values.venueId?.trim() ? Number(values.venueId) : null,
  notes: normalizeNullableString(values.notes),
});

const buildCreateAppointmentWithCustomerPayload = (
  values: CreateAppointmentWithCustomerValues,
) => ({
  customerId: values.customerId?.trim() ? Number(values.customerId) : undefined,
  customer: values.customer
    ? {
        fullName: values.customer.fullName.trim(),
        mobile: values.customer.mobile.trim(),
        mobile2: normalizeOptionalString(values.customer.mobile2),
        email: normalizeOptionalString(values.customer.email),
        nationalId: normalizeOptionalString(values.customer.nationalId),
        address: normalizeOptionalString(values.customer.address),
        notes: normalizeOptionalString(values.customer.notes),
      }
    : undefined,
  appointment: {
    appointmentDate: values.appointment.appointmentDate,
    startTime: values.appointment.startTime,
    endTime: requireTrimmedTime(values.appointment.endTime, "endTime"),
    type: values.appointment.type,
    weddingDate: normalizeOptionalString(values.appointment.weddingDate),
    guestCount: values.appointment.guestCount?.trim()
      ? Number(values.appointment.guestCount)
      : undefined,
    venueId: values.appointment.venueId?.trim()
      ? Number(values.appointment.venueId)
      : undefined,
    notes: normalizeOptionalString(values.appointment.notes),
  },
});

export const appointmentsApi = {
  async list(params: ListAppointmentsParams) {
    const response = await api.get<AppointmentsResponse>("/appointments", {
      params,
    });
    return response.data;
  },

  async get(id: string | number) {
    const response = await api.get<AppointmentResponse>(`/appointments/${id}`);
    return response.data.data;
  },

  async listCalendar(params: {
    dateFrom: string;
    dateTo: string;
    status?: string;
    customerId?: number;
    search?: string;
  }) {
    const response = await api.get<AppointmentsCalendarResponse>(
      "/appointments/calendar",
      { params },
    );

    return response.data.data;
  },

  create(values: AppointmentFormData) {
    return api.post<AppointmentMutationResponse>(
      "/appointments",
      buildCreateAppointmentPayload(values),
    );
  },

  createWithCustomer(values: CreateAppointmentWithCustomerValues) {
    return api.post<AppointmentMutationResponse>(
      "/appointments/create-with-customer",
      buildCreateAppointmentWithCustomerPayload(values),
    );
  },

  update(id: string | number, values: AppointmentFormData) {
    return api.put<AppointmentMutationResponse>(
      `/appointments/${id}`,
      buildUpdateAppointmentPayload(values),
    );
  },
  confirm(id: number, values: ConfirmAppointmentData) {
    return api.patch<AppointmentMutationResponse>(`/appointments/${id}/confirm`, values);
  },

  attend(id: number, values: AttendAppointmentData) {
    return api.patch<AttendAppointmentResponse>(`/appointments/${id}/attend`, values);
  },

  cancel(id: number, values: CancelAppointmentData) {
    return api.patch<AppointmentMutationResponse>(`/appointments/${id}/cancel`, values);
  },
  reschedule(id: number, values: RescheduleAppointmentData) {
    return api.patch<AppointmentMutationResponse>(`/appointments/${id}/reschedule`, {
      appointmentDate: values.appointmentDate,
      startTime: values.startTime,
      endTime: requireTrimmedTime(values.endTime, "endTime"),
      notes: values.notes?.trim() || undefined,
    });
  },

  exportPdf(params: ExportAppointmentsPdfParams) {
    return api.get<Blob>("/appointments/export/pdf", {
      params,
      responseType: "blob",
    });
  },
};
