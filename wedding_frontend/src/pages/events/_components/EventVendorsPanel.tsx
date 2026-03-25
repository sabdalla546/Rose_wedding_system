import { Pencil, Plus, Trash2 } from "lucide-react";
import type { TFunction } from "i18next";

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
} from "./EventDetailsPrimitives";

type Props = {
  vendorLinks: EventVendorLink[];
  loading: boolean;
  expandedVendorIds: number[];
  t: TFunction;
  onAdd: () => void;
  onEdit: (vendorLink: EventVendorLink) => void;
  onDelete: (vendorLink: EventVendorLink) => void;
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
  t,
  onAdd,
  onEdit,
  onDelete,
  onToggleExpanded,
}: Props) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1.5">
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
        <ProtectedComponent permission="events.update">
          <Button onClick={onAdd}>
            <Plus className="h-4 w-4" />
            {t("vendors.assignVendor", { defaultValue: "Assign Vendor" })}
          </Button>
        </ProtectedComponent>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <EventEmptyState
            title={t("common.loading", { defaultValue: "Loading..." })}
            description={t("vendors.loadingEventVendors", {
              defaultValue: "Loading vendor assignments for this event.",
            })}
          />
        ) : vendorLinks.length ? (
          vendorLinks.map((vendorLink) => {
            const displayName =
              vendorLink.resolvedCompanyName ||
              getEventVendorDisplayName(vendorLink);
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
                <div className="flex flex-col gap-4 border-b border-[var(--lux-row-border)] px-4 py-4 sm:px-5 sm:py-5 xl:flex-row xl:items-start xl:justify-between">
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
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
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
                            label={t("vendors.providedByLabel", {
                              defaultValue: "Provided By",
                            })}
                            value={t(`vendors.providedBy.${vendorLink.providedBy}`, {
                              defaultValue: vendorLink.providedBy,
                            })}
                          />
                          <EventMetaChip
                            label={t("common.contact", { defaultValue: "Contact" })}
                            value={vendorContact}
                            className="max-w-full"
                          />
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                        <SummaryItem
                          label={t("vendors.pricingPlans.name", {
                            defaultValue: "Pricing Plan",
                          })}
                          value={
                            vendorLink.resolvedPricingLabel ||
                            (vendorLink.selectedSubServicesCount > 0
                              ? t("vendors.noMatchingPricingPlan", {
                                  defaultValue: "No matching pricing plan",
                                })
                              : t("vendors.noPricingPlan", {
                                  defaultValue: "No pricing plan selected",
                                }))
                          }
                        />
                        <SummaryItem
                          label={t("vendors.selectedSubServicesCount", {
                            defaultValue: "Selected Count",
                          })}
                          value={vendorLink.selectedSubServicesCount}
                        />
                        <SummaryItem
                          label={t("vendors.agreedPrice", {
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
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
                      {t("vendors.selectedSubServices", {
                        defaultValue: "Selected Sub Services",
                      })}
                    </p>
                    <EventMetaChip
                      label={t("vendors.selectedSubServicesCount", {
                        defaultValue: "Selected",
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
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
                        {t("common.notes", { defaultValue: "Notes" })}
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--lux-text-secondary)]">
                        {vendorLink.notes}
                      </p>
                    </div>
                  </div>
                ) : null}

                <ProtectedComponent permission="events.update">
                  <div className="flex flex-wrap gap-2 border-t border-[var(--lux-row-border)] px-4 py-4 sm:px-5">
                    <Button variant="outline" onClick={() => onEdit(vendorLink)}>
                      <Pencil className="h-4 w-4" />
                      {t("common.edit", { defaultValue: "Edit" })}
                    </Button>
                    <Button variant="destructive" onClick={() => onDelete(vendorLink)}>
                      <Trash2 className="h-4 w-4" />
                      {t("common.delete", { defaultValue: "Delete" })}
                    </Button>
                  </div>
                </ProtectedComponent>
              </EventPanelCard>
            );
          })
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
