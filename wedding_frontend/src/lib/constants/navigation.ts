import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Building2,
  CalendarCheck2,
  CalendarDays,
  CalendarRange,
  ChartColumnBig,
  ClipboardCheck,
  FileSignature,
  FileText,
  Handshake,
  HandshakeIcon,
  LandmarkIcon,
  LayoutDashboard,
  Package,
  PackageOpen,
  PackagePlus,
  Settings,
  ShieldCheck,
  TrendingUp,
  UserCog,
  Users,
  UsersRound,
} from "lucide-react";

import {
  routeAccessByHref,
  type RouteAccess,
} from "@/lib/constants/route-permissions";

type NavigationAccess = Pick<
  RouteAccess,
  "permission" | "anyOf" | "allOf" | "roles"
>;

export type NavigationItem = {
  id: string;
  labelKey: string;
  label?: string;
  labelAr?: string;
  href?: string;
  icon: LucideIcon;
  children?: NavigationItem[];
  subtitle?: string;
  subtitleAr?: string;
} & NavigationAccess;

export type NavigationLeaf = NavigationItem & {
  parents: string[];
};

function splitNavigationHref(href: string) {
  const [pathname, search = ""] = href.split("?");

  return {
    pathname,
    searchParams: new URLSearchParams(search),
  };
}

export function matchesNavigationHref(
  pathname: string,
  search: string,
  href?: string,
) {
  if (!href) {
    return false;
  }

  const { pathname: hrefPathname, searchParams } = splitNavigationHref(href);

  if (!(pathname === hrefPathname || pathname.startsWith(`${hrefPathname}/`))) {
    return false;
  }

  if ([...searchParams].length === 0) {
    return true;
  }

  const currentSearchParams = new URLSearchParams(search);

  return [...searchParams.entries()].every(
    ([key, value]) => currentSearchParams.get(key) === value,
  );
}

export const SECRETARIAL_ROOT_ID = "Secretarial";
export const DESIGNER_DETAILS_ROOT_ID = "designer-details";
export const INVENTORY_ROOT_ID = "inventory";
export const REPORTS_ROOT_ID = "reports";
export const SETTINGS_ROOT_ID = "settings";

