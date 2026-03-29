/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { CalendarRange, Link2, Sparkles } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useForm,
  useWatch,
  type Control,
  type SubmitHandler,
} from "react-hook-form";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
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
import { useCustomer, useCustomers } from "@/hooks/customers/useCustomers";
import { useAppointment } from "@/hooks/appointments/useAppointments";
import {
  useCreateEvent,
  useCreateEventFromSource,
  useUpdateEvent,
} from "@/hooks/events/useEventMutations";
import { useEvent } from "@/hooks/events/useEvents";
import { useVenue, useVenues } from "@/hooks/venues/useVenues";

import { EVENT_STATUS_OPTIONS, getEventDisplayTitle } from "./adapters";
import type { EventFormData, EventStatus } from "./types";

type EventFormMode = "manual" | "source";

type EventFormValues = {
  customerId: string;
  sourceAppointmentId: string;
  eventDate: string;
  venueId: string;
  venueNameSnapshot: string;
  groomName: string;
  brideName: string;
  guestCount: string;
  title: string;
  notes: string;
  status: EventStatus | "";
};

const EMPTY_VALUE = "__empty__";
const sectionTitleClass = "text-lg font-semibold text-[var(--lux-heading)]";
const sectionHintClass = "text-sm text-[var(--lux-text-secondary)]";
const textareaClassName =
  "min-h-[130px] w-full rounded-[4px] border px-4 py-3 text-sm text-[var(--lux-text)] placeholder:text-[var(--lux-text-muted)] outline-none transition-all focus:border-[var(--lux-gold-border)] focus:ring-2 focus:ring-[var(--lux-gold-glow)]";

const statusValues = EVENT_STATUS_OPTIONS.map((item) => item.value) as [
  EventStatus,
  ...EventStatus[],
];

const defaultValues: EventFormValues = {
  customerId: "",
  sourceAppointmentId: "",
  eventDate: "",
  venueId: "",
  venueNameSnapshot: "",
  groomName: "",
  brideName: "",
  guestCount: "",
  title: "",
  notes: "",
  status: "",
};

const eventSchema = (t: TFunction, mode: EventFormMode, isEditMode: boolean) =>
  z
    .object({
      customerId: z.string().optional(),
      eventDate: z.string().optional(),
      venueId: z.string().optional(),
      venueNameSnapshot: z.string().max(150).optional(),
      groomName: z.string().max(150).optional(),
      brideName: z.string().max(150).optional(),
      guestCount: z
        .string()
        .optional()
        .refine(
          (value) =>
            !value || (Number.isInteger(Number(value)) && Number(value) >= 0),
          t("events.validation.guestCountInvalid", {
            defaultValue: "Guest count must be zero or greater",
          }),
        ),
      title: z.string().max(200).optional(),
      notes: z.string().optional(),
      status: z.union([z.literal(""), z.enum(statusValues)]),
    })
    .superRefine((values, ctx) => {
      if (!isEditMode && !values.customerId?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["customerId"],
          message: t("events.validation.customerRequired", {
            defaultValue: "Customer is required",
          }),
        });
      }

      if (!isEditMode && mode === "manual" && !values.eventDate?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["eventDate"],
          message: t("events.validation.eventDateRequired", {
            defaultValue: "Event date is required",
          }),
        });
      }
    });

function RequiredMark() {
  return <span className="ms-1 text-[var(--lux-danger)]">*</span>;
}

function SectionIntro({ title, hint }: { title: string; hint?: string }) {
  return (
    <div
      className="border-b pb-3"
      style={{ borderColor: "var(--lux-row-border)" }}
    >
      <h2 className={sectionTitleClass}>{title}</h2>
      {hint ? <p className={sectionHintClass}>{hint}</p> : null}
    </div>
  );
}

