/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from "react";
import { Building2 } from "lucide-react";
import { useForm, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { CheckedState } from "@radix-ui/react-checkbox";

import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import {
  CrudActionsBar,
  CrudFormLayout,
  CrudFormSection,
  CrudPageLayout,
} from "@/components/shared/crud-layout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  useCreateVenue,
  useUpdateVenue,
} from "@/hooks/venues/useVenueMutations";
import { useVenue } from "@/hooks/venues/useVenues";
import type {
  VenueFormData,
  VenueSpecificationFormData,
  VenueSpecifications,
} from "@/pages/venues/types";

const venueSchema = z.object({
  name: z.string().min(2, "Venue name is required").max(150),

  city: z.string().default(""),
  area: z.string().default(""),
  address: z.string().default(""),
  phone: z.string().default(""),
  contactPerson: z.string().default(""),
  notes: z.string().default(""),

  isActive: z.boolean(),

  specificationsJson: z.object({
    hall: z.object({
      length: z.string(),
      width: z.string(),
      height: z.string(),
      sideCoveringPolicy: z.enum(["", "allowed", "not_allowed"]),
    }),

    kosha: z.object({
      length: z.string(),
      width: z.string(),
      height: z.string(),
      pieceCount: z.string(),
      frameCount: z.string(),
      stairsCount: z.string(),
      stairLength: z.string(),
      hasStage: z.boolean(),
      stage: z.object({
        length: z.string(),
        width: z.string(),
        height: z.string(),
      }),
    }),

    gate: z.object({
      length: z.string(),
      width: z.string(),
      height: z.string(),
      pieceCount: z.string(),
    }),

    door: z.object({
      length: z.string(),
      width: z.string(),
      height: z.string(),
    }),

    entrances: z.tuple([
      z.object({
        name: z.string(),
        length: z.string(),
        width: z.string(),
        height: z.string(),
        pieceCount: z.string(),
      }),
      z.object({
        name: z.string(),
        length: z.string(),
        width: z.string(),
        height: z.string(),
        pieceCount: z.string(),
      }),
      z.object({
        name: z.string(),
        length: z.string(),
        width: z.string(),
        height: z.string(),
        pieceCount: z.string(),
      }),
    ]),

    buffet: z.object({
      length: z.string(),
      width: z.string(),
      height: z.string(),
    }),

    sides: z.object({
      length: z.string(),
      width: z.string(),
      height: z.string(),
      pieceCount: z.string(),
    }),

    lighting: z.object({
      hasHangingSupport: z.boolean(),
      hangingLength: z.string(),
      hangingWidth: z.string(),
    }),

    hotelBleachers: z.object({
      available: z.boolean(),
    }),
  }),
});

const emptySpecifications = (): VenueSpecificationFormData => ({
  hall: {
    length: "",
    width: "",
    height: "",
    sideCoveringPolicy: "",
  },
  kosha: {
    length: "",
    width: "",
    height: "",
    pieceCount: "",
    frameCount: "",
    stairsCount: "",
    stairLength: "",
    hasStage: false,
    stage: {
      length: "",
      width: "",
      height: "",
    },
  },
  gate: {
    length: "",
    width: "",
    height: "",
    pieceCount: "",
  },
  door: {
    length: "",
    width: "",
    height: "",
  },
  entrances: [
    {
      name: "entrance_1",
      length: "",
      width: "",
      height: "",
      pieceCount: "",
    },
    {
      name: "entrance_2",
      length: "",
      width: "",
      height: "",
      pieceCount: "",
    },
    {
      name: "entrance_3",
      length: "",
      width: "",
      height: "",
      pieceCount: "",
    },
  ],
  buffet: {
    length: "",
    width: "",
    height: "",
  },
  sides: {
    length: "",
    width: "",
    height: "",
    pieceCount: "",
  },
  lighting: {
    hasHangingSupport: false,
    hangingLength: "",
    hangingWidth: "",
  },
  hotelBleachers: {
    available: false,
  },
});

const toText = (value?: number | null) =>
  value === null || typeof value === "undefined" ? "" : String(value);
