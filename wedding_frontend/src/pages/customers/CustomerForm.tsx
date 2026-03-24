import { useEffect } from "react";
import { UsersRound } from "lucide-react";
import { useForm, type SubmitHandler } from "react-hook-form";
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

const customerSchema = z.object({
  fullName: z.string().min(2, "Full name is required").max(150),
  mobile: z.string().min(3, "Primary mobile is required").max(30),
  mobile2: z.string().max(30).optional(),
  email: z.union([z.literal(""), z.string().email("Invalid email address")]),
  notes: z.string().optional(),
  status: z.enum(
    CUSTOMER_STATUS_OPTIONS.map((status) => status.value) as [
      CustomerStatus,
      ...CustomerStatus[],
    ],
  ),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

const CustomerFormPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const { data: customer, isLoading } = useCustomer(id);
  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer(id);

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema) as any,
    defaultValues: {
      fullName: "",
      mobile: "",
      mobile2: "",
      email: "",
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
