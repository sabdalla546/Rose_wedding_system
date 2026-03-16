import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { cn } from "@/lib/utils";

const DESKTOP_SIDEBAR_EXPANDED = 225;
const DESKTOP_SIDEBAR_COLLAPSED = 70;
const DESKTOP_BREAKPOINT = 1024;
const HEADER_TOP_OFFSET = 0;
const SIDEBAR_CONTENT_GAP = 20;
const CONTENT_GUTTER = 0;
const CONNECTED_EDGE_GUTTER = 0;
const HEADER_FIXED_HEIGHT = 96;
const shellInset = "0px";

function getIsMobile() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.innerWidth < DESKTOP_BREAKPOINT;
}

export function AppShell() {
  const { i18n } = useTranslation();
  const isRtl = i18n.resolvedLanguage === "ar";
  const initialIsMobile = getIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!initialIsMobile);
  const [isMobile, setIsMobile] = useState(initialIsMobile);

  useEffect(() => {
    let previousIsMobile = getIsMobile();

    const handleResize = () => {
      const mobile = getIsMobile();
      setIsMobile(mobile);

      if (mobile !== previousIsMobile) {
        setSidebarOpen(!mobile);
        previousIsMobile = mobile;
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const desktopOffset = sidebarOpen
    ? DESKTOP_SIDEBAR_EXPANDED
    : DESKTOP_SIDEBAR_COLLAPSED;

  const contentOffsetStyle = isMobile
    ? undefined
    : isRtl
      ? { marginRight: `${desktopOffset + SIDEBAR_CONTENT_GAP}px` }
      : { marginLeft: `${desktopOffset + SIDEBAR_CONTENT_GAP}px` };

  const sidebarDockStyle = isRtl
    ? { right: shellInset, width: `${desktopOffset}px` }
    : { left: shellInset, width: `${desktopOffset}px` };

  const headerFixedStyle = isMobile
    ? {
        top: `${HEADER_TOP_OFFSET}px`,
        left: `${shellInset}`,
        right: `${shellInset}`,
      }
    : isRtl
      ? {
          top: `${HEADER_TOP_OFFSET}px`,
          left: `calc(${shellInset} + ${CONTENT_GUTTER}px)`,
          right: `calc(${shellInset} + ${desktopOffset + CONNECTED_EDGE_GUTTER}px)`,
        }
      : {
          top: `${HEADER_TOP_OFFSET}px`,
          left: `calc(${shellInset} + ${desktopOffset + CONNECTED_EDGE_GUTTER}px)`,
          right: `calc(${shellInset} + ${CONTENT_GUTTER}px)`,
        };

  const toggleSidebar = () => setSidebarOpen((value) => !value);

  const handleNavItemClick = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };
  return (
    <div className="min-h-screen w-full bg-transparent text-white">
      <div className="relative w-full" dir={isRtl ? "rtl" : "ltr"}>
        <div
          className={cn(
            "fixed top-0 z-[100] hidden h-screen overflow-visible transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:block",
            isRtl ? "right-0" : "left-0",
          )}
          style={sidebarDockStyle}
        >
          <AppSidebar isOpen={sidebarOpen} onNavigate={handleNavItemClick} />
        </div>

        <div
          className={cn(
            "fixed inset-0 z-[90] bg-black/50 transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:hidden",
            sidebarOpen && isMobile
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0",
          )}
          onClick={() => setSidebarOpen(false)}
        />

        <div
          className={cn(
            "fixed inset-y-0 z-[100] overflow-visible transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:hidden",
            isRtl ? "right-0" : "left-0",
            sidebarOpen
              ? "translate-x-0 opacity-100"
              : isRtl
                ? "translate-x-full opacity-90"
                : "-translate-x-full opacity-90",
          )}
        >
          <AppSidebar
            className="h-[calc(100vh-1rem)]"
            compact
            isOpen
            onNavigate={handleNavItemClick}
          />
        </div>

        <div
          className="transition-[margin-left,margin-right] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={contentOffsetStyle}
        >
          <AppHeader
            fixedStyle={headerFixedStyle}
            isMobile={isMobile}
            onToggleSidebar={toggleSidebar}
            sidebarOpen={sidebarOpen}
          />
          <main
            className="overflow-x-hidden px-3 pb-4 md:px-4 md:pb-6"
            style={{ paddingTop: `${HEADER_FIXED_HEIGHT}px` }}
          >
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
