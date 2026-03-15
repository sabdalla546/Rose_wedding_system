export const routePermissionByHref: Record<string, string> = {
  "/settings/team": "roles.read",
  "/settings/team/users": "users.read",
  "/settings/team/users/create": "users.create",
  "/settings/team/users/edit/:id": "users.update",
  "/settings/team/roles": "roles.read",
  "/settings/team/roles/create": "roles.create",
  "/settings/team/roles/edit/:id": "roles.update",
};
