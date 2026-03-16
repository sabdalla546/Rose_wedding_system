import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { formatCustomerStatus } from "@/pages/customers/adapters";
import type { CustomerStatus } from "@/pages/customers/types";

const statusStyles: Record<
  CustomerStatus,
  {
    background: string;
    borderColor: string;
    color: string;
  }
> = {
  active: {
    background: "color-mix(in srgb, #059669 14%, transparent)",
    borderColor: "color-mix(in srgb, #059669 34%, transparent)",
    color: "#047857",
  },
  inactive: {
    background: "color-mix(in srgb, #6b7280 16%, transparent)",
    borderColor: "color-mix(in srgb, #6b7280 34%, transparent)",
    color: "#4b5563",
  },
};

export function CustomerStatusBadge({ status }: { status: CustomerStatus }) {
  const { t } = useTranslation();

  return (
    <Badge
      className="border normal-case tracking-[0.04em]"
      style={statusStyles[status]}
    >
      {t(`customers.status.${status}`, {
        defaultValue: formatCustomerStatus(status),
      })}
    </Badge>
  );
}
