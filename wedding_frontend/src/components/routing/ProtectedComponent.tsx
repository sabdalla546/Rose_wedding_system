import type { ReactNode } from "react";

import { useAuth } from "@/app/providers/use-auth";
import { useHasPermission } from "@/hooks/useHasPermission";

type ProtectedComponentProps = {
  permission?: string;
  anyOf?: string[];
  allOf?: string[];
  fallback?: ReactNode;
  children: ReactNode;
};

export const ProtectedComponent = ({
  permission,
  anyOf,
  allOf,
  fallback = null,
  children,
}: ProtectedComponentProps) => {
  const { isAuthenticated } = useAuth();
  const hasSinglePermission = useHasPermission(permission ?? [], "all");
  const hasAnyPermission = useHasPermission(anyOf ?? [], "any");
  const hasAllPermissions = useHasPermission(allOf ?? [], "all");

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

  if (!allowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
