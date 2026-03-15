import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { User, UsersResponse } from "@/pages/users/types";

interface UseUsersParams {
  currentPage: number;
  itemsPerPage: number;
  searchQuery: string;
}

export const useUsers = ({
  currentPage,
  itemsPerPage,
  searchQuery,
}: UseUsersParams) => {
  return useQuery<UsersResponse>({
    queryKey: ["users", currentPage, itemsPerPage, searchQuery],
    queryFn: async () => {
      const res = await api.get("/users", {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: searchQuery,
        },
      });
      return res.data;
    },
  });
};

export const useUser = (id?: string) => {
  return useQuery<User>({
    queryKey: ["user", id],
    queryFn: async () => {
      const res = await api.get(`/users/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
};
