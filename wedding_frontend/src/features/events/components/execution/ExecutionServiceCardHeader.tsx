import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  getExecutionServiceDetailPreview,
  resolveExecutionTemplateKey,
} from "@/pages/execution/adapters";
import type { ExecutionServiceDetail } from "@/pages/execution/types";
import { cn } from "@/lib/utils";
import { ExecutionServiceCardImage } from "./ExecutionServiceCardImage";
import { ExecutionServiceCardPreview } from "./ExecutionServiceCardPreview";
import { ExecutionServiceCardStatusBadge } from "./ExecutionServiceCardStatusBadge";

type Props = {
  detail: ExecutionServiceDetail;
  expanded: boolean;
  onToggle: () => void;
};

export function ExecutionServiceCardHeader({
  detail,
  expanded,
  onToggle,
}: Props) {
  const { t } = useTranslation();
  const serviceTitle =
    detail.serviceNameSnapshot ||
    detail.service?.name ||
    t("services.service", { defaultValue: "Service" });
  const templateKey = resolveExecutionTemplateKey(detail);
  const templateLabel = t(`execution.templates.${templateKey}`, {
    defaultValue: templateKey,
  });
  const previewText = getExecutionServiceDetailPreview(detail, t);

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      className={cn(
        "w-full rounded-[28px] px-5 py-5 text-left transition-all duration-200",
        "hover:bg-[color-mix(in_srgb,var(--lux-control-hover)_36%,transparent)]",
      )}
    >
      <div className="grid gap-5 xl:grid-cols-[280px,1fr,auto] xl:items-center">
        <ExecutionServiceCardImage
          detail={detail}
          serviceTitle={serviceTitle}
          templateLabel={templateLabel}
        />

        <ExecutionServiceCardPreview
          detail={detail}
          serviceTitle={serviceTitle}
          previewText={previewText}
        />

        <div className="flex flex-col items-start gap-4 xl:items-end">
          <ExecutionServiceCardStatusBadge status={detail.status} />

          <div className="inline-flex items-center gap-3 rounded-full border border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)] px-4 py-2 text-sm font-medium text-[var(--lux-text)]">
            <span>
              {expanded
                ? t("execution.hideDetails", { defaultValue: "Hide details" })
                : t("execution.viewDetails", { defaultValue: "View details" })}
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-[var(--lux-gold)] transition-transform duration-200",
                expanded ? "rotate-180" : "",
              )}
            />
          </div>
        </div>
      </div>
    </button>
  );
}
