import { useQuery } from "@tanstack/react-query";

import api from "@/lib/axios";
import type { Permission } from "@/pages/roles/types";

interface PermissionsResponse {
  data: Permission[];
}

export const usePermissions = () =>
  useQuery<PermissionsResponse>({
    queryKey: ["permissions"],
    queryFn: async () => {
      const res = await api.get("/permissions");
      return res.data;
    },
  });
