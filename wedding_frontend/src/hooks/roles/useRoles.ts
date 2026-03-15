import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import type { Role, RoleResponse, RolesResponse } from "@/pages/roles/types";

export interface RoleOption {
  id: number;
  name: string;
  description?: string | null;
}

export const useRoles = () => {
  return useQuery<RolesResponse>({
    queryKey: ["roles"],
    queryFn: async () => {
      const res = await api.get("/roles");
      return res.data;
    },
  });
};

export const useRole = (id?: string) =>
  useQuery<Role>({
    queryKey: ["role", id],
    queryFn: async () => {
      const res = await api.get<RoleResponse>(`/roles/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
