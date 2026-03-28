import type { ReactNode } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, List, Table2, TableProperties } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { AppCalendarView } from "./types";

type CalendarToolbarProps = {
  title: string;
  view: AppCalendarView;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onViewChange: (view: AppCalendarView) => void;
  actions?: ReactNode;
};

const viewOptions: Array<{
  value: AppCalendarView;
  label: string;
  icon: typeof Table2;
}> = [
  { value: "month", label: "Month", icon: Table2 },
  { value: "week", label: "Week", icon: TableProperties },
  { value: "day", label: "Day", icon: CalendarDays },
  { value: "list", label: "List", icon: List },
];

export function CalendarToolbar({
  title,
  view,
  onPrevious,
  onNext,
  onToday,
  onViewChange,
  actions,
}: CalendarToolbarProps) {
  const { t } = useTranslation();

  return (
    <div className="calendar-toolbar">
      <div className="calendar-toolbar__top">
        <div className="calendar-toolbar__heading">
          <p className="calendar-toolbar__eyebrow">
            {t("calendar.scheduleWindow", {
              defaultValue: "Schedule window",
            })}
          </p>
          <h3 className="calendar-toolbar__title">
            {title}
          </h3>
        </div>

        <div className="calendar-toolbar__actions">
          <Button type="button" variant="outline" onClick={onToday}>
            {t("calendar.today", { defaultValue: "Today" })}
          </Button>
          <Button type="button" size="icon" variant="secondary" onClick={onPrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button type="button" size="icon" variant="secondary" onClick={onNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          {actions}
        </div>
      </div>

      <div className="calendar-toolbar__views">
        {viewOptions.map((option) => {
          const Icon = option.icon;

          return (
            <button
              key={option.value}
              type="button"
              className={cn(
                "inline-flex items-center gap-2 rounded-[4px] border px-4 py-2 text-sm font-medium transition",
                view === option.value
                  ? "text-[var(--lux-primary-text)]"
                  : "text-[var(--lux-text-secondary)] hover:text-[var(--lux-text)]",
              )}
              style={
                view === option.value
                  ? {
                      background: "var(--lux-primary-surface)",
                      borderColor: "var(--lux-gold-border)",
                    }
                  : {
                      background: "var(--lux-control-surface)",
                      borderColor: "var(--lux-control-border)",
                    }
              }
              onClick={() => onViewChange(option.value)}
            >
              <Icon className="h-4 w-4" />
              {t(`calendar.view.${option.value}`, { defaultValue: option.label })}
            </button>
          );
        })}
      </div>
    </div>
  );
}
