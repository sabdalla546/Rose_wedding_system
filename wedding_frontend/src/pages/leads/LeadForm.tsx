import { useEffect } from "react";
import { UserRoundSearch } from "lucide-react";
import { useForm, useWatch, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import {
  CrudActionsBar,
  CrudFormLayout,
  CrudFormSection,
  CrudPageLayout,
} from "@/components/shared/crud-layout";
import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import { Button } from "@/components/ui/button";
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
import { useCreateLead, useUpdateLead } from "@/hooks/leads/useLeadMutations";
import { useLead } from "@/hooks/leads/useLeads";
import { useVenues } from "@/hooks/venues/useVenues";

import { LEAD_SOURCE_PLACEHOLDERS, LEAD_STATUS_OPTIONS } from "./adapters";
import type { LeadFormData, LeadStatus } from "./types";

const leadSchema = z.object({
  fullName: z.string().min(2, "Full name is required").max(150),
  mobile: z.string().min(3, "Primary mobile is required").max(30),
  mobile2: z.string().max(30).optional(),
  email: z.union([z.literal(""), z.string().email("Invalid email address")]),
  groomName: z.string().optional(),
  brideName: z.string().optional(),
  weddingDate: z.string().min(1, "Wedding date is required"),
  guestCount: z
    .string()
    .optional()
    .refine(
      (value) => !value || Number(value) > 0,
      "Guest count must be positive",
    ),
  venueId: z.string().optional(),
  source: z.string().max(100).optional(),
  status: z.enum(
    LEAD_STATUS_OPTIONS.map((status) => status.value) as [
      LeadStatus,
      ...LeadStatus[],
    ],
  ),
  notes: z.string().optional(),
});

type LeadFormValues = z.infer<typeof leadSchema>;

const LeadFormPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const { data: lead, isLoading: leadLoading } = useLead(id);
  const { data: venuesResponse, isLoading: venuesLoading } = useVenues({
    currentPage: 1,
    itemsPerPage: 200,
    searchQuery: "",
    isActive: "all",
  });

  const createMutation = useCreateLead();
  const updateMutation = useUpdateLead(id);
  const venues = venuesResponse?.data ?? [];

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema) as any,
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
      source: "",
      status: "new",
      notes: "",
    },
  });

  const watchedVenueId = useWatch({
    control: form.control,
    name: "venueId",
  });
  const watchedStatus = useWatch({
    control: form.control,
    name: "status",
  });
  const watchedGroomName = useWatch({
    control: form.control,
    name: "groomName",
  });
  const watchedBrideName = useWatch({
    control: form.control,
    name: "brideName",
  });

  useEffect(() => {
    if (!isEditMode || !lead) {
      return;
    }

    const normalizedVenueId =
      lead.venueId !== null && typeof lead.venueId !== "undefined"
        ? String(lead.venueId)
        : "";

    const normalizedStatus =
      typeof lead.status === "string" && lead.status.trim()
        ? (lead.status.trim() as LeadStatus)
        : "new";

    const normalizedGroomName = lead.groomName ?? "";
    const normalizedBrideName = lead.brideName ?? "";

    form.reset({
      fullName: lead.fullName ?? "",
      mobile: lead.mobile ?? "",
      mobile2: lead.mobile2 ?? "",
      email: lead.email ?? "",
      groomName: normalizedGroomName,
      brideName: normalizedBrideName,
      weddingDate: lead.weddingDate ?? "",
      guestCount:
        lead.guestCount !== null && typeof lead.guestCount !== "undefined"
          ? String(lead.guestCount)
          : "",
      venueId: normalizedVenueId,
      source: lead.source ?? "",
      status: normalizedStatus,
      notes: lead.notes ?? "",
    });

    form.setValue("venueId", normalizedVenueId, { shouldDirty: false });
    form.setValue("status", normalizedStatus, { shouldDirty: false });
    form.setValue("groomName", normalizedGroomName, { shouldDirty: false });
    form.setValue("brideName", normalizedBrideName, { shouldDirty: false });
  }, [form, isEditMode, lead]);

  const onSubmit: SubmitHandler<LeadFormValues> = (values) => {
    const selectedVenue = venues.find(
      (venue) => String(venue.id) === (values.venueId || ""),
    );

    const payload: LeadFormData = {
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
    leadLoading ||
    venuesLoading ||
    createMutation.isPending ||
    updateMutation.isPending;

  if (leadLoading || venuesLoading) {
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
      permission={isEditMode ? "leads.update" : "leads.create"}
    >
      <CrudPageLayout>
        <div dir={i18n.dir()}>
          <CrudFormLayout
            icon={<UserRoundSearch className="h-5 w-5 text-primary" />}
            title={
              isEditMode
                ? t("leads.editTitle", { defaultValue: "Edit Lead" })
                : t("leads.createTitle", { defaultValue: "Create Lead" })
            }
            description={
              isEditMode
                ? t("leads.editDescription", {
                    defaultValue:
                      "Update lead details, follow-up stage, and venue preference.",
                  })
                : t("leads.createDescription", {
                    defaultValue:
                      "Create a new lead and capture the main wedding inquiry details.",
                  })
            }
            backAction={
              <button
                type="button"
                onClick={() => navigate("/leads")}
                className="crud-header-back"
              >
                <span aria-hidden="true">←</span>
                {t("leads.backToLeads", { defaultValue: "Back to Leads" })}
              </button>
            }
          >
            <div className="p-6 md:p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <CrudFormSection
                    title={t("leads.basicInformation", {
                      defaultValue: "Basic Information",
                    })}
                    description={t("leads.basicInformationHint", {
                      defaultValue:
                        "Capture the primary contact and event details for this lead.",
                    })}
                  >
                    <div className="crud-form-grid md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("leads.fullName", { defaultValue: "Full Name" })}
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder={t("leads.fullNamePlaceholder", {
                                  defaultValue: "Enter lead full name",
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
                              {t("leads.email", { defaultValue: "Email" })}
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                {...field}
                                placeholder="lead@example.com"
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
                              {t("leads.mobile", { defaultValue: "Primary Mobile" })}
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder={t("leads.mobilePlaceholder", {
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
                              {t("leads.mobile2", {
                                defaultValue: "Secondary Mobile",
                              })}
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder={t("leads.mobile2Placeholder", {
                                  defaultValue: "Enter secondary mobile number",
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
                    title={t("leads.weddingDetails", {
                      defaultValue: "Wedding Details",
                    })}
                  >
                    <div className="crud-form-grid md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="weddingDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("leads.weddingDate", {
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
                        render={({ field }) => {
                          const normalizedValue =
                            typeof watchedGroomName === "string" ? watchedGroomName : "";

                          return (
                            <FormItem>
                              <FormLabel>
                                {t("leads.groomName", { defaultValue: "Groom Name" })}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  key={`lead-groomName-${normalizedValue}`}
                                  {...field}
                                  value={field.value ?? normalizedValue ?? ""}
                                  onChange={(e) => {
                                    field.onChange(e.target.value);
                                    form.setValue("groomName", e.target.value, {
                                      shouldDirty: true,
                                    });
                                  }}
                                  placeholder={t("leads.groomNamePlaceholder", {
                                    defaultValue: "Enter groom name",
                                  })}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />

                      <FormField
                        control={form.control}
                        name="brideName"
                        render={({ field }) => {
                          const normalizedValue =
                            typeof watchedBrideName === "string" ? watchedBrideName : "";

                          return (
                            <FormItem>
                              <FormLabel>
                                {t("leads.brideName", { defaultValue: "Bride Name" })}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  key={`lead-brideName-${normalizedValue}`}
                                  {...field}
                                  value={field.value ?? normalizedValue ?? ""}
                                  onChange={(e) => {
                                    field.onChange(e.target.value);
                                    form.setValue("brideName", e.target.value, {
                                      shouldDirty: true,
                                    });
                                  }}
                                  placeholder={t("leads.brideNamePlaceholder", {
                                    defaultValue: "Enter bride name",
                                  })}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />

                      <FormField
                        control={form.control}
                        name="guestCount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("leads.guestCount", {
                                defaultValue: "Guest Count",
                              })}
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                {...field}
                                placeholder={t("leads.guestCountPlaceholder", {
                                  defaultValue: "Enter expected guest count",
                                })}
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
                          const normalizedValue =
                            watchedVenueId && watchedVenueId.trim()
                              ? watchedVenueId
                              : "none";

                          return (
                            <FormItem>
                              <FormLabel>
                                {t("common.venue", { defaultValue: "Venue" })}
                              </FormLabel>
                              <Select
                                key={`lead-venue-${normalizedValue}-${venues.length}`}
                                value={normalizedValue}
                                onValueChange={(value) => {
                                  const nextValue = value === "none" ? "" : value;
                                  field.onChange(nextValue);
                                  form.setValue("venueId", nextValue, {
                                    shouldDirty: true,
                                  });
                                }}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue
                                      placeholder={t("leads.noVenue", {
                                        defaultValue: "No venue selected",
                                      })}
                                    />
                                  </SelectTrigger>
                                </FormControl>

                                <SelectContent>
                                  <SelectItem value="none">
                                    {t("leads.noVenue", {
                                      defaultValue: "No venue selected",
                                    })}
                                  </SelectItem>

                                  {venues.map((venue) => (
                                    <SelectItem
                                      key={venue.id}
                                      value={String(venue.id)}
                                    >
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

                      <FormField
                        control={form.control}
                        name="source"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("leads.source", { defaultValue: "Source" })}
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder={LEAD_SOURCE_PLACEHOLDERS.join(", ")}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CrudFormSection>

                  <CrudFormSection
                    title={t("leads.pipelineSection", {
                      defaultValue: "Pipeline",
                    })}
                  >
                    <div className="crud-form-grid md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => {
                          const normalizedStatus =
                            watchedStatus && String(watchedStatus).trim()
                              ? String(watchedStatus).trim()
                              : "new";

                          return (
                            <FormItem>
                              <FormLabel>
                                {t("leads.statusLabel", {
                                  defaultValue: "Status",
                                })}
                              </FormLabel>
                              <Select
                                key={`lead-status-${normalizedStatus}`}
                                value={normalizedStatus}
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  form.setValue("status", value as LeadStatus, {
                                    shouldDirty: true,
                                  });
                                }}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue
                                      placeholder={t("leads.statusLabel", {
                                        defaultValue: "Status",
                                      })}
                                    />
                                  </SelectTrigger>
                                </FormControl>

                                <SelectContent>
                                  {LEAD_STATUS_OPTIONS.map((status) => (
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
                              className="app-textarea min-h-[140px]"
                              placeholder={t("leads.notesPlaceholder", {
                                defaultValue:
                                  "Add inquiry details, client preferences, or follow-up notes...",
                              })}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CrudFormSection>

                  <CrudActionsBar>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/leads")}
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

export default LeadFormPage;
