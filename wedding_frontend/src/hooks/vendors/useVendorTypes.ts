import { useQuery } from "@tanstack/react-query";

import api from "@/lib/axios";
import type {
  VendorTypeRecord,
  VendorTypeResponse,
  VendorTypesResponse,
} from "@/pages/vendors/types";

interface UseVendorTypesParams {
  currentPage: number;
  itemsPerPage: number;
  searchQuery: string;
  isActive: "all" | "true" | "false";
  activeOnly?: boolean;
}

export const useVendorTypes = ({
  currentPage,
  itemsPerPage,
  searchQuery,
  isActive,
  activeOnly = false,
}: UseVendorTypesParams) => {
  return useQuery<VendorTypesResponse>({
    queryKey: [
      "vendor-types",
      currentPage,
      itemsPerPage,
      searchQuery,
      isActive,
      activeOnly,
    ],
    queryFn: async () => {
      const res = await api.get("/vendor-types", {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: searchQuery || undefined,
          isActive: activeOnly ? undefined : isActive === "all" ? undefined : isActive,
          activeOnly: activeOnly || undefined,
        },
      });

      return res.data;
    },
  });
};

export const useVendorType = (id?: string) => {
  return useQuery<VendorTypeRecord>({
    queryKey: ["vendor-type", id],
    queryFn: async () => {
      const res = await api.get<VendorTypeResponse>(`/vendor-types/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
};
