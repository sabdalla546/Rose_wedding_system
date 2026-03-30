import { format } from "date-fns";
import type { Locale } from "date-fns";
import type { TFunction } from "i18next";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Event, EventSection } from "@/pages/events/types";
import {
  EventEmptyState,
  EventInfoBlock,
  EventPanelCard,
} from "./EventDetailsPrimitives";
import { EventSectionsPanel } from "./EventSectionsPanel";

type Props = {
  event: Event;
  sections: EventSection[];
  dateLocale: Locale;
  t: TFunction;
  onAddSection: () => void;
  onEditSection: (section: EventSection) => void;
  onDeleteSection: (section: EventSection) => void;
};

export function EventOverviewWorkspace({
  event,
  sections,
  dateLocale,
  t,
  onAddSection,
  onEditSection,
  onDeleteSection,
}: Props) {
  const eventDateLabel = format(new Date(event.eventDate), "PPP", {
    locale: dateLocale,
  });
  const sourceAppointmentDateLabel = event.sourceAppointment?.appointmentDate
    ? format(new Date(event.sourceAppointment.appointmentDate), "PPP", {
        locale: dateLocale,
      })
    : "-";
  const sourceWeddingDateLabel = event.sourceAppointment?.weddingDate
    ? format(new Date(event.sourceAppointment.weddingDate), "PPP", {
        locale: dateLocale,
      })
    : "-";
  const eventStatusLabel = t(`events.status.${event.status}`, {
    defaultValue: event.status,
  });
  const venueLocation = [event.venue?.area, event.venue?.city]
    .filter(Boolean)
    .join(" • ");

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <EventPanelCard className="space-y-5">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--lux-text-muted)]">
              {t("events.overviewTab", { defaultValue: "Overview" })}
            </p>
            <h3 className="text-2xl font-semibold text-[var(--lux-heading)]">
              {t("events.overviewMainInfo", {
                defaultValue: "Main Event Information",
              })}
            </h3>
            <p className="text-sm leading-7 text-[var(--lux-text-secondary)]">
              {t("events.overviewMainInfoHint", {
                defaultValue:
                  "Review the customer, wedding details, venue context, guest profile, and notes from one place.",
              })}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <EventInfoBlock
              label={t("events.titleField", { defaultValue: "Title" })}
              value={event.title}
            />
            <EventInfoBlock
              label={t("events.eventDate", { defaultValue: "Event Date" })}
              value={eventDateLabel}
            />
            <EventInfoBlock
              label={t("events.statusLabel", { defaultValue: "Status" })}
              value={eventStatusLabel}
            />
            <EventInfoBlock
              label={t("events.groomName", { defaultValue: "Groom Name" })}
              value={event.groomName}
            />
            <EventInfoBlock
              label={t("events.brideName", { defaultValue: "Bride Name" })}
              value={event.brideName}
            />
            <EventInfoBlock
              label={t("events.guestCount", { defaultValue: "Guest Count" })}
              value={
                typeof event.guestCount === "number" ? String(event.guestCount) : "-"
              }
            />
          </div>
        </EventPanelCard>

        <Card>
          <CardHeader>
            <CardTitle>
              {t("events.customerAndVenueSnapshot", {
                defaultValue: "Customer and Venue Snapshot",
              })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <EventInfoBlock
              label={t("events.customer", { defaultValue: "Customer" })}
              value={event.customer?.fullName}
              helper={
                [event.customer?.mobile, event.customer?.email]
                  .filter(Boolean)
                  .join(" • ") ||
                t("events.noCustomerLinked", {
                  defaultValue: "No customer linked",
                })
              }
              compact
            />
            <EventInfoBlock
              label={t("common.venue", { defaultValue: "Venue" })}
              value={event.venue?.name || event.venueNameSnapshot}
              helper={
                venueLocation ||
                event.venue?.address ||
                t("events.noVenueLinked", {
                  defaultValue: "No venue linked",
                })
              }
              compact
            />
            <EventInfoBlock
              label={t("common.contact", { defaultValue: "Contact" })}
              value={event.venue?.contactPerson || event.customer?.mobile}
              helper={event.venue?.phone || event.customer?.address}
              compact
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>
              {t("events.sourceAppointment", {
                defaultValue: "Source Appointment",
              })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {event.sourceAppointmentId ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <EventInfoBlock
                  label={t("events.sourceAppointment", {
                    defaultValue: "Source Appointment",
                  })}
                  value={`#${event.sourceAppointmentId}`}
                  compact
                />
                <EventInfoBlock
                  label={t("appointments.appointmentDate", {
                    defaultValue: "Appointment Date",
                  })}
                  value={sourceAppointmentDateLabel}
                  compact
                />
                <EventInfoBlock
                  label={t("appointments.weddingDate", {
                    defaultValue: "Wedding Date",
                  })}
                  value={sourceWeddingDateLabel}
                  compact
                />
                <EventInfoBlock
                  label={t("events.guestCount", { defaultValue: "Guest Count" })}
                  value={
                    typeof event.sourceAppointment?.guestCount === "number"
                      ? String(event.sourceAppointment.guestCount)
                      : "-"
                  }
                  compact
                />
              </div>
            ) : (
              <EventEmptyState
                title={t("events.noSourceAppointmentTitle", {
                  defaultValue: "No source appointment linked",
                })}
                description={t("events.noSourceAppointmentHint", {
                  defaultValue:
                    "This event was created without a linked appointment source.",
                })}
                className="py-8"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("common.notes", { defaultValue: "Notes" })}</CardTitle>
          </CardHeader>
          <CardContent>
            {event.notes ? (
              <div className="rounded-[20px] border border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)] px-4 py-4 text-sm leading-7 text-[var(--lux-text-secondary)]">
                {event.notes}
              </div>
            ) : (
              <EventEmptyState
                title={t("events.noNotes", { defaultValue: "No notes added yet." })}
                description={t("events.notesPlaceholder", {
                  defaultValue:
                    "Add planning notes, reminders, or internal remarks...",
                })}
                className="py-8"
              />
            )}
          </CardContent>
        </Card>
      </div>

      <EventSectionsPanel
        sections={sections}
        t={t}
        onAdd={onAddSection}
        onEdit={onEditSection}
        onDelete={onDeleteSection}
      />
    </div>
  );
}
