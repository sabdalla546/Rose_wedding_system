export interface Permission {
  id: number;
  code: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Role {
  id: number;
  name: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
  Permissions?: Permission[];
}

export interface RolesResponse {
  data: Role[];
}

export interface RoleResponse {
  data: Role;
}

export interface RoleFormData {
  id?: number;
  name: string;
  description?: string;
  permissionIds: number[];
}
