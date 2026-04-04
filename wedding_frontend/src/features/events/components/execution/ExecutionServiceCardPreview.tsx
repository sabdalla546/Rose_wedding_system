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
  previewText: _previewText,
}: Props) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  const attachmentsCount = detail.attachments?.length ?? 0;
  const templateLabel = getExecutionTemplateLabel(
    resolveExecutionTemplateKey(detail),
    t,
  );

  return (
    <div className={cn("space-y-3", isRtl ? "text-right" : "text-left")}>
      <div
        className={cn(
          "flex flex-wrap items-center gap-2",
          isRtl ? "justify-end" : "justify-start",
        )}
      >
        <span className="inline-flex items-center rounded-[6px] border border-[var(--lux-row-border)] bg-[var(--lux-control-hover)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--lux-text-muted)]">
          {t("execution.blockLabel", { defaultValue: "Execution block" })}
        </span>
        <span className="inline-flex items-center rounded-[6px] border border-[var(--lux-gold-border)] bg-[color-mix(in_srgb,var(--lux-gold)_10%,transparent)] px-2.5 py-1 text-[10px] font-medium text-[var(--lux-gold)]">
          {templateLabel}
        </span>
      </div>

      <div>
        <h4 className="text-lg font-semibold leading-7 text-[var(--lux-heading)]">
          {serviceTitle}
        </h4>
      </div>

      <div
        className={cn(
          "flex flex-wrap items-center gap-2 text-[11px] text-[var(--lux-text-secondary)]",
          isRtl ? "justify-end" : "justify-start",
        )}
      >
        <span className="inline-flex items-center gap-1.5 rounded-[6px] border border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)] px-2.5 py-1">
          <Paperclip className="h-3.5 w-3.5 text-[var(--lux-gold)]" />
          {attachmentsCount}{" "}
          {t("execution.attachmentsLabel", { defaultValue: "Attachments" })}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-[6px] border border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)] px-2.5 py-1">
          <ArrowUpDown className="h-3.5 w-3.5 text-[var(--lux-gold)]" />
          {t("execution.sortOrderLabel", { defaultValue: "Sort" })} #
          {detail.sortOrder}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-[6px] border border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)] px-2.5 py-1">
          <ScrollText className="h-3.5 w-3.5 text-[var(--lux-gold)]" />
          {t("execution.detailIdLabel", { defaultValue: "Block" })} #{detail.id}
        </span>
      </div>
    </div>
  );
}
