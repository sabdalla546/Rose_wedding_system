import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import api, { getApiErrorMessage } from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";
import type {
  VenueFormData,
  VenueSpecifications,
  VenueSpecificationFormData,
} from "@/pages/venues/types";

const normalizeOptionalString = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const toNullableNumber = (value?: string) => {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeEntrance = (
  entrance: VenueSpecificationFormData["entrances"][number],
) => ({
  name: normalizeOptionalString(entrance.name) ?? null,
  length: toNullableNumber(entrance.length),
  width: toNullableNumber(entrance.width),
  height: toNullableNumber(entrance.height),
  pieceCount: toNullableNumber(entrance.pieceCount),
});

const buildSpecificationsPayload = (
  specs: VenueSpecificationFormData,
): VenueSpecifications => ({
  hall: {
    length: toNullableNumber(specs.hall.length),
    width: toNullableNumber(specs.hall.width),
    height: toNullableNumber(specs.hall.height),
    sideCoveringPolicy: specs.hall.sideCoveringPolicy || null,
  },
  kosha: {
    length: toNullableNumber(specs.kosha.length),
    width: toNullableNumber(specs.kosha.width),
    height: toNullableNumber(specs.kosha.height),
    pieceCount: toNullableNumber(specs.kosha.pieceCount),
    frameCount: toNullableNumber(specs.kosha.frameCount),
    stairsCount: toNullableNumber(specs.kosha.stairsCount),
    stairLength: toNullableNumber(specs.kosha.stairLength),
    hasStage: specs.kosha.hasStage,
    stage: {
      length: toNullableNumber(specs.kosha.stage.length),
      width: toNullableNumber(specs.kosha.stage.width),
      height: toNullableNumber(specs.kosha.stage.height),
    },
  },
  gate: {
    length: toNullableNumber(specs.gate.length),
    width: toNullableNumber(specs.gate.width),
    height: toNullableNumber(specs.gate.height),
    pieceCount: toNullableNumber(specs.gate.pieceCount),
  },
  door: {
    length: toNullableNumber(specs.door.length),
    width: toNullableNumber(specs.door.width),
    height: toNullableNumber(specs.door.height),
  },
  entrances: specs.entrances.map(normalizeEntrance),
  buffet: {
    length: toNullableNumber(specs.buffet.length),
    width: toNullableNumber(specs.buffet.width),
    height: toNullableNumber(specs.buffet.height),
  },
  sides: {
    length: toNullableNumber(specs.sides.length),
    width: toNullableNumber(specs.sides.width),
    height: toNullableNumber(specs.sides.height),
    pieceCount: toNullableNumber(specs.sides.pieceCount),
  },
  lighting: {
    hasHangingSupport: specs.lighting.hasHangingSupport,
    hangingLength: toNullableNumber(specs.lighting.hangingLength),
    hangingWidth: toNullableNumber(specs.lighting.hangingWidth),
  },
  hotelBleachers: {
    available: specs.hotelBleachers.available,
  },
});

const buildVenuePayload = (values: VenueFormData) => ({
  name: values.name.trim(),
  city: normalizeOptionalString(values.city),
  area: normalizeOptionalString(values.area),
  address: normalizeOptionalString(values.address),
  phone: normalizeOptionalString(values.phone),
  contactPerson: normalizeOptionalString(values.contactPerson),
  notes: normalizeOptionalString(values.notes),
  isActive: values.isActive,
  specificationsJson: buildSpecificationsPayload(values.specificationsJson),
});

export const useCreateVenue = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (values: VenueFormData) =>
      api.post("/venues", buildVenuePayload(values)),
    onSuccess: () => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("venues.toast.created", {
          defaultValue: "Venue created successfully",
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["venues"] });
      navigate("/settings/venues");
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("venues.toast.createFailed", {
            defaultValue: "Failed to create venue",
          }),
        ),
      });
    },
  });
};

export const useUpdateVenue = (id?: string) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (values: VenueFormData) =>
      api.put(`/venues/${id}`, buildVenuePayload(values)),
    onSuccess: () => {
      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("venues.toast.updated", {
          defaultValue: "Venue updated successfully",
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["venues"] });
      queryClient.invalidateQueries({ queryKey: ["venue", id] });
      navigate("/settings/venues");
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("venues.toast.updateFailed", {
            defaultValue: "Failed to update venue",
          }),
        ),
      });
    },
  });
};
