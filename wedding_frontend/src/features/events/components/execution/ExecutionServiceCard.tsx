import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  resolveExecutionTemplateKey,
  getExecutionTemplateLabel,
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
import { ExecutionServiceCardExpandedPanel } from "./ExecutionServiceCardExpandedPanel";
import { ExecutionServiceCardHeader } from "./ExecutionServiceCardHeader";

type DetailFormState = {
  templateKey: string;
  status: ExecutionServiceDetailStatus;
  sortOrder: string;
  notes: string;
  executorNotes: string;
  structuredValues: Record<string, unknown>;
};

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
  expanded: boolean;
  onToggle: () => void;
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

export function ExecutionServiceCard({
  detail,
  expanded,
  onToggle,
  onSave,
  saving,
  onUploadAttachment,
  uploadingAttachment,
  onDeleteAttachment,
  deletingAttachment,
}: Props) {
  const { t } = useTranslation();
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

  const resolvedCardTemplateLabel = getExecutionTemplateLabel(
    resolveExecutionTemplateKey(detail),
    t,
  );

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[30px] border transition-all duration-200",
        expanded
          ? "border-[var(--lux-gold-border)] bg-[color-mix(in_srgb,var(--lux-panel-surface)_94%,black)] shadow-[0_20px_60px_color-mix(in_srgb,var(--lux-gold)_12%,transparent)] xl:col-span-2"
          : "border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)] hover:border-[color-mix(in_srgb,var(--lux-gold)_24%,var(--lux-row-border))]",
      )}
      style={{
        background:
          "radial-gradient(circle at top right, color-mix(in srgb, var(--lux-gold) 10%, transparent), transparent 38%), linear-gradient(155deg, color-mix(in srgb, var(--lux-panel-surface) 94%, black), color-mix(in srgb, var(--lux-control-hover) 36%, transparent))",
      }}
      aria-label={`${resolvedCardTemplateLabel} ${t("execution.blockLabel", {
        defaultValue: "Execution block",
      })}`}
    >
      <ExecutionServiceCardHeader
        detail={detail}
        expanded={expanded}
        onToggle={onToggle}
      />

      {expanded ? (
        <ExecutionServiceCardExpandedPanel
          detail={detail}
          templateOptions={templateOptions}
          structuredFields={structuredFields}
          templateKey={form.templateKey}
          status={form.status}
          sortOrder={form.sortOrder}
          notes={form.notes}
          executorNotes={form.executorNotes}
          structuredValues={form.structuredValues}
          error={error}
          saving={saving}
          uploadingAttachment={uploadingAttachment}
          deletingAttachment={deletingAttachment}
          onTemplateKeyChange={(value) =>
            setForm((current) => ({
              ...current,
              templateKey: value,
              structuredValues: {},
            }))
          }
          onStatusChange={(value) =>
            setForm((current) => ({
              ...current,
              status: value,
            }))
          }
          onSortOrderChange={(value) =>
            setForm((current) => ({
              ...current,
              sortOrder: value,
            }))
          }
          onStructuredFieldChange={(fieldKey, value) =>
            setForm((current) => ({
              ...current,
              structuredValues: {
                ...current.structuredValues,
                [fieldKey]: value,
              },
            }))
          }
          onNotesChange={(value) =>
            setForm((current) => ({
              ...current,
              notes: value,
            }))
          }
          onExecutorNotesChange={(value) =>
            setForm((current) => ({
              ...current,
              executorNotes: value,
            }))
          }
          onSave={handleSave}
          onUploadAttachment={onUploadAttachment}
          onDeleteAttachment={onDeleteAttachment}
        />
      ) : null}
    </div>
  );
}
