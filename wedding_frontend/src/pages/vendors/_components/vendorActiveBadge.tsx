import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

type Props = {
  isActive: boolean;
};

export function VendorActiveBadge({ isActive }: Props) {
  const { t } = useTranslation();

  return (
    <Badge variant={isActive ? "default" : "secondary"}>
      {isActive
        ? t("vendors.status.active", { defaultValue: "Active" })
        : t("vendors.status.inactive", { defaultValue: "Inactive" })}
    </Badge>
  );
}
