import { format } from "date-fns";
import type { Locale } from "date-fns";
import {
  ClipboardList,
  Edit,
  FileSignature,
  FileText,
  Plus,
  Sparkles,
  Truck,
} from "lucide-react";
import type { TFunction } from "i18next";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContractStatusBadge } from "@/pages/contracts/_components/contractStatusBadge";
import { getContractDisplayNumber } from "@/pages/contracts/adapters";
import type { Contract } from "@/pages/contracts/types";
import { QuotationStatusBadge } from "@/pages/quotations/_components/quotationStatusBadge";
import { getQuotationDisplayNumber } from "@/pages/quotations/adapters";
import type { Quotation } from "@/pages/quotations/types";
import { EventMetricTile } from "./EventDetailsPrimitives";

type Props = {
  t: TFunction;
  dateLocale: Locale;
  servicesCount: number;
  vendorsCount: number;
  latestQuotation: Quotation | null;
  latestContract: Contract | null;
  readiness: {
    ready: number;
    total: number;
    percent: number | null;
    servicesReady: number;
    servicesTotal: number;
    vendorsReady: number;
    vendorsTotal: number;
    sectionsReady: number;
    sectionsTotal: number;
  };
  onAddService: () => void;
  onAssignVendor: () => void;
  onEditEvent: () => void;
  onCreateQuotation: () => void;
  onCreateContract: () => void;
};

