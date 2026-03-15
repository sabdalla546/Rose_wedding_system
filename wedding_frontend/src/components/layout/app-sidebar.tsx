import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import {
  collectExpandedNavigationIds,
  navigationItems,
  type NavigationItem,
} from "@/lib/constants/navigation";
import { routePermissionByHref } from "@/lib/constants/route-permissions";
import { cn } from "@/lib/utils";

const SIDEBAR_EXPANDED_WIDTH = 272;
const SIDEBAR_COLLAPSED_WIDTH = 84;

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
  const { i18n, t } = useTranslation();
  const isRtl = i18n.resolvedLanguage === "ar";
  const [hoverOpen, setHoverOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {},
  );
  const sidebarRef = useRef<HTMLDivElement>(null);
  const showFull = isOpen || hoverOpen;
  const autoExpandedIds = useMemo(
    () => collectExpandedNavigationIds(navigationItems, location.pathname),
    [location.pathname],
  );

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

  const toggleItem = (id: string) => {
    setExpandedItems((current) => ({
      ...current,
      [id]: !current[id],
    }));
  };

  const resolveLabel = (item: NavigationItem) => {
    const translated = t(item.labelKey);

    if (translated !== item.labelKey) {
      return translated;
    }

    return isRtl
      ? (item.labelAr ?? item.label ?? item.id)
      : (item.label ?? item.labelAr ?? item.id);
  };

  const hasActiveChild = (item: NavigationItem): boolean =>
    item.children?.some((child) => {
      if (child.href && location.pathname === child.href) {
        return true;
      }

      return hasActiveChild(child);
    }) ?? false;

  const renderNavItem = (item: NavigationItem, depth = 0) => {
    const hasChildren = Boolean(item.children?.length);
    const active = item.href ? location.pathname === item.href : false;
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
    const itemHeightClass = depth > 0 ? "h-[42px]" : "h-[46px]";
    const textClass = depth > 0 ? "text-[14px]" : "text-[15px]";
    const activeFillClass =
      "text-[var(--lux-sidebar-active-text)] shadow-[inset_0_0_0_1px_rgba(212,175,55,0.2),0_12px_28px_rgba(0,0,0,0.24)]";
    const parentChildActiveClass = isNested
      ? "text-[var(--lux-soft-text)]"
      : "text-[var(--lux-soft-text)] shadow-[inset_0_0_0_1px_rgba(212,175,55,0.1)]";

    const rowClassName = cn(
      "group flex w-full items-center rounded-[16px] px-3 font-medium transition-all duration-200",
      itemHeightClass,
      textClass,
      showFull ? "justify-between" : "justify-center gap-0",
      active
        ? activeFillClass
        : childActive
          ? parentChildActiveClass
          : "text-[var(--lux-text-secondary)] hover:text-white",
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
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--lux-text-muted)]"
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

    return (
      <ProtectedComponent
        key={item.id}
        permission={item.href ? routePermissionByHref[item.href] : undefined}
      >
        <div className="mb-1">
          {item.href && !hasChildren ? (
            <NavLink
              className={({ isActive }) =>
                cn(rowClassName, isActive ? activeFillClass : undefined)
              }
              style={({ isActive }) => ({
                background: isActive
                  ? "var(--lux-sidebar-active-bg)"
                  : childActive && !isNested
                    ? "rgba(212, 175, 55, 0.06)"
                    : "transparent",
              })}
              end
              title={!showFull ? label : ""}
              to={item.href}
              onClick={() => onNavigate?.()}
            >
              {contentSlot}
            </NavLink>
          ) : (
            <button
              className={rowClassName}
              style={{
                background: active
                  ? "var(--lux-sidebar-active-bg)"
                  : childActive
                    ? "rgba(212, 175, 55, 0.06)"
                    : "transparent",
              }}
              title={!showFull ? label : ""}
              type="button"
              onClick={() => {
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
            {hasChildren && isExpanded && showFull ? (
              <motion.div
                animate={{ height: "auto", opacity: 1 }}
                className={cn(
                  "relative mt-1 space-y-1",
                  isRtl ? "pr-4" : "pl-4",
                )}
                exit={{ height: 0, opacity: 0 }}
                initial={{ height: 0, opacity: 0 }}
                style={{ overflow: "hidden" }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                <div
                  className={cn(
                    "absolute bottom-0 top-0 w-px bg-[var(--lux-row-border)]",
                    isRtl ? "right-3" : "left-3",
                  )}
                />
                {item.children?.map((child) => renderNavItem(child, depth + 1))}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </ProtectedComponent>
    );
  };

  return (
    <aside
      ref={sidebarRef}
      className={cn(
        "relative z-50 flex h-full min-h-0 flex-col overflow-hidden ",
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
        background:
          "color-mix(in srgb, var(--lux-shell-surface) 96%, transparent)",
        width: `${showFull ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_COLLAPSED_WIDTH}px`,
      }}
      onMouseLeave={() => !isOpen && setHoverOpen(false)}
    >
      <div
        className={cn("px-4 pb-4 pt-4", !showFull && "px-3")}
        style={{
          background:
            "color-mix(in srgb, var(--lux-shell-surface) 96%, transparent)",
        }}
      >
        <div
          className={cn(
            "flex items-center gap-3",
            !showFull && "justify-center",
          )}
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[rgba(212,175,55,0.18)] bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.14),rgba(212,175,55,0.04)_70%)] shadow-[0_0_0_1px_rgba(212,175,55,0.06),0_10px_22px_rgba(212,175,55,0.08)]">
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
                <p className="font-display text-[23px] leading-none text-[#f4e5c5]">
                  {t("sidebar.brand")}
                </p>
                <p className="mt-1 text-[12px] uppercase tracking-[0.24em] text-[var(--lux-text-muted)]">
                  {t("sidebar.suite")}
                </p>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <div
        className="subtle-scrollbar flex-1 min-h-0 overflow-y-auto border-t border-[rgba(212,175,55,0.08)] bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.08),transparent_26%),linear-gradient(180deg,#0b0b0d_0%,#0a0a0c_100%)]"
        onMouseEnter={() => !isOpen && setHoverOpen(true)}
      >
        <nav className={cn("px-3 py-3", compact && "pb-4")}>
          {navigationItems.map((item) => renderNavItem(item))}
        </nav>
      </div>
    </aside>
  );
}
