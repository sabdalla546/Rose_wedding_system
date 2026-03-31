import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  AppDialogBody,
  AppDialogFooter,
  AppDialogHeader,
  AppDialogShell,
} from "@/components/shared/app-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateEventService,
  useUpdateEventService,
} from "@/hooks/services/useEventServiceMutations";
import { useServices } from "@/hooks/services/useServices";
import {
  EVENT_SERVICE_STATUS_OPTIONS,
  formatMoney,
  SERVICE_CATEGORY_OPTIONS,
  toNumberValue,
} from "@/pages/services/adapters";
import type {
  EventServiceItem,
  EventServiceItemFormData,
  EventServiceStatus,
  Service,
  ServiceCategory,
} from "@/pages/services/types";

type EventServiceFormState = {
  serviceId: string;
  serviceNameSnapshot: string;
  category: ServiceCategory;
  quantity: string;
  unitPrice: string;
  notes: string;
  status: EventServiceStatus;
  sortOrder: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: number;
  defaultSortOrder?: number;
  editingServiceItem?: EventServiceItem | null;
  initialService?: Service | null;
};

const textareaClassName =
  "min-h-[110px] w-full rounded-[22px] border px-4 py-3 text-sm text-[var(--lux-text)] placeholder:text-[var(--lux-text-muted)] outline-none transition-all focus:border-[var(--lux-gold-border)] focus:ring-2 focus:ring-[var(--lux-gold-glow)]";

const createDefaultEventServiceState = (
  sortOrder = 0,
  editingServiceItem?: EventServiceItem | null,
  initialService?: Service | null,
): EventServiceFormState => {
  if (editingServiceItem) {
    return {
      serviceId: editingServiceItem.serviceId
        ? String(editingServiceItem.serviceId)
        : "",
      serviceNameSnapshot: editingServiceItem.serviceNameSnapshot ?? "",
      category: editingServiceItem.category,
      quantity:
        typeof editingServiceItem.quantity !== "undefined" &&
        editingServiceItem.quantity !== null
          ? String(editingServiceItem.quantity)
          : "",
      unitPrice:
        typeof editingServiceItem.unitPrice !== "undefined" &&
        editingServiceItem.unitPrice !== null
          ? String(editingServiceItem.unitPrice)
          : "",
      notes: editingServiceItem.notes ?? "",
      status: editingServiceItem.status,
      sortOrder: String(editingServiceItem.sortOrder ?? sortOrder),
    };
  }

  return {
    serviceId: initialService ? String(initialService.id) : "",
    serviceNameSnapshot: initialService?.name ?? "",
    category: initialService?.category ?? "other",
    quantity: "",
    unitPrice: "",
    notes: "",
    status: "confirmed",
    sortOrder: String(sortOrder),
  };
};

