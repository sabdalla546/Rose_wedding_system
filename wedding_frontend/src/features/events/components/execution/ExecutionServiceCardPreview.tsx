import { ArrowUpDown, Paperclip, ScrollText } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  getExecutionTemplateLabel,
  resolveExecutionTemplateKey,
} from "@/pages/execution/adapters";
import type { ExecutionServiceDetail } from "@/pages/execution/types";
import { cn } from "@/lib/utils";

type Props = {
  detail: ExecutionServiceDetail;
  serviceTitle: string;
  previewText: string;
};

export function ExecutionServiceCardPreview({
  detail,
  serviceTitle,
  previewText,
}: Props) {
  const { t } = useTranslation();
  const attachmentsCount = detail.attachments?.length ?? 0;
  const templateLabel = getExecutionTemplateLabel(
    resolveExecutionTemplateKey(detail),
    t,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center rounded-full border border-[var(--lux-row-border)] bg-[var(--lux-control-hover)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
          {t("execution.blockLabel", { defaultValue: "Execution block" })}
        </span>
        <span className="inline-flex items-center rounded-full border border-[var(--lux-gold-border)] bg-[color-mix(in_srgb,var(--lux-gold)_10%,transparent)] px-3 py-1 text-xs font-medium text-[var(--lux-gold)]">
          {templateLabel}
        </span>
      </div>

      <div className="space-y-2">
        <h4 className="text-xl font-semibold text-[var(--lux-heading)]">
          {serviceTitle}
        </h4>
        <p
          className={cn(
            "text-sm leading-7 text-[var(--lux-text-secondary)]",
            "overflow-hidden [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]",
          )}
        >
          {previewText}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--lux-text-secondary)]">
        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)] px-3 py-1.5">
          <Paperclip className="h-3.5 w-3.5 text-[var(--lux-gold)]" />
          {attachmentsCount}{" "}
          {t("execution.attachmentsLabel", { defaultValue: "Attachments" })}
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)] px-3 py-1.5">
          <ArrowUpDown className="h-3.5 w-3.5 text-[var(--lux-gold)]" />
          {t("execution.sortOrderLabel", { defaultValue: "Sort" })} #
          {detail.sortOrder}
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)] px-3 py-1.5">
          <ScrollText className="h-3.5 w-3.5 text-[var(--lux-gold)]" />
          {t("execution.detailIdLabel", { defaultValue: "Block" })} #{detail.id}
        </span>
      </div>
    </div>
  );
}
