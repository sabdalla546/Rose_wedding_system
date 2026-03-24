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
    <div className="flex flex-col gap-4 border-b pb-4" style={{ borderColor: "var(--lux-row-border)" }}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--lux-text-muted)]">
            Schedule window
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-[var(--lux-heading)]">
            {title}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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

      <div className="inline-flex flex-wrap items-center gap-2">
        {viewOptions.map((option) => {
          const Icon = option.icon;

          return (
            <button
              key={option.value}
              type="button"
              className={cn(
                "inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium transition",
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
