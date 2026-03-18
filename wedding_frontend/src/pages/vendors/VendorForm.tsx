import { useEffect } from "react";
import { Handshake } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateVendor,
  useUpdateVendor,
} from "@/hooks/vendors/useVendorMutations";
import { useVendor } from "@/hooks/vendors/useVendors";

import { VENDOR_TYPE_OPTIONS } from "./adapters";
import type { VendorFormData, VendorType } from "./types";

const vendorSchema = z.object({
  name: z.string().min(2, "Vendor name is required").max(150),
  type: z.enum(
    VENDOR_TYPE_OPTIONS.map((option) => option.value) as [
      VendorType,
      ...VendorType[],
    ],
  ),
  contactPerson: z.string().max(150).optional(),
  phone: z.string().max(30).optional(),
  phone2: z.string().max(30).optional(),
  email: z.union([z.literal(""), z.string().email("Invalid email address")]),
  address: z.string().max(255).optional(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

type VendorFormValues = z.infer<typeof vendorSchema>;

const sectionTitleClass = "text-lg font-semibold text-[var(--lux-heading)]";
const sectionHintClass = "text-sm text-[var(--lux-text-secondary)]";

const VendorFormPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const { data: vendor, isLoading: vendorLoading } = useVendor(id);
  const createMutation = useCreateVendor();
  const updateMutation = useUpdateVendor(id);

  const form = useForm<VendorFormValues>({
    resolver: zodResolver(vendorSchema) as any,
    defaultValues: {
      name: "",
      type: "other",
      contactPerson: "",
      phone: "",
      phone2: "",
      email: "",
      address: "",
      notes: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (!isEditMode || !vendor) {
      return;
    }

    form.reset({
      name: vendor.name,
      type: vendor.type,
      contactPerson: vendor.contactPerson ?? "",
      phone: vendor.phone ?? "",
      phone2: vendor.phone2 ?? "",
      email: vendor.email ?? "",
      address: vendor.address ?? "",
      notes: vendor.notes ?? "",
      isActive: vendor.isActive,
    });
  }, [form, isEditMode, vendor]);

  const onSubmit: SubmitHandler<VendorFormValues> = (values) => {
    const payload: VendorFormData = values;

    if (isEditMode) {
      updateMutation.mutate(payload);
      return;
    }

    createMutation.mutate(payload);
  };

  const isBusy =
    vendorLoading || createMutation.isPending || updateMutation.isPending;

  if (vendorLoading) {
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
      permission={isEditMode ? "vendors.update" : "vendors.create"}
    >
      <PageContainer className="pb-4 pt-4 text-foreground">
        <div dir={i18n.dir()} className="mx-auto w-full max-w-5xl space-y-6">
          <button
            type="button"
            onClick={() => navigate("/settings/vendors")}
            className="inline-flex items-center gap-2 text-sm text-[var(--lux-text-secondary)] transition-colors hover:text-[var(--lux-gold)]"
          >
            {"<-"}{" "}
            {t("vendors.backToVendors", { defaultValue: "Back to Vendors" })}
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
                <Handshake className="h-6 w-6" />
              </div>

              <div className="space-y-1">
                <h1 className="text-xl font-bold text-[var(--lux-heading)]">
                  {isEditMode
                    ? t("vendors.editTitle", { defaultValue: "Edit Vendor" })
                    : t("vendors.createTitle", {
                        defaultValue: "Create Vendor",
                      })}
                </h1>
                <p className="text-sm text-[var(--lux-text-secondary)]">
                  {isEditMode
                    ? t("vendors.editDescription", {
                        defaultValue:
                          "Update vendor details, contact data, and status.",
                      })
                    : t("vendors.createDescription", {
                        defaultValue:
                          "Create a vendor catalog record for event partners and external providers.",
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
                        {t("vendors.basicInformation", {
                          defaultValue: "Basic Information",
                        })}
                      </h2>
                      <p className={sectionHintClass}>
                        {t("vendors.basicInformationHint", {
                          defaultValue:
                            "Capture the core vendor information and service type.",
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
                              {t("vendors.name", { defaultValue: "Vendor Name" })}
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder={t("vendors.namePlaceholder", {
                                  defaultValue: "Enter vendor or company name",
                                })}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("vendors.typeLabel", {
                                defaultValue: "Vendor Type",
                              })}
                            </FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue
                                    placeholder={t("vendors.selectType", {
                                      defaultValue: "Select vendor type",
                                    })}
                                  />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {VENDOR_TYPE_OPTIONS.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {t(`vendors.type.${option.value}`, {
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
                  </section>

                  <section className="space-y-4">
                    <div
                      className="border-b pb-3"
                      style={{ borderColor: "var(--lux-row-border)" }}
                    >
                      <h2 className={sectionTitleClass}>
                        {t("vendors.contactSection", {
                          defaultValue: "Contact Details",
                        })}
                      </h2>
                      <p className={sectionHintClass}>
                        {t("vendors.contactSectionHint", {
                          defaultValue:
                            "Save the main contact points for the vendor team.",
                        })}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="contactPerson"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("vendors.contactPerson", {
                                defaultValue: "Contact Person",
                              })}
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder={t(
                                  "vendors.contactPersonPlaceholder",
                                  {
                                    defaultValue: "Enter contact person name",
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
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("vendors.email", { defaultValue: "Email" })}
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                {...field}
                                placeholder="vendor@example.com"
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
                              {t("vendors.phone", {
                                defaultValue: "Primary Phone",
                              })}
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder={t("vendors.phonePlaceholder", {
                                  defaultValue: "Enter primary phone number",
                                })}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone2"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("vendors.phone2", {
                                defaultValue: "Secondary Phone",
                              })}
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder={t("vendors.phone2Placeholder", {
                                  defaultValue: "Enter backup phone number",
                                })}
                              />
                            </FormControl>
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
                            {t("vendors.address", { defaultValue: "Address" })}
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder={t("vendors.addressPlaceholder", {
                                defaultValue: "Enter company address",
                              })}
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
                        {t("vendors.statusSection", {
                          defaultValue: "Status & Notes",
                        })}
                      </h2>
                    </div>

                    <label
                      className="flex items-center gap-3 rounded-[20px] border p-4"
                      style={{
                        background: "var(--lux-control-hover)",
                        borderColor: "var(--lux-row-border)",
                      }}
                    >
                      <Checkbox
                        checked={form.watch("isActive")}
                        onCheckedChange={(checked: CheckedState) =>
                          form.setValue("isActive", Boolean(checked), {
                            shouldDirty: true,
                          })
                        }
                      />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-[var(--lux-text)]">
                          {t("vendors.activeLabel", {
                            defaultValue: "Vendor is active",
                          })}
                        </p>
                        <p className="text-xs text-[var(--lux-text-secondary)]">
                          {t("vendors.activeHint", {
                            defaultValue:
                              "Inactive vendors stay in the catalog but are marked as unavailable.",
                          })}
                        </p>
                      </div>
                    </label>

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
                              placeholder={t("vendors.notesPlaceholder", {
                                defaultValue:
                                  "Add service notes, operating details, or internal remarks...",
                              })}
                              style={{
                                background: "var(--lux-control-surface)",
                                borderColor: "var(--lux-control-border)",
                                boxShadow:
                                  "inset 0 1px 0 rgba(255,255,255,0.02)",
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
                      onClick={() => navigate("/settings/vendors")}
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

export default VendorFormPage;
