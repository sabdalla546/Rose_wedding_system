import { Loader2, Save } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DynamicFieldDefinition } from "@/pages/execution/templateFields";
import type {
  ExecutionServiceDetail,
  ExecutionServiceDetailStatus,
  UploadExecutionAttachmentPayload,
} from "@/pages/execution/types";
import { getExecutionServiceDetailStatusLabel } from "@/pages/execution/adapters";
import { AttachmentGallery } from "../AttachmentGallery";
import { AttachmentUploader } from "../AttachmentUploader";
import { StructuredFieldRenderer } from "../StructuredFieldRenderer";

const textareaClassName =
  "min-h-[110px] w-full rounded-[22px] border px-4 py-3 text-sm text-[var(--lux-text)] placeholder:text-[var(--lux-text-muted)] outline-none transition-all focus:border-[var(--lux-gold-border)] focus:ring-2 focus:ring-[var(--lux-gold-glow)]";

type TemplateOption = {
  value: string;
  label: string;
};

type Props = {
  detail: ExecutionServiceDetail;
  templateOptions: readonly TemplateOption[];
  structuredFields: DynamicFieldDefinition[];
  templateKey: string;
  status: ExecutionServiceDetailStatus;
  sortOrder: string;
  notes: string;
  executorNotes: string;
  structuredValues: Record<string, unknown>;
  error: string;
  saving: boolean;
  uploadingAttachment: boolean;
  deletingAttachment: boolean;
  onTemplateKeyChange: (value: string) => void;
  onStatusChange: (value: ExecutionServiceDetailStatus) => void;
  onSortOrderChange: (value: string) => void;
  onStructuredFieldChange: (fieldKey: string, value: unknown) => void;
  onNotesChange: (value: string) => void;
  onExecutorNotesChange: (value: string) => void;
  onSave: () => Promise<void> | void;
  onUploadAttachment: (
    serviceDetailId: number,
    values: UploadExecutionAttachmentPayload,
  ) => Promise<void> | void;
  onDeleteAttachment: (attachmentId: number) => Promise<void> | void;
};

export function ExecutionServiceCardExpandedPanel({
  detail,
  templateOptions,
  structuredFields,
  templateKey,
  status,
  sortOrder,
  notes,
  executorNotes,
  structuredValues,
  error,
  saving,
  uploadingAttachment,
  deletingAttachment,
  onTemplateKeyChange,
  onStatusChange,
  onSortOrderChange,
  onStructuredFieldChange,
  onNotesChange,
  onExecutorNotesChange,
  onSave,
  onUploadAttachment,
  onDeleteAttachment,
}: Props) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";

  return (
    <div
      dir={i18n.dir()}
      className={cn(
        "space-y-5 border-t border-[var(--lux-row-border)] px-5 pb-5 pt-5",
        isRtl ? "text-right" : "text-left",
      )}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <label className="space-y-2">
          <span className="text-sm font-medium text-[var(--lux-text)]">
            {t("execution.templateKey", { defaultValue: "Template Key" })}
          </span>
          <Select value={templateKey} onValueChange={onTemplateKeyChange}>
            <SelectTrigger
              dir={i18n.dir()}
              className={isRtl ? "text-right [&_span]:text-right" : "text-left [&_span]:text-left"}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent dir={i18n.dir()}>
              {templateOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-[var(--lux-text)]">
            {t("execution.status", { defaultValue: "Status" })}
          </span>
          <Select
            value={status}
            onValueChange={(value) =>
              onStatusChange(value as ExecutionServiceDetailStatus)
            }
          >
            <SelectTrigger
              dir={i18n.dir()}
              className={isRtl ? "text-right [&_span]:text-right" : "text-left [&_span]:text-left"}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent dir={i18n.dir()}>
              {(
                ["pending", "draft", "ready", "in_progress", "done"] as const
              ).map((statusValue) => (
                <SelectItem key={statusValue} value={statusValue}>
                  {getExecutionServiceDetailStatusLabel(statusValue, t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-[var(--lux-text)]">
            {t("execution.sortOrder", { defaultValue: "Sort Order" })}
          </span>
          <Input
            type="number"
            min="0"
            value={sortOrder}
            className={isRtl ? "text-right" : "text-left"}
            onChange={(event) => onSortOrderChange(event.target.value)}
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {structuredFields.map((field) => (
          <label
            key={field.key}
            className={field.type === "textarea" ? "space-y-2 md:col-span-2" : "space-y-2"}
          >
            <span className="text-sm font-medium text-[var(--lux-text)]">
              {field.label}
            </span>
            <StructuredFieldRenderer
              field={field}
              value={structuredValues[field.key]}
              onChange={(value) => onStructuredFieldChange(field.key, value)}
            />
          </label>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-[var(--lux-text)]">
            {t("common.notes", { defaultValue: "Notes" })}
          </span>
          <textarea
            className={cn(textareaClassName, isRtl ? "text-right" : "text-left")}
            value={notes}
            onChange={(event) => onNotesChange(event.target.value)}
            placeholder={t("execution.notesPlaceholder", {
              defaultValue:
                "Designer notes, service direction, checklist notes...",
            })}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-[var(--lux-text)]">
            {t("execution.executorNotes", {
              defaultValue: "Executor Notes",
            })}
          </span>
          <textarea
            className={cn(textareaClassName, isRtl ? "text-right" : "text-left")}
            value={executorNotes}
            onChange={(event) => onExecutorNotesChange(event.target.value)}
            placeholder={t("execution.executorNotesPlaceholder", {
              defaultValue:
                "Operational notes for the executor and coordination team...",
            })}
          />
        </label>
      </div>

      {error ? (
        <div className="rounded-[18px] border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className={cn("flex items-center", isRtl ? "justify-start" : "justify-end")}>
        <Button onClick={onSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving
            ? t("common.processing", { defaultValue: "Processing..." })
            : t("common.saveChanges", { defaultValue: "Save Changes" })}
        </Button>
      </div>

      <AttachmentUploader
        title={t("execution.serviceAttachmentsUploader", {
          defaultValue: "Upload service attachments",
        })}
        buttonLabel={t("execution.uploadAttachment", {
          defaultValue: "Upload attachment",
        })}
        pending={uploadingAttachment}
        onUpload={(values) => onUploadAttachment(detail.id, values)}
      />

      <AttachmentGallery
        attachments={detail.attachments ?? []}
        title={t("execution.serviceAttachments", {
          defaultValue: "Service attachments",
        })}
        emptyText={t("execution.noServiceAttachments", {
          defaultValue: "No attachments uploaded for this service yet.",
        })}
        deleting={deletingAttachment}
        onDelete={onDeleteAttachment}
      />
    </div>
  );
}
