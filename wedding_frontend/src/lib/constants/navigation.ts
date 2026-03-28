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
  LandmarkIcon,
  HandshakeIcon,
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
    subtitleAr: "نظرة عامة على الحجوزات وعروض الأسعار والمدفوعات والعمليات.",
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
        labelAr: "الموعيد اليوميه",
        href: "/appointments?view=calendar",
        icon: CalendarDays,
        subtitle:
          "Operational calendar for customer appointments and follow-ups.",
        subtitleAr: "إدارة مواعيد الفعاليات والحجوزات وتوفر المواقع.",
      },
      {
        id: "events-calendar",
        labelKey: "sidebar.nav.eventsCalendar",
        label: "Events Calendar",
        labelAr: "تقويم الحفلات",
        href: "/events?view=calendar",
        icon: CalendarRange,
        subtitle: "Operational calendar for wedding events and venue planning.",
        subtitleAr: "تقويم تشغيلي للحفلات وتخطيط القاعات.",
      },
      {
        id: "events-all",
        labelKey: "sidebar.nav.allEvents",
        label: "All Events",
        labelAr: "حجز حفلة",
        href: "/events",
        icon: CalendarRange,
        subtitle:
          "Manage wedding events, planning sections, and linked records.",
        subtitleAr: "إدارة الحفلات وأقسام التخطيط والروابط المرتبطة.",
      },
      {
        id: "calendar-appointments",
        labelKey: "sidebar.nav.appointments",
        label: "Appointments",
        labelAr: "المواعيد",
        href: "/appointments",
        icon: CalendarCheck2,
        subtitle:
          "Manage lead appointments, meeting statuses, and team assignment.",
        subtitleAr:
          "إدارة مواعيد العملاء المحتملين وحالة الاجتماع وتوزيع الفريق.",
      },

      {
        id: "customers-all",
        labelKey: "sidebar.nav.allCustomers",
        label: "All Customers",
        labelAr: "كل العملاء",
        href: "/customers",
        icon: UsersRound,
        subtitle:
          "Access complete customer profiles, history, and touchpoints.",
        subtitleAr: "الوصول إلى ملفات العملاء الكاملة وسجل التعاملات.",
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
        labelKey: "sidebar.nav.stockItems",
        label: "Stock Items",
        labelAr: "أصناف المخزون",
        href: "/inventory",
        icon: PackageOpen,
        subtitle:
          "Monitor inventory quantities, categories, and condition status.",
        subtitleAr: "متابعة كميات المخزون وتصنيفاته وحالته.",
      },
      {
        id: "inventory-reservations",
        labelKey: "sidebar.nav.inventoryReservations",
        label: "Reservations",
        labelAr: "الحجوزات المخزنية",
        href: "/inventory/reservations",
        icon: ClipboardCheck,
        subtitle:
          "Reserve decor, furniture, and technical items for upcoming events.",
        subtitleAr: "حجز عناصر الديكور والأثاث والمعدات للفعاليات القادمة.",
      },
      {
        id: "inventory-orders",
        labelKey: "sidebar.nav.purchaseOrders",
        label: "Purchase Orders",
        labelAr: "أوامر الشراء",
        href: "/inventory/purchase-orders",
        icon: PackagePlus,
        subtitle: "Track replenishment orders and supplier delivery readiness.",
        subtitleAr: "متابعة أوامر التوريد وجاهزية التسليم من الموردين.",
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
        labelAr: "نظرة عامة على الإيرادات",
        href: "/reports/revenue",
        icon: TrendingUp,
        subtitle:
          "Track revenue trends, collection velocity, and monthly targets.",
        subtitleAr: "متابعة اتجاهات الإيرادات وسرعة التحصيل والأهداف الشهرية.",
      },
      {
        id: "reports-bookings",
        labelKey: "sidebar.nav.bookingAnalytics",
        label: "Booking Analytics",
        labelAr: "تحليلات الحجوزات",
        href: "/reports/bookings",
        icon: CalendarRange,
        subtitle: "Analyze conversion, booking volume, and seasonal demand.",
        subtitleAr: "تحليل التحويلات وحجم الحجوزات والطلب الموسمي.",
      },
      {
        id: "reports-utilization",
        labelKey: "sidebar.nav.resourceUtilization",
        label: "Resource Utilization",
        labelAr: "استخدام الموارد",
        href: "/reports/utilization",
        icon: ChartColumnBig,
        subtitle:
          "Measure hall, staff, and inventory utilization across events.",
        subtitleAr: "قياس استخدام القاعات والموظفين والمخزون عبر الفعاليات.",
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
        labelAr: "أدوار الفريق",
        href: "/settings/team",
        icon: UserCog,
        subtitle:
          "Configure access levels, coordinators, and team responsibilities.",
        subtitleAr: "إعداد مستويات الوصول والمنسقين ومسؤوليات الفريق.",
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
      labelAr: "المستخدمون",
      href: "/settings/team/users",
      icon: Users,
      subtitle: "Manage system users, status, and assigned roles.",
      subtitleAr: "إدارة المستخدمين والحالة والأدوار المسندة.",
    },
    {
      id: "settings-team-roles",
      labelKey: "sidebar.nav.roles",
      label: "Roles",
      labelAr: "الأدوار",
      href: "/settings/team/roles",
      icon: ShieldCheck,
      subtitle: "Configure role definitions and permission bundles.",
      subtitleAr: "إعداد تعريفات الأدوار وحزم الصلاحيات.",
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
      labelAr: "الحفلات",
      icon: CalendarRange,
      children: [
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
        {
          id: "settings-team-venues",
          labelKey: "sidebar.nav.venues",
          label: "Venues",
          labelAr: "القاعات",
          href: "/settings/venues",
          icon: Building2,
          subtitle:
            "Manage wedding halls, venue contacts, and location readiness.",
          subtitleAr: "إدارة القاعات وبيانات التواصل وجاهزية المواقع.",
        },
        {
          id: "settings-team-vendors",
          labelKey: "sidebar.nav.vendors",
          label: "Vendors",
          labelAr: "الشركات",
          href: "/settings/vendors",
          icon: Handshake,
          subtitle:
            "Manage external vendors, service types, and operational contacts.",
          subtitleAr: "إدارة الشركات الخارجية وأنواع الخدمات وبيانات التواصل.",
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

  return flattenNavigationLeaves(inventoryRoot.children, [INVENTORY_ROOT_ID]);
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

  // Only show Settings > Team leaves (Users, Roles) in the section bar.
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
