import { z } from "zod";
import {
  optionalTrimmedStringQuery,
  paginationQuerySchema,
} from "./common.schemas";

const toTrimmedString = (value: unknown) => {
  if (typeof value !== "string") {
    return value;
  }

  return value.trim();
};

const toOptionalNullableTrimmedString = (value: unknown) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
};

const toOptionalBoolean = (value: unknown) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (normalized === "true") {
      return true;
    }

    if (normalized === "false") {
      return false;
    }
  }

  return value;
};

const toOptionalNullableNumber = (value: unknown) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === "") {
    return null;
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (trimmed === "") {
      return null;
    }

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : value;
  }

  return value;
};

const optionalNullableTrimmedString = (max: number) =>
  z.preprocess(
    toOptionalNullableTrimmedString,
    z.union([z.string().max(max), z.null()]).optional(),
  );

const optionalNullableNumber = z.preprocess(
  toOptionalNullableNumber,
  z.union([z.number().min(0), z.null()]).optional(),
);

const optionalNullableInt = z.preprocess(
  toOptionalNullableNumber,
  z.union([z.number().int().min(0), z.null()]).optional(),
);

const entranceSchema = z.object({
  name: optionalNullableTrimmedString(100),
  length: optionalNullableNumber,
  width: optionalNullableNumber,
  height: optionalNullableNumber,
  pieceCount: optionalNullableInt,
});

export const venueSpecificationsSchema = z
  .object({
    hall: z
      .object({
        length: optionalNullableNumber,
        width: optionalNullableNumber,
        height: optionalNullableNumber,
        sideCoveringPolicy: z
          .enum(["allowed", "not_allowed"])
          .nullable()
          .optional(),
      })
      .nullable()
      .optional(),

    kosha: z
      .object({
        length: optionalNullableNumber,
        width: optionalNullableNumber,
        height: optionalNullableNumber,
        pieceCount: optionalNullableInt,
        frameCount: optionalNullableInt,
        stairsCount: optionalNullableInt,
        stairLength: optionalNullableNumber,
        hasStage: z.preprocess(toOptionalBoolean, z.boolean().optional()),
        stage: z
          .object({
            length: optionalNullableNumber,
            width: optionalNullableNumber,
            height: optionalNullableNumber,
          })
          .nullable()
          .optional(),
      })
      .nullable()
      .optional(),

    gate: z
      .object({
        length: optionalNullableNumber,
        width: optionalNullableNumber,
        height: optionalNullableNumber,
        pieceCount: optionalNullableInt,
      })
      .nullable()
      .optional(),

    door: z
      .object({
        length: optionalNullableNumber,
        width: optionalNullableNumber,
        height: optionalNullableNumber,
      })
      .nullable()
      .optional(),

    entrances: z.array(entranceSchema).max(3).nullable().optional(),

    buffet: z
      .object({
        length: optionalNullableNumber,
        width: optionalNullableNumber,
        height: optionalNullableNumber,
      })
      .nullable()
      .optional(),

    sides: z
      .object({
        length: optionalNullableNumber,
        width: optionalNullableNumber,
        height: optionalNullableNumber,
        pieceCount: optionalNullableInt,
      })
      .nullable()
      .optional(),

    lighting: z
      .object({
        hasHangingSupport: z.preprocess(
          toOptionalBoolean,
          z.boolean().optional(),
        ),
        hangingLength: optionalNullableNumber,
        hangingWidth: optionalNullableNumber,
      })
      .nullable()
      .optional(),

    hotelBleachers: z
      .object({
        available: z.preprocess(toOptionalBoolean, z.boolean().optional()),
      })
      .nullable()
      .optional(),
  })
  .strict();

export const createVenueSchema = z.object({
  name: z.preprocess(
    toTrimmedString,
    z
      .string()
      .min(2)
      .max(150)
      .refine((value) => value.trim().length >= 2),
  ),
  city: optionalNullableTrimmedString(100),
  area: optionalNullableTrimmedString(100),
  address: optionalNullableTrimmedString(255),
  phone: optionalNullableTrimmedString(30),
  contactPerson: optionalNullableTrimmedString(150),
  notes: optionalNullableTrimmedString(5000),
  isActive: z.preprocess(toOptionalBoolean, z.boolean().optional()),
  specificationsJson: venueSpecificationsSchema.nullable().optional(),
});

export const updateVenueSchema = z
  .object({
    name: z.preprocess(
      toTrimmedString,
      z
        .string()
        .min(2)
        .max(150)
        .refine((value) => value.trim().length >= 2)
        .optional(),
    ),
    city: optionalNullableTrimmedString(100),
    area: optionalNullableTrimmedString(100),
    address: optionalNullableTrimmedString(255),
    phone: optionalNullableTrimmedString(30),
    contactPerson: optionalNullableTrimmedString(150),
    notes: optionalNullableTrimmedString(5000),
    isActive: z.preprocess(toOptionalBoolean, z.boolean().optional()),
    specificationsJson: venueSpecificationsSchema.nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const venueListQuerySchema = paginationQuerySchema.extend({
  search: optionalTrimmedStringQuery,
  isActive: z.preprocess(toOptionalBoolean, z.boolean().optional()),
});

export type CreateVenueInput = z.infer<typeof createVenueSchema>;
export type UpdateVenueInput = z.infer<typeof updateVenueSchema>;
export type VenueListQueryInput = z.infer<typeof venueListQuerySchema>;
export type VenueSpecificationsInput = z.infer<
  typeof venueSpecificationsSchema
>;
