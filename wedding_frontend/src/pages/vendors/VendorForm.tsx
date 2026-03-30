import { useEffect, useMemo } from "react";
import { Handshake } from "lucide-react";
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
import { useVendorTypes } from "@/hooks/vendors/useVendorTypes";
import { useVendor } from "@/hooks/vendors/useVendors";

import { getVendorTypeName } from "./adapters";
import type { VendorFormData } from "./types";

const VendorFormPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const language = i18n.resolvedLanguage ?? "en";
  const vendorSchema = useMemo(
    () =>
      z.object({
        name: z
          .string()
          .min(
            2,
            t("vendors.validation.nameRequired", {
              defaultValue: "Vendor name is required",
            }),
          )
          .max(150),
        typeId: z.string().min(
          1,
          t("vendors.validation.typeRequired", {
            defaultValue: "Vendor type is required",
          }),
        ),
        contactPerson: z.string().max(150).optional(),
        phone: z.string().max(30).optional(),
        phone2: z.string().max(30).optional(),
        email: z.union([
          z.literal(""),
          z.string().email(
            t("vendors.validation.emailInvalid", {
              defaultValue: "Invalid email address",
            }),
          ),
        ]),
        address: z.string().max(255).optional(),
        notes: z.string().optional(),
        isActive: z.boolean(),
      }),
    [t],
  );

  type VendorFormValues = z.infer<typeof vendorSchema>;

  const { data: vendor, isLoading: vendorLoading } = useVendor(id);
  const { data: vendorTypesResponse, isLoading: vendorTypesLoading } =
    useVendorTypes({
      currentPage: 1,
      itemsPerPage: 200,
      searchQuery: "",
      isActive: isEditMode ? "all" : "true",
      activeOnly: !isEditMode,
    });
  const createMutation = useCreateVendor();
  const updateMutation = useUpdateVendor(id);

  const vendorTypeOptions = useMemo(
    () => vendorTypesResponse?.data ?? [],
    [vendorTypesResponse],
  );

  const form = useForm<VendorFormValues>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      name: "",
      typeId: "",
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

    const selectedVendorType =
      vendorTypeOptions.find((option) => option.id === vendor.typeId) ??
      vendorTypeOptions.find((option) => option.slug === vendor.type);

    form.reset({
      name: vendor.name ?? "",
      typeId: selectedVendorType ? String(selectedVendorType.id) : "",
      contactPerson: vendor.contactPerson ?? "",
      phone: vendor.phone ?? "",
      phone2: vendor.phone2 ?? "",
      email: vendor.email ?? "",
      address: vendor.address ?? "",
      notes: vendor.notes ?? "",
      isActive: vendor.isActive,
    });
  }, [form, isEditMode, vendor, vendorTypeOptions]);

  const selectedTypeId = useWatch({ control: form.control, name: "typeId" });
  const selectedVendorType = useMemo(
    () =>
      vendorTypeOptions.find((option) => String(option.id) === String(selectedTypeId)),
    [selectedTypeId, vendorTypeOptions],
  );

  const onSubmit: SubmitHandler<VendorFormValues> = (values) => {
    const payload: VendorFormData = {
      ...values,
      typeId: Number(values.typeId),
      type: selectedVendorType?.slug ?? vendor?.type,
    };

    if (isEditMode) {
      updateMutation.mutate(payload);
      return;
    }

    createMutation.mutate(payload);
  };

  const isBusy =
    vendorLoading || createMutation.isPending || updateMutation.isPending;
  const isActive = useWatch({ control: form.control, name: "isActive" });
  const hasVendorTypes = vendorTypeOptions.length > 0;

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
      <CrudPageLayout>
        <div dir={i18n.dir()}>
          <CrudFormLayout
            icon={<Handshake className="h-5 w-5 text-primary" />}
            title={
              isEditMode
                ? t("vendors.editTitle", { defaultValue: "Edit Vendor" })
                : t("vendors.createTitle", { defaultValue: "Create Vendor" })
            }
            description={
              isEditMode
                ? t("vendors.editDescription", {
                    defaultValue:
                      "Update vendor details, contact data, and status.",
                  })
                : t("vendors.createDescription", {
                    defaultValue:
                      "Create a vendor catalog record for event partners and external providers.",
                  })
            }
            backAction={
              <button
                type="button"
                onClick={() => navigate("/settings/vendors")}
                className="crud-header-back"
              >
                <span aria-hidden="true">â†</span>
                {t("vendors.backToVendors", { defaultValue: "Back to Vendors" })}
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
                    title={t("vendors.basicInformation", {
                      defaultValue: "Basic Information",
                    })}
                    description={t("vendors.basicInformationHint", {
                      defaultValue:
                        "Capture the core vendor information and service type.",
                    })}
                  >
                    <div className="crud-form-grid md:grid-cols-2">
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
                        name="typeId"
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
                              disabled={vendorTypesLoading || !hasVendorTypes}
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
                                {vendorTypeOptions.map((option) => (
                                  <SelectItem key={option.id} value={String(option.id)}>
                                    {getVendorTypeName({
                                      slug: option.slug,
                                      vendorType: option,
                                      language,
                                    })}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {!hasVendorTypes ? (
                              <p className="text-xs text-[var(--lux-text-secondary)]">
                                {t("vendors.types.emptyHint", {
                                  defaultValue:
                                    "Create at least one active vendor type before creating vendors.",
                                })}
                              </p>
                            ) : null}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CrudFormSection>

                  <CrudFormSection
                    title={t("vendors.contactSection", {
                      defaultValue: "Contact Details",
                    })}
                    description={t("vendors.contactSectionHint", {
                      defaultValue:
                        "Save the main contact points for the vendor team.",
                    })}
                  >
                    <div className="crud-form-grid md:grid-cols-2">
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
                                placeholder={t("vendors.contactPersonPlaceholder", {
                                  defaultValue: "Enter contact person name",
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
                              {t("vendors.email", { defaultValue: "Email" })}
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                {...field}
                                placeholder={t("vendors.emailPlaceholder", {
                                  defaultValue: "vendor@example.com",
                                })}
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
                  </CrudFormSection>

                  <CrudFormSection
                    title={t("vendors.statusSection", {
                      defaultValue: "Status & Notes",
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
                              className="app-textarea"
                              placeholder={t("vendors.notesPlaceholder", {
                                defaultValue:
                                  "Add service notes, operating details, or internal remarks...",
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
                      onClick={() => navigate("/settings/vendors")}
                      disabled={isBusy}
                    >
                      {t("common.cancel", { defaultValue: "Cancel" })}
                    </Button>

                    <Button
                      type="submit"
                      disabled={isBusy || vendorTypesLoading || !hasVendorTypes}
                    >
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

export default VendorFormPage;
