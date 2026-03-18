import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import type { QuotationStatus } from "@/pages/quotations/types";

type Props = {
  status: QuotationStatus;
};

const badgeVariantByStatus: Record<
  QuotationStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  draft: "outline",
  sent: "secondary",
  approved: "default",
  rejected: "destructive",
  expired: "secondary",
  converted_to_contract: "default",
};

export function QuotationStatusBadge({ status }: Props) {
  const { t } = useTranslation();

  return (
    <Badge variant={badgeVariantByStatus[status]}>
      {t(`quotations.status.${status}`, {
        defaultValue: status,
      })}
    </Badge>
  );
}
