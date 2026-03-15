import "@/lib/i18n";
import { RouterProvider } from "react-router-dom";

import { AuthProvider } from "@/app/providers/auth-provider";
import { LocalizationProvider } from "@/app/providers/localization-provider";
import { ThemeProvider } from "@/app/providers/theme-provider";
import { ToastProvider } from "@/app/providers/toast-provider";
import { router } from "@/app/router";

export function AppProviders() {
  return (
    <ThemeProvider>
      <LocalizationProvider>
        <ToastProvider>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </ToastProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}
