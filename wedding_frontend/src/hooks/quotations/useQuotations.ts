import { useQuery } from "@tanstack/react-query";

import api from "@/lib/axios";
import type {
  Quotation,
  QuotationResponse,
  QuotationsResponse,
  QuotationStatus,
} from "@/pages/quotations/types";

interface UseQuotationsParams {
  currentPage: number;
  itemsPerPage: number;
  searchQuery: string;
  eventId: string;
  customerId: string;
  leadId?: string;
  status: "all" | QuotationStatus;
  issueDateFrom: string;
  issueDateTo: string;
}

export const useQuotations = ({
  currentPage,
  itemsPerPage,
  searchQuery,
  eventId,
  customerId,
  leadId = "",
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
      customerId,
      leadId,
      status,
      issueDateFrom,
      issueDateTo,
    ],
    queryFn: async () => {
      const res = await api.get("/quotations", {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: searchQuery || undefined,
          eventId: eventId ? Number(eventId) : undefined,
          customerId: customerId ? Number(customerId) : undefined,
          leadId: leadId ? Number(leadId) : undefined,
          status: status === "all" ? undefined : status,
          issueDateFrom: issueDateFrom || undefined,
          issueDateTo: issueDateTo || undefined,
        },
      });

      return res.data;
    },
  });
};

export const useQuotation = (id?: string) => {
  return useQuery<Quotation>({
    queryKey: ["quotation", id],
    queryFn: async () => {
      const res = await api.get<QuotationResponse>(`/quotations/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
};
