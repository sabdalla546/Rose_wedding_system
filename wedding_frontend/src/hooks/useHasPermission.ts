import { useAuth } from "@/app/providers/use-auth";

type PermissionCheckMode = "any" | "all";

export const useHasPermission = (
  required: string | string[],
  mode: PermissionCheckMode = "all",
) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated || !user) {
    return false;
  }

  const requiredPermissions = Array.isArray(required) ? required : [required];

  if (requiredPermissions.length === 0) {
    return true;
  }

  if (mode === "any") {
    return requiredPermissions.some((permission) =>
      user.permissions.includes(permission),
    );
  }

  return requiredPermissions.every((permission) =>
    user.permissions.includes(permission),
  );
};
