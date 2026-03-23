import { useEffect } from "react";
import { UsersRound } from "lucide-react";
import { useForm, type SubmitHandler } from "react-hook-form";
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
      <PageContainer className="pb-4 pt-4 text-foreground">
        <div dir={i18n.dir()} className="mx-auto w-full max-w-4xl space-y-6">
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
                    ? t("customers.editTitle", { defaultValue: "Edit Customer" })
                    : t("customers.createTitle", {
                        defaultValue: "Create Customer",
                      })}
                </h1>
                <p className="text-sm text-[var(--lux-text-secondary)]">
                  {t("customers.basicInformationHint", {
                    defaultValue:
                      "Capture the customer master profile and contact information.",
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
                  className="space-y-6"
                >
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
                            <Input type="email" {...field} placeholder="customer@example.com" />
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
                            {t("customers.statusLabel", { defaultValue: "Status" })}
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
                        <FormLabel>{t("common.notes", { defaultValue: "Notes" })}</FormLabel>
                        <FormControl>
                          <textarea
                            {...field}
                            className="min-h-[140px] w-full rounded-[22px] border px-4 py-3 text-sm text-[var(--lux-text)] placeholder:text-[var(--lux-text-muted)] outline-none transition-all focus:border-[var(--lux-gold-border)] focus:ring-2 focus:ring-[var(--lux-gold-glow)]"
                            placeholder={t("customers.notesPlaceholder", {
                              defaultValue: "Add internal notes about this customer",
                            })}
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
