import dayjs from "dayjs";
import type { CompanyProfile } from "./document.types";

const DEFAULT_MONEY_SUFFIX = process.env.DOCUMENT_MONEY_SUFFIX || "د.ك";

export function normalizeDecimal(value?: number | string | null): number {
  const parsed = Number(value ?? 0);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Number(parsed.toFixed(3));
}

export function formatMoney(value?: number | string | null, suffix = DEFAULT_MONEY_SUFFIX) {
  return `${normalizeDecimal(value).toFixed(3)} ${suffix}`.trim();
}

export function formatDate(value?: string | Date | null, pattern = "DD/MM/YYYY") {
  if (!value) {
    return "-";
  }

  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format(pattern) : "-";
}

export function formatQuantity(value?: number | string | null) {
  return normalizeDecimal(value).toFixed(3);
}

export function displayText(value?: string | number | null, fallback = "-") {
  if (value === null || typeof value === "undefined") {
    return fallback;
  }

  const text = String(value).trim();
  return text ? text : fallback;
}

export function sanitizeFilenamePart(value?: string | number | null, fallback = "document") {
  const raw = displayText(value, fallback);
  const normalized = raw.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/-+/g, "-");
  return normalized.replace(/^-|-$/g, "") || fallback;
}

export function getCompanyProfile(): CompanyProfile {
  return {
    name: process.env.COMPANY_NAME || "Rose Wedding",
    phone: process.env.COMPANY_PHONE || "",
    email: process.env.COMPANY_EMAIL || "",
    address: process.env.COMPANY_ADDRESS || "",
    website: process.env.COMPANY_WEBSITE || "",
    logoUrl: process.env.COMPANY_LOGO_URL || null,
  };
}