function TextField({
  control,
  name,
  label,
  placeholder,
  required,
  type,
  min,
  disabled,
}: {
  control: Control<EventFormValues>;
  name: keyof EventFormValues;
  label: string;
  placeholder?: string;
  required?: boolean;
  type?: string;
  min?: string;
  disabled?: boolean;
}) {
  return (
    <FormField
      control={control}
      name={name as any}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label}
            {required ? <RequiredMark /> : null}
          </FormLabel>
          <FormControl>
            <Input
              {...field}
              type={type}
              min={min}
              disabled={disabled}
              placeholder={placeholder}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function TextAreaField({
  control,
  name,
  label,
  placeholder,
}: {
  control: Control<EventFormValues>;
  name: keyof EventFormValues;
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
            <textarea
              {...field}
              className={textareaClassName}
              placeholder={placeholder}
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
  );
}

function SearchableSelectField({
  control,
  name,
  label,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  options,
  emptyLabel,
  required,
  disabled,
}: {
  control: Control<EventFormValues>;
  name: keyof EventFormValues;
  label: string;
  placeholder: string;
  searchPlaceholder: string;
  emptyMessage: string;
  options: Array<{ value: string; label: string }>;
  emptyLabel?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const filteredOptions = useMemo(
    () =>
      options.filter((option) =>
        option.label.toLowerCase().includes(searchTerm.trim().toLowerCase()),
      ),
    [options, searchTerm],
  );

  return (
    <FormField
      control={control}
      name={name as any}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label}
            {required ? <RequiredMark /> : null}
          </FormLabel>
          <SearchableSelect
            value={field.value || EMPTY_VALUE}
            onValueChange={(value) =>
              field.onChange(value === EMPTY_VALUE ? "" : value)
            }
            onSearch={setSearchTerm}
            placeholder={placeholder}
            searchPlaceholder={searchPlaceholder}
            emptyMessage={emptyMessage}
            disabled={disabled}
            allowClear={Boolean(field.value) && !required && !disabled}
            onClear={() => field.onChange("")}
            triggerClassName="h-10 rounded-2xl border px-3 text-sm"
          >
            {emptyLabel ? (
              <SearchableSelectItem value={EMPTY_VALUE}>
                {emptyLabel}
              </SearchableSelectItem>
            ) : null}
            {filteredOptions.length === 0 ? (
              <SearchableSelectEmpty message={emptyMessage} />
            ) : (
              filteredOptions.map((option) => (
                <SearchableSelectItem key={option.value} value={option.value}>
                  {option.label}
                </SearchableSelectItem>
              ))
            )}
          </SearchableSelect>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function SelectField({
  control,
  name,
  label,
  placeholder,
  options,
  emptyLabel,
}: {
  control: Control<EventFormValues>;
  name: keyof EventFormValues;
  label: string;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
  emptyLabel?: string;
}) {
  return (
    <FormField
      control={control}
      name={name as any}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select
            value={field.value || EMPTY_VALUE}
            onValueChange={(value) =>
              field.onChange(value === EMPTY_VALUE ? "" : value)
            }
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {emptyLabel ? (
                <SelectItem value={EMPTY_VALUE}>{emptyLabel}</SelectItem>
              ) : null}
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function ModeButton({
  active,
  icon,
  title,
  hint,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[4px] border p-4 text-left transition"
      style={{
        background: active
          ? "color-mix(in srgb, var(--lux-gold) 8%, var(--lux-panel-surface))"
          : "var(--lux-row-surface)",
        borderColor: active
          ? "var(--lux-gold-border)"
          : "var(--lux-row-border)",
      }}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(212,175,55,0.08)] text-[var(--lux-gold)]">
          {icon}
        </div>
        <div>
          <p className="font-semibold text-[var(--lux-text)]">{title}</p>
          <p className="mt-1 text-sm text-[var(--lux-text-secondary)]">
            {hint}
          </p>
        </div>
      </div>
    </button>
  );
}

const EventFormPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isArabic = i18n.language === "ar";
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEditMode = Boolean(id);
  const fromAppointmentId = !isEditMode
    ? searchParams.get("fromAppointmentId") || ""
    : "";
  const [mode, setMode] = useState<EventFormMode>("manual");
  const effectiveMode: EventFormMode =
    !isEditMode && fromAppointmentId ? "source" : mode;

  const schema = useMemo(
    () => eventSchema(t, effectiveMode, isEditMode),
    [effectiveMode, isEditMode, t],
  );

  const { data: event, isLoading: eventLoading } = useEvent(id);
  const { data: sourceAppointment, isLoading: sourceAppointmentLoading } =
    useAppointment(fromAppointmentId || undefined);
  const { data: customersResponse, isLoading: customersLoading } = useCustomers(
    {
      currentPage: 1,
      itemsPerPage: 200,
      searchQuery: "",
      status: "all",
      venueId: "",
      weddingDateFrom: "",
      weddingDateTo: "",
    },
  );
  const { data: venuesResponse, isLoading: venuesLoading } = useVenues({
    currentPage: 1,
    itemsPerPage: 200,
    searchQuery: "",
    isActive: "all",
  });
  const createMutation = useCreateEvent();
  const createFromSourceMutation = useCreateEventFromSource();
  const updateMutation = useUpdateEvent(id);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues,
  });
  const watchedCustomerId =
    useWatch({ control: form.control, name: "customerId" })?.trim() || "";
  const watchedVenueId =
    useWatch({ control: form.control, name: "venueId" })?.trim() || "";
  const selectedCustomerId =
    (isEditMode
      ? watchedCustomerId || String(event?.customerId ?? "")
      : watchedCustomerId) || "";
  const selectedVenueId =
    (isEditMode
      ? watchedVenueId || String(event?.venueId ?? "")
      : watchedVenueId) || "";
  const { data: selectedCustomer } = useCustomer(
    selectedCustomerId || undefined,
  );
  const { data: selectedVenue } = useVenue(
    selectedVenueId || undefined,
  );
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
          event?.customer?.fullName ||
          sourceAppointment?.customer?.fullName ||
          `Customer #${selectedCustomerId}`,
      },
      ...base,
    ];
  }, [
    customersResponse?.data,
    event?.customer?.fullName,
    selectedCustomer,
    selectedCustomerId,
    sourceAppointment?.customer?.fullName,
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
        label:
          event?.venue?.name ||
          event?.venueNameSnapshot ||
          sourceAppointment?.venue?.name ||
          `Venue #${selectedVenueId}`,
      },
      ...base,
    ];
  }, [
    event?.venue?.name,
    event?.venueNameSnapshot,
    selectedVenue,
    selectedVenueId,
    sourceAppointment?.venue?.name,
    venuesResponse?.data,
  ]);

  useEffect(() => {
    form.clearErrors();
  }, [effectiveMode, form]);

  useEffect(() => {
    if (!isEditMode || !event) {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMode("manual");
    form.reset({
      customerId: event.customerId ? String(event.customerId) : "",
      sourceAppointmentId: event.sourceAppointmentId
        ? String(event.sourceAppointmentId)
        : "",
      eventDate: event.eventDate ?? "",
      venueId: event.venueId ? String(event.venueId) : "",
      venueNameSnapshot: event.venueNameSnapshot ?? "",
      groomName: event.groomName ?? "",
      brideName: event.brideName ?? "",
      guestCount:
        typeof event.guestCount === "number" ? String(event.guestCount) : "",
      title: event.title ?? "",
      notes: event.notes ?? "",
      status: event.status,
    });
  }, [event, form, isEditMode]);

  useEffect(() => {
    if (isEditMode || !sourceAppointment) {
      return;
    }

    form.reset({
      ...form.getValues(),
      customerId: String(sourceAppointment.customerId),
      sourceAppointmentId: String(sourceAppointment.id),
      eventDate:
        sourceAppointment.weddingDate ??
        sourceAppointment.appointmentDate ??
        "",
      venueId: sourceAppointment.venueId
        ? String(sourceAppointment.venueId)
        : "",
      venueNameSnapshot:
        sourceAppointment.venue?.name ?? form.getValues("venueNameSnapshot"),
      guestCount:
        typeof sourceAppointment.guestCount === "number"
          ? String(sourceAppointment.guestCount)
          : "",
    });
  }, [form, isEditMode, sourceAppointment]);

  const isBusy =
    eventLoading ||
    sourceAppointmentLoading ||
    customersLoading ||
    venuesLoading ||
    createMutation.isPending ||
    createFromSourceMutation.isPending ||
    updateMutation.isPending;

  const onSubmit: SubmitHandler<EventFormValues> = (values) => {
    const selectedVenueOption = venueOptions.find(
      (venue) => venue.value === values.venueId,
    );

    const payload: EventFormData = {
      ...values,
      sourceAppointmentId:
        values.sourceAppointmentId || fromAppointmentId || undefined,
      venueNameSnapshot:
        values.venueNameSnapshot.trim() || selectedVenueOption?.label || "",
    };

    if (isEditMode) {
      updateMutation.mutate(payload);
      return;
    }

    if (effectiveMode === "source" && payload.sourceAppointmentId) {
      createFromSourceMutation.mutate(payload);
      return;
    }

    createMutation.mutate(payload);
  };

  if (
    eventLoading ||
    sourceAppointmentLoading ||
    customersLoading ||
    venuesLoading
  ) {
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
      permission={isEditMode ? "events.update" : "events.create"}
    >
      <PageContainer className="pb-4 pt-4 text-foreground">
        <div dir={i18n.dir()} className="mx-auto w-full max-w-5xl space-y-6">
          <button
            type="button"
            onClick={() => navigate("/events")}
            className="inline-flex items-center gap-2 text-sm text-[var(--lux-text-secondary)] transition-colors hover:text-[var(--lux-gold)]"
          >
            {"<-"}{" "}
            {t("events.backToEvents", { defaultValue: "Back to Events" })}
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
                <CalendarRange className="h-6 w-6" />
              </div>

              <div className="space-y-1">
                <h1 className="text-xl font-bold text-[var(--lux-heading)]">
                  {isEditMode
                    ? t("events.editTitle", { defaultValue: "Edit Event" })
                    : t("events.createTitle", { defaultValue: "Create Event" })}
                </h1>
                <p className="text-sm text-[var(--lux-text-secondary)]">
                  {isEditMode
                    ? t("events.editDescription", {
                        defaultValue:
                          "Update event details, venue, and linked records.",
                      })
                    : t("events.createDescription", {
                        defaultValue:
                          "Create a new event manually or start from an existing source record.",
                      })}
                </p>
              </div>
            </div>
          </div>

          {!isEditMode && !fromAppointmentId ? (
            <Card className="overflow-hidden rounded-[4px]">
              <div className="p-6 md:p-8">
                <div className="space-y-4">
                  <SectionIntro
                    title={t("events.createMode", {
                      defaultValue: "Creation Flow",
                    })}
                    hint={t("events.createModeHint", {
                      defaultValue:
                        "Choose whether this event starts as a manual record or from an existing customer.",
                    })}
                  />
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <ModeButton
                      active={mode === "manual"}
                      icon={<Sparkles className="h-4 w-4" />}
                      title={t("events.createManually", {
                        defaultValue: "Create Manually",
                      })}
                      hint={t("events.createManuallyHint", {
                        defaultValue:
                          "Enter the event information directly and choose linked records when needed.",
                      })}
                      onClick={() => setMode("manual")}
                    />
                    <ModeButton
                      active={mode === "source"}
                      icon={<Link2 className="h-4 w-4" />}
                      title={t("events.createFromSource", {
                        defaultValue: "Create From Source",
                      })}
                      hint={t("events.createFromSourceHint", {
                        defaultValue:
                          "Start from an existing customer and inherit the source context.",
                      })}
                      onClick={() => setMode("source")}
                    />
                  </div>
                </div>
              </div>
            </Card>
          ) : null}

          <Card className="overflow-hidden rounded-[4px]">
            <div className="p-6 md:p-8">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-8"
                >
                  {fromAppointmentId ? (
                    <div className="rounded-[4px] border border-[var(--lux-row-border)] bg-[var(--lux-row-surface)] px-4 py-3 text-sm text-[var(--lux-text-secondary)]">
                      {t("events.sourceAppointmentPrefillHint", {
                        defaultValue:
                          "This event was prefilled from the selected appointment. Customer, event date, guest count, and venue came from that exact appointment and can still be edited.",
                      })}
                    </div>
                  ) : null}
                  <section className="space-y-4">
                    <SectionIntro
                      title={t("events.linkedRecords", {
                        defaultValue: "Linked Records",
                      })}
                      hint={t("events.linkedRecordsHint", {
                        defaultValue:
                          "Link the event to a customer when available.",
                      })}
                    />
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <SearchableSelectField
                        control={form.control}
                        name="customerId"
                        label={t("events.customer", {
                          defaultValue: "Customer",
                        })}
                        placeholder={t("events.selectCustomer", {
                          defaultValue: "Select customer",
                        })}
                        searchPlaceholder={t("events.searchCustomers", {
                          defaultValue: isArabic
                            ? "Ø§Ø¨Ø­Ø« Ø¹Ù† Ø¹Ù…ÙŠÙ„..."
                            : "Search customers...",
                        })}
                        emptyMessage={t("common.noResultsTitle", {
                          defaultValue: isArabic
                            ? "Ù„Ø§ ØªÙˆØ¬Ø¯ Ù†ØªØ§Ø¦Ø¬"
                            : "No results found",
                        })}
                        emptyLabel={t("events.noCustomerSelected", {
                          defaultValue: "No customer selected",
                        })}
                        options={customerOptions}
                        required={!isEditMode}
                      />
                    </div>
                  </section>

                  <section className="space-y-4">
                    <SectionIntro
                      title={t("events.generalInfo", {
                        defaultValue: "General Info",
                      })}
                      hint={t("events.generalInfoHint", {
                        defaultValue:
                          effectiveMode === "source" && !isEditMode
                            ? "Add any optional overrides before creating the event from the selected source."
                            : "Capture the main event details, party names, venue, and planning status.",
                      })}
                    />
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <TextField
                        control={form.control}
                        name="eventDate"
                        type="date"
                        label={t("events.eventDate", {
                          defaultValue: "Event Date",
                        })}
                        required={effectiveMode === "manual" && !isEditMode}
                      />
                      {effectiveMode !== "source" || isEditMode ? (
                        <SearchableSelectField
                          control={form.control}
                          name="venueId"
                          label={t("common.venue", { defaultValue: "Venue" })}
                          placeholder={t("events.selectVenue", {
                            defaultValue: "Select venue",
                          })}
                          searchPlaceholder={t("events.searchVenues", {
                            defaultValue: isArabic
                              ? "Ø§Ø¨Ø­Ø« Ø¹Ù† Ù‚Ø§Ø¹Ø©..."
                              : "Search venues...",
                          })}
                          emptyMessage={t("common.noResultsTitle", {
                            defaultValue: isArabic
                              ? "Ù„Ø§ ØªÙˆØ¬Ø¯ Ù†ØªØ§Ø¦Ø¬"
                              : "No results found",
                          })}
                          emptyLabel={t("events.noVenueSelected", {
                            defaultValue: "No venue selected",
                          })}
                          options={venueOptions}
                        />
                      ) : null}
                      {effectiveMode !== "source" || isEditMode ? (
                        <TextField
                          control={form.control}
                          name="venueNameSnapshot"
                          label={t("events.venueNameSnapshot", {
                            defaultValue: "Venue Name Snapshot",
                          })}
                          placeholder={t(
                            "events.venueNameSnapshotPlaceholder",
                            {
                              defaultValue:
                                "Type the venue name if it is not in the list",
                            },
                          )}
                        />
                      ) : null}
                      <TextField
                        control={form.control}
                        name="title"
                        label={t("events.titleField", {
                          defaultValue: "Title",
                        })}
                        placeholder={t("events.titlePlaceholder", {
                          defaultValue: "Enter event title",
                        })}
                      />
                      <TextField
                        control={form.control}
                        name="groomName"
                        label={t("events.groomName", {
                          defaultValue: "Groom Name",
                        })}
                        placeholder={t("events.groomNamePlaceholder", {
                          defaultValue: "Enter groom name",
                        })}
                      />
                      <TextField
                        control={form.control}
                        name="brideName"
                        label={t("events.brideName", {
                          defaultValue: "Bride Name",
                        })}
                        placeholder={t("events.brideNamePlaceholder", {
                          defaultValue: "Enter bride name",
                        })}
                      />
                      {effectiveMode !== "source" || isEditMode ? (
                        <TextField
                          control={form.control}
                          name="guestCount"
                          type="number"
                          min="0"
                          label={t("events.guestCount", {
                            defaultValue: "Guest Count",
                          })}
                          placeholder={t("events.guestCountPlaceholder", {
                            defaultValue: "Enter expected guest count",
                          })}
                        />
                      ) : null}
                      {effectiveMode !== "source" || isEditMode ? (
                        <SelectField
                          control={form.control}
                          name="status"
                          label={t("events.statusLabel", {
                            defaultValue: "Status",
                          })}
                          placeholder={t("events.selectStatus", {
                            defaultValue: "Select status",
                          })}
                          emptyLabel={t("events.useDefaultStatus", {
                            defaultValue: "Use default status",
                          })}
                          options={EVENT_STATUS_OPTIONS.map((item) => ({
                            value: item.value,
                            label: t(`events.status.${item.value}`, {
                              defaultValue: item.label,
                            }),
                          }))}
                        />
                      ) : null}
                    </div>
                    <TextAreaField
                      control={form.control}
                      name="notes"
                      label={t("common.notes", { defaultValue: "Notes" })}
                      placeholder={t("events.notesPlaceholder", {
                        defaultValue:
                          "Add event notes, planning context, or operational remarks...",
                      })}
                    />
                  </section>

                  <div
                    className="flex flex-col justify-end gap-3 pt-6 sm:flex-row"
                    style={{ borderTop: "1px solid var(--lux-row-border)" }}
                  >
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/events")}
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
                          : effectiveMode === "source"
                            ? t("events.createFromSource", {
                                defaultValue: "Create From Source",
                              })
                            : t("events.create", {
                                defaultValue: "Create Event",
                              })}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </Card>

          {event ? (
            <p className="text-sm text-[var(--lux-text-secondary)]">
              {t("events.currentEventPreview", {
                defaultValue: "Editing:",
              })}{" "}
              {getEventDisplayTitle(event)}
            </p>
          ) : null}
        </div>
      </PageContainer>
    </ProtectedComponent>
  );
};

export default EventFormPage;
