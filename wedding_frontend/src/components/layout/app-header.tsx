import {
  Bell,
  Menu,
  MessageSquareText,
  MoonStar,
  Search,
  ShieldAlert,
  SunMedium,
} from "lucide-react";
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
      className="fixed z-[120] overflow-hidden backdrop-blur-xl"
      style={{
        ...fixedStyle,
        background:
          "color-mix(in srgb, var(--lux-shell-surface) 96%, transparent)",
      }}
    >
      <div
        className="flex w-full items-center gap-3  px-3 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.08)] md:px-4"
        style={{
          background:
            "color-mix(in srgb, var(--lux-shell-surface) 92%, transparent)",
        }}
      >
        <Button
          className="h-12 w-12 rounded-[18px]"
          size="icon"
          type="button"
          variant="secondary"
          onClick={onToggleSidebar}
        >
          <Menu
            className={cn(
              "h-4 w-4 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
              !isMobile && !sidebarOpen && "rotate-180",
            )}
          />
        </Button>

        <div className="flex-1">
          <SearchInput className="mx-auto max-w-[640px]" />
        </div>

        <div className="flex items-center gap-2">
          <button
            aria-label={
              theme === "dark" ? t("common.lightMode") : t("common.darkMode")
            }
            className="hidden h-12 w-12 items-center justify-center rounded-[18px] border text-[var(--lux-text)] sm:inline-flex"
            style={{
              background: "var(--lux-control-surface)",
              borderColor: "var(--lux-control-border)",
            }}
            type="button"
            onClick={toggleTheme}
          >
            {theme === "dark" ? (
              <SunMedium className="h-4 w-4" />
            ) : (
              <MoonStar className="h-4 w-4" />
            )}
          </button>
          <div
            className="hidden rounded-[18px] border p-1 sm:flex"
            style={{
              background: "var(--lux-control-surface)",
              borderColor: "var(--lux-control-border)",
            }}
          >
            <button
              className={`rounded-[14px] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] ${
                i18n.resolvedLanguage === "en"
                  ? "text-[var(--lux-text)]"
                  : "text-[var(--lux-text-secondary)]"
              }`}
              style={
                i18n.resolvedLanguage === "en"
                  ? { background: "var(--lux-control-hover)" }
                  : undefined
              }
              type="button"
              onClick={() => void i18n.changeLanguage("en")}
            >
              EN
            </button>
            <button
              className={`rounded-[14px] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] ${
                i18n.resolvedLanguage === "ar"
                  ? "text-[var(--lux-text)]"
                  : "text-[var(--lux-text-secondary)]"
              }`}
              style={
                i18n.resolvedLanguage === "ar"
                  ? { background: "var(--lux-control-hover)" }
                  : undefined
              }
              type="button"
              onClick={() => void i18n.changeLanguage("ar")}
            >
              AR
            </button>
          </div>
          <IconAction icon={Search} />
          <IconAction badge="3" icon={Bell} />
          <IconAction badge="2" icon={MessageSquareText} />
          <IconAction icon={ShieldAlert} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="h-12 gap-3 rounded-[20px] px-3 md:px-4"
                variant="secondary"
              >
                <Avatar className="h-9 w-9">
                  <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                </Avatar>
                <div className="hidden text-left md:block">
                  <p className="text-sm font-semibold text-[var(--lux-text)]">
                    {displayName}
                  </p>
                  {displaySubtitle ? (
                    <p className="text-xs text-[var(--lux-text-muted)]">
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

type IconActionProps = {
  icon: typeof Bell;
  badge?: string;
};

function IconAction({ icon: Icon, badge }: IconActionProps) {
  return (
    <Button
      className="relative h-12 w-12 rounded-[18px]"
      size="icon"
      variant="secondary"
    >
      <Icon className="h-4 w-4" />
      {badge ? (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#c88f54] px-1 text-[10px] font-bold text-white shadow-[0_6px_14px_rgba(200,143,84,0.3)]">
          {badge}
        </span>
      ) : null}
    </Button>
  );
}
