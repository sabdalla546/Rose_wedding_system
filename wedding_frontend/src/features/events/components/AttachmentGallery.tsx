import { ImagePlus, Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ExecutionAttachment } from "@/pages/execution/types";

type Props = {
  attachments: ExecutionAttachment[];
  title: string;
  emptyText: string;
  deleting: boolean;
  onDelete: (attachmentId: number) => void;
};

export function AttachmentGallery({
  attachments,
  title,
  emptyText,
  deleting,
  onDelete,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <ImagePlus className="h-4 w-4 text-[var(--lux-gold)]" />
        <p className="text-sm font-medium text-[var(--lux-text)]">{title}</p>
      </div>

      {attachments.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="overflow-hidden rounded-[22px] border border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)]"
            >
              <div className="aspect-[4/3] bg-[var(--lux-control-surface)]">
                {attachment.fileUrl ? (
                  <img
                    src={attachment.fileUrl}
                    alt={attachment.label || attachment.originalName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-[var(--lux-text-secondary)]">
                    {attachment.originalName}
                  </div>
                )}
              </div>

              <div className="space-y-2 px-3 py-3">
                <p className="truncate text-sm font-medium text-[var(--lux-heading)]">
                  {attachment.label || attachment.originalName}
                </p>
                <p className="truncate text-xs text-[var(--lux-text-secondary)]">
                  {attachment.originalName}
                </p>
                <div className="flex items-center justify-between gap-2">
                  {attachment.fileUrl ? (
                    <a
                      href={attachment.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-medium text-[var(--lux-gold)] underline-offset-4 hover:underline"
                    >
                      Preview
                    </a>
                  ) : (
                    <span className="text-xs text-[var(--lux-text-secondary)]">
                      No preview
                    </span>
                  )}

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onDelete(attachment.id)}
                    disabled={deleting}
                  >
                    {deleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[18px] border border-dashed border-[var(--lux-row-border)] px-4 py-6 text-sm text-[var(--lux-text-secondary)]">
          {emptyText}
        </div>
      )}
    </div>
  );
}
