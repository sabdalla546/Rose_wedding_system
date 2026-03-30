import { EventDetailsPage } from "@/pages/events/EventDetails";

type Props = {
  eventId: number | string;
};

export function EventManagementWorkspace({ eventId }: Props) {
  return <EventDetailsPage eventIdOverride={eventId} embedded />;
}
