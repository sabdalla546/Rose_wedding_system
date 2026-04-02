import type { TFunction } from "i18next";

import type {
  ExecutionAttachment,
  ExecutionBriefStatus,
  ExecutionServiceDetail,
  ExecutionServiceDetailStatus,
} from "./types";
import type { ExecutionTemplateKey } from "./templateFields";

const rawApiBaseUrl =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
const normalizedApiHost = rawApiBaseUrl
  .replace(/\/+$/, "")
  .replace(/\/api\/v1$/, "");

export const getExecutionBriefStatusLabel = (
  status: ExecutionBriefStatus,
  t: TFunction,
) =>
  t(`execution.briefStatusOptions.${status}`, {
    defaultValue: status,
  });

export const getExecutionServiceDetailStatusLabel = (
  status: ExecutionServiceDetailStatus,
  t: TFunction,
) =>
  t(`execution.statusOptions.${status}`, {
    defaultValue: status,
  });

export const getExecutionTemplateLabel = (templateKey: string, t: TFunction) =>
  t(`execution.templates.${templateKey}`, {
    defaultValue: templateKey,
  });

export const isExecutionServiceDetailReady = (
  status: ExecutionServiceDetailStatus,
) => status === "ready" || status === "done";

const containsAny = (source: string, terms: string[]) =>
  terms.some((term) => source.includes(term));

const normalizeStructuredPreviewValue = (value: unknown): string | null => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const resolved = normalizeStructuredPreviewValue(item);

      if (resolved) {
        return resolved;
      }
    }

    return null;
  }

  if (value && typeof value === "object") {
    for (const nestedValue of Object.values(value)) {
      const resolved = normalizeStructuredPreviewValue(nestedValue);

      if (resolved) {
        return resolved;
      }
    }
  }

  return null;
};

export const getExecutionServiceDetailPreview = (
  detail: Pick<ExecutionServiceDetail, "notes" | "executorNotes" | "detailsJson">,
  t: TFunction,
) =>
  normalizeStructuredPreviewValue(detail.notes) ??
  normalizeStructuredPreviewValue(detail.executorNotes) ??
  normalizeStructuredPreviewValue(detail.detailsJson) ??
  t("execution.previewFallback", {
    defaultValue: "Execution details available",
  });

const getUploadsPath = (value?: string | null): string | null => {
  if (!value) return null;

  const normalizedValue = value.replace(/\\/g, "/");
  const uploadsIndex = normalizedValue.indexOf("/uploads/");

  if (uploadsIndex >= 0) {
    return normalizedValue.slice(uploadsIndex);
  }

  if (normalizedValue.startsWith("uploads/")) {
    return `/${normalizedValue}`;
  }

  if (normalizedValue.startsWith("/uploads/")) {
    return normalizedValue;
  }

  return null;
};

export const resolveExecutionAttachmentUrl = (
  attachment: Pick<ExecutionAttachment, "fileUrl" | "filePath">,
): string | null => {
  const uploadsPath =
    getUploadsPath(attachment.fileUrl) ?? getUploadsPath(attachment.filePath);

  if (!uploadsPath) {
    return attachment.fileUrl ?? null;
  }

  // Prefer relative uploads paths so the app can use same-origin hosting
  // or the Vite /uploads proxy during local development.
  if (uploadsPath.startsWith("/uploads/")) {
    return uploadsPath;
  }

  try {
    return new URL(uploadsPath, `${normalizedApiHost}/`).toString();
  } catch {
    return `${normalizedApiHost}${uploadsPath}`;
  }
};

export const resolveExecutionTemplateKey = (
  detail: Pick<
    ExecutionServiceDetail,
    "templateKey" | "serviceNameSnapshot" | "service"
  >,
): ExecutionTemplateKey => {
  const current = detail.templateKey?.trim();

  if (current && current !== "generic_execution_setup") {
    return current as ExecutionTemplateKey;
  }

  const source = `${detail.service?.category ?? ""} ${
    detail.service?.name ?? ""
  } ${detail.serviceNameSnapshot ?? ""}`.toLowerCase();

  if (containsAny(source, ["كوش", "kosha", "stage", "setup stage"])) {
    return "kosha_setup";
  }

  if (containsAny(source, ["ورد", "flower", "floral", "bouquet"])) {
    return "flowers_setup";
  }

  if (containsAny(source, ["مدخل", "entrance", "entry", "gate", "بوابة"])) {
    return "entrance_setup";
  }

  if (containsAny(source, ["بوفيه", "buffet", "catering table"])) {
    return "buffet_setup";
  }

  if (
    containsAny(source, [
      "seating",
      "chair",
      "sofa",
      "front seating",
      "طقم",
      "كنب",
      "كرسي",
      "جلسة",
    ])
  ) {
    return "front_seating_setup";
  }

  return "generic_execution_setup";
};
