import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useEventVendorLinks } from "@/hooks/vendors/useVendors";
import {
  EventVendorsPanel as EventVendorsPanelContent,
} from "@/pages/events/_components/EventVendorsPanel";
import type { EventPanelViewMode } from "@/pages/events/_components/EventDetailsPrimitives";
import type { EventVendorLink } from "@/pages/vendors/types";

type Props = {
  eventId: number | string;
  onAdd?: () => void;
  onEdit?: (vendorLink: EventVendorLink) => void;
  onDelete?: (vendorLink: EventVendorLink) => void;
  initialViewMode?: EventPanelViewMode;
};

export function EventVendorsPanel({
  eventId,
  onAdd,
  onEdit,
  onDelete,
  initialViewMode = "table",
}: Props) {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<EventPanelViewMode>(initialViewMode);
  const [expandedVendorIds, setExpandedVendorIds] = useState<number[]>([]);
  const { data, isLoading } = useEventVendorLinks({
    currentPage: 1,
    itemsPerPage: 200,
    eventId: Number(eventId || 0),
    vendorType: "all",
    providedBy: "all",
    status: "all",
  });

  const vendorLinks = useMemo(
    () =>
      [...(data?.data ?? [])].sort((left, right) => {
        if (left.vendorType !== right.vendorType) {
          return left.vendorType.localeCompare(right.vendorType);
        }

        return left.id - right.id;
      }),
    [data?.data],
  );

  return (
    <EventVendorsPanelContent
      vendorLinks={vendorLinks}
      loading={isLoading}
      expandedVendorIds={expandedVendorIds}
      viewMode={viewMode}
      t={t}
      onViewModeChange={setViewMode}
      onAdd={onAdd ?? (() => undefined)}
      onEdit={onEdit}
      onDelete={onDelete}
      onToggleExpanded={(vendorId) =>
        setExpandedVendorIds((current) =>
          current.includes(vendorId)
            ? current.filter((value) => value !== vendorId)
            : [...current, vendorId],
        )
      }
    />
  );
}
