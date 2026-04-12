import type { ReactNode } from "react";
import { Loader2, ReceiptText, Save, ScrollText } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  EventEmptyState,
} from "@/pages/events/_components/EventDetailsPrimitives";
import { cn } from "@/lib/utils";
import type { Quotation } from "@/pages/quotations/types";
import { formatMoney as formatServiceMoney } from "@/pages/services/adapters";
import type { EventServiceItem } from "@/pages/services/types";
import { formatMoney as formatVendorMoney } from "@/pages/vendors/adapters";
import type { EventVendorLink } from "@/pages/vendors/types";
import { useDesignerCustomerDetails } from "../hooks/useDesignerCustomerDetails";

type Props = {
  eventId: string;
  serviceItems: EventServiceItem[];
  vendorLinks: EventVendorLink[];
  latestQuotation: Quotation | null;
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
  return (
    <div className="flex h-full min-h-[420px] flex-col overflow-hidden rounded-[24px] border border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)]">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--lux-row-border)] px-5 py-5">
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
  isRtl,
}: {
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
  title: string;
  subtitle?: string;
  description?: string | null;
  meta: string[];
  value?: string | null;
  isRtl: boolean;
}) {
  return (
    <label
      className={cn(
        "flex gap-4 px-5 py-5 transition-all",
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
        <div
          className={cn(
            "flex flex-wrap items-start justify-between gap-3",
            isRtl ? "text-right" : "text-left",
          )}
        >
          <div className="min-w-0 space-y-1">
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
            <div className="text-sm font-semibold text-[var(--lux-gold)]">
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
              isRtl ? "justify-start" : "justify-start",
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

export function DesignerCustomerDetailsPanel({
  eventId,
  serviceItems,
  vendorLinks,
  latestQuotation,
}: Props) {
  const { t, i18n } = useTranslation();
  const model = useDesignerCustomerDetails({
    eventId,
    serviceItems,
    vendorLinks,
    latestQuotation,
  });

  const isBusy = model.isSaving;
  const saveLabel =
    i18n.language === "ar" ? "حفظ" : t("common.save", { defaultValue: "Save" });
  const createQuotationLabel =
    i18n.language === "ar"
      ? "إنشاء عرض سعر"
      : t("quotations.create", { defaultValue: "Create Quotation" });
  const createContractLabel =
    i18n.language === "ar"
      ? "إنشاء عقد"
      : t("contracts.create", { defaultValue: "Create Contract" });

  if (model.servicesLoadFailed || model.vendorsLoadFailed) {
    return (
      <EventEmptyState
        title={
          i18n.language === "ar"
            ? "تعذر تحميل تفاصيل العميل"
            : "Unable to load client details"
        }
        description={
          i18n.language === "ar"
            ? "حدث خطأ أثناء تحميل الخدمات أو الموردين المتاحين لهذا الحدث."
            : "An error occurred while loading the available services or vendors for this event."
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {model.isDirty ? (
        <div className="flex justify-end">
          <Badge
            variant="outline"
            className="rounded-full border-[var(--lux-gold-border)] bg-[var(--lux-control-hover)] px-3 py-1 text-xs text-[var(--lux-gold)]"
          >
            {i18n.language === "ar" ? "تغييرات غير محفوظة" : "Unsaved changes"}
          </Badge>
        </div>
      ) : null}

      {model.servicesLoading || model.vendorsLoading ? (
        <div className="flex min-h-[320px] items-center justify-center text-sm text-[var(--lux-text-secondary)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="ms-2">
            {t("common.loading", { defaultValue: "Loading..." })}
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <ChecklistCard
            title={i18n.language === "ar" ? "الخدمات" : "Services"}
            count={model.serviceOptions.length}
            emptyTitle={
              i18n.language === "ar" ? "لا توجد خدمات متاحة" : "No services found"
            }
            emptyDescription={
              i18n.language === "ar"
                ? "لم يتم العثور على خدمات متاحة في كاتالوج النظام."
                : "No available services were found in the catalog."
            }
          >
            {model.serviceOptions.map((service) => (
              (() => {
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
                    ? i18n.language === "ar"
                      ? `الكود: ${service.code}`
                      : `Code: ${service.code}`
                    : i18n.language === "ar"
                      ? "خدمة من كاتالوج النظام"
                      : "Catalog service",
                  !service.isActive
                    ? i18n.language === "ar"
                      ? "غير نشطة"
                      : "Inactive"
                    : i18n.language === "ar"
                      ? "نشطة"
                      : "Active",
                  linkedItem?.notes
                    ? linkedItem.notes
                    : i18n.language === "ar"
                      ? "غير مرتبطة بعد"
                      : "Not linked yet",
                ]}
                isRtl={model.isRtl}
              />
                );
              })()
            ))}
          </ChecklistCard>

          <ChecklistCard
            title={
              i18n.language === "ar"
                ? "الشركات الخارجية / الموردين"
                : "External Companies / Vendors"
            }
            count={model.vendorOptions.length}
            emptyTitle={
              i18n.language === "ar" ? "لا توجد شركات متاحة" : "No vendors found"
            }
            emptyDescription={
              i18n.language === "ar"
                ? "لم يتم العثور على شركات أو موردين متاحين في كاتالوج النظام."
                : "No available companies or vendors were found in the catalog."
            }
          >
            {model.vendorOptions.map((vendor) => (
              (() => {
                const linkedVendor = model.vendorLinksByVendorId.get(vendor.id);
                const displayValue =
                  linkedVendor?.agreedPrice != null
                    ? formatVendorMoney(linkedVendor.agreedPrice)
                    : null;

                return (
              <ChecklistRow
                key={vendor.id}
                checked={vendor.selected}
                disabled={isBusy}
                onCheckedChange={(checked) =>
                  model.toggleVendor(vendor.id, checked)
                }
                title={vendor.name}
                subtitle={vendor.typeLabel}
                description={vendor.description}
                value={displayValue}
                meta={[
                  vendor.contactPerson
                    ? i18n.language === "ar"
                      ? `المسؤول: ${vendor.contactPerson}`
                      : `Contact: ${vendor.contactPerson}`
                    : i18n.language === "ar"
                      ? "شركة من كاتالوج النظام"
                      : "Catalog vendor",
                  vendor.phone
                    ? i18n.language === "ar"
                      ? `الهاتف: ${vendor.phone}`
                      : `Phone: ${vendor.phone}`
                    : !vendor.isActive
                      ? i18n.language === "ar"
                      ? "غير نشط"
                      : "Inactive"
                      : i18n.language === "ar"
                        ? "نشط"
                        : "Active",
                  linkedVendor?.notes
                    ? linkedVendor.notes
                    : i18n.language === "ar"
                      ? "غير مرتبط بعد"
                      : "Not linked yet",
                ]}
                isRtl={model.isRtl}
              />
                );
              })()
            ))}
          </ChecklistCard>
        </div>
      )}

      {(model.linkedCatalogOnlyCounts.manualServices > 0 ||
        model.linkedCatalogOnlyCounts.manualVendors > 0) && (
        <p className="text-xs leading-5 text-[var(--lux-text-muted)]">
          {i18n.language === "ar"
            ? `العناصر اليدوية غير المرتبطة بكاتالوج النظام ستبقى كما هي: ${model.linkedCatalogOnlyCounts.manualServices} خدمة و ${model.linkedCatalogOnlyCounts.manualVendors} مورد.`
            : `Manual items not linked to the system catalog remain unchanged: ${model.linkedCatalogOnlyCounts.manualServices} services and ${model.linkedCatalogOnlyCounts.manualVendors} vendors.`}
        </p>
      )}

      <div className="border-t border-[var(--lux-row-border)] pt-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
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
            {saveLabel}
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
            {createQuotationLabel}
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
            {createContractLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