const normalizeSpecificationsFromApi = (
  value: unknown,
): VenueSpecifications | null => {
  if (!value) return null;

  if (typeof value === "string") {
    try {
      return JSON.parse(value) as VenueSpecifications;
    } catch {
      return null;
    }
  }

  return value as VenueSpecifications;
};
const mapSpecificationsToForm = (
  specifications?: VenueSpecifications | null,
): VenueSpecificationFormData => {
  const defaults = emptySpecifications();

  return {
    hall: {
      length: toText(specifications?.hall?.length),
      width: toText(specifications?.hall?.width),
      height: toText(specifications?.hall?.height),
      sideCoveringPolicy: specifications?.hall?.sideCoveringPolicy ?? "",
    },
    kosha: {
      length: toText(specifications?.kosha?.length),
      width: toText(specifications?.kosha?.width),
      height: toText(specifications?.kosha?.height),
      pieceCount: toText(specifications?.kosha?.pieceCount),
      frameCount: toText(specifications?.kosha?.frameCount),
      stairsCount: toText(specifications?.kosha?.stairsCount),
      stairLength: toText(specifications?.kosha?.stairLength),
      hasStage: specifications?.kosha?.hasStage ?? false,
      stage: {
        length: toText(specifications?.kosha?.stage?.length),
        width: toText(specifications?.kosha?.stage?.width),
        height: toText(specifications?.kosha?.stage?.height),
      },
    },
    gate: {
      length: toText(specifications?.gate?.length),
      width: toText(specifications?.gate?.width),
      height: toText(specifications?.gate?.height),
      pieceCount: toText(specifications?.gate?.pieceCount),
    },
    door: {
      length: toText(specifications?.door?.length),
      width: toText(specifications?.door?.width),
      height: toText(specifications?.door?.height),
    },
    entrances: [
      {
        name:
          specifications?.entrances?.[0]?.name ?? defaults.entrances[0].name,
        length: toText(specifications?.entrances?.[0]?.length),
        width: toText(specifications?.entrances?.[0]?.width),
        height: toText(specifications?.entrances?.[0]?.height),
        pieceCount: toText(specifications?.entrances?.[0]?.pieceCount),
      },
      {
        name:
          specifications?.entrances?.[1]?.name ?? defaults.entrances[1].name,
        length: toText(specifications?.entrances?.[1]?.length),
        width: toText(specifications?.entrances?.[1]?.width),
        height: toText(specifications?.entrances?.[1]?.height),
        pieceCount: toText(specifications?.entrances?.[1]?.pieceCount),
      },
      {
        name:
          specifications?.entrances?.[2]?.name ?? defaults.entrances[2].name,
        length: toText(specifications?.entrances?.[2]?.length),
        width: toText(specifications?.entrances?.[2]?.width),
        height: toText(specifications?.entrances?.[2]?.height),
        pieceCount: toText(specifications?.entrances?.[2]?.pieceCount),
      },
    ],
    buffet: {
      length: toText(specifications?.buffet?.length),
      width: toText(specifications?.buffet?.width),
      height: toText(specifications?.buffet?.height),
    },
    sides: {
      length: toText(specifications?.sides?.length),
      width: toText(specifications?.sides?.width),
      height: toText(specifications?.sides?.height),
      pieceCount: toText(specifications?.sides?.pieceCount),
    },
    lighting: {
      hasHangingSupport: specifications?.lighting?.hasHangingSupport ?? false,
      hangingLength: toText(specifications?.lighting?.hangingLength),
      hangingWidth: toText(specifications?.lighting?.hangingWidth),
    },
    hotelBleachers: {
      available: specifications?.hotelBleachers?.available ?? false,
    },
  };
};

