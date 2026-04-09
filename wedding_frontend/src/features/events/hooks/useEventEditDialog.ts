import { useEffect, useState } from "react";

import { useUpdateEvent } from "@/hooks/events/useEventMutations";
import type { Event, EventFormData } from "@/pages/events/types";

type EventWorkspaceIdentifier = string | number | null | undefined;

export type EventEditFormState = {
  customerId: string;
  eventDate: string;
  venueId: string;
  venueNameSnapshot: string;
  groomName: string;
  brideName: string;
  guestCount: string;
  title: string;
  notes: string;
};

const createDefaultEventEditState = (): EventEditFormState => ({
  customerId: "",
  eventDate: "",
  venueId: "",
  venueNameSnapshot: "",
  groomName: "",
  brideName: "",
  guestCount: "",
  title: "",
  notes: "",
});

const createEventEditStateFromEvent = (
  event: Event | null | undefined,
): EventEditFormState => ({
  customerId: event?.customerId ? String(event.customerId) : "",
  eventDate: event?.eventDate ? String(event.eventDate).slice(0, 10) : "",
  venueId: event?.venueId ? String(event.venueId) : "",
  venueNameSnapshot: event?.venueNameSnapshot ?? "",
  groomName: event?.groomName ?? "",
  brideName: event?.brideName ?? "",
  guestCount:
    typeof event?.guestCount === "number" ? String(event.guestCount) : "",
  title: event?.title ?? "",
  notes: event?.notes ?? "",
});

export function useEventEditDialog({
  eventId,
  event,
  eventDateRequiredMessage,
}: {
  eventId: EventWorkspaceIdentifier;
  event: Event | null | undefined;
  eventDateRequiredMessage: string;
}) {
  const resolvedEventId = eventId == null ? "" : String(eventId);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<EventEditFormState>(
    createDefaultEventEditState(),
  );
  const [error, setError] = useState("");

  const updateEventMutation = useUpdateEvent(resolvedEventId, {
    navigateOnSuccess: false,
    onSuccess: () => {
      setOpen(false);
      setError("");
    },
  });

  useEffect(() => {
    setForm(createEventEditStateFromEvent(event));
  }, [event]);

  const openDialog = () => {
    setError("");
    setForm(createEventEditStateFromEvent(event));
    setOpen(true);
  };

  const save = () => {
    if (!resolvedEventId) {
      return;
    }

    if (!form.eventDate.trim()) {
      setError(eventDateRequiredMessage);
      return;
    }

    setError("");

    const payload: EventFormData = {
      customerId: form.customerId,
      eventDate: form.eventDate,
      venueId: form.venueId,
      venueNameSnapshot: form.venueNameSnapshot,
      groomName: form.groomName,
      brideName: form.brideName,
      guestCount: form.guestCount,
      title: form.title,
      notes: form.notes,
    };

    updateEventMutation.mutate(payload);
  };

  return {
    open,
    setOpen,
    form,
    setForm,
    error,
    openDialog,
    save,
    updateEventMutation,
  };
}
