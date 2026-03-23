import { useEffect } from "react";
import { PackageOpen } from "lucide-react";
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

const sectionTitleClass = "text-lg font-semibold text-[var(--lux-heading)]";
const sectionHintClass = "text-sm text-[var(--lux-text-secondary)]";

const ServiceFormPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const { data: service, isLoading: serviceLoading } = useService(id);
  const createMutation = useCreateService();
  const updateMutation = useUpdateService(id);

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema) as any,
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
      <PageContainer className="pb-4 pt-4 text-foreground">
        <div dir={i18n.dir()} className="mx-auto w-full max-w-5xl space-y-6">
          <button
            type="button"
            onClick={() => navigate("/settings/services")}
            className="inline-flex items-center gap-2 text-sm text-[var(--lux-text-secondary)] transition-colors hover:text-[var(--lux-gold)]"
          >
            {"<-"}{" "}
            {t("services.backToServices", {
              defaultValue: "Back to Services",
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
                <PackageOpen className="h-6 w-6" />
              </div>

              <div className="space-y-1">
                <h1 className="text-xl font-bold text-[var(--lux-heading)]">
                  {isEditMode
                    ? t("services.editTitle", { defaultValue: "Edit Service" })
                    : t("services.createTitle", {
                        defaultValue: "Create Service",
                      })}
                </h1>
                <p className="text-sm text-[var(--lux-text-secondary)]">
                  {isEditMode
                    ? t("services.editDescription", {
                        defaultValue:
                          "Update the catalog name, category, notes, and active status.",
                      })
                    : t("services.createDescription", {
                        defaultValue:
                          "Create a simple catalog service that can be linked to event services and quotations.",
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
                        {t("services.basicInformation", {
                          defaultValue: "Basic Information",
                        })}
                      </h2>
                      <p className={sectionHintClass}>
                        {t("services.basicInformationHint", {
                          defaultValue:
                            "Capture the catalog name, optional code, and category used across the system.",
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
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
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
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
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
                              className="min-h-[140px] w-full rounded-[22px] border px-4 py-3 text-sm text-[var(--lux-text)] placeholder:text-[var(--lux-text-muted)] outline-none transition-all focus:border-[var(--lux-gold-border)] focus:ring-2 focus:ring-[var(--lux-gold-glow)]"
                              placeholder={t("services.descriptionPlaceholder", {
                                defaultValue:
                                  "Add service scope, inclusions, or internal planning notes...",
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

                  <section className="space-y-4">
                    <div
                      className="border-b pb-3"
                      style={{ borderColor: "var(--lux-row-border)" }}
                    >
                      <h2 className={sectionTitleClass}>
                        {t("services.statusSection", {
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
                  </section>

                  <div
                    className="flex flex-col justify-end gap-3 pt-6 sm:flex-row"
                    style={{ borderTop: "1px solid var(--lux-row-border)" }}
                  >
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

export default ServiceFormPage;
