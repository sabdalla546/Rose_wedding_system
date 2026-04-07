import { z } from "zod";

const toOptionalNumber = (value: unknown) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : value;
  }

  return value;
};

const toOptionalTrimmedString = (value: unknown) => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed || undefined;
};

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const paginationQuerySchema = z.object({
  page: z.preprocess(toOptionalNumber, z.number().int().positive().optional()),
  limit: z.preprocess(toOptionalNumber, z.number().int().positive().optional()),
});

export const optionalPositiveIntQuery = z.preprocess(
  toOptionalNumber,
  z.number().int().positive().optional(),
);

export const optionalTrimmedStringQuery = z.preprocess(
  toOptionalTrimmedString,
  z.string().optional(),
);
