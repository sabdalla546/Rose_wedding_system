import { CheckCircle2, CircleDashed } from "lucide-react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EventStatusBadge } from "@/pages/events/_components/eventStatusBadge";
import type { Event } from "@/pages/events/types";
import { EventServiceStatusBadge } from "@/pages/services/_components/eventServiceStatusBadge";
import {
  formatMoney,
  formatServiceCategory,
  getEventServiceDisplayName,
  toNumberValue,
} from "@/pages/services/adapters";
import type { EventServiceItem } from "@/pages/services/types";
import { EventVendorStatusBadge } from "@/pages/vendors/_components/eventVendorStatusBadge";
import {
  formatVendorType,
  getEventVendorDisplayName,
} from "@/pages/vendors/adapters";
import type { EventVendorLink } from "@/pages/vendors/types";
import {
  EventEmptyState,
  EventMetricTile,
  EventPanelCard,
} from "@/pages/events/_components/EventDetailsPrimitives";

type Props = {
  event: Event;
  services: EventServiceItem[];
  vendors: EventVendorLink[];
  t: TFunction;
  readiness: {
    ready: number;
    total: number;
    percent: number | null;
  };
};

const isServiceReady = (status: EventServiceItem["status"]) =>
  status === "confirmed" || status === "completed";

const isVendorReady = (status: EventVendorLink["status"]) =>
  status === "approved" || status === "confirmed";

