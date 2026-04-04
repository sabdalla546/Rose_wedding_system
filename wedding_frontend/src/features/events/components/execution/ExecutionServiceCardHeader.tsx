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
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
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
      dir={i18n.dir()}
      className={cn(
        "w-full rounded-[28px] px-4 py-4 transition-all duration-200",
        isRtl ? "text-right" : "text-left",
        "hover:bg-[color-mix(in_srgb,var(--lux-control-hover)_36%,transparent)]",
      )}
    >
      <div className="space-y-4">
        <ExecutionServiceCardImage
          detail={detail}
          serviceTitle={serviceTitle}
          templateLabel={templateLabel}
        />

        <div className="space-y-3">
          <ExecutionServiceCardPreview
            detail={detail}
            serviceTitle={serviceTitle}
            previewText={previewText}
          />

          <div
            className={cn(
              "flex flex-col gap-2.5 border-t border-[var(--lux-row-border)] pt-3 sm:items-center sm:justify-between",
              isRtl ? "sm:flex-row-reverse" : "sm:flex-row",
            )}
          >
            <ExecutionServiceCardStatusBadge status={detail.status} />

            <div className="inline-flex items-center justify-center gap-2 rounded-[6px] border border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)] px-3 py-1.5 text-xs font-medium text-[var(--lux-text)] sm:min-w-[140px]">
              <span>
                {expanded
                  ? t("execution.hideDetails", {
                      defaultValue: "Hide details",
                    })
                  : t("execution.viewDetails", {
                      defaultValue: "View details",
                    })}
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
      </div>
    </button>
  );
}