const navigationTree: NavigationItem[] = [
  {
    id: "dashboard",
    labelKey: "sidebar.nav.dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    subtitle: "Overview of bookings, quotations, payments, and operations.",
    subtitleAr: "Ù†Ø¸Ø±Ø© Ø¹Ø§Ù…Ø© Ø¹Ù„Ù‰ Ø§Ù„Ø­Ø¬ÙˆØ²Ø§Øª ÙˆØ¹Ø±ÙˆØ¶ Ø§Ù„Ø£Ø³Ø¹Ø§Ø± ÙˆØ§Ù„Ù…Ø¯ÙÙˆØ¹Ø§Øª ÙˆØ§Ù„Ø¹Ù…Ù„ÙŠØ§Øª.",
  },
  {
    id: SECRETARIAL_ROOT_ID,
    labelKey: "sidebar.nav.Secretarial",
    icon: CalendarCheck2,
    href: "/appointments?view=calendar",
    children: [
      {
        id: "appointments-calendar",
        labelKey: "sidebar.nav.appointmentsCalendar",
        label: "Appointments Calendar",
        labelAr: "Ø§Ù„Ù…ÙˆØ¹ÙŠØ¯ Ø§Ù„ÙŠÙˆÙ…ÙŠÙ‡",
        href: "/appointments?view=calendar",
        icon: CalendarDays,
        subtitle:
          "Operational calendar for customer appointments and follow-ups.",
        subtitleAr: "Ø¥Ø¯Ø§Ø±Ø© Ù…ÙˆØ§Ø¹ÙŠØ¯ Ø§Ù„ÙØ¹Ø§Ù„ÙŠØ§Øª ÙˆØ§Ù„Ø­Ø¬ÙˆØ²Ø§Øª ÙˆØªÙˆÙØ± Ø§Ù„Ù…ÙˆØ§Ù‚Ø¹.",
      },
      {
        id: "events-calendar",
        labelKey: "sidebar.nav.eventsCalendar",
        label: "Events Calendar",
        labelAr: "ØªÙ‚ÙˆÙŠÙ… Ø§Ù„Ø­ÙÙ„Ø§Øª",
        href: "/events?view=calendar",
        icon: CalendarRange,
        subtitle: "Operational calendar for wedding events and venue planning.",
        subtitleAr: "ØªÙ‚ÙˆÙŠÙ… ØªØ´ØºÙŠÙ„ÙŠ Ù„Ù„Ø­ÙÙ„Ø§Øª ÙˆØªØ®Ø·ÙŠØ· Ø§Ù„Ù‚Ø§Ø¹Ø§Øª.",
      },
      {
        id: "events-all",
        labelKey: "sidebar.nav.allEvents",
        label: "All Events",
        labelAr: "Ø­Ø¬Ø² Ø­ÙÙ„Ø©",
        href: "/events",
        icon: CalendarRange,
        subtitle:
          "Manage wedding events, planning sections, and linked records.",
        subtitleAr: "Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø­ÙÙ„Ø§Øª ÙˆØ£Ù‚Ø³Ø§Ù… Ø§Ù„ØªØ®Ø·ÙŠØ· ÙˆØ§Ù„Ø±ÙˆØ§Ø¨Ø· Ø§Ù„Ù…Ø±ØªØ¨Ø·Ø©.",
      },
      {
        id: "calendar-appointments",
        labelKey: "sidebar.nav.appointments",
        label: "Appointments",
        labelAr: "Ø§Ù„Ù…ÙˆØ§Ø¹ÙŠØ¯",
        href: "/appointments",
        icon: CalendarCheck2,
        subtitle:
          "Manage lead appointments, meeting statuses, and team assignment.",
        subtitleAr:
          "Ø¥Ø¯Ø§Ø±Ø© Ù…ÙˆØ§Ø¹ÙŠØ¯ Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡ Ø§Ù„Ù…Ø­ØªÙ…Ù„ÙŠÙ† ÙˆØ­Ø§Ù„Ø© Ø§Ù„Ø§Ø¬ØªÙ…Ø§Ø¹ ÙˆØªÙˆØ²ÙŠØ¹ Ø§Ù„ÙØ±ÙŠÙ‚.",
      },
      {
        id: "customers-all",
        labelKey: "sidebar.nav.allCustomers",
        label: "All Customers",
        labelAr: "ÙƒÙ„ Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡",
        href: "/customers",
        icon: UsersRound,
        subtitle:
          "Access complete customer profiles, history, and touchpoints.",
        subtitleAr: "Ø§Ù„ÙˆØµÙˆÙ„ Ø¥Ù„Ù‰ Ù…Ù„ÙØ§Øª Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡ Ø§Ù„ÙƒØ§Ù…Ù„Ø© ÙˆØ³Ø¬Ù„ Ø§Ù„ØªØ¹Ø§Ù…Ù„Ø§Øª.",
      },
    ],
  },
  {
    id: DESIGNER_DETAILS_ROOT_ID,
    labelKey: "sidebar.nav.designerDetails",
    label: "Designer Details",
    labelAr: "تفاصيل المصمم",
    href: "/designer-details",
    icon: Handshake,
    subtitle:
      "Operational hub for wedding management, external vendors, and service catalog control.",
    subtitleAr: "مركز تشغيلي لإدارة الحفل والشركات والخدمات.",
    children: [
      {
        id: "settings-team-vendors",
        labelKey: "sidebar.nav.vendors",
        label: "Vendors",
        labelAr: "الشركات الخارجه",
        href: "/settings/vendors",
        icon: Handshake,
        subtitle:
          "Manage external vendors, service types, and operational contacts.",
        subtitleAr:
          "إدارة الشركات الخارجية وأنواع الخدمات وبيانات التواصل.",
      },
      {
        id: "settings-team-services",
        labelKey: "sidebar.nav.services",
        label: "Services",
        labelAr: "الخدمات",
        href: "/settings/services",
        icon: PackageOpen,
        subtitle:
          "Manage catalog services, pricing types, and operational event items.",
        subtitleAr: "إدارة الخدمات وأنواع التسعير وبنود الحفل التشغيلية.",
      },
      {
        id: "quotations-all",
        labelKey: "sidebar.nav.quotations",
        label: "Quotations",
        labelAr: "عروض الأسعار",
        href: "/quotations",
        icon: FileText,
        subtitle:
          "Manage quotation documents, issue dates, totals, and linked event pricing.",
        subtitleAr:
          "إدارة عروض الأسعار وتواريخ إصدارها وإجمالياتها وارتباطها بالحفل.",
      },
      {
        id: "contracts-all",
        labelKey: "sidebar.nav.contracts",
        label: "Contracts",
        labelAr: "العقود",
        href: "/contracts",
        icon: FileSignature,
        subtitle:
          "Manage contract documents, payment plans, and linked event commitments.",
        subtitleAr:
          "إدارة وثائق العقود وخطط الدفعات والالتزامات المرتبطة بالحفل.",
      },
    ],
  },
  {
    id: "accounting",
    labelKey: "sidebar.nav.accounting",
    icon: LandmarkIcon,
  },
  {
    id: "oprational",
    labelKey: "sidebar.nav.oprational",
    icon: HandshakeIcon,
  },
  {
    id: "inventory",
    labelKey: "sidebar.nav.inventory",
    icon: Package,
    children: [
      {
        id: "inventory-stock",
        labelKey: "inventory.title",
        label: "Inventory",
        labelAr: "Ø£ØµÙ†Ø§Ù Ø§Ù„Ù…Ø®Ø²ÙˆÙ†",
        href: "/inventory",
        icon: PackageOpen,
        subtitle:
          "Monitor inventory quantities, categories, and condition status.",
        subtitleAr: "Ù…ØªØ§Ø¨Ø¹Ø© ÙƒÙ…ÙŠØ§Øª Ø§Ù„Ù…Ø®Ø²ÙˆÙ† ÙˆØªØµÙ†ÙŠÙØ§ØªÙ‡ ÙˆØ­Ø§Ù„ØªÙ‡.",
      },
      {
        id: "inventory-reservations",
        labelKey: "sidebar.nav.inventoryReservations",
        label: "Reservations",
        labelAr: "Ø§Ù„Ø­Ø¬ÙˆØ²Ø§Øª Ø§Ù„Ù…Ø®Ø²Ù†ÙŠØ©",
        href: "/inventory/reservations",
        icon: ClipboardCheck,
        subtitle:
          "Reserve decor, furniture, and technical items for upcoming events.",
        subtitleAr: "Ø­Ø¬Ø² Ø¹Ù†Ø§ØµØ± Ø§Ù„Ø¯ÙŠÙƒÙˆØ± ÙˆØ§Ù„Ø£Ø«Ø§Ø« ÙˆØ§Ù„Ù…Ø¹Ø¯Ø§Øª Ù„Ù„ÙØ¹Ø§Ù„ÙŠØ§Øª Ø§Ù„Ù‚Ø§Ø¯Ù…Ø©.",
      },
      {
        id: "inventory-orders",
        labelKey: "sidebar.nav.purchaseOrders",
        label: "Purchase Orders",
        labelAr: "Ø£ÙˆØ§Ù…Ø± Ø§Ù„Ø´Ø±Ø§Ø¡",
        href: "/inventory/purchase-orders",
        icon: PackagePlus,
        subtitle: "Track replenishment orders and supplier delivery readiness.",
        subtitleAr: "Ù…ØªØ§Ø¨Ø¹Ø© Ø£ÙˆØ§Ù…Ø± Ø§Ù„ØªÙˆØ±ÙŠØ¯ ÙˆØ¬Ø§Ù‡Ø²ÙŠØ© Ø§Ù„ØªØ³Ù„ÙŠÙ… Ù…Ù† Ø§Ù„Ù…ÙˆØ±Ø¯ÙŠÙ†.",
      },
    ],
  },
  {
    id: "reports",
    labelKey: "sidebar.nav.reports",
    icon: BarChart3,
    children: [
      {
        id: "reports-revenue",
        labelKey: "sidebar.nav.revenueOverview",
        label: "Revenue Overview",
        labelAr: "Ù†Ø¸Ø±Ø© Ø¹Ø§Ù…Ø© Ø¹Ù„Ù‰ Ø§Ù„Ø¥ÙŠØ±Ø§Ø¯Ø§Øª",
        href: "/reports/revenue",
        icon: TrendingUp,
        subtitle:
          "Track revenue trends, collection velocity, and monthly targets.",
        subtitleAr: "Ù…ØªØ§Ø¨Ø¹Ø© Ø§ØªØ¬Ø§Ù‡Ø§Øª Ø§Ù„Ø¥ÙŠØ±Ø§Ø¯Ø§Øª ÙˆØ³Ø±Ø¹Ø© Ø§Ù„ØªØ­ØµÙŠÙ„ ÙˆØ§Ù„Ø£Ù‡Ø¯Ø§Ù Ø§Ù„Ø´Ù‡Ø±ÙŠØ©.",
      },
      {
        id: "reports-bookings",
        labelKey: "sidebar.nav.bookingAnalytics",
        label: "Booking Analytics",
        labelAr: "ØªØ­Ù„ÙŠÙ„Ø§Øª Ø§Ù„Ø­Ø¬ÙˆØ²Ø§Øª",
        href: "/reports/bookings",
        icon: CalendarRange,
        subtitle: "Analyze conversion, booking volume, and seasonal demand.",
        subtitleAr: "ØªØ­Ù„ÙŠÙ„ Ø§Ù„ØªØ­ÙˆÙŠÙ„Ø§Øª ÙˆØ­Ø¬Ù… Ø§Ù„Ø­Ø¬ÙˆØ²Ø§Øª ÙˆØ§Ù„Ø·Ù„Ø¨ Ø§Ù„Ù…ÙˆØ³Ù…ÙŠ.",
      },
      {
        id: "reports-utilization",
        labelKey: "sidebar.nav.resourceUtilization",
        label: "Resource Utilization",
        labelAr: "Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø§Ù„Ù…ÙˆØ§Ø±Ø¯",
        href: "/reports/utilization",
        icon: ChartColumnBig,
        subtitle:
          "Measure hall, staff, and inventory utilization across events.",
        subtitleAr: "Ù‚ÙŠØ§Ø³ Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø§Ù„Ù‚Ø§Ø¹Ø§Øª ÙˆØ§Ù„Ù…ÙˆØ¸ÙÙŠÙ† ÙˆØ§Ù„Ù…Ø®Ø²ÙˆÙ† Ø¹Ø¨Ø± Ø§Ù„ÙØ¹Ø§Ù„ÙŠØ§Øª.",
      },
    ],
  },
  {
    id: "settings",
    labelKey: "sidebar.nav.settings",
    icon: Settings,
    children: [
      {
        id: "settings-team",
        labelKey: "sidebar.nav.teamRoles",
        label: "Team Roles",
        labelAr: "Ø£Ø¯ÙˆØ§Ø± Ø§Ù„ÙØ±ÙŠÙ‚",
        href: "/settings/team",
        icon: UserCog,
        subtitle:
          "Configure access levels, coordinators, and team responsibilities.",
        subtitleAr: "Ø¥Ø¹Ø¯Ø§Ø¯ Ù…Ø³ØªÙˆÙŠØ§Øª Ø§Ù„ÙˆØµÙˆÙ„ ÙˆØ§Ù„Ù…Ù†Ø³Ù‚ÙŠÙ† ÙˆÙ…Ø³Ø¤ÙˆÙ„ÙŠØ§Øª Ø§Ù„ÙØ±ÙŠÙ‚.",
      },
    ],
  },
];

