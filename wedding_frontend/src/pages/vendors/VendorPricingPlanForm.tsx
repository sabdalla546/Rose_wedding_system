import { useEffect } from "react";
import { Tags } from "lucide-react";
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
  useCreateVendorPricingPlan,
  useUpdateVendorPricingPlan,
} from "@/hooks/vendors/useVendorPricingPlanMutations";
import { useVendorPricingPlan } from "@/hooks/vendors/useVendorPricingPlans";

import { VENDOR_TYPE_OPTIONS } from "./adapters";
import type { VendorPricingPlanFormData, VendorType } from "./types";

const isNonNegativeInteger = (value: string) => /^\d+$/.test(value.trim());
const isNonNegativeNumber = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && parsed >= 0;
};

const vendorPricingPlanSchema = z
  .object({
    vendorType: z.enum(
      VENDOR_TYPE_OPTIONS.map((option) => option.value) as [
        VendorType,
        ...VendorType[],
      ],
    ),
    name: z.string().min(2, "Pricing plan name is required").max(150),
    minSubServices: z
      .string()
      .min(1, "Minimum sub-services is required")
      .refine(isNonNegativeInteger, "Minimum sub-services must be 0 or greater"),
    maxSubServices: z
      .string()
      .optional()
      .refine(
        (value) => !value?.trim() || isNonNegativeInteger(value),
        "Maximum sub-services must be blank or 0 or greater",
      ),
    price: z
      .string()
      .min(1, "Price is required")
      .refine(isNonNegativeNumber, "Price must be 0 or greater"),
    notes: z.string().optional(),
    isActive: z.boolean().default(true),
  })
  .refine(
    (values) =>
      !values.maxSubServices?.trim() ||
      Number(values.maxSubServices) >= Number(values.minSubServices),
    {
      message:
        "Maximum sub-services must be greater than or equal to minimum sub-services",
      path: ["maxSubServices"],
    },
  );

type VendorPricingPlanFormValues = z.infer<typeof vendorPricingPlanSchema>;

const sectionTitleClass = "text-lg font-semibold text-[var(--lux-heading)]";
const sectionHintClass = "text-sm text-[var(--lux-text-secondary)]";

const VendorPricingPlanFormPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const { data: pricingPlan, isLoading: pricingPlanLoading } =
    useVendorPricingPlan(id);
  const createMutation = useCreateVendorPricingPlan();
  const updateMutation = useUpdateVendorPricingPlan(id);

  const form = useForm<VendorPricingPlanFormValues>({
    resolver: zodResolver(vendorPricingPlanSchema) as any,
    defaultValues: {
      vendorType: "other",
      name: "",
      minSubServices: "0",
      maxSubServices: "",
      price: "0",
      notes: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (!isEditMode || !pricingPlan) {
      return;
    }

    form.reset({
      vendorType: pricingPlan.vendorType,
      name: pricingPlan.name,
      minSubServices: String(pricingPlan.minSubServices),
      maxSubServices:
        pricingPlan.maxSubServices === null ||
        typeof pricingPlan.maxSubServices === "undefined"
          ? ""
          : String(pricingPlan.maxSubServices),
      price: String(pricingPlan.price),
      notes: pricingPlan.notes ?? "",
      isActive: pricingPlan.isActive,
    });
  }, [form, isEditMode, pricingPlan]);

  const onSubmit: SubmitHandler<VendorPricingPlanFormValues> = (values) => {
    const payload: VendorPricingPlanFormData = values;

    if (isEditMode) {
      updateMutation.mutate(payload);
      return;
    }

    createMutation.mutate(payload);
  };

  const isBusy =
    pricingPlanLoading || createMutation.isPending || updateMutation.isPending;

  if (pricingPlanLoading) {
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
            onClick={() => navigate("/settings/vendors/pricing-plans")}
            className="inline-flex items-center gap-2 text-sm text-[var(--lux-text-secondary)] transition-colors hover:text-[var(--lux-gold)]"
          >
            {"<-"}{" "}
            {t("vendors.pricingPlans.back", {
              defaultValue: "Back to Vendor Pricing Plans",
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
                <Tags className="h-6 w-6" />
              </div>

              <div className="space-y-1">
                <h1 className="text-xl font-bold text-[var(--lux-heading)]">
                  {isEditMode
                    ? t("vendors.pricingPlans.editTitle", {
                        defaultValue: "Edit Vendor Pricing Plan",
                      })
                    : t("vendors.pricingPlans.createTitle", {
                        defaultValue: "Create Vendor Pricing Plan",
                      })}
                </h1>
                <p className="text-sm text-[var(--lux-text-secondary)]">
                  {isEditMode
                    ? t("vendors.pricingPlans.editDescription", {
                        defaultValue:
                          "Update vendor-type pricing thresholds and active status without changing any event vendor rows.",
                      })
                    : t("vendors.pricingPlans.createDescription", {
                        defaultValue:
                          "Create a vendor-type pricing plan based on the number of selected sub-services for future phases.",
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
                        {t("vendors.pricingPlans.basicHint", {
                          defaultValue:
                            "Capture the vendor type, pricing plan name, and sub-service count thresholds.",
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
                              {t("vendors.pricingPlans.name", {
                                defaultValue: "Plan Name",
                              })}
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder={t(
                                  "vendors.pricingPlans.namePlaceholder",
                                  {
                                    defaultValue: "Enter pricing plan name",
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
                        name="vendorType"
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

                      <FormField
                        control={form.control}
                        name="minSubServices"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("vendors.pricingPlans.minSubServices", {
                                defaultValue: "Minimum Sub Services",
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
                        name="maxSubServices"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("vendors.pricingPlans.maxSubServices", {
                                defaultValue: "Maximum Sub Services",
                              })}
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                min="0"
                                inputMode="numeric"
                                placeholder={t(
                                  "vendors.pricingPlans.maxPlaceholder",
                                  {
                                    defaultValue: "Leave blank for open-ended",
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
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("vendors.pricingPlans.price", {
                                defaultValue: "Price",
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
                              placeholder={t(
                                "vendors.pricingPlans.notesPlaceholder",
                                {
                                  defaultValue:
                                    "Add optional notes about inclusions, thresholds, or internal pricing guidance...",
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
                          {t("vendors.pricingPlans.activeLabel", {
                            defaultValue: "Pricing plan is active",
                          })}
                        </p>
                        <p className="text-xs text-[var(--lux-text-secondary)]">
                          {t("vendors.pricingPlans.activeHint", {
                            defaultValue:
                              "Inactive plans remain available for reference but are excluded from future pricing selection logic.",
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
                      onClick={() => navigate("/settings/vendors/pricing-plans")}
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

export default VendorPricingPlanFormPage;
