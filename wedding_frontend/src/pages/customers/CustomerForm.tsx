import { useEffect, useMemo } from "react";
import { UsersRound } from "lucide-react";
import { useForm, type Resolver, type SubmitHandler } from "react-hook-form";
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
import {
  useCreateCustomer,
  useUpdateCustomer,
} from "@/hooks/customers/useCustomerMutations";
import { useCustomer } from "@/hooks/customers/useCustomers";

import { CUSTOMER_STATUS_OPTIONS } from "./adapters";
import type { CustomerFormData, CustomerStatus } from "./types";

const optionalTrimmedString = (max: number) =>
  z.preprocess(
    (value) => {
      if (typeof value !== "string") {
        return value;
      }

      const trimmed = value.trim();
      return trimmed === "" ? "" : trimmed;
    },
    z.union([z.literal(""), z.string().max(max)]),
  );

const buildCustomerSchema = (
  t: (key: string, options?: Record<string, unknown>) => string,
) =>
  z.object({
    fullName: z
      .string()
      .trim()
      .min(
        2,
        t("customers.validation.fullNameRequired", {
          defaultValue: "Full name is required",
        }),
      )
      .max(150),
    mobile: z
      .string()
      .trim()
      .min(
        3,
        t("customers.validation.mobileRequired", {
          defaultValue: "Primary mobile is required",
        }),
      )
      .max(30),
    mobile2: optionalTrimmedString(30).optional(),
    email: z.union([
      z.literal(""),
      z
        .string()
        .trim()
        .email(
          t("customers.validation.emailInvalid", {
            defaultValue: "Invalid email address",
          }),
        ),
    ]),
    nationalId: z.union([
      z.literal(""),
      z
        .string()
        .trim()
        .regex(
          /^\d{12}$/,
          t("customers.validation.nationalIdInvalid", {
            defaultValue: "National ID must be exactly 12 digits",
          }),
        ),
    ]),
    address: optionalTrimmedString(255).optional(),
    notes: z.string().optional(),
    status: z.enum(
      CUSTOMER_STATUS_OPTIONS.map((status) => status.value) as [
        CustomerStatus,
        ...CustomerStatus[],
      ],
    ),
  });

type CustomerFormValues = z.infer<ReturnType<typeof buildCustomerSchema>>;

const CustomerFormPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const { data: customer, isLoading } = useCustomer(id);
  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer(id);
  const customerSchema = useMemo(() => buildCustomerSchema(t), [t]);

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema) as Resolver<CustomerFormValues>,
    defaultValues: {
      fullName: "",
      mobile: "",
      mobile2: "",
      email: "",
      nationalId: "",
      address: "",
      notes: "",
      status: "active",
    },
  });

  useEffect(() => {
    if (!isEditMode || !customer) {
      return;
    }

    form.reset({
      fullName: customer.fullName ?? "",
      mobile: customer.mobile ?? "",
      mobile2: customer.mobile2 ?? "",
      email: customer.email ?? "",
      nationalId: customer.nationalId ?? "",
      address: customer.address ?? "",
      notes: customer.notes ?? "",
      status: customer.status,
    });
  }, [customer, form, isEditMode]);

  const onSubmit: SubmitHandler<CustomerFormValues> = (values) => {
    const payload: CustomerFormData = values;

    if (isEditMode) {
      updateMutation.mutate(payload);
      return;
    }

    createMutation.mutate(payload);
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

  const isBusy = createMutation.isPending || updateMutation.isPending;

  return (
    <ProtectedComponent
      permission={isEditMode ? "customers.update" : "customers.create"}
    >
      <CrudPageLayout>
        <div dir={i18n.dir()}>
          <CrudFormLayout
            icon={<UsersRound className="h-5 w-5 text-primary" />}
            title={
              isEditMode
                ? t("customers.editTitle", { defaultValue: "Edit Customer" })
                : t("customers.createTitle", { defaultValue: "Create Customer" })
            }
            description={t("customers.basicInformationHint", {
              defaultValue:
                "Capture the customer master profile and contact information.",
            })}
            maxWidthClassName="max-w-4xl"
            backAction={
              <button
                type="button"
                onClick={() => navigate("/customers")}
                className="crud-header-back"
              >
                <span aria-hidden="true">←</span>
                {t("customers.backToCustomers", {
                  defaultValue: "Back to Customers",
                })}
              </button>
            }
          >
            <div className="p-6 md:p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <CrudFormSection
                    title={t("customers.basicInformation", {
                      defaultValue: "Basic Information",
                    })}
                    description={t("customers.basicInformationHint", {
                      defaultValue:
                        "Capture the customer master profile and contact information.",
                    })}
                  >
                    <div className="crud-form-grid md:grid-cols-2">
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
                              <Input {...field} />
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
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="nationalId"
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
                                inputMode="numeric"
                                maxLength={12}
                                placeholder={t("customers.nationalIdPlaceholder", {
                                  defaultValue: "Enter 12-digit national ID",
                                })}
                              />
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
                              {t("customers.statusLabel", {
                                defaultValue: "Status",
                              })}
                            </FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {CUSTOMER_STATUS_OPTIONS.map((status) => (
                                  <SelectItem key={status.value} value={status.value}>
                                    {t(`customers.status.${status.value}`, {
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
                    </div>

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("customers.address", { defaultValue: "Address" })}
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder={t("customers.addressPlaceholder", {
                                defaultValue: "Enter customer address",
                              })}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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
                              placeholder={t("customers.notesPlaceholder", {
                                defaultValue: "Add internal notes about this customer",
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
                      onClick={() => navigate("/customers")}
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

export default CustomerFormPage;
