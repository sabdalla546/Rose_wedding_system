import type { RolesResponse } from "@/pages/roles/types";

export type TableRole = {
  id: number;
  name: string;
  description?: string | null;
  permissionIds: number[];
  permissions: Array<{
    id: number;
    code: string;
    description?: string | null;
  }>;
  createdAt?: string;
  updatedAt?: string;
};

export type TableRolesResponse = {
  data: { roles: TableRole[] };
  total: number;
};

export function toTableRoles(res?: RolesResponse): TableRolesResponse {
  const roles = (res?.data ?? []).map<TableRole>((role) => ({
    id: role.id,
    name: role.name,
    description: role.description ?? null,
    permissionIds: (role.Permissions ?? []).map((permission) => permission.id),
    permissions: (role.Permissions ?? []).map((permission) => ({
      id: permission.id,
      code: permission.code,
      description: permission.description ?? null,
    })),
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
  }));

  return {
    data: { roles },
    total: roles.length,
  };
}
