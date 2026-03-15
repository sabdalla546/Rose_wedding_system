import {
  Navigate,
  Outlet,
  createBrowserRouter,
  useLocation,
} from "react-router-dom";

import { AppShell } from "@/app/layouts/app-shell";
import { useAuth } from "@/app/providers/use-auth";
import {
  flattenNavigationLeaves,
  type NavigationLeaf,
  navigationItems,
} from "@/lib/constants/navigation";
import { routePermissionByHref } from "@/lib/constants/route-permissions";
import { CalendarPage } from "@/pages/calendar/calendar-page";
import { DashboardPage } from "@/pages/dashboard/dashboard-page";
import { LoginPage } from "@/pages/auth/login-page";
import { ModulePlaceholderPage } from "@/pages/shared/module-placeholder-page";

const navigationLeaves = flattenNavigationLeaves(navigationItems);

function createModuleRoute(item: NavigationLeaf) {
  if (!item.href) {
    return null;
  }

  if (item.href === "/dashboard") {
    return {
      path: "dashboard",
      element: <DashboardPage />,
      handle: {
        titleKey: item.labelKey,
        title: item.label ?? "Dashboard",
        titleAr: item.labelAr,
        subtitle: item.subtitle,
        subtitleAr: item.subtitleAr,
      },
    };
  }

  if (item.href === "/calendar") {
    return {
      path: "calendar",
      element: <CalendarPage />,
      handle: {
        titleKey: item.labelKey,
        title: item.label ?? "Calendar",
        titleAr: item.labelAr,
        subtitle: item.subtitle,
        subtitleAr: item.subtitleAr,
      },
    };
  }

  return {
    path: item.href.replace(/^\//, ""),
    element: <ModulePlaceholderPage />,
      handle: {
        titleKey: item.labelKey,
        title: item.label,
        titleAr: item.labelAr,
        subtitle: item.subtitle,
        subtitleAr: item.subtitleAr,
        requiredPermission: routePermissionByHref[item.href],
      },
  };
}

function SessionScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 text-center">
      <div
        className="rounded-[28px] border px-8 py-6"
        style={{
          background: "var(--lux-panel-surface)",
          borderColor: "var(--lux-panel-border)",
        }}
      >
        <p className="text-sm uppercase tracking-[0.24em] text-[var(--lux-gold)]">
          WeddingPro
        </p>
        <p className="mt-3 text-base text-[var(--lux-text-secondary)]">
          Connecting to your workspace...
        </p>
      </div>
    </main>
  );
}

function RequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <SessionScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  return <Outlet />;
}

function RedirectIfAuthenticated() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <SessionScreen />;
  }

  if (isAuthenticated) {
    return <Navigate replace to="/dashboard" />;
  }

  return <Outlet />;
}

export const router = createBrowserRouter([
  {
    element: <RedirectIfAuthenticated />,
    children: [
      {
        path: "/login",
        element: <LoginPage />,
      },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        path: "/",
        element: <AppShell />,
        children: [
          {
            index: true,
            element: <Navigate replace to="/dashboard" />,
          },
          ...navigationLeaves
            .map(createModuleRoute)
            .filter(
              (
                route
              ): route is NonNullable<ReturnType<typeof createModuleRoute>> =>
                Boolean(route)
            ),
        ],
      },
    ],
  },
]);
