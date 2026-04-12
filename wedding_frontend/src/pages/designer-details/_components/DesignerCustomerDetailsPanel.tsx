import { useEffect, useMemo, type ReactNode } from "react";
import { Loader2, ReceiptText, Save, ScrollText } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useVendorSubServices } from "@/hooks/vendors/useVendorSubServices";
import { EventEmptyState } from "@/pages/events/_components/EventDetailsPrimitives";
import { formatMoney as formatServiceMoney } from "@/pages/services/adapters";
import type { EventServiceItem } from "@/pages/services/types";
import {
  formatMoney as formatVendorMoney,
  sumSelectedVendorSubServicePrices,
} from "@/pages/vendors/adapters";
import type { EventVendorLink } from "@/pages/vendors/types";
import { cn } from "@/lib/utils";
import type { Quotation } from "@/pages/quotations/types";
import { useDesignerCustomerDetails } from "../hooks/useDesignerCustomerDetails";

type Props = {
  eventId: string;
  serviceItems: EventServiceItem[];
  vendorLinks: EventVendorLink[];
  latestQuotation: Quotation | null;
  onCreateQuotation: (options: { eventId: string }) => void;
  onCreateContract: (options: {
    eventId: string;
    quotationId?: string;
  }) => void;
};

function ChecklistCard({
  title,
  count,
  emptyTitle,
  emptyDescription,
  children,
}: {
  title: string;
  count: number;
  emptyTitle: string;
  emptyDescription: string;
  children: ReactNode;
}) {
  const { i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";

  return (
    <div className="flex h-full min-h-[420px] flex-col overflow-hidden rounded-[24px] border border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)]">
      <div
        dir={i18n.dir()}
        className={cn(
          "flex items-center justify-between gap-3 border-b border-[var(--lux-row-border)] px-5 py-5",
          isRtl ? "flex-row-reverse" : "flex-row",
        )}
      >
        <h3 className="text-lg font-semibold text-[var(--lux-heading)]">
          {title}
        </h3>
        <Badge
          variant="outline"
          className="rounded-full border-[var(--lux-gold-border)] bg-[var(--lux-control-hover)] px-3 py-1 text-xs text-[var(--lux-gold)]"
        >
          {count}
        </Badge>
      </div>

      <div className="flex-1 px-4 pb-4 pt-3">
        {count === 0 ? (
          <EventEmptyState
            title={emptyTitle}
            description={emptyDescription}
            className="flex min-h-[260px] items-center justify-center"
          />
        ) : (
          <div className="space-y-0 divide-y divide-[var(--lux-row-border)] overflow-hidden rounded-[18px] border border-[var(--lux-row-border)] bg-[var(--lux-control-surface)]">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

function ChecklistRow({
  checked,
  disabled,
  onCheckedChange,
  title,
  subtitle,
  description,
  meta,
  value,
}: {
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
  title: string;
  subtitle?: string;
  description?: string | null;
  meta: string[];
  value?: string | null;
}) {
  const { i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";

  return (
    <label
      dir={i18n.dir()}
      className={cn(
        "flex items-start gap-4 px-5 py-5 transition-all",
        isRtl ? "flex-row-reverse" : "flex-row",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        checked
          ? "bg-[color-mix(in_srgb,var(--lux-gold)_6%,var(--lux-control-surface))]"
          : "bg-transparent",
      )}
    >
      <Checkbox
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) => onCheckedChange(Boolean(value))}
        className="mt-0.5"
      />

      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div
            className={cn(
              "min-w-0 flex-1 space-y-1",
              isRtl ? "text-right" : "text-left",
            )}
          >
            <p className="break-words text-base font-semibold text-[var(--lux-heading)]">
              {title}
            </p>
            {subtitle ? (
              <p className="text-sm text-[var(--lux-text-secondary)]">
                {subtitle}
              </p>
            ) : null}
          </div>

          {value ? (
            <div
              className={cn(
                "shrink-0 text-sm font-semibold text-[var(--lux-gold)]",
                isRtl ? "text-left" : "text-right",
              )}
            >
              {value}
            </div>
          ) : null}
        </div>

        {description ? (
          <p
            className={cn(
              "text-sm leading-6 text-[var(--lux-text-secondary)]",
              isRtl ? "text-right" : "text-left",
            )}
          >
            {description}
          </p>
        ) : null}

        {meta.length ? (
          <div
            className={cn(
              "flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--lux-text-secondary)]",
              isRtl ? "justify-end text-right" : "justify-start text-left",
            )}
          >
            {meta.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        ) : null}
      </div>
    </label>
  );
}

function VendorChecklistItem({
  vendor,
  linkedVendor,
  isBusy,
  selectedSubServiceIds,
  onToggleVendor,
  onToggleSubService,
  onCalculatedPriceChange,
}: {
  vendor: ReturnType<typeof useDesignerCustomerDetails>["vendorOptions"][number];
  linkedVendor?: EventVendorLink;
  isBusy: boolean;
  selectedSubServiceIds: number[];
  onToggleVendor: (checked: boolean) => void;
  onToggleSubService: (subServiceId: number, checked: boolean) => void;
  onCalculatedPriceChange: (value: string) => void;
}) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  const { data: subServicesResponse, isLoading: subServicesLoading } =
    useVendorSubServices({
      currentPage: 1,
      itemsPerPage: 200,
      searchQuery: "",
      vendorId: vendor.id,
      vendorType: "all",
      isActive: "all",
      enabled: vendor.selected,
    });

  const subServices = useMemo(
    () =>
      [...(subServicesResponse?.data ?? [])].sort((left, right) => {
        if (left.isActive !== right.isActive) {
          return left.isActive ? -1 : 1;
        }

        if (left.sortOrder !== right.sortOrder) {
          return left.sortOrder - right.sortOrder;
        }

        return left.name.localeCompare(right.name);
      }),
    [subServicesResponse?.data],
  );

  const calculatedPrice = useMemo(
    () =>
      Number(
        sumSelectedVendorSubServicePrices(subServices, selectedSubServiceIds),
      ).toFixed(3),
    [selectedSubServiceIds, subServices],
  );

  useEffect(() => {
    if (!vendor.selected) {
      return;
    }

    onCalculatedPriceChange(calculatedPrice);
  }, [calculatedPrice, onCalculatedPriceChange, vendor.selected]);

  const rowValue =
    vendor.selected && selectedSubServiceIds.length > 0
      ? formatVendorMoney(calculatedPrice)
      : linkedVendor?.agreedPrice != null
        ? formatVendorMoney(linkedVendor.agreedPrice)
        : null;

  return (
    <div>
      <ChecklistRow
        checked={vendor.selected}
        disabled={isBusy}
        onCheckedChange={onToggleVendor}
        title={vendor.name}
        subtitle={vendor.typeLabel}
        description={vendor.description}
        value={rowValue}
        meta={[
          vendor.contactPerson
            ? `${t("designer.contact")}: ${vendor.contactPerson}`
            : t("designer.catalogVendor"),
          vendor.phone
            ? `${t("designer.phone")}: ${vendor.phone}`
            : vendor.isActive
              ? t("designer.active")
              : t("designer.inactive"),
          linkedVendor?.notes ? linkedVendor.notes : t("designer.notLinked"),
        ]}
      />

      {vendor.selected ? (
        <div className="border-t border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)] px-5 py-4">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="rounded-full border-[var(--lux-gold-border)] bg-[var(--lux-control-hover)] px-3 py-1 text-xs text-[var(--lux-gold)]"
            >
              {t("designer.subServices")} {selectedSubServiceIds.length}
            </Badge>
            <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs">
              {t("designer.price")} {formatVendorMoney(calculatedPrice)}
            </Badge>
          </div>

          {subServicesLoading ? (
            <div className="flex items-center text-sm text-[var(--lux-text-secondary)]">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="ms-2">
                {t("common.loading", { defaultValue: "Loading..." })}
              </span>
            </div>
          ) : subServices.length ? (
            <div className="grid grid-cols-1 gap-2">
              {subServices.map((subService) => {
                const checked = selectedSubServiceIds.includes(subService.id);

                return (
                  <label
                    key={subService.id}
                    dir={i18n.dir()}
                    className={cn(
                      "flex items-start gap-3 rounded-[8px] border px-4 py-3 transition-all",
                      isRtl ? "flex-row-reverse" : "flex-row",
                      checked
                        ? "border-[var(--lux-gold-border)] bg-[var(--lux-control-hover)]"
                        : "border-[var(--lux-row-border)] bg-[var(--lux-control-surface)]",
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      disabled={isBusy}
                      onCheckedChange={(value) =>
                        onToggleSubService(subService.id, Boolean(value))
                      }
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <p className="text-sm font-semibold text-[var(--lux-heading)]">
                          {subService.name}
                        </p>
                        <span
                          className={cn(
                            "shrink-0 text-sm font-semibold text-[var(--lux-gold)]",
                            isRtl ? "text-left" : "text-right",
                          )}
                        >
                          {formatVendorMoney(subService.price)}
                        </span>
                      </div>
                      <p
                        className={cn(
                          "text-xs leading-5 text-[var(--lux-text-secondary)]",
                          isRtl ? "text-right" : "text-left",
                        )}
                      >
                        {subService.description ||
                          subService.code ||
                          t("designer.noDescription")}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          ) : (
            <EventEmptyState
              title={t("designer.noSubServicesTitle")}
              description={t("designer.noSubServicesDescription")}
              className="flex min-h-[120px] items-center justify-center"
            />
          )}
        </div>
      ) : null}
    </div>
  );
}

export function DesignerCustomerDetailsPanel({
  eventId,
  serviceItems,
  vendorLinks,
  latestQuotation,
  onCreateQuotation,
  onCreateContract,
}: Props) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  const model = useDesignerCustomerDetails({
    eventId,
    serviceItems,
    vendorLinks,
    latestQuotation,
    onCreateQuotation,
    onCreateContract,
  });

  const isBusy = model.isSaving;

  if (model.servicesLoadFailed || model.vendorsLoadFailed) {
    return (
      <EventEmptyState
        title={t("designer.loadClientDetailsFailedTitle")}
        description={t("designer.loadClientDetailsFailedDescription")}
      />
    );
  }

  return (
    <div className="space-y-5">
      {model.isDirty ? (
        <div className="flex items-center justify-end">
          <Badge
            variant="outline"
            className="rounded-full border-[var(--lux-gold-border)] bg-[var(--lux-control-hover)] px-3 py-1 text-xs text-[var(--lux-gold)]"
          >
            {t("designer.unsavedChanges")}
          </Badge>
        </div>
      ) : null}

      {model.servicesLoading || model.vendorsLoading ? (
        <div className="flex min-h-[280px] items-center justify-center text-sm text-[var(--lux-text-secondary)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="ms-2">
            {t("common.loading", { defaultValue: "Loading..." })}
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2 xl:gap-6">
          <ChecklistCard
            title={t("designer.vendors")}
            count={model.vendorOptions.length}
            emptyTitle={t("designer.noVendorsTitle")}
            emptyDescription={t("designer.noVendorsDescription")}
          >
            {model.vendorOptions.map((vendor) => (
              <VendorChecklistItem
                key={vendor.id}
                vendor={vendor}
                linkedVendor={model.vendorLinksByVendorId.get(vendor.id)}
                isBusy={isBusy}
                selectedSubServiceIds={
                  model.selectedVendorSubServices[vendor.id] ?? []
                }
                onToggleVendor={(checked) => model.toggleVendor(vendor.id, checked)}
                onToggleSubService={(subServiceId, checked) =>
                  model.toggleVendorSubService(vendor.id, subServiceId, checked)
                }
                onCalculatedPriceChange={(value) =>
                  model.setVendorCalculatedAgreedPrice(vendor.id, value)
                }
              />
            ))}
          </ChecklistCard>

          <ChecklistCard
            title={t("designer.services")}
            count={model.serviceOptions.length}
            emptyTitle={t("designer.noServicesTitle")}
            emptyDescription={t("designer.noServicesDescription")}
          >
            {model.serviceOptions.map((service) => {
              const linkedItem = model.serviceItemsByServiceId.get(service.id);
              const displayValue =
                linkedItem?.totalPrice != null
                  ? formatServiceMoney(linkedItem.totalPrice)
                  : linkedItem?.unitPrice != null
                    ? formatServiceMoney(linkedItem.unitPrice)
                    : null;

              return (
                <ChecklistRow
                  key={service.id}
                  checked={service.selected}
                  disabled={isBusy}
                  onCheckedChange={(checked) =>
                    model.toggleService(service.id, checked)
                  }
                  title={service.name}
                  subtitle={service.categoryLabel}
                  description={service.description}
                  value={displayValue}
                  meta={[
                    service.code
                      ? `${t("designer.code")}: ${service.code}`
                      : t("designer.catalogService"),
                    service.isActive
                      ? t("designer.active")
                      : t("designer.inactive"),
                    linkedItem?.notes ? linkedItem.notes : t("designer.notLinked"),
                  ]}
                />
              );
            })}
          </ChecklistCard>
        </div>
      )}

      {(model.linkedCatalogOnlyCounts.manualServices > 0 ||
        model.linkedCatalogOnlyCounts.manualVendors > 0) && (
        <p className="text-xs leading-5 text-[var(--lux-text-muted)]">
          {t("designer.manualItemsRemain", {
            services: model.linkedCatalogOnlyCounts.manualServices,
            vendors: model.linkedCatalogOnlyCounts.manualVendors,
          })}
        </p>
      )}

      <div className="border-t border-[var(--lux-row-border)] pt-4 sm:pt-5">
        <div
          className={cn(
            "flex flex-col gap-3 sm:flex-wrap sm:justify-center",
            isRtl ? "sm:flex-row-reverse" : "sm:flex-row",
          )}
        >
          <Button
            type="button"
            variant="outline"
            onClick={model.save}
            disabled={isBusy}
            className="min-w-[180px] rounded-[999px] border-[var(--lux-gold-border)] bg-[var(--lux-control-hover)]"
          >
            {model.pendingAction === "save" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {t("designer.save")}
          </Button>

          <Button
            type="button"
            onClick={model.createQuotation}
            disabled={isBusy}
            className="min-w-[220px] rounded-[999px]"
          >
            {model.pendingAction === "quotation" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ReceiptText className="h-4 w-4" />
            )}
            {t("designer.createQuotation")}
          </Button>

          <Button
            type="button"
            onClick={model.createContract}
            disabled={isBusy}
            className="min-w-[200px] rounded-[999px]"
          >
            {model.pendingAction === "contract" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ScrollText className="h-4 w-4" />
            )}
            {t("designer.createContract")}
          </Button>
        </div>
      </div>
    </div>
  );
}
