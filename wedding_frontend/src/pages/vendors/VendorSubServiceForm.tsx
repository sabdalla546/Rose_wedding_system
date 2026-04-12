import { useEffect } from "react";
import { ClipboardList } from "lucide-react";
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
  useCreateVendorSubService,
  useUpdateVendorSubService,
} from "@/hooks/vendors/useVendorSubServiceMutations";
import { useVendorSubService } from "@/hooks/vendors/useVendorSubServices";
import { useVendors } from "@/hooks/vendors/useVendors";

import { formatVendorType } from "./adapters";
import type { VendorSubServiceFormData } from "./types";

const isNonNegativeInteger = (value: string) => /^\d+$/.test(value.trim());

const vendorSubServiceSchema = z.object({
  vendorId: z.string().min(1, "Vendor is required"),
  name: z.string().min(2, "Sub-service name is required").max(150),
  code: z.string().max(50).optional(),
  description: z.string().optional(),
  sortOrder: z
    .string()
    .min(1, "Sort order is required")
    .refine(isNonNegativeInteger, "Sort order must be 0 or greater"),
  price: z
    .string()
    .min(1, "Price is required")
    .refine((value) => {
      const parsed = Number(value);
      return !Number.isNaN(parsed) && parsed >= 0;
    }, "Price must be zero or greater"),
  isActive: z.boolean().default(true),
});

type VendorSubServiceFormValues = z.infer<typeof vendorSubServiceSchema>;

const sectionTitleClass = "text-lg font-semibold text-[var(--lux-heading)]";
const sectionHintClass = "text-sm text-[var(--lux-text-secondary)]";

const VendorSubServiceFormPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const { data: subService, isLoading: subServiceLoading } = useVendorSubService(id);
  const { data: vendorsResponse, isLoading: vendorsLoading } = useVendors({
    currentPage: 1,
    itemsPerPage: 200,
    searchQuery: "",
    type: "all",
    isActive: "all",
  });
  const createMutation = useCreateVendorSubService();
  const updateMutation = useUpdateVendorSubService(id);
  const vendors = vendorsResponse?.data ?? [];

  const form = useForm<VendorSubServiceFormValues>({
    resolver: zodResolver(vendorSubServiceSchema) as any,
    defaultValues: {
      vendorId: "",
      name: "",
      code: "",
      description: "",
      sortOrder: "0",
      price: "0",
      isActive: true,
    },
  });

  useEffect(() => {
    if (!isEditMode || !subService) {
      return;
    }

    form.reset({
      vendorId: subService.vendorId ? String(subService.vendorId) : "",
      name: subService.name,
      code: subService.code ?? "",
      description: subService.description ?? "",
      sortOrder: String(subService.sortOrder),
      price:
        subService.price !== null && typeof subService.price !== "undefined"
          ? String(subService.price)
          : "0",
      isActive: subService.isActive,
    });
  }, [form, isEditMode, subService]);

  const selectedVendor =
    vendors.find((vendor) => String(vendor.id) === form.watch("vendorId")) ??
    null;

  const onSubmit: SubmitHandler<VendorSubServiceFormValues> = (values) => {
    const payload: VendorSubServiceFormData = {
      ...values,
      price: String(Number(values.price)),
      vendorType: selectedVendor?.type,
    };

    if (isEditMode) {
      updateMutation.mutate(payload);
      return;
    }

    createMutation.mutate(payload);
  };

  const isBusy =
    subServiceLoading ||
    vendorsLoading ||
    createMutation.isPending ||
    updateMutation.isPending;

  if (subServiceLoading) {
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
            onClick={() => navigate("/settings/vendors/sub-services")}
            className="inline-flex items-center gap-2 text-sm text-[var(--lux-text-secondary)] transition-colors hover:text-[var(--lux-gold)]"
          >
            {"<-"}{" "}
            {t("vendors.subServices.back", {
              defaultValue: "Back to Vendor Sub Services",
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
                <ClipboardList className="h-6 w-6" />
              </div>

              <div className="space-y-1">
                <h1 className="text-xl font-bold text-[var(--lux-heading)]">
                  {isEditMode
                    ? t("vendors.subServices.editTitle", {
                        defaultValue: "Edit Vendor Sub Service",
                      })
                    : t("vendors.subServices.createTitle", {
                        defaultValue: "Create Vendor Sub Service",
                      })}
                </h1>
                <p className="text-sm text-[var(--lux-text-secondary)]">
                  {isEditMode
                    ? t("vendors.subServices.editDescription", {
                        defaultValue:
                          "Update reusable vendor checklist options and ordering.",
                      })
                    : t("vendors.subServices.createDescription", {
                        defaultValue:
                          "Create a reusable checklist option under a specific vendor.",
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
                        {t("vendors.subServices.basicHint", {
                          defaultValue:
                            "Capture the reusable checklist label, linked vendor, and optional code used in master data.",
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
                              {t("vendors.subServices.name", {
                                defaultValue: "Sub Service Name",
                              })}
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder={t(
                                  "vendors.subServices.namePlaceholder",
                                  {
                                    defaultValue: "Enter sub-service name",
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
                        name="vendorId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("vendors.vendorSelection", {
                                defaultValue: "Vendor",
                              })}
                            </FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue
                                    placeholder={t("vendors.selectVendor", {
                                      defaultValue: "Select vendor",
                                    })}
                                  />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {vendors.map((vendor) => (
                                  <SelectItem key={vendor.id} value={String(vendor.id)}>
                                    {vendor.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[var(--lux-text)]">
                          {t("vendors.typeLabel", {
                            defaultValue: "Vendor Type",
                          })}
                        </label>
                        <Input
                          value={
                            selectedVendor
                              ? t(`vendors.type.${selectedVendor.type}`, {
                                  defaultValue: formatVendorType(
                                    selectedVendor.type,
                                  ),
                                })
                              : ""
                          }
                          placeholder={t("vendors.selectVendorFirst", {
                            defaultValue: "Select a vendor first",
                          })}
                          readOnly
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("vendors.subServices.code", {
                                defaultValue: "Code",
                              })}
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder={t(
                                  "vendors.subServices.codePlaceholder",
                                  {
                                    defaultValue: "Enter optional short code",
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
                        name="sortOrder"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("vendors.subServices.sortOrder", {
                                defaultValue: "Sort Order",
                              })}
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                min="0"
                                inputMode="numeric"
                                placeholder="0"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("vendors.subServices.price", {
                                defaultValue: "List Price",
                              })}
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                min="0"
                                step="0.001"
                                inputMode="decimal"
                                placeholder="0.000"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("services.description", {
                              defaultValue: "Description",
                            })}
                          </FormLabel>
                          <FormControl>
                            <textarea
                              {...field}
                              className="min-h-[140px] w-full rounded-[22px] border px-4 py-3 text-sm text-[var(--lux-text)] placeholder:text-[var(--lux-text-muted)] outline-none transition-all focus:border-[var(--lux-gold-border)] focus:ring-2 focus:ring-[var(--lux-gold-glow)]"
                              placeholder={t(
                                "vendors.subServices.descriptionPlaceholder",
                                {
                                  defaultValue:
                                    "Add optional usage notes or clarifying details...",
                                },
                              )}
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

                  <section className="space-y-4">
                    <div
                      className="border-b pb-3"
                      style={{ borderColor: "var(--lux-row-border)" }}
                    >
                      <h2 className={sectionTitleClass}>
                        {t("vendors.statusSection", {
                          defaultValue: "Status",
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
                          {t("vendors.subServices.activeLabel", {
                            defaultValue: "Sub service is active",
                          })}
                        </p>
                        <p className="text-xs text-[var(--lux-text-secondary)]">
                          {t("vendors.subServices.activeHint", {
                            defaultValue:
                              "Inactive options stay in master data but are hidden from future selections.",
                          })}
                        </p>
                      </div>
                    </label>
                  </section>

                  <div
                    className="flex flex-col justify-end gap-3 pt-6 sm:flex-row"
                    style={{ borderTop: "1px solid var(--lux-row-border)" }}
                  >
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/settings/vendors/sub-services")}
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

export default VendorSubServiceFormPage;
