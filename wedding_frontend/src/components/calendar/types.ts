export type AppCalendarView =
  | "month"
  | "threeMonths"
  | "sixMonths"
  | "year"
  | "week"
  | "day"
  | "list";

export type AppCalendarAccent =
  | "gold"
  | "emerald"
  | "blue"
  | "rose"
  | "slate";

export type AppCalendarEvent = {
  id: string;
  title: string;
  start: Date | string;
  end?: Date | string;
  allDay?: boolean;
  accent?: AppCalendarAccent;
  statusLabel?: string;
  typeLabel?: string;
  subtitle?: string;
  secondaryMeta?: string;
  description?: string;
  location?: string;
  badgeLabel?: string;
  raw?: unknown;
};

export type AppCalendarLegendItem = {
  id: string;
  label: string;
  accent: AppCalendarAccent;
};

export type AppCalendarRange = {
  view: AppCalendarView;
  title: string;
  start: Date;
  end: Date;
  currentStart: Date;
  currentEnd: Date;
};
