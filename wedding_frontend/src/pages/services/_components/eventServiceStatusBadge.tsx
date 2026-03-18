import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import type { EventServiceStatus } from "@/pages/services/types";

type Props = {
  status: EventServiceStatus;
};

const badgeVariantByStatus: Record<
  EventServiceStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  draft: "outline",
  approved: "secondary",
  confirmed: "default",
  cancelled: "destructive",
  completed: "default",
};

export function EventServiceStatusBadge({ status }: Props) {
  const { t } = useTranslation();

  return (
    <Badge variant={badgeVariantByStatus[status]}>
      {t(`services.eventStatus.${status}`, {
        defaultValue: status,
      })}
    </Badge>
  );
}
