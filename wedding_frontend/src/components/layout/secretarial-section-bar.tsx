import { useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import {
  SECRETARIAL_ROOT_ID,
  flattenNavigationLeaves,
  matchesNavigationHref,
  navigationItems,
  secretarialNavigationLeaves,
  type NavigationLeaf,
  type NavigationItem,
} from "@/lib/constants/navigation";
import { cn } from "@/lib/utils";

const HIDDEN_SECRETARIAL_IDS = new Set(["events-all", "calendar-appointments"]);
const DESIGNER_DETAILS_ID = "designer-details";
const DESIGNER_DETAILS_CHILD_IDS = [
  "settings-team-vendors",
  "settings-team-services",
  "quotations-all",
  "contracts-all",
] as const;
const DESIGNER_DETAILS_CHILD_ID_SET = new Set<string>(
  DESIGNER_DETAILS_CHILD_IDS,
);

function getSectionTargetHref(item: NavigationItem) {
  if (item.href) {
    return item.href;
  }

  return flattenNavigationLeaves(item.children ?? []).find((leaf) => leaf.href)
    ?.href;
}

function getVisiblePrimaryItems(items: NavigationItem[]) {
  const nextItems = items.flatMap((item) => {
    if (HIDDEN_SECRETARIAL_IDS.has(item.id)) {
      return [];
    }

    if (!item.children?.length) {
      return [item];
    }

    return item.children.filter(
      (child) => !HIDDEN_SECRETARIAL_IDS.has(child.id),
    );
  });
  const filteredItems = nextItems.filter(
    (item) => !DESIGNER_DETAILS_CHILD_ID_SET.has(item.id),
  );

  const designerDetailsIndex = filteredItems.findIndex(
    (item) => item.id === DESIGNER_DETAILS_ID,
  );
  const eventsCalendarIndex = filteredItems.findIndex(
    (item) => item.id === "events-calendar",
  );

  if (
    designerDetailsIndex === -1 ||
    eventsCalendarIndex === -1 ||
    designerDetailsIndex === eventsCalendarIndex + 1
  ) {
    return filteredItems;
  }

  const [designerDetailsItem] = filteredItems.splice(designerDetailsIndex, 1);
  filteredItems.splice(eventsCalendarIndex + 1, 0, designerDetailsItem);

  return filteredItems;
}

export function SecretarialSectionBar() {
  const location = useLocation();
  const { i18n, t } = useTranslation();
  const isRtl = i18n.resolvedLanguage === "ar";

  const secretarialRoot = useMemo(
    () => navigationItems.find((item) => item.id === SECRETARIAL_ROOT_ID),
    [],
  );

  const primaryNavigationItems = useMemo(
    () => getVisiblePrimaryItems(secretarialRoot?.children ?? []),
    [secretarialRoot],
  );
  const secretarialLeafById = useMemo(
    () =>
      new Map(
        secretarialNavigationLeaves.map((item) => [item.id, item] as const),
      ),
    [],
  );
  const designerDetailsSecondaryItems = useMemo(
    () =>
      DESIGNER_DETAILS_CHILD_IDS.map((id) => secretarialLeafById.get(id)).filter(
        (item): item is NavigationLeaf => Boolean(item),
      ),
    [secretarialLeafById],
  );

  const activeLeaf = useMemo(() => {
    const matches = secretarialNavigationLeaves
      .filter((item) =>
        matchesNavigationHref(location.pathname, location.search, item.href),
      )
      .sort(
        (left, right) => (right.href?.length ?? 0) - (left.href?.length ?? 0),
      );

    return matches[0];
  }, [location.pathname, location.search]);

  const activePrimaryItem = useMemo(() => {
    if (!activeLeaf) {
      return undefined;
    }

    if (DESIGNER_DETAILS_CHILD_ID_SET.has(activeLeaf.id)) {
      return primaryNavigationItems.find(
        (item) => item.id === DESIGNER_DETAILS_ID,
      );
    }

    return primaryNavigationItems.find(
      (item) =>
        item.id === activeLeaf.id || activeLeaf.parents.includes(item.id),
    );
  }, [activeLeaf, primaryNavigationItems]);

  const secondaryNavigationItems = useMemo(
    () =>
      activePrimaryItem?.id === DESIGNER_DETAILS_ID
        ? designerDetailsSecondaryItems
        : (activePrimaryItem?.children ?? []),
    [activePrimaryItem, designerDetailsSecondaryItems],
  );
  const isDesignerDetailsSecondaryRow =
    activePrimaryItem?.id === DESIGNER_DETAILS_ID;

  if (!activeLeaf) {
    return null;
  }

  const renderPrimaryNavigationRow = (
    items: NavigationItem[],
    activeId: string,
    rowClassName: string,
  ) => (
    <div className={rowClassName}>
      <div
        className="subtle-scrollbar flex w-full items-center overflow-x-auto overflow-y-hidden md:justify-center"
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
          {items.map((item) => {
            const targetHref = getSectionTargetHref(item);

            if (!targetHref) {
              return null;
            }

            const translated = t(item.labelKey);
            const label =
              translated !== item.labelKey
                ? translated
                : isRtl
                  ? (item.labelAr ?? item.label ?? item.id)
                  : (item.label ?? item.labelAr ?? item.id);
            const isActive = item.id === activeId;

            const sharedClassName = cn(
              "inline-flex h-8 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border px-4 text-[12px] font-semibold transition-all duration-200",
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
                      : "transparent",
                    borderColor: isActive
                      ? "var(--lux-gold)"
                      : "transparent",
                    boxShadow: isActive
                      ? "0 10px 24px color-mix(in srgb, var(--lux-gold) 20%, transparent)"
                      : "none",
                  }}
                  to={targetHref}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{label}</span>
                </NavLink>
              </ProtectedComponent>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderSecondaryNavigationRow = (
    items: NavigationItem[],
    activeId: string,
    compact = false,
  ) => (
    <div
      className={cn(
        "flex items-center",
        compact ? "h-8 px-2 md:px-3" : "h-9 px-2 md:px-3",
      )}
    >
      <div
        className="subtle-scrollbar flex w-full items-center overflow-x-auto overflow-y-hidden"
        dir={isRtl ? "rtl" : "ltr"}
      >
        <div
          className={cn(
            "inline-flex min-w-max items-center gap-1 rounded-full border",
            compact ? "px-1 py-[3px]" : "px-1 py-1",
          )}
          style={{
            background:
              compact
                ? "color-mix(in srgb, var(--lux-shell-chrome-control) 72%, transparent)"
                : "color-mix(in srgb, var(--lux-shell-chrome-control) 88%, transparent)",
            borderColor:
              compact
                ? "color-mix(in srgb, var(--lux-shell-chrome-control-border) 52%, transparent)"
                : "color-mix(in srgb, var(--lux-shell-chrome-control-border) 72%, transparent)",
            boxShadow: compact
              ? "inset 0 1px 0 rgba(255,255,255,0.02)"
              : "inset 0 1px 0 rgba(255,255,255,0.03)",
          }}
        >
          {items.map((item) => {
            const targetHref = getSectionTargetHref(item);

            if (!targetHref) {
              return null;
            }

            const translated = t(item.labelKey);
            const label =
              translated !== item.labelKey
                ? translated
                : isRtl
                  ? (item.labelAr ?? item.label ?? item.id)
                  : (item.label ?? item.labelAr ?? item.id);
            const isActive = item.id === activeId;

            const sharedClassName = cn(
              "inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full border font-semibold transition-all duration-200",
              compact
                ? "h-6 gap-1 px-2.5 text-[10px] md:text-[11px]"
                : "h-7 gap-1.5 px-3 text-[11px]",
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
                        compact
                          ? "color-mix(in srgb, var(--lux-shell-chrome-control) 68%, transparent)"
                          : "color-mix(in srgb, var(--lux-shell-chrome-control) 82%, transparent)",
                      borderColor:
                        compact
                          ? "color-mix(in srgb, var(--lux-shell-chrome-control-border) 46%, transparent)"
                          : "color-mix(in srgb, var(--lux-shell-chrome-control-border) 60%, transparent)",
                    }}
                    type="button"
                  >
                    <item.icon
                      className={cn(
                        "shrink-0",
                        compact ? "h-3 w-3 md:h-3.5 md:w-3.5" : "h-3.5 w-3.5",
                      )}
                    />
                    <span>{label}</span>
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
                      : compact
                        ? "color-mix(in srgb, var(--lux-shell-chrome-control) 64%, transparent)"
                        : "color-mix(in srgb, var(--lux-shell-chrome-control) 78%, transparent)",
                    borderColor: isActive
                      ? "var(--lux-gold)"
                      : compact
                        ? "color-mix(in srgb, var(--lux-shell-chrome-control-border) 44%, transparent)"
                        : "color-mix(in srgb, var(--lux-shell-chrome-control-border) 58%, transparent)",
                    boxShadow: isActive
                      ? compact
                        ? "0 6px 18px color-mix(in srgb, var(--lux-gold) 14%, transparent)"
                        : "0 8px 24px color-mix(in srgb, var(--lux-gold) 20%, transparent)"
                      : "none",
                  }}
                  to={targetHref}
                >
                  <item.icon
                    className={cn(
                      "shrink-0",
                      compact ? "h-3 w-3 md:h-3.5 md:w-3.5" : "h-3.5 w-3.5",
                    )}
                  />
                  <span>{label}</span>
                </NavLink>
              </ProtectedComponent>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <section
      className={cn(
        "flex flex-col overflow-hidden",
        secondaryNavigationItems.length > 0 ? "h-full" : "h-[40px]",
      )}
      style={{
        background: "var(--lux-shell-chrome-surface)",
        borderColor: "var(--lux-shell-border)",
      }}
      >
      {renderPrimaryNavigationRow(
        primaryNavigationItems,
        activePrimaryItem?.id ?? activeLeaf.id,
        cn(
          "flex border-b px-2 py-1 md:px-3",
          secondaryNavigationItems.length > 0 ? "h-10" : "h-full",
        ),
      )}
      {secondaryNavigationItems.length > 0
        ? renderSecondaryNavigationRow(
            secondaryNavigationItems,
            activeLeaf.id,
            isDesignerDetailsSecondaryRow,
          )
        : null}
    </section>
  );
}
