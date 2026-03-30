import { useEffect } from "react";
import { Tags } from "lucide-react";
import { useForm, useWatch, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import type { CheckedState } from "@radix-ui/react-checkbox";

import {
  CrudActionsBar,
  CrudFormLayout,
  CrudFormSection,
  CrudPageLayout,
} from "@/components/shared/crud-layout";
import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import { Button } from "@/components/ui/button";
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
  useCreateVendorType,
  useUpdateVendorType,
} from "@/hooks/vendors/useVendorTypeMutations";
import { useVendorType } from "@/hooks/vendors/useVendorTypes";

import type { VendorTypeFormData } from "./types";

const vendorTypeSchema = z.object({
  name: z.string().min(1, "Name is required").max(150),
  nameAr: z.string().min(1, "Arabic name is required").max(150),
  slug: z.string().max(150).optional(),
  sortOrder: z.coerce.number().int().min(0),
  isActive: z.boolean(),
});

type VendorTypeFormValues = z.infer<typeof vendorTypeSchema>;
type VendorTypeFormInput = z.input<typeof vendorTypeSchema>;

const VendorTypeFormPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const { data: vendorType, isLoading: vendorTypeLoading } = useVendorType(id);
  const createMutation = useCreateVendorType();
  const updateMutation = useUpdateVendorType(id);

  const form = useForm<VendorTypeFormInput, unknown, VendorTypeFormValues>({
    resolver: zodResolver(vendorTypeSchema),
    defaultValues: {
      name: "",
      nameAr: "",
      slug: "",
      sortOrder: 0,
      isActive: true,
    },
  });

  useEffect(() => {
    if (!isEditMode || !vendorType) {
      return;
    }

    form.reset({
      name: vendorType.name,
      nameAr: vendorType.nameAr,
      slug: vendorType.slug,
      sortOrder: vendorType.sortOrder,
      isActive: vendorType.isActive,
    });
  }, [form, isEditMode, vendorType]);

  const onSubmit: SubmitHandler<VendorTypeFormValues> = (values) => {
    const payload: VendorTypeFormData = values;

    if (isEditMode) {
      updateMutation.mutate(payload);
      return;
    }

    createMutation.mutate(payload);
  };

  const isBusy =
    vendorTypeLoading || createMutation.isPending || updateMutation.isPending;
  const isActive = useWatch({ control: form.control, name: "isActive" });

  if (vendorTypeLoading) {
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
      <CrudPageLayout>
        <div dir={i18n.dir()}>
          <CrudFormLayout
            icon={<Tags className="h-5 w-5 text-primary" />}
            title={
              isEditMode
                ? t("vendors.types.editTitle", {
                    defaultValue: "Edit Vendor Type",
                  })
                : t("vendors.types.createTitle", {
                    defaultValue: "Create Vendor Type",
                  })
            }
            description={
              isEditMode
                ? t("vendors.types.editDescription", {
                    defaultValue:
                      "Update the vendor type names, slug, ordering, and active status.",
                  })
                : t("vendors.types.createDescription", {
                    defaultValue:
                      "Create a reusable vendor type for vendor master data.",
                  })
            }
            backAction={
              <button
                type="button"
                onClick={() => navigate("/settings/vendors/types")}
                className="crud-header-back"
              >
                <span aria-hidden="true">â†</span>
                {t("vendors.types.backToList", {
                  defaultValue: "Back to Vendor Types",
                })}
              </button>
            }
          >
            <div className="p-6 md:p-8">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-8"
                >
                  <CrudFormSection
                    title={t("vendors.types.basicInformation", {
                      defaultValue: "Basic Information",
                    })}
                    description={t("vendors.types.basicInformationHint", {
                      defaultValue:
                        "Configure the bilingual names, slug, and sort order used in vendor forms.",
                    })}
                  >
                    <div className="crud-form-grid md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("vendors.types.name", { defaultValue: "Name" })}
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder={t("vendors.types.namePlaceholder", {
                                  defaultValue: "Enter vendor type name",
                                })}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="nameAr"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("vendors.types.nameAr", {
                                defaultValue: "Arabic Name",
                              })}
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder={t("vendors.types.nameArPlaceholder", {
                                  defaultValue: "أدخل الاسم العربي",
                                })}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="slug"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("vendors.types.slug", { defaultValue: "Slug" })}
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder={t("vendors.types.slugPlaceholder", {
                                  defaultValue:
                                    "Leave blank to generate automatically",
                                })}
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
                              {t("vendors.types.sortOrder", {
                                defaultValue: "Sort Order",
                              })}
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                {...field}
                                value={
                                  typeof field.value === "number" ||
                                  typeof field.value === "string"
                                    ? field.value
                                    : 0
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CrudFormSection>

                  <CrudFormSection
                    title={t("vendors.types.statusSection", {
                      defaultValue: "Status",
                    })}
                  >
                    <label className="form-status-card">
                      <Checkbox
                        checked={isActive}
                        onCheckedChange={(checked: CheckedState) =>
                          form.setValue("isActive", Boolean(checked), {
                            shouldDirty: true,
                          })
                        }
                      />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-[var(--lux-text)]">
                          {t("vendors.types.activeLabel", {
                            defaultValue: "Vendor type is active",
                          })}
                        </p>
                        <p className="text-xs text-[var(--lux-text-secondary)]">
                          {t("vendors.types.activeHint", {
                            defaultValue:
                              "Inactive vendor types stay available for existing records but should not be used for new vendor setup.",
                          })}
                        </p>
                      </div>
                    </label>
                  </CrudFormSection>

                  <CrudActionsBar>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/settings/vendors/types")}
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

export default VendorTypeFormPage;
