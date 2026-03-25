import { format } from "date-fns";
import type { Locale } from "date-fns";
import { Link2, Plus } from "lucide-react";
import type { ReactNode } from "react";
import type { TFunction } from "i18next";

import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ContractStatusBadge } from "@/pages/contracts/_components/contractStatusBadge";
import { getContractDisplayNumber } from "@/pages/contracts/adapters";
import type { Contract } from "@/pages/contracts/types";
import { QuotationStatusBadge } from "@/pages/quotations/_components/quotationStatusBadge";
import { getQuotationDisplayNumber } from "@/pages/quotations/adapters";
import type { Quotation } from "@/pages/quotations/types";
import { formatMoney } from "@/pages/services/adapters";
import {
  EventEmptyState,
  EventInfoBlock,
  EventPanelCard,
} from "./EventDetailsPrimitives";

function StatBlock({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return <EventInfoBlock label={label} value={value} compact />;
}

type Props = {
  quotations: Quotation[];
  quotationsLoading: boolean;
  quotationSummary: { itemsCount: number; totalAmount: number };
  contracts: Contract[];
  contractsLoading: boolean;
  contractSummary: { itemsCount: number; totalAmount: number };
  dateLocale: Locale;
  t: TFunction;
  onCreateQuotation: () => void;
  onCreateQuotationFromEvent: () => void;
  onViewQuotation: (quotationId: number) => void;
  onCreateContract: () => void;
  onCreateContractFromQuotation: () => void;
  onViewContract: (contractId: number) => void;
};

type DocumentPanelProps = {
  title: string;
  description: string;
  summaryBlocks: ReactNode;
  loading: boolean;
  emptyTitle: string;
  emptyDescription: string;
  primaryAction: ReactNode;
  secondaryAction: ReactNode;
  children: ReactNode;
};

function DocumentPanel({
  title,
  description,
  summaryBlocks,
  loading,
  emptyTitle,
  emptyDescription,
  primaryAction,
  secondaryAction,
  children,
}: DocumentPanelProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1.5">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {secondaryAction}
            {primaryAction}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {summaryBlocks}
        {loading ? (
          <EventEmptyState
            title="Loading..."
            description="Loading linked documents for this event."
          />
        ) : children ? (
          children
        ) : (
          <EventEmptyState title={emptyTitle} description={emptyDescription} />
        )}
      </CardContent>
    </Card>
  );
}

