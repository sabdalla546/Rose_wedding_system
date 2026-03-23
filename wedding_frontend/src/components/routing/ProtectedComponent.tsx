import type { ReactNode } from "react";

import { useAuth } from "@/app/providers/use-auth";
import { useHasPermission } from "@/hooks/useHasPermission";

type ProtectedComponentProps = {
  permission?: string;
  anyOf?: string[];
  allOf?: string[];
  roles?: string[];
  fallback?: ReactNode;
  children: ReactNode;
};

export const ProtectedComponent = ({
  permission,
  anyOf,
  allOf,
  roles,
  fallback = null,
  children,
}: ProtectedComponentProps) => {
  const { isAuthenticated, user } = useAuth();
  const hasSinglePermission = useHasPermission(permission ?? [], "all");
  const hasAnyPermission = useHasPermission(anyOf ?? [], "any");
  const hasAllPermissions = useHasPermission(allOf ?? [], "all");
  const hasAnyRole = roles?.length
    ? roles.some((role) => user?.roles.includes(role))
    : true;

  if (!isAuthenticated) {
    return null;
  }

  let allowed = true;

  if (permission) {
    allowed = hasSinglePermission;
  }

  if (anyOf?.length) {
    allowed = allowed && hasAnyPermission;
  }

  if (allOf?.length) {
    allowed = allowed && hasAllPermissions;
  }

  if (roles?.length) {
    allowed = allowed && hasAnyRole;
  }

  if (!allowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
