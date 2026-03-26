import { Menu, MoonStar, SunMedium } from "lucide-react";
import { useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/app/providers/use-auth";
import { useTheme } from "@/app/providers/use-theme";
import { useToast } from "@/app/providers/use-toast";
import { SearchInput } from "@/components/shared/search-input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getApiErrorMessage } from "@/lib/axios";
import { cn, getInitials } from "@/lib/utils";

type AppHeaderProps = {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
  isMobile: boolean;
  fixedStyle?: CSSProperties;
};

export function AppHeader({
  onToggleSidebar,
  sidebarOpen,
  isMobile,
  fixedStyle,
}: AppHeaderProps) {
  const navigate = useNavigate();
  const { i18n, t } = useTranslation();
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await signOut();
      toast({
        title: t("auth.toast.logoutSuccessTitle"),
        description: t("auth.toast.logoutSuccessDescription"),
        variant: "success",
      });
      navigate("/login", { replace: true });
    } catch (error) {
      toast({
        title: t("auth.toast.logoutErrorTitle"),
        description: getApiErrorMessage(
          error,
          t("auth.toast.logoutErrorDescription"),
        ),
        variant: "error",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const displayName = user?.fullName ?? t("header.adminUser");
  const displaySubtitle = user?.email ?? "";

  return (
    <header
      className="fixed z-[120] overflow-hidden backdrop-blur-xl transition-[left,right] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[left,right]"
      style={{
        ...fixedStyle,
        background: "var(--lux-shell-chrome-surface)",
        borderBottom: "1px solid var(--lux-shell-border)",
      }}
    >
      <div
        className="flex w-full items-center gap-2 px-3 py-2 shadow-[0_12px_30px_rgba(0,0,0,0.08)] md:px-4"
        style={{
          background: "var(--lux-shell-chrome-elevated)",
          color: "var(--lux-shell-chrome-text)",
        }}
      >
        <Button
          className="h-9 w-9 rounded-[14px]"
          size="icon"
          type="button"
          variant="secondary"
          onClick={onToggleSidebar}
          style={{
            background: "var(--lux-shell-chrome-control)",
            borderColor: "var(--lux-shell-chrome-control-border)",
            color: "var(--lux-shell-chrome-text)",
          }}
        >
          <Menu
            className={cn(
              "h-3.5 w-3.5 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
              !isMobile && !sidebarOpen && "rotate-180",
            )}
          />
        </Button>

        <div className="flex-1">
          <SearchInput
            className="mx-auto max-w-[640px]"
            iconClassName="h-3.5 w-3.5 text-[var(--lux-shell-chrome-muted)]"
            inputClassName="h-9 rounded-[16px] border-[var(--lux-shell-chrome-control-border)] bg-[var(--lux-shell-chrome-control)] pl-10 text-sm text-[var(--lux-shell-chrome-text)] placeholder:text-[var(--lux-shell-chrome-muted)]"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            aria-label={
              theme === "dark" ? t("common.lightMode") : t("common.darkMode")
            }
            className="hidden h-9 w-9 items-center justify-center rounded-[14px] border text-[var(--lux-text)] sm:inline-flex"
            style={{
              background: "var(--lux-shell-chrome-control)",
              borderColor: "var(--lux-shell-chrome-control-border)",
              color: "var(--lux-shell-chrome-text)",
            }}
            type="button"
            onClick={toggleTheme}
          >
            {theme === "dark" ? (
              <SunMedium className="h-3.5 w-3.5" />
            ) : (
              <MoonStar className="h-3.5 w-3.5" />
            )}
          </button>
          <div
            className="hidden rounded-[14px] border p-1 sm:flex"
            style={{
              background: "var(--lux-shell-chrome-control)",
              borderColor: "var(--lux-shell-chrome-control-border)",
            }}
          >
            <button
              className={`rounded-[11px] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] ${
                i18n.resolvedLanguage === "en"
                  ? "text-[var(--lux-shell-surface)]"
                  : "text-[var(--lux-shell-chrome-muted)]"
              }`}
              style={
                i18n.resolvedLanguage === "en"
                  ? { background: "var(--lux-gold)" }
                  : undefined
              }
              type="button"
              onClick={() => void i18n.changeLanguage("en")}
            >
              EN
            </button>
            <button
              className={`rounded-[11px] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] ${
                i18n.resolvedLanguage === "ar"
                  ? "text-[var(--lux-shell-surface)]"
                  : "text-[var(--lux-shell-chrome-muted)]"
              }`}
              style={
                i18n.resolvedLanguage === "ar"
                  ? { background: "var(--lux-gold)" }
                  : undefined
              }
              type="button"
              onClick={() => void i18n.changeLanguage("ar")}
            >
              AR
            </button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="h-9 gap-2.5 rounded-[16px] px-2.5 md:px-3"
                variant="secondary"
                style={{
                  background: "var(--lux-shell-chrome-control)",
                  borderColor: "var(--lux-shell-chrome-control-border)",
                  color: "var(--lux-shell-chrome-text)",
                }}
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                </Avatar>
                <div className="hidden text-left md:block">
                  <p className="text-sm font-semibold leading-none text-[var(--lux-shell-chrome-text)]">
                    {displayName}
                  </p>
                  {displaySubtitle ? (
                    <p className="mt-1 text-xs leading-none text-[var(--lux-shell-chrome-muted)]">
                      {displaySubtitle}
                    </p>
                  ) : null}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  {t("header.workspaceSettings")}
                </DropdownMenuItem>
                <DropdownMenuItem>{t("header.billingCenter")}</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => void handleLogout()}>
                  {isLoggingOut ? "Signing out..." : t("header.logout")}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
