import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin, {
  type DateClickArg,
} from "@fullcalendar/interaction";
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

export type AppCalendarHandle = {
  previous: () => void;
  next: () => void;
  today: () => void;
  setView: (view: AppCalendarView) => void;
  updateSize: () => void;
};

export type AppCalendarDayMarker = {
  date: string;
  label?: string;
  appointmentId: string;
  customerName?: string;
  raw?: unknown;
};

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
  onStateChange?: (state: { title: string; view: AppCalendarView }) => void;
  actions?: ReactNode;
  className?: string;
  hideToolbar?: boolean;
  variant?: "default" | "event" | "appointment";
  dayMarkers?: AppCalendarDayMarker[];
  onDayMarkerSelect?: (marker: AppCalendarDayMarker) => void;
};

type CalendarExtendedProps = Omit<
  AppCalendarEvent,
  "id" | "title" | "start" | "end" | "allDay"
>;

function viewToFullCalendarView(view: AppCalendarView) {
  switch (view) {
    case "threeMonths":
      return "dayGridThreeMonths";
    case "sixMonths":
      return "dayGridSixMonths";
    case "year":
      return "dayGridYear";
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
    case "dayGridThreeMonths":
      return "threeMonths";
    case "dayGridSixMonths":
      return "sixMonths";
    case "dayGridYear":
      return "year";
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
      secondaryMeta: event.secondaryMeta,
      description: event.description,
      location: event.location,
      badgeLabel: event.badgeLabel,
      raw: event.raw,
    } satisfies CalendarExtendedProps,
  }));
}

