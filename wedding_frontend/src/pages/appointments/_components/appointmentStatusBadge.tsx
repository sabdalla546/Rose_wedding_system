import { WorkflowStatusBadge } from "@/components/workflow/workflow-status-badge";
import type { AppointmentStatus } from "@/pages/appointments/types";

export function AppointmentStatusBadge({
  status,
}: {
  status: AppointmentStatus;
}) {
  return <WorkflowStatusBadge entity="appointment" status={status} />;
}
