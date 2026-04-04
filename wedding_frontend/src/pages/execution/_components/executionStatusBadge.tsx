import { WorkflowStatusBadge } from "@/components/workflow/workflow-status-badge";
import type { ExecutionBriefStatus } from "@/pages/execution/types";

export function ExecutionStatusBadge({
  status,
}: {
  status: ExecutionBriefStatus;
}) {
  return <WorkflowStatusBadge entity="execution" status={status} />;
}
