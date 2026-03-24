import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin, { type DateClickArg } from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import timeGridPlugin from "@fullcalendar/timegrid";
import arLocale from "@fullcalendar/core/locales/ar";
import type {
  DatesSetArg,
  EventClickArg,
  EventContentArg,
  EventInput,
} from "@fullcalendar/core";

import { SectionCard } from "@/components/shared/section-card";

import { CalendarEmptyState } from "./calendar-empty-state";
import { CalendarLegend } from "./calendar-legend";
import { CalendarLoadingState } from "./calendar-loading-state";
import { CalendarToolbar } from "./calendar-toolbar";
import type {
  AppCalendarEvent,
  AppCalendarLegendItem,
  AppCalendarRange,
  AppCalendarView,
} from "./types";

type AppCalendarProps = {
  events: AppCalendarEvent[];
  initialView?: AppCalendarView;
  initialDate?: Date;
  locale?: "ar" | "en";
  loading?: boolean;
  legends?: AppCalendarLegendItem[];
  emptyTitle?: string;
  emptyDescription?: string;
  onEventSelect?: (event: AppCalendarEvent) => void;
  onDateSelect?: (date: Date) => void;
  onRangeChange?: (range: AppCalendarRange) => void;
  actions?: ReactNode;
  className?: string;
};

type CalendarExtendedProps = Omit<AppCalendarEvent, "id" | "title" | "start" | "end" | "allDay">;

function viewToFullCalendarView(view: AppCalendarView) {
  switch (view) {
    case "week":
      return "timeGridWeek";
    case "day":
      return "timeGridDay";
    case "list":
      return "listWeek";
    case "month":
    default:
      return "dayGridMonth";
  }
}

function fullCalendarViewToAppView(viewType: string): AppCalendarView {
  switch (viewType) {
    case "timeGridWeek":
      return "week";
    case "timeGridDay":
      return "day";
    case "listWeek":
      return "list";
    case "dayGridMonth":
    default:
      return "month";
  }
}

function toEventInputs(events: AppCalendarEvent[]): EventInput[] {
  return events.map((event) => ({
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    allDay: event.allDay,
    extendedProps: {
      accent: event.accent ?? "slate",
      statusLabel: event.statusLabel,
      typeLabel: event.typeLabel,
      subtitle: event.subtitle,
      description: event.description,
      location: event.location,
      raw: event.raw,
    } satisfies CalendarExtendedProps,
  }));
}

function renderEventContent(content: EventContentArg) {
  const accent =
    ((content.event.extendedProps as CalendarExtendedProps).accent ?? "slate") as string;

  return (
    <div className={`app-calendar-event app-calendar-event--${accent}`}>
      <div className="app-calendar-event__time">{content.timeText}</div>
      <div className="app-calendar-event__title">{content.event.title}</div>
      {(content.event.extendedProps as CalendarExtendedProps).subtitle ? (
        <div className="app-calendar-event__meta">
          {(content.event.extendedProps as CalendarExtendedProps).subtitle}
        </div>
      ) : null}
    </div>
  );
}

export function AppCalendar({
  events,
  initialView = "month",
  initialDate = new Date(),
  locale = "en",
  loading = false,
  legends = [],
  emptyTitle,
  emptyDescription,
  onEventSelect,
  onDateSelect,
  onRangeChange,
  actions,
  className,
}: AppCalendarProps) {
  const calendarRef = useRef<FullCalendar | null>(null);
  const [currentView, setCurrentView] = useState<AppCalendarView>(initialView);
  const [currentTitle, setCurrentTitle] = useState("");

  const eventInputs = useMemo(() => toEventInputs(events), [events]);

  useEffect(() => {
    const api = calendarRef.current?.getApi();

    if (!api) {
      return;
    }

    const nextView = viewToFullCalendarView(currentView);

    if (api.view.type !== nextView) {
      api.changeView(nextView);
    }
  }, [currentView]);

  const handleDatesSet = (arg: DatesSetArg) => {
    const nextView = fullCalendarViewToAppView(arg.view.type);
    setCurrentView(nextView);
    setCurrentTitle(arg.view.title);
    onRangeChange?.({
      view: nextView,
      title: arg.view.title,
      start: arg.start,
      end: arg.end,
      currentStart: arg.view.currentStart,
      currentEnd: arg.view.currentEnd,
    });
  };

  const handleEventClick = (arg: EventClickArg) => {
    const extendedProps = arg.event.extendedProps as CalendarExtendedProps;

    onEventSelect?.({
      id: arg.event.id,
      title: arg.event.title,
      start: arg.event.start ?? new Date(),
      end: arg.event.end ?? undefined,
      allDay: arg.event.allDay,
      accent: extendedProps.accent,
      statusLabel: extendedProps.statusLabel,
      typeLabel: extendedProps.typeLabel,
      subtitle: extendedProps.subtitle,
      description: extendedProps.description,
      location: extendedProps.location,
      raw: extendedProps.raw,
    });
  };

  const handleDateClick = (arg: DateClickArg) => {
    onDateSelect?.(arg.date);
  };

  const runCalendarAction = (action: "prev" | "next" | "today") => {
    const api = calendarRef.current?.getApi();

    if (!api) {
      return;
    }

    api[action]();
  };

  return (
    <SectionCard className={className}>
      <div className="space-y-4">
        <CalendarToolbar
          title={currentTitle}
          view={currentView}
          onPrevious={() => runCalendarAction("prev")}
          onNext={() => runCalendarAction("next")}
          onToday={() => runCalendarAction("today")}
          onViewChange={setCurrentView}
          actions={actions}
        />

        <CalendarLegend items={legends} />

        {loading ? (
          <CalendarLoadingState />
        ) : (
          <div className="space-y-4">
            <div className="app-calendar-shell">
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                initialView={viewToFullCalendarView(initialView)}
                initialDate={initialDate}
                headerToolbar={false}
                locale={locale === "ar" ? arLocale : "en"}
                height="auto"
                dayMaxEvents={3}
                weekends
                selectable={Boolean(onDateSelect)}
                events={eventInputs}
                eventContent={renderEventContent}
                datesSet={handleDatesSet}
                eventClick={handleEventClick}
                dateClick={handleDateClick}
                nowIndicator
                displayEventEnd={false}
                eventTimeFormat={{
                  hour: "numeric",
                  minute: "2-digit",
                  meridiem: "short",
                }}
              />
            </div>

            {events.length === 0 ? (
              <CalendarEmptyState
                title={emptyTitle}
                description={emptyDescription}
              />
            ) : null}
          </div>
        )}
      </div>
    </SectionCard>
  );
}
