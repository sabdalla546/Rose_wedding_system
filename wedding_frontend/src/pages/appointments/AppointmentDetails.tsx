import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { CalendarClock, CalendarPlus, Edit, Link2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { PageContainer } from "@/components/layout/page-container";
import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import { SectionCard } from "@/components/shared/section-card";
import { WorkflowEntityHeader } from "@/components/workflow/workflow-entity-header";
import { WorkflowLineageCard } from "@/components/workflow/workflow-lineage-card";
import { WorkflowLockBanner } from "@/components/workflow/workflow-lock-banner";
import {
  WorkflowNextStepPanel,
  type WorkflowNextStepItem,
} from "@/components/workflow/workflow-next-step-panel";
import { WorkflowTimeline, type WorkflowTimelineItem } from "@/components/workflow/workflow-timeline";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAppointment } from "@/hooks/appointments/useAppointments";
import {
  canConvertAppointmentToEvent,
  getAppointmentConversionState,
  getAppointmentRelatedEvent,
  isAppointmentConverted,
} from "@/lib/workflow/workflow";
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

  const conversionState = getAppointmentConversionState(appointment);
  const canConvert = canConvertAppointmentToEvent(appointment);
  const relatedEvent = getAppointmentRelatedEvent(appointment);
  const converted = isAppointmentConverted(appointment.status);
  const appointmentDateLabel = format(
    new Date(appointment.appointmentDate),
    "MMM d, yyyy",
    { locale: dateLocale },
  );
  const nextSteps: WorkflowNextStepItem[] = [];
  const timelineItems: WorkflowTimelineItem[] = [
    {
      id: "created",
      title: t("appointments.timelineCreated", {
        defaultValue: "Appointment created",
      }),
      description: t("appointments.timelineCreatedHint", {
        defaultValue: "The intake appointment was added to the system.",
      }),
      timestamp: appointment.createdAt ?? appointment.appointmentDate,
      status: "done",
    },
    {
      id: "scheduled",
      title: t("appointments.timelineScheduled", {
        defaultValue: "Appointment scheduled",
      }),
      description: appointmentDateLabel,
      timestamp: appointment.appointmentDate,
      status: "done",
    },
    {
      id: "status-update",
      title: t("appointments.timelineStatusUpdate", {
        defaultValue: "Appointment status updated",
      }),
      description: t(`appointments.status.${appointment.status}`, {
        defaultValue: appointment.status,
      }),
      timestamp: appointment.updatedAt ?? appointment.appointmentDate,
      status:
        appointment.status === "cancelled" || appointment.status === "no_show"
          ? "warning"
          : "current",
    },
  ];

  if (canConvert) {
    nextSteps.push({
      id: "convert",
      title: t("appointments.nextConvertTitle", {
        defaultValue: "Convert this appointment into an event",
      }),
      description: t("appointments.nextConvertHint", {
        defaultValue:
          "The appointment is completed and ready to move into the main workflow as an event.",
      }),
      tone: "default",
      action: (
        <Button
          type="button"
          onClick={() =>
            navigate(`/events/create?fromAppointmentId=${appointment.id}`)
          }
        >
          <CalendarPlus className="h-4 w-4" />
          {t("appointments.convertToEvent", {
            defaultValue: "Convert to Event",
          })}
        </Button>
      ),
    });
  }

  if (relatedEvent) {
    nextSteps.push({
      id: "open-related-event",
      title: t("appointments.nextOpenEventTitle", {
        defaultValue: "Continue from the related event",
      }),
      description: t("appointments.nextOpenEventHint", {
        defaultValue:
          "This appointment has already moved into the event workflow. Use the linked event for commercial and execution follow-up.",
      }),
      tone: "success",
      action: (
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(`/events/${relatedEvent.id}`)}
        >
          <Link2 className="h-4 w-4" />
          {t("appointments.openRelatedEvent", {
            defaultValue: "Open Related Event",
          })}
        </Button>
      ),
    });
    timelineItems.push({
      id: "converted",
      title: t("appointments.timelineConverted", {
        defaultValue: "Converted to event",
      }),
      description: relatedEvent.title || `Event #${relatedEvent.id}`,
      timestamp: appointment.updatedAt,
      status: "done",
    });
  }

  if (appointment.status === "cancelled" || appointment.status === "no_show") {
    nextSteps.push({
      id: "blocked",
      title: t("appointments.nextBlockedTitle", {
        defaultValue: "Workflow is blocked",
      }),
      description: conversionState.message,
      tone: "warning",
    });
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

          <WorkflowEntityHeader
            eyebrow={t("appointments.workflowStage", {
              defaultValue: "Appointment Stage",
            })}
            title={
              appointment.customer?.fullName || `Appointment #${appointment.id}`
            }
            description={`${appointmentDateLabel} • ${t("appointments.type", {
              defaultValue: "Type",
            })}: ${t(`appointments.typeOptions.${appointment.type}`, {
              defaultValue: formatAppointmentType(appointment.type),
            })}`}
            status={<AppointmentStatusBadge status={appointment.status} />}
            actions={
              <>
                <ProtectedComponent permission="events.create">
                  <Button
                    variant={canConvert ? "default" : "outline"}
                    disabled={!canConvert}
                    onClick={() =>
                      navigate(`/events/create?fromAppointmentId=${appointment.id}`)
                    }
                    title={conversionState.message}
                  >
                    <CalendarPlus className="h-4 w-4" />
                    {t("appointments.convertToEvent", {
                      defaultValue: "Convert to Event",
                    })}
                  </Button>
                </ProtectedComponent>
                <ProtectedComponent permission="appointments.update">
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/appointments/edit/${appointment.id}`)}
                  >
                    <Edit className="h-4 w-4" />
                    {t("common.edit", { defaultValue: "Edit" })}
                  </Button>
                </ProtectedComponent>
              </>
            }
          />

          {!canConvert ? (
            <WorkflowLockBanner
              title={t("appointments.conversionRule", {
                defaultValue: "Event Conversion Rule",
              })}
              message={conversionState.message}
            />
          ) : null}

          <WorkflowLineageCard
            title={t("appointments.workflowLineage", {
              defaultValue: "Workflow Lineage",
            })}
            items={[
              {
                label: t("appointments.customer", { defaultValue: "Customer" }),
                value: appointment.customer?.fullName || "-",
                helper: appointment.customer?.mobile || undefined,
              },
              {
                label: t("appointments.eventOutcome", {
                  defaultValue: "Event Outcome",
                }),
                value: relatedEvent ? (
                  <button
                    type="button"
                    onClick={() => navigate(`/events/${relatedEvent.id}`)}
                    className="inline-flex items-center gap-2 text-sm font-medium text-[var(--lux-gold)] hover:underline"
                  >
                    <Link2 className="h-4 w-4" />
                    {relatedEvent.title || `Event #${relatedEvent.id}`}
                  </button>
                ) : converted ? (
                  t("appointments.convertedEventExists", {
                    defaultValue: "Converted event exists in the events workspace.",
                  })
                ) : (
                  t("appointments.noEventYet", {
                    defaultValue: "No event has been created from this appointment yet.",
                  })
                ),
                helper: converted
                  ? t("appointments.convertedOnlyOnce", {
                      defaultValue: "Appointments can only be converted once.",
                    })
                  : t("appointments.readyForWorkflow", {
                      defaultValue: "Use the Convert to Event action when the appointment is completed.",
                    }),
              },
            ]}
          />

          <div className="grid gap-4 xl:grid-cols-2">
            <WorkflowNextStepPanel
              title={t("appointments.nextStepsTitle", {
                defaultValue: "Next Step Guidance",
              })}
              description={t("appointments.nextStepsHint", {
                defaultValue:
                  "See whether this appointment should be converted, monitored, or treated as blocked.",
              })}
              items={nextSteps}
            />

            <WorkflowTimeline
              title={t("appointments.timelineTitle", {
                defaultValue: "Timeline & Action History",
              })}
              description={t("appointments.timelineHint", {
                defaultValue:
                  "This appointment timeline is built from the timestamps currently stored on the record and its related event link.",
              })}
              partialHistoryLabel={t("appointments.timelinePartial", {
                defaultValue:
                  "A full appointment audit log is not available yet, so later status changes are shown from the latest reliable timestamp.",
              })}
              items={timelineItems}
              locale={dateLocale}
            />
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

          <SectionCard className="space-y-3">
            <div className="flex items-start gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-[18px] border"
                style={{
                  background: "var(--lux-control-hover)",
                  borderColor: "var(--lux-control-border)",
                  color: "var(--lux-gold)",
                }}
              >
                <CalendarClock className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-[var(--lux-heading)]">
                  {t("appointments.workflowGuidance", {
                    defaultValue: "Workflow Guidance",
                  })}
                </h2>
                <p className="text-sm text-[var(--lux-text-secondary)]">
                  {converted
                    ? t("appointments.workflowGuidanceConverted", {
                        defaultValue:
                          "This appointment has already moved into the event workflow. Continue the process from the related event workspace.",
                      })
                    : t("appointments.workflowGuidanceOpen", {
                        defaultValue:
                          "Appointments move into the main workflow only after completion. The backend still enforces the one-time conversion rule.",
                      })}
                </p>
              </div>
            </div>
          </SectionCard>
        </div>
      </PageContainer>
    </ProtectedComponent>
  );
};

export default AppointmentDetailsPage;
