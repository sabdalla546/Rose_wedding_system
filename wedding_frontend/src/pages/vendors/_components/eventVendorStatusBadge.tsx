import { Badge } from "@/components/ui/badge";
import type { EventVendorStatus } from "@/pages/vendors/types";
import { useTranslation } from "react-i18next";

type Props = {
  status: EventVendorStatus;
};

const badgeVariantByStatus: Record<EventVendorStatus, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  approved: "secondary",
  confirmed: "default",
  cancelled: "destructive",
};

export function EventVendorStatusBadge({ status }: Props) {
  const { t } = useTranslation();

  return (
    <Badge variant={badgeVariantByStatus[status]}>
      {t(`vendors.assignmentStatus.${status}`, {
        defaultValue: status,
      })}
    </Badge>
  );
}
