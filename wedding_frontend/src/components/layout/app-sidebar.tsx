import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useToast } from "@/app/providers/use-toast";
import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/axios";
import {
  INVENTORY_ROOT_ID,
  REPORTS_ROOT_ID,
  SECRETARIAL_ROOT_ID,
  SETTINGS_ROOT_ID,
  collectExpandedNavigationIds,
  matchesNavigationHref,
  navigationItems,
  inventoryNavigationLeaves,
  reportsNavigationLeaves,
  secretarialNavigationLeaves,
  settingsNavigationLeaves,
  type NavigationItem,
  type NavigationLeaf,
} from "@/lib/constants/navigation";
import { routeAccessByHref } from "@/lib/constants/route-permissions";
import { cn, getInitials } from "@/lib/utils";
import { useAuth } from "@/app/providers/use-auth";

const SIDEBAR_EXPANDED_WIDTH = 225;
const SIDEBAR_COLLAPSED_WIDTH = 70;
const SIDEBAR_HEADER_HEIGHT = 72;

const NAVIGATION_LABEL_FALLBACKS: Record<string, { en: string; ar: string }> = {
  "sidebar.nav.users": {
    en: "Users",
    ar: "المستخدمون",
  },
  "sidebar.nav.roles": {
    en: "Roles",
    ar: "الأدوار",
  },
};

type AppSidebarProps = {
  isOpen: boolean;
  compact?: boolean;
  onNavigate?: () => void;
  className?: string;
};