const settingsTeamItem = navigationTree
  .find((item) => item.id === "settings")
  ?.children?.find((item) => item.id === "settings-team");

if (settingsTeamItem) {
  settingsTeamItem.children = [
    {
      id: "settings-team-users",
      labelKey: "sidebar.nav.users",
      label: "Users",
      labelAr: "Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙˆÙ†",
      href: "/settings/team/users",
      icon: Users,
      subtitle: "Manage system users, status, and assigned roles.",
      subtitleAr: "Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ† ÙˆØ§Ù„Ø­Ø§Ù„Ø© ÙˆØ§Ù„Ø£Ø¯ÙˆØ§Ø± Ø§Ù„Ù…Ø³Ù†Ø¯Ø©.",
    },
    {
      id: "settings-team-roles",
      labelKey: "sidebar.nav.roles",
      label: "Roles",
      labelAr: "Ø§Ù„Ø£Ø¯ÙˆØ§Ø±",
      href: "/settings/team/roles",
      icon: ShieldCheck,
      subtitle: "Configure role definitions and permission bundles.",
      subtitleAr: "Ø¥Ø¹Ø¯Ø§Ø¯ ØªØ¹Ø±ÙŠÙØ§Øª Ø§Ù„Ø£Ø¯ÙˆØ§Ø± ÙˆØ­Ø²Ù… Ø§Ù„ØµÙ„Ø§Ø­ÙŠØ§Øª.",
    },
  ];
}

