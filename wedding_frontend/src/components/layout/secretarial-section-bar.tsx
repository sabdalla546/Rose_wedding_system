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

  if (!activeLeaf) {
    return null;
  }

  const renderNavigationRow = (
    items: NavigationItem[],
    activeId: string,
    rowClassName: string,
  ) => (
    <div className={rowClassName}>
      <div
        className="subtle-scrollbar flex w-full items-center overflow-x-auto overflow-y-hidden md:overflow-hidden"
        dir={isRtl ? "rtl" : "ltr"}
      >
        <div className="flex min-w-max flex-nowrap items-center gap-0 md:w-full md:min-w-0">
          {items.map((item) => {
            const targetHref =
              item.id === DESIGNER_DETAILS_ID
                ? designerDetailsSecondaryItems[0]?.href
                : getSectionTargetHref(item);

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
              "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap border px-3 text-[12px] font-semibold transition-colors duration-200 md:min-w-0 md:flex-1 md:px-2.5",
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
      {renderNavigationRow(
        primaryNavigationItems,
        activePrimaryItem?.id ?? activeLeaf.id,
        cn(
          "flex border-b",
          secondaryNavigationItems.length > 0 ? "h-9" : "h-full",
        ),
      )}
      {secondaryNavigationItems.length > 0
        ? renderNavigationRow(
            secondaryNavigationItems,
            activeLeaf.id,
            "flex h-9",
          )
        : null}
    </section>
  );
}
