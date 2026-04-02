import type { TFunction } from "i18next";

import type {
  ExecutionBriefStatus,
  ExecutionServiceDetail,
  ExecutionServiceDetailStatus,
} from "./types";
import type { ExecutionTemplateKey } from "./templateFields";

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

const containsAny = (source: string, terms: string[]) =>
  terms.some((term) => source.includes(term));

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
