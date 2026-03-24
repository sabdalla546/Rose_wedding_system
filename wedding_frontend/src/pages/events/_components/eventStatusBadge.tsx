import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { formatEventStatus } from "@/pages/events/adapters";
import type { EventStatus } from "@/pages/events/types";

const statusStyles: Record<
  EventStatus,
  {
    background: string;
    borderColor: string;
    color: string;
  }
> = {
  draft: {
    background: "var(--color-surface-3)",
    borderColor: "var(--color-border)",
    color: "var(--color-text-subtle)",
  },
  designing: {
    background: "color-mix(in srgb, var(--color-primary) 12%, transparent)",
    borderColor: "color-mix(in srgb, var(--color-primary) 28%, transparent)",
    color: "var(--color-primary)",
  },
  confirmed: {
    background: "var(--color-success-soft)",
    borderColor: "color-mix(in srgb, var(--color-success) 34%, transparent)",
    color: "var(--color-success)",
  },
  in_progress: {
    background: "var(--color-info-soft)",
    borderColor: "color-mix(in srgb, var(--color-info) 34%, transparent)",
    color: "var(--color-info)",
  },
  completed: {
    background: "var(--color-warning-soft)",
    borderColor: "color-mix(in srgb, var(--color-warning) 34%, transparent)",
    color: "var(--color-warning)",
  },
  cancelled: {
    background: "var(--color-danger-soft)",
    borderColor: "color-mix(in srgb, var(--color-danger) 34%, transparent)",
    color: "var(--color-danger)",
  },
};

export function EventStatusBadge({ status }: { status: EventStatus }) {
  const { t } = useTranslation();

  return (
    <Badge
      className="border normal-case tracking-[0.04em]"
      style={statusStyles[status]}
    >
      {t(`events.status.${status}`, {
        defaultValue: formatEventStatus(status),
      })}
    </Badge>
  );
}