export function EventExecutionPanel({
  event,
  services,
  vendors,
  t,
  readiness,
}: Props) {
  const { i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";

  return (
    <div dir={i18n.dir()} className="space-y-6">
      <Card>
        <CardHeader className={isRtl ? "text-right" : "text-left"}>
          <CardTitle>
            {t("events.executionTab", { defaultValue: "Execution" })}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <EventMetricTile
              label={t("events.currentEventStatus", {
                defaultValue: "Current Event Status",
              })}
              value={
                <div
                  className={`flex flex-wrap items-center gap-2 ${
                    isRtl ? "justify-end" : "justify-start"
                  }`}
                >
                  <span>
                    {t(`events.status.${event.status}`, {
                      defaultValue: event.status,
                    })}
                  </span>
                  <EventStatusBadge status={event.status} />
                </div>
              }
            />

            <EventMetricTile
              label={t("events.executionReadiness", {
                defaultValue: "Execution Readiness",
              })}
              value={
                readiness.percent === null
                  ? t("events.noOperationalReadinessData", {
                      defaultValue: "No execution checkpoints yet",
                    })
                  : `${readiness.percent}%`
              }
              helper={t("events.executionReadinessHint", {
                defaultValue:
                  "{{ready}} of {{total}} execution checkpoints are currently in a ready state.",
                ready: readiness.ready,
                total: readiness.total,
              })}
            />

            <EventMetricTile
              label={t("events.executionCoverage", {
                defaultValue: "Operational Coverage",
              })}
              value={`${services.length} / ${vendors.length}`}
              helper={t("events.executionCoverageHint", {
                defaultValue:
                  "Services / vendors currently tracked for this wedding.",
              })}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader className={isRtl ? "text-right" : "text-left"}>
            <CardTitle>
              {t("services.eventServices", { defaultValue: "Event Services" })}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            {services.length ? (
              services.map((service) => {
                const quantityValue = toNumberValue(service.quantity);
                const unitPriceValue = toNumberValue(service.unitPrice);
                const resolvedTotal =
                  toNumberValue(service.totalPrice) ??
                  (quantityValue !== null && unitPriceValue !== null
                    ? Number((quantityValue * unitPriceValue).toFixed(3))
                    : null);

                return (
                  <EventPanelCard key={service.id} className="space-y-3 p-4">
                    <div
                      className={`flex flex-wrap items-center justify-between gap-3 ${
                        isRtl ? "text-right" : "text-left"
                      }`}
                    >
                      <div className="space-y-1">
                        <h4
                          dir="auto"
                          className="font-semibold text-[var(--lux-heading)]"
                        >
                          {getEventServiceDisplayName(service)}
                        </h4>
                        <p className="text-xs text-[var(--lux-text-secondary)]">
                          {t(`services.category.${service.category}`, {
                            defaultValue: formatServiceCategory(
                              service.category,
                            ),
                          })}
                        </p>
                      </div>
                      <EventServiceStatusBadge status={service.status} />
                    </div>

                    <div
                      className={`grid gap-2 text-sm text-[var(--lux-text-secondary)] ${
                        isRtl ? "text-right" : "text-left"
                      }`}
                    >
                      <p>
                        {t("services.quantity", { defaultValue: "Quantity" })}:{" "}
                        {quantityValue ?? "-"}
                      </p>
                      <p>
                        {t("services.totalAmount", { defaultValue: "Total" })}:{" "}
                        {formatMoney(resolvedTotal)}
                      </p>
                      <div
                        className={`flex items-center gap-2 ${
                          isRtl ? "justify-end" : "justify-start"
                        }`}
                      >
                        {isServiceReady(service.status) ? (
                          <CheckCircle2 className="h-4 w-4 text-[var(--color-success)]" />
                        ) : (
                          <CircleDashed className="h-4 w-4 text-[var(--lux-text-muted)]" />
                        )}
                        <span>
                          {isServiceReady(service.status)
                            ? t("events.executionReadyLine", {
                                defaultValue: "Ready for execution",
                              })
                            : t("events.executionPendingLine", {
                                defaultValue:
                                  "Needs follow-up before execution",
                              })}
                        </span>
                      </div>
                    </div>
                  </EventPanelCard>
                );
              })
            ) : (
              <EventEmptyState
                title={t("services.noEventServicesTitle", {
                  defaultValue: "No service items yet",
                })}
                description={t("services.noEventServices", {
                  defaultValue:
                    "No service items have been added to this event yet.",
                })}
                className="py-7"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className={isRtl ? "text-right" : "text-left"}>
            <CardTitle>
              {t("vendors.eventVendors", { defaultValue: "Event Vendors" })}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            {vendors.length ? (
              vendors.map((vendor) => (
                <EventPanelCard key={vendor.id} className="space-y-3 p-4">
                  <div
                    className={`flex flex-wrap items-center justify-between gap-3 ${
                      isRtl ? "text-right" : "text-left"
                    }`}
                  >
                    <div className="space-y-1">
                      <h4
                        dir="auto"
                        className="font-semibold text-[var(--lux-heading)]"
                      >
                        {getEventVendorDisplayName(vendor)}
                      </h4>
                      <p className="text-xs text-[var(--lux-text-secondary)]">
                        {t(`vendors.type.${vendor.vendorType}`, {
                          defaultValue: formatVendorType(vendor.vendorType),
                        })}
                      </p>
                    </div>
                    <EventVendorStatusBadge status={vendor.status} />
                  </div>

                  <div
                    className={`grid gap-2 text-sm text-[var(--lux-text-secondary)] ${
                      isRtl ? "text-right" : "text-left"
                    }`}
                  >
                    <p>
                      {t("vendors.pricingPlans.name", {
                        defaultValue: "Pricing Plan",
                      })}
                      : {vendor.resolvedPricingLabel || "-"}
                    </p>
                    <p>
                      {t("vendors.selectedSubServicesCount", {
                        defaultValue: "Selected Count",
                      })}
                      : {vendor.selectedSubServicesCount}
                    </p>
                    <p>
                      {t("vendors.agreedPrice", {
                        defaultValue: "Agreed Price",
                      })}
                      : {formatMoney(vendor.agreedPrice)}
                    </p>
                    <div
                      className={`flex items-center gap-2 ${
                        isRtl ? "justify-end" : "justify-start"
                      }`}
                    >
                      {isVendorReady(vendor.status) ? (
                        <CheckCircle2 className="h-4 w-4 text-[var(--color-success)]" />
                      ) : (
                        <CircleDashed className="h-4 w-4 text-[var(--lux-text-muted)]" />
                      )}
                      <span>
                        {isVendorReady(vendor.status)
                          ? t("events.executionReadyLine", {
                              defaultValue: "Ready for execution",
                            })
                          : t("events.executionPendingLine", {
                              defaultValue: "Needs follow-up before execution",
                            })}
                      </span>
                    </div>
                  </div>
                </EventPanelCard>
              ))
            ) : (
              <EventEmptyState
                title={t("vendors.noEventVendorsTitle", {
                  defaultValue: "No vendor assignments yet",
                })}
                description={t("vendors.noEventVendors", {
                  defaultValue:
                    "Add the first vendor assignment to capture company ownership, selected sub-services, and pricing for this event.",
                })}
                className="py-7"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
