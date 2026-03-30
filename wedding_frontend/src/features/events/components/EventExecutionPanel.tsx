import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useEvent } from "@/hooks/events/useEvents";
import { useEventServiceItems } from "@/hooks/services/useServices";
import { useEventVendorLinks } from "@/hooks/vendors/useVendors";
import { EventExecutionPanel as EventExecutionPanelContent } from "@/pages/events/_components/EventExecutionPanel";
import { EventEmptyState } from "@/pages/events/_components/EventDetailsPrimitives";

type Props = {
  eventId: number | string;
};

export function EventExecutionPanel({ eventId }: Props) {
  const { t } = useTranslation();
  const { data: event, isLoading: eventLoading } = useEvent(String(eventId));
  const { data: servicesResponse, isLoading: servicesLoading } = useEventServiceItems({
    currentPage: 1,
    itemsPerPage: 200,
    eventId: Number(eventId || 0),
    category: "all",
    status: "all",
  });
  const { data: vendorsResponse, isLoading: vendorsLoading } = useEventVendorLinks({
    currentPage: 1,
    itemsPerPage: 200,
    eventId: Number(eventId || 0),
    vendorType: "all",
    providedBy: "all",
    status: "all",
  });

  const sections = useMemo(() => event?.sections ?? [], [event?.sections]);
  const services = useMemo(() => servicesResponse?.data ?? [], [servicesResponse?.data]);
  const vendors = useMemo(() => vendorsResponse?.data ?? [], [vendorsResponse?.data]);
  const readiness = useMemo(() => {
    const servicesReady = services.filter(
      (item) => item.status === "confirmed" || item.status === "completed",
    ).length;
    const vendorsReady = vendors.filter(
      (link) => link.status === "approved" || link.status === "confirmed",
    ).length;
    const sectionsReady = sections.filter((section) => section.isCompleted).length;
    const total = services.length + vendors.length + sections.length;
    const ready = servicesReady + vendorsReady + sectionsReady;

    return {
      ready,
      total,
      percent: total > 0 ? Math.round((ready / total) * 100) : null,
    };
  }, [sections, services, vendors]);

  if (eventLoading || (!event && (servicesLoading || vendorsLoading))) {
    return (
      <EventEmptyState
        title={t("common.loading", { defaultValue: "Loading..." })}
        description={t("events.loadingExecution", {
          defaultValue: "Loading execution tracking data for this event.",
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
    <EventExecutionPanelContent
      event={event}
      services={services}
      vendors={vendors}
      sections={sections}
      t={t}
      readiness={readiness}
    />
  );
}
