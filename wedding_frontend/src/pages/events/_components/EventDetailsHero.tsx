import { format } from "date-fns";
import type { Locale } from "date-fns";
import { CalendarRange, Edit, Link2, Users } from "lucide-react";
import type { TFunction } from "i18next";

import { SummaryCard } from "@/components/dashboard/summary-card";
import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import { CrudPageHeader } from "@/components/shared/crud-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  EventInfoBlock,
  EventMetaChip,
  EventMetricTile,
} from "./EventDetailsPrimitives";
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
};

export function EventDetailsHero({
  event,
  dateLocale,
  t,
  onBack,
  onEdit,
  onViewCustomer,
}: Props) {
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

  return (
    <div className="space-y-5">
      <CrudPageHeader
        backAction={
          <button type="button" onClick={onBack} className="crud-header-back">
            <span aria-hidden="true">←</span>
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
          </>
        }
      />

      <Card className="overflow-hidden border-[var(--lux-gold-border)]/60">
        <CardContent className="space-y-6 p-5 sm:p-6">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 flex-1 space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--lux-text-muted)]">
                <span>{t("events.eventOverview", { defaultValue: "Event Overview" })}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <EventStatusBadge status={event.status} />
                <EventMetaChip
                  label={t("events.eventDate", { defaultValue: "Event Date" })}
                  value={eventDateLabel}
                />
                <EventMetaChip
                  label={t("events.customer", { defaultValue: "Customer" })}
                  value={resolvedCustomerName}
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

              <div className="space-y-3">
                <div className="space-y-2">
                  <h2 className="text-3xl font-semibold leading-[1.15] text-[var(--lux-heading)] sm:text-[2.2rem] xl:text-[2.6rem]">
                    {getEventDisplayTitle(event)}
                  </h2>
                  <p className="max-w-3xl text-sm leading-7 text-[var(--lux-text-secondary)]">
                    {resolvedCustomerName} • {resolvedVenueName}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <EventInfoBlock
                    label={t("events.partyNames", { defaultValue: "Party Names" })}
                    value={partyNames}
                    helper={t("events.partyNamesHint", {
                      defaultValue: "Bride and groom names for operations and planning.",
                    })}
                    compact
                  />
                  <EventInfoBlock
                    label={t("events.auditTrail", { defaultValue: "Audit Trail" })}
                    value={updatedByName}
                    helper={`${t("events.updatedAt", {
                      defaultValue: "Updated At",
                    })}: ${updatedAtLabel}`}
                    compact
                  />
                  <EventInfoBlock
                    label={t("events.statusLabel", { defaultValue: "Status" })}
                    value={t(`events.status.${event.status}`, {
                      defaultValue: event.status,
                    })}
                    helper={`${t("events.eventDate", {
                      defaultValue: "Event Date",
                    })}: ${eventDateLabel}`}
                    compact
                    className="sm:col-span-2 xl:col-span-1"
                  />
                </div>
              </div>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-2 xl:w-[320px] xl:grid-cols-1">
              <EventMetricTile
                label={t("events.customer", { defaultValue: "Customer" })}
                value={resolvedCustomerName}
                helper={`${t("common.venue", { defaultValue: "Venue" })}: ${resolvedVenueName}`}
                className="border-[var(--lux-gold-border)]/50"
              />
              <EventMetricTile
                label={t("events.guestAndAudit", {
                  defaultValue: "Guests & Audit",
                })}
                value={
                  <span className="inline-flex items-center gap-2">
                    <Users className="h-4 w-4 text-[var(--lux-text-muted)]" />
                    {event.guestCount ?? "-"}
                  </span>
                }
                helper={`${t("events.updatedBy", { defaultValue: "Updated By" })}: ${updatedByName}`}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label={t("events.eventDate", { defaultValue: "Event Date" })}
              value={eventDateLabel}
              hint={
                t("events.statusLabel", { defaultValue: "Status" }) +
                `: ${t(`events.status.${event.status}`, {
                  defaultValue: event.status,
                })}`
              }
              className="min-h-[170px]"
            />
            <SummaryCard
              label={t("events.customer", { defaultValue: "Customer" })}
              value={event.customer?.fullName || "-"}
              hint={
                t("common.venue", { defaultValue: "Venue" }) +
                `: ${event.venue?.name || event.venueNameSnapshot || "-"}`
              }
              className="min-h-[170px]"
            />
            <SummaryCard
              label={t("events.partyNames", { defaultValue: "Party Names" })}
              value={partyNames}
              hint={
                t("events.guestCount", { defaultValue: "Guest Count" }) +
                `: ${event.guestCount ?? "-"}`
              }
              className="min-h-[170px]"
            />
            <SummaryCard
              label={t("events.auditTrail", { defaultValue: "Audit Trail" })}
              value={updatedByName}
              hint={
                t("events.updatedAt", { defaultValue: "Updated At" }) +
                `: ${updatedAtLabel}`
              }
              className="min-h-[170px]"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>
                  {t("events.generalInfo", { defaultValue: "General Info" })}
                </CardTitle>
                <CardDescription>
                  {t("events.generalInfoCardHint", {
                    defaultValue:
                      "Core event details, planning names, and contract information.",
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <EventInfoBlock
                  label={t("events.eventDate", { defaultValue: "Event Date" })}
                  value={eventDateLabel}
                />
                <EventInfoBlock
                  label={t("events.titleField", { defaultValue: "Title" })}
                  value={event.title}
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
                  value={event.guestCount}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  {t("events.linkedRecords", { defaultValue: "Linked Records" })}
                </CardTitle>
                <CardDescription>
                  {t("events.linkedRecordsCardHint", {
                    defaultValue: "Customer, venue, and current event status.",
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <EventInfoBlock
                  label={t("events.customer", { defaultValue: "Customer" })}
                  value={event.customer?.fullName}
                />
                <EventInfoBlock
                  label={t("common.venue", { defaultValue: "Venue" })}
                  value={event.venue?.name || event.venueNameSnapshot}
                />
                <EventInfoBlock
                  label={t("events.statusLabel", { defaultValue: "Status" })}
                  value={t(`events.status.${event.status}`, {
                    defaultValue: event.status,
                  })}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  {t("events.auditTrail", { defaultValue: "Audit Trail" })}
                </CardTitle>
                <CardDescription>
                  {t("events.auditTrailHint", {
                    defaultValue:
                      "Who created the event and when it was last updated.",
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <EventInfoBlock
                  label={t("events.createdBy", { defaultValue: "Created By" })}
                  value={event.createdByUser?.fullName}
                />
                <EventInfoBlock
                  label={t("events.updatedBy", { defaultValue: "Updated By" })}
                  value={event.updatedByUser?.fullName}
                />
                <EventInfoBlock
                  label={t("events.createdAt", { defaultValue: "Created At" })}
                  value={
                    event.createdAt
                      ? format(new Date(event.createdAt), "PPP p", {
                          locale: dateLocale,
                        })
                      : "-"
                  }
                />
                <EventInfoBlock
                  label={t("events.updatedAt", { defaultValue: "Updated At" })}
                  value={
                    event.updatedAt
                      ? format(new Date(event.updatedAt), "PPP p", {
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
              <p className="whitespace-pre-wrap rounded-[20px] border border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)] px-4 py-4 text-sm leading-7 text-[var(--lux-text-secondary)]">
                {event.notes ||
                  t("events.noNotes", {
                    defaultValue: "No notes added yet.",
                  })}
              </p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
