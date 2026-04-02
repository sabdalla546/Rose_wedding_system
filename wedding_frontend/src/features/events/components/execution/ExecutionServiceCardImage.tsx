import { useEffect, useMemo, useState } from "react";
import { ImageOff, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

import { resolveExecutionAttachmentUrl } from "@/pages/execution/adapters";
import type { ExecutionServiceDetail } from "@/pages/execution/types";

type Props = {
  detail: ExecutionServiceDetail;
  serviceTitle: string;
  templateLabel: string;
};

export function ExecutionServiceCardImage({
  detail,
  serviceTitle,
  templateLabel,
}: Props) {
  const { t } = useTranslation();
  const [imageFailed, setImageFailed] = useState(false);

  const coverAttachment = useMemo(
    () =>
      detail.attachments?.find((attachment) =>
        Boolean(resolveExecutionAttachmentUrl(attachment)),
      ) ??
      detail.attachments?.[0] ??
      null,
    [detail.attachments],
  );

  const coverImageUrl = coverAttachment
    ? resolveExecutionAttachmentUrl(coverAttachment)
    : null;

  useEffect(() => {
    setImageFailed(false);
  }, [coverImageUrl]);

  const showImage = Boolean(coverImageUrl) && !imageFailed;
  const initial = serviceTitle.trim().charAt(0).toUpperCase() || "E";

  return (
    <div className="relative overflow-hidden rounded-[24px] border border-[var(--lux-row-border)] bg-[var(--lux-control-surface)]">
      <div className="aspect-[5/4]">
        {showImage ? (
          <img
            key={coverImageUrl ?? "execution-card-placeholder"}
            src={coverImageUrl ?? ""}
            alt={coverAttachment?.label || coverAttachment?.originalName || serviceTitle}
            className="h-full w-full object-cover"
            onLoad={() => setImageFailed(false)}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div
            className="flex h-full w-full flex-col justify-between p-5"
            style={{
              background:
                "radial-gradient(circle at top right, color-mix(in srgb, var(--lux-gold) 18%, transparent), transparent 42%), linear-gradient(145deg, color-mix(in srgb, var(--lux-panel-surface) 92%, black), color-mix(in srgb, var(--lux-control-hover) 65%, transparent))",
            }}
          >
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--lux-gold-border)] bg-[color-mix(in_srgb,var(--lux-gold)_12%,transparent)] px-3 py-1 text-[11px] font-semibold text-[var(--lux-gold)]">
              <Sparkles className="h-3.5 w-3.5" />
              {templateLabel}
            </div>

            <div className="space-y-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-[20px] border border-[var(--lux-row-border)] bg-[color-mix(in_srgb,var(--lux-gold)_10%,transparent)] text-2xl font-semibold text-[var(--lux-heading)]">
                {initial}
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--lux-text-secondary)]">
                <ImageOff className="h-4 w-4 text-[var(--lux-gold)]" />
                <span>
                  {t("execution.noVisualReference", {
                    defaultValue: "No visual reference yet",
                  })}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,transparent,rgba(8,8,10,0.84))]" />
    </div>
  );
}
