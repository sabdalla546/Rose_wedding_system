import { useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import { reportsNavigationLeaves } from "@/lib/constants/navigation";
import { cn } from "@/lib/utils";

const isPathWithinHref = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

export function ReportsSectionBar() {
  const location = useLocation();
  const { i18n, t } = useTranslation();
  const isRtl = i18n.resolvedLanguage === "ar";

  const activeHref = useMemo(() => {
    const matches = reportsNavigationLeaves
      .filter(
        (item) => item.href && isPathWithinHref(location.pathname, item.href),
      )
      .sort(
        (left, right) => (right.href?.length ?? 0) - (left.href?.length ?? 0),
      );

    return matches[0]?.href;
  }, [location.pathname]);

  if (!activeHref) {
    return null;
  }

  return (
    <section
      className="flex h-[40px] border-b"
      style={{
        background: "var(--lux-shell-chrome-surface)",
        borderColor: "var(--lux-shell-border)",
      }}
    >
      <div
        className="subtle-scrollbar flex w-full items-center overflow-x-auto overflow-y-hidden md:overflow-hidden"
        dir={isRtl ? "rtl" : "ltr"}
      >
        <div className="flex min-w-max flex-nowrap items-center gap-0 md:w-full md:min-w-0">
          {reportsNavigationLeaves.map((item) => {
            if (!item.href) {
              return null;
            }

            const translated = t(item.labelKey);
            const label =
              translated !== item.labelKey
                ? translated
                : isRtl
                  ? (item.labelAr ?? item.label ?? item.id)
                  : (item.label ?? item.labelAr ?? item.id);
            const isActive = item.href === activeHref;

            const sharedClassName = cn(
              "inline-flex h-12 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap border px-3 text-[12px] font-semibold transition-colors duration-200 md:min-w-0 md:flex-1 md:px-2.5",
              "rounded-none",
              isActive ? "text-white" : "text-[var(--lux-shell-chrome-text)]",
            );

            return (
              <ProtectedComponent
                key={item.id}
                allOf={item.allOf}
                anyOf={item.anyOf}
                fallback={
                  <button
                    aria-disabled={true}
                    className={cn(
                      sharedClassName,
                      "cursor-not-allowed opacity-45",
                    )}
                    style={{
                      background: "var(--lux-shell-chrome-control)",
                      borderColor: "var(--lux-shell-chrome-control-border)",
                    }}
                    type="button"
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{label}</span>
                  </button>
                }
                permission={item.permission}
                roles={item.roles}
              >
                <NavLink
                  className={sharedClassName}
                  style={{
                    background: isActive
                      ? "var(--lux-gold)"
                      : "var(--lux-shell-chrome-control)",
                    borderColor: isActive
                      ? "var(--lux-gold)"
                      : "var(--lux-shell-chrome-control-border)",
                  }}
                  to={item.href}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{label}</span>
                </NavLink>
              </ProtectedComponent>
            );
          })}
        </div>
      </div>
    </section>
  );
}