export function EventServiceEditorDialog({
  open,
  onOpenChange,
  eventId,
  defaultSortOrder = 0,
  editingServiceItem = null,
  initialService = null,
}: Props) {
  const { t } = useTranslation();
  const [form, setForm] = useState<EventServiceFormState>(() =>
    createDefaultEventServiceState(
      defaultSortOrder,
      editingServiceItem,
      initialService,
    ),
  );
  const [error, setError] = useState("");

  const createEventServiceMutation = useCreateEventService();
  const updateEventServiceMutation = useUpdateEventService(eventId);
  const pending =
    createEventServiceMutation.isPending ||
    updateEventServiceMutation.isPending;

  const { data: serviceCatalogResponse, isLoading: serviceCatalogLoading } =
    useServices({
      currentPage: 1,
      itemsPerPage: 500,
      searchQuery: "",
      category: "all",
      isActive: "all",
    });

  const serviceCatalog = useMemo(
    () =>
      [...(serviceCatalogResponse?.data ?? [])].sort((left, right) => {
        if (left.isActive !== right.isActive) {
          return left.isActive ? -1 : 1;
        }

        return left.name.localeCompare(right.name);
      }),
    [serviceCatalogResponse?.data],
  );

  const resolvedTotalPrice = useMemo(() => {
    const quantity = toNumberValue(form.quantity);
    const unitPrice = toNumberValue(form.unitPrice);

    if (quantity === null || unitPrice === null) {
      return null;
    }

    return Number((quantity * unitPrice).toFixed(3));
  }, [form.quantity, form.unitPrice]);

  const handleSave = async () => {
    const selectedService = serviceCatalog.find(
      (service) => String(service.id) === form.serviceId,
    );
    const sortOrderValue = Number(form.sortOrder || 0);
    const quantityValue = toNumberValue(form.quantity);
    const unitPriceValue = toNumberValue(form.unitPrice);
    const serviceNameSnapshot =
      form.serviceNameSnapshot.trim() || selectedService?.name || "";

    if (!form.serviceId && !serviceNameSnapshot) {
      setError(
        t("services.selectionRequired", {
          defaultValue: "Select a catalog service or enter a service name.",
        }),
      );
      return;
    }

    if (!Number.isInteger(sortOrderValue) || sortOrderValue < 0) {
      setError(
        t("services.sortOrderInvalid", {
          defaultValue: "Sort order must be zero or greater.",
        }),
      );
      return;
    }

    if (quantityValue !== null && quantityValue < 0) {
      setError(
        t("services.quantityInvalid", {
          defaultValue: "Quantity must be zero or greater.",
        }),
      );
      return;
    }

    if (unitPriceValue !== null && unitPriceValue < 0) {
      setError(
        t("services.unitPriceInvalid", {
          defaultValue: "Unit price must be zero or greater.",
        }),
      );
      return;
    }

    setError("");

    const payload: EventServiceItemFormData = {
      eventId,
      serviceId: form.serviceId,
      serviceNameSnapshot,
      category: form.category,
      quantity: form.quantity,
      unitPrice: form.unitPrice,
      totalPrice: resolvedTotalPrice !== null ? String(resolvedTotalPrice) : "",
      notes: form.notes,
      status: form.status,
      sortOrder: String(sortOrderValue),
    };

    if (editingServiceItem) {
      await updateEventServiceMutation.mutateAsync({
        id: editingServiceItem.id,
        values: payload,
      });
    } else {
      await createEventServiceMutation.mutateAsync(payload);
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AppDialogShell size="md" className="h-[min(88dvh,780px)]">
        <AppDialogHeader
          title={
            editingServiceItem
              ? t("services.editEventService", {
                  defaultValue: "Edit Event Service",
                })
              : t("services.addEventService", {
                  defaultValue: "Add Event Service",
                })
          }
          description={t("services.eventServiceHint", {
            defaultValue:
              "Link a catalog service or record a manual service line for this event.",
          })}
        />

        <AppDialogBody className="space-y-5">
          <div className="rounded-[24px] border border-[var(--lux-row-border)] bg-[var(--lux-row-surface)] p-4 sm:p-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <label className="space-y-2">
                <span className="text-sm font-medium text-[var(--lux-text)]">
                  {t("services.categoryLabel", {
                    defaultValue: "Service Category",
                  })}
                </span>
                <Select
                  value={form.category}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      category: value as ServiceCategory,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-[var(--lux-text)]">
                  {t("services.eventStatusLabel", {
                    defaultValue: "Item Status",
                  })}
                </span>
                <Select
                  value={form.status}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      status: value as EventServiceStatus,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_SERVICE_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {t(`services.eventStatus.${option.value}`, {
                          defaultValue: option.label,
                        })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-[var(--lux-text)]">
                  {t("services.sortOrder", { defaultValue: "Sort Order" })}
                </span>
                <Input
                  type="number"
                  min="0"
                  value={form.sortOrder}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      sortOrder: event.target.value,
                    }))
                  }
                />
              </label>
            </div>
          </div>

          <div className="rounded-[24px] border border-[var(--lux-row-border)] bg-[var(--lux-row-surface)] p-4 sm:p-5">
            <label className="space-y-2">
              <span className="text-sm font-medium text-[var(--lux-text)]">
                {t("services.serviceSelection", {
                  defaultValue: "Catalog Service",
                })}
              </span>
              <Select
                value={form.serviceId || "none"}
                onValueChange={(value) =>
                  setForm((current) => {
                    const nextValue = value === "none" ? "" : value;
                    const selectedService = serviceCatalog.find(
                      (service) => String(service.id) === nextValue,
                    );

                    return {
                      ...current,
                      serviceId: nextValue,
                      serviceNameSnapshot:
                        selectedService?.name || current.serviceNameSnapshot,
                      category: selectedService?.category || current.category,
                    };
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t("services.selectService", {
                      defaultValue: "Select service",
                    })}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    {t("services.noServiceSelected", {
                      defaultValue: "No catalog service selected",
                    })}
                  </SelectItem>
                  {serviceCatalog.map((service) => (
                    <SelectItem key={service.id} value={String(service.id)}>
                      {service.name}
                      {!service.isActive
                        ? ` (${t("services.status.inactive", {
                            defaultValue: "Inactive",
                          })})`
                        : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs leading-5 text-[var(--lux-text-secondary)]">
                {serviceCatalogLoading
                  ? t("common.loading", { defaultValue: "Loading..." })
                  : t("services.serviceSelectionHint", {
                      defaultValue:
                        "Choose a service from the catalog when available, or leave it empty and type the service name manually.",
                    })}
              </p>
            </label>

            <label className="mt-4 block space-y-2">
              <span className="text-sm font-medium text-[var(--lux-text)]">
                {t("services.serviceNameSnapshot", {
                  defaultValue: "Service Name",
                })}
              </span>
              <Input
                value={form.serviceNameSnapshot}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    serviceNameSnapshot: event.target.value,
                  }))
                }
                placeholder={t("services.serviceNameSnapshotPlaceholder", {
                  defaultValue:
                    "Enter service name if the item is not in the catalog",
                })}
              />
            </label>
          </div>

          <div className="rounded-[24px] border border-[var(--lux-row-border)] bg-[var(--lux-row-surface)] p-4 sm:p-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <label className="space-y-2">
                <span className="text-sm font-medium text-[var(--lux-text)]">
                  {t("services.quantity", { defaultValue: "Quantity" })}
                </span>
                <Input
                  type="number"
                  min="0"
                  step="0.001"
                  value={form.quantity}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      quantity: event.target.value,
                    }))
                  }
                  placeholder="0.000"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-[var(--lux-text)]">
                  {t("services.unitPrice", { defaultValue: "Unit Price" })}
                </span>
                <Input
                  type="number"
                  min="0"
                  step="0.001"
                  value={form.unitPrice}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      unitPrice: event.target.value,
                    }))
                  }
                  placeholder="0.000"
                />
              </label>

              <div className="space-y-2">
                <span className="text-sm font-medium text-[var(--lux-text)]">
                  {t("services.totalAmount", { defaultValue: "Total" })}
                </span>
                <div className="flex h-10 items-center rounded-[18px] border border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)] px-4 text-sm font-semibold text-[var(--lux-heading)]">
                  {formatMoney(resolvedTotalPrice)}
                </div>
                <Badge variant="outline" className="rounded-full">
                  {t("services.totalAutoCalculated", {
                    defaultValue: "Auto calculated from quantity x unit price",
                  })}
                </Badge>
              </div>
            </div>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-[var(--lux-text)]">
              {t("common.notes", { defaultValue: "Notes" })}
            </span>
            <textarea
              className={textareaClassName}
              value={form.notes}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
              placeholder={t("services.eventNotesPlaceholder", {
                defaultValue:
                  "Add service notes, scope details, or internal coordination remarks...",
              })}
            />
          </label>

          {error ? (
            <div className="rounded-[18px] border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}
        </AppDialogBody>

        <AppDialogFooter className="gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            {t("common.cancel", { defaultValue: "Cancel" })}
          </Button>
          <Button type="button" onClick={handleSave} disabled={pending}>
            {pending
              ? t("common.processing", { defaultValue: "Processing..." })
              : editingServiceItem
                ? t("common.update", { defaultValue: "Update" })
                : t("common.create", { defaultValue: "Create" })}
          </Button>
        </AppDialogFooter>
      </AppDialogShell>
    </Dialog>
  );
}
