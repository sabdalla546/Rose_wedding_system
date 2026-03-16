import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { formatLeadStatus } from "@/pages/leads/adapters";
import type { LeadStatus } from "@/pages/leads/types";

const statusStyles: Record<
  LeadStatus,
  {
    background: string;
    borderColor: string;
    color: string;
  }
> = {
  new: {
    background: "color-mix(in srgb, var(--lux-gold) 14%, transparent)",
    borderColor: "color-mix(in srgb, var(--lux-gold) 32%, transparent)",
    color: "var(--lux-gold)",
  },
  contacted: {
    background: "color-mix(in srgb, #4c9aff 14%, transparent)",
    borderColor: "color-mix(in srgb, #4c9aff 34%, transparent)",
    color: "#2f6fed",
  },
  appointment_scheduled: {
    background: "color-mix(in srgb, #7c5cff 14%, transparent)",
    borderColor: "color-mix(in srgb, #7c5cff 34%, transparent)",
    color: "#6d46ff",
  },
  appointment_completed: {
    background: "color-mix(in srgb, #16a34a 14%, transparent)",
    borderColor: "color-mix(in srgb, #16a34a 34%, transparent)",
    color: "#15803d",
  },
  quotation_sent: {
    background: "color-mix(in srgb, #ec4899 14%, transparent)",
    borderColor: "color-mix(in srgb, #ec4899 34%, transparent)",
    color: "#db2777",
  },
  contract_pending: {
    background: "color-mix(in srgb, #f97316 14%, transparent)",
    borderColor: "color-mix(in srgb, #f97316 34%, transparent)",
    color: "#ea580c",
  },
  converted: {
    background: "color-mix(in srgb, #059669 14%, transparent)",
    borderColor: "color-mix(in srgb, #059669 34%, transparent)",
    color: "#047857",
  },
  lost: {
    background: "color-mix(in srgb, var(--lux-danger) 14%, transparent)",
    borderColor: "color-mix(in srgb, var(--lux-danger) 34%, transparent)",
    color: "var(--lux-danger)",
  },
  cancelled: {
    background: "color-mix(in srgb, #6b7280 16%, transparent)",
    borderColor: "color-mix(in srgb, #6b7280 34%, transparent)",
    color: "#4b5563",
  },
};

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  const { t } = useTranslation();

  return (
    <Badge
      className="border normal-case tracking-[0.04em]"
      style={statusStyles[status]}
    >
      {t(`leads.status.${status}`, { defaultValue: formatLeadStatus(status) })}
    </Badge>
  );
}
