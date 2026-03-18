import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";

type Props = {
  isActive: boolean;
};

export function ServiceActiveBadge({ isActive }: Props) {
  const { t } = useTranslation();

  return (
    <Badge variant={isActive ? "default" : "secondary"}>
      {isActive
        ? t("services.status.active", { defaultValue: "Active" })
        : t("services.status.inactive", { defaultValue: "Inactive" })}
    </Badge>
  );
}
