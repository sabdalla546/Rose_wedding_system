import { ar, enUS } from "date-fns/locale";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useQuotations } from "@/hooks/quotations/useQuotations";
import {
  EventQuotationsPanel as EventQuotationsPanelContent,
} from "@/pages/events/_components/EventWorkflowPanels";
import { toNumberValue } from "@/pages/services/adapters";
import type { Quotation } from "@/pages/quotations/types";

type Props = {
  eventId: number | string;
  onCreateQuotation?: () => void;
  onCreateQuotationFromEvent?: () => void;
  onViewQuotation?: (quotationId: number) => void;
  quotations?: Quotation[];
  loading?: boolean;
  error?: boolean;
};

export function EventQuotationsPanel({
  eventId,
  onCreateQuotation,
  onCreateQuotationFromEvent,
  onViewQuotation,
  quotations: quotationsOverride,
  loading: loadingOverride,
  error: errorOverride,
}: Props) {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === "ar" ? ar : enUS;
  const { data, isLoading, isError } = useQuotations({
    currentPage: 1,
    itemsPerPage: 100,
    searchQuery: "",
    eventId: String(eventId ?? ""),
    status: "all",
    issueDateFrom: "",
    issueDateTo: "",
  });

  const quotations = useMemo(
    () =>
      [...(quotationsOverride ?? data?.data ?? [])].sort((left, right) => {
        const leftTime = new Date(left.issueDate).getTime();
        const rightTime = new Date(right.issueDate).getTime();

        if (leftTime !== rightTime) {
          return rightTime - leftTime;
        }

        return right.id - left.id;
      }),
    [data?.data, quotationsOverride],
  );
  const totalAmount = useMemo(
    () =>
      quotations.reduce(
        (accumulator, quotation) =>
          Number(
            (
              accumulator + (toNumberValue(quotation.totalAmount) ?? 0)
            ).toFixed(3),
          ),
        0,
      ),
    [quotations],
  );

  return (
    <EventQuotationsPanelContent
      quotations={quotations}
      loading={loadingOverride ?? isLoading}
      error={errorOverride ?? isError}
      latestQuotation={quotations[0] ?? null}
      totalAmount={totalAmount}
      dateLocale={dateLocale}
      t={t}
      onCreateQuotation={onCreateQuotation ?? (() => undefined)}
      onCreateQuotationFromEvent={
        onCreateQuotationFromEvent ?? onCreateQuotation ?? (() => undefined)
      }
      onViewQuotation={onViewQuotation}
    />
  );
}
