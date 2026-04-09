import {
  addDays,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isWithinInterval,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";

import type { AppCalendarRange } from "@/components/calendar/types";

export type CalendarDatePreset = "all" | "today" | "7d" | "30d";

export function getInitialCalendarRange(): AppCalendarRange {
  const currentDate = new Date();
  const currentMonthStart = startOfMonth(currentDate);
  const currentMonthEnd = endOfMonth(currentDate);

  return {
    view: "month",
    title: format(currentDate, "MMMM yyyy"),
    start: startOfWeek(currentMonthStart, { weekStartsOn: 0 }),
    end: endOfWeek(currentMonthEnd, { weekStartsOn: 0 }),
    currentStart: currentMonthStart,
    currentEnd: currentMonthEnd,
  };
}

export function getCalendarRangeDateFilters(range: AppCalendarRange) {
  return {
    dateFrom: format(range.currentStart, "yyyy-MM-dd"),
    dateTo: format(addDays(range.currentEnd, -1), "yyyy-MM-dd"),
  };
}

export function matchesCalendarDatePreset(
  dateValue: Date | string,
  preset: CalendarDatePreset,
) {
  if (preset === "all") {
    return true;
  }

  const today = startOfDay(new Date());
  const itemDate = startOfDay(new Date(dateValue));

  if (preset === "today") {
    return itemDate.getTime() === today.getTime();
  }

  if (preset === "7d") {
    return isWithinInterval(itemDate, {
      start: today,
      end: endOfDay(addDays(today, 6)),
    });
  }

  return isWithinInterval(itemDate, {
    start: today,
    end: endOfDay(addDays(today, 29)),
  });
}
