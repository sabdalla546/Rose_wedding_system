import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BriefcaseBusiness,
  CalendarCheck2,
  CalendarClock,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  FileCheck2,
  FileClock,
  FileStack,
  FolderKanban,
  LayoutDashboard,
  PackageCheck,
  PackageSearch,
  ReceiptText,
  Settings,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserRoundCheck,
  UserRoundSearch,
  UsersRound,
  WalletCards,
} from "lucide-react";

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
};

export type NavigationLeaf = NavigationItem & {
  parents: string[];
};

export const navigationItems: NavigationItem[] = [
  {
    id: "dashboard",
    labelKey: "sidebar.nav.dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    subtitle: "Overview of bookings, quotations, payments, and operations.",
    subtitleAr: "نظرة عامة على الحجوزات وعروض الأسعار والمدفوعات والعمليات.",
  },
  {
    id: "calendar",
    labelKey: "sidebar.nav.calendar",
    icon: CalendarDays,
    children: [
      {
        id: "calendar-master",
        labelKey: "sidebar.nav.calendar",
        label: "Master Calendar",
        labelAr: "التقويم الرئيسي",
        href: "/calendar",
        icon: CalendarDays,
        subtitle: "Manage event dates, bookings, and venue availability.",
        subtitleAr: "إدارة مواعيد الفعاليات والحجوزات وتوفر المواقع.",
      },
      {
        id: "quotations",
        labelKey: "sidebar.nav.quotations",
        icon: ClipboardList,
        children: [
          {
            id: "quotations-drafts",
            labelKey: "sidebar.nav.draftQuotations",
            label: "Draft Quotations",
            labelAr: "مسودات العروض",
            href: "/quotations/drafts",
            icon: FileClock,
            subtitle:
              "Work on quotation drafts before sending them to clients.",
            subtitleAr: "العمل على مسودات عروض الأسعار قبل إرسالها للعملاء.",
          },
          /**
          *  {
            id: "quotations-sent",
            labelKey: "sidebar.nav.sentQuotations",
            label: "Sent Quotations",
            labelAr: "العروض المرسلة",
            href: "/quotations/sent",
            icon: ReceiptText,
            subtitle:
              "Track quotations awaiting feedback, revision, or approval.",
            subtitleAr: "متابعة العروض بانتظار الرد أو التعديل أو الاعتماد.",
          },
          */
          {
            id: "quotations-approved",
            labelKey: "sidebar.nav.approvedQuotations",
            label: "Approved Quotations",
            labelAr: "العروض المعتمدة",
            href: "/quotations/approved",
            icon: FileCheck2,
            subtitle: "View approved quotations ready for booking conversion.",
            subtitleAr: "عرض العروض المعتمدة الجاهزة للتحويل إلى حجوزات.",
          },
        ],
      },
      /**
       * {
        id: "calendar-availability",
        labelKey: "sidebar.nav.calendarAvailability",
        label: "Venue Availability",
        labelAr: "توفر المواقع",
        href: "/calendar/availability",
        icon: CalendarCheck2,
        subtitle:
          "Review hall availability, blackouts, and pending date holds.",
        subtitleAr: "مراجعة توفر القاعات وفترات الإغلاق والحجوزات المعلقة.",
      },
      {
        id: "calendar-coordinators",
        labelKey: "sidebar.nav.coordinatorView",
        label: "Coordinator View",
        labelAr: "عرض المنسقين",
        href: "/calendar/coordinators",
        icon: CalendarClock,
        subtitle: "Track coordinator schedules and execution readiness by day.",
        subtitleAr: "متابعة جداول المنسقين وجاهزية التنفيذ حسب اليوم.",
      },
       */
    ],
  },
  /**
  *  {
    id: "leads",
    labelKey: "sidebar.nav.leads",
    icon: Sparkles,
    children: [
      {
        id: "leads-pipeline",
        labelKey: "sidebar.nav.leadsPipeline",
        label: "Lead Pipeline",
        labelAr: "مسار العملاء المحتملين",
        href: "/leads",
        icon: Sparkles,
        subtitle:
          "Monitor inquiries, outreach stages, and conversion momentum.",
        subtitleAr: "متابعة الاستفسارات ومراحل التواصل وفرص التحويل.",
      },
      {
        id: "leads-followups",
        labelKey: "sidebar.nav.followUps",
        label: "Follow-Ups",
        labelAr: "المتابعات",
        href: "/leads/follow-ups",
        icon: ClipboardCheck,
        subtitle: "Keep track of callbacks, reminders, and next lead actions.",
        subtitleAr: "متابعة الاتصالات القادمة والتذكيرات والإجراءات التالية.",
      },
      {
        id: "leads-campaigns",
        labelKey: "sidebar.nav.campaignResponses",
        label: "Campaign Responses",
        labelAr: "ردود الحملات",
        href: "/leads/campaign-responses",
        icon: UserRoundSearch,
        subtitle: "Measure campaign-driven inquiries and source performance.",
        subtitleAr: "قياس استفسارات الحملات وأداء مصادر العملاء المحتملين.",
      },
    ],
  },
  */
  {
    id: "customers",
    labelKey: "sidebar.nav.customers",
    icon: UsersRound,
    children: [
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
      {
        id: "customers-vip",
        labelKey: "sidebar.nav.vipCustomers",
        label: "VIP Customers",
        labelAr: "العملاء المميزون",
        href: "/customers/vip",
        icon: UserRoundCheck,
        subtitle: "Review premium customers, preferences, and concierge notes.",
        subtitleAr: "مراجعة العملاء المميزين وتفضيلاتهم وملاحظاتهم الخاصة.",
      },
      {
        id: "customers-segments",
        labelKey: "sidebar.nav.customerSegments",
        label: "Customer Segments",
        labelAr: "شرائح العملاء",
        href: "/customers/segments",
        icon: FileStack,
        subtitle:
          "Segment customers by event type, spend, and acquisition source.",
        subtitleAr: "تصنيف العملاء حسب نوع الفعالية والإنفاق ومصدر الاكتساب.",
      },
    ],
  },

  /**
   * {
    id: "bookings",
    labelKey: "sidebar.nav.bookings",
    icon: BriefcaseBusiness,
    children: [
      {
        id: "bookings-all",
        labelKey: "sidebar.nav.allBookings",
        label: "All Bookings",
        labelAr: "كل الحجوزات",
        href: "/bookings",
        icon: BriefcaseBusiness,
        subtitle:
          "Review confirmed, tentative, and completed bookings in one place.",
        subtitleAr: "مراجعة الحجوزات المؤكدة والمبدئية والمكتملة في مكان واحد.",
      },
      {
        id: "bookings-confirmed",
        labelKey: "sidebar.nav.confirmedEvents",
        label: "Confirmed Events",
        labelAr: "الفعاليات المؤكدة",
        href: "/bookings/confirmed",
        icon: CalendarCheck2,
        subtitle:
          "Focus on secured events that are ready for execution planning.",
        subtitleAr: "التركيز على الفعاليات المؤكدة الجاهزة للتنفيذ.",
      },
      {
        id: "bookings-contracts",
        labelKey: "sidebar.nav.contracts",
        label: "Contracts",
        labelAr: "العقود",
        href: "/bookings/contracts",
        icon: FileStack,
        subtitle:
          "Manage signed agreements, pending signatures, and document status.",
        subtitleAr: "إدارة العقود الموقعة والمنتظرة وحالة المستندات.",
      },
    ],
  },
   */
  /**
  *  {
    id: "operations",
    labelKey: "sidebar.nav.operations",
    icon: FolderKanban,
    children: [
      {
        id: "operations-timeline",
        labelKey: "sidebar.nav.timelineBoard",
        label: "Timeline Board",
        labelAr: "لوحة الجدول الزمني",
        href: "/operations/timeline",
        icon: FolderKanban,
        subtitle: "Coordinate setup, rehearsal, and event-day milestones.",
        subtitleAr: "تنسيق التجهيز والبروفات ومراحل يوم الفعالية.",
      },
      {
        id: "operations-tasks",
        labelKey: "sidebar.nav.teamTasks",
        label: "Team Tasks",
        labelAr: "مهام الفريق",
        href: "/operations/tasks",
        icon: ClipboardCheck,
        subtitle:
          "Assign and track operational tasks across event departments.",
        subtitleAr: "توزيع ومتابعة المهام التشغيلية بين فرق العمل.",
      },
      {
        id: "operations-checklists",
        labelKey: "sidebar.nav.eventChecklists",
        label: "Event Checklists",
        labelAr: "قوائم التحقق",
        href: "/operations/checklists",
        icon: ClipboardList,
        subtitle: "Standardize execution checklists for every event package.",
        subtitleAr: "توحيد قوائم التحقق لكل باقة فعالية.",
      },
    ],
  },
  */
  {
    id: "inventory",
    labelKey: "sidebar.nav.inventory",
    icon: PackageSearch,
    children: [
      {
        id: "inventory-stock",
        labelKey: "sidebar.nav.stockItems",
        label: "Stock Items",
        labelAr: "أصناف المخزون",
        href: "/inventory",
        icon: PackageSearch,
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
        icon: PackageCheck,
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
        icon: FileStack,
        subtitle: "Track replenishment orders and supplier delivery readiness.",
        subtitleAr: "متابعة أوامر التوريد وجاهزية التسليم من الموردين.",
      },
    ],
  },
  /*
  {
    id: "payments",
    labelKey: "sidebar.nav.payments",
    icon: CreditCard,
    children: [
      {
        id: "payments-transactions",
        labelKey: "sidebar.nav.transactions",
        label: "Transactions",
        labelAr: "الحركات المالية",
        href: "/payments",
        icon: WalletCards,
        subtitle:
          "View all incoming payments, adjustments, and payment records.",
        subtitleAr: "عرض جميع الدفعات الواردة والتعديلات والسجلات المالية.",
      },
    
      {
        id: "payments-pending",
        labelKey: "sidebar.nav.pendingDeposits",
        label: "Pending Deposits",
        labelAr: "العربونات المعلقة",
        href: "/payments/pending",
        icon: FileClock,
        subtitle: "Identify bookings still waiting for deposit confirmation.",
        subtitleAr: "تحديد الحجوزات التي لا تزال بانتظار تأكيد العربون.",
      },
     
      {
        id: "payments-overdue",
        labelKey: "sidebar.nav.overdueBalances",
        label: "Overdue Balances",
        labelAr: "الأرصدة المتأخرة",
        href: "/payments/overdue",
        icon: CreditCard,
        subtitle: "Review overdue balances and follow-up collection activity.",
        subtitleAr: "مراجعة الأرصدة المتأخرة ومتابعة التحصيل.",
      },
    ],
  },*/
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
        icon: BarChart3,
        subtitle: "Analyze conversion, booking volume, and seasonal demand.",
        subtitleAr: "تحليل التحويلات وحجم الحجوزات والطلب الموسمي.",
      },
      {
        id: "reports-utilization",
        labelKey: "sidebar.nav.resourceUtilization",
        label: "Resource Utilization",
        labelAr: "استخدام الموارد",
        href: "/reports/utilization",
        icon: ClipboardCheck,
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
        icon: UsersRound,
        subtitle:
          "Configure access levels, coordinators, and team responsibilities.",
        subtitleAr: "إعداد مستويات الوصول والمنسقين ومسؤوليات الفريق.",
      },
    ],
  },
];

const settingsTeamItem = navigationItems
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
      icon: UsersRound,
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
