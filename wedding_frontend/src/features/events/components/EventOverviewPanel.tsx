import { ar, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";

import { useEvent } from "@/hooks/events/useEvents";
import { EventOverviewWorkspace } from "@/pages/events/_components/EventOverviewWorkspace";
import { EventEmptyState } from "@/pages/events/_components/EventDetailsPrimitives";
import type { EventSection } from "@/pages/events/types";

type Props = {
  eventId: number | string;
  onAddSection?: () => void;
  onEditSection?: (section: EventSection) => void;
  onDeleteSection?: (section: EventSection) => void;
};

export function EventOverviewPanel({
  eventId,
  onAddSection,
  onEditSection,
  onDeleteSection,
}: Props) {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === "ar" ? ar : enUS;
  const { data: event, isLoading } = useEvent(String(eventId));

  if (isLoading) {
    return (
      <EventEmptyState
        title={t("common.loading", { defaultValue: "Loading..." })}
        description={t("events.loadingOverview", {
          defaultValue: "Loading the event overview and planning sections.",
        })}
      />
    );
  }

  if (!event) {
    return (
      <EventEmptyState
        title={t("common.noResultsTitle", { defaultValue: "No results found" })}
        description={t("events.noEventFound", {
          defaultValue: "This event could not be loaded.",
        })}
      />
    );
  }

  return (
    <EventOverviewWorkspace
      event={event}
      sections={event.sections ?? []}
      dateLocale={dateLocale}
      t={t}
      onAddSection={onAddSection}
      onEditSection={onEditSection}
      onDeleteSection={onDeleteSection}
    />
  );
}
