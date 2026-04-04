import { useEffect, useMemo, useState } from "react";
import { CalendarClock } from "lucide-react";
import { useForm, useWatch, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { PageContainer } from "@/components/layout/page-container";
import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import {
  FormFeedbackBanner,
  getFirstFormErrorMessage,
} from "@/components/shared/form-feedback-banner";
import { FormSection } from "@/components/shared/form-section";
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
  SearchableSelect,
  SearchableSelectEmpty,
  SearchableSelectItem,
} from "@/components/ui/searchable-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateAppointment,
  useCreateAppointmentWithCustomer,
  useUpdateAppointment,
} from "@/hooks/appointments/useAppointmentMutations";
import { useAppointment } from "@/hooks/appointments/useAppointments";
import { useCustomer, useCustomers } from "@/hooks/customers/useCustomers";
import { useVenue, useVenues } from "@/hooks/venues/useVenues";
import {
  APPOINTMENT_FORM_STATUS_OPTIONS,
  APPOINTMENT_TYPE_OPTIONS,
} from "./adapters";
import type {
  AppointmentFormData,
  AppointmentStatus,
  AppointmentType,
} from "./types";

type AppointmentMode = "existing" | "new";

const buildAppointmentSchema = (
  t: (key: string, options?: Record<string, unknown>) => string,
  mode: AppointmentMode,
  isEditMode: boolean,
) =>
  z
    .object({
      customerId: z.string().optional(),
      customerFullName: z.string().max(150).optional(),
      customerMobile: z.string().max(30).optional(),
      customerMobile2: z.string().max(30).optional(),
      customerEmail: z.union([
        z.literal(""),
        z.string().email(
          t("appointments.validation.emailInvalid", {
            defaultValue: "Invalid email address",
          }),
        ),
      ]),
      customerNationalId: z.union([
        z.literal(""),
        z
          .string()
          .trim()
          .regex(
            /^\d{12}$/,
            t("appointments.validation.nationalIdInvalid", {
              defaultValue: "National ID must be exactly 12 digits",
            }),
          ),
      ]),
      customerAddress: z.string().max(255).optional(),
      customerNotes: z.string().optional(),
      appointmentDate: z.string().min(
        1,
        t("appointments.validation.appointmentDateRequired", {
          defaultValue: "Appointment date is required",
        }),
      ),
      weddingDate: z.string().optional(),
      guestCount: z
        .string()
        .optional()
        .refine(
          (value) =>
            !value || (Number.isInteger(Number(value)) && Number(value) >= 0),
          t("appointments.validation.guestCountInvalid", {
            defaultValue: "Guest count must be zero or greater",
          }),
        ),
      venueId: z.string().optional(),
      startTime: z
        .string()
        .min(
          1,
          t("appointments.validation.startTimeRequired", {
            defaultValue: "Start time is required",
          }),
        )
        .max(10),
      endTime: z.string().max(10).optional(),
      status: z.enum(
        APPOINTMENT_FORM_STATUS_OPTIONS.map((item) => item.value) as [
          AppointmentStatus,
          ...AppointmentStatus[],
        ],
      ),
      type: z.enum(
        APPOINTMENT_TYPE_OPTIONS.map((item) => item.value) as [
          AppointmentType,
          ...AppointmentType[],
        ],
      ),
      notes: z.string().optional(),
    })
    .superRefine((values, ctx) => {
      if (isEditMode || mode === "existing") {
        if (!values.customerId?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["customerId"],
            message: t("appointments.validation.customerRequired", {
              defaultValue: "Customer is required",
            }),
          });
        }
        return;
      }

      if (
        !values.customerFullName?.trim() ||
        values.customerFullName.trim().length < 2
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["customerFullName"],
          message: t("appointments.validation.fullNameRequired", {
            defaultValue: "Full name is required",
          }),
        });
      }

      if (
        !values.customerMobile?.trim() ||
        values.customerMobile.trim().length < 3
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["customerMobile"],
          message: t("appointments.validation.mobileRequired", {
            defaultValue: "Mobile is required",
          }),
        });
      }
    });

type AppointmentFormValues = z.infer<ReturnType<typeof buildAppointmentSchema>>;

const EMPTY_VALUE = "__empty__";

const AppointmentFormPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEditMode = Boolean(id);
  const [mode, setMode] = useState<AppointmentMode>("existing");

  const { data: appointment, isLoading } = useAppointment(id);
  const { data: customersResponse } = useCustomers({
    currentPage: 1,
    itemsPerPage: 200,
    searchQuery: "",
    status: "all",
  });
  const { data: venuesResponse } = useVenues({
    currentPage: 1,
    itemsPerPage: 200,
    searchQuery: "",
    isActive: "all",
  });
  const createMutation = useCreateAppointment();
  const createWithCustomerMutation = useCreateAppointmentWithCustomer();
  const updateMutation = useUpdateAppointment(id);
  const appointmentSchema = useMemo(
    () => buildAppointmentSchema(t, mode, isEditMode),
    [t, mode, isEditMode],
  );
  const preselectedCustomerId = searchParams.get("customerId") || "";

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      customerId: preselectedCustomerId,
      customerFullName: "",
      customerMobile: "",
      customerMobile2: "",
      customerEmail: "",
      customerNationalId: "",
      customerAddress: "",
      customerNotes: "",
      appointmentDate: "",
      weddingDate: "",
      guestCount: "",
      venueId: "",
      startTime: "",
      endTime: "",
      status: "scheduled",
      type: "Office Visit",
      notes: "",
    },
  });
  const watchedCustomerId =
    useWatch({ control: form.control, name: "customerId" })?.trim() || "";
  const watchedVenueId =
    useWatch({ control: form.control, name: "venueId" })?.trim() || "";
  const selectedCustomerId =
    (isEditMode
      ? watchedCustomerId || String(appointment?.customerId ?? "")
      : watchedCustomerId) || "";
  const selectedVenueId =
    (isEditMode
      ? watchedVenueId || String(appointment?.venueId ?? "")
      : watchedVenueId) || "";
  const { data: selectedCustomer } = useCustomer(
    selectedCustomerId || undefined,
  );
  const { data: selectedVenue } = useVenue(selectedVenueId || undefined);
  const customerOptions = useMemo(() => {
    const base = (customersResponse?.data ?? []).map((customer) => ({
      value: String(customer.id),
      label: customer.fullName,
    }));
    const exists = base.some((item) => item.value === selectedCustomerId);

    if (!selectedCustomerId || exists) {
      return base;
    }

    if (selectedCustomer?.id) {
      return [
        {
          value: String(selectedCustomer.id),
          label: selectedCustomer.fullName,
        },
        ...base,
      ];
    }

    return [
      {
        value: selectedCustomerId,
        label:
          appointment?.customer?.fullName || `Customer #${selectedCustomerId}`,
      },
      ...base,
    ];
  }, [
    appointment?.customer?.fullName,
    customersResponse?.data,
    selectedCustomer,
    selectedCustomerId,
  ]);
  const venueOptions = useMemo(() => {
    const base = (venuesResponse?.data ?? []).map((venue) => ({
      value: String(venue.id),
      label: venue.name,
    }));
    const exists = base.some((item) => item.value === selectedVenueId);

    if (!selectedVenueId || exists) {
      return base;
    }

    if (selectedVenue?.id) {
      return [
        {
          value: String(selectedVenue.id),
          label: selectedVenue.name,
        },
        ...base,
      ];
    }

    return [
      {
        value: selectedVenueId,
        label: appointment?.venue?.name || `Venue #${selectedVenueId}`,
      },
      ...base,
    ];
  }, [
    appointment?.venue?.name,
    selectedVenue,
    selectedVenueId,
    venuesResponse?.data,
  ]);

  useEffect(() => {
    if (!isEditMode || !appointment) {
      return;
    }

    form.reset({
      customerId: String(appointment.customerId),
      customerFullName: "",
      customerMobile: "",
      customerMobile2: "",
      customerEmail: "",
      customerNationalId: "",
      customerAddress: "",
      customerNotes: "",
      appointmentDate: appointment.appointmentDate,
      weddingDate: appointment.weddingDate ?? "",
      guestCount:
        typeof appointment.guestCount === "number"
          ? String(appointment.guestCount)
          : "",
      venueId: appointment.venueId ? String(appointment.venueId) : "",
      startTime: appointment.startTime,
      endTime: appointment.endTime ?? "",
      status: appointment.status,
      type: appointment.type,
      notes: appointment.notes ?? "",
    });
  }, [appointment, form, isEditMode]);
  useEffect(() => {
    if (!isEditMode || !appointment) {
      return;
    }

    form.reset({
      customerId: String(appointment.customerId),
      customerFullName: "",
      customerMobile: "",
      customerMobile2: "",
      customerEmail: "",
      customerNationalId: "",
      customerAddress: "",
      customerNotes: "",
      appointmentDate: appointment.appointmentDate,
      weddingDate: appointment.weddingDate ?? "",
      guestCount:
        typeof appointment.guestCount === "number"
          ? String(appointment.guestCount)
          : "",
      venueId: appointment.venueId ? String(appointment.venueId) : "",
      startTime: appointment.startTime,
      endTime: appointment.endTime ?? "",
      status: appointment.status,
      type: appointment.type,
      notes: appointment.notes ?? "",
    });
  }, [appointment, form, isEditMode]);
  useEffect(() => {
    if (!isEditMode || !appointment) {
      return;
    }

    const currentCustomerId = form.getValues("customerId")?.trim() || "";
    const currentVenueId = form.getValues("venueId")?.trim() || "";

    if (!currentCustomerId && appointment.customerId) {
      form.setValue("customerId", String(appointment.customerId), {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      });
    }

    if (!currentVenueId && appointment.venueId) {
      form.setValue("venueId", String(appointment.venueId), {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      });
    }
  }, [
    appointment?.customerId,
    appointment?.venueId,
    form,
    isEditMode,
    appointment,
  ]);
  const onSubmit: SubmitHandler<AppointmentFormValues> = (values) => {
    const payload: AppointmentFormData = {
      customerId: values.customerId || "",
      appointmentDate: values.appointmentDate,
      weddingDate: values.weddingDate,
      guestCount: values.guestCount,
      venueId: values.venueId,
      startTime: values.startTime,
      endTime: values.endTime,
      status: values.status,
      type: values.type,
      notes: values.notes,
    };

    if (isEditMode) {
      updateMutation.mutate(payload);
      return;
    }

    if (mode === "existing") {
      createMutation.mutate(payload);
      return;
    }

    createWithCustomerMutation.mutate({
      customer: {
        fullName: values.customerFullName || "",
        mobile: values.customerMobile || "",
        mobile2: values.customerMobile2,
        email: values.customerEmail,
        nationalId: values.customerNationalId,
        address: values.customerAddress,
        notes: values.customerNotes,
      },
      appointment: {
        appointmentDate: values.appointmentDate,
        weddingDate: values.weddingDate,
        guestCount: values.guestCount,
        venueId: values.venueId,
        startTime: values.startTime,
        endTime: values.endTime,
        type: values.type,
        notes: values.notes,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-sm text-[var(--lux-text-secondary)]">
          {t("common.loading", { defaultValue: "Loading..." })}
        </div>
      </div>
    );
  }

  const isBusy =
    createMutation.isPending ||
    createWithCustomerMutation.isPending ||
    updateMutation.isPending;
  const formErrorMessage =
    form.formState.submitCount > 0
      ? getFirstFormErrorMessage(form.formState.errors)
      : null;

  return (
    <ProtectedComponent
      permission={isEditMode ? "appointments.update" : "appointments.create"}
    >
      <PageContainer className="pb-4 pt-4 text-foreground">
        <div dir={i18n.dir()} className="mx-auto w-full max-w-5xl space-y-6">
          <button
            type="button"
            onClick={() => navigate("/appointments")}
            className="inline-flex items-center gap-2 text-sm text-[var(--lux-text-secondary)] transition-colors hover:text-[var(--lux-gold)]"
          >
            {"<-"}{" "}
            {t("appointments.backToAppointments", {
              defaultValue: "Back to Appointments",
            })}
          </button>

          <div
            className="overflow-hidden rounded-[4px] border p-4 shadow-luxe"
            style={{
              background: "var(--lux-panel-surface)",
              borderColor: "var(--lux-panel-border)",
            }}
          >
            <div className="flex items-start gap-4">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-[4px] border"
                style={{
                  background: "var(--lux-control-hover)",
                  borderColor: "var(--lux-control-border)",
                  color: "var(--lux-gold)",
                }}
              >
                <CalendarClock className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h1 className="text-xl font-bold text-[var(--lux-heading)]">
                  {isEditMode
                    ? t("appointments.editTitle", {
                        defaultValue: "Edit Appointment",
                      })
                    : t("appointments.createTitle", {
                        defaultValue: "Create Appointment",
                      })}
                </h1>
                <p className="text-sm text-[var(--lux-text-secondary)]">
                  {t("appointments.coreFlowHint", {
                    defaultValue:
                      "Appointments now store only scheduling data and link to a customer.",
                  })}
                </p>
              </div>
            </div>
          </div>

          <Card className="rounded-[4px] p-6 md:p-8">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {formErrorMessage ? (
                  <FormFeedbackBanner
                    tone="error"
                    title={t("common.validationError", {
                      defaultValue: "Review the highlighted fields",
                    })}
                    message={formErrorMessage}
                  />
                ) : null}

                <fieldset
                  disabled={isBusy}
                  className="space-y-6 [&_textarea:disabled]:border-dashed [&_textarea:disabled]:border-[var(--lux-row-border)] [&_textarea:disabled]:bg-[var(--lux-row-surface)] [&_textarea:disabled]:text-[var(--lux-text-secondary)]"
                >
                  <FormSection
                    title={t("appointments.customerSection", {
                      defaultValue: "Customer Information",
                    })}
                    description={t("appointments.customerSectionHint", {
                      defaultValue:
                        "Choose an existing customer for a faster booking flow, or create the customer together with the appointment.",
                    })}
                  >
                    {!isEditMode ? (
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-[var(--lux-text)]">
                            {t("appointments.customerMode", {
                              defaultValue: "Customer Selection",
                            })}
                          </label>
                          <Select
                            value={mode}
                            onValueChange={(value) =>
                              setMode(value as AppointmentMode)
                            }
                            disabled={isBusy}
                          >
                            <SelectTrigger className="rounded-[4px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="existing">
                                {t("appointments.useExistingCustomer", {
                                  defaultValue: "Use Existing Customer",
                                })}
                              </SelectItem>
                              <SelectItem value="new">
                                {t("appointments.createNewCustomer", {
                                  defaultValue: "Create New Customer",
                                })}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="mt-2 text-xs text-[var(--lux-text-secondary)]">
                            {mode === "existing"
                              ? t("appointments.useExistingCustomerHint", {
                                  defaultValue:
                                    "Best for repeat customers or when the customer profile already exists.",
                                })
                              : t("appointments.createNewCustomerHint", {
                                  defaultValue:
                                    "Creates a new customer record first, then stores the appointment under that customer.",
                                })}
                          </p>
                        </div>
                      </div>
                    ) : null}

                    {isEditMode || mode === "existing" ? (
                      <FormField
                        control={form.control}
                        name="customerId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("appointments.customer", {
                                defaultValue: "Customer",
                              })}
                            </FormLabel>
                            <FormControl>
                              <SearchableSelect
                                key={`customer-select-${field.value || EMPTY_VALUE}-${customerOptions.length}`}
                                value={field.value || EMPTY_VALUE}
                                onValueChange={(value) =>
                                  field.onChange(value === EMPTY_VALUE ? "" : value)
                                }
                                triggerClassName="rounded-[4px]"
                                placeholder={t("appointments.selectCustomer", {
                                  defaultValue: "Select customer",
                                })}
                                searchPlaceholder={t(
                                  "appointments.searchCustomers",
                                  {
                                    defaultValue: "Search customers...",
                                  },
                                )}
                                emptyMessage={t("common.noResultsTitle", {
                                  defaultValue: "No results found",
                                })}
                                disabled={isBusy}
                              >
                                <SearchableSelectItem value={EMPTY_VALUE}>
                                  {t("appointments.selectCustomer", {
                                    defaultValue: "Select customer",
                                  })}
                                </SearchableSelectItem>
                                {customerOptions.length === 0 ? (
                                  <SearchableSelectEmpty
                                    message={t("common.noResultsTitle", {
                                      defaultValue: "No results found",
                                    })}
                                  />
                                ) : (
                                  customerOptions.map((customer) => (
                                    <SearchableSelectItem
                                      key={customer.value}
                                      value={customer.value}
                                    >
                                      {customer.label}
                                    </SearchableSelectItem>
                                  ))
                                )}
                              </SearchableSelect>
                            </FormControl>
                            <p className="text-xs text-[var(--lux-text-secondary)]">
                              {t("appointments.customerLinkHint", {
                                defaultValue:
                                  "Appointments are now customer-linked records. Use the customer profile for contact edits.",
                              })}
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="customerFullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {t("customers.fullName", {
                                  defaultValue: "Full Name",
                                })}
                              </FormLabel>
                              <FormControl>
                                <Input {...field} className="rounded-[4px]" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="customerEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {t("customers.email", { defaultValue: "Email" })}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  {...field}
                                  className="rounded-[4px]"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="customerMobile"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {t("customers.mobile", {
                                  defaultValue: "Primary Mobile",
                                })}
                              </FormLabel>
                              <FormControl>
                                <Input {...field} className="rounded-[4px]" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="customerMobile2"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {t("customers.mobile2", {
                                  defaultValue: "Secondary Mobile",
                                })}
                              </FormLabel>
                              <FormControl>
                                <Input {...field} className="rounded-[4px]" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="customerNationalId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {t("customers.nationalId", {
                                  defaultValue: "National ID",
                                })}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  className="rounded-[4px]"
                                  inputMode="numeric"
                                  maxLength={12}
                                  placeholder={t(
                                    "customers.nationalIdPlaceholder",
                                    {
                                      defaultValue: "Enter 12-digit national ID",
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
                          name="customerAddress"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {t("customers.address", {
                                  defaultValue: "Address",
                                })}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  className="rounded-[4px]"
                                  placeholder={t("customers.addressPlaceholder", {
                                    defaultValue: "Enter customer address",
                                  })}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="md:col-span-2">
                          <FormField
                            control={form.control}
                            name="customerNotes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  {t("common.notes", { defaultValue: "Notes" })}
                                </FormLabel>
                                <FormControl>
                                  <textarea
                                    {...field}
                                    className="app-textarea min-h-[120px] rounded-[4px]"
                                    style={{
                                      background: "var(--lux-control-surface)",
                                      borderColor: "var(--lux-control-border)",
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    )}
                  </FormSection>

                  <FormSection
                    title={t("appointments.appointmentSection", {
                      defaultValue: "Appointment Details",
                    })}
                    description={t("appointments.appointmentSectionHint", {
                      defaultValue:
                        "Capture the visit schedule, wedding date, venue context, and appointment type.",
                    })}
                  >
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="appointmentDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("appointments.date", { defaultValue: "Date" })}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            className="rounded-[4px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="weddingDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("appointments.weddingDate", {
                            defaultValue: "Wedding Date",
                          })}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            className="rounded-[4px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {!isEditMode ? (
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("appointments.statusLabel", {
                              defaultValue: "Status",
                            })}
                          </FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger className="rounded-[4px]">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {APPOINTMENT_FORM_STATUS_OPTIONS.map((status) => (
                                <SelectItem
                                  key={status.value}
                                  value={status.value}
                                >
                                  {t(`appointments.status.${status.value}`, {
                                    defaultValue: status.label,
                                  })}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <div className="rounded-[16px] border border-[var(--lux-row-border)] bg-[var(--lux-row-surface)] p-4 text-sm text-[var(--lux-text-secondary)]">
                      {t("appointments.workflowEditHint", {
                        defaultValue:
                          "Use appointment workflow actions from the detail page to change status safely.",
                      })}
                    </div>
                  )}
                  <FormField
                    control={form.control}
                    name="guestCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("appointments.guestCount", {
                            defaultValue: "Guest Count",
                          })}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            {...field}
                            className="rounded-[4px]"
                            placeholder={t(
                              "appointments.guestCountPlaceholder",
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
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("appointments.startTime", {
                            defaultValue: "Start Time",
                          })}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            {...field}
                            className="rounded-[4px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("appointments.endTime", {
                            defaultValue: "End Time",
                          })}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            {...field}
                            className="rounded-[4px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="venueId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("appointments.venue", { defaultValue: "Venue" })}
                        </FormLabel>
                        <Select
                          key={`venue-select-${field.value || EMPTY_VALUE}-${venueOptions.length}`}
                          value={field.value || EMPTY_VALUE}
                          onValueChange={(value) =>
                            field.onChange(value === EMPTY_VALUE ? "" : value)
                          }
                        >
                          <FormControl>
                            <SelectTrigger className="rounded-[4px]">
                              <SelectValue
                                placeholder={t("appointments.selectVenue", {
                                  defaultValue: "Select venue",
                                })}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={EMPTY_VALUE}>
                              {t("appointments.noVenueSelected", {
                                defaultValue: "No venue selected",
                              })}
                            </SelectItem>
                            {venueOptions.map((venue) => (
                              <SelectItem key={venue.value} value={venue.value}>
                                {venue.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>
                          {t("appointments.type", { defaultValue: "Type" })}
                        </FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger className="rounded-[4px]">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {APPOINTMENT_TYPE_OPTIONS.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {t(`appointments.typeOptions.${option.value}`, {
                                  defaultValue: option.label,
                                })}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                      )}
                    />
                    </div>
                  </FormSection>

                  <FormSection
                    title={t("appointments.notesSection", {
                      defaultValue: "Operational Notes",
                    })}
                    description={t("appointments.notesSectionHint", {
                      defaultValue:
                        "Use notes for call context, rescheduling remarks, or anything the next team member should see.",
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
                              className="app-textarea min-h-[140px] rounded-[4px]"
                              style={{
                                background: "var(--lux-control-surface)",
                                borderColor: "var(--lux-control-border)",
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </FormSection>
                </fieldset>

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/appointments")}
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
                        : t("appointments.create", {
                            defaultValue: "Create Appointment",
                          })}
                  </Button>
                </div>
              </form>
            </Form>
          </Card>
        </div>
      </PageContainer>
    </ProtectedComponent>
  );
};

export default AppointmentFormPage;
