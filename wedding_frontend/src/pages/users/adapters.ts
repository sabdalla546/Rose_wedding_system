import type { UsersResponse } from "@/pages/users/types";

export type TableUser = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  isActive: boolean;
  createdBy: number | null;
  updatedBy: number | null;
  deletedBy: number | null;
  createdByName?: string | null;
  createdByEmail?: string | null;
  updatedByName?: string | null;
  updatedByEmail?: string | null;
  deletedByName?: string | null;
  deletedByEmail?: string | null;
  createdAt: string;
  deletedAt?: string | null;
  Role?: { id: number; name: string };
  Roles?: Array<{
    id: number;
    name: string;
    description?: string | null;
    createdAt?: string;
    updatedAt?: string;
    UserRole?: { userId: number; roleId: number };
  }>;
};

export type TableUsersResponse = {
  data: { users: TableUser[] };
  total: number;
  totalPages: number;
};

export function toTableUsers(res?: UsersResponse): TableUsersResponse {
  const users = (res?.data ?? []).map<TableUser>((u) => ({
    id: u.id,
    name: u.fullName,
    email: u.email,
    phone: u.phone ?? null,
    isActive: u.isActive,
    createdBy: u.createdBy ?? null,
    updatedBy: u.updatedBy ?? null,
    deletedBy: u.deletedBy ?? null,
    createdByName: u.createdByName ?? null,
    createdByEmail: u.createdByEmail ?? null,
    updatedByName: u.updatedByName ?? null,
    updatedByEmail: u.updatedByEmail ?? null,
    deletedByName: u.deletedByName ?? null,
    deletedByEmail: u.deletedByEmail ?? null,
    createdAt: u.createdAt,
    deletedAt: u.deletedAt ?? null,
    Role: u.Roles?.[0]
      ? { id: u.Roles[0].id, name: u.Roles[0].name }
      : undefined,
    Roles: u.Roles,
  }));

  return {
    data: { users },
    total: res?.meta?.total ?? users.length,
    totalPages: res?.meta?.pages ?? 1,
  };
}