function normalizeDateKey(value: Date | string) {
  if (typeof value === "string") {
    return value.slice(0, 10);
  }

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function renderEventContent(
  content: EventContentArg,
  variant: "default" | "event" | "appointment",
) {
  const extendedProps = content.event.extendedProps as CalendarExtendedProps;
  const accent = (extendedProps.accent ?? "slate") as string;
  const accentColor =
    accent === "gold"
      ? "var(--color-primary)"
      : accent === "emerald"
        ? "var(--color-success)"
        : accent === "blue"
          ? "var(--color-info)"
          : accent === "rose"
            ? "var(--color-danger)"
            : "var(--color-border-strong)";
  const timeLabel = content.timeText || (content.event.allDay ? "All day" : "");
  const showAppointmentDetails = variant === "appointment";
  const showEventFooter = variant === "event";
  const footerLabels = showAppointmentDetails
    ? [extendedProps.typeLabel, extendedProps.statusLabel].filter(Boolean)
    : [];

  return (
    <div
      className={`app-calendar-event app-calendar-event--${accent} app-calendar-event--${variant}`}
      style={
        {
          "--app-calendar-accent": accentColor,
        } as CSSProperties
      }
    >
      <div className="app-calendar-event__time">{timeLabel}</div>
      <div className="app-calendar-event__title">{content.event.title}</div>
      {extendedProps.subtitle ? (
        <div className="app-calendar-event__meta">{extendedProps.subtitle}</div>
      ) : null}
      {showAppointmentDetails && extendedProps.secondaryMeta ? (
        <div className="app-calendar-event__meta">
          {extendedProps.secondaryMeta}
        </div>
      ) : null}
      {showAppointmentDetails && extendedProps.description ? (
        <div className="app-calendar-event__description">
          {extendedProps.description}
        </div>
      ) : null}
      {variant === "event" && extendedProps.location ? (
        <div className="app-calendar-event__location">
          {extendedProps.location}
        </div>
      ) : null}
      {showEventFooter &&
      (extendedProps.badgeLabel || extendedProps.statusLabel) ? (
        <div className="app-calendar-event__footer">
          {extendedProps.badgeLabel ? (
            <span className="app-calendar-event__badge">
              {extendedProps.badgeLabel}
            </span>
          ) : null}
          {extendedProps.statusLabel ? (
            <span className="app-calendar-event__status">
              {extendedProps.statusLabel}
            </span>
          ) : null}
        </div>
      ) : null}
      {showAppointmentDetails && footerLabels.length ? (
        <div className="app-calendar-event__footer">
          {footerLabels.map((label) => (
            <span key={label} className="app-calendar-event__status">
              {label}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function closeCalendarPopover() {
  const closeButton = document.querySelector<HTMLButtonElement>(
    ".fc-popover .fc-popover-close",
  );

  if (closeButton) {
    closeButton.click();
    return;
  }

  const popover = document.querySelector<HTMLElement>(".fc-popover");
  if (popover) {
    popover.remove();
  }
}

export const AppCalendar = forwardRef<AppCalendarHandle, AppCalendarProps>(
  function AppCalendar(
    {
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
      onStateChange,
      actions,
      className,
      hideToolbar = false,
      variant = "default",
      dayMarkers = [],
      onDayMarkerSelect,
    },
    ref,
  ) {
    const calendarRef = useRef<FullCalendar | null>(null);
    const suppressNextDateClickRef = useRef(false);
    const [currentView, setCurrentView] =
      useState<AppCalendarView>(initialView);
    const [currentTitle, setCurrentTitle] = useState("");

    const eventInputs = useMemo(() => toEventInputs(events), [events]);

    const dayMarkersMap = useMemo(() => {
      const map = new Map<string, AppCalendarDayMarker[]>();

      for (const marker of dayMarkers) {
        const key = normalizeDateKey(marker.date);
        const current = map.get(key) ?? [];
        current.push(marker);
        map.set(key, current);
      }

      return map;
    }, [dayMarkers]);

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

    useImperativeHandle(ref, () => ({
      previous: () => runCalendarAction("prev"),
      next: () => runCalendarAction("next"),
      today: () => runCalendarAction("today"),
      setView: (view) => setCurrentView(view),
      updateSize: () => {
        calendarRef.current?.getApi().updateSize();
      },
    }));

    const handleDatesSet = (arg: DatesSetArg) => {
      const nextView = fullCalendarViewToAppView(arg.view.type);
      setCurrentView(nextView);
      setCurrentTitle(arg.view.title);
      onStateChange?.({ title: arg.view.title, view: nextView });
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
        secondaryMeta: extendedProps.secondaryMeta,
        description: extendedProps.description,
        location: extendedProps.location,
        raw: extendedProps.raw,
      });

      window.requestAnimationFrame(() => {
        closeCalendarPopover();
      });
    };

    const handleDateClick = (arg: DateClickArg) => {
      if (suppressNextDateClickRef.current) {
        suppressNextDateClickRef.current = false;
        return;
      }

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
          {!hideToolbar ? (
            <CalendarToolbar
              title={currentTitle}
              view={currentView}
              onPrevious={() => runCalendarAction("prev")}
              onNext={() => runCalendarAction("next")}
              onToday={() => runCalendarAction("today")}
              onViewChange={setCurrentView}
              actions={actions}
            />
          ) : null}

          <CalendarLegend items={legends} />

          <div className="space-y-4">
            <div className="relative">
              <div
                className={`app-calendar-shell app-calendar-shell--${variant}`}
              >
                <FullCalendar
                  ref={calendarRef}
                  plugins={[
                    dayGridPlugin,
                    timeGridPlugin,
                    listPlugin,
                    interactionPlugin,
                  ]}
                  views={{
                    dayGridThreeMonths: {
                      type: "dayGrid",
                      duration: { months: 3 },
                      dateIncrement: { months: 3 },
                    },
                    dayGridSixMonths: {
                      type: "dayGrid",
                      duration: { months: 6 },
                      dateIncrement: { months: 6 },
                    },
                    dayGridYear: {
                      type: "dayGrid",
                      duration: { years: 1 },
                      dateIncrement: { years: 1 },
                    },
                  }}
                  initialView={viewToFullCalendarView(initialView)}
                  initialDate={initialDate}
                  headerToolbar={false}
                  locale={locale === "ar" ? arLocale : "en"}
                  height="auto"
                  dayMaxEvents={3}
                  weekends
                  selectable={Boolean(onDateSelect)}
                  events={eventInputs}
                  eventContent={(content) =>
                    renderEventContent(content, variant)
                  }
                  dayCellContent={(arg) => {
                    const key = normalizeDateKey(arg.date);
                    const markers = dayMarkersMap.get(key) ?? [];
                    return (
                      <div className="app-calendar-day-cell">
                        <div className="app-calendar-day-number">
                          {arg.dayNumberText}
                        </div>

                        {markers.length > 0 ? (
                          <div className="app-calendar-day-markers">
                            {markers.map((marker) => (
                              <button
                                key={`${marker.appointmentId}-${marker.date}`}
                                type="button"
                                aria-label={marker.customerName ?? "Wedding date"}
                                className="app-calendar-day-marker"
                                title={marker.customerName ?? "Wedding date"}
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  suppressNextDateClickRef.current = true;
                                  onDayMarkerSelect?.(marker);
                                }}
                              >
                                {"\u2605"}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    );
                  }}
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

              {loading ? (
                <div className="absolute inset-0 z-10">
                  <CalendarLoadingState />
                </div>
              ) : null}
            </div>

            {!loading && events.length === 0 ? (
              <CalendarEmptyState
                title={emptyTitle}
                description={emptyDescription}
              />
            ) : null}
          </div>
        </div>

        <style>{`
          .app-calendar-day-cell {
            display: flex;
            flex-direction: column;
            gap: 4px;
            min-height: 100%;
          }

          .app-calendar-day-number {
            font-weight: 600;
          }

          .app-calendar-day-markers {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
          }

          .app-calendar-day-marker {
            border: 0;
            background: transparent;
            cursor: pointer;
            font-size: 20px;
            line-height: 1;
            color: var(--lux-gold, var(--color-primary));
            padding: 0;
            font-weight: 800;
            display: inline-flex;
            align-items: center;
            gap: 4px;
          }

          .app-calendar-day-marker:hover {
            transform: scale(1.08);
          }
        `}</style>
      </SectionCard>
    );
  },
);
