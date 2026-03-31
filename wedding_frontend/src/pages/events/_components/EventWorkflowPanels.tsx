import { format } from "date-fns";
import type { Locale } from "date-fns";
import { ArrowUpRight, FileSignature, FileText, Plus } from "lucide-react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
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
import { cn } from "@/lib/utils";
import { ContractStatusBadge } from "@/pages/contracts/_components/contractStatusBadge";
import { getContractDisplayNumber } from "@/pages/contracts/adapters";
import type { Contract } from "@/pages/contracts/types";
import { QuotationStatusBadge } from "@/pages/quotations/_components/quotationStatusBadge";
import { formatMoney, getQuotationDisplayNumber } from "@/pages/quotations/adapters";
import type { Quotation } from "@/pages/quotations/types";
import { EventEmptyState, EventMetricTile } from "./EventDetailsPrimitives";

type QuotationProps = {
  quotations: Quotation[];
  loading: boolean;
  latestQuotation: Quotation | null;
  totalAmount: number;
  dateLocale: Locale;
  t: TFunction;
  onCreateQuotation: () => void;
  onCreateQuotationFromEvent: () => void;
  onViewQuotation?: (quotationId: number) => void;
};

type ContractProps = {
  contracts: Contract[];
  loading: boolean;
  latestContract: Contract | null;
  totalAmount: number;
  dateLocale: Locale;
  t: TFunction;
  onCreateContract: () => void;
  onCreateContractFromQuotation: () => void;
  onViewContract?: (contractId: number) => void;
};

