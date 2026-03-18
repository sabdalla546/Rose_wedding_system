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
import AppointmentDetailsPage from "@/pages/appointments/AppointmentDetails";
import AppointmentFormPage from "@/pages/appointments/AppointmentForm";
import AppointmentsPage from "@/pages/appointments/Appointments";
import { CalendarPage } from "@/pages/calendar/calendar-page";
import CustomerDetailsPage from "@/pages/customers/CustomerDetails";
import CustomerFormPage from "@/pages/customers/CustomerForm";
import CustomersPage from "@/pages/customers/Customers";
import { DashboardPage } from "@/pages/dashboard/dashboard-page";
import ContractDetailsPage from "@/pages/contracts/ContractDetails";
import ContractFormPage from "@/pages/contracts/ContractForm";
import ContractsPage from "@/pages/contracts/Contracts";
import EventDetailsPage from "@/pages/events/EventDetails";
import EventFormPage from "@/pages/events/EventForm";
import EventsPage from "@/pages/events/Events";
import QuotationDetailsPage from "@/pages/quotations/QuotationDetails";
import QuotationFormPage from "@/pages/quotations/QuotationForm";
import QuotationsPage from "@/pages/quotations/Quotations";
import VendorDetailsPage from "@/pages/vendors/VendorDetails";
import VendorFormPage from "@/pages/vendors/VendorForm";
import VendorsPage from "@/pages/vendors/Vendors";
import { LoginPage } from "@/pages/auth/login-page";
import LeadDetailsPage from "@/pages/leads/LeadDetails";
import LeadFormPage from "@/pages/leads/LeadForm";
import LeadsPage from "@/pages/leads/Leads";
import RoleFormPage from "@/pages/roles/RoleForm";
import RolesPage from "@/pages/roles/Roles";
import ServiceDetailsPage from "@/pages/services/ServiceDetails";
import ServiceFormPage from "@/pages/services/ServiceForm";
import ServicesPage from "@/pages/services/Services";
import UserFormPage from "@/pages/users/UserForm";
import UsersPage from "@/pages/users/Users";
import VenueFormPage from "@/pages/venues/VenueForm";
import VenuesPage from "@/pages/venues/Venues";
import { ModulePlaceholderPage } from "@/pages/shared/module-placeholder-page";

const navigationLeaves = flattenNavigationLeaves(navigationItems);
const explicitModulePaths = new Set([
  "/settings/team/users",
  "/settings/team/users/create",
  "/settings/team/users/edit/:id",
  "/settings/team/roles",
  "/settings/team/roles/create",
  "/settings/team/roles/edit/:id",
  "/settings/venues",
  "/settings/venues/create",
  "/settings/venues/edit/:id",
  "/settings/vendors",
  "/settings/vendors/create",
  "/settings/vendors/edit/:id",
  "/settings/vendors/:id",
  "/settings/services",
  "/settings/services/create",
  "/settings/services/edit/:id",
  "/settings/services/:id",
  "/leads",
  "/leads/create",
  "/leads/edit/:id",
  "/leads/:id",
  "/customers",
  "/customers/create",
  "/customers/edit/:id",
  "/customers/:id",
  "/events",
  "/events/create",
  "/events/edit/:id",
  "/events/:id",
  "/quotations",
  "/quotations/create",
  "/quotations/edit/:id",
  "/quotations/:id",
  "/contracts",
  "/contracts/create",
  "/contracts/edit/:id",
  "/contracts/:id",
  "/appointments",
  "/appointments/create",
  "/appointments/edit/:id",
  "/appointments/:id",
]);

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
          {
            path: "settings/team/users",
            element: <UsersPage />,
          },
          {
            path: "settings/team/users/create",
            element: <UserFormPage />,
          },
          {
            path: "settings/team/users/edit/:id",
            element: <UserFormPage />,
          },
          {
            path: "settings/team/roles",
            element: <RolesPage />,
          },
          {
            path: "settings/team/roles/create",
            element: <RoleFormPage />,
          },
          {
            path: "settings/team/roles/edit/:id",
            element: <RoleFormPage />,
          },
          {
            path: "settings/venues",
            element: <VenuesPage />,
          },
          {
            path: "settings/venues/create",
            element: <VenueFormPage />,
          },
          {
            path: "settings/venues/edit/:id",
            element: <VenueFormPage />,
          },
          {
            path: "settings/vendors",
            element: <VendorsPage />,
          },
          {
            path: "settings/vendors/create",
            element: <VendorFormPage />,
          },
          {
            path: "settings/vendors/edit/:id",
            element: <VendorFormPage />,
          },
          {
            path: "settings/vendors/:id",
            element: <VendorDetailsPage />,
          },
          {
            path: "settings/services",
            element: <ServicesPage />,
          },
          {
            path: "settings/services/create",
            element: <ServiceFormPage />,
          },
          {
            path: "settings/services/edit/:id",
            element: <ServiceFormPage />,
          },
          {
            path: "settings/services/:id",
            element: <ServiceDetailsPage />,
          },
          {
            path: "leads",
            element: <LeadsPage />,
          },
          {
            path: "leads/create",
            element: <LeadFormPage />,
          },
          {
            path: "leads/edit/:id",
            element: <LeadFormPage />,
          },
          {
            path: "leads/:id",
            element: <LeadDetailsPage />,
          },
          {
            path: "customers",
            element: <CustomersPage />,
          },
          {
            path: "customers/create",
            element: <CustomerFormPage />,
          },
          {
            path: "customers/edit/:id",
            element: <CustomerFormPage />,
          },
          {
            path: "customers/:id",
            element: <CustomerDetailsPage />,
          },
          {
            path: "events",
            element: <EventsPage />,
          },
          {
            path: "events/create",
            element: <EventFormPage />,
          },
          {
            path: "events/edit/:id",
            element: <EventFormPage />,
          },
          {
            path: "events/:id",
            element: <EventDetailsPage />,
          },
          {
            path: "quotations",
            element: <QuotationsPage />,
          },
          {
            path: "quotations/create",
            element: <QuotationFormPage />,
          },
          {
            path: "quotations/edit/:id",
            element: <QuotationFormPage />,
          },
          {
            path: "quotations/:id",
            element: <QuotationDetailsPage />,
          },
          {
            path: "contracts",
            element: <ContractsPage />,
          },
          {
            path: "contracts/create",
            element: <ContractFormPage />,
          },
          {
            path: "contracts/edit/:id",
            element: <ContractFormPage />,
          },
          {
            path: "contracts/:id",
            element: <ContractDetailsPage />,
          },
          {
            path: "appointments",
            element: <AppointmentsPage />,
          },
          {
            path: "appointments/create",
            element: <AppointmentFormPage />,
          },
          {
            path: "appointments/edit/:id",
            element: <AppointmentFormPage />,
          },
          {
            path: "appointments/:id",
            element: <AppointmentDetailsPage />,
          },
          ...navigationLeaves
            .filter((item) => !item.href || !explicitModulePaths.has(item.href))
            .map(createModuleRoute)
            .filter(
              (
                route,
              ): route is NonNullable<ReturnType<typeof createModuleRoute>> =>
                Boolean(route),
            ),
        ],
      },
    ],
  },
]);
