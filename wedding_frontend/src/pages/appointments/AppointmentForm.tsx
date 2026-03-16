import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Sparkles, UserRoundSearch } from "lucide-react";
import {
  useForm,
  type Control,
  type SubmitHandler,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
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
  useCreateAppointment,
  useCreateAppointmentWithLead,
  useUpdateAppointment,
} from "@/hooks/appointments/useAppointmentMutations";
import { useAppointment } from "@/hooks/appointments/useAppointments";
import { useLeads } from "@/hooks/leads/useLeads";
import { useUsers } from "@/hooks/users/useUsers";
import { useVenues } from "@/hooks/venues/useVenues";
import {
  APPOINTMENT_MEETING_TYPE_OPTIONS,
  APPOINTMENT_STATUS_OPTIONS,
} from "@/pages/appointments/adapters";

import type {
  AppointmentMeetingType,
  AppointmentStatus,
} from "./types";

type AppointmentMode = "new" | "existing";

type AppointmentFormValues = {
  leadId: string;
  leadFullName: string;
  leadMobile: string;
  leadMobile2: string;
  leadEmail: string;
  leadVenueId: string;
  leadVenueNameSnapshot: string;
  leadWeddingDate: string;
  leadGuestCount: string;
  leadSource: string;
  leadNotes: string;
  appointmentDate: string;
  appointmentStartTime: string;
  appointmentEndTime: string;
  status: AppointmentStatus;
  meetingType: AppointmentMeetingType;
  assignedToUserId: string;
  notes: string;
  result: string;
  nextStep: string;
};

const EMPTY_VALUE = "__empty__";
const sectionTitleClass = "text-lg font-semibold text-[var(--lux-heading)]";
const sectionHintClass = "text-sm text-[var(--lux-text-secondary)]";
const textareaClassName =
  "min-h-[130px] w-full rounded-[22px] border px-4 py-3 text-sm text-[var(--lux-text)] placeholder:text-[var(--lux-text-muted)] outline-none transition-all focus:border-[var(--lux-gold-border)] focus:ring-2 focus:ring-[var(--lux-gold-glow)]";

const statusValues = APPOINTMENT_STATUS_OPTIONS.map((item) => item.value) as [
  AppointmentStatus,
  ...AppointmentStatus[],
];
const meetingTypeValues = APPOINTMENT_MEETING_TYPE_OPTIONS.map(
  (item) => item.value,
) as [AppointmentMeetingType, ...AppointmentMeetingType[]];

const appointmentSchema = (mode: AppointmentMode, isEditMode: boolean) =>
  z
    .object({
      leadId: z.string().optional(),
      leadFullName: z.string().max(150).optional(),
      leadMobile: z.string().max(30).optional(),
      leadMobile2: z.string().max(30).optional(),
      leadEmail: z.union([z.literal(""), z.string().email("Invalid email address")]),
      leadVenueId: z.string().optional(),
      leadVenueNameSnapshot: z.string().max(150).optional(),
      leadWeddingDate: z.string().optional(),
      leadGuestCount: z
        .string()
        .optional()
        .refine(
          (value) => !value || (Number.isInteger(Number(value)) && Number(value) > 0),
          "Guest count must be a positive number",
        ),
      leadSource: z.string().max(100).optional(),
      leadNotes: z.string().optional(),
      appointmentDate: z.string().min(1, "Appointment date is required"),
      appointmentStartTime: z
        .string()
        .min(1, "Start time is required")
        .max(10, "Start time is invalid"),
      appointmentEndTime: z.string().max(10).optional(),
      status: z.enum(statusValues),
      meetingType: z.enum(meetingTypeValues),
      assignedToUserId: z.string().optional(),
      notes: z.string().optional(),
      result: z.string().optional(),
      nextStep: z.string().max(255).optional(),
    })
    .superRefine((values, ctx) => {
      if (isEditMode || mode === "existing") {
        if (!values.leadId?.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["leadId"],
            message: "Lead is required",
          });
        }
        return;
      }

      if (!values.leadFullName?.trim() || values.leadFullName.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["leadFullName"],
          message: "Full name is required",
        });
      }

      if (!values.leadMobile?.trim() || values.leadMobile.trim().length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["leadMobile"],
          message: "Mobile is required",
        });
      }

      if (!values.leadWeddingDate?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["leadWeddingDate"],
          message: "Wedding date is required",
        });
      }
    });

