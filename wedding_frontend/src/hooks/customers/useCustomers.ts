import { useQuery } from "@tanstack/react-query";

import api from "@/lib/axios";
import type {
  Customer,
  CustomerResponse,
  CustomersResponse,
} from "@/pages/customers/types";

interface UseCustomersParams {
  currentPage: number;
  itemsPerPage: number;
  searchQuery: string;
  status: "all" | Customer["status"];
  venueId: string;
  weddingDateFrom: string;
  weddingDateTo: string;
}

export const useCustomers = ({
  currentPage,
  itemsPerPage,
  searchQuery,
  status,
  venueId,
  weddingDateFrom,
  weddingDateTo,
}: UseCustomersParams) => {
  return useQuery<CustomersResponse>({
    queryKey: [
      "customers",
      currentPage,
      itemsPerPage,
      searchQuery,
      status,
      venueId,
      weddingDateFrom,
      weddingDateTo,
    ],
    queryFn: async () => {
      const res = await api.get("/customers", {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: searchQuery || undefined,
          status: status === "all" ? undefined : status,
          venueId: venueId ? Number(venueId) : undefined,
          weddingDateFrom: weddingDateFrom || undefined,
          weddingDateTo: weddingDateTo || undefined,
        },
      });

      return res.data;
    },
  });
};

export const useCustomer = (id?: string) => {
  return useQuery<Customer>({
    queryKey: ["customer", id],
    queryFn: async () => {
      const res = await api.get<CustomerResponse>(`/customers/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
};
