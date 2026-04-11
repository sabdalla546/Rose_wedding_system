import { useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import {
  matchesNavigationHref,
  settingsNavigationLeaves,
} from "@/lib/constants/navigation";
import { cn } from "@/lib/utils";

export function SettingsSectionBar() {
  const location = useLocation();
  const { i18n, t } = useTranslation();
  const isRtl = i18n.resolvedLanguage === "ar";

  const activeHref = useMemo(() => {
    const matches = settingsNavigationLeaves
      .filter((item) =>
        matchesNavigationHref(location.pathname, location.search, item.href),
      )
      .sort(
        (left, right) => (right.href?.length ?? 0) - (left.href?.length ?? 0),
      );

    return matches[0]?.href;
  }, [location.pathname, location.search]);

  if (!activeHref) {
    return null;
  }

  return (
    <section
      className="flex h-[52px] overflow-hidden"
      style={{
        background: "var(--lux-shell-chrome-surface)",
        borderColor: "var(--lux-shell-border)",
      }}
    >
      <div
        className="subtle-scrollbar flex w-full items-center overflow-x-auto overflow-y-hidden px-2 py-1.5 md:justify-center md:px-3"
        dir={isRtl ? "rtl" : "ltr"}
      >
        <div
          className="inline-flex min-w-max flex-nowrap items-center gap-1 rounded-full border p-1"
          style={{
            background:
              "linear-gradient(180deg, color-mix(in srgb, var(--lux-shell-chrome-control) 88%, transparent), color-mix(in srgb, var(--lux-shell-chrome-surface) 82%, transparent))",
            borderColor:
              "color-mix(in srgb, var(--lux-shell-chrome-control-border) 72%, transparent)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.03), 0 14px 24px rgba(0,0,0,0.06)",
          }}
        >
          {settingsNavigationLeaves.map((item) => {
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
              "inline-flex h-9 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full border px-5 text-[13px] font-semibold transition-all duration-200",
              isActive
                ? "text-[var(--lux-shell-bg)]"
                : "text-[var(--lux-shell-chrome-text)] hover:text-white",
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
                      background:
                        "color-mix(in srgb, var(--lux-shell-chrome-control) 82%, transparent)",
                      borderColor:
                        "color-mix(in srgb, var(--lux-shell-chrome-control-border) 62%, transparent)",
                    }}
                    type="button"
                  >
                    <item.icon className="h-[18px] w-[18px] shrink-0" />
                    <span className="truncate">{label}</span>
                  </button>
                }
                permission={item.permission}
                roles={item.roles}
              >
                <NavLink
                  className={sharedClassName}
                  style={{
                    background: isActive ? "var(--lux-gold)" : "transparent",
                    borderColor: isActive ? "var(--lux-gold)" : "transparent",
                    boxShadow: isActive
                      ? "0 10px 24px color-mix(in srgb, var(--lux-gold) 20%, transparent)"
                      : "none",
                  }}
                  to={item.href}
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
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
