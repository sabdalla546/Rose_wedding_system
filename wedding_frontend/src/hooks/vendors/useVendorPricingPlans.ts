import { useQuery } from "@tanstack/react-query";

import api from "@/lib/axios";
import type {
  VendorPricingPlan,
  VendorPricingPlanResponse,
  VendorPricingPlansResponse,
  VendorType,
} from "@/pages/vendors/types";

interface UseVendorPricingPlansParams {
  currentPage: number;
  itemsPerPage: number;
  searchQuery: string;
  vendorType: "all" | VendorType;
  isActive: "all" | "true" | "false";
}

export const useVendorPricingPlans = ({
  currentPage,
  itemsPerPage,
  searchQuery,
  vendorType,
  isActive,
}: UseVendorPricingPlansParams) => {
  return useQuery<VendorPricingPlansResponse>({
    queryKey: [
      "vendor-pricing-plans",
      currentPage,
      itemsPerPage,
      searchQuery,
      vendorType,
      isActive,
    ],
    queryFn: async () => {
      const res = await api.get("/vendors/pricing-plans", {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: searchQuery || undefined,
          vendorType: vendorType === "all" ? undefined : vendorType,
          isActive: isActive === "all" ? undefined : isActive,
        },
      });

      return res.data;
    },
  });
};

export const useVendorPricingPlan = (id?: string) => {
  return useQuery<VendorPricingPlan>({
    queryKey: ["vendor-pricing-plan", id],
    queryFn: async () => {
      const res = await api.get<VendorPricingPlanResponse>(
        `/vendors/pricing-plans/${id}`,
      );
      return res.data.data;
    },
    enabled: !!id,
  });
};