function MetricValue({
  title,
  subtitle,
  badge,
}: {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span>{title}</span>
        {badge}
      </div>
      {subtitle ? (
        <p className="text-xs leading-5 text-[var(--lux-text-secondary)]">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

export function EventWorkspaceSummary({
  t,
  dateLocale,
  servicesCount,
  vendorsCount,
  latestQuotation,
  latestContract,
  readiness,
  onAddService,
  onAssignVendor,
  onEditEvent,
  onCreateQuotation,
  onCreateContract,
}: Props) {
  const { i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  const latestQuotationDate = latestQuotation?.issueDate
    ? format(new Date(latestQuotation.issueDate), "PPP", {
        locale: dateLocale,
      })
    : null;
  const latestContractDate = latestContract?.signedDate
    ? format(new Date(latestContract.signedDate), "PPP", {
        locale: dateLocale,
      })
    : null;
  const readinessLabel =
    readiness.percent === null
      ? t("events.noOperationalReadinessData", {
          defaultValue: "No execution checkpoints yet",
        })
      : `${readiness.percent}%`;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="gap-4 border-b border-[var(--lux-row-border)]">
        <div
          className={`flex flex-col gap-4 xl:items-start xl:justify-between ${
            "xl:flex-row"
          }`}
        >
          <div className="space-y-2">
            <p
              className={`text-[11px] font-semibold text-[var(--lux-text-muted)] ${
                isRtl ? "tracking-normal text-right" : "uppercase tracking-[0.18em] text-left"
              }`}
            >
              {t("events.operationsWorkspace", {
                defaultValue: "Operations Workspace",
              })}
            </p>
            <CardTitle className="text-2xl text-[var(--lux-heading)]">
              {t("events.operationsWorkspaceTitle", {
                defaultValue: "Wedding Operations Hub",
              })}
            </CardTitle>
            <p className="max-w-3xl text-sm leading-7 text-[var(--lux-text-secondary)]">
              {t("events.operationsWorkspaceHint", {
                defaultValue:
                  "Run service planning, external vendors, quotations, contracts, and execution follow-up from one event workspace.",
              })}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <ProtectedComponent permission="events.update">
              <Button variant="outline" onClick={onEditEvent}>
                <Edit className="h-4 w-4" />
                {t("common.edit", { defaultValue: "Edit" })}
              </Button>
            </ProtectedComponent>
            <ProtectedComponent permission="events.update">
              <Button variant="outline" onClick={onAddService}>
                <Plus className="h-4 w-4" />
                {t("services.addEventService", {
                  defaultValue: "Add Event Service",
                })}
              </Button>
            </ProtectedComponent>
            <ProtectedComponent permission="events.update">
              <Button variant="outline" onClick={onAssignVendor}>
                <Truck className="h-4 w-4" />
                {t("vendors.assignVendor", { defaultValue: "Assign Vendor" })}
              </Button>
            </ProtectedComponent>
            <ProtectedComponent permission="quotations.create">
              <Button variant="outline" onClick={onCreateQuotation}>
                <FileText className="h-4 w-4" />
                {t("quotations.createFromEvent", {
                  defaultValue: "Create Quotation",
                })}
              </Button>
            </ProtectedComponent>
            <ProtectedComponent permission="contracts.create">
              <Button onClick={onCreateContract}>
                <FileSignature className="h-4 w-4" />
                {t("contracts.create", { defaultValue: "Create Contract" })}
              </Button>
            </ProtectedComponent>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <EventMetricTile
            label={t("events.totalServiceItems", {
              defaultValue: "Total Service Items",
            })}
            value={
              <MetricValue
                title={`${servicesCount}`}
                subtitle={t("events.totalServiceItemsHint", {
                  defaultValue:
                    "Internal service lines currently linked to this event.",
                })}
              />
            }
            className="min-h-[160px]"
          />
          <EventMetricTile
            label={t("events.totalExternalVendors", {
              defaultValue: "Total External Vendors",
            })}
            value={
              <MetricValue
                title={`${vendorsCount}`}
                subtitle={t("events.totalExternalVendorsHint", {
                  defaultValue:
                    "Assigned vendor links and external production partners.",
                })}
              />
            }
            className="min-h-[160px]"
          />
          <EventMetricTile
            label={t("events.quotationSnapshot", {
              defaultValue: "Quotation Snapshot",
            })}
            value={
              latestQuotation ? (
                <MetricValue
                  title={getQuotationDisplayNumber(latestQuotation)}
                  subtitle={[
                    latestQuotationDate,
                    latestQuotation.totalAmount !== null &&
                    typeof latestQuotation.totalAmount !== "undefined"
                      ? `${t("quotations.totalAmount", {
                          defaultValue: "Total Amount",
                        })}: ${latestQuotation.totalAmount}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" / ")}
                  badge={<QuotationStatusBadge status={latestQuotation.status} />}
                />
              ) : (
                <MetricValue
                  title={t("events.noQuotationsTitle", {
                    defaultValue: "No quotations yet",
                  })}
                  subtitle={t("events.noQuotations", {
                    defaultValue:
                      "No quotations have been created for this event yet.",
                  })}
                />
              )
            }
            className="min-h-[160px]"
          />
          <EventMetricTile
            label={t("events.contractSnapshot", {
              defaultValue: "Contract Snapshot",
            })}
            value={
              latestContract ? (
                <MetricValue
                  title={getContractDisplayNumber(latestContract)}
                  subtitle={[
                    latestContractDate,
                    latestContract.totalAmount !== null &&
                    typeof latestContract.totalAmount !== "undefined"
                      ? `${t("contracts.totalAmount", {
                          defaultValue: "Total Amount",
                        })}: ${latestContract.totalAmount}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" / ")}
                  badge={<ContractStatusBadge status={latestContract.status} />}
                />
              ) : (
                <MetricValue
                  title={t("events.noContractsTitle", {
                    defaultValue: "No contracts yet",
                  })}
                  subtitle={t("events.noContracts", {
                    defaultValue:
                      "No contracts have been created for this event yet.",
                  })}
                />
              )
            }
            className="min-h-[160px]"
          />
          <EventMetricTile
            label={t("events.operationalReadiness", {
              defaultValue: "Operational Readiness",
            })}
            value={
              <MetricValue
                title={readinessLabel}
                subtitle={t("events.operationalReadinessHint", {
                  defaultValue:
                    "{{ready}} of {{total}} checkpoints are currently ready across services, vendors, and execution sections.",
                  ready: readiness.ready,
                  total: readiness.total,
                })}
                badge={<Sparkles className="h-4 w-4 text-[var(--lux-gold)]" />}
              />
            }
            helper={
              <span className="inline-flex items-center gap-2 text-xs leading-5 text-[var(--lux-text-secondary)]">
                <ClipboardList className="h-3.5 w-3.5" />
                {t("events.operationalReadinessBreakdown", {
                  defaultValue:
                    "Services {{servicesReady}}/{{servicesTotal}} / Vendors {{vendorsReady}}/{{vendorsTotal}} / Sections {{sectionsReady}}/{{sectionsTotal}}",
                  servicesReady: readiness.servicesReady,
                  servicesTotal: readiness.servicesTotal,
                  vendorsReady: readiness.vendorsReady,
                  vendorsTotal: readiness.vendorsTotal,
                  sectionsReady: readiness.sectionsReady,
                  sectionsTotal: readiness.sectionsTotal,
                })}
              </span>
            }
            className="min-h-[160px]"
          />
        </div>
      </CardContent>
    </Card>
  );
}
