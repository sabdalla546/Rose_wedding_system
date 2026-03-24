import { CalendarX2 } from "lucide-react";

type CalendarEmptyStateProps = {
  title?: string;
  description?: string;
};

export function CalendarEmptyState({
  title = "No events in this view",
  description = "Try changing the date range or adjusting your filters.",
}: CalendarEmptyStateProps) {
  return (
    <div className="app-empty-state min-h-[180px]">
      <div className="app-icon-chip mb-4 h-12 w-12 rounded-full">
        <CalendarX2 className="h-5 w-5" />
      </div>
      <h3 className="text-lg font-semibold text-[var(--lux-text)]">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-[var(--lux-text-muted)]">
        {description}
      </p>
    </div>
  );
}
