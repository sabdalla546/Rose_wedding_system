import { WorkflowStatusBadge } from "@/components/workflow/workflow-status-badge";
import type { EventStatus } from "@/pages/events/types";

export function EventStatusBadge({ status }: { status: EventStatus }) {
  return <WorkflowStatusBadge entity="event" status={status} />;
}
