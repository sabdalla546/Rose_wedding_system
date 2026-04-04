import { useQuery } from "@tanstack/react-query";

import { quotationsApi } from "@/lib/api/quotations";
import type {
  Quotation,
  QuotationsResponse,
  QuotationStatus,
} from "@/pages/quotations/types";

interface UseQuotationsParams {
  currentPage: number;
  itemsPerPage: number;
  searchQuery: string;
  eventId: string;
  status: "all" | QuotationStatus;
  issueDateFrom: string;
  issueDateTo: string;
}

export const useQuotations = ({
  currentPage,
  itemsPerPage,
  searchQuery,
  eventId,
  status,
  issueDateFrom,
  issueDateTo,
}: UseQuotationsParams) => {
  return useQuery<QuotationsResponse>({
    queryKey: [
      "quotations",
      currentPage,
      itemsPerPage,
      searchQuery,
      eventId,
      status,
      issueDateFrom,
      issueDateTo,
    ],
    queryFn: () =>
      quotationsApi.list({
        currentPage,
        itemsPerPage,
        searchQuery,
        eventId,
        status,
        issueDateFrom,
        issueDateTo,
      }),
  });
};

export const useQuotation = (id?: string) => {
  return useQuery<Quotation>({
    queryKey: ["quotation", id],
    queryFn: () => quotationsApi.get(id as string),
    enabled: !!id,
  });
};
