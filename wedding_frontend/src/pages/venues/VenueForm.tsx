import { useEffect } from "react";
import { Building2 } from "lucide-react";
import { useForm, type SubmitHandler } from "react-hook-form";
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
import { useCreateVenue, useUpdateVenue } from "@/hooks/venues/useVenueMutations";
import { useVenue } from "@/hooks/venues/useVenues";

const venueSchema = z.object({
  name: z.string().min(2, "Venue name is required").max(150),
  city: z.string().max(100).optional(),
  area: z.string().max(100).optional(),
  address: z.string().max(255).optional(),
  phone: z.string().max(30).optional(),
  contactPerson: z.string().max(150).optional(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

type VenueFormValues = z.infer<typeof venueSchema>;

const VenueFormPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const { data: venue, isLoading: venueLoading } = useVenue(id);
  const createMutation = useCreateVenue();
  const updateMutation = useUpdateVenue(id);

  const form = useForm<VenueFormValues>({
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
    },
  });

  useEffect(() => {
    if (!isEditMode || !venue) {
      return;
    }

    form.reset({
      name: venue.name,
      city: venue.city ?? "",
      area: venue.area ?? "",
      address: venue.address ?? "",
      phone: venue.phone ?? "",
      contactPerson: venue.contactPerson ?? "",
      notes: venue.notes ?? "",
      isActive: venue.isActive,
    });
  }, [form, isEditMode, venue]);

  const onSubmit: SubmitHandler<VenueFormValues> = (values) => {
    if (isEditMode) {
      updateMutation.mutate(values);
      return;
    }

    createMutation.mutate(values);
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
                              <Input
                                {...field}
                                placeholder={t("venues.namePlaceholder", {
                                  defaultValue: "Enter venue name",
                                })}
                              />
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
                              <Input
                                {...field}
                                placeholder={t("venues.contactPersonPlaceholder", {
                                  defaultValue: "Enter contact person",
                                })}
                              />
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
                              <Input
                                {...field}
                                placeholder={t("venues.cityPlaceholder", {
                                  defaultValue: "Enter city",
                                })}
                              />
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
                              <Input
                                {...field}
                                placeholder={t("venues.areaPlaceholder", {
                                  defaultValue: "Enter area",
                                })}
                              />
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
                              <Input
                                {...field}
                                placeholder={t("venues.phonePlaceholder", {
                                  defaultValue: "Enter phone number",
                                })}
                              />
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
                              <Input
                                {...field}
                                placeholder={t("venues.addressPlaceholder", {
                                  defaultValue: "Enter full address",
                                })}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
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
                              placeholder={t("venues.notesPlaceholder", {
                                defaultValue:
                                  "Add operational notes, hall rules, or contact details...",
                              })}
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
