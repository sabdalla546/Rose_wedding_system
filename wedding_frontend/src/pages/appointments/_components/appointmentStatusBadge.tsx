import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { formatAppointmentStatus } from "@/pages/appointments/adapters";
import type { AppointmentStatus } from "@/pages/appointments/types";

const statusStyles: Record<
  AppointmentStatus,
  {
    background: string;
    borderColor: string;
    color: string;
  }
> = {
  scheduled: {
    background: "color-mix(in srgb, var(--lux-gold) 14%, transparent)",
    borderColor: "color-mix(in srgb, var(--lux-gold) 32%, transparent)",
    color: "var(--lux-gold)",
  },
  confirmed: {
    background: "color-mix(in srgb, #16a34a 14%, transparent)",
    borderColor: "color-mix(in srgb, #16a34a 34%, transparent)",
    color: "#15803d",
  },
  completed: {
    background: "color-mix(in srgb, #0284c7 14%, transparent)",
    borderColor: "color-mix(in srgb, #0284c7 34%, transparent)",
    color: "#0369a1",
  },
  rescheduled: {
    background: "color-mix(in srgb, #ec4899 14%, transparent)",
    borderColor: "color-mix(in srgb, #ec4899 34%, transparent)",
    color: "#db2777",
  },
  cancelled: {
    background: "color-mix(in srgb, var(--lux-danger) 14%, transparent)",
    borderColor: "color-mix(in srgb, var(--lux-danger) 34%, transparent)",
    color: "var(--lux-danger)",
  },
  no_show: {
    background: "color-mix(in srgb, #6b7280 16%, transparent)",
    borderColor: "color-mix(in srgb, #6b7280 34%, transparent)",
    color: "#4b5563",
  },
};

export function AppointmentStatusBadge({
  status,
}: {
  status: AppointmentStatus;
}) {
  const { t } = useTranslation();

  return (
    <Badge
      className="border normal-case tracking-[0.04em]"
      style={statusStyles[status]}
    >
      {t(`appointments.status.${status}`, {
        defaultValue: formatAppointmentStatus(status),
      })}
    </Badge>
  );
}
