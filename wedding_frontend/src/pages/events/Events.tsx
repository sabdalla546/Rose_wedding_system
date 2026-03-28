import { CalendarRange, Plus, Table2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { PageContainer } from "@/components/layout/page-container";
import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import { ViewModeToggle } from "@/components/shared/view-mode-toggle";
import { Button } from "@/components/ui/button";

import { EventsCalendarView } from "./_components/EventsCalendarView";
import { EventsTableView } from "./_components/EventsTableView";

type EventsViewMode = "table" | "calendar";

const VIEW_QUERY_PARAM = "view";

export default function EventsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedView = searchParams.get(VIEW_QUERY_PARAM);
  const viewMode: EventsViewMode =
    requestedView === "calendar" ? "calendar" : "table";
  const [hasVisitedTable, setHasVisitedTable] = useState(viewMode === "table");
  const [hasVisitedCalendar, setHasVisitedCalendar] = useState(
    viewMode === "calendar",
  );

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
      },
    ],
    [t],
  );

  const handleViewChange = (nextView: EventsViewMode) => {
    const nextParams = new URLSearchParams(searchParams);

    if (nextView === "calendar") {
      setHasVisitedCalendar(true);
      nextParams.set(VIEW_QUERY_PARAM, "calendar");
    } else {
      setHasVisitedTable(true);
      nextParams.delete(VIEW_QUERY_PARAM);
    }

    setSearchParams(nextParams);
  };

  return (
    <ProtectedComponent permission="events.read">
      <PageContainer className="space-y-4 pb-4 pt-2">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--lux-heading)]">
              {t("events.title", { defaultValue: "Events" })}
            </h1>
            <p className="text-sm text-[var(--lux-text-secondary)]">
              {t("events.managementHint")}
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

            <ProtectedComponent permission="events.create">
              <Button onClick={() => navigate("/events/create")}>
                <Plus className="h-4 w-4" />
                {t("events.create", { defaultValue: "Create Event" })}
              </Button>
            </ProtectedComponent>
          </div>
        </div>

        {hasVisitedTable ? (
          <div className={viewMode === "table" ? "space-y-4" : "hidden"}>
            <EventsTableView />
          </div>
        ) : null}

        {hasVisitedCalendar ? (
          <div className={viewMode === "calendar" ? "space-y-4" : "hidden"}>
            <EventsCalendarView active={viewMode === "calendar"} />
          </div>
        ) : null}
      </PageContainer>
    </ProtectedComponent>
  );
}
