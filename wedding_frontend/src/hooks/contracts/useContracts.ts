import { useQuery } from "@tanstack/react-query";

import { contractsApi } from "@/lib/api/contracts";
import type {
  Contract,
  ContractsResponse,
  ContractStatus,
} from "@/pages/contracts/types";

interface UseContractsParams {
  currentPage: number;
  itemsPerPage: number;
  searchQuery: string;
  quotationId: string;
  eventId: string;
  status: "all" | ContractStatus;
  signedDateFrom: string;
  signedDateTo: string;
  enabled?: boolean;
}

export const useContracts = ({
  currentPage,
  itemsPerPage,
  searchQuery,
  quotationId,
  eventId,
  status,
  signedDateFrom,
  signedDateTo,
  enabled = true,
}: UseContractsParams) => {
  return useQuery<ContractsResponse>({
    queryKey: [
      "contracts",
      currentPage,
      itemsPerPage,
      searchQuery,
      quotationId,
      eventId,
      status,
      signedDateFrom,
      signedDateTo,
    ],
    queryFn: () =>
      contractsApi.list({
        currentPage,
        itemsPerPage,
        searchQuery,
        quotationId,
        eventId,
        status,
        signedDateFrom,
        signedDateTo,
      }),
    enabled,
  });
};

export const useContract = (id?: string) => {
  return useQuery<Contract>({
    queryKey: ["contract", id],
    queryFn: () => {
      console.log("useContract fetching contract", { id });
      return contractsApi.get(id as string);
    },
    enabled: !!id,
  });
};
