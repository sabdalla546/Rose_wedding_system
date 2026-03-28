import { useEffect } from "react";
import { PackageOpen } from "lucide-react";
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
  useCreateService,
  useUpdateService,
} from "@/hooks/services/useServiceMutations";
import { useService } from "@/hooks/services/useServices";

import { SERVICE_CATEGORY_OPTIONS } from "./adapters";
import type { ServiceCategory, ServiceFormData } from "./types";

const serviceSchema = z.object({
  name: z.string().min(2, "Service name is required").max(150),
  code: z.string().max(50).optional(),
  category: z.enum(
    SERVICE_CATEGORY_OPTIONS.map((option) => option.value) as [
      ServiceCategory,
      ...ServiceCategory[],
    ],
  ),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

const ServiceFormPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const { data: service, isLoading: serviceLoading } = useService(id);
  const createMutation = useCreateService();
  const updateMutation = useUpdateService(id);

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: "",
      code: "",
      category: "other",
      description: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (!isEditMode || !service) {
      return;
    }

    form.reset({
      name: service.name,
      code: service.code ?? "",
      category: service.category,
      description: service.description ?? "",
      isActive: service.isActive,
    });
  }, [form, isEditMode, service]);

  const onSubmit: SubmitHandler<ServiceFormValues> = (values) => {
    const payload: ServiceFormData = values;

    if (isEditMode) {
      updateMutation.mutate(payload);
      return;
    }

    createMutation.mutate(payload);
  };

  const isBusy =
    serviceLoading || createMutation.isPending || updateMutation.isPending;
  const isActive = useWatch({ control: form.control, name: "isActive" });

  if (serviceLoading) {
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
      permission={isEditMode ? "services.update" : "services.create"}
    >
      <CrudPageLayout>
        <div dir={i18n.dir()}>
          <CrudFormLayout
            icon={<PackageOpen className="h-5 w-5 text-primary" />}
            title={
              isEditMode
                ? t("services.editTitle", { defaultValue: "Edit Service" })
                : t("services.createTitle", { defaultValue: "Create Service" })
            }
            description={
              isEditMode
                ? t("services.editDescription", {
                    defaultValue:
                      "Update the catalog name, category, notes, and active status.",
                  })
                : t("services.createDescription", {
                    defaultValue:
                      "Create a simple catalog service that can be linked to event services and quotations.",
                  })
            }
            backAction={
              <button
                type="button"
                onClick={() => navigate("/settings/services")}
                className="crud-header-back"
              >
                <span aria-hidden="true">←</span>
                {t("services.backToServices", {
                  defaultValue: "Back to Services",
                })}
              </button>
            }
          >
            <div className="p-6 md:p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <CrudFormSection
                    title={t("services.basicInformation", {
                      defaultValue: "Basic Information",
                    })}
                    description={t("services.basicInformationHint", {
                      defaultValue:
                        "Capture the catalog name, optional code, and category used across the system.",
                    })}
                  >
                    <div className="crud-form-grid md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("services.name", { defaultValue: "Service Name" })}
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder={t("services.namePlaceholder", {
                                  defaultValue: "Enter service name",
                                })}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("services.code", { defaultValue: "Code" })}
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder={t("services.codePlaceholder", {
                                  defaultValue: "Enter internal service code",
                                })}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("services.categoryLabel", {
                                defaultValue: "Service Category",
                              })}
                            </FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue
                                    placeholder={t("services.selectCategory", {
                                      defaultValue: "Select service category",
                                    })}
                                  />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {SERVICE_CATEGORY_OPTIONS.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {t(`services.category.${option.value}`, {
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
                              className="app-textarea min-h-[140px]"
                              placeholder={t("services.descriptionPlaceholder", {
                                defaultValue:
                                  "Add service scope, inclusions, or internal planning notes...",
                              })}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CrudFormSection>

                  <CrudFormSection
                    title={t("services.statusSection", {
                      defaultValue: "Status",
                    })}
                  >
                    <label
                      className="form-status-card"
                    >
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
                          {t("services.activeLabel", {
                            defaultValue: "Service is active",
                          })}
                        </p>
                        <p className="text-xs text-[var(--lux-text-secondary)]">
                          {t("services.activeHint", {
                            defaultValue:
                              "Inactive services stay in the catalog but are unavailable for new event service links.",
                          })}
                        </p>
                      </div>
                    </label>
                  </CrudFormSection>

                  <CrudActionsBar>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/settings/services")}
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

export default ServiceFormPage;