function SpecInput({
  control,
  name,
  label,
  placeholder,
}: {
  control: Control<any>;
  name: string;
  label: string;
  placeholder?: string;
}) {
  return (
    <FormField
      control={control}
      name={name as any}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input {...field} placeholder={placeholder ?? label} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
function SpecCheckbox({
  control,
  name,
  label,
}: {
  control: Control<any>;
  name: string;
  label: string;
}) {
  return (
    <FormField
      control={control}
      name={name as any}
      render={({ field }) => (
        <FormItem>
          <div className="form-status-card">
            <FormControl>
              <Checkbox
                checked={Boolean(field.value)}
                onCheckedChange={(checked: CheckedState) =>
                  field.onChange(Boolean(checked))
                }
              />
            </FormControl>
            <FormLabel className="cursor-pointer text-[var(--lux-text)]">
              {label}
            </FormLabel>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

const VenueFormPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const { data: venue, isLoading: venueLoading } = useVenue(id);
  const createMutation = useCreateVenue();
  const updateMutation = useUpdateVenue(id);
  type VenueSchemaInput = z.input<typeof venueSchema>;
  type VenueSchemaOutput = z.output<typeof venueSchema>;
  const form = useForm<VenueSchemaInput, any, VenueSchemaOutput>({
    resolver: zodResolver(venueSchema),
    defaultValues: {
      name: "",
      city: "",
      area: "",
      address: "",
      phone: "",
      contactPerson: "",
      notes: "",
      isActive: true,
      specificationsJson: emptySpecifications(),
    },
  });
  useEffect(() => {
    if (!isEditMode || !venue) return;

    const normalizedSpecifications = normalizeSpecificationsFromApi(
      (venue as any).specificationsJson,
    );

    console.log("venue from api", venue);
    console.log("raw specificationsJson", (venue as any).specificationsJson);
    console.log("normalized specificationsJson", normalizedSpecifications);

    form.reset({
      name: venue.name ?? "",
      city: venue.city ?? "",
      area: venue.area ?? "",
      address: venue.address ?? "",
      phone: venue.phone ?? "",
      contactPerson: venue.contactPerson ?? "",
      notes: venue.notes ?? "",
      isActive: venue.isActive ?? true,
      specificationsJson: mapSpecificationsToForm(normalizedSpecifications),
    });
  }, [form, isEditMode, venue]);

  const onSubmit = (values: VenueSchemaOutput) => {
    const payload = values as VenueFormData;

    if (isEditMode) {
      updateMutation.mutate(payload);
      return;
    }

    createMutation.mutate(payload);
  };

  const isBusy =
    venueLoading || createMutation.isPending || updateMutation.isPending;

  if (venueLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-sm text-[var(--lux-text-secondary)]">
          {t("common.loading", { defaultValue: "Loading..." })}
        </div>
      </div>
    );
  }

  return (
    <ProtectedComponent
      permission={isEditMode ? "venues.update" : "venues.create"}
    >
      <CrudPageLayout>
        <div dir={i18n.dir()}>
          <CrudFormLayout
            icon={<Building2 className="h-5 w-5 text-primary" />}
            title={
              isEditMode
                ? t("venues.editTitle", { defaultValue: "Edit Venue" })
                : t("venues.createTitle", { defaultValue: "Create Venue" })
            }
            description={
              isEditMode
                ? t("venues.editDescription", {
                    defaultValue: "Update venue details and availability.",
                  })
                : t("venues.createDescription", {
                    defaultValue:
                      "Create a venue record for halls and wedding locations.",
                  })
            }
            backAction={
              <button
                type="button"
                onClick={() => navigate("/settings/venues")}
                className="crud-header-back"
              >
                <span aria-hidden="true">{"<-"}</span>
                {t("venues.backToVenues", { defaultValue: "Back to Venues" })}
              </button>
            }
          >
            <div className="p-6 md:p-8">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-8"
                >
                  <CrudFormSection
                    title={t("venues.basicInformation", {
                      defaultValue: "Basic Information",
                    })}
                    description={t("venues.basicInformationHint", {
                      defaultValue:
                        "Add the primary information for this venue.",
                    })}
                  >
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("venues.name", { defaultValue: "Venue Name" })}
                            </FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="contactPerson"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("venues.contactPerson", {
                                defaultValue: "Contact Person",
                              })}
                            </FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("venues.city", { defaultValue: "City" })}
                            </FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="area"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("venues.area", { defaultValue: "Area" })}
                            </FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("venues.phone", { defaultValue: "Phone" })}
                            </FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>
                              {t("venues.address", { defaultValue: "Address" })}
                            </FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CrudFormSection>

                  <CrudFormSection title="مواصفات الصالة">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <SpecInput
                        control={form.control}
                        name="specificationsJson.hall.length"
                        label="طول الصالة"
                      />
                      <SpecInput
                        control={form.control}
                        name="specificationsJson.hall.width"
                        label="عرض الصالة"
                      />
                      <SpecInput
                        control={form.control}
                        name="specificationsJson.hall.height"
                        label="ارتفاع الصالة"
                      />

                      <FormField
                        control={form.control}
                        name="specificationsJson.hall.sideCoveringPolicy"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>جوانب الصالة</FormLabel>
                            <FormControl>
                              <select
                                value={field.value}
                                onChange={field.onChange}
                                className="app-input h-10 w-full rounded-md border bg-background px-3"
                              >
                                <option value="">اختر</option>
                                <option value="allowed">مسموح تتغطه</option>
                                <option value="not_allowed">ممنوع تتغطه</option>
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CrudFormSection>

                  <CrudFormSection title="مواصفات الكوشة">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <SpecInput
                        control={form.control}
                        name="specificationsJson.kosha.length"
                        label="طول الكوشة"
                      />
                      <SpecInput
                        control={form.control}
                        name="specificationsJson.kosha.width"
                        label="عرض الكوشة"
                      />
                      <SpecInput
                        control={form.control}
                        name="specificationsJson.kosha.height"
                        label="ارتفاع الكوشة"
                      />
                      <SpecInput
                        control={form.control}
                        name="specificationsJson.kosha.pieceCount"
                        label="الكوشة كام بيست"
                      />
                      <SpecInput
                        control={form.control}
                        name="specificationsJson.kosha.frameCount"
                        label="الكوشة كام فريم"
                      />
                      <SpecInput
                        control={form.control}
                        name="specificationsJson.kosha.stairsCount"
                        label="الكوشة كام سلم"
                      />
                      <SpecInput
                        control={form.control}
                        name="specificationsJson.kosha.stairLength"
                        label="طول سلمة الكوشة"
                      />
                    </div>

                    <div className="mt-4">
                      <SpecCheckbox
                        control={form.control}
                        name="specificationsJson.kosha.hasStage"
                        label="يوجد استيج للكوشة"
                      />
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                      <SpecInput
                        control={form.control}
                        name="specificationsJson.kosha.stage.length"
                        label="طول استيج الكوشة"
                      />
                      <SpecInput
                        control={form.control}
                        name="specificationsJson.kosha.stage.width"
                        label="عرض استيج الكوشة"
                      />
                      <SpecInput
                        control={form.control}
                        name="specificationsJson.kosha.stage.height"
                        label="ارتفاع استيج الكوشة"
                      />
                    </div>
                  </CrudFormSection>

                  <CrudFormSection title="البوابة والباب">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <SpecInput
                        control={form.control}
                        name="specificationsJson.gate.length"
                        label="طول البوابة"
                      />
                      <SpecInput
                        control={form.control}
                        name="specificationsJson.gate.width"
                        label="عرض البوابة"
                      />
                      <SpecInput
                        control={form.control}
                        name="specificationsJson.gate.height"
                        label="ارتفاع البوابة"
                      />
                      <SpecInput
                        control={form.control}
                        name="specificationsJson.gate.pieceCount"
                        label="البوابة كام بيست"
                      />

                      <SpecInput
                        control={form.control}
                        name="specificationsJson.door.length"
                        label="طول الباب"
                      />
                      <SpecInput
                        control={form.control}
                        name="specificationsJson.door.width"
                        label="عرض الباب"
                      />
                      <SpecInput
                        control={form.control}
                        name="specificationsJson.door.height"
                        label="ارتفاع الباب"
                      />
                    </div>
                  </CrudFormSection>

                  <CrudFormSection title="المداخل">
                    {[0, 1, 2].map((index) => (
                      <div key={index} className="mb-6 rounded-xl border p-4">
                        <h4 className="mb-4 font-medium">
                          {`المدخل ${index + 1}`}
                        </h4>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <SpecInput
                            control={form.control}
                            name={`specificationsJson.entrances.${index}.name`}
                            label="اسم المدخل"
                          />
                          <SpecInput
                            control={form.control}
                            name={`specificationsJson.entrances.${index}.pieceCount`}
                            label="كام بيست"
                          />
                          <SpecInput
                            control={form.control}
                            name={`specificationsJson.entrances.${index}.length`}
                            label="الطول"
                          />
                          <SpecInput
                            control={form.control}
                            name={`specificationsJson.entrances.${index}.width`}
                            label="العرض"
                          />
                          <SpecInput
                            control={form.control}
                            name={`specificationsJson.entrances.${index}.height`}
                            label="الارتفاع"
                          />
                        </div>
                      </div>
                    ))}
                  </CrudFormSection>

                  <CrudFormSection title="البوفيه والجوانب">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <SpecInput
                        control={form.control}
                        name="specificationsJson.buffet.length"
                        label="طول البوفيه"
                      />
                      <SpecInput
                        control={form.control}
                        name="specificationsJson.buffet.width"
                        label="عرض البوفيه"
                      />
                      <SpecInput
                        control={form.control}
                        name="specificationsJson.buffet.height"
                        label="ارتفاع البوفيه"
                      />

                      <SpecInput
                        control={form.control}
                        name="specificationsJson.sides.length"
                        label="طول الجوانب"
                      />
                      <SpecInput
                        control={form.control}
                        name="specificationsJson.sides.width"
                        label="عرض الجوانب"
                      />
                      <SpecInput
                        control={form.control}
                        name="specificationsJson.sides.height"
                        label="ارتفاع الجوانب"
                      />
                      <SpecInput
                        control={form.control}
                        name="specificationsJson.sides.pieceCount"
                        label="الجوانب كام بيست"
                      />
                    </div>
                  </CrudFormSection>

                  <CrudFormSection title="الإضاءات والمدرجات">
                    <div className="space-y-4">
                      <SpecCheckbox
                        control={form.control}
                        name="specificationsJson.lighting.hasHangingSupport"
                        label="هل يوجد تعليق للإضاءات"
                      />

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <SpecInput
                          control={form.control}
                          name="specificationsJson.lighting.hangingLength"
                          label="طول المعلقات"
                        />
                        <SpecInput
                          control={form.control}
                          name="specificationsJson.lighting.hangingWidth"
                          label="عرض المعلقات"
                        />
                      </div>

                      <SpecCheckbox
                        control={form.control}
                        name="specificationsJson.hotelBleachers.available"
                        label="يوجد مدرجات من الفندق"
                      />
                    </div>
                  </CrudFormSection>

                  <CrudFormSection
                    title={t("venues.additionalDetails", {
                      defaultValue: "Additional Details",
                    })}
                  >
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("common.notes", { defaultValue: "Notes" })}
                          </FormLabel>
                          <FormControl>
                            <textarea
                              {...field}
                              className="app-textarea min-h-[120px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CrudFormSection>

                  <CrudFormSection
                    title={t("venues.statusSection", {
                      defaultValue: "Status",
                    })}
                  >
                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem>
                          <div className="form-status-card">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={(checked: CheckedState) =>
                                  field.onChange(Boolean(checked))
                                }
                              />
                            </FormControl>
                            <FormLabel className="cursor-pointer text-[var(--lux-text)]">
                              {t("venues.activeVenue", {
                                defaultValue: "Active venue",
                              })}
                            </FormLabel>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CrudFormSection>

                  <CrudActionsBar>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/settings/venues")}
                      disabled={isBusy}
                    >
                      {t("common.cancel", { defaultValue: "Cancel" })}
                    </Button>

                    <Button type="submit" disabled={isBusy}>
                      {isBusy
                        ? t("common.processing", {
                            defaultValue: "Processing...",
                          })
                        : isEditMode
                          ? t("common.update", { defaultValue: "Update" })
                          : t("common.create", { defaultValue: "Create" })}
                    </Button>
                  </CrudActionsBar>
                </form>
              </Form>
            </div>
          </CrudFormLayout>
        </div>
      </CrudPageLayout>
    </ProtectedComponent>
  );
};

export default VenueFormPage;
