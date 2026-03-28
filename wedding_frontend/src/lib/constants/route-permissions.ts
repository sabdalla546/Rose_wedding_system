export type RouteAccess = {
  permission?: string;
  anyOf?: string[];
  allOf?: string[];
  roles?: string[];
};

export const routeAccessByHref: Record<string, RouteAccess> = {
  "/calendar": { anyOf: ["appointments.calendar.read", "events.read"] },
  "/appointments/calendar": { permission: "appointments.calendar.read" },
  "/appointments?view=calendar": { permission: "appointments.calendar.read" },
  "/events/calendar": { permission: "events.read" },
  "/events?view=calendar": { permission: "events.read" },
  "/settings/team": { anyOf: ["users.read", "roles.read"] },
  "/settings/team/users": { permission: "users.read" },
  "/settings/team/users/create": { permission: "users.create" },
  "/settings/team/users/edit/:id": { permission: "users.update" },
  "/settings/team/roles": { permission: "roles.read" },
  "/settings/team/roles/create": { permission: "roles.create" },
  "/settings/team/roles/edit/:id": { permission: "roles.update" },
  "/settings/venues": { permission: "venues.read" },
  "/settings/venues/create": { permission: "venues.create" },
  "/settings/venues/edit/:id": { permission: "venues.update" },
  "/settings/vendors": { permission: "vendors.read" },
  "/settings/vendors/create": { permission: "vendors.create" },
  "/settings/vendors/edit/:id": { permission: "vendors.update" },
  "/settings/vendors/:id": { permission: "vendors.read" },
  "/settings/vendors/sub-services": { permission: "vendors.read" },
  "/settings/vendors/sub-services/create": { permission: "vendors.create" },
  "/settings/vendors/sub-services/edit/:id": { permission: "vendors.update" },
  "/settings/vendors/pricing-plans": { permission: "vendors.read" },
  "/settings/vendors/pricing-plans/create": { permission: "vendors.create" },
  "/settings/vendors/pricing-plans/edit/:id": { permission: "vendors.update" },
  "/settings/services": { permission: "services.read" },
  "/settings/services/create": { permission: "services.create" },
  "/settings/services/edit/:id": { permission: "services.update" },
  "/settings/services/:id": { permission: "services.read" },
  "/customers": { permission: "customers.read" },
  "/customers/create": { permission: "customers.create" },
  "/customers/edit/:id": { permission: "customers.update" },
  "/customers/:id": { permission: "customers.read" },
  "/events": { permission: "events.read" },
  "/events/create": { permission: "events.create" },
  "/events/edit/:id": { permission: "events.update" },
  "/events/:id": { permission: "events.read" },
  "/quotations": { permission: "quotations.read" },
  "/quotations/create": { permission: "quotations.create" },
  "/quotations/edit/:id": { permission: "quotations.update" },
  "/quotations/:id": { permission: "quotations.read" },
  "/contracts": { permission: "contracts.read" },
  "/contracts/create": { permission: "contracts.create" },
  "/contracts/edit/:id": { permission: "contracts.update" },
  "/contracts/:id": { permission: "contracts.read" },
  "/appointments": { permission: "appointments.read" },
  "/appointments/create": { permission: "appointments.create" },
  "/appointments/edit/:id": { permission: "appointments.update" },
  "/appointments/:id": { permission: "appointments.read" },
};

export const routePermissionByHref: Record<string, string> = Object.entries(
  routeAccessByHref,
).reduce<Record<string, string>>((acc, [href, access]) => {
  if (access.permission) {
    acc[href] = access.permission;
  }

  return acc;
}, {});