const defaultValues: AppointmentFormValues = {
  leadId: "",
  leadFullName: "",
  leadMobile: "",
  leadMobile2: "",
  leadEmail: "",
  leadVenueId: "",
  leadVenueNameSnapshot: "",
  leadWeddingDate: "",
  leadGuestCount: "",
  leadSource: "",
  leadNotes: "",
  appointmentDate: "",
  appointmentStartTime: "",
  appointmentEndTime: "",
  status: "scheduled",
  meetingType: "office_visit",
  assignedToUserId: "",
  notes: "",
  result: "",
  nextStep: "",
};

function RequiredMark() {
  return <span className="ms-1 text-[var(--lux-danger)]">*</span>;
}

function SectionIntro({
  title,
  hint,
}: {
  title: string;
  hint?: string;
}) {
  return (
    <div className="border-b pb-3" style={{ borderColor: "var(--lux-row-border)" }}>
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
  control: Control<AppointmentFormValues>;
  name: keyof AppointmentFormValues;
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
  control: Control<AppointmentFormValues>;
  name: keyof AppointmentFormValues;
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

function SelectField({
  control,
  name,
  label,
  placeholder,
  options,
  emptyLabel,
  required,
  disabled,
}: {
  control: Control<AppointmentFormValues>;
  name: keyof AppointmentFormValues;
  label: string;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
  emptyLabel?: string;
  required?: boolean;
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
          <Select
            value={field.value || EMPTY_VALUE}
            onValueChange={(value) =>
              field.onChange(value === EMPTY_VALUE ? "" : value)
            }
            disabled={disabled}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {emptyLabel ? <SelectItem value={EMPTY_VALUE}>{emptyLabel}</SelectItem> : null}
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
      className="rounded-[22px] border p-4 text-left transition"
      style={{
        background: active
          ? "color-mix(in srgb, var(--lux-gold) 8%, var(--lux-panel-surface))"
          : "var(--lux-row-surface)",
        borderColor: active ? "var(--lux-gold-border)" : "var(--lux-row-border)",
      }}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(212,175,55,0.08)] text-[var(--lux-gold)]">
          {icon}
        </div>
        <div>
          <p className="font-semibold text-[var(--lux-text)]">{title}</p>
          <p className="mt-1 text-sm text-[var(--lux-text-secondary)]">{hint}</p>
        </div>
      </div>
    </button>
  );
}

const AppointmentFormPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEditMode = Boolean(id);
  const leadIdFromQuery = searchParams.get("leadId") || "";
  const [mode, setMode] = useState<AppointmentMode>("new");

  const schema = useMemo(
    () => appointmentSchema(mode, isEditMode),
    [isEditMode, mode],
  );

  const { data: appointment, isLoading: appointmentLoading } = useAppointment(id);
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
  const { data: usersResponse, isLoading: usersLoading } = useUsers({
    currentPage: 1,
    itemsPerPage: 200,
    searchQuery: "",
  });
  const { data: venuesResponse, isLoading: venuesLoading } = useVenues({
    currentPage: 1,
    itemsPerPage: 200,
    searchQuery: "",
    isActive: "all",
  });

  const leads = leadsResponse?.data ?? [];
  const users = usersResponse?.data ?? [];
  const venues = venuesResponse?.data ?? [];
  const createMutation = useCreateAppointment();
  const createWithLeadMutation = useCreateAppointmentWithLead();
  const updateMutation = useUpdateAppointment(id);

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues,
  });

  useEffect(() => {
    if (!isEditMode && leadIdFromQuery) {
      form.setValue("leadId", leadIdFromQuery, { shouldDirty: false });
    }
  }, [form, isEditMode, leadIdFromQuery]);

  useEffect(() => {
    form.clearErrors();
  }, [form, mode]);

  useEffect(() => {
    if (!isEditMode || !appointment) {
      return;
    }

    setMode("existing");
    form.reset({
      leadId: String(appointment.leadId),
      leadFullName: appointment.lead?.fullName ?? "",
      leadMobile: appointment.lead?.mobile ?? "",
      leadMobile2: appointment.lead?.mobile2 ?? "",
      leadEmail: appointment.lead?.email ?? "",
      leadVenueId: appointment.lead?.venueId ? String(appointment.lead.venueId) : "",
      leadVenueNameSnapshot: appointment.lead?.venueNameSnapshot ?? "",
      leadWeddingDate: appointment.lead?.weddingDate ?? "",
      leadGuestCount: appointment.lead?.guestCount ? String(appointment.lead.guestCount) : "",
      leadSource: appointment.lead?.source ?? "",
      leadNotes: appointment.lead?.notes ?? "",
      appointmentDate: appointment.appointmentDate,
      appointmentStartTime: appointment.appointmentStartTime,
      appointmentEndTime: appointment.appointmentEndTime ?? "",
      status: appointment.status,
      meetingType: appointment.meetingType,
      assignedToUserId: appointment.assignedToUserId ? String(appointment.assignedToUserId) : "",
      notes: appointment.notes ?? "",
      result: appointment.result ?? "",
      nextStep: appointment.nextStep ?? "",
    });
  }, [appointment, form, isEditMode]);

  const isBusy =
    appointmentLoading ||
    leadsLoading ||
    usersLoading ||
    venuesLoading ||
    createMutation.isPending ||
    createWithLeadMutation.isPending ||
    updateMutation.isPending;

  const onSubmit: SubmitHandler<AppointmentFormValues> = (values) => {
    if (isEditMode) {
      updateMutation.mutate({
        leadId: values.leadId,
        appointmentDate: values.appointmentDate,
        appointmentStartTime: values.appointmentStartTime,
        appointmentEndTime: values.appointmentEndTime,
        status: values.status,
        meetingType: values.meetingType,
        assignedToUserId: values.assignedToUserId,
        notes: values.notes,
        result: values.result,
        nextStep: values.nextStep,
      });
      return;
    }

    if (mode === "existing") {
      createMutation.mutate({
        leadId: values.leadId,
        appointmentDate: values.appointmentDate,
        appointmentStartTime: values.appointmentStartTime,
        appointmentEndTime: values.appointmentEndTime,
        status: values.status,
        meetingType: values.meetingType,
        assignedToUserId: values.assignedToUserId,
        notes: values.notes,
        result: values.result,
        nextStep: values.nextStep,
      });
      return;
    }

    const selectedVenue = venues.find((venue) => String(venue.id) === values.leadVenueId);

    createWithLeadMutation.mutate({
      lead: {
        fullName: values.leadFullName,
        mobile: values.leadMobile,
        mobile2: values.leadMobile2,
        email: values.leadEmail,
        weddingDate: values.leadWeddingDate,
        guestCount: values.leadGuestCount,
        venueId: values.leadVenueId,
        venueNameSnapshot: values.leadVenueNameSnapshot || selectedVenue?.name || undefined,
        source: values.leadSource,
        notes: values.leadNotes,
      },
      appointment: {
        appointmentDate: values.appointmentDate,
        appointmentStartTime: values.appointmentStartTime,
        appointmentEndTime: values.appointmentEndTime,
        assignedToUserId: values.assignedToUserId,
        meetingType: values.meetingType,
        notes: values.notes,
        nextStep: values.nextStep,
      },
    });
  };

  if (appointmentLoading || leadsLoading || usersLoading || venuesLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-sm text-[var(--lux-text-secondary)]">
          {t("common.loading", { defaultValue: "Loading..." })}
        </div>
      </div>
    );
  }

  return (
    <ProtectedComponent permission={isEditMode ? "appointments.update" : "appointments.create"}>
      <PageContainer className="pb-4 pt-4 text-foreground">
        <div dir={i18n.dir()} className="mx-auto w-full max-w-5xl space-y-6">
          <button
            type="button"
            onClick={() => navigate("/appointments")}
            className="inline-flex items-center gap-2 text-sm text-[var(--lux-text-secondary)] transition-colors hover:text-[var(--lux-gold)]"
          >
            {"<-"} {t("appointments.backToAppointments", { defaultValue: "Back to Appointments" })}
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
                    ? t("appointments.editTitle", { defaultValue: "Edit Appointment" })
                    : t("appointments.scheduleTitle", { defaultValue: "Schedule Appointment" })}
                </h1>
                <p className="text-sm text-[var(--lux-text-secondary)]">
                  {isEditMode
                    ? t("appointments.editDescription", {
                        defaultValue: "Update the appointment timing, assignment, and meeting details.",
                      })
                    : t("appointments.scheduleDescription", {
                        defaultValue:
                          "Create an appointment for a new prospect or assign one to an existing lead.",
                      })}
                </p>
              </div>
            </div>
          </div>
          {!isEditMode ? (
            <Card className="overflow-hidden rounded-[24px]">
              <div className="p-6 md:p-8">
                <div className="space-y-4">
                  <SectionIntro
                    title={t("appointments.flowMode", { defaultValue: "Scheduling Flow" })}
                    hint={t("appointments.flowModeHint", {
                      defaultValue:
                        "Start with a new prospect by default, or switch to an existing lead when needed.",
                    })}
                  />
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <ModeButton
                      active={mode === "new"}
                      icon={<Sparkles className="h-4 w-4" />}
                      title={t("appointments.newLeadMode", { defaultValue: "New Lead" })}
                      hint={t("appointments.newLeadModeHint", {
                        defaultValue: "Create the prospect and schedule the appointment in one step.",
                      })}
                      onClick={() => setMode("new")}
                    />
                    <ModeButton
                      active={mode === "existing"}
                      icon={<UserRoundSearch className="h-4 w-4" />}
                      title={t("appointments.existingLeadMode", { defaultValue: "Existing Lead" })}
                      hint={t("appointments.existingLeadModeHint", {
                        defaultValue: "Attach the appointment to a lead already in the CRM.",
                      })}
                      onClick={() => setMode("existing")}
                    />
                  </div>
                </div>
              </div>
            </Card>
          ) : null}

          <Card className="overflow-hidden rounded-[24px]">
            <div className="p-6 md:p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  {mode === "new" && !isEditMode ? (
                    <section className="space-y-4">
                      <SectionIntro
                        title={t("appointments.newProspectSection", {
                          defaultValue: "New Prospect Details",
                        })}
                        hint={t("appointments.newProspectSectionHint", {
                          defaultValue:
                            "Capture the inquiry details first, then schedule the meeting.",
                        })}
                      />
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <TextField
                          control={form.control}
                          name="leadFullName"
                          label={t("appointments.prospectName", {
                            defaultValue: "Prospect Full Name",
                          })}
                          placeholder={t("appointments.prospectNamePlaceholder", {
                            defaultValue: "Enter full name",
                          })}
                          required
                        />
                        <TextField
                          control={form.control}
                          name="leadEmail"
                          type="email"
                          label={t("appointments.prospectEmail", { defaultValue: "Email" })}
                          placeholder="prospect@example.com"
                        />
                        <TextField
                          control={form.control}
                          name="leadMobile"
                          label={t("appointments.prospectMobile", {
                            defaultValue: "Primary Mobile",
                          })}
                          placeholder={t("appointments.prospectMobilePlaceholder", {
                            defaultValue: "Enter primary mobile number",
                          })}
                          required
                        />
                        <TextField
                          control={form.control}
                          name="leadMobile2"
                          label={t("appointments.prospectMobile2", {
                            defaultValue: "Secondary Mobile",
                          })}
                          placeholder={t("appointments.prospectMobile2Placeholder", {
                            defaultValue: "Enter secondary mobile number",
                          })}
                        />
                        <TextField
                          control={form.control}
                          name="leadWeddingDate"
                          type="date"
                          label={t("appointments.prospectWeddingDate", {
                            defaultValue: "Wedding Date",
                          })}
                          required
                        />
                        <TextField
                          control={form.control}
                          name="leadGuestCount"
                          type="number"
                          min="1"
                          label={t("appointments.prospectGuestCount", {
                            defaultValue: "Guest Count",
                          })}
                          placeholder={t("appointments.prospectGuestCountPlaceholder", {
                            defaultValue: "Expected guests",
                          })}
                        />
                        <SelectField
                          control={form.control}
                          name="leadVenueId"
                          label={t("appointments.prospectVenue", {
                            defaultValue: "Preferred Venue",
                          })}
                          placeholder={t("appointments.selectVenue", {
                            defaultValue: "Select venue",
                          })}
                          emptyLabel={t("appointments.noVenueSelected", {
                            defaultValue: "No venue selected",
                          })}
                          options={venues.map((venue) => ({
                            value: String(venue.id),
                            label: venue.name,
                          }))}
                        />
                        <TextField
                          control={form.control}
                          name="leadVenueNameSnapshot"
                          label={t("appointments.prospectVenueName", {
                            defaultValue: "Venue Name Snapshot",
                          })}
                          placeholder={t("appointments.prospectVenueNamePlaceholder", {
                            defaultValue: "Type the venue name if it is not listed",
                          })}
                        />
                        <TextField
                          control={form.control}
                          name="leadSource"
                          label={t("appointments.prospectSource", {
                            defaultValue: "Inquiry Source",
                          })}
                          placeholder={t("appointments.prospectSourcePlaceholder", {
                            defaultValue: "Instagram, referral, WhatsApp...",
                          })}
                        />
                      </div>
                      <TextAreaField
                        control={form.control}
                        name="leadNotes"
                        label={t("appointments.prospectNotes", {
                          defaultValue: "Lead Notes",
                        })}
                        placeholder={t("appointments.prospectNotesPlaceholder", {
                          defaultValue: "Add inquiry details, preferences, or internal notes...",
                        })}
                      />
                    </section>
                  ) : null}

                  {(mode === "existing" || isEditMode) ? (
                    <section className="space-y-4">
                      <SectionIntro
                        title={t("appointments.existingLeadSection", {
                          defaultValue: "Existing Lead",
                        })}
                        hint={t("appointments.existingLeadSectionHint", {
                          defaultValue: "Choose the lead that this appointment belongs to.",
                        })}
                      />
                      <SelectField
                        control={form.control}
                        name="leadId"
                        label={t("appointments.lead", { defaultValue: "Lead" })}
                        placeholder={t("appointments.selectLead", {
                          defaultValue: "Select lead",
                        })}
                        options={leads.map((lead) => ({
                          value: String(lead.id),
                          label: lead.fullName,
                        }))}
                        required
                        disabled={isEditMode}
                      />
                    </section>
                  ) : null}

                  <section className="space-y-4">
                    <SectionIntro
                      title={t("appointments.scheduleSection", {
                        defaultValue: "Appointment Details",
                      })}
                      hint={t("appointments.scheduleSectionHint", {
                        defaultValue: "Set the date, timing, assignment, and meeting type.",
                      })}
                    />
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <TextField
                        control={form.control}
                        name="appointmentDate"
                        type="date"
                        label={t("appointments.date", { defaultValue: "Appointment Date" })}
                        required
                      />
                      <SelectField
                        control={form.control}
                        name="assignedToUserId"
                        label={t("appointments.assignedTo", { defaultValue: "Assigned To" })}
                        placeholder={t("appointments.selectUser", {
                          defaultValue: "Select team member",
                        })}
                        emptyLabel={t("appointments.unassigned", {
                          defaultValue: "Unassigned",
                        })}
                        options={users.map((user) => ({
                          value: String(user.id),
                          label: user.fullName,
                        }))}
                      />
                      <TextField
                        control={form.control}
                        name="appointmentStartTime"
                        type="time"
                        label={t("appointments.startTime", { defaultValue: "Start Time" })}
                        required
                      />
                      <TextField
                        control={form.control}
                        name="appointmentEndTime"
                        type="time"
                        label={t("appointments.endTime", { defaultValue: "End Time" })}
                      />
                      <SelectField
                        control={form.control}
                        name="meetingType"
                        label={t("appointments.meetingType", { defaultValue: "Meeting Type" })}
                        placeholder={t("appointments.selectMeetingType", {
                          defaultValue: "Select meeting type",
                        })}
                        options={APPOINTMENT_MEETING_TYPE_OPTIONS.map((item) => ({
                          value: item.value,
                          label: item.label,
                        }))}
                      />
                      {isEditMode ? (
                        <SelectField
                          control={form.control}
                          name="status"
                          label={t("appointments.statusLabel", { defaultValue: "Status" })}
                          placeholder={t("appointments.selectStatus", {
                            defaultValue: "Select status",
                          })}
                          options={APPOINTMENT_STATUS_OPTIONS.map((item) => ({
                            value: item.value,
                            label: item.label,
                          }))}
                        />
                      ) : null}
                    </div>
                  </section>

                  <section className="space-y-4">
                    <SectionIntro
                      title={t("appointments.followUpSection", {
                        defaultValue: "Notes & Follow-Up",
                      })}
                      hint={t("appointments.followUpSectionHint", {
                        defaultValue: "Add meeting notes and any next action for the team.",
                      })}
                    />
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <TextField
                        control={form.control}
                        name="nextStep"
                        label={t("appointments.nextStep", { defaultValue: "Next Step" })}
                        placeholder={t("appointments.nextStepPlaceholder", {
                          defaultValue: "Call back, send proposal, confirm venue visit...",
                        })}
                      />
                      {isEditMode ? (
                        <TextField
                          control={form.control}
                          name="result"
                          label={t("appointments.result", { defaultValue: "Meeting Result" })}
                          placeholder={t("appointments.resultPlaceholder", {
                            defaultValue: "Summarize the outcome",
                          })}
                        />
                      ) : null}
                    </div>
                    <TextAreaField
                      control={form.control}
                      name="notes"
                      label={t("appointments.notes", {
                        defaultValue: "Appointment Notes",
                      })}
                      placeholder={t("appointments.notesPlaceholder", {
                        defaultValue: "Add internal notes, preferences, or context for this appointment...",
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
                      onClick={() => navigate("/appointments")}
                      disabled={isBusy}
                    >
                      {t("common.cancel", { defaultValue: "Cancel" })}
                    </Button>
                    <Button type="submit" disabled={isBusy}>
                      {isBusy
                        ? t("common.processing", { defaultValue: "Processing..." })
                        : isEditMode
                          ? t("common.update", { defaultValue: "Update" })
                          : t("appointments.scheduleAction", {
                              defaultValue: "Schedule Appointment",
                            })}
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

export default AppointmentFormPage;
