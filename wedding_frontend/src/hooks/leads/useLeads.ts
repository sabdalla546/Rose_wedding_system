import { useQuery } from "@tanstack/react-query";

import api from "@/lib/axios";
import type { Lead, LeadResponse, LeadsResponse } from "@/pages/leads/types";

interface UseLeadsParams {
  currentPage: number;
  itemsPerPage: number;
  searchQuery: string;
  status: "all" | Lead["status"];
  venueId: string;
  source: string;
  weddingDateFrom: string;
  weddingDateTo: string;
}

export const useLeads = ({
  currentPage,
  itemsPerPage,
  searchQuery,
  status,
  venueId,
  source,
  weddingDateFrom,
  weddingDateTo,
}: UseLeadsParams) => {
  return useQuery<LeadsResponse>({
    queryKey: [
      "leads",
      currentPage,
      itemsPerPage,
      searchQuery,
      status,
      venueId,
      source,
      weddingDateFrom,
      weddingDateTo,
    ],
    queryFn: async () => {
      const res = await api.get("/leads", {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: searchQuery || undefined,
          status: status === "all" ? undefined : status,
          venueId: venueId ? Number(venueId) : undefined,
          source: source.trim() || undefined,
          weddingDateFrom: weddingDateFrom || undefined,
          weddingDateTo: weddingDateTo || undefined,
        },
      });

      return res.data;
    },
  });
};

export const useLead = (id?: string) => {
  return useQuery<Lead>({
    queryKey: ["lead", id],
    queryFn: async () => {
      const res = await api.get<LeadResponse>(`/leads/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
};
