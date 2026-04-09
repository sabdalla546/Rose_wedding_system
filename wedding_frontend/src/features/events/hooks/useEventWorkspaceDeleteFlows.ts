import { useState } from "react";

import { useDeleteEventService } from "@/hooks/services/useEventServiceMutations";
import { useDeleteEventVendor } from "@/hooks/vendors/useEventVendorMutations";
import type { EventServiceItem } from "@/pages/services/types";
import type { EventVendorLink } from "@/pages/vendors/types";

type EventWorkspaceIdentifier = string | number | null | undefined;

export function useEventWorkspaceDeleteFlows(
  eventId: EventWorkspaceIdentifier,
) {
  const numericEventId = eventId == null ? 0 : Number(eventId);
  const [deleteServiceCandidate, setDeleteServiceCandidate] =
    useState<EventServiceItem | null>(null);
  const [deleteVendorCandidate, setDeleteVendorCandidate] =
    useState<EventVendorLink | null>(null);

  const deleteEventServiceMutation = useDeleteEventService(numericEventId);
  const deleteEventVendorMutation = useDeleteEventVendor(numericEventId);

  const confirmDeleteService = () => {
    if (!deleteServiceCandidate) {
      return;
    }

    deleteEventServiceMutation.mutate(deleteServiceCandidate.id, {
      onSettled: () => setDeleteServiceCandidate(null),
    });
  };

  const confirmDeleteVendor = () => {
    if (!deleteVendorCandidate) {
      return;
    }

    deleteEventVendorMutation.mutate(deleteVendorCandidate.id, {
      onSettled: () => setDeleteVendorCandidate(null),
    });
  };

  return {
    deleteServiceCandidate,
    setDeleteServiceCandidate,
    deleteVendorCandidate,
    setDeleteVendorCandidate,
    confirmDeleteService,
    confirmDeleteVendor,
    deleteEventServiceMutation,
    deleteEventVendorMutation,
  };
}
