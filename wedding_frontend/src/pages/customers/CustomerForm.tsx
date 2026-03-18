import { useEffect } from "react";
import { UsersRound } from "lucide-react";
import { useForm, useWatch, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { PageContainer } from "@/components/layout/page-container";
import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateCustomer,
  useUpdateCustomer,
} from "@/hooks/customers/useCustomerMutations";
import { useCustomer } from "@/hooks/customers/useCustomers";
import { useLeads } from "@/hooks/leads/useLeads";
import { useVenues } from "@/hooks/venues/useVenues";

import { CUSTOMER_STATUS_OPTIONS } from "./adapters";
import type { CustomerFormData, CustomerStatus } from "./types";

const customerSchema = z.object({
  fullName: z.string().min(2, "Full name is required").max(150),
  mobile: z.string().min(3, "Primary mobile is required").max(30),
  mobile2: z.string().max(30).optional(),
  email: z.union([z.literal(""), z.string().email("Invalid email address")]),
  groomName: z.string().optional(),
  brideName: z.string().optional(),
  weddingDate: z.string().optional(),
  guestCount: z
    .string()
    .optional()
    .refine(
      (value) => !value || Number(value) > 0,
      "Guest count must be positive",
    ),
  venueId: z.string().optional(),
  sourceLeadId: z.string().optional(),
  status: z.enum(
    CUSTOMER_STATUS_OPTIONS.map((status) => status.value) as [
      CustomerStatus,
      ...CustomerStatus[],
    ],
  ),
  notes: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

const sectionTitleClass = "text-lg font-semibold text-[var(--lux-heading)]";
const sectionHintClass = "text-sm text-[var(--lux-text-secondary)]";

const CustomerFormPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const { data: customer, isLoading: customerLoading } = useCustomer(id);
  const { data: venuesResponse, isLoading: venuesLoading } = useVenues({
    currentPage: 1,
    itemsPerPage: 200,
    searchQuery: "",
    isActive: "all",
  });
  const { data: leadsResponse, isLoading: leadsLoading } = useLeads({
    currentPage: 1,
    itemsPerPage: 200,
    searchQuery: "",
    status: "all",
    venueId: "",
    source: "",
    weddingDateFrom: "",
    weddingDateTo: "",
  });

  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer(id);
  const venues = venuesResponse?.data ?? [];
  const leads = leadsResponse?.data ?? [];

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema) as any,
    defaultValues: {
      fullName: "",
      mobile: "",
      mobile2: "",
      email: "",
      groomName: "",
      brideName: "",
      weddingDate: "",
      guestCount: "",
      venueId: "",
      sourceLeadId: "",
      status: "active",
      notes: "",
    },
  });
const watchedVenueId = useWatch({
  control: form.control,
  name: "venueId",
});

const watchedSourceLeadId = useWatch({
  control: form.control,
  name: "sourceLeadId",
});

