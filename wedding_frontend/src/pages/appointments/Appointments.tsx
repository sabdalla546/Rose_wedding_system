import { CalendarRange, Plus, Table2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { PageContainer } from "@/components/layout/page-container";
import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import { ViewModeToggle } from "@/components/shared/view-mode-toggle";
import { Button } from "@/components/ui/button";
import { useHasPermission } from "@/hooks/useHasPermission";

import { AppointmentsCalendarView } from "./_components/AppointmentsCalendarView";
import { AppointmentsTableView } from "./_components/AppointmentsTableView";

type AppointmentsViewMode = "table" | "calendar";

const VIEW_QUERY_PARAM = "view";

export default function AppointmentsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const hasCalendarAccess = useHasPermission("appointments.calendar.read");
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedView = searchParams.get(VIEW_QUERY_PARAM);
  const viewMode: AppointmentsViewMode =
    requestedView === "calendar" && hasCalendarAccess ? "calendar" : "table";
  const [hasVisitedTable, setHasVisitedTable] = useState(viewMode === "table");
  const [hasVisitedCalendar, setHasVisitedCalendar] = useState(
    viewMode === "calendar",
  );

  useEffect(() => {
    if (requestedView !== "calendar" || hasCalendarAccess) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete(VIEW_QUERY_PARAM);
    setSearchParams(nextParams, { replace: true });
  }, [hasCalendarAccess, requestedView, searchParams, setSearchParams]);

  const viewOptions = useMemo(
    () => [
      {
        value: "table" as const,
        label: t("common.tableView", { defaultValue: "Table" }),
        icon: Table2,
      },
      {
        value: "calendar" as const,
        label: t("common.calendarView", { defaultValue: "Calendar" }),
        icon: CalendarRange,
        disabled: !hasCalendarAccess,
      },
    ],
    [hasCalendarAccess, t],
  );

  const handleViewChange = (nextView: AppointmentsViewMode) => {
    const nextParams = new URLSearchParams(searchParams);

    if (nextView === "calendar") {
      if (!hasCalendarAccess) {
        return;
      }

      setHasVisitedCalendar(true);
      nextParams.set(VIEW_QUERY_PARAM, "calendar");
    } else {
      setHasVisitedTable(true);
      nextParams.delete(VIEW_QUERY_PARAM);
    }

    setSearchParams(nextParams);
  };

  return (
    <ProtectedComponent permission="appointments.read">
      <PageContainer className="space-y-4 pb-4 pt-2">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--lux-heading)]">
              {t("appointments.title")}
            </h1>
            <p className="text-sm text-[var(--lux-text-secondary)]">
              {t("appointments.coreFlowHint")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ViewModeToggle
              ariaLabel={t("common.switchView", {
                defaultValue: "Switch view",
              })}
              options={viewOptions}
              value={viewMode}
              onValueChange={handleViewChange}
            />

            <ProtectedComponent permission="appointments.create">
              <Button onClick={() => navigate("/appointments/create")}>
                <Plus className="h-4 w-4" />
                {t("appointments.create")}
              </Button>
            </ProtectedComponent>
          </div>
        </div>

        {hasVisitedTable ? (
          <div className={viewMode === "table" ? "space-y-4" : "hidden"}>
            <AppointmentsTableView />
          </div>
        ) : null}

        {hasVisitedCalendar && hasCalendarAccess ? (
          <div className={viewMode === "calendar" ? "space-y-4" : "hidden"}>
            <AppointmentsCalendarView active={viewMode === "calendar"} />
          </div>
        ) : null}
      </PageContainer>
    </ProtectedComponent>
  );
}
