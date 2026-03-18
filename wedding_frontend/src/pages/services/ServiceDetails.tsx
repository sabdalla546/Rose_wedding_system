import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { Edit, PackageOpen } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { PageContainer } from "@/components/layout/page-container";
import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useService } from "@/hooks/services/useServices";

import {
  formatMoney,
  formatPricingType,
  formatServiceCategory,
} from "./adapters";
import { ServiceActiveBadge } from "./_components/serviceActiveBadge";

function DetailItem({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
        {label}
      </p>
      <p className="text-sm text-[var(--lux-text)]">{value || "-"}</p>
    </div>
  );
}

const ServiceDetailsPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: service, isLoading } = useService(id);
  const dateLocale = i18n.language === "ar" ? ar : enUS;

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-sm text-[var(--lux-text-secondary)]">
          {t("common.loading", { defaultValue: "Loading..." })}
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-sm text-[var(--lux-text-secondary)]">
          {t("common.noResultsTitle", { defaultValue: "No results found" })}
        </div>
      </div>
    );
  }

  return (
    <ProtectedComponent permission="services.read">
      <PageContainer className="pb-4 pt-4 text-foreground">
        <div dir={i18n.dir()} className="mx-auto w-full max-w-6xl space-y-6">
          <button
            type="button"
            onClick={() => navigate("/settings/services")}
            className="inline-flex items-center gap-2 text-sm text-[var(--lux-text-secondary)] transition-colors hover:text-[var(--lux-gold)]"
          >
            {"<-"}{" "}
            {t("services.backToServices", {
              defaultValue: "Back to Services",
            })}
          </button>

          <SectionCard className="space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-[18px] border"
                  style={{
                    background: "var(--lux-control-hover)",
                    borderColor: "var(--lux-control-border)",
                    color: "var(--lux-gold)",
                  }}
                >
                  <PackageOpen className="h-6 w-6" />
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-bold text-[var(--lux-heading)]">
                      {service.name}
                    </h1>
                    <ServiceActiveBadge isActive={service.isActive} />
                  </div>
                  <p className="text-sm text-[var(--lux-text-secondary)]">
                    {t(`services.category.${service.category}`, {
                      defaultValue: formatServiceCategory(service.category),
                    })}
                  </p>
                </div>
              </div>

              <ProtectedComponent permission="services.update">
                <Button
                  onClick={() => navigate(`/settings/services/edit/${service.id}`)}
                >
                  <Edit className="h-4 w-4" />
                  {t("common.edit", { defaultValue: "Edit" })}
                </Button>
              </ProtectedComponent>
            </div>
          </SectionCard>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>
                  {t("services.basicInformation", {
                    defaultValue: "Basic Information",
                  })}
                </CardTitle>
                <CardDescription>
                  {t("services.basicInformationHint", {
                    defaultValue:
                      "Capture the main service identity, category, and pricing method.",
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <DetailItem
                  label={t("services.name", { defaultValue: "Service Name" })}
                  value={service.name}
                />
                <DetailItem
                  label={t("services.code", { defaultValue: "Code" })}
                  value={service.code}
                />
                <DetailItem
                  label={t("services.categoryLabel", {
                    defaultValue: "Service Category",
                  })}
                  value={t(`services.category.${service.category}`, {
                    defaultValue: formatServiceCategory(service.category),
                  })}
                />
                <DetailItem
                  label={t("services.pricingTypeLabel", {
                    defaultValue: "Pricing Type",
                  })}
                  value={t(`services.pricingType.${service.pricingType}`, {
                    defaultValue: formatPricingType(service.pricingType),
                  })}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  {t("services.pricingSection", {
                    defaultValue: "Pricing Details",
                  })}
                </CardTitle>
                <CardDescription>
                  {t("services.pricingSectionHint", {
                    defaultValue:
                      "Save the base commercial values used when adding this service to an event.",
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <DetailItem
                  label={t("services.basePrice", { defaultValue: "Base Price" })}
                  value={formatMoney(service.basePrice)}
                />
                <DetailItem
                  label={t("services.unitName", { defaultValue: "Unit Name" })}
                  value={service.unitName}
                />
                <DetailItem
                  label={t("services.statusLabel", { defaultValue: "Status" })}
                  value={
                    service.isActive
                      ? t("services.status.active", { defaultValue: "Active" })
                      : t("services.status.inactive", {
                          defaultValue: "Inactive",
                        })
                  }
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  {t("services.auditTrail", { defaultValue: "Audit Trail" })}
                </CardTitle>
                <CardDescription>
                  {t("services.auditTrailHint", {
                    defaultValue: "Who created the service and when it was updated.",
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <DetailItem
                  label={t("services.createdBy", { defaultValue: "Created By" })}
                  value={service.createdByUser?.fullName}
                />
                <DetailItem
                  label={t("services.updatedBy", { defaultValue: "Updated By" })}
                  value={service.updatedByUser?.fullName}
                />
                <DetailItem
                  label={t("services.createdAt", { defaultValue: "Created At" })}
                  value={
                    service.createdAt
                      ? format(new Date(service.createdAt), "MMM d, yyyy p", {
                          locale: dateLocale,
                        })
                      : "-"
                  }
                />
                <DetailItem
                  label={t("services.updatedAt", { defaultValue: "Updated At" })}
                  value={
                    service.updatedAt
                      ? format(new Date(service.updatedAt), "MMM d, yyyy p", {
                          locale: dateLocale,
                        })
                      : "-"
                  }
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                {t("services.description", { defaultValue: "Description" })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--lux-text-secondary)]">
                {service.description ||
                  t("services.noDescription", {
                    defaultValue: "No description added yet.",
                  })}
              </p>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </ProtectedComponent>
  );
};

export default ServiceDetailsPage;