const watchedStatus = useWatch({
  control: form.control,
  name: "status",
});
useEffect(() => {
  if (!isEditMode || !customer) {
    return;
  }

  const normalizedVenueId =
    customer.venueId !== null && typeof customer.venueId !== "undefined"
      ? String(customer.venueId)
      : "";

  const normalizedSourceLeadId =
    customer.sourceLeadId !== null &&
    typeof customer.sourceLeadId !== "undefined"
      ? String(customer.sourceLeadId)
      : "";

  const normalizedStatus =
    typeof customer.status === "string" && customer.status.trim()
      ? (customer.status.trim() as CustomerStatus)
      : "active";

  form.reset({
    fullName: customer.fullName ?? "",
    mobile: customer.mobile ?? "",
    mobile2: customer.mobile2 ?? "",
    email: customer.email ?? "",
    groomName: customer.groomName ?? "",
    brideName: customer.brideName ?? "",
    weddingDate: customer.weddingDate ?? "",
    guestCount:
      customer.guestCount !== null && typeof customer.guestCount !== "undefined"
        ? String(customer.guestCount)
        : "",
    venueId: normalizedVenueId,
    sourceLeadId: normalizedSourceLeadId,
    status: normalizedStatus,
    notes: customer.notes ?? "",
  });

  form.setValue("venueId", normalizedVenueId, { shouldDirty: false });
  form.setValue("sourceLeadId", normalizedSourceLeadId, { shouldDirty: false });
  form.setValue("status", normalizedStatus, { shouldDirty: false });
}, [customer, form, isEditMode]);

  const onSubmit: SubmitHandler<CustomerFormValues> = (values) => {
    const selectedVenue = venues.find(
      (venue) => String(venue.id) === (values.venueId || ""),
    );

    const payload: CustomerFormData = {
      ...values,
      venueNameSnapshot: selectedVenue?.name,
    };

    if (isEditMode) {
      updateMutation.mutate(payload);
      return;
    }

    createMutation.mutate(payload);
  };

  const isBusy =
    customerLoading ||
    venuesLoading ||
    leadsLoading ||
    createMutation.isPending ||
    updateMutation.isPending;

  if (customerLoading || venuesLoading || leadsLoading) {
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
      permission={isEditMode ? "customers.update" : "customers.create"}
    >
      <PageContainer className="pb-4 pt-4 text-foreground">
        <div dir={i18n.dir()} className="mx-auto w-full max-w-5xl space-y-6">
          <button
            type="button"
            onClick={() => navigate("/customers")}
            className="inline-flex items-center gap-2 text-sm text-[var(--lux-text-secondary)] transition-colors hover:text-[var(--lux-gold)]"
          >
            {"<-"}{" "}
            {t("customers.backToCustomers", {
              defaultValue: "Back to Customers",
            })}
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
                <UsersRound className="h-6 w-6" />
              </div>

              <div className="space-y-1">
                <h1 className="text-xl font-bold text-[var(--lux-heading)]">
                  {isEditMode
                    ? t("customers.editTitle", {
                        defaultValue: "Edit Customer",
                      })
                    : t("customers.createTitle", {
                        defaultValue: "Create Customer",
                      })}
                </h1>
                <p className="text-sm text-[var(--lux-text-secondary)]">
                  {isEditMode
                    ? t("customers.editDescription", {
                        defaultValue:
                          "Update customer profile, venue, and status.",
                      })
                    : t("customers.createDescription", {
                        defaultValue:
                          "Create a customer profile and optionally link it to a source lead.",
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
                        {t("customers.basicInformation", {
                          defaultValue: "Basic Information",
                        })}
                      </h2>
                      <p className={sectionHintClass}>
                        {t("customers.basicInformationHint", {
                          defaultValue:
                            "Capture the main customer contact and profile details.",
                        })}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("customers.fullName", {
                                defaultValue: "Full Name",
                              })}
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder={t("customers.fullNamePlaceholder", {
                                  defaultValue: "Enter customer full name",
                                })}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("customers.email", { defaultValue: "Email" })}
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                {...field}
                                placeholder="customer@example.com"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="mobile"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("customers.mobile", {
                                defaultValue: "Primary Mobile",
                              })}
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder={t("customers.mobilePlaceholder", {
                                  defaultValue: "Enter primary mobile number",
                                })}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="mobile2"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("customers.mobile2", {
                                defaultValue: "Secondary Mobile",
                              })}
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder={t("customers.mobile2Placeholder", {
                                  defaultValue: "Enter secondary mobile number",
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
                        {t("customers.eventDetails", {
                          defaultValue: "Event Details",
                        })}
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="weddingDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("customers.weddingDate", {
                                defaultValue: "Wedding Date",
                              })}
                            </FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="groomName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("customers.groomName", {
                                defaultValue: "Groom Name",
                              })}
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder={t("customers.groomNamePlaceholder", {
                                  defaultValue: "Enter groom name",
                                })}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="brideName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("customers.brideName", {
                                defaultValue: "Bride Name",
                              })}
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder={t("customers.brideNamePlaceholder", {
                                  defaultValue: "Enter bride name",
                                })}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="guestCount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("customers.guestCount", {
                                defaultValue: "Guest Count",
                              })}
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                {...field}
                                placeholder={t(
                                  "customers.guestCountPlaceholder",
                                  {
                                    defaultValue: "Enter expected guest count",
                                  },
                                )}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                    <FormField
  control={form.control}
  name="venueId"
  render={({ field }) => {
    const normalizedVenueValue =
      watchedVenueId && watchedVenueId.trim() ? watchedVenueId : "none";

    return (
      <FormItem>
        <FormLabel>
          {t("common.venue", { defaultValue: "Venue" })}
        </FormLabel>
        <Select
          key={`customer-venue-${normalizedVenueValue}-${venues.length}`}
          value={normalizedVenueValue}
          onValueChange={(value) => {
            const nextValue = value === "none" ? "" : value;
            field.onChange(nextValue);
            form.setValue("venueId", nextValue, { shouldDirty: true });
          }}
        >
          <FormControl>
            <SelectTrigger>
              <SelectValue
                placeholder={t("customers.venuePlaceholder", {
                  defaultValue: "Select venue",
                })}
              />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            <SelectItem value="none">
              {t("customers.noVenue", {
                defaultValue: "No venue selected",
              })}
            </SelectItem>
            {venues.map((venue) => (
              <SelectItem key={venue.id} value={String(venue.id)}>
                {venue.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FormMessage />
      </FormItem>
    );
  }}
/>

                     {!isEditMode ? (
  <FormField
    control={form.control}
    name="sourceLeadId"
    render={({ field }) => {
      const normalizedSourceLeadValue =
        watchedSourceLeadId && watchedSourceLeadId.trim()
          ? watchedSourceLeadId
          : "none";

      return (
        <FormItem>
          <FormLabel>
            {t("customers.sourceLead", {
              defaultValue: "Source Lead",
            })}
          </FormLabel>
          <Select
            key={`customer-source-lead-${normalizedSourceLeadValue}-${leads.length}`}
            value={normalizedSourceLeadValue}
            onValueChange={(value) => {
              const nextValue = value === "none" ? "" : value;
              field.onChange(nextValue);
              form.setValue("sourceLeadId", nextValue, { shouldDirty: true });
            }}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue
                  placeholder={t("customers.sourceLeadPlaceholder", {
                    defaultValue: "Select source lead",
                  })}
                />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="none">
                {t("customers.noSourceLead", {
                  defaultValue: "No source lead",
                })}
              </SelectItem>
              {leads.map((lead) => (
                <SelectItem key={lead.id} value={String(lead.id)}>
                  {lead.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      );
    }}
  />
) : null}
                    </div>
                  </section>

                  <section className="space-y-4">
                    <div
                      className="border-b pb-3"
                      style={{ borderColor: "var(--lux-row-border)" }}
                    >
                      <h2 className={sectionTitleClass}>
                        {t("customers.statusSection", {
                          defaultValue: "Status & Notes",
                        })}
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                   <FormField
  control={form.control}
  name="status"
  render={({ field }) => {
    const normalizedStatusValue =
      watchedStatus && String(watchedStatus).trim()
        ? String(watchedStatus).trim()
        : "active";

    return (
      <FormItem>
        <FormLabel>
          {t("customers.statusLabel", {
            defaultValue: "Status",
          })}
        </FormLabel>
        <Select
          key={`customer-status-${normalizedStatusValue}`}
          value={normalizedStatusValue}
          onValueChange={(value) => {
            field.onChange(value);
            form.setValue("status", value as CustomerStatus, {
              shouldDirty: true,
            });
          }}
        >
          <FormControl>
            <SelectTrigger>
              <SelectValue
                placeholder={t("customers.statusLabel", {
                  defaultValue: "Status",
                })}
              />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            {CUSTOMER_STATUS_OPTIONS.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FormMessage />
      </FormItem>
    );
  }}
/>
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
                              className="min-h-[140px] w-full rounded-[22px] border px-4 py-3 text-sm text-[var(--lux-text)] placeholder:text-[var(--lux-text-muted)] outline-none transition-all focus:border-[var(--lux-gold-border)] focus:ring-2 focus:ring-[var(--lux-gold-glow)]"
                              placeholder={t("customers.notesPlaceholder", {
                                defaultValue:
                                  "Add preferences, package notes, or relationship context...",
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

                  <div
                    className="flex flex-col justify-end gap-3 pt-6 sm:flex-row"
                    style={{ borderTop: "1px solid var(--lux-row-border)" }}
                  >
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/customers")}
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

export default CustomerFormPage;
