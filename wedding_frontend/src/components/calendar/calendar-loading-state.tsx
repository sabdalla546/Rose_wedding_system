import { CalendarDays, Loader2 } from "lucide-react";

type CalendarLoadingStateProps = {
  title?: string;
  description?: string;
};

export function CalendarLoadingState({
  title = "Loading calendar",
  description = "Preparing events and calendar availability.",
}: CalendarLoadingStateProps) {
  return (
    <div className="table-state min-h-[420px] rounded-[24px] border">
      <div className="app-icon-chip h-14 w-14 rounded-full">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
      <div className="space-y-2">
        <p className="text-lg font-semibold text-[var(--lux-heading)]">{title}</p>
        <p className="max-w-md text-sm text-[var(--lux-text-secondary)]">
          {description}
        </p>
      </div>
      <div className="flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-[var(--lux-text-muted)]">
        <CalendarDays className="h-3.5 w-3.5" />
        Syncing view
      </div>
    </div>
  );
}
