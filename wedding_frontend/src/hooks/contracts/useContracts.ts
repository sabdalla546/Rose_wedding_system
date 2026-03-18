import { useQuery } from "@tanstack/react-query";

import api from "@/lib/axios";
import type {
  Contract,
  ContractResponse,
  ContractsResponse,
  ContractStatus,
} from "@/pages/contracts/types";

interface UseContractsParams {
  currentPage: number;
  itemsPerPage: number;
  searchQuery: string;
  quotationId: string;
  eventId: string;
  customerId: string;
  leadId: string;
  status: "all" | ContractStatus;
  signedDateFrom: string;
  signedDateTo: string;
}

export const useContracts = ({
  currentPage,
  itemsPerPage,
  searchQuery,
  quotationId,
  eventId,
  customerId,
  leadId,
  status,
  signedDateFrom,
  signedDateTo,
}: UseContractsParams) => {
  return useQuery<ContractsResponse>({
    queryKey: [
      "contracts",
      currentPage,
      itemsPerPage,
      searchQuery,
      quotationId,
      eventId,
      customerId,
      leadId,
      status,
      signedDateFrom,
      signedDateTo,
    ],
    queryFn: async () => {
      const res = await api.get("/contracts", {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: searchQuery || undefined,
          quotationId: quotationId ? Number(quotationId) : undefined,
          eventId: eventId ? Number(eventId) : undefined,
          customerId: customerId ? Number(customerId) : undefined,
          leadId: leadId ? Number(leadId) : undefined,
          status: status === "all" ? undefined : status,
          signedDateFrom: signedDateFrom || undefined,
          signedDateTo: signedDateTo || undefined,
        },
      });

      return res.data;
    },
  });
};

export const useContract = (id?: string) => {
  return useQuery<Contract>({
    queryKey: ["contract", id],
    queryFn: async () => {
      const res = await api.get<ContractResponse>(`/contracts/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
};