export function EventQuotationsPanel({
  quotations,
  loading,
  latestQuotation,
  totalAmount,
  dateLocale,
  t,
  onCreateQuotation,
  onCreateQuotationFromEvent,
  onViewQuotation,
}: QuotationProps) {
  const { i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";

  return (
    <Card>
      <CardHeader
        className={`flex flex-col gap-4 lg:items-start lg:justify-between ${
          isRtl ? "lg:flex-row-reverse" : "lg:flex-row"
        }`}
      >
        <div className={isRtl ? "space-y-1.5 text-right" : "space-y-1.5 text-left"}>
          <CardTitle>{t("events.quotations", { defaultValue: "Quotations" })}</CardTitle>
          <CardDescription>
            {t("events.quotationsHint", {
              defaultValue:
                "Review linked quotations and move quickly into quotation workflows for this event.",
            })}
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <ProtectedComponent permission="quotations.create">
            <Button variant="outline" onClick={onCreateQuotation}>
              <Plus className="h-4 w-4" />
              {t("quotations.create", { defaultValue: "Create Quotation" })}
            </Button>
          </ProtectedComponent>
          <ProtectedComponent permission="quotations.create">
            <Button onClick={onCreateQuotationFromEvent}>
              <FileText className="h-4 w-4" />
              {t("quotations.createFromEvent", {
                defaultValue: "Create From Event",
              })}
            </Button>
          </ProtectedComponent>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-3">
          <EventMetricTile
            label={t("events.quotationCount", {
              defaultValue: "Quotation Count",
            })}
            value={quotations.length}
          />
          <EventMetricTile
            label={t("events.quotationTotalAmount", {
              defaultValue: "Quoted Total",
            })}
            value={formatMoney(totalAmount)}
          />
          <EventMetricTile
            label={t("events.latestQuotation", {
              defaultValue: "Latest Quotation",
            })}
            value={
              latestQuotation ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span>{getQuotationDisplayNumber(latestQuotation)}</span>
                    <QuotationStatusBadge status={latestQuotation.status} />
                  </div>
                  <p className="text-xs leading-5 text-[var(--lux-text-secondary)]">
                    {format(new Date(latestQuotation.issueDate), "PPP", {
                      locale: dateLocale,
                    })}{" "}
                    / {formatMoney(latestQuotation.totalAmount)}
                  </p>
                </div>
              ) : (
                t("events.noQuotationsTitle", {
                  defaultValue: "No quotations yet",
                })
              )
            }
          />
        </div>

        {loading ? (
          <EventEmptyState
            title={t("common.loading", { defaultValue: "Loading..." })}
            description={t("events.loadingQuotations", {
              defaultValue: "Loading quotations for this event.",
            })}
          />
        ) : quotations.length ? (
          <div className="overflow-hidden rounded-[24px] border border-[var(--lux-row-border)] bg-[var(--lux-row-surface)]">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow className="border-[var(--lux-row-border)]">
                  <TableHead>{t("events.quotationSnapshot", { defaultValue: "Quotation" })}</TableHead>
                  <TableHead>{t("events.customer", { defaultValue: "Customer" })}</TableHead>
                  <TableHead>{t("quotations.issueDate", { defaultValue: "Issue Date" })}</TableHead>
                  <TableHead>{t("quotations.totalAmount", { defaultValue: "Total Amount" })}</TableHead>
                  <TableHead>{t("common.status", { defaultValue: "Status" })}</TableHead>
                  <TableHead>{t("common.actions", { defaultValue: "Actions" })}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotations.map((quotation) => (
                  <TableRow key={quotation.id} className="border-[var(--lux-row-border)]">
                    <TableCell className="align-top">
                      <div className="space-y-1">
                        <div className="font-medium text-[var(--lux-heading)]">
                          {getQuotationDisplayNumber(quotation)}
                        </div>
                        <div className="text-xs text-[var(--lux-text-secondary)]">
                          {quotation.notes || "-"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="align-top text-[var(--lux-text-secondary)]">
                      {quotation.customer?.fullName ||
                        t("events.noQuotationParty", {
                          defaultValue: "No customer or lead linked",
                        })}
                    </TableCell>
                    <TableCell className="align-top text-[var(--lux-text-secondary)]">
                      {format(new Date(quotation.issueDate), "PPP", {
                        locale: dateLocale,
                      })}
                    </TableCell>
                    <TableCell className="align-top text-[var(--lux-text-secondary)]">
                      {formatMoney(quotation.totalAmount)}
                    </TableCell>
                    <TableCell className="align-top">
                      <QuotationStatusBadge status={quotation.status} />
                    </TableCell>
                    <TableCell className="align-top">
                      {onViewQuotation ? (
                        <ProtectedComponent permission="quotations.read">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onViewQuotation(quotation.id)}
                          >
                            <ArrowUpRight className="h-4 w-4" />
                            {t("events.viewQuotation", {
                              defaultValue: "View Quotation",
                            })}
                          </Button>
                        </ProtectedComponent>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EventEmptyState
            title={t("events.noQuotationsTitle", {
              defaultValue: "No quotations yet",
            })}
            description={t("events.noQuotations", {
              defaultValue: "No quotations have been created for this event yet.",
            })}
          />
        )}
      </CardContent>
    </Card>
  );
}

export function EventContractsPanel({
  contracts,
  loading,
  latestContract,
  totalAmount,
  dateLocale,
  t,
  onCreateContract,
  onCreateContractFromQuotation,
  onViewContract,
}: ContractProps) {
  const { i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";

  return (
    <Card dir={i18n.dir()}>
      <CardHeader
        className={cn(
          "flex flex-col gap-4 lg:items-start lg:justify-between",
          "lg:flex-row",
        )}
      >
        <div className={cn("space-y-1.5", isRtl ? "text-right" : "text-left")}>
          <CardTitle>{t("events.contracts", { defaultValue: "Contracts" })}</CardTitle>
          <CardDescription>
            {t("events.contractsHint", {
              defaultValue:
                "Review linked contracts and move quickly into contract workflows for this event.",
            })}
          </CardDescription>
        </div>
        <div className={cn("flex flex-wrap gap-2", isRtl ? "justify-start" : "justify-end")}>
          <ProtectedComponent permission="contracts.create">
            <Button variant="outline" onClick={onCreateContract}>
              <Plus className="h-4 w-4" />
              {t("contracts.create", { defaultValue: "Create Contract" })}
            </Button>
          </ProtectedComponent>
          <ProtectedComponent permission="contracts.create">
            <Button onClick={onCreateContractFromQuotation}>
              <FileSignature className="h-4 w-4" />
              {t("contracts.createFromQuotation", {
                defaultValue: "Create From Quotation",
              })}
            </Button>
          </ProtectedComponent>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-3">
          <EventMetricTile
            label={t("events.contractCount", {
              defaultValue: "Contract Count",
            })}
            value={contracts.length}
          />
          <EventMetricTile
            label={t("events.contractTotalAmount", {
              defaultValue: "Contracted Total",
            })}
            value={formatMoney(totalAmount)}
          />
          <EventMetricTile
            label={t("events.latestContract", {
              defaultValue: "Latest Contract",
            })}
            value={
              latestContract ? (
                <div className="space-y-2">
                  <div className={cn("flex flex-wrap items-center gap-2", isRtl && "flex-row-reverse")}>
                    <span dir="auto">{getContractDisplayNumber(latestContract)}</span>
                    <ContractStatusBadge status={latestContract.status} />
                  </div>
                  <p className={cn("text-xs leading-5 text-[var(--lux-text-secondary)]", isRtl ? "text-right" : "text-left")}>
                    {format(new Date(latestContract.signedDate), "PPP", {
                      locale: dateLocale,
                    })}{" "}
                    / {formatMoney(latestContract.totalAmount)}
                  </p>
                </div>
              ) : (
                t("events.noContractsTitle", {
                  defaultValue: "No contracts yet",
                })
              )
            }
          />
        </div>

        {loading ? (
          <EventEmptyState
            title={t("common.loading", { defaultValue: "Loading..." })}
            description={t("events.loadingContracts", {
              defaultValue: "Loading contracts for this event.",
            })}
          />
        ) : contracts.length ? (
          <div className="overflow-hidden rounded-[24px] border border-[var(--lux-row-border)] bg-[var(--lux-row-surface)]">
            <Table className="min-w-full" dir={i18n.dir()}>
              <TableHeader>
                <TableRow className="border-[var(--lux-row-border)]">
                  <TableHead>{t("events.contractSnapshot", { defaultValue: "Contract" })}</TableHead>
                  <TableHead>{t("events.customer", { defaultValue: "Customer" })}</TableHead>
                  <TableHead>{t("contracts.signedDate", { defaultValue: "Signed Date" })}</TableHead>
                  <TableHead>{t("contracts.totalAmount", { defaultValue: "Total Amount" })}</TableHead>
                  <TableHead>{t("common.status", { defaultValue: "Status" })}</TableHead>
                  <TableHead>{t("common.actions", { defaultValue: "Actions" })}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((contract) => (
                  <TableRow key={contract.id} className="border-[var(--lux-row-border)]">
                    <TableCell className="align-top">
                      <div className="space-y-1">
                        <div className="font-medium text-[var(--lux-heading)]">
                          <span dir="auto">{getContractDisplayNumber(contract)}</span>
                        </div>
                        <div className="text-xs text-[var(--lux-text-secondary)]" dir="auto">
                          {contract.notes || "-"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="align-top text-[var(--lux-text-secondary)]">
                      <span dir="auto">{contract.customer?.fullName ||
                        t("events.noContractParty", {
                          defaultValue: "No customer or lead linked",
                        })}</span>
                    </TableCell>
                    <TableCell className="align-top text-[var(--lux-text-secondary)]">
                      {format(new Date(contract.signedDate), "PPP", {
                        locale: dateLocale,
                      })}
                    </TableCell>
                    <TableCell className="align-top text-[var(--lux-text-secondary)]">
                      {formatMoney(contract.totalAmount)}
                    </TableCell>
                    <TableCell className="align-top">
                      <ContractStatusBadge status={contract.status} />
                    </TableCell>
                    <TableCell className="align-top">
                      {onViewContract ? (
                        <ProtectedComponent permission="contracts.read">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onViewContract(contract.id)}
                          >
                            <ArrowUpRight className="h-4 w-4" />
                            {t("events.viewContract", {
                              defaultValue: "View Contract",
                            })}
                          </Button>
                        </ProtectedComponent>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EventEmptyState
            title={t("events.noContractsTitle", {
              defaultValue: "No contracts yet",
            })}
            description={t("events.noContracts", {
              defaultValue: "No contracts have been created for this event yet.",
            })}
          />
        )}
      </CardContent>
    </Card>
  );
}
