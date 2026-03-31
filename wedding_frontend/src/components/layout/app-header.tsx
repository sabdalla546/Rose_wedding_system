import { Maximize2, Menu, Minimize2, MoonStar, SunMedium } from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";
import { useTranslation } from "react-i18next";

import { useTheme } from "@/app/providers/use-theme";
import { useToast } from "@/app/providers/use-toast";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  const { i18n, t } = useTranslation();
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const updateFullscreenState = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    updateFullscreenState();
    document.addEventListener("fullscreenchange", updateFullscreenState);

    return () => {
      document.removeEventListener("fullscreenchange", updateFullscreenState);
    };
  }, []);

  const handleToggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }

      await document.documentElement.requestFullscreen();
    } catch {
      toast({
        title: t("common.error", { defaultValue: "Error" }),
        description: t("header.fullscreenUnsupported", {
          defaultValue: "Fullscreen mode is not available in this browser.",
        }),
        variant: "error",
      });
    }
  };

  return (
    <header
      className={cn(
        "app-shell-header fixed z-[120] overflow-hidden transition-[left,right] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[left,right]",
        theme === "light" ? "backdrop-blur-0" : "backdrop-blur-xl",
      )}
      style={{
        ...fixedStyle,
        background: "var(--lux-shell-chrome-surface)",
        borderBottom: "1px solid var(--lux-shell-border)",
      }}
    >
      <div
        className={cn(
          "app-shell-header__bar flex w-full items-center gap-2 px-3 py-1 md:px-4",
          theme === "light"
            ? "shadow-[0_6px_18px_rgba(31,45,61,0.05)]"
            : "shadow-[0_8px_22px_rgba(0,0,0,0.05)]",
        )}
        style={{
          color: "var(--lux-shell-chrome-text)",
        }}
      >
        <div className="flex w-full items-center gap-2 md:gap-3">
          <Button
            className="h-8 w-8 shrink-0 rounded-[12px]"
            size="icon"
            type="button"
            variant="secondary"
            onClick={onToggleSidebar}
            style={{
              background:
                "color-mix(in srgb, var(--lux-shell-chrome-control) 92%, transparent)",
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

          <div className="min-w-0 flex-1">
            <SearchInput
              className="mx-auto max-w-[620px]"
              iconClassName="h-3.5 w-3.5 text-[var(--lux-shell-chrome-muted)]"
              inputClassName={cn(
                "h-9 rounded-[16px] border-[color-mix(in_srgb,var(--lux-shell-chrome-control-border)_72%,transparent)] bg-[color-mix(in_srgb,var(--lux-shell-chrome-control)_74%,transparent)] pl-10 text-sm text-[var(--lux-shell-chrome-text)] placeholder:text-[var(--lux-shell-chrome-muted)]",
                theme === "light" && "shadow-none",
              )}
            />
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div
              className="hidden items-center gap-1 sm:flex"
              style={{
                background: "transparent",
              }}
            >
              <button
                aria-label={
                  theme === "dark"
                    ? t("common.lightMode")
                    : t("common.darkMode")
                }
                className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] text-[var(--lux-shell-chrome-text)] transition-colors hover:bg-[color-mix(in_srgb,var(--lux-shell-chrome-control)_70%,transparent)]"
                type="button"
                onClick={toggleTheme}
              >
                {theme === "dark" ? (
                  <SunMedium className="h-3.5 w-3.5" />
                ) : (
                  <MoonStar className="h-3.5 w-3.5" />
                )}
              </button>
              <button
                aria-label={
                  isFullscreen
                    ? t("header.exitFullscreen", {
                        defaultValue: "Exit fullscreen",
                      })
                    : t("header.enterFullscreen", {
                        defaultValue: "Enter fullscreen",
                      })
                }
                className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] text-[var(--lux-shell-chrome-text)] transition-colors hover:bg-[color-mix(in_srgb,var(--lux-shell-chrome-control)_70%,transparent)]"
                type="button"
                onClick={() => void handleToggleFullscreen()}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-3.5 w-3.5" />
                ) : (
                  <Maximize2 className="h-3.5 w-3.5" />
                )}
              </button>
            </div>

            <div
              className="hidden p-0.5 sm:flex"
              style={{
                background: "transparent",
              }}
            >
              <button
                className={`rounded-[10px] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] transition-colors ${
                  i18n.resolvedLanguage === "en"
                    ? "text-[var(--lux-shell-bg)]"
                    : "text-[var(--lux-shell-chrome-muted)] hover:text-[var(--lux-shell-chrome-text)]"
                }`}
                style={
                  i18n.resolvedLanguage === "en"
                    ? {
                        background: "var(--lux-gold)",
                        boxShadow:
                          "0 8px 18px color-mix(in srgb, var(--lux-gold) 18%, transparent)",
                      }
                    : undefined
                }
                type="button"
                onClick={() => void i18n.changeLanguage("en")}
              >
                EN
              </button>
              <button
                className={`rounded-[10px] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] transition-colors ${
                  i18n.resolvedLanguage === "ar"
                    ? "text-[var(--lux-shell-bg)]"
                    : "text-[var(--lux-shell-chrome-muted)] hover:text-[var(--lux-shell-chrome-text)]"
                }`}
                style={
                  i18n.resolvedLanguage === "ar"
                    ? {
                        background: "var(--lux-gold)",
                        boxShadow:
                          "0 8px 18px color-mix(in srgb, var(--lux-gold) 18%, transparent)",
                      }
                    : undefined
                }
                type="button"
                onClick={() => void i18n.changeLanguage("ar")}
              >
                AR
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
