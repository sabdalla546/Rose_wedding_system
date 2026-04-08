import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  SearchableSelect,
  SearchableSelectEmpty,
  SearchableSelectItem,
  SearchableSelectSkeleton,
} from "@/components/ui/searchable-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useServices } from "@/hooks/services/useServices";
import {
  formatContractItemCategory,
  formatMoney,
  toNumberValue,
} from "@/pages/contracts/adapters";
import type {
  ContractAmendmentItem,
  ContractAmendmentItemCreateFormData,
  ContractAmendmentItemUpdateFormData,
} from "@/pages/contracts/amendments/types";
import type { ContractItem } from "@/pages/contracts/types";
import type { ServiceCategory } from "@/pages/services/types";

type DialogMode = "create" | "edit";
type FormChangeType = ContractAmendmentItem["changeType"];

type FormState = {
  changeType: FormChangeType;
  serviceId: string;
  targetContractItemId: string;
  itemName: string;
  category: string;
  quantity: string;
  unitPrice: string;
  totalPrice: string;
  notes: string;
};

const SERVICE_CATEGORY_OPTIONS: ServiceCategory[] = [
  "internal_setup",
  "external_service",
  "flowers",
  "stage",
  "entrance",
  "chairs",
  "tables",
  "buffet",
  "lighting",
  "photography",
  "audio",
  "hospitality",
  "female_supplies",
  "transport",
  "other",
];

const isServiceSummaryItem = (item: ContractItem) =>
  item.itemType === "service" && item.category === "service_summary";

const createDefaultState = (
  changeType: FormChangeType,
  item?: ContractAmendmentItem | null,
): FormState => ({
  changeType: item?.changeType ?? changeType,
  serviceId: item?.serviceId ? String(item.serviceId) : "",
  targetContractItemId: item?.targetContractItemId
    ? String(item.targetContractItemId)
    : "",
  itemName: item?.itemName ?? "",
  category: item?.category ?? "",
  quantity:
    typeof item?.quantity !== "undefined" && item?.quantity !== null
      ? String(item.quantity)
      : "",
  unitPrice:
    typeof item?.unitPrice !== "undefined" && item?.unitPrice !== null
      ? String(item.unitPrice)
      : "",
  totalPrice:
    typeof item?.totalPrice !== "undefined" && item?.totalPrice !== null
      ? String(item.totalPrice)
      : "",
  notes: item?.notes ?? "",
});

