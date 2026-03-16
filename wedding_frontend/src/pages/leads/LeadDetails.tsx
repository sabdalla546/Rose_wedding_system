import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import {
  CalendarDays,
  Clock3,
  Edit,
  Phone,
  UserRoundSearch,
} from "lucide-react";
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
import { useLead } from "@/hooks/leads/useLeads";

import { LeadStatusBadge } from "./_components/leadStatusBadge";

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

const LeadDetailsPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: lead, isLoading } = useLead(id);
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

  if (!lead) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-sm text-[var(--lux-text-secondary)]">
          {t("common.noResultsTitle", { defaultValue: "No results found" })}
        </div>
      </div>
    );
  }

  return (
    <ProtectedComponent permission="leads.read">
      <PageContainer className="pb-4 pt-4 text-foreground">
        <div dir={i18n.dir()} className="mx-auto w-full max-w-6xl space-y-6">
          <button
            type="button"
            onClick={() => navigate("/leads")}
            className="inline-flex items-center gap-2 text-sm text-[var(--lux-text-secondary)] transition-colors hover:text-[var(--lux-gold)]"
          >
            {"<-"} {t("leads.backToLeads", { defaultValue: "Back to Leads" })}
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
                  <UserRoundSearch className="h-6 w-6" />
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-bold text-[var(--lux-heading)]">
                      {lead.fullName}
                    </h1>
                    <LeadStatusBadge status={lead.status} />
                  </div>
                  <p className="text-sm text-[var(--lux-text-secondary)]">
                    {lead.email || lead.mobile}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <ProtectedComponent permission="leads.update">
                  <Button onClick={() => navigate(`/leads/edit/${lead.id}`)}>
                    <Edit className="h-4 w-4" />
                    {t("common.edit", { defaultValue: "Edit" })}
                  </Button>
                </ProtectedComponent>
                <ProtectedComponent permission="appointments.create">
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/appointments/create?leadId=${lead.id}`)}
                  >
                    <CalendarDays className="h-4 w-4" />
                    {t("leads.createAppointment", {
                      defaultValue: "Create Appointment",
                    })}
                  </Button>
                </ProtectedComponent>
              </div>
            </div>
          </SectionCard>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>
                  {t("leads.contactDetails", { defaultValue: "Contact Details" })}
                </CardTitle>
                <CardDescription>
                  {t("leads.contactDetailsHint", {
                    defaultValue: "Primary contact data for this lead.",
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <DetailItem
                  label={t("leads.mobile", { defaultValue: "Primary Mobile" })}
                  value={lead.mobile}
                />
                <DetailItem
                  label={t("leads.mobile2", { defaultValue: "Secondary Mobile" })}
                  value={lead.mobile2}
                />
                <DetailItem
                  label={t("leads.email", { defaultValue: "Email" })}
                  value={lead.email}
                />
                <DetailItem
                  label={t("leads.source", { defaultValue: "Source" })}
                  value={lead.source}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  {t("leads.eventProfile", { defaultValue: "Event Profile" })}
                </CardTitle>
                <CardDescription>
                  {t("leads.eventProfileHint", {
                    defaultValue: "Wedding date, venue, and guest volume.",
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <DetailItem
                  label={t("leads.weddingDate", { defaultValue: "Wedding Date" })}
                  value={format(new Date(lead.weddingDate), "MMM d, yyyy", {
                    locale: dateLocale,
                  })}
                />
                <DetailItem
                  label={t("common.venue", { defaultValue: "Venue" })}
                  value={lead.venue?.name || lead.venueNameSnapshot}
                />
                <DetailItem
                  label={t("leads.guestCount", { defaultValue: "Guest Count" })}
                  value={lead.guestCount}
                />
                <DetailItem
                  label={t("leads.convertedCustomer", {
                    defaultValue: "Converted Customer",
                  })}
                  value={
                    lead.customer?.fullName ||
                    (lead.convertedToCustomer ? lead.convertedCustomerId : "-")
                  }
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  {t("leads.auditTrail", { defaultValue: "Audit Trail" })}
                </CardTitle>
                <CardDescription>
                  {t("leads.auditTrailHint", {
                    defaultValue: "Who created and last updated this lead.",
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <DetailItem
                  label={t("leads.createdBy", { defaultValue: "Created By" })}
                  value={lead.createdByUser?.fullName}
                />
                <DetailItem
                  label={t("leads.updatedBy", { defaultValue: "Updated By" })}
                  value={lead.updatedByUser?.fullName}
                />
                <DetailItem
                  label={t("leads.createdAt", { defaultValue: "Created At" })}
                  value={
                    lead.createdAt
                      ? format(new Date(lead.createdAt), "MMM d, yyyy p", {
                          locale: dateLocale,
                        })
                      : "-"
                  }
                />
                <DetailItem
                  label={t("leads.updatedAt", { defaultValue: "Updated At" })}
                  value={
                    lead.updatedAt
                      ? format(new Date(lead.updatedAt), "MMM d, yyyy p", {
                          locale: dateLocale,
                        })
                      : "-"
                  }
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t("common.notes", { defaultValue: "Notes" })}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--lux-text-secondary)]">
                {lead.notes ||
                  t("leads.noNotes", { defaultValue: "No notes added yet." })}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                {t("leads.appointments", { defaultValue: "Appointments" })}
              </CardTitle>
              <CardDescription>
                {t("leads.appointmentsHint", {
                  defaultValue: "Recent appointments linked to this lead.",
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {lead.appointments?.length ? (
                lead.appointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="rounded-[20px] border p-4"
                    style={{
                      background: "var(--lux-row-surface)",
                      borderColor: "var(--lux-row-border)",
                    }}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="inline-flex items-center gap-2 text-sm font-medium text-[var(--lux-text)]">
                            <CalendarDays className="h-4 w-4 text-[var(--lux-gold)]" />
                            {format(
                              new Date(appointment.appointmentDate),
                              "MMM d, yyyy",
                              {
                                locale: dateLocale,
                              },
                            )}
                          </div>
                          <div className="inline-flex items-center gap-2 text-sm text-[var(--lux-text-secondary)]">
                            <Clock3 className="h-4 w-4 text-[var(--lux-gold)]" />
                            {appointment.appointmentStartTime}
                            {appointment.appointmentEndTime
                              ? ` - ${appointment.appointmentEndTime}`
                              : ""}
                          </div>
                        </div>
                        <p className="text-sm text-[var(--lux-text-secondary)]">
                          {appointment.meetingType.replace(/_/g, " ")} |{" "}
                          {appointment.status.replace(/_/g, " ")}
                        </p>
                      </div>

                      {appointment.result ? (
                        <p className="max-w-xl text-sm leading-6 text-[var(--lux-text-secondary)]">
                          {appointment.result}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[var(--lux-text-secondary)]">
                  {t("leads.noAppointments", {
                    defaultValue: "No appointments linked to this lead yet.",
                  })}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                {t("leads.customerLink", { defaultValue: "Linked Customer" })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lead.customer ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <DetailItem
                    label={t("leads.customerName", {
                      defaultValue: "Customer Name",
                    })}
                    value={lead.customer.fullName}
                  />
                  <DetailItem
                    label={t("leads.customerMobile", {
                      defaultValue: "Customer Mobile",
                    })}
                    value={lead.customer.mobile}
                  />
                  <DetailItem
                    label={t("leads.customerStatus", {
                      defaultValue: "Customer Status",
                    })}
                    value={lead.customer.status}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-[var(--lux-text-secondary)]">
                  <Phone className="h-4 w-4 text-[var(--lux-gold)]" />
                  {t("leads.noCustomerLinked", {
                    defaultValue:
                      "This lead has not been converted to a customer yet.",
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </ProtectedComponent>
  );
};

export default LeadDetailsPage;
