import { CalendarClock, MapPin, NotebookText, UsersRound } from "lucide-react";
import { useTranslation } from "react-i18next";

import { EventTypeBadge } from "@/components/calendar/event-type-badge";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AppDialogFooter, AppDialogHeader } from "@/components/shared/app-dialog";
import { cn, formatDateLabel } from "@/lib/utils";
import { formatEventStatus, getEventDisplayTitle } from "@/pages/events/adapters";
import type { EventCalendarRecord } from "@/pages/events/types";

import { getEventCalendarAccent } from "./event-calendar";

type EventCalendarQuickViewProps = {
  event: EventCalendarRecord | null;
  onView: (event: EventCalendarRecord) => void;
  onEdit: (event: EventCalendarRecord) => void;
  className?: string;
};

type EventCalendarQuickViewDialogProps = EventCalendarQuickViewProps & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function QuickFact({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof CalendarClock;
}) {
  return (
    <div className="app-info-block space-y-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--lux-control-hover)] text-[var(--lux-gold)]">
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--lux-text-muted)]">
        {label}
      </p>
      <p className="text-sm font-medium text-[var(--lux-text)]">{value}</p>
    </div>
  );
}

export function EventCalendarQuickView({
  event,
  onView,
  onEdit,
  className,
}: EventCalendarQuickViewProps) {
  const { t } = useTranslation();

  if (!event) {
    return (
      <SectionCard className={cn("min-h-[420px] justify-center", className)} elevated>
        <div className="app-empty-state min-h-[320px]">
          <div className="app-icon-chip mb-4 h-12 w-12 rounded-full">
            <CalendarClock className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--lux-heading)]">
            {t("events.calendarPage.selectTitle", {
              defaultValue: "Select an event",
            })}
          </h3>
          <p className="mt-2 max-w-sm text-sm text-[var(--lux-text-muted)]">
            {t("events.calendarPage.selectDescription", {
              defaultValue:
                "Choose an event from the calendar to review its planning details.",
            })}
          </p>
        </div>
      </SectionCard>
    );
  }

  const partyNames = [event.groomName, event.brideName].filter(Boolean).join(" / ");
  const venueName = event.venueName || "-";
  const customerName = event.customerName || "-";
  const guestCount = event.guestCount ? String(event.guestCount) : "-";

  return (
    <SectionCard className={cn("overflow-hidden p-0", className)} elevated>
      <div className="border-b px-5 py-4" style={{ borderColor: "var(--lux-row-border)", background: "color-mix(in srgb, var(--lux-control-hover) 55%, transparent)" }}>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--lux-text-muted)]">
              {t("events.calendarPage.quickView", {
                defaultValue: "Event Quick View",
              })}
            </p>
            <div className="space-y-1">
              <h3 className="text-2xl font-semibold text-[var(--lux-heading)]">
                {getEventDisplayTitle(event)}
              </h3>
              <p className="text-sm text-[var(--lux-text-secondary)]">
                {partyNames || customerName}
              </p>
            </div>
          </div>
          <EventTypeBadge
            label={formatEventStatus(event.status)}
            accent={getEventCalendarAccent(event.status)}
          />
        </div>
      </div>

      <div className="space-y-5 px-5 py-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <QuickFact
            label={t("events.eventDate", { defaultValue: "Event Date" })}
            value={formatDateLabel(new Date(event.eventDate), "EEEE, dd MMM yyyy")}
            icon={CalendarClock}
          />
          <QuickFact
            label={t("common.venue", { defaultValue: "Venue" })}
            value={venueName}
            icon={MapPin}
          />
          <QuickFact
            label={t("events.bride", { defaultValue: "Bride" })}
            value={event.brideName || "-"}
            icon={UsersRound}
          />
          <QuickFact
            label={t("events.groom", { defaultValue: "Groom" })}
            value={event.groomName || "-"}
            icon={UsersRound}
          />
          <QuickFact
            label={t("events.customer", { defaultValue: "Customer" })}
            value={customerName}
            icon={UsersRound}
          />
          <QuickFact
            label={t("events.guestCount", { defaultValue: "Guest Count" })}
            value={guestCount}
            icon={NotebookText}
          />
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--lux-text-muted)]">
            {t("common.notes", { defaultValue: "Notes" })}
          </p>
          <div className="app-info-block text-sm leading-6 text-[var(--lux-text-secondary)]">
            {event.notes ||
              t("events.noNotes", { defaultValue: "No notes added." })}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 [&>button]:w-full">
          <Button type="button" onClick={() => onView(event)}>
            {t("events.viewEvent", { defaultValue: "View Event" })}
          </Button>
          <Button type="button" variant="secondary" onClick={() => onEdit(event)}>
            {t("common.edit", { defaultValue: "Edit" })}
          </Button>
        </div>
      </div>
    </SectionCard>
  );
}

export function EventCalendarQuickViewDialog({
  open,
  onOpenChange,
  event,
  onView,
  onEdit,
}: EventCalendarQuickViewDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-1rem)] overflow-y-auto sm:max-w-2xl">
        <AppDialogHeader
          title={t("events.calendarPage.quickView", {
            defaultValue: "Event Quick View",
          })}
          description={t("events.calendarPage.selectDescription", {
            defaultValue:
              "Choose an event from the calendar to review its planning details.",
          })}
        />
        <EventCalendarQuickView
          event={event}
          onView={onView}
          onEdit={onEdit}
          className="border-0 bg-transparent p-0 shadow-none"
        />
        <AppDialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.close", { defaultValue: "Close" })}
          </Button>
        </AppDialogFooter>
      </DialogContent>
    </Dialog>
  );
}
