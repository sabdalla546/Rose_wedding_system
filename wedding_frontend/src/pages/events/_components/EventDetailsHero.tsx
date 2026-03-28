import { AnimatePresence, motion } from "framer-motion";
import { format } from "date-fns";
import type { Locale } from "date-fns";
import { CalendarRange, ChevronDown, Edit, Link2 } from "lucide-react";
import type { TFunction } from "i18next";
import { useState } from "react";

import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import { CrudPageHeader } from "@/components/shared/crud-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EventInfoBlock, EventMetaChip } from "./EventDetailsPrimitives";
import { EventStatusBadge } from "./eventStatusBadge";
import { getEventDisplayTitle } from "../adapters";
import type { Event } from "../types";

type Props = {
  event: Event;
  dateLocale: Locale;
  t: TFunction;
  onBack: () => void;
  onEdit: () => void;
  onViewCustomer?: () => void;
  onViewSourceAppointment?: () => void;
};

export function EventDetailsHero({
  event,
  dateLocale,
  t,
  onBack,
  onEdit,
  onViewCustomer,
  onViewSourceAppointment,
}: Props) {
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(true);

  const eventDateLabel = format(new Date(event.eventDate), "PPP", {
    locale: dateLocale,
  });
  const partyNames =
    [event.groomName, event.brideName].filter(Boolean).join(" / ") || "-";
  const resolvedCustomerName =
    event.customer?.fullName ||
    t("events.noCustomerLinked", {
      defaultValue: "No customer linked",
    });
  const resolvedVenueName =
    event.venue?.name ||
    event.venueNameSnapshot ||
    t("events.noVenueLinked", {
      defaultValue: "No venue linked",
    });
  const updatedByName =
    event.updatedByUser?.fullName || event.createdByUser?.fullName || "-";
  const updatedAtLabel = event.updatedAt
    ? format(new Date(event.updatedAt), "PPP", {
        locale: dateLocale,
      })
    : "-";
  const createdAtLabel = event.createdAt
    ? format(new Date(event.createdAt), "PPP p", {
        locale: dateLocale,
      })
    : "-";
  const statusLabel = t(`events.status.${event.status}`, {
    defaultValue: event.status,
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

  return (
    <div className="space-y-5">
      <CrudPageHeader
        backAction={
          <button type="button" onClick={onBack} className="crud-header-back">
            <span aria-hidden="true">{"<-"}</span>
            {t("events.backToEvents", { defaultValue: "Back to Events" })}
          </button>
        }
        icon={<CalendarRange className="h-5 w-5 text-primary" />}
        title={getEventDisplayTitle(event)}
        description={eventDateLabel}
        meta={<EventStatusBadge status={event.status} />}
        actions={
          <>
            <ProtectedComponent permission="events.update">
              <Button onClick={onEdit}>
                <Edit className="h-4 w-4" />
                {t("common.edit", { defaultValue: "Edit" })}
              </Button>
            </ProtectedComponent>
            {event.customerId && onViewCustomer ? (
              <ProtectedComponent permission="customers.read">
                <Button variant="outline" onClick={onViewCustomer}>
                  <Link2 className="h-4 w-4" />
                  {t("events.viewCustomer", { defaultValue: "View Customer" })}
                </Button>
              </ProtectedComponent>
            ) : null}
            {event.sourceAppointmentId && onViewSourceAppointment ? (
              <ProtectedComponent permission="appointments.read">
                <Button variant="outline" onClick={onViewSourceAppointment}>
                  <Link2 className="h-4 w-4" />
                  {t("events.viewSourceAppointment", {
                    defaultValue: "View Source Appointment",
                  })}
                </Button>
              </ProtectedComponent>
            ) : null}
          </>
        }
      />

      <Card className="overflow-hidden border-[var(--lux-gold-border)]/60">
        <CardContent className="p-0">
          <div className="border-b border-[var(--lux-row-border)] px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--lux-text-muted)]">
                      {t("events.eventOverview", { defaultValue: "Event Overview" })}
                    </p>
                    <h2 className="text-3xl font-semibold leading-[1.15] text-[var(--lux-heading)] sm:text-[2.1rem]">
                      {getEventDisplayTitle(event)}
                    </h2>
                    <p className="max-w-3xl text-sm leading-7 text-[var(--lux-text-secondary)]">
                      {resolvedCustomerName} • {resolvedVenueName}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsOverviewExpanded((current) => !current)}
                    className="shrink-0"
                  >
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        isOverviewExpanded ? "rotate-180" : ""
                      }`}
                    />
                    {isOverviewExpanded
                      ? t("events.collapseOverview", {
                          defaultValue: "Collapse",
                        })
                      : t("events.expandOverview", {
                          defaultValue: "Expand",
                        })}
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <EventStatusBadge status={event.status} />
                  <EventMetaChip
                    label={t("events.eventDate", { defaultValue: "Event Date" })}
                    value={eventDateLabel}
                  />
                  <EventMetaChip
                    label={t("common.venue", { defaultValue: "Venue" })}
                    value={resolvedVenueName}
                  />
                  {typeof event.guestCount === "number" ? (
                    <EventMetaChip
                      label={t("events.guestCount", { defaultValue: "Guest Count" })}
                      value={event.guestCount}
                    />
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <AnimatePresence initial={false}>
            {isOverviewExpanded ? (
              <motion.div
                key="event-overview-content"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="space-y-4 px-5 py-5 sm:px-6">
                  <div className="grid gap-4 xl:grid-cols-3">
                    <EventInfoBlock
                      label={t("events.partyNames", { defaultValue: "Party Names" })}
                      value={partyNames}
                      helper={t("events.partyNamesHint", {
                        defaultValue: "Bride and groom names for operations and planning.",
                      })}
                    />
                    <EventInfoBlock
                      label={t("events.customer", { defaultValue: "Customer" })}
                      value={resolvedCustomerName}
                      helper={`${t("common.venue", {
                        defaultValue: "Venue",
                      })}: ${resolvedVenueName}`}
                    />
                    <EventInfoBlock
                      label={t("events.auditTrail", { defaultValue: "Audit Trail" })}
                      value={updatedByName}
                      helper={`${t("events.updatedAt", {
                        defaultValue: "Updated At",
                      })}: ${updatedAtLabel}`}
                    />
                  </div>

                  <div className="grid gap-4 xl:grid-cols-2">
                    <div className="rounded-[22px] border border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)] p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
                        {t("events.generalInfo", { defaultValue: "General Info" })}
                      </p>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <EventInfoBlock
                          label={t("events.statusLabel", { defaultValue: "Status" })}
                          value={statusLabel}
                          compact
                        />
                        <EventInfoBlock
                          label={t("events.titleField", { defaultValue: "Title" })}
                          value={event.title}
                          compact
                        />
                        <EventInfoBlock
                          label={t("events.groomName", { defaultValue: "Groom Name" })}
                          value={event.groomName}
                          compact
                        />
                        <EventInfoBlock
                          label={t("events.brideName", { defaultValue: "Bride Name" })}
                          value={event.brideName}
                          compact
                        />
                      </div>
                    </div>

                    <div className="rounded-[22px] border border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)] p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
                        {t("events.auditTrail", { defaultValue: "Audit Trail" })}
                      </p>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <EventInfoBlock
                          label={t("events.createdBy", { defaultValue: "Created By" })}
                          value={event.createdByUser?.fullName}
                          compact
                        />
                        <EventInfoBlock
                          label={t("events.updatedBy", { defaultValue: "Updated By" })}
                          value={event.updatedByUser?.fullName}
                          compact
                        />
                        <EventInfoBlock
                          label={t("events.createdAt", { defaultValue: "Created At" })}
                          value={createdAtLabel}
                          compact
                        />
                        <EventInfoBlock
                          label={t("events.updatedAt", { defaultValue: "Updated At" })}
                          value={updatedAtLabel}
                          compact
                        />
                      </div>
                    </div>

                    {event.sourceAppointmentId ? (
                      <div className="rounded-[22px] border border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)] p-4 xl:col-span-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
                          {t("events.sourceAppointment", {
                            defaultValue: "Source Appointment",
                          })}
                        </p>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          <EventInfoBlock
                            label={t("events.sourceAppointment", {
                              defaultValue: "Source Appointment",
                            })}
                            value={`#${event.sourceAppointmentId}`}
                            compact
                          />
                          <EventInfoBlock
                            label={t("appointments.customer", {
                              defaultValue: "Customer",
                            })}
                            value={event.sourceAppointment?.customer?.fullName}
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
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {event.notes ? (
                    <div className="rounded-[22px] border border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)] p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
                        {t("common.notes", { defaultValue: "Notes" })}
                      </p>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--lux-text-secondary)]">
                        {event.notes}
                      </p>
                    </div>
                  ) : null}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
