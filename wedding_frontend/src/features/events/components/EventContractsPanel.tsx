import { ar, enUS } from "date-fns/locale";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useContracts } from "@/hooks/contracts/useContracts";
import {
  EventContractsPanel as EventContractsPanelContent,
} from "@/pages/events/_components/EventWorkflowPanels";
import { toNumberValue } from "@/pages/services/adapters";
import type { Contract } from "@/pages/contracts/types";

type Props = {
  eventId: number | string;
  onCreateContract?: () => void;
  onCreateContractFromQuotation?: () => void;
  onViewContract?: (contractId: number) => void;
  contracts?: Contract[];
  loading?: boolean;
  error?: boolean;
};

export function EventContractsPanel({
  eventId,
  onCreateContract,
  onCreateContractFromQuotation,
  onViewContract,
  contracts: contractsOverride,
  loading: loadingOverride,
  error: errorOverride,
}: Props) {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === "ar" ? ar : enUS;
  const useProvidedContracts =
    contractsOverride !== undefined && loadingOverride !== undefined;
  const { data, isLoading, isError } = useContracts({
    currentPage: 1,
    itemsPerPage: 200,
    searchQuery: "",
    quotationId: "",
    eventId: String(eventId ?? ""),
    status: "all",
    signedDateFrom: "",
    signedDateTo: "",
    enabled: !useProvidedContracts,
  });

  const contracts = useMemo(
    () =>
      [...(contractsOverride ?? data?.data ?? [])].sort((left, right) => {
        const leftTime = new Date(left.signedDate).getTime();
        const rightTime = new Date(right.signedDate).getTime();

        if (leftTime !== rightTime) {
          return rightTime - leftTime;
        }

        return right.id - left.id;
      }),
    [data?.data, contractsOverride],
  );
  const totalAmount = useMemo(
    () =>
      contracts.reduce(
        (accumulator, contract) =>
          Number(
            (
              accumulator + (toNumberValue(contract.totalAmount) ?? 0)
            ).toFixed(3),
          ),
        0,
      ),
    [contracts],
  );

  return (
    <EventContractsPanelContent
      contracts={contracts}
      loading={loadingOverride ?? isLoading}
      error={errorOverride ?? isError}
      latestContract={contracts[0] ?? null}
      totalAmount={totalAmount}
      dateLocale={dateLocale}
      t={t}
      onCreateContract={onCreateContract ?? (() => undefined)}
      onCreateContractFromQuotation={
        onCreateContractFromQuotation ?? onCreateContract ?? (() => undefined)
      }
      onViewContract={onViewContract}
    />
  );
}