const secretarialRootItem = navigationTree.find(
  (item) => item.id === SECRETARIAL_ROOT_ID,
);

if (secretarialRootItem?.children) {
  secretarialRootItem.children = [
    ...secretarialRootItem.children,
    {
      id: "events-app",
      labelKey: "sidebar.nav.events",
      label: "Events",
      labelAr: "Ø§Ù„Ø­ÙÙ„Ø§Øª",
      icon: CalendarRange,
      children: [
        {
          id: "settings-team-venues",
          labelKey: "sidebar.nav.venues",
          label: "Venues",
          labelAr: "Ø§Ù„Ù‚Ø§Ø¹Ø§Øª",
          href: "/settings/venues",
          icon: Building2,
          subtitle:
            "Manage wedding halls, venue contacts, and location readiness.",
          subtitleAr: "Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù‚Ø§Ø¹Ø§Øª ÙˆØ¨ÙŠØ§Ù†Ø§Øª Ø§Ù„ØªÙˆØ§ØµÙ„ ÙˆØ¬Ø§Ù‡Ø²ÙŠØ© Ø§Ù„Ù…ÙˆØ§Ù‚Ø¹.",
        },
      ],
    },
  ];
}

function hasAccessRule(item: NavigationItem) {
  return Boolean(
    item.permission ||
    item.anyOf?.length ||
    item.allOf?.length ||
    item.roles?.length,
  );
}