export function ContractAmendmentItemFormDialog({
  open,
  onOpenChange,
  mode,
  initialChangeType = "add_service",
  item,
  contractServiceItems,
  isPending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: DialogMode;
  initialChangeType?: FormChangeType;
  item?: ContractAmendmentItem | null;
  contractServiceItems: ContractItem[];
  isPending?: boolean;
  onSubmit: (
    values: ContractAmendmentItemCreateFormData | ContractAmendmentItemUpdateFormData,
  ) => void;
}) {
  const { t } = useTranslation();
  const [serviceSearchQuery, setServiceSearchQuery] = useState("");
  const [formState, setFormState] = useState<FormState>(
    createDefaultState(initialChangeType, item),
  );
  const [error, setError] = useState("");

  const { data: servicesResponse, isLoading: isLoadingServices } = useServices({
    currentPage: 1,
    itemsPerPage: 100,
    searchQuery: serviceSearchQuery,
    category: "all",
    isActive: "true",
  });

  const availableContractServiceItems = useMemo(
    () =>
      contractServiceItems.filter(
        (contractItem) =>
          contractItem.itemType === "service" && !isServiceSummaryItem(contractItem),
      ),
    [contractServiceItems],
  );

  const selectedService = useMemo(
    () =>
      (servicesResponse?.data ?? []).find(
        (service) => String(service.id) === formState.serviceId,
      ),
    [formState.serviceId, servicesResponse?.data],
  );

  const selectedContractServiceItem = useMemo(
    () =>
      availableContractServiceItems.find(
        (contractItem) => String(contractItem.id) === formState.targetContractItemId,
      ),
    [availableContractServiceItems, formState.targetContractItemId],
  );

  const isEditingAddService = mode === "edit" && formState.changeType === "add_service";
  const isEditingRemoveService =
    mode === "edit" && formState.changeType === "remove_service";

  useEffect(() => {
    if (!open) {
      setError("");
      setServiceSearchQuery("");
      return;
    }

    setFormState(createDefaultState(initialChangeType, item));
    setError("");
  }, [initialChangeType, item, open]);

  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = () => {
    setError("");

    if (formState.changeType === "add_service") {
      const quantity = toNumberValue(formState.quantity);
      const unitPrice = toNumberValue(formState.unitPrice);

      if (mode === "create" && !formState.serviceId) {
        setError(
          t("contracts.amendments.validation.serviceRequired", {
            defaultValue: "Service selection is required.",
          }),
        );
        return;
      }

      if (!formState.itemName.trim()) {
        setError(
          t("contracts.amendments.validation.itemNameRequired", {
            defaultValue: "Item name is required.",
          }),
        );
        return;
      }

      if (!formState.category.trim()) {
        setError(
          t("contracts.amendments.validation.categoryRequired", {
            defaultValue: "Category is required.",
          }),
        );
        return;
      }

      if (quantity === null || quantity <= 0) {
        setError(
          t("contracts.amendments.validation.quantityInvalid", {
            defaultValue: "Quantity must be greater than zero.",
          }),
        );
        return;
      }

      if (unitPrice === null || unitPrice < 0) {
        setError(
          t("contracts.amendments.validation.unitPriceInvalid", {
            defaultValue: "Unit price must be zero or greater.",
          }),
        );
        return;
      }

      const totalPrice =
        formState.totalPrice.trim() !== ""
          ? formState.totalPrice.trim()
          : String(Number((quantity * unitPrice).toFixed(3)));

      if (mode === "create") {
        onSubmit({
          changeType: "add_service",
          serviceId: formState.serviceId,
          itemName: formState.itemName,
          category: formState.category,
          quantity: formState.quantity,
          unitPrice: formState.unitPrice,
          totalPrice,
          notes: formState.notes,
        });
        return;
      }

      onSubmit({
        itemName: formState.itemName,
        category: formState.category,
        quantity: formState.quantity,
        unitPrice: formState.unitPrice,
        totalPrice: formState.totalPrice,
        notes: formState.notes,
      });
      return;
    }

    if (mode === "create" && !formState.targetContractItemId) {
      setError(
        t("contracts.amendments.validation.targetContractItemRequired", {
          defaultValue: "Select a contract service item to remove.",
        }),
      );
      return;
    }

    if (mode === "create") {
      onSubmit({
        changeType: "remove_service",
        targetContractItemId: formState.targetContractItemId,
        notes: formState.notes,
      });
      return;
    }

    onSubmit({
      notes: formState.notes,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto overflow-x-hidden sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit"
              ? t("contracts.amendments.editItemTitle", {
                  defaultValue: "Edit Amendment Item",
                })
              : t("contracts.amendments.addItemTitle", {
                  defaultValue: "Add Amendment Item",
                })}
          </DialogTitle>
          <DialogDescription>
            {t("contracts.amendments.itemDialogHint", {
              defaultValue:
                "Draft amendments support adding a service or removing an existing contract service.",
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <label className="space-y-2">
            <span className="text-sm font-medium text-[var(--lux-text)]">
              {t("contracts.amendments.changeType", {
                defaultValue: "Change Type",
              })}
            </span>
            <Select
              disabled={mode === "edit"}
              value={formState.changeType}
              onValueChange={(value) =>
                setFormState(createDefaultState(value as FormChangeType, null))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="add_service">
                  {t("contracts.amendments.changeType.add_service", {
                    defaultValue: "Add Service",
                  })}
                </SelectItem>
                <SelectItem value="remove_service">
                  {t("contracts.amendments.changeType.remove_service", {
                    defaultValue: "Remove Service",
                  })}
                </SelectItem>
              </SelectContent>
            </Select>
          </label>

          {formState.changeType === "add_service" ? (
            <div className="grid gap-4 md:grid-cols-2">
              {mode === "create" ? (
                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-medium text-[var(--lux-text)]">
                    {t("contracts.service", { defaultValue: "Service" })}
                  </span>
                  <SearchableSelect
                    value={formState.serviceId || undefined}
                    onValueChange={(value) => {
                      const nextService =
                        (servicesResponse?.data ?? []).find(
                          (service) => String(service.id) === value,
                        ) ?? null;

                      setFormState((current) => ({
                        ...current,
                        serviceId: value,
                        itemName: nextService?.name ?? current.itemName,
                        category: nextService?.category ?? current.category,
                      }));
                    }}
                    placeholder={t("contracts.amendments.selectService", {
                      defaultValue: "Select a service",
                    })}
                    searchPlaceholder={t("common.search", {
                      defaultValue: "Search",
                    })}
                    onSearch={setServiceSearchQuery}
                    isLoading={isLoadingServices}
                    emptyMessage={t("contracts.amendments.noServicesFound", {
                      defaultValue: "No services found",
                    })}
                  >
                    {isLoadingServices ? <SearchableSelectSkeleton count={4} /> : null}
                    {!isLoadingServices && !(servicesResponse?.data ?? []).length ? (
                      <SearchableSelectEmpty
                        message={t("contracts.amendments.noServicesFound", {
                          defaultValue: "No services found",
                        })}
                      />
                    ) : null}
                    {(servicesResponse?.data ?? []).map((service) => (
                      <SearchableSelectItem key={service.id} value={String(service.id)}>
                        {service.name}
                      </SearchableSelectItem>
                    ))}
                  </SearchableSelect>
                </label>
              ) : (
                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-medium text-[var(--lux-text)]">
                    {t("contracts.service", { defaultValue: "Service" })}
                  </span>
                  <Input
                    disabled
                    value={
                      selectedService?.name ||
                      item?.service?.name ||
                      item?.itemName ||
                      ""
                    }
                  />
                </label>
              )}

              <label className="space-y-2">
                <span className="text-sm font-medium text-[var(--lux-text)]">
                  {t("contracts.itemName", { defaultValue: "Item Name" })}
                </span>
                <Input
                  value={formState.itemName}
                  onChange={(event) => setField("itemName", event.target.value)}
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-[var(--lux-text)]">
                  {t("contracts.category", { defaultValue: "Category" })}
                </span>
                <Select
                  value={formState.category}
                  onValueChange={(value) => setField("category", value)}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("contracts.category", {
                        defaultValue: "Category",
                      })}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_CATEGORY_OPTIONS.map((category) => (
                      <SelectItem key={category} value={category}>
                        {formatContractItemCategory(category)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-[var(--lux-text)]">
                  {t("contracts.quantity", { defaultValue: "Quantity" })}
                </span>
                <Input
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={formState.quantity}
                  onChange={(event) => setField("quantity", event.target.value)}
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-[var(--lux-text)]">
                  {t("contracts.unitPrice", { defaultValue: "Unit Price" })}
                </span>
                <Input
                  type="number"
                  min="0"
                  step="0.001"
                  value={formState.unitPrice}
                  onChange={(event) => setField("unitPrice", event.target.value)}
                />
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-[var(--lux-text)]">
                  {t("contracts.totalAmount", { defaultValue: "Total Price" })}
                </span>
                <Input
                  type="number"
                  min="0"
                  step="0.001"
                  value={formState.totalPrice}
                  onChange={(event) => setField("totalPrice", event.target.value)}
                  placeholder={t("contracts.amendments.autoCalculated", {
                    defaultValue: "Leave empty to auto-calculate",
                  })}
                />
              </label>
            </div>
          ) : (
            <div className="grid gap-4">
              {mode === "create" ? (
                <label className="space-y-2">
                  <span className="text-sm font-medium text-[var(--lux-text)]">
                    {t("contracts.amendments.targetContractItem", {
                      defaultValue: "Contract Service Item",
                    })}
                  </span>
                  <Select
                    value={formState.targetContractItemId}
                    onValueChange={(value) => setField("targetContractItemId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t("contracts.amendments.selectContractService", {
                          defaultValue: "Select a contract service item",
                        })}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {availableContractServiceItems.map((contractItem) => (
                        <SelectItem key={contractItem.id} value={String(contractItem.id)}>
                          {contractItem.itemName} ({formatMoney(contractItem.totalPrice)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
              ) : null}

              {selectedContractServiceItem || isEditingRemoveService ? (
                <div className="grid gap-3 rounded-[20px] border p-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
                      {t("contracts.service", { defaultValue: "Service" })}
                    </p>
                    <p className="mt-1 text-sm text-[var(--lux-text)]">
                      {selectedContractServiceItem?.itemName ||
                        item?.targetContractItem?.itemName ||
                        item?.itemName ||
                        "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
                      {t("contracts.totalAmount", { defaultValue: "Total" })}
                    </p>
                    <p className="mt-1 text-sm text-[var(--lux-text)]">
                      {formatMoney(
                        selectedContractServiceItem?.totalPrice ||
                          item?.targetContractItem?.totalPrice ||
                          item?.totalPrice,
                      )}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          <label className="space-y-2">
            <span className="text-sm font-medium text-[var(--lux-text)]">
              {t("common.notes", { defaultValue: "Notes" })}
            </span>
            <Textarea
              value={formState.notes}
              onChange={(event) => setField("notes", event.target.value)}
              placeholder={t("contracts.amendments.notesPlaceholder", {
                defaultValue: "Add amendment notes...",
              })}
            />
          </label>

          {isEditingAddService ? (
            <p className="text-xs text-[var(--lux-text-secondary)]">
              {t("contracts.amendments.serviceLockedHint", {
                defaultValue:
                  "Service linkage stays fixed after creation. Edit the commercial fields only.",
              })}
            </p>
          ) : null}

          {error ? <p className="text-sm text-[var(--lux-danger)]">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            {t("common.cancel", { defaultValue: "Cancel" })}
          </Button>
          <Button type="button" disabled={isPending} onClick={handleSubmit}>
            {isPending
              ? t("common.processing", { defaultValue: "Processing..." })
              : mode === "edit"
                ? t("common.update", { defaultValue: "Update" })
                : t("common.create", { defaultValue: "Create" })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
