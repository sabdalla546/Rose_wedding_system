import { useQuery } from "@tanstack/react-query";

import api from "@/lib/axios";
import type {
  VendorSubService,
  VendorSubServiceResponse,
  VendorSubServicesResponse,
  VendorType,
} from "@/pages/vendors/types";

interface UseVendorSubServicesParams {
  currentPage: number;
  itemsPerPage: number;
  searchQuery: string;
  vendorId?: number;
  vendorType: "all" | VendorType;
  isActive: "all" | "true" | "false";
  enabled?: boolean;
}

export const useVendorSubServices = ({
  currentPage,
  itemsPerPage,
  searchQuery,
  vendorId,
  vendorType,
  isActive,
  enabled = true,
}: UseVendorSubServicesParams) => {
  return useQuery<VendorSubServicesResponse>({
    queryKey: [
      "vendor-sub-services",
      currentPage,
      itemsPerPage,
      searchQuery,
      vendorId,
      vendorType,
      isActive,
    ],
    queryFn: async () => {
      const res = await api.get("/vendors/sub-services", {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: searchQuery || undefined,
          vendorId: vendorId || undefined,
          vendorType: vendorType === "all" ? undefined : vendorType,
          isActive: isActive === "all" ? undefined : isActive,
        },
      });

      return res.data;
    },
    enabled,
  });
};

export const useVendorSubService = (id?: string) => {
  return useQuery<VendorSubService>({
    queryKey: ["vendor-sub-service", id],
    queryFn: async () => {
      const res = await api.get<VendorSubServiceResponse>(
        `/vendors/sub-services/${id}`,
      );
      return res.data.data;
    },
    enabled: !!id,
  });
};
