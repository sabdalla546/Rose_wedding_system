import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { formatWorkflowLabel, type WorkflowEntityType } from "@/lib/workflow/workflow";

const STATUS_STYLES: Record<
  string,
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
  completed: {
    background: "color-mix(in srgb, #0284c7 14%, transparent)",
    borderColor: "color-mix(in srgb, #0284c7 34%, transparent)",
    color: "#0369a1",
  },
  converted: {
    background: "color-mix(in srgb, #7c3aed 12%, transparent)",
    borderColor: "color-mix(in srgb, #7c3aed 32%, transparent)",
    color: "#6d28d9",
  },
  no_show: {
    background: "color-mix(in srgb, #6b7280 16%, transparent)",
    borderColor: "color-mix(in srgb, #6b7280 34%, transparent)",
    color: "#4b5563",
  },
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
  quotation_pending: {
    background: "color-mix(in srgb, #f59e0b 14%, transparent)",
    borderColor: "color-mix(in srgb, #f59e0b 34%, transparent)",
    color: "#b45309",
  },
  quoted: {
    background: "color-mix(in srgb, #0ea5e9 14%, transparent)",
    borderColor: "color-mix(in srgb, #0ea5e9 34%, transparent)",
    color: "#0369a1",
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
  approved: {
    background: "color-mix(in srgb, #16a34a 14%, transparent)",
    borderColor: "color-mix(in srgb, #16a34a 34%, transparent)",
    color: "#15803d",
  },
  sent: {
    background: "color-mix(in srgb, #0ea5e9 14%, transparent)",
    borderColor: "color-mix(in srgb, #0ea5e9 34%, transparent)",
    color: "#0369a1",
  },
  rejected: {
    background: "color-mix(in srgb, var(--lux-danger) 14%, transparent)",
    borderColor: "color-mix(in srgb, var(--lux-danger) 34%, transparent)",
    color: "var(--lux-danger)",
  },
  expired: {
    background: "color-mix(in srgb, #f59e0b 14%, transparent)",
    borderColor: "color-mix(in srgb, #f59e0b 34%, transparent)",
    color: "#b45309",
  },
  superseded: {
    background: "color-mix(in srgb, #64748b 14%, transparent)",
    borderColor: "color-mix(in srgb, #64748b 34%, transparent)",
    color: "#475569",
  },
  converted_to_contract: {
    background: "color-mix(in srgb, #64748b 14%, transparent)",
    borderColor: "color-mix(in srgb, #64748b 34%, transparent)",
    color: "#475569",
  },
  issued: {
    background: "color-mix(in srgb, #0ea5e9 14%, transparent)",
    borderColor: "color-mix(in srgb, #0ea5e9 34%, transparent)",
    color: "#0369a1",
  },
  signed: {
    background: "color-mix(in srgb, #8b5cf6 12%, transparent)",
    borderColor: "color-mix(in srgb, #8b5cf6 32%, transparent)",
    color: "#6d28d9",
  },
  active: {
    background: "color-mix(in srgb, #16a34a 14%, transparent)",
    borderColor: "color-mix(in srgb, #16a34a 34%, transparent)",
    color: "#15803d",
  },
  under_review: {
    background: "color-mix(in srgb, #f59e0b 14%, transparent)",
    borderColor: "color-mix(in srgb, #f59e0b 34%, transparent)",
    color: "#b45309",
  },
  handed_off: {
    background: "color-mix(in srgb, #8b5cf6 12%, transparent)",
    borderColor: "color-mix(in srgb, #8b5cf6 32%, transparent)",
    color: "#6d28d9",
  },
  handed_to_executor: {
    background: "color-mix(in srgb, #8b5cf6 12%, transparent)",
    borderColor: "color-mix(in srgb, #8b5cf6 32%, transparent)",
    color: "#6d28d9",
  },
  cancelled: {
    background: "color-mix(in srgb, var(--lux-danger) 14%, transparent)",
    borderColor: "color-mix(in srgb, var(--lux-danger) 34%, transparent)",
    color: "var(--lux-danger)",
  },
  terminated: {
    background: "color-mix(in srgb, #f59e0b 14%, transparent)",
    borderColor: "color-mix(in srgb, #f59e0b 34%, transparent)",
    color: "#b45309",
  },
};

const ENTITY_TRANSLATION_PREFIX: Record<WorkflowEntityType, string> = {
  appointment: "appointments",
  event: "events",
  quotation: "quotations",
  contract: "contracts",
  execution: "execution",
};

type WorkflowStatusBadgeProps = {
  entity: WorkflowEntityType;
  status: string;
  className?: string;
};

export function WorkflowStatusBadge({
  entity,
  status,
  className,
}: WorkflowStatusBadgeProps) {
  const { t } = useTranslation();
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.draft;

  return (
    <Badge
      className={`border normal-case tracking-[0.04em] ${className ?? ""}`.trim()}
      style={style}
    >
      {t(`${ENTITY_TRANSLATION_PREFIX[entity]}.status.${status}`, {
        defaultValue: formatWorkflowLabel(status),
      })}
    </Badge>
  );
}
