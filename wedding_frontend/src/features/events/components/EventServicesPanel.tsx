import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useEventServiceItems } from "@/hooks/services/useServices";
import {
  EventServicesPanel as EventServicesPanelContent,
} from "@/pages/events/_components/EventServicesPanel";
import { toNumberValue } from "@/pages/services/adapters";
import type { EventPanelViewMode } from "@/pages/events/_components/EventDetailsPrimitives";
import type { EventServiceItem } from "@/pages/services/types";

type Props = {
  eventId: number | string;
  onAdd?: () => void;
  onEdit?: (serviceItem: EventServiceItem) => void;
  onDelete?: (serviceItem: EventServiceItem) => void;
  initialViewMode?: EventPanelViewMode;
};

export function EventServicesPanel({
  eventId,
  onAdd,
  onEdit,
  onDelete,
  initialViewMode = "table",
}: Props) {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<EventPanelViewMode>(initialViewMode);
  const { data, isLoading } = useEventServiceItems({
    currentPage: 1,
    itemsPerPage: 200,
    eventId: Number(eventId || 0),
    category: "all",
    status: "all",
  });

  const serviceItems = useMemo(
    () =>
      [...(data?.data ?? [])].sort((left, right) => {
        if (left.sortOrder !== right.sortOrder) {
          return left.sortOrder - right.sortOrder;
        }

        return left.id - right.id;
      }),
    [data?.data],
  );

  const summary = useMemo(
    () =>
      serviceItems.reduce(
        (accumulator, item) => {
          const quantity = toNumberValue(item.quantity) ?? 0;
          const explicitTotal = toNumberValue(item.totalPrice);
          const unitPrice = toNumberValue(item.unitPrice);
          const resolvedTotal =
            explicitTotal ??
            (quantity > 0 && unitPrice !== null
              ? Number((quantity * unitPrice).toFixed(3))
              : 0);

          return {
            itemsCount: accumulator.itemsCount + 1,
            totalQuantity: Number((accumulator.totalQuantity + quantity).toFixed(3)),
            totalAmount: Number((accumulator.totalAmount + resolvedTotal).toFixed(3)),
          };
        },
        {
          itemsCount: 0,
          totalQuantity: 0,
          totalAmount: 0,
        },
      ),
    [serviceItems],
  );

  if (!isLoading && !serviceItems.length) {
    return (
      <EventServicesPanelContent
        serviceItems={[]}
        loading={false}
        summary={summary}
        viewMode={viewMode}
        t={t}
        onViewModeChange={setViewMode}
        onAdd={onAdd ?? (() => undefined)}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );
  }

  return (
    <EventServicesPanelContent
      serviceItems={serviceItems}
      loading={isLoading}
      summary={summary}
      viewMode={viewMode}
      t={t}
      onViewModeChange={setViewMode}
      onAdd={onAdd ?? (() => undefined)}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
}
