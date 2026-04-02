import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, ClipboardList, Loader2, Save } from "lucide-react";

import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AttachmentGallery } from "./AttachmentGallery";
import { AttachmentUploader } from "./AttachmentUploader";
import { StructuredFieldRenderer } from "./StructuredFieldRenderer";
import {
  getExecutionServiceDetailStatusLabel,
  getExecutionTemplateLabel,
  resolveExecutionTemplateKey,
} from "@/pages/execution/adapters";
import {
  getExecutionStructuredFields,
  getExecutionTemplateOptions,
} from "@/pages/execution/templateFields";
import type {
  ExecutionServiceDetail,
  ExecutionServiceDetailStatus,
  UploadExecutionAttachmentPayload,
} from "@/pages/execution/types";
import { cn } from "@/lib/utils";

type DetailFormState = {
  templateKey: string;
  status: ExecutionServiceDetailStatus;
  sortOrder: string;
  notes: string;
  executorNotes: string;
  structuredValues: Record<string, unknown>;
};

const textareaClassName =
  "min-h-[110px] w-full rounded-[22px] border px-4 py-3 text-sm text-[var(--lux-text)] placeholder:text-[var(--lux-text-muted)] outline-none transition-all focus:border-[var(--lux-gold-border)] focus:ring-2 focus:ring-[var(--lux-gold-glow)]";

const normalizeStructuredValues = (value?: Record<string, unknown> | null) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value;
};

const createDetailFormState = (
  detail: ExecutionServiceDetail,
): DetailFormState => {
  const resolvedTemplateKey = resolveExecutionTemplateKey(detail);

  return {
    templateKey: resolvedTemplateKey,
    status: detail.status,
    sortOrder: String(detail.sortOrder ?? 0),
    notes: detail.notes ?? "",
    executorNotes: detail.executorNotes ?? "",
    structuredValues: normalizeStructuredValues(detail.detailsJson),
  };
};

type Props = {
  detail: ExecutionServiceDetail;
  onSave: (
    detailId: number,
    values: {
      templateKey: string;
      status: ExecutionServiceDetailStatus;
      sortOrder: number;
      notes: string | null;
      executorNotes: string | null;
      detailsJson: Record<string, unknown> | null;
    },
  ) => Promise<void> | void;
  saving: boolean;
  onUploadAttachment: (
    serviceDetailId: number,
    values: UploadExecutionAttachmentPayload,
  ) => Promise<void> | void;
  uploadingAttachment: boolean;
  onDeleteAttachment: (attachmentId: number) => Promise<void> | void;
  deletingAttachment: boolean;
};

export function ServiceDetailEditorCard({
  detail,
  onSave,
  saving,
  onUploadAttachment,
  uploadingAttachment,
  onDeleteAttachment,
  deletingAttachment,
}: Props) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";

  const [form, setForm] = useState<DetailFormState>(() =>
    createDetailFormState(detail),
  );
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(createDetailFormState(detail));
    setError("");
  }, [detail]);

  const structuredFields = useMemo(
    () => getExecutionStructuredFields(form.templateKey, t),
    [form.templateKey, t],
  );

  const templateOptions = useMemo(() => getExecutionTemplateOptions(t), [t]);

  const handleSave = async () => {
    const sortOrderValue = Number(form.sortOrder || 0);

    if (!Number.isInteger(sortOrderValue) || sortOrderValue < 0) {
      setError(
        t("execution.sortOrderInvalid", {
          defaultValue: "Sort order must be zero or greater.",
        }),
      );
      return;
    }

    setError("");

    await onSave(detail.id, {
      templateKey:
        form.templateKey.trim() || resolveExecutionTemplateKey(detail),
      status: form.status,
      sortOrder: sortOrderValue,
      notes: form.notes.trim() ? form.notes.trim() : null,
      executorNotes: form.executorNotes.trim()
        ? form.executorNotes.trim()
        : null,
      detailsJson:
        Object.keys(form.structuredValues).length > 0
          ? form.structuredValues
          : null,
    });
  };

  return (
    <SectionCard className="space-y-5 border border-[var(--lux-row-border)]">
      <div
        className={cn(
          "flex flex-col gap-3 lg:items-start lg:justify-between",
          "lg:flex-row",
        )}
      >
        <div className={cn("space-y-1", isRtl ? "text-right" : "text-left")}>
          <h4 className="text-lg font-semibold text-[var(--lux-heading)]">
            {detail.serviceNameSnapshot ||
              detail.service?.name ||
              t("services.service", { defaultValue: "Service" })}
          </h4>
          <p className="text-sm text-[var(--lux-text-secondary)]">
            {t("execution.serviceDetailId", {
              defaultValue: "Detail ID",
            })}
            : #{detail.id}
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--lux-row-border)] px-3 py-1 text-xs text-[var(--lux-text-secondary)]">
          {detail.status === "ready" || detail.status === "done" ? (
            <CheckCircle2 className="h-4 w-4 text-[var(--color-success)]" />
          ) : (
            <ClipboardList className="h-4 w-4 text-[var(--lux-gold)]" />
          )}
          <span>{getExecutionServiceDetailStatusLabel(detail.status, t)}</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="space-y-2">
          <span className="text-sm font-medium text-[var(--lux-text)]">
            {t("execution.templateKey", { defaultValue: "Template Key" })}
          </span>
          <Select
            value={form.templateKey}
            onValueChange={(value) =>
              setForm((current) => ({
                ...current,
                templateKey: value,
                structuredValues: {},
              }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
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
            value={form.status}
            onValueChange={(value) =>
              setForm((current) => ({
                ...current,
                status: value as ExecutionServiceDetailStatus,
              }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
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
            value={form.sortOrder}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                sortOrder: event.target.value,
              }))
            }
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {structuredFields.map((field) => (
          <label
            key={field.key}
            className={cn(
              "space-y-2",
              field.type === "textarea" ? "md:col-span-2" : "",
            )}
          >
            <span className="text-sm font-medium text-[var(--lux-text)]">
              {field.label}
            </span>
            <StructuredFieldRenderer
              field={field}
              value={form.structuredValues[field.key]}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  structuredValues: {
                    ...current.structuredValues,
                    [field.key]: value,
                  },
                }))
              }
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
            className={textareaClassName}
            value={form.notes}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                notes: event.target.value,
              }))
            }
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
            className={textareaClassName}
            value={form.executorNotes}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                executorNotes: event.target.value,
              }))
            }
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

      <div className="flex items-center justify-end">
        <Button onClick={handleSave} disabled={saving}>
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
    </SectionCard>
  );
}
