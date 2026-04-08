import { useQuery } from "@tanstack/react-query";

import { contractAmendmentsApi } from "@/lib/api/contract-amendments";
import type {
  ContractAmendment,
  ContractAmendmentsResponse,
  ContractAmendmentStatus,
} from "@/pages/contracts/amendments/types";

export const contractAmendmentKeys = {
  all: ["contract-amendments"] as const,
  lists: () => [...contractAmendmentKeys.all, "list"] as const,
  list: (params: {
    currentPage: number;
    itemsPerPage: number;
    contractId?: string | number;
    eventId?: string | number;
    status: "all" | ContractAmendmentStatus;
    searchQuery: string;
  }) =>
    [
      ...contractAmendmentKeys.lists(),
      params.currentPage,
      params.itemsPerPage,
      params.contractId ?? "",
      params.eventId ?? "",
      params.status,
      params.searchQuery,
    ] as const,
  details: () => ["contract-amendment"] as const,
  detail: (id?: string | number) => [...contractAmendmentKeys.details(), id] as const,
};

interface UseContractAmendmentsParams {
  currentPage?: number;
  itemsPerPage?: number;
  contractId?: string | number;
  eventId?: string | number;
  status?: "all" | ContractAmendmentStatus;
  searchQuery?: string;
  enabled?: boolean;
}

export const useContractAmendments = ({
  currentPage = 1,
  itemsPerPage = 20,
  contractId,
  eventId,
  status = "all",
  searchQuery = "",
  enabled = true,
}: UseContractAmendmentsParams) => {
  return useQuery<ContractAmendmentsResponse>({
    queryKey: contractAmendmentKeys.list({
      currentPage,
      itemsPerPage,
      contractId,
      eventId,
      status,
      searchQuery,
    }),
    queryFn: () =>
      contractAmendmentsApi.list({
        currentPage,
        itemsPerPage,
        contractId,
        eventId,
        status,
        searchQuery,
      }),
    enabled,
  });
};

export const useContractAmendment = (id?: string | number) => {
  return useQuery<ContractAmendment>({
    queryKey: contractAmendmentKeys.detail(id),
    queryFn: () => contractAmendmentsApi.get(id as string),
    enabled: Boolean(id),
  });
};
