export interface UserRoleRelation {
  userId: number;
  roleId: number;
}

export interface UserRole {
  id: number;
  name: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
  UserRole?: UserRoleRelation;
}

export interface User {
  id: number;
  fullName: string;
  email: string;
  phone?: string | null;
  isActive: boolean;
  createdBy?: number | null;
  updatedBy?: number | null;
  deletedBy?: number | null;
  createdByName?: string | null;
  createdByEmail?: string | null;
  updatedByName?: string | null;
  updatedByEmail?: string | null;
  deletedByName?: string | null;
  deletedByEmail?: string | null;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string | null;
  Roles?: UserRole[];
}

export interface UsersResponse {
  data: User[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface UserFormData {
  id?: number;
  fullName: string;
  email: string;
  phone?: string;
  roleIds: number[];
  isActive: boolean;
  password?: string;
}
