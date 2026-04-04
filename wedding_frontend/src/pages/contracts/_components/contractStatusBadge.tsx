import { WorkflowStatusBadge } from "@/components/workflow/workflow-status-badge";
import type { ContractStatus } from "@/pages/contracts/types";

export function ContractStatusBadge({
  status,
  className,
}: {
  status: ContractStatus;
  className?: string;
}) {
  return (
    <WorkflowStatusBadge
      entity="contract"
      status={status}
      className={className}
    />
  );
}
