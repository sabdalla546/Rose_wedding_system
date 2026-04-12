import { Pencil, Plus, Trash2 } from "lucide-react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EventVendorStatusBadge } from "@/pages/vendors/_components/eventVendorStatusBadge";
import {
  formatMoney,
  formatVendorType,
  getEventVendorDisplayName,
} from "@/pages/vendors/adapters";
import type { EventVendorLink } from "@/pages/vendors/types";
import {
  EventEmptyState,
  EventInfoBlock,
  EventMetaChip,
  EventPanelCard,
  EventViewToggle,
  type EventPanelViewMode,
} from "./EventDetailsPrimitives";

type Props = {
  vendorLinks: EventVendorLink[];
  loading: boolean;
  expandedVendorIds: number[];
  viewMode: EventPanelViewMode;
  t: TFunction;
  onViewModeChange: (nextValue: EventPanelViewMode) => void;
  onAdd: () => void;
  onEdit?: (vendorLink: EventVendorLink) => void;
  onDelete?: (vendorLink: EventVendorLink) => void;
  onToggleExpanded: (vendorId: number) => void;
};

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return <EventInfoBlock label={label} value={value} compact />;
}

export function EventVendorsPanel({
  vendorLinks,
  loading,
  expandedVendorIds,
  viewMode,
  t,
  onViewModeChange,
  onAdd,
  onEdit,
  onDelete,
  onToggleExpanded,
}: Props) {
  const { i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  const hasRowActions = Boolean(onEdit || onDelete);
  const vendorSummary = {
    itemsCount: vendorLinks.length,
    confirmedCount: vendorLinks.filter(
      (vendorLink) =>
        vendorLink.status === "approved" || vendorLink.status === "confirmed",
    ).length,
    totalAgreedPrice: vendorLinks.reduce((total, vendorLink) => {
      const price =
        typeof vendorLink.agreedPrice === "undefined" || vendorLink.agreedPrice === null
          ? 0
          : Number(vendorLink.agreedPrice);

      return Number.isFinite(price) ? total + price : total;
    }, 0),
  };

  return (
    <Card dir={i18n.dir()}>
      <CardHeader
        className={`flex flex-col gap-4 md:items-center md:justify-between ${
          "md:flex-row"
        }`}
      >
        <div className={isRtl ? "space-y-1.5 text-right" : "space-y-1.5 text-left"}>
          <CardTitle>
            {t("vendors.eventVendors", { defaultValue: "Event Vendors" })}
          </CardTitle>
          <CardDescription>
            {t("vendors.eventVendorsHint", {
              defaultValue:
                "Track which company or client is responsible for each vendor category in this event.",
            })}
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <EventViewToggle
            value={viewMode}
            onChange={onViewModeChange}
            tableLabel={t("events.tableView", { defaultValue: "Table" })}
            gridLabel={t("events.gridView", { defaultValue: "Grid" })}
          />
          <ProtectedComponent permission="events.update">
            <Button onClick={onAdd}>
              <Plus className="h-4 w-4" />
              {t("vendors.assignVendor", { defaultValue: "Assign Vendor" })}
            </Button>
          </ProtectedComponent>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryItem
            label={t("events.totalExternalVendors", {
              defaultValue: "Total External Vendors",
            })}
            value={vendorSummary.itemsCount}
          />
          <SummaryItem
            label={t("events.readyExternalVendors", {
              defaultValue: "Ready Vendors",
            })}
            value={vendorSummary.confirmedCount}
          />
          <SummaryItem
            label={t("quotations.agreedPrice", { defaultValue: "Agreed Price" })}
            value={formatMoney(vendorSummary.totalAgreedPrice)}
          />
        </div>

        {loading ? (
          <EventEmptyState
            title={t("common.loading", { defaultValue: "Loading..." })}
            description={t("vendors.loadingEventVendors", {
              defaultValue: "Loading vendor assignments for this event.",
            })}
          />
        ) : vendorLinks.length ? (
          viewMode === "table" ? (
            <div className="overflow-hidden rounded-[24px] border border-[var(--lux-row-border)] bg-[var(--lux-row-surface)]">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow className="border-[var(--lux-row-border)]">
                    <TableHead>{t("vendors.resolvedCompanyName", { defaultValue: "Resolved Company / Vendor" })}</TableHead>
                    <TableHead>{t("vendors.typeLabel", { defaultValue: "Vendor Type" })}</TableHead>
                    <TableHead>{t("vendors.selectedSubServices", { defaultValue: "Selected Sub Services" })}</TableHead>
                    <TableHead>{t("vendors.costSummary", { defaultValue: "Cost Summary" })}</TableHead>
                    <TableHead>{t("vendors.assignmentStatusLabel", { defaultValue: "Status" })}</TableHead>
                    {hasRowActions ? (
                      <TableHead>{t("common.actions", { defaultValue: "Actions" })}</TableHead>
                    ) : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendorLinks.map((vendorLink) => {
                    const displayName =
                      vendorLink.resolvedCompanyName ||
                      getEventVendorDisplayName(vendorLink);

                    return (
                      <TableRow key={vendorLink.id} className="border-[var(--lux-row-border)]">
                        <TableCell className="align-top">
                          <div className="space-y-1">
                            <div className="font-medium text-[var(--lux-heading)]">
                              {displayName}
                            </div>
                            {vendorLink.notes ? (
                              <div className="max-w-[320px] text-xs text-[var(--lux-text-secondary)]">
                                {vendorLink.notes}
                              </div>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="align-top text-[var(--lux-text-secondary)]">
                          {t(`vendors.type.${vendorLink.vendorType}`, {
                            defaultValue: formatVendorType(vendorLink.vendorType),
                          })}
                        </TableCell>
                        <TableCell className="align-top text-[var(--lux-text-secondary)]">
                          {(vendorLink.selectedSubServices ?? []).length
                            ? (vendorLink.selectedSubServices ?? [])
                                .map((selectedSubService) => selectedSubService.nameSnapshot)
                                .join(" / ")
                            : t("vendors.noSelectedSubServicesTitle", {
                                defaultValue: "No sub-services selected",
                              })}
                        </TableCell>
                        <TableCell className="align-top text-[var(--lux-text-secondary)]">
                          <div className="space-y-1">
                            <div>
                              {t("vendors.agreedPrice", {
                                defaultValue: t("quotations.agreedPrice", { defaultValue: "Agreed Price" }),
                              })}
                              :{" "}
                              {vendorLink.agreedPrice !== null &&
                              typeof vendorLink.agreedPrice !== "undefined"
                                ? formatMoney(vendorLink.agreedPrice)
                                : "-"}
                            </div>
                            <div className="text-xs">
                              {t("vendors.selectedSubServicesCount", {
                                defaultValue: t("quotations.selectedSubServicesCount", { defaultValue: "Selected Count" }),
                              })}
                              : {vendorLink.selectedSubServicesCount}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          <EventVendorStatusBadge status={vendorLink.status} />
                        </TableCell>
                        {hasRowActions ? (
                          <TableCell className="align-top">
                            <ProtectedComponent permission="events.update">
                              <div className="flex flex-wrap gap-2">
                                {onEdit ? (
                                  <Button variant="outline" size="sm" onClick={() => onEdit(vendorLink)}>
                                    <Pencil className="h-4 w-4" />
                                    {t("common.edit", { defaultValue: "Edit" })}
                                  </Button>
                                ) : null}
                                {onDelete ? (
                                  <Button variant="destructive" size="sm" onClick={() => onDelete(vendorLink)}>
                                    <Trash2 className="h-4 w-4" />
                                    {t("common.delete", { defaultValue: "Delete" })}
                                  </Button>
                                ) : null}
                              </div>
                            </ProtectedComponent>
                          </TableCell>
                        ) : null}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            vendorLinks.map((vendorLink) => {
              const displayName =
                vendorLink.resolvedCompanyName || getEventVendorDisplayName(vendorLink);
              const selectedSubServices = vendorLink.selectedSubServices ?? [];
              const vendorContact = vendorLink.vendor
                ? [vendorLink.vendor.contactPerson, vendorLink.vendor.phone]
                    .filter(Boolean)
                    .join(" / ") ||
                  vendorLink.vendor.email ||
                  "-"
                : vendorLink.providedBy === "client"
                  ? t("vendors.clientProvidedVendor", {
                      defaultValue: "Client-provided vendor",
                    })
                  : "-";
              const visibleSubServices = expandedVendorIds.includes(vendorLink.id)
                ? selectedSubServices
                : selectedSubServices.slice(0, 6);

              return (
                <EventPanelCard key={vendorLink.id} className="space-y-0 overflow-hidden p-0">
                  <div
                    className={`flex flex-col gap-4 border-b border-[var(--lux-row-border)] px-4 py-4 sm:px-5 sm:py-5 xl:items-start xl:justify-between ${
                      "xl:flex-row"
                    }`}
                  >
                    <div className="min-w-0 flex-1 space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">
                          {t(`vendors.type.${vendorLink.vendorType}`, {
                            defaultValue: formatVendorType(vendorLink.vendorType),
                          })}
                        </Badge>
                        <Badge variant="secondary">
                          {t(`vendors.providedBy.${vendorLink.providedBy}`, {
                            defaultValue: vendorLink.providedBy,
                          })}
                        </Badge>
                        {vendorLink.hasManualPriceOverride ? (
                          <Badge variant="outline">
                            {t("vendors.manualPriceOverride", {
                              defaultValue: "Manual Price",
                            })}
                          </Badge>
                        ) : null}
                        <EventVendorStatusBadge status={vendorLink.status} />
                      </div>

                      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.85fr)]">
                        <div className="min-w-0 space-y-4">
                          <div className="space-y-1.5">
                            <p
                              className={`text-[11px] font-semibold text-[var(--lux-text-muted)] ${
                                isRtl ? "tracking-normal" : "uppercase tracking-[0.16em]"
                              }`}
                            >
                              {t("vendors.resolvedCompanyName", {
                                defaultValue: "Resolved Company / Vendor",
                              })}
                            </p>
                            <h3 className="break-words text-xl font-semibold leading-8 text-[var(--lux-heading)]">
                              {displayName}
                            </h3>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <EventMetaChip
                              label={t("common.contact", { defaultValue: "Contact" })}
                              value={vendorContact}
                              className="max-w-full"
                            />
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                          <SummaryItem
                            label={t("vendors.selectedSubServicesCount", {
                              defaultValue: t("quotations.selectedSubServicesCount", { defaultValue: "Selected Count" }),
                            })}
                            value={vendorLink.selectedSubServicesCount}
                          />
                          <SummaryItem
                            label={t("quotations.agreedPrice", {
                              defaultValue: "Agreed Price",
                            })}
                            value={
                              vendorLink.agreedPrice !== null &&
                              typeof vendorLink.agreedPrice !== "undefined"
                                ? formatMoney(vendorLink.agreedPrice)
                                : "-"
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 px-4 py-4 sm:px-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p
                        className={`text-[11px] font-semibold text-[var(--lux-text-muted)] ${
                          isRtl ? "tracking-normal" : "uppercase tracking-[0.16em]"
                        }`}
                      >
                        {t("vendors.selectedSubServices", {
                          defaultValue: "Selected Sub Services",
                        })}
                      </p>
                      <EventMetaChip
                        label={t("vendors.selectedSubServicesCount", {
                          defaultValue: t("quotations.selectedSubServicesCount", { defaultValue: "Selected" }),
                        })}
                        value={vendorLink.selectedSubServicesCount}
                      />
                    </div>

                    {selectedSubServices.length ? (
                      <>
                        <div className="flex flex-wrap gap-2">
                          {visibleSubServices.map((selectedSubService) => (
                            <span
                              key={selectedSubService.id}
                              className="rounded-full border border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)] px-3 py-1.5 text-xs text-[var(--lux-text-secondary)]"
                            >
                              {selectedSubService.nameSnapshot}
                            </span>
                          ))}
                        </div>
                        {selectedSubServices.length > 6 ? (
                          <div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-auto px-0 py-0 text-xs text-[var(--lux-text-secondary)]"
                              onClick={() => onToggleExpanded(vendorLink.id)}
                            >
                              {expandedVendorIds.includes(vendorLink.id)
                                ? t("common.showLess", {
                                    defaultValue: "Show less",
                                  })
                                : t("common.showMore", {
                                    defaultValue: "Show all sub-services",
                                  })}
                            </Button>
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <EventEmptyState
                        title={t("vendors.noSelectedSubServicesTitle", {
                          defaultValue: "No sub-services selected",
                        })}
                        description={t("vendors.noSelectedSubServices", {
                          defaultValue:
                            "No sub-services have been selected for this vendor yet.",
                        })}
                        className="py-7"
                      />
                    )}
                  </div>

                  {vendorLink.notes ? (
                    <div className="border-t border-[var(--lux-row-border)] px-4 py-4 sm:px-5">
                      <div className="rounded-[20px] border border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)] px-4 py-3.5">
                        <p
                          className={`text-[11px] font-semibold text-[var(--lux-text-muted)] ${
                            isRtl ? "tracking-normal" : "uppercase tracking-[0.16em]"
                          }`}
                        >
                          {t("common.notes", { defaultValue: "Notes" })}
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--lux-text-secondary)]">
                          {vendorLink.notes}
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {hasRowActions ? (
                    <ProtectedComponent permission="events.update">
                      <div className="flex flex-wrap gap-2 border-t border-[var(--lux-row-border)] px-4 py-4 sm:px-5">
                        {onEdit ? (
                          <Button variant="outline" onClick={() => onEdit(vendorLink)}>
                            <Pencil className="h-4 w-4" />
                            {t("common.edit", { defaultValue: "Edit" })}
                          </Button>
                        ) : null}
                        {onDelete ? (
                          <Button variant="destructive" onClick={() => onDelete(vendorLink)}>
                            <Trash2 className="h-4 w-4" />
                            {t("common.delete", { defaultValue: "Delete" })}
                          </Button>
                        ) : null}
                      </div>
                    </ProtectedComponent>
                  ) : null}
                </EventPanelCard>
              );
            })
          )
        ) : (
          <EventEmptyState
            title={t("vendors.noEventVendorsTitle", {
              defaultValue: "No vendor assignments yet",
            })}
            description={t("vendors.noEventVendors", {
              defaultValue:
                "Add the first vendor assignment to capture company ownership, selected sub-services, and pricing for this event.",
            })}
          />
        )}
      </CardContent>
    </Card>
  );
}
