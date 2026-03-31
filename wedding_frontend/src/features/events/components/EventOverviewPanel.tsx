import { ar, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";

import { useEvent } from "@/hooks/events/useEvents";
import { EventOverviewWorkspace } from "@/pages/events/_components/EventOverviewWorkspace";
import { EventEmptyState } from "@/pages/events/_components/EventDetailsPrimitives";

type Props = {
  eventId: number | string;
};

export function EventOverviewPanel({ eventId }: Props) {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === "ar" ? ar : enUS;
  const { data: event, isLoading } = useEvent(String(eventId));

  if (isLoading) {
    return (
      <EventEmptyState
        title={t("common.loading", { defaultValue: "Loading..." })}
        description={t("events.loadingOverview", {
          defaultValue: "Loading the event overview.",
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

  return <EventOverviewWorkspace event={event} dateLocale={dateLocale} t={t} />;
}
