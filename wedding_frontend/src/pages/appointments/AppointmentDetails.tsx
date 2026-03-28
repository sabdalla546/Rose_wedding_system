import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CalendarClock, CalendarPlus, Edit } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAppointment } from "@/hooks/appointments/useAppointments";
import { formatAppointmentType } from "./adapters";
import { AppointmentStatusBadge } from "./_components/appointmentStatusBadge";

function DetailItem({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="rounded-2xl border px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
        {label}
      </p>
      <p className="mt-1 text-sm text-[var(--lux-text)]">{value || "-"}</p>
    </div>
  );
}

const AppointmentDetailsPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: appointment, isLoading } = useAppointment(id);
  const dateLocale = i18n.language === "ar" ? ar : enUS;

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-sm text-[var(--lux-text-secondary)]">
          {t("common.loading", { defaultValue: "Loading..." })}
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-sm text-[var(--lux-text-secondary)]">
          {t("common.not_found", { defaultValue: "Not found" })}
        </div>
      </div>
    );
  }

  return (
    <ProtectedComponent permission="appointments.read">
      <PageContainer className="pb-4 pt-4 text-foreground">
        <div dir={i18n.dir()} className="mx-auto w-full max-w-5xl space-y-6">
          <button
            type="button"
            onClick={() => navigate("/appointments")}
            className="inline-flex items-center gap-2 text-sm text-[var(--lux-text-secondary)] transition-colors hover:text-[var(--lux-gold)]"
          >
            {"<-"}{" "}
            {t("appointments.backToAppointments", {
              defaultValue: "Back to Appointments",
            })}
          </button>

          <div
            className="overflow-hidden rounded-[24px] border p-4 shadow-luxe"
            style={{
              background: "var(--lux-panel-surface)",
              borderColor: "var(--lux-panel-border)",
            }}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-[18px] border"
                  style={{
                    background: "var(--lux-control-hover)",
                    borderColor: "var(--lux-control-border)",
                    color: "var(--lux-gold)",
                  }}
                >
                  <CalendarClock className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-bold text-[var(--lux-heading)]">
                      {appointment.customer?.fullName ||
                        `Appointment #${appointment.id}`}
                    </h1>
                    <AppointmentStatusBadge status={appointment.status} />
                  </div>
                  <p className="text-sm text-[var(--lux-text-secondary)]">
                    {format(
                      new Date(appointment.appointmentDate),
                      "MMM d, yyyy",
                      {
                        locale: dateLocale,
                      },
                    )}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <ProtectedComponent permission="events.create">
                  <Button
                    variant="outline"
                    onClick={() =>
                      navigate(`/events/create?fromAppointmentId=${appointment.id}`)
                    }
                  >
                    <CalendarPlus className="h-4 w-4" />
                    {t("appointments.createEvent", {
                      defaultValue: "Create Event",
                    })}
                  </Button>
                </ProtectedComponent>
                <ProtectedComponent permission="appointments.update">
                  <Button
                    onClick={() =>
                      navigate(`/appointments/edit/${appointment.id}`)
                    }
                  >
                    <Edit className="h-4 w-4" />
                    {t("common.edit", { defaultValue: "Edit" })}
                  </Button>
                </ProtectedComponent>
              </div>
            </div>
          </div>

          <Card className="rounded-[24px] p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <DetailItem
                label={t("appointments.customer", { defaultValue: "Customer" })}
                value={appointment.customer?.fullName}
              />
              <DetailItem
                label={t("customers.mobile", {
                  defaultValue: "Primary Mobile",
                })}
                value={appointment.customer?.mobile}
              />
              <DetailItem
                label={t("appointments.startTime", {
                  defaultValue: "Start Time",
                })}
                value={appointment.startTime}
              />
              <DetailItem
                label={t("appointments.endTime", { defaultValue: "End Time" })}
                value={appointment.endTime}
              />
              <DetailItem
                label={t("appointments.type", { defaultValue: "Type" })}
                value={t(`appointments.typeOptions.${appointment.type}`, {
                  defaultValue: formatAppointmentType(appointment.type),
                })}
              />
              <DetailItem
                label={t("appointments.weddingDate", {
                  defaultValue: "Wedding Date",
                })}
                value={
                  appointment.weddingDate
                    ? format(new Date(appointment.weddingDate), "MMM d, yyyy", {
                        locale: dateLocale,
                      })
                    : null
                }
              />
              <DetailItem
                label={t("appointments.guestCount", {
                  defaultValue: "Guest Count",
                })}
                value={
                  typeof appointment.guestCount === "number"
                    ? String(appointment.guestCount)
                    : null
                }
              />
              <DetailItem
                label={t("appointments.venue", { defaultValue: "Venue" })}
                value={appointment.venue?.name}
              />
              <DetailItem
                label={t("appointments.statusLabel", {
                  defaultValue: "Status",
                })}
                value={t(`appointments.status.${appointment.status}`, {
                  defaultValue: appointment.status,
                })}
              />
              <div className="md:col-span-2">
                <DetailItem
                  label={t("common.notes", { defaultValue: "Notes" })}
                  value={appointment.notes}
                />
              </div>
            </div>
          </Card>
        </div>
      </PageContainer>
    </ProtectedComponent>
  );
};

export default AppointmentDetailsPage;
