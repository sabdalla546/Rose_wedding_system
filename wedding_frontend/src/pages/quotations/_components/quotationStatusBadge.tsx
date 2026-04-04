import { WorkflowStatusBadge } from "@/components/workflow/workflow-status-badge";
import type { QuotationStatus } from "@/pages/quotations/types";

type Props = { status: QuotationStatus };

export function QuotationStatusBadge({ status }: Props) {
  return <WorkflowStatusBadge entity="quotation" status={status} />;
}
