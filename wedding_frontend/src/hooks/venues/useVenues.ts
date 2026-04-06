import { useQuery } from "@tanstack/react-query";

import api from "@/lib/axios";
import type {
  Venue,
  VenueResponse,
  VenuesResponse,
} from "@/pages/venues/types";

interface UseVenuesParams {
  currentPage: number;
  itemsPerPage: number;
  searchQuery: string;
  isActive: "all" | "true" | "false";
}

export const useVenues = ({
  currentPage,
  itemsPerPage,
  searchQuery,
  isActive,
}: UseVenuesParams) => {
  return useQuery<VenuesResponse>({
    queryKey: ["venues", currentPage, itemsPerPage, searchQuery, isActive],
    queryFn: async () => {
      const res = await api.get("/venues", {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: searchQuery || undefined,
          isActive: isActive === "all" ? undefined : isActive,
        },
      });

      return res.data;
    },
  });
};

export const useVenue = (id?: string) => {
  return useQuery<Venue>({
    queryKey: ["venue", id],
    queryFn: async () => {
      const res = await api.get<VenueResponse>(`/venues/${id}`);
      console.log("GET /venues/:id response", res.data);
      return res.data.data;
    },
    enabled: !!id,
  });
};
