import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { CalendarClock, ExternalLink, UserRoundSearch } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { PageContainer } from "@/components/layout/page-container";
import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAppointment } from "@/hooks/appointments/useAppointments";
import { formatMeetingType } from "@/pages/appointments/adapters";

import { AppointmentStatusBadge } from "./_components/appointmentStatusBadge";

function DetailItem({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
        {label}
      </p>
      <p className="text-sm text-[var(--lux-text)]">{value || "-"}</p>
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
    return null;
  }

  return (
    <ProtectedComponent permission="appointments.read">
      <PageContainer className="pb-4 pt-4 text-foreground">
        <div dir={i18n.dir()} className="mx-auto w-full max-w-6xl space-y-6">
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

          <SectionCard className="space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
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
                      {appointment.lead?.fullName || `Appointment #${appointment.id}`}
                    </h1>
                    <AppointmentStatusBadge status={appointment.status} />
                  </div>
                  <p className="text-sm text-[var(--lux-text-secondary)]">
                    {formatMeetingType(appointment.meetingType)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <ProtectedComponent permission="appointments.update">
                  <Button onClick={() => navigate(`/appointments/edit/${appointment.id}`)}>
                    {t("common.edit", { defaultValue: "Edit" })}
                  </Button>
                </ProtectedComponent>
                <ProtectedComponent permission="leads.read">
                  <Button variant="outline" onClick={() => navigate(`/leads/${appointment.leadId}`)}>
                    <UserRoundSearch className="h-4 w-4" />
                    {t("appointments.viewLead", { defaultValue: "View Lead" })}
                  </Button>
                </ProtectedComponent>
                {appointment.lead?.convertedCustomerId ? (
                  <ProtectedComponent permission="customers.read">
                    <Button
                      variant="outline"
                      onClick={() =>
                        navigate(`/customers/${appointment.lead?.convertedCustomerId}`)
                      }
                    >
                      <ExternalLink className="h-4 w-4" />
                      {t("appointments.viewCustomer", {
                        defaultValue: "View Customer",
                      })}
                    </Button>
                  </ProtectedComponent>
                ) : null}
              </div>
            </div>
          </SectionCard>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>{t("appointments.scheduleInformation", { defaultValue: "Schedule Information" })}</CardTitle>
                <CardDescription>{t("appointments.scheduleInformationHint", { defaultValue: "Core schedule details and assignment." })}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <DetailItem label={t("appointments.date", { defaultValue: "Date" })} value={format(new Date(appointment.appointmentDate), "MMM d, yyyy", { locale: dateLocale })} />
                <DetailItem label={t("appointments.startTime", { defaultValue: "Start Time" })} value={appointment.appointmentStartTime} />
                <DetailItem label={t("appointments.endTime", { defaultValue: "End Time" })} value={appointment.appointmentEndTime} />
                <DetailItem label={t("appointments.assignedTo", { defaultValue: "Assigned To" })} value={appointment.assignedToUser?.fullName} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("appointments.leadInformation", { defaultValue: "Lead Information" })}</CardTitle>
                <CardDescription>{t("appointments.leadInformationHint", { defaultValue: "Main lead details linked to this appointment." })}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <DetailItem label={t("appointments.lead", { defaultValue: "Lead" })} value={appointment.lead?.fullName} />
                <DetailItem label={t("common.venue", { defaultValue: "Venue" })} value={appointment.lead?.venue?.name || appointment.lead?.venueNameSnapshot} />
                <DetailItem label={t("appointments.leadMobile", { defaultValue: "Lead Mobile" })} value={appointment.lead?.mobile} />
                <DetailItem label={t("appointments.leadStatus", { defaultValue: "Lead Status" })} value={appointment.lead?.status} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("appointments.outcome", { defaultValue: "Outcome" })}</CardTitle>
                <CardDescription>{t("appointments.outcomeHint", { defaultValue: "Meeting result, notes, and follow-up." })}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <DetailItem label={t("appointments.meetingType", { defaultValue: "Meeting Type" })} value={formatMeetingType(appointment.meetingType)} />
                <DetailItem label={t("appointments.result", { defaultValue: "Result" })} value={appointment.result} />
                <DetailItem label={t("appointments.nextStep", { defaultValue: "Next Step" })} value={appointment.nextStep} />
                <DetailItem label={t("common.notes", { defaultValue: "Notes" })} value={appointment.notes} />
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContainer>
    </ProtectedComponent>
  );
};

export default AppointmentDetailsPage;
