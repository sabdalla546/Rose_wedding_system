import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { ImagePlus, Package2 } from "lucide-react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import {
  CrudActionsBar,
  CrudFormLayout,
  CrudFormSection,
  CrudPageLayout,
} from "@/components/shared/crud-layout";
import { SectionCard } from "@/components/shared/section-card";
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
import { useInventoryItem } from "@/hooks/inventory/useInventory";
import {
  useCreateInventoryItem,
  useUpdateInventoryItem,
} from "@/hooks/inventory/useInventoryMutations";

import type { InventoryFormData } from "./types";

const MAX_IMAGE_SIZE_MB = 5;

const InventoryFormPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(
    null,
  );

  const inventorySchema = useMemo(
    () =>
      z.object({
        name: z
          .string()
          .trim()
          .min(
            1,
            t("inventory.validation.nameRequired", {
              defaultValue: "Product name is required",
            }),
          )
          .max(150),
        quantity: z
          .number()
          .refine(Number.isFinite, {
            message: t("inventory.validation.quantityRequired", {
              defaultValue: "Quantity is required",
            }),
          })
          .int(
            t("inventory.validation.quantityInteger", {
              defaultValue: "Quantity must be a whole number",
            }),
          )
          .min(
            0,
            t("inventory.validation.quantityMin", {
              defaultValue: "Quantity cannot be negative",
            }),
          ),
      }),
    [t],
  );
  type InventoryFormValues = z.infer<typeof inventorySchema>;

  const { data: item, isLoading } = useInventoryItem(id);
  const createMutation = useCreateInventoryItem();
  const updateMutation = useUpdateInventoryItem(id);

  const form = useForm<InventoryFormValues>({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      name: "",
      quantity: 0,
    },
  });

  useEffect(() => {
    if (!isEditMode || !item) {
      return;
    }

    form.reset({
      name: item.name ?? "",
      quantity: item.quantity ?? 0,
    });
  }, [form, isEditMode, item]);

  useEffect(() => {
    return () => {
      if (selectedImagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(selectedImagePreview);
      }
    };
  }, [selectedImagePreview]);

  const currentPreview = selectedImagePreview ?? item?.imageUrl ?? null;
  const isBusy =
    isLoading || createMutation.isPending || updateMutation.isPending;

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;

    if (selectedImagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(selectedImagePreview);
    }

    setSelectedImageFile(nextFile);
    setSelectedImagePreview(nextFile ? URL.createObjectURL(nextFile) : null);
  };

  const onSubmit: SubmitHandler<InventoryFormValues> = (values) => {
    const payload: InventoryFormData = {
      name: values.name.trim(),
      quantity: values.quantity,
      imageFile: selectedImageFile,
    };

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

  return (
    <ProtectedComponent
      permission={isEditMode ? "inventory.update" : "inventory.create"}
    >
      <CrudPageLayout>
        <div dir={i18n.dir()}>
          <CrudFormLayout
            icon={<Package2 className="h-5 w-5 text-primary" />}
            title={
              isEditMode
                ? t("inventory.editTitle", {
                    defaultValue: "Edit Inventory Item",
                  })
                : t("inventory.createTitle", {
                    defaultValue: "Create Inventory Item",
                  })
            }
            description={
              isEditMode
                ? t("inventory.editDescription", {
                    defaultValue:
                      "Update the standalone stock item name, quantity, and reference image.",
                  })
                : t("inventory.createDescription", {
                    defaultValue:
                      "Add a standalone stock item with a direct quantity and optional reference image.",
                  })
            }
            backAction={
              <button
                type="button"
                onClick={() => navigate("/inventory")}
                className="crud-header-back"
              >
                <span aria-hidden="true">{"<-"}</span>
                {t("inventory.backToInventory", {
                  defaultValue: "Back to Inventory",
                })}
              </button>
            }
          >
            <div className="p-6 md:p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <CrudFormSection
                    title={t("inventory.basicInformation", {
                      defaultValue: "Basic Information",
                    })}
                    description={t("inventory.basicInformationHint", {
                      defaultValue:
                        "Capture the product name and the current on-hand quantity for this standalone catalog item.",
                    })}
                  >
                    <div className="crud-form-grid md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("inventory.name", {
                                defaultValue: "Product Name",
                              })}
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder={t("inventory.namePlaceholder", {
                                  defaultValue: "Enter product name",
                                })}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("inventory.quantity", {
                                defaultValue: "Quantity",
                              })}
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                min={0}
                                step={1}
                                inputMode="numeric"
                                value={field.value ?? 0}
                                onChange={(event) =>
                                  field.onChange(
                                    event.target.value === ""
                                      ? Number.NaN
                                      : Number(event.target.value),
                                  )
                                }
                                placeholder={t("inventory.quantityPlaceholder", {
                                  defaultValue: "Enter available quantity",
                                })}
                              />
                            </FormControl>
                            <p className="text-xs text-[var(--lux-text-secondary)]">
                              {t("inventory.quantityHelper", {
                                defaultValue:
                                  "Use zero for items that are currently out of stock.",
                              })}
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CrudFormSection>

                  <CrudFormSection
                    title={t("inventory.imageSection", {
                      defaultValue: "Reference Image",
                    })}
                    description={t("inventory.imageSectionHint", {
                      defaultValue:
                        "Upload an optional product image that helps the team identify the stock item quickly.",
                    })}
                  >
                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
                      <div className="space-y-3">
                        <label className="space-y-2">
                          <span className="text-sm font-medium text-[var(--lux-text)]">
                            {t("inventory.imageUpload", {
                              defaultValue: "Upload Image",
                            })}
                          </span>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                          />
                        </label>
                        <p className="text-xs text-[var(--lux-text-secondary)]">
                          {t("inventory.imageHint", {
                            defaultValue:
                              "Accepted image files only. Keep uploads under 5 MB for smoother syncing.",
                          })}
                        </p>
                        <p className="text-xs text-[var(--lux-text-muted)]">
                          {t("inventory.imageMaxSize", {
                            defaultValue: `Maximum recommended size: ${MAX_IMAGE_SIZE_MB} MB`,
                          })}
                        </p>
                        {selectedImageFile ? (
                          <p className="text-xs text-[var(--lux-text-secondary)]">
                            {t("inventory.selectedImage", {
                              defaultValue: "Selected image",
                            })}
                            {": "}
                            {selectedImageFile.name}
                          </p>
                        ) : null}
                      </div>

                      <SectionCard className="space-y-4">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-[var(--lux-heading)]">
                            {t("inventory.preview", {
                              defaultValue: "Preview",
                            })}
                          </p>
                          <p className="text-xs text-[var(--lux-text-secondary)]">
                            {t("inventory.previewHint", {
                              defaultValue:
                                "The selected image will appear in the inventory list and details view.",
                            })}
                          </p>
                        </div>

                        {currentPreview ? (
                          <div className="overflow-hidden rounded-[22px] border border-[var(--lux-control-border)] bg-[var(--lux-control-hover)]">
                            <img
                              src={currentPreview}
                              alt={form.watch("name") || item?.name || "Inventory item"}
                              className="h-56 w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex h-56 flex-col items-center justify-center gap-3 rounded-[22px] border border-dashed border-[var(--lux-control-border)] bg-[var(--lux-control-hover)] px-6 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[var(--lux-control-border)] bg-[var(--lux-panel-surface)] text-[var(--lux-gold)]">
                              <ImagePlus className="h-6 w-6" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-[var(--lux-heading)]">
                                {t("inventory.noImage", {
                                  defaultValue: "No image uploaded",
                                })}
                              </p>
                              <p className="text-xs text-[var(--lux-text-secondary)]">
                                {t("inventory.noImageHint", {
                                  defaultValue:
                                    "Add an optional image to make the stock catalog easier to scan.",
                                })}
                              </p>
                            </div>
                          </div>
                        )}
                      </SectionCard>
                    </div>
                  </CrudFormSection>

                  <CrudActionsBar>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/inventory")}
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

export default InventoryFormPage;