export function AppSidebar({
  isOpen,
  compact = false,
  onNavigate,
  className,
}: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { i18n, t } = useTranslation();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const isRtl = i18n.resolvedLanguage === "ar";
  const [hoverOpen, setHoverOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {},
  );
  const sidebarRef = useRef<HTMLDivElement>(null);
  const showFull = isOpen || hoverOpen;
  const autoExpandedIds = useMemo(
    () =>
      collectExpandedNavigationIds(
        navigationItems,
        location.pathname,
        location.search,
      ),
    [location.pathname, location.search],
  );

  const isSecretarialActive = useMemo(() => {
    return secretarialNavigationLeaves.some((leaf: NavigationLeaf) =>
      matchesNavigationHref(location.pathname, location.search, leaf.href),
    );
  }, [location.pathname, location.search]);

  const isInventoryActive = useMemo(() => {
    return inventoryNavigationLeaves.some((leaf: NavigationLeaf) =>
      matchesNavigationHref(location.pathname, location.search, leaf.href),
    );
  }, [location.pathname, location.search]);

  const isReportsActive = useMemo(() => {
    return reportsNavigationLeaves.some((leaf: NavigationLeaf) =>
      matchesNavigationHref(location.pathname, location.search, leaf.href),
    );
  }, [location.pathname, location.search]);

  const isSettingsActive = useMemo(() => {
    return settingsNavigationLeaves.some((leaf: NavigationLeaf) =>
      matchesNavigationHref(location.pathname, location.search, leaf.href),
    );
  }, [location.pathname, location.search]);

  const getFirstPermittedSecretarialHref = (): string | undefined => {
    if (!user) return undefined;

    for (const leaf of secretarialNavigationLeaves) {
      if (!leaf.href) continue;

      let allowed = true;

      if (leaf.permission) {
        allowed = user.permissions.includes(leaf.permission);
      }

      if (leaf.anyOf?.length) {
        allowed =
          allowed && leaf.anyOf.some((p) => user.permissions.includes(p));
      }

      if (leaf.allOf?.length) {
        allowed =
          allowed && leaf.allOf.every((p) => user.permissions.includes(p));
      }

      if (leaf.roles?.length) {
        allowed = allowed && leaf.roles.some((r) => user.roles.includes(r));
      }

      if (allowed) {
        return leaf.href;
      }
    }

    return undefined;
  };

  const getFirstPermittedInventoryHref = (): string | undefined => {
    if (!user) return undefined;

    for (const leaf of inventoryNavigationLeaves) {
      if (!leaf.href) continue;

      let allowed = true;

      if (leaf.permission) {
        allowed = user.permissions.includes(leaf.permission);
      }

      if (leaf.anyOf?.length) {
        allowed =
          allowed && leaf.anyOf.some((p) => user.permissions.includes(p));
      }

      if (leaf.allOf?.length) {
        allowed =
          allowed && leaf.allOf.every((p) => user.permissions.includes(p));
      }

      if (leaf.roles?.length) {
        allowed = allowed && leaf.roles.some((r) => user.roles.includes(r));
      }

      if (allowed) {
        return leaf.href;
      }
    }

    return undefined;
  };

  const getFirstPermittedReportsHref = (): string | undefined => {
    if (!user) return undefined;

    for (const leaf of reportsNavigationLeaves) {
      if (!leaf.href) continue;

      let allowed = true;

      if (leaf.permission) {
        allowed = user.permissions.includes(leaf.permission);
      }

      if (leaf.anyOf?.length) {
        allowed =
          allowed && leaf.anyOf.some((p) => user.permissions.includes(p));
      }

      if (leaf.allOf?.length) {
        allowed =
          allowed && leaf.allOf.every((p) => user.permissions.includes(p));
      }

      if (leaf.roles?.length) {
        allowed = allowed && leaf.roles.some((r) => user.roles.includes(r));
      }

      if (allowed) {
        return leaf.href;
      }
    }

    return undefined;
  };

  const getFirstPermittedSettingsHref = (): string | undefined => {
    if (!user) return undefined;

    for (const leaf of settingsNavigationLeaves) {
      if (!leaf.href) continue;

      let allowed = true;

      if (leaf.permission) {
        allowed = user.permissions.includes(leaf.permission);
      }

      if (leaf.anyOf?.length) {
        allowed =
          allowed && leaf.anyOf.some((p) => user.permissions.includes(p));
      }

      if (leaf.allOf?.length) {
        allowed =
          allowed && leaf.allOf.every((p) => user.permissions.includes(p));
      }

      if (leaf.roles?.length) {
        allowed = allowed && leaf.roles.some((r) => user.roles.includes(r));
      }

      if (allowed) {
        return leaf.href;
      }
    }

    return undefined;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setHoverOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const toggleItem = (id: string) => {
    setExpandedItems((current) => ({
      ...current,
      [id]: !current[id],
    }));
  };

  const resolveLabel = (item: NavigationItem) => {
    const translated = t(item.labelKey);
    const fallbackLabel = NAVIGATION_LABEL_FALLBACKS[item.labelKey];

    if (translated !== item.labelKey) {
      return translated;
    }

    if (fallbackLabel) {
      return isRtl ? fallbackLabel.ar : fallbackLabel.en;
    }

    return isRtl
      ? (item.labelAr ?? item.label ?? item.id)
      : (item.label ?? item.labelAr ?? item.id);
  };

  const hasActiveChild = (item: NavigationItem): boolean =>
    item.children?.some((child) => {
      if (
        matchesNavigationHref(location.pathname, location.search, child.href)
      ) {
        return true;
      }

      return hasActiveChild(child);
    }) ?? false;

  const renderNavItem = (item: NavigationItem, depth = 0) => {
    const routeAccess = item.href ? routeAccessByHref[item.href] : undefined;
    const collapseChildrenInSidebar =
      depth === 0 &&
      (item.id === SECRETARIAL_ROOT_ID ||
        item.id === INVENTORY_ROOT_ID ||
        item.id === REPORTS_ROOT_ID ||
        item.id === SETTINGS_ROOT_ID);
    const visibleChildren = collapseChildrenInSidebar
      ? undefined
      : item.children;
    const hasChildren = Boolean(visibleChildren?.length);
    const active =
      item.id === SECRETARIAL_ROOT_ID
        ? isSecretarialActive
        : item.id === INVENTORY_ROOT_ID
          ? isInventoryActive
          : item.id === REPORTS_ROOT_ID
            ? isReportsActive
            : item.id === SETTINGS_ROOT_ID
              ? isSettingsActive
              : matchesNavigationHref(
                  location.pathname,
                  location.search,
                  item.href,
                );
    const childActive = hasActiveChild(item);
    const hasExplicitExpansionState = Object.prototype.hasOwnProperty.call(
      expandedItems,
      item.id,
    );
    const isExpanded = hasExplicitExpansionState
      ? expandedItems[item.id]
      : autoExpandedIds.includes(item.id);
    const label = resolveLabel(item);
    const isNested = depth > 0;
    const iconSizeClass =
      depth > 0 ? "h-4 w-4" : showFull ? "h-[18px] w-[18px]" : "h-5 w-5";
    const itemHeightClass = depth > 0 ? "h-[40px]" : "h-[46px]";
    const textClass = depth > 0 ? "text-[12px]" : "text-[13px]";
    const activeFillClass =
      "border-[var(--lux-sidebar-active-bg)] text-[var(--lux-sidebar-active-text)] shadow-none";
    const parentChildActiveClass = isNested
      ? "border-transparent bg-transparent text-[var(--lux-shell-chrome-text)]"
      : "border-transparent bg-transparent text-[var(--lux-shell-chrome-text)]";

    const baseRowClassName = cn(
      "group flex w-full items-center rounded-[16px] border px-3 font-medium transition-all duration-200",
      itemHeightClass,
      textClass,
      showFull ? "justify-between" : "justify-center gap-0",
      active
        ? activeFillClass
        : childActive
          ? parentChildActiveClass
          : "border-transparent text-[var(--lux-shell-chrome-text)] hover:border-[var(--lux-shell-chrome-control-border)] hover:bg-[var(--lux-shell-chrome-control)] hover:text-[var(--lux-shell-chrome-text)]",
    );

    const disabledRowClassName = cn(
      "group flex w-full cursor-not-allowed items-center rounded-[16px] border border-transparent px-3 font-medium opacity-45",
      itemHeightClass,
      textClass,
      showFull ? "justify-between" : "justify-center gap-0",
      "text-[var(--lux-shell-chrome-text)]",
    );

    const iconSlot = (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center",
          showFull
            ? depth > 0
              ? "h-8 w-4"
              : "h-10 w-5"
            : depth > 0
              ? "h-8 w-[38px]"
              : "h-10 w-[44px]",
        )}
      >
        <item.icon className={cn("shrink-0", iconSizeClass)} />
      </div>
    );

    const labelSlot = (
      <AnimatePresence initial={false}>
        {showFull ? (
          <motion.span
            animate={{ opacity: 1, width: "auto", x: 0 }}
            className={cn("min-w-0 truncate", isRtl && "text-right")}
            exit={{ opacity: 0, width: 0, x: isRtl ? 8 : -8 }}
            initial={{ opacity: 0, width: 0, x: isRtl ? 8 : -8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            {label}
          </motion.span>
        ) : null}
      </AnimatePresence>
    );

    const contentSlot = showFull ? (
      <div
        className={cn(
          "flex min-w-0 flex-1 items-center",
          depth > 0 ? "gap-2.5" : "gap-3",
        )}
      >
        {iconSlot}
        {labelSlot}
      </div>
    ) : (
      iconSlot
    );

    const chevronSlot =
      hasChildren && showFull ? (
        <motion.div
          animate={{ opacity: 1, width: "auto", x: 0 }}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--lux-shell-chrome-text)]"
          exit={{ opacity: 0, width: 0, x: isRtl ? -8 : 8 }}
          initial={{ opacity: 0, width: 0, x: isRtl ? -8 : 8 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : isRtl ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </motion.div>
      ) : null;

    const renderItemContent = (disabled = false) => (
      <div className="mb-0">
        {item.href && !hasChildren && !disabled ? (
          <NavLink
            className={({ isActive }) =>
              cn(baseRowClassName, isActive ? activeFillClass : undefined)
            }
            style={{
              background: active
                ? "var(--lux-sidebar-active-bg)"
                : "transparent",
            }}
            end
            title={!showFull ? label : ""}
            to={item.href}
            onClick={(event) => {
              // Root items can collapse their children in the sidebar; in that case,
              // we override the default navigation to go to the first permitted
              // descendant (same behavior as the Secretarial section bar).
              if (item.id === SECRETARIAL_ROOT_ID) {
                event.preventDefault();
                navigate(getFirstPermittedSecretarialHref() ?? "/dashboard");
                onNavigate?.();
                return;
              }

              if (item.id === INVENTORY_ROOT_ID) {
                event.preventDefault();
                navigate(getFirstPermittedInventoryHref() ?? "/dashboard");
                onNavigate?.();
                return;
              }

              if (item.id === REPORTS_ROOT_ID) {
                event.preventDefault();
                navigate(getFirstPermittedReportsHref() ?? "/dashboard");
                onNavigate?.();
                return;
              }

              if (item.id === SETTINGS_ROOT_ID) {
                event.preventDefault();
                navigate(getFirstPermittedSettingsHref() ?? "/dashboard");
                onNavigate?.();
                return;
              }

              onNavigate?.();
            }}
          >
            {contentSlot}
          </NavLink>
        ) : (
          <button
            aria-disabled={disabled}
            className={disabled ? disabledRowClassName : baseRowClassName}
            disabled={disabled}
            style={{
              background:
                active && !disabled
                  ? "var(--lux-sidebar-active-bg)"
                  : "transparent",
            }}
            title={!showFull ? label : ""}
            type="button"
            onClick={() => {
              if (disabled) {
                return;
              }

              if (item.id === SECRETARIAL_ROOT_ID) {
                navigate(getFirstPermittedSecretarialHref() ?? "/dashboard");
                onNavigate?.();
                return;
              }

              if (item.id === INVENTORY_ROOT_ID) {
                navigate(getFirstPermittedInventoryHref() ?? "/dashboard");
                onNavigate?.();
                return;
              }

              if (item.id === REPORTS_ROOT_ID) {
                navigate(getFirstPermittedReportsHref() ?? "/dashboard");
                onNavigate?.();
                return;
              }

              if (item.id === SETTINGS_ROOT_ID) {
                navigate(getFirstPermittedSettingsHref() ?? "/dashboard");
                onNavigate?.();
                return;
              }

              if (hasChildren && showFull) {
                toggleItem(item.id);
                return;
              }

              if (item.href) {
                onNavigate?.();
              }
            }}
          >
            {contentSlot}
            {chevronSlot}
          </button>
        )}

        <AnimatePresence initial={false}>
          {hasChildren && isExpanded && showFull && !disabled ? (
            <motion.div
              animate={{ height: "auto", opacity: 1 }}
              className={cn("relative mt-0 space-y-0", isRtl ? "pr-5" : "pl-5")}
              exit={{ height: 0, opacity: 0 }}
              initial={{ height: 0, opacity: 0 }}
              style={{ overflow: "hidden" }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <div
                className={cn(
                  "absolute bottom-0 top-0 w-px bg-[var(--lux-row-border)]",
                  isRtl ? "right-4" : "left-4",
                )}
              />
              {visibleChildren?.map((child) => renderNavItem(child, depth + 1))}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    );

    return (
      <ProtectedComponent
        key={item.id}
        allOf={item.allOf ?? routeAccess?.allOf}
        anyOf={item.anyOf ?? routeAccess?.anyOf}
        fallback={renderItemContent(true)}
        permission={item.permission ?? routeAccess?.permission}
        roles={item.roles ?? routeAccess?.roles}
      >
        {renderItemContent(false)}
      </ProtectedComponent>
    );
  };

  return (
    <aside
      ref={sidebarRef}
      className={cn(
        "app-shell-sidebar relative z-50 flex h-full min-h-0 flex-col overflow-hidden ",
        "text-foreground transition-[width,box-shadow,background-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[width]",
        showFull
          ? isRtl
            ? "shadow-[-10px_0_24px_-14px_rgba(0,0,0,0.45)]"
            : "shadow-[10px_0_24px_-14px_rgba(0,0,0,0.45)]"
          : "shadow-none",
        className,
      )}
      dir={isRtl ? "rtl" : "ltr"}
      style={{
        background: "var(--lux-shell-chrome-surface)",
        borderRight: isRtl ? undefined : "1px solid var(--lux-shell-border)",
        borderLeft: isRtl ? "1px solid var(--lux-shell-border)" : undefined,
        width: `${showFull ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_COLLAPSED_WIDTH}px`,
      }}
      onMouseLeave={() => !isOpen && setHoverOpen(false)}
    >
      <div
        className={cn("app-shell-sidebar__brand px-4", !showFull && "px-3")}
        style={{
          background: "var(--lux-shell-chrome-surface)",
          height: `${SIDEBAR_HEADER_HEIGHT}px`,
        }}
      >
        <div
          className={cn(
            "flex h-full items-center gap-3",
            !showFull && "justify-center",
          )}
        >
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border shadow-[0_0_0_1px_rgba(59,130,246,0.08),0_10px_22px_rgba(59,130,246,0.08)]"
            style={{
              borderColor: "var(--lux-shell-chrome-control-border)",
              background: "var(--lux-shell-chrome-control)",
            }}
          >
            <img
              alt="WeddingPro logo"
              className="h-full w-full object-cover"
              src="/images/app_logo.jpg"
            />
          </div>
          <AnimatePresence initial={false}>
            {showFull ? (
              <motion.div
                animate={{ opacity: 1, width: "auto", x: 0 }}
                className={cn(
                  "min-w-0 flex-1 overflow-hidden",
                  isRtl && "text-right",
                )}
                exit={{ opacity: 0, width: 0, x: isRtl ? 8 : -8 }}
                initial={{ opacity: 0, width: 0, x: isRtl ? 8 : -8 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
              >
                <p className="font-display text-[19px] leading-none text-[var(--lux-shell-chrome-text)]">
                  {t("sidebar.brand")}
                </p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-[var(--lux-shell-chrome-muted)]">
                  {t("sidebar.suite")}
                </p>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <div
        className="app-shell-sidebar__nav subtle-scrollbar flex-1 min-h-0 overflow-y-auto border-t border-[var(--lux-shell-border)]"
        style={{
          background: "var(--lux-shell-chrome-surface)",
        }}
        onMouseEnter={() => !isOpen && setHoverOpen(true)}
      >
        <nav className={cn("px-3 py-3", compact && "pb-4")}>
          {navigationItems.map((item) => renderNavItem(item))}
        </nav>
      </div>

      {user ? (
        <div
          className="border-t border-[var(--lux-shell-border)] px-2 py-2"
          style={{
            background: "var(--lux-shell-chrome-elevated)",
          }}
        >
          <div
            className={cn(
              "border-y py-2.5",
              showFull
                ? "flex items-center gap-2.5"
                : "flex flex-col items-center gap-1.5 px-2 py-2",
            )}
            style={{
              background:
                "color-mix(in srgb, var(--lux-shell-chrome-control) 88%, transparent)",
              borderColor:
                "color-mix(in srgb, var(--lux-shell-chrome-control-border) 78%, transparent)",
              color: "var(--lux-shell-chrome-text)",
            }}
          >
            <Avatar className="h-8 w-8 shrink-0 ring-1 ring-[var(--lux-gold-border)]">
              <AvatarFallback>
                {getInitials(user.fullName ?? t("header.adminUser"))}
              </AvatarFallback>
            </Avatar>

            <AnimatePresence initial={false}>
              {showFull ? (
                <motion.div
                  animate={{ opacity: 1, width: "auto", x: 0 }}
                  className={cn(
                    "min-w-0 flex-1 overflow-hidden",
                    isRtl ? "text-right" : "text-left",
                  )}
                  exit={{ opacity: 0, width: 0, x: isRtl ? 8 : -8 }}
                  initial={{ opacity: 0, width: 0, x: isRtl ? 8 : -8 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                >
                  <p className="truncate text-[13px] font-semibold leading-none text-[var(--lux-shell-chrome-text)]">
                    {user.fullName ?? t("header.adminUser")}
                  </p>
                  {user.email ? (
                    <p className="mt-0.5 truncate text-[11px] leading-none text-[var(--lux-shell-chrome-muted)]">
                      {user.email}
                    </p>
                  ) : null}
                </motion.div>
              ) : null}
            </AnimatePresence>

            <Button
              size="icon"
              type="button"
              variant="ghost"
              className="h-8 w-8 shrink-0 rounded-none text-[var(--lux-shell-chrome-text)] hover:bg-[color-mix(in_srgb,var(--lux-shell-chrome-control)_70%,transparent)]"
              aria-label={t("header.logout")}
              title={t("header.logout")}
              onClick={() => void handleLogout()}
              disabled={isLoggingOut}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
