import { useEffect } from "react";
import { Building2 } from "lucide-react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { CheckedState } from "@radix-ui/react-checkbox";

import { PageContainer } from "@/components/layout/page-container";
import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

const sectionTitleClass = "text-lg font-semibold text-[var(--lux-heading)]";
const sectionHintClass = "text-sm text-[var(--lux-text-secondary)]";

const VenueFormPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const { data: venue, isLoading: venueLoading } = useVenue(id);
  const createMutation = useCreateVenue();
  const updateMutation = useUpdateVenue(id);

  const form = useForm<VenueFormValues>({
    resolver: zodResolver(venueSchema) as any,
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
      <PageContainer className="pb-4 pt-4 text-foreground">
        <div dir={i18n.dir()} className="mx-auto w-full max-w-5xl space-y-6">
          <button
            type="button"
            onClick={() => navigate("/settings/venues")}
            className="inline-flex items-center gap-2 text-sm text-[var(--lux-text-secondary)] transition-colors hover:text-[var(--lux-gold)]"
          >
            {"<-"}{" "}
            {t("venues.backToVenues", { defaultValue: "Back to Venues" })}
          </button>

          <div
            className="overflow-hidden rounded-[24px] border p-4 shadow-luxe"
            style={{
              background: "var(--lux-panel-surface)",
              borderColor: "var(--lux-panel-border)",
            }}
          >
            <div className="flex items-start gap-4">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-[18px] border"
                style={{
                  background: "var(--lux-control-hover)",
                  borderColor: "var(--lux-control-border)",
                  color: "var(--lux-gold)",
                }}
              >
                <Building2 className="h-6 w-6" />
              </div>

              <div className="space-y-1">
                <h1 className="text-xl font-bold text-[var(--lux-heading)]">
                  {isEditMode
                    ? t("venues.editTitle", { defaultValue: "Edit Venue" })
                    : t("venues.createTitle", { defaultValue: "Create Venue" })}
                </h1>
                <p className="text-sm text-[var(--lux-text-secondary)]">
                  {isEditMode
                    ? t("venues.editDescription", {
                        defaultValue: "Update venue details and availability.",
                      })
                    : t("venues.createDescription", {
                        defaultValue:
                          "Create a venue record for halls and wedding locations.",
                      })}
                </p>
              </div>
            </div>
          </div>

          <Card className="overflow-hidden rounded-[24px]">
            <div className="p-6 md:p-8">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-8"
                >
                  <section className="space-y-4">
                    <div
                      className="border-b pb-3"
                      style={{ borderColor: "var(--lux-row-border)" }}
                    >
                      <h2 className={sectionTitleClass}>
                        {t("venues.basicInformation", {
                          defaultValue: "Basic Information",
                        })}
                      </h2>
                      <p className={sectionHintClass}>
                        {t("venues.basicInformationHint", {
                          defaultValue:
                            "Add the primary information for this venue.",
                        })}
                      </p>
                    </div>

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
                  </section>

                  <section className="space-y-4">
                    <div
                      className="border-b pb-3"
                      style={{ borderColor: "var(--lux-row-border)" }}
                    >
                      <h2 className={sectionTitleClass}>
                        {t("venues.additionalDetails", {
                          defaultValue: "Additional Details",
                        })}
                      </h2>
                    </div>

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
                              className="min-h-[120px] w-full rounded-[22px] border px-4 py-3 text-sm text-[var(--lux-text)] placeholder:text-[var(--lux-text-muted)] outline-none transition-all focus:border-[var(--lux-gold-border)] focus:ring-2 focus:ring-[var(--lux-gold-glow)]"
                              placeholder={t("venues.notesPlaceholder", {
                                defaultValue:
                                  "Add operational notes, hall rules, or contact details...",
                              })}
                              style={{
                                background: "var(--lux-control-surface)",
                                borderColor: "var(--lux-control-border)",
                                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)",
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </section>

                  <section className="space-y-4">
                    <div
                      className="border-b pb-3"
                      style={{ borderColor: "var(--lux-row-border)" }}
                    >
                      <h2 className={sectionTitleClass}>
                        {t("venues.statusSection", {
                          defaultValue: "Status",
                        })}
                      </h2>
                    </div>

                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem>
                          <div
                            className="flex items-center gap-3 rounded-[20px] border p-4"
                            style={{
                              background: "var(--lux-control-hover)",
                              borderColor: "var(--lux-row-border)",
                            }}
                          >
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
                  </section>

                  <div
                    className="flex flex-col justify-end gap-3 pt-6 sm:flex-row"
                    style={{ borderTop: "1px solid var(--lux-row-border)" }}
                  >
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
                  </div>
                </form>
              </Form>
            </div>
          </Card>
        </div>
      </PageContainer>
    </ProtectedComponent>
  );
};

export default VenueFormPage;