function attachAccessRules(items: NavigationItem[]): NavigationItem[] {
  return items.map((item) => {
    const children = item.children
      ? attachAccessRules(item.children)
      : undefined;
    const routeAccess = item.href ? routeAccessByHref[item.href] : undefined;
    const nextItem: NavigationItem = {
      ...item,
      ...(routeAccess ?? {}),
      ...((item.permission || item.anyOf || item.allOf || item.roles) && {
        permission: item.permission,
        anyOf: item.anyOf,
        allOf: item.allOf,
        roles: item.roles,
      }),
      children,
    };

    if (!children?.length || hasAccessRule(nextItem)) {
      return nextItem;
    }

    const inferredAnyOf = Array.from(
      new Set(
        children.flatMap((child) => [
          ...(child.permission ? [child.permission] : []),
          ...(child.anyOf ?? []),
        ]),
      ),
    );

    if (inferredAnyOf.length > 0) {
      nextItem.anyOf = inferredAnyOf;
    }

    return nextItem;
  });
}

export const navigationItems: NavigationItem[] =
  attachAccessRules(navigationTree);

export const secretarialNavigationLeaves: NavigationLeaf[] = (() => {
  const secretarialRoot = navigationItems.find(
    (item) => item.id === SECRETARIAL_ROOT_ID,
  );

  if (!secretarialRoot?.children?.length) {
    return [];
  }

  return flattenNavigationLeaves(secretarialRoot.children, [
    SECRETARIAL_ROOT_ID,
  ]);
})();

export const inventoryNavigationLeaves: NavigationLeaf[] = (() => {
  const inventoryRoot = navigationItems.find(
    (item) => item.id === INVENTORY_ROOT_ID,
  );

  if (!inventoryRoot?.children?.length) {
    return [];
  }

  return flattenNavigationLeaves(inventoryRoot.children, [INVENTORY_ROOT_ID]).filter(
    (item) => item.href === "/inventory",
  );
})();

export const designerDetailsNavigationLeaves: NavigationLeaf[] = (() => {
  const designerDetailsRoot = navigationItems.find(
    (item) => item.id === DESIGNER_DETAILS_ROOT_ID,
  );

  if (!designerDetailsRoot) {
    return [];
  }

  return flattenNavigationLeaves([designerDetailsRoot], []);
})();

export const reportsNavigationLeaves: NavigationLeaf[] = (() => {
  const reportsRoot = navigationItems.find(
    (item) => item.id === REPORTS_ROOT_ID,
  );

  if (!reportsRoot?.children?.length) {
    return [];
  }

  return flattenNavigationLeaves(reportsRoot.children, [REPORTS_ROOT_ID]);
})();

export const settingsNavigationLeaves: NavigationLeaf[] = (() => {
  const settingsRoot = navigationItems.find(
    (item) => item.id === SETTINGS_ROOT_ID,
  );
  const teamRoot = settingsRoot?.children?.find(
    (item) => item.id === "settings-team",
  );

  if (!teamRoot?.children?.length) {
    return [];
  }

  return flattenNavigationLeaves(teamRoot.children, [
    SETTINGS_ROOT_ID,
    teamRoot.id,
  ]);
})();

export function flattenNavigationLeaves(
  items: NavigationItem[],
  parents: string[] = [],
): NavigationLeaf[] {
  return items.flatMap((item) => {
    const nextParents = [...parents, item.id];
    const ownLeaf = item.href ? [{ ...item, parents }] : [];
    const childLeaves = item.children
      ? flattenNavigationLeaves(item.children, nextParents)
      : [];

    return [...ownLeaf, ...childLeaves];
  });
}

export function collectExpandedNavigationIds(
  items: NavigationItem[],
  pathname: string,
  search: string = "",
  parents: string[] = [],
): string[] {
  for (const item of items) {
    const nextParents = [...parents, item.id];

    if (matchesNavigationHref(pathname, search, item.href)) {
      return parents;
    }

    if (item.children) {
      const childParents = collectExpandedNavigationIds(
        item.children,
        pathname,
        search,
        nextParents,
      );

      if (childParents.length > 0) {
        return childParents;
      }
    }
  }

  return [];
}