export function EventBusinessDocsPanels({
  quotations,
  quotationsLoading,
  quotationSummary,
  contracts,
  contractsLoading,
  contractSummary,
  dateLocale,
  t,
  onCreateQuotation,
  onCreateQuotationFromEvent,
  onViewQuotation,
  onCreateContract,
  onCreateContractFromQuotation,
  onViewContract,
}: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <DocumentPanel
        title={t("events.quotations", { defaultValue: "Quotations" })}
        description={t("events.quotationsHint", {
          defaultValue:
            "Review linked quotations and move quickly into quotation workflows for this event.",
        })}
        loading={quotationsLoading}
        emptyTitle={t("events.noQuotationsTitle", {
          defaultValue: "No quotations yet",
        })}
        emptyDescription={t("events.noQuotations", {
          defaultValue: "No quotations have been created for this event yet.",
        })}
        secondaryAction={
          <ProtectedComponent permission="quotations.create">
            <Button variant="outline" onClick={onCreateQuotation}>
              <Plus className="h-4 w-4" />
              {t("quotations.create", { defaultValue: "Create Quotation" })}
            </Button>
          </ProtectedComponent>
        }
        primaryAction={
          <ProtectedComponent permission="quotations.create">
            <Button onClick={onCreateQuotationFromEvent}>
              <Plus className="h-4 w-4" />
              {t("quotations.createFromEvent", {
                defaultValue: "Create From Event",
              })}
            </Button>
          </ProtectedComponent>
        }
        summaryBlocks={
          quotations.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <StatBlock
                label={t("events.quotationCount", {
                  defaultValue: "Quotation Count",
                })}
                value={quotationSummary.itemsCount}
              />
              <StatBlock
                label={t("events.quotationTotalAmount", {
                  defaultValue: "Quoted Total",
                })}
                value={formatMoney(quotationSummary.totalAmount)}
              />
            </div>
          ) : null
        }
      >
        {quotations.length > 0 ? (
          <div className="space-y-3">
            {quotations.map((quotation) => (
              <EventPanelCard key={quotation.id} className="space-y-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold text-[var(--lux-heading)]">
                        {getQuotationDisplayNumber(quotation)}
                      </p>
                      <QuotationStatusBadge status={quotation.status} />
                    </div>
                    <p className="text-sm text-[var(--lux-text-secondary)]">
                      {quotation.customer?.fullName ||
                        t("events.noQuotationParty", {
                          defaultValue: "No customer linked",
                        })}
                    </p>
                  </div>
                  <ProtectedComponent permission="quotations.read">
                    <Button
                      variant="outline"
                      onClick={() => onViewQuotation(quotation.id)}
                    >
                      <Link2 className="h-4 w-4" />
                      {t("events.viewQuotation", {
                        defaultValue: "View Quotation",
                      })}
                    </Button>
                  </ProtectedComponent>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <StatBlock
                    label={t("quotations.issueDate", {
                      defaultValue: "Issue Date",
                    })}
                    value={format(new Date(quotation.issueDate), "PPP", {
                      locale: dateLocale,
                    })}
                  />
                  <StatBlock
                    label={t("quotations.validUntil", {
                      defaultValue: "Valid Until",
                    })}
                    value={
                      quotation.validUntil
                        ? format(new Date(quotation.validUntil), "PPP", {
                            locale: dateLocale,
                          })
                        : "-"
                    }
                  />
                  <StatBlock
                    label={t("quotations.subtotal", {
                      defaultValue: "Subtotal",
                    })}
                    value={formatMoney(quotation.subtotal)}
                  />
                  <StatBlock
                    label={t("quotations.totalAmount", {
                      defaultValue: "Total Amount",
                    })}
                    value={formatMoney(quotation.totalAmount)}
                  />
                </div>
              </EventPanelCard>
            ))}
          </div>
        ) : null}
      </DocumentPanel>

      <DocumentPanel
        title={t("events.contracts", { defaultValue: "Contracts" })}
        description={t("events.contractsHint", {
          defaultValue:
            "Review linked contracts and move quickly into contract workflows for this event.",
        })}
        loading={contractsLoading}
        emptyTitle={t("events.noContractsTitle", {
          defaultValue: "No contracts yet",
        })}
        emptyDescription={t("events.noContracts", {
          defaultValue: "No contracts have been created for this event yet.",
        })}
        secondaryAction={
          <ProtectedComponent permission="contracts.create">
            <Button variant="outline" onClick={onCreateContract}>
              <Plus className="h-4 w-4" />
              {t("contracts.create", { defaultValue: "Create Contract" })}
            </Button>
          </ProtectedComponent>
        }
        primaryAction={
          <ProtectedComponent permission="contracts.create">
            <Button onClick={onCreateContractFromQuotation}>
              <Plus className="h-4 w-4" />
              {t("contracts.createFromQuotation", {
                defaultValue: "Create From Quotation",
              })}
            </Button>
          </ProtectedComponent>
        }
        summaryBlocks={
          contracts.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <StatBlock
                label={t("events.contractCount", {
                  defaultValue: "Contract Count",
                })}
                value={contractSummary.itemsCount}
              />
              <StatBlock
                label={t("events.contractTotalAmount", {
                  defaultValue: "Contracted Total",
                })}
                value={formatMoney(contractSummary.totalAmount)}
              />
            </div>
          ) : null
        }
      >
        {contracts.length > 0 ? (
          <div className="space-y-3">
            {contracts.map((contract) => (
              <EventPanelCard key={contract.id} className="space-y-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold text-[var(--lux-heading)]">
                        {getContractDisplayNumber(contract)}
                      </p>
                      <ContractStatusBadge status={contract.status} />
                    </div>
                    <p className="text-sm text-[var(--lux-text-secondary)]">
                      {contract.customer?.fullName ||
                        t("events.noContractParty", {
                          defaultValue: "No customer linked",
                        })}
                    </p>
                  </div>
                  <ProtectedComponent permission="contracts.read">
                    <Button
                      variant="outline"
                      onClick={() => onViewContract(contract.id)}
                    >
                      <Link2 className="h-4 w-4" />
                      {t("events.viewContract", {
                        defaultValue: "View Contract",
                      })}
                    </Button>
                  </ProtectedComponent>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <StatBlock
                    label={t("contracts.signedDate", {
                      defaultValue: "Signed Date",
                    })}
                    value={format(new Date(contract.signedDate), "PPP", {
                      locale: dateLocale,
                    })}
                  />
                  <StatBlock
                    label={t("contracts.eventDate", {
                      defaultValue: "Event Date",
                    })}
                    value={
                      contract.eventDate
                        ? format(new Date(contract.eventDate), "PPP", {
                            locale: dateLocale,
                          })
                        : "-"
                    }
                  />
                  <StatBlock
                    label={t("contracts.subtotal", {
                      defaultValue: "Subtotal",
                    })}
                    value={formatMoney(contract.subtotal)}
                  />
                  <StatBlock
                    label={t("contracts.totalAmount", {
                      defaultValue: "Total Amount",
                    })}
                    value={formatMoney(contract.totalAmount)}
                  />
                </div>
              </EventPanelCard>
            ))}
          </div>
        ) : null}
      </DocumentPanel>
    </div>
  );
}
