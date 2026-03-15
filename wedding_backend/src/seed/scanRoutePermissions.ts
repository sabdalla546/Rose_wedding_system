import fs from "fs";
import path from "path";

const REQUIRE_PERMISSIONS_REGEX = /requirePermissions\(([^)]*)\)/g;
const STRING_LITERAL_REGEX = /["'`]([^"'`]+)["'`]/g;

export interface ScannedRoutePermission {
  routeFile: string;
  permissions: string[];
}

const getRouteFiles = (routesDir: string) => {
  if (!fs.existsSync(routesDir)) {
    return [];
  }

  return fs
    .readdirSync(routesDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".ts"))
    .map((entry) => entry.name)
    .sort();
};

export const scanRoutePermissionsWithSources = (
  routesDir = path.resolve(__dirname, "../routes")
): ScannedRoutePermission[] => {
  return getRouteFiles(routesDir)
    .map((fileName) => {
      const filePath = path.join(routesDir, fileName);
      const content = fs.readFileSync(filePath, "utf8");
      const permissions = new Set<string>();

      for (const match of content.matchAll(REQUIRE_PERMISSIONS_REGEX)) {
        const args = match[1] ?? "";

        for (const value of args.matchAll(STRING_LITERAL_REGEX)) {
          permissions.add(value[1]);
        }
      }

      return {
        routeFile: fileName,
        permissions: [...permissions].sort(),
      };
    })
    .filter((entry) => entry.permissions.length > 0);
};

export const scanRoutePermissions = (
  routesDir = path.resolve(__dirname, "../routes")
) => {
  const permissions = new Set<string>();

  for (const route of scanRoutePermissionsWithSources(routesDir)) {
    for (const permission of route.permissions) {
      permissions.add(permission);
    }
  }

  return [...permissions].sort();
};

export const buildPermissionDescription = (code: string) => {
  const [resource, action] = code.split(".");

  if (!resource || !action) {
    return `Access for ${code}`;
  }

  return `Allows ${action} access on ${resource}`;
};

if (require.main === module) {
  const routes = scanRoutePermissionsWithSources();
  const permissions = routes.flatMap((route) => route.permissions);

  console.log(
    JSON.stringify(
      {
        routes,
        permissions: [...new Set(permissions)].sort(),
      },
      null,
      2
    )
  );
}
