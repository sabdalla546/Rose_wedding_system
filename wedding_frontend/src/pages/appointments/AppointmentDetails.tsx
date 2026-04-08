import * as React from "react";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import {
  CalendarClock,
  CheckCircle2,
  Edit,
  Link2,
  RefreshCcw,
  XCircle,
} from "lucide-react";
import { useState } from "react";
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
import {
  WorkflowTimeline,
  type WorkflowTimelineItem,
} from "@/components/workflow/workflow-timeline";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { useAppointment } from "@/hooks/appointments/useAppointments";
import {
  useAttendAppointment,
  useCancelAppointment,
  useConfirmAppointment,
  useRescheduleAppointment,
} from "@/hooks/appointments/useAppointmentActions";

import {
  getAppointmentRelatedEvent,
  isAppointmentConverted,
} from "@/lib/workflow/workflow";

import {
  formatAppointmentType,
  normalizeAppointmentStatus,
} from "./adapters";
import { AppointmentStatusBadge } from "./_components/appointmentStatusBadge";

function DetailItem({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-[var(--lux-text-secondary)]">{label}</p>
      <p className="text-sm font-medium text-[var(--lux-text-primary)]">
        {value || "-"}
      </p>
    </div>
  );
}

function getCustomerLabel(
  customer: unknown,
  customerId?: number | string | null,
) {
  if (!customer || typeof customer !== "object") {
    return customerId ? `Customer #${customerId}` : null;
  }

  const record = customer as Record<string, unknown>;

  const direct =
    record.name ??
    record.fullName ??
    record.full_name ??
    record.displayName ??
    record.display_name;

  if (typeof direct === "string" && direct.trim()) {
    return direct;
  }

  const firstName =
    typeof record.firstName === "string"
      ? record.firstName
      : typeof record.first_name === "string"
        ? record.first_name
        : "";

  const lastName =
    typeof record.lastName === "string"
      ? record.lastName
      : typeof record.last_name === "string"
        ? record.last_name
        : "";

  const combined = `${firstName} ${lastName}`.trim();
  if (combined) return combined;

  if (typeof record.email === "string" && record.email.trim()) {
    return record.email;
  }

  return customerId ? `Customer #${customerId}` : null;
}

function getRelatedEventLabel(event: unknown) {
  if (!event || typeof event !== "object") return null;

  const record = event as Record<string, unknown>;

  if (typeof record.title === "string" && record.title.trim()) {
    return record.title;
  }

  if (typeof record.name === "string" && record.name.trim()) {
    return record.name;
  }

  if (typeof record.eventTitle === "string" && record.eventTitle.trim()) {
    return record.eventTitle;
  }

  if (typeof record.id === "number" || typeof record.id === "string") {
    return `Event #${record.id}`;
  }

  return null;
}

function getRelatedEventId(event: unknown): number | string | null {
  if (!event || typeof event !== "object") return null;

  const record = event as Record<string, unknown>;
  if (typeof record.id === "number" || typeof record.id === "string") {
    return record.id;
  }

  return null;
}

const AppointmentDetailsPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();

  const { data: appointment, isLoading } = useAppointment(id);

  const confirmMutation = useConfirmAppointment();
  const attendMutation = useAttendAppointment();
  const cancelMutation = useCancelAppointment();
  const { mutateReschedule, isPending: isRescheduling } =
    useRescheduleAppointment();

  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleStartTime, setRescheduleStartTime] = useState("");
  const [rescheduleEndTime, setRescheduleEndTime] = useState("");
  const [rescheduleNotes, setRescheduleNotes] = useState("");

  const dateLocale = i18n.language === "ar" ? ar : enUS;
  if (isLoading) {
    return (
      <PageContainer>
        <div className="p-6">
          {t("common.loading", { defaultValue: "Loading..." })}
        </div>
      </PageContainer>
    );
  }

  if (!appointment) {
    return (
      <PageContainer>
        <div className="p-6">
          {t("common.not_found", { defaultValue: "Not found" })}
        </div>
      </PageContainer>
    );
  }

  const normalizedStatus = normalizeAppointmentStatus(appointment.status);
  const relatedEvent = getAppointmentRelatedEvent(appointment);
  const relatedEventId = getRelatedEventId(relatedEvent);
  const relatedEventLabel = getRelatedEventLabel(relatedEvent);
  const customerLabel = getCustomerLabel(
    appointment.customer,
    appointment.customerId,
  );

  const converted =
    isAppointmentConverted(appointment.status) ||
    normalizedStatus === "converted" ||
    Boolean(relatedEvent);

  const appointmentDateLabel = format(
    new Date(appointment.appointmentDate),
    "MMM d, yyyy",
    { locale: dateLocale },
  );

  const canConfirm = normalizedStatus === "reserved";
  const canAttend =
    normalizedStatus === "reserved" || normalizedStatus === "attended";
  const canCancel =
    normalizedStatus !== "cancelled" &&
    normalizedStatus !== "no_show" &&
    normalizedStatus !== "converted";
  const canReschedule =
    normalizedStatus !== "cancelled" &&
    normalizedStatus !== "no_show" &&
    normalizedStatus !== "converted";

  let workflowMessage = "";

  if (relatedEvent || converted) {
    workflowMessage = t("appointments.workflowGuidanceConverted", {
      defaultValue:
        "This appointment has already moved into the event workflow. Continue the process from the related event workspace.",
    });
  } else if (
    normalizedStatus === "cancelled" ||
    normalizedStatus === "no_show"
  ) {
    workflowMessage = t("appointments.workflowBlockedMessage", {
      defaultValue: "This appointment is no longer active in the workflow.",
    });
  } else if (normalizedStatus === "attended") {
    workflowMessage = t("appointments.workflowGuidanceAttended", {
      defaultValue:
        "This appointment was marked as attended. The backend workflow should create the related event automatically.",
    });
  } else {
    workflowMessage = t("appointments.workflowGuidanceOpen", {
      defaultValue:
        "Use the workflow actions below to confirm, attend, cancel, or reschedule the appointment.",
    });
  }

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
      description: t(`appointments.status.${normalizedStatus}`, {
        defaultValue: normalizedStatus,
      }),
      timestamp: appointment.updatedAt ?? appointment.appointmentDate,
      status:
        normalizedStatus === "cancelled" || normalizedStatus === "no_show"
          ? "warning"
          : "current",
    },
  ];

  if (relatedEvent) {
    timelineItems.push({
      id: "converted",
      title: t("appointments.timelineConverted", {
        defaultValue: "Converted to event",
      }),
      description:
        relatedEventLabel ||
        t("appointments.relatedEvent", {
          defaultValue: "Related Event",
        }),
      timestamp: appointment.updatedAt ?? appointment.appointmentDate,
      status: "done",
    });
  }

  const nextSteps: WorkflowNextStepItem[] = [];

  if (relatedEvent && relatedEventId) {
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
          onClick={() => navigate(`/events/${relatedEventId}`)}
          className="gap-2"
        >
          <Link2 className="h-4 w-4" />
          {t("appointments.openRelatedEvent", {
            defaultValue: "Open Related Event",
          })}
        </Button>
      ),
    });
  } else if (
    normalizedStatus === "cancelled" ||
    normalizedStatus === "no_show"
  ) {
    nextSteps.push({
      id: "blocked",
      title: t("appointments.nextBlockedTitle", {
        defaultValue: "Workflow is blocked",
      }),
      description: workflowMessage,
      tone: "warning",
    });
  } else if (normalizedStatus === "attended") {
    nextSteps.push({
      id: "await-event",
      title: t("appointments.nextAwaitEventTitle", {
        defaultValue: "Continue from the event workspace",
      }),
      description: t("appointments.nextAwaitEventHint", {
        defaultValue:
          "After attendance, the related event should be created automatically by the backend workflow.",
      }),
      tone: "default",
    });
  } else {
    nextSteps.push(
      {
        id: "confirm",
        title: t("appointments.nextConfirmTitle", {
          defaultValue: "Confirm this appointment",
        }),
        description: t("appointments.nextConfirmHint", {
          defaultValue:
            "Use confirm when the appointment is finalized and ready for follow-up.",
        }),
        tone: "default",
        action: canConfirm ? (
          <ProtectedComponent permission="appointments.confirm">
            <Button
              className="gap-2"
              disabled={confirmMutation.isPending}
              onClick={() =>
                confirmMutation.mutate({
                  id: Number(appointment.id),
                  values: {},
                })
              }
            >
              <CheckCircle2 className="h-4 w-4" />
              {t("appointments.confirmAppointment", {
                defaultValue: "Confirm Appointment",
              })}
            </Button>
          </ProtectedComponent>
        ) : undefined,
      },
      {
        id: "attend",
        title: t("appointments.nextAttendTitle", {
          defaultValue: "Mark as attended",
        }),
        description: t("appointments.nextAttendHint", {
          defaultValue:
            "When marked as attended, the backend workflow should create the related event automatically.",
        }),
        tone: "default",
        action: canAttend ? (
          <ProtectedComponent permission="appointments.update">
            <Button
              className="gap-2"
              disabled={attendMutation.isPending}
              onClick={() =>
                attendMutation.mutate({
                  id: Number(appointment.id),
                  values: {},
                })
              }
            >
              <CalendarClock className="h-4 w-4" />
              {t("appointments.markAsAttended", {
                defaultValue: "Mark as Attended",
              })}
            </Button>
          </ProtectedComponent>
        ) : undefined,
      },
    );
  }

  const openRescheduleDialog = () => {
    setRescheduleDate(appointment.appointmentDate?.slice(0, 10) || "");
    setRescheduleStartTime(appointment.startTime || "");
    setRescheduleEndTime(appointment.endTime || "");
    setRescheduleNotes(appointment.notes || "");
    setRescheduleOpen(true);
  };

  const submitReschedule = () => {
    if (!rescheduleDate || !rescheduleStartTime) return;

    mutateReschedule({
      id: Number(appointment.id),
      values: {
        appointmentDate: rescheduleDate,
        startTime: rescheduleStartTime,
        endTime: rescheduleEndTime || undefined,
        notes: rescheduleNotes || undefined,
      },
    });

    setRescheduleOpen(false);
  };

  const eventStatusText =
    relatedEvent && relatedEventId ? (
      <button
        type="button"
        onClick={() => navigate(`/events/${relatedEventId}`)}
        className="inline-flex items-center gap-2 text-sm font-medium text-[var(--lux-gold)] hover:underline"
      >
        <Link2 className="h-4 w-4" />
        {relatedEventLabel || `Event #${relatedEventId}`}
      </button>
    ) : converted ? (
      t("appointments.convertedEventExists", {
        defaultValue: "Converted event exists in the events workspace.",
      })
    ) : (
      t("appointments.noEventYet", {
        defaultValue: "No event has been created from this appointment yet.",
      })
    );

  return (
    <PageContainer>
      <div className="space-y-6">
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
          title={customerLabel || `Appointment #${appointment.id}`}
          description={t("appointments.detailsSubtitle", {
            defaultValue: "Appointment details and workflow actions",
          })}
          status={<AppointmentStatusBadge status={normalizedStatus} />}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {relatedEventId ? (
                <ProtectedComponent permission="events.read">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => navigate(`/events/${relatedEventId}`)}
                  >
                    <Link2 className="h-4 w-4" />
                    {t("appointments.openRelatedEvent", {
                      defaultValue: "Open Related Event",
                    })}
                  </Button>
                </ProtectedComponent>
              ) : null}

              {canConfirm ? (
                <ProtectedComponent permission="appointments.confirm">
                  <Button
                    variant="outline"
                    className="gap-2"
                    disabled={confirmMutation.isPending}
                    onClick={() =>
                      confirmMutation.mutate({
                        id: Number(appointment.id),
                        values: {},
                      })
                    }
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {t("appointments.confirmAppointment", {
                      defaultValue: "Confirm",
                    })}
                  </Button>
                </ProtectedComponent>
              ) : null}

              {!converted &&
              normalizedStatus !== "cancelled" &&
              normalizedStatus !== "no_show" ? (
                <ProtectedComponent permission="appointments.update">
                  <Button
                    variant="outline"
                    className="gap-2"
                    disabled={attendMutation.isPending}
                    onClick={() =>
                      attendMutation.mutate({
                        id: Number(appointment.id),
                        values: {},
                      })
                    }
                  >
                    <CalendarClock className="h-4 w-4" />
                    {t("appointments.markAsAttended", {
                      defaultValue: "Attend",
                    })}
                  </Button>
                </ProtectedComponent>
              ) : null}

              {canReschedule ? (
                <ProtectedComponent permission="appointments.reschedule">
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={openRescheduleDialog}
                  >
                    <RefreshCcw className="h-4 w-4" />
                    {t("appointments.rescheduleAppointment", {
                      defaultValue: "Reschedule",
                    })}
                  </Button>
                </ProtectedComponent>
              ) : null}

              {canCancel ? (
                <ProtectedComponent permission="appointments.cancel">
                  <Button
                    variant="outline"
                    className="gap-2"
                    disabled={cancelMutation.isPending}
                    onClick={() =>
                      cancelMutation.mutate({
                        id: Number(appointment.id),
                        values: {},
                      })
                    }
                  >
                    <XCircle className="h-4 w-4" />
                    {t("appointments.cancelAppointment", {
                      defaultValue: "Cancel",
                    })}
                  </Button>
                </ProtectedComponent>
              ) : null}

              <ProtectedComponent permission="appointments.update">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() =>
                    navigate(`/appointments/edit/${appointment.id}`)
                  }
                >
                  <Edit className="h-4 w-4" />
                  {t("common.edit", { defaultValue: "Edit" })}
                </Button>
              </ProtectedComponent>
            </div>
          }
        />

        {normalizedStatus === "cancelled" || normalizedStatus === "no_show" ? (
          <WorkflowLockBanner
            title={t("appointments.workflowBlockedTitle", {
              defaultValue: "Appointment workflow is blocked",
            })}
            message={workflowMessage}
          />
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="space-y-6">
            <SectionCard
              title={t("appointments.details", {
                defaultValue: "Appointment Details",
              })}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <DetailItem
                  label={t("appointments.customer", {
                    defaultValue: "Customer",
                  })}
                  value={customerLabel}
                />
                <DetailItem
                  label={t("appointments.type", { defaultValue: "Type" })}
                  value={formatAppointmentType(appointment.type, t)}
                />
                <DetailItem
                  label={t("appointments.date", { defaultValue: "Date" })}
                  value={appointmentDateLabel}
                />
                <DetailItem
                  label={t("appointments.time", { defaultValue: "Time" })}
                  value={
                    appointment.startTime
                      ? `${appointment.startTime}${appointment.endTime ? ` - ${appointment.endTime}` : ""}`
                      : "-"
                  }
                />
                <DetailItem
                  label={t("appointments.weddingDate", {
                    defaultValue: "Wedding Date",
                  })}
                  value={
                    appointment.weddingDate
                      ? format(
                          new Date(appointment.weddingDate),
                          "MMM d, yyyy",
                          {
                            locale: dateLocale,
                          },
                        )
                      : "-"
                  }
                />
                <DetailItem
                  label={t("appointments.guestCount", {
                    defaultValue: "Guest Count",
                  })}
                  value={
                    appointment.guestCount != null
                      ? String(appointment.guestCount)
                      : "-"
                  }
                />
                <DetailItem
                  label={t("appointments.venue", { defaultValue: "Venue" })}
                  value={appointment.venue?.name ?? null}
                />
                <DetailItem
                  label={t("appointments.status", { defaultValue: "Status" })}
                  value={t(`appointments.status.${normalizedStatus}`, {
                    defaultValue: normalizedStatus,
                  })}
                />
              </div>

              <div className="mt-4">
                <DetailItem
                  label={t("appointments.notes", { defaultValue: "Notes" })}
                  value={appointment.notes}
                />
              </div>
            </SectionCard>

            <WorkflowTimeline
              title={t("appointments.workflowTimeline", {
                defaultValue: "Workflow Timeline",
              })}
              items={timelineItems}
            />
          </div>

          <div className="space-y-6">
            <WorkflowNextStepPanel
              title={t("appointments.nextSteps", {
                defaultValue: "Next Steps",
              })}
              items={nextSteps}
            />

            <WorkflowLineageCard
              title={t("appointments.workflowLinkage", {
                defaultValue: "Workflow Linkage",
              })}
              items={[
                {
                  label: t("appointments.relatedEvent", {
                    defaultValue: "Related Event",
                  }),
                  value: eventStatusText,
                  helper: relatedEvent
                    ? t("appointments.relatedEventHelper", {
                        defaultValue:
                          "Use the event workspace for quotation, contract, and execution follow-up.",
                      })
                    : t("appointments.relatedEventMissingHelper", {
                        defaultValue:
                          "The related event will appear here after the appointment moves forward in the workflow.",
                      }),
                },
              ]}
            />

            <Card className="p-5">
              <h3 className="text-base font-semibold text-[var(--lux-text-primary)]">
                {t("appointments.workflowGuidance", {
                  defaultValue: "Workflow Guidance",
                })}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--lux-text-secondary)]">
                {workflowMessage}
              </p>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("appointments.rescheduleAppointment", {
                defaultValue: "Reschedule Appointment",
              })}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="appointmentDate">
                {t("appointments.date", { defaultValue: "Date" })}
              </Label>
              <Input
                id="appointmentDate"
                type="date"
                value={rescheduleDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setRescheduleDate(e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startTime">
                {t("appointments.startTime", { defaultValue: "Start Time" })}
              </Label>
              <Input
                id="startTime"
                type="time"
                value={rescheduleStartTime}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setRescheduleStartTime(e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">
                {t("appointments.endTime", { defaultValue: "End Time" })}
              </Label>
              <Input
                id="endTime"
                type="time"
                value={rescheduleEndTime}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setRescheduleEndTime(e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">
                {t("appointments.notes", { defaultValue: "Notes" })}
              </Label>
              <Textarea
                id="notes"
                value={rescheduleNotes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setRescheduleNotes(e.target.value)
                }
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleOpen(false)}>
              {t("common.cancel", { defaultValue: "Cancel" })}
            </Button>
            <Button onClick={submitReschedule} disabled={isRescheduling}>
              {t("common.save", { defaultValue: "Save" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
};

export default AppointmentDetailsPage;
