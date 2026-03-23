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
    id: "Secretarial",
    labelKey: "sidebar.nav.Secretarial",
    icon: CalendarCheck2,
    children: [
      {
        id: "calendars",
        labelKey: "sidebar.nav.calendars",
        icon: CalendarRange,
        children: [
          {
            id: "calendar-master",
            labelKey: "sidebar.nav.calendar",
            label: "Master Calendar",
            labelAr: "الموعيد اليوميه",
            href: "/calendar",
            icon: CalendarDays,
            subtitle: "Manage event dates, bookings, and venue availability.",
            subtitleAr: "إدارة مواعيد الفعاليات والحجوزات وتوفر المواقع.",
          },
          {
            id: "events-all",
            labelKey: "sidebar.nav.allEvents",
            label: "All Events",
            labelAr: " حجز حفلة",
            href: "/events",
            icon: CalendarRange,
            subtitle:
              "Manage wedding events, planning sections, and linked records.",
            subtitleAr:
              "\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u062d\u0641\u0644\u0627\u062a \u0648\u0623\u0642\u0633\u0627\u0645 \u0627\u0644\u062a\u062e\u0637\u064a\u0637 \u0648\u0627\u0644\u0631\u0648\u0627\u0628\u0637 \u0627\u0644\u0645\u0631\u062a\u0628\u0637\u0629.",
          },
          {
            id: "calendar-appointments",
            labelKey: "sidebar.nav.appointments",
            label: "Appointments",
            labelAr: "\u0627\u0644\u0645\u0648\u0627\u0639\u064a\u062f",
            href: "/appointments",
            icon: CalendarCheck2,
            subtitle:
              "Manage lead appointments, meeting statuses, and team assignment.",
            subtitleAr:
              "\u0625\u062f\u0627\u0631\u0629 \u0645\u0648\u0627\u0639\u064a\u062f \u0627\u0644\u0639\u0645\u0644\u0627\u0621 \u0627\u0644\u0645\u062d\u062a\u0645\u0644\u064a\u0646 \u0648\u062d\u0627\u0644\u0627\u062a \u0627\u0644\u0627\u062c\u062a\u0645\u0627\u0639 \u0648\u062a\u0648\u0632\u064a\u0639 \u0627\u0644\u0641\u0631\u064a\u0642.",
          },
        ],
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

const secretarialCustomersItem = navigationTree
  .find((item) => item.id === "Secretarial")
  ?.children?.find((item) => item.id === "customers");

if (secretarialCustomersItem) {
  secretarialCustomersItem.children = [
    ...(secretarialCustomersItem.children ?? []),
  ];
}

const secretarialRootItem = navigationTree.find(
  (item) => item.id === "Secretarial",
);

if (secretarialRootItem?.children) {
  secretarialRootItem.children = [
    ...secretarialRootItem.children,
    {
      id: "events-app",
      labelKey: "sidebar.nav.events",
      label: "Events",
      labelAr: "\u0627\u0644\u062d\u0641\u0644\u0627\u062a",
      icon: CalendarRange,
      children: [
        {
          id: "quotations-all",
          labelKey: "sidebar.nav.quotations",
          label: "Quotations",
          labelAr:
            "\u0639\u0631\u0648\u0636 \u0627\u0644\u0623\u0633\u0639\u0627\u0631",
          href: "/quotations",
          icon: FileText,
          subtitle:
            "Manage quotation documents, issue dates, totals, and linked event pricing.",
          subtitleAr:
            "\u0625\u062f\u0627\u0631\u0629 \u0639\u0631\u0648\u0636 \u0627\u0644\u0623\u0633\u0639\u0627\u0631 \u0648\u062a\u0648\u0627\u0631\u064a\u062e \u0625\u0635\u062f\u0627\u0631\u0647\u0627 \u0648\u0625\u062c\u0645\u0627\u0644\u064a\u0627\u062a\u0647\u0627 \u0648\u0627\u0631\u062a\u0628\u0627\u0637\u0647\u0627 \u0628\u0627\u0644\u062d\u0641\u0644.",
        },
        {
          id: "contracts-all",
          labelKey: "sidebar.nav.contracts",
          label: "Contracts",
          labelAr: "\u0627\u0644\u0639\u0642\u0648\u062f",
          href: "/contracts",
          icon: FileSignature,
          subtitle:
            "Manage contract documents, payment plans, and linked event commitments.",
          subtitleAr:
            "\u0625\u062f\u0627\u0631\u0629 \u0648\u062b\u0627\u0626\u0642 \u0627\u0644\u0639\u0642\u0648\u062f \u0648\u062e\u0637\u0637 \u0627\u0644\u062f\u0641\u0639\u0627\u062a \u0648\u0627\u0644\u0627\u0644\u062a\u0632\u0627\u0645\u0627\u062a \u0627\u0644\u0645\u0631\u062a\u0628\u0637\u0629 \u0628\u0627\u0644\u062d\u0641\u0644.",
        },
        {
          id: "settings-team-venues",
          labelKey: "sidebar.nav.venues",
          label: "Venues",
          labelAr: "\u0627\u0644\u0642\u0627\u0639\u0627\u062a",
          href: "/settings/venues",
          icon: Building2,
          subtitle:
            "Manage wedding halls, venue contacts, and location readiness.",
          subtitleAr:
            "\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0642\u0627\u0639\u0627\u062a \u0648\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u062a\u0648\u0627\u0635\u0644 \u0648\u062c\u0627\u0647\u0632\u064a\u0629 \u0627\u0644\u0645\u0648\u0627\u0642\u0639.",
        },
        {
          id: "settings-team-vendors",
          labelKey: "sidebar.nav.vendors",
          label: "Vendors",
          labelAr: "\u0627\u0644\u0634\u0631\u0643\u0627\u062a",
          href: "/settings/vendors",
          icon: Handshake,
          subtitle:
            "Manage external vendors, service types, and operational contacts.",
          subtitleAr:
            "\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0634\u0631\u0643\u0627\u062a \u0627\u0644\u062e\u0627\u0631\u062c\u064a\u0629 \u0648\u0623\u0646\u0648\u0627\u0639 \u0627\u0644\u062e\u062f\u0645\u0627\u062a \u0648\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u062a\u0648\u0627\u0635\u0644.",
        },
        {
          id: "settings-team-services",
          labelKey: "sidebar.nav.services",
          label: "Services",
          labelAr: "\u0627\u0644\u062e\u062f\u0645\u0627\u062a",
          href: "/settings/services",
          icon: PackageOpen,
          subtitle:
            "Manage catalog services, pricing types, and operational event items.",
          subtitleAr:
            "\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u062e\u062f\u0645\u0627\u062a \u0648\u0623\u0646\u0648\u0627\u0639 \u0627\u0644\u062a\u0633\u0639\u064a\u0631 \u0648\u0628\u0646\u0648\u062f \u0627\u0644\u062d\u0641\u0644 \u0627\u0644\u062a\u0634\u063a\u064a\u0644\u064a\u0629.",
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
  parents: string[] = [],
): string[] {
  for (const item of items) {
    const nextParents = [...parents, item.id];

    if (item.href === pathname) {
      return parents;
    }

    if (item.children) {
      const childParents = collectExpandedNavigationIds(
        item.children,
        pathname,
        nextParents,
      );

      if (childParents.length > 0) {
        return childParents;
      }
    }
  }

  return [];
}
