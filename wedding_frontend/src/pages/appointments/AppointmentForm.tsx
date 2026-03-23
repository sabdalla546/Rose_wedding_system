import { useEffect, useState } from "react";
import { CalendarClock } from "lucide-react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
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
import { useCustomers } from "@/hooks/customers/useCustomers";
import {
  APPOINTMENT_STATUS_OPTIONS,
  APPOINTMENT_TYPE_OPTIONS,
} from "./adapters";
import type {
  AppointmentFormData,
  AppointmentStatus,
  AppointmentType,
} from "./types";

type AppointmentMode = "existing" | "new";

const appointmentSchema = (mode: AppointmentMode, isEditMode: boolean) =>
  z
    .object({
      customerId: z.string().optional(),
      customerFullName: z.string().max(150).optional(),
      customerMobile: z.string().max(30).optional(),
      customerMobile2: z.string().max(30).optional(),
      customerEmail: z.union([z.literal(""), z.string().email("Invalid email address")]),
      customerNotes: z.string().optional(),
      appointmentDate: z.string().min(1, "Appointment date is required"),
      startTime: z.string().min(1, "Start time is required").max(10),
      endTime: z.string().max(10).optional(),
      status: z.enum(
        APPOINTMENT_STATUS_OPTIONS.map((item) => item.value) as [
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
            message: "Customer is required",
          });
        }
        return;
      }

      if (!values.customerFullName?.trim() || values.customerFullName.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["customerFullName"],
          message: "Full name is required",
        });
      }

      if (!values.customerMobile?.trim() || values.customerMobile.trim().length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["customerMobile"],
          message: "Mobile is required",
        });
      }
    });

type AppointmentFormValues = z.infer<ReturnType<typeof appointmentSchema>>;

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
  const createMutation = useCreateAppointment();
  const createWithCustomerMutation = useCreateAppointmentWithCustomer();
  const updateMutation = useUpdateAppointment(id);

  const customers = customersResponse?.data ?? [];
  const preselectedCustomerId = searchParams.get("customerId") || "";

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema(mode, isEditMode)) as any,
    defaultValues: {
      customerId: preselectedCustomerId,
      customerFullName: "",
      customerMobile: "",
      customerMobile2: "",
      customerEmail: "",
      customerNotes: "",
      appointmentDate: "",
      startTime: "",
      endTime: "",
      status: "scheduled",
      type: "office_visit",
      notes: "",
    },
  });

  useEffect(() => {
    if (!isEditMode || !appointment) {
      return;
    }

    setMode("existing");
    form.reset({
      customerId: String(appointment.customerId),
      customerFullName: "",
      customerMobile: "",
      customerMobile2: "",
      customerEmail: "",
      customerNotes: "",
      appointmentDate: appointment.appointmentDate,
      startTime: appointment.startTime,
      endTime: appointment.endTime ?? "",
      status: appointment.status,
      type: appointment.type,
      notes: appointment.notes ?? "",
    });
  }, [appointment, form, isEditMode]);

  const onSubmit: SubmitHandler<AppointmentFormValues> = (values) => {
    const payload: AppointmentFormData = {
      customerId: values.customerId || "",
      appointmentDate: values.appointmentDate,
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
        notes: values.customerNotes,
      },
      appointment: {
        appointmentDate: values.appointmentDate,
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

          <Card className="rounded-[24px] p-6 md:p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {!isEditMode ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-[var(--lux-text)]">
                        {t("appointments.customerMode", {
                          defaultValue: "Customer Selection",
                        })}
                      </label>
                      <Select value={mode} onValueChange={(value) => setMode(value as AppointmentMode)}>
                        <SelectTrigger>
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
                          {t("appointments.customer", { defaultValue: "Customer" })}
                        </FormLabel>
                        <FormControl>
                          <SearchableSelect
                            value={field.value || EMPTY_VALUE}
                            onValueChange={(value) =>
                              field.onChange(value === EMPTY_VALUE ? "" : value)
                            }
                            placeholder={t("appointments.selectCustomer", {
                              defaultValue: "Select customer",
                            })}
                            searchPlaceholder={t("appointments.searchCustomers", {
                              defaultValue: "Search customers...",
                            })}
                            emptyMessage={t("common.noResultsTitle", {
                              defaultValue: "No results found",
                            })}
                          >
                            <SearchableSelectItem value={EMPTY_VALUE}>
                              {t("appointments.selectCustomer", {
                                defaultValue: "Select customer",
                              })}
                            </SearchableSelectItem>
                            {customers.length === 0 ? (
                              <SearchableSelectEmpty
                                message={t("common.noResultsTitle", {
                                  defaultValue: "No results found",
                                })}
                              />
                            ) : (
                              customers.map((customer) => (
                                <SearchableSelectItem
                                  key={customer.id}
                                  value={String(customer.id)}
                                >
                                  {customer.fullName}
                                </SearchableSelectItem>
                              ))
                            )}
                          </SearchableSelect>
                        </FormControl>
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
                            {t("customers.fullName", { defaultValue: "Full Name" })}
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
                      name="customerEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("customers.email", { defaultValue: "Email" })}
                          </FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
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
                            {t("customers.mobile", { defaultValue: "Primary Mobile" })}
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
                      name="customerMobile2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("customers.mobile2", { defaultValue: "Secondary Mobile" })}
                          </FormLabel>
                          <FormControl>
                            <Input {...field} />
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
                            <FormLabel>{t("common.notes", { defaultValue: "Notes" })}</FormLabel>
                            <FormControl>
                              <textarea
                                {...field}
                                className="min-h-[120px] w-full rounded-[22px] border px-4 py-3 text-sm"
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

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="appointmentDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("appointments.date", { defaultValue: "Date" })}</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("appointments.statusLabel", { defaultValue: "Status" })}
                        </FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {APPOINTMENT_STATUS_OPTIONS.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
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
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("appointments.startTime", { defaultValue: "Start Time" })}
                        </FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
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
                          {t("appointments.endTime", { defaultValue: "End Time" })}
                        </FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
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
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {APPOINTMENT_TYPE_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
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

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("common.notes", { defaultValue: "Notes" })}</FormLabel>
                      <FormControl>
                        <textarea
                          {...field}
                          className="min-h-[140px] w-full rounded-[22px] border px-4 py-3 text-sm"
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

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/appointments")}
                  >
                    {t("common.cancel", { defaultValue: "Cancel" })}
                  </Button>
                  <Button type="submit" disabled={isBusy}>
                    {isBusy
                      ? t("common.processing", { defaultValue: "Processing..." })
                      : isEditMode
                        ? t("common.update", { defaultValue: "Update" })
                        : t("common.create", { defaultValue: "Create" })}
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
