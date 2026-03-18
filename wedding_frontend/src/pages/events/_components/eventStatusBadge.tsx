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
    background: "color-mix(in srgb, var(--lux-gold) 14%, transparent)",
    borderColor: "color-mix(in srgb, var(--lux-gold) 32%, transparent)",
    color: "var(--lux-gold)",
  },
  designing: {
    background: "color-mix(in srgb, #7c5cff 14%, transparent)",
    borderColor: "color-mix(in srgb, #7c5cff 34%, transparent)",
    color: "#6d46ff",
  },
  confirmed: {
    background: "color-mix(in srgb, #16a34a 14%, transparent)",
    borderColor: "color-mix(in srgb, #16a34a 34%, transparent)",
    color: "#15803d",
  },
  in_progress: {
    background: "color-mix(in srgb, #0284c7 14%, transparent)",
    borderColor: "color-mix(in srgb, #0284c7 34%, transparent)",
    color: "#0369a1",
  },
  completed: {
    background: "color-mix(in srgb, #059669 14%, transparent)",
    borderColor: "color-mix(in srgb, #059669 34%, transparent)",
    color: "#047857",
  },
  cancelled: {
    background: "color-mix(in srgb, var(--lux-danger) 14%, transparent)",
    borderColor: "color-mix(in srgb, var(--lux-danger) 34%, transparent)",
    color: "var(--lux-danger)",
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
