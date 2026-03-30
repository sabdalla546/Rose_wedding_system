import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { Edit, Handshake } from "lucide-react";
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
import { useVendor } from "@/hooks/vendors/useVendors";

import { getVendorTypeName } from "./adapters";
import { VendorActiveBadge } from "./_components/vendorActiveBadge";

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

const VendorDetailsPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: vendor, isLoading } = useVendor(id);
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

  if (!vendor) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-sm text-[var(--lux-text-secondary)]">
          {t("common.noResultsTitle", { defaultValue: "No results found" })}
        </div>
      </div>
    );
  }

  return (
    <ProtectedComponent permission="vendors.read">
      <PageContainer className="pb-4 pt-4 text-foreground">
        <div dir={i18n.dir()} className="mx-auto w-full max-w-6xl space-y-6">
          <button
            type="button"
            onClick={() => navigate("/settings/vendors")}
            className="inline-flex items-center gap-2 text-sm text-[var(--lux-text-secondary)] transition-colors hover:text-[var(--lux-gold)]"
          >
            {"<-"}{" "}
            {t("vendors.backToVendors", { defaultValue: "Back to Vendors" })}
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
                  <Handshake className="h-6 w-6" />
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-bold text-[var(--lux-heading)]">
                      {vendor.name}
                    </h1>
                    <VendorActiveBadge isActive={vendor.isActive} />
                  </div>
                  <p className="text-sm text-[var(--lux-text-secondary)]">
                    {getVendorTypeName({
                      slug: vendor.type,
                      vendorType: vendor.vendorType,
                      language: i18n.resolvedLanguage ?? "en",
                    })}
                  </p>
                </div>
              </div>

              <ProtectedComponent permission="vendors.update">
                <Button onClick={() => navigate(`/settings/vendors/edit/${vendor.id}`)}>
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
                  {t("vendors.basicInformation", {
                    defaultValue: "Basic Information",
                  })}
                </CardTitle>
                <CardDescription>
                  {t("vendors.basicInformationHint", {
                    defaultValue:
                      "Capture the core vendor information and service type.",
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <DetailItem
                  label={t("vendors.name", { defaultValue: "Vendor Name" })}
                  value={vendor.name}
                />
                <DetailItem
                  label={t("vendors.typeLabel", { defaultValue: "Vendor Type" })}
                  value={getVendorTypeName({
                    slug: vendor.type,
                    vendorType: vendor.vendorType,
                    language: i18n.resolvedLanguage ?? "en",
                  })}
                />
                <DetailItem
                  label={t("vendors.statusLabel", { defaultValue: "Status" })}
                  value={vendor.isActive
                    ? t("vendors.status.active", { defaultValue: "Active" })
                    : t("vendors.status.inactive", { defaultValue: "Inactive" })}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  {t("vendors.contactSection", {
                    defaultValue: "Contact Details",
                  })}
                </CardTitle>
                <CardDescription>
                  {t("vendors.contactSectionHint", {
                    defaultValue:
                      "Save the main contact points for the vendor team.",
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <DetailItem
                  label={t("vendors.contactPerson", {
                    defaultValue: "Contact Person",
                  })}
                  value={vendor.contactPerson}
                />
                <DetailItem
                  label={t("vendors.phone", { defaultValue: "Primary Phone" })}
                  value={vendor.phone}
                />
                <DetailItem
                  label={t("vendors.phone2", { defaultValue: "Secondary Phone" })}
                  value={vendor.phone2}
                />
                <DetailItem
                  label={t("vendors.email", { defaultValue: "Email" })}
                  value={vendor.email}
                />
                <DetailItem
                  label={t("vendors.address", { defaultValue: "Address" })}
                  value={vendor.address}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  {t("vendors.auditTrail", { defaultValue: "Audit Trail" })}
                </CardTitle>
                <CardDescription>
                  {t("vendors.auditTrailHint", {
                    defaultValue: "Who created the vendor and when it was updated.",
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <DetailItem
                  label={t("vendors.createdBy", { defaultValue: "Created By" })}
                  value={vendor.createdByUser?.fullName}
                />
                <DetailItem
                  label={t("vendors.updatedBy", { defaultValue: "Updated By" })}
                  value={vendor.updatedByUser?.fullName}
                />
                <DetailItem
                  label={t("vendors.createdAt", { defaultValue: "Created At" })}
                  value={
                    vendor.createdAt
                      ? format(new Date(vendor.createdAt), "MMM d, yyyy p", {
                          locale: dateLocale,
                        })
                      : "-"
                  }
                />
                <DetailItem
                  label={t("vendors.updatedAt", { defaultValue: "Updated At" })}
                  value={
                    vendor.updatedAt
                      ? format(new Date(vendor.updatedAt), "MMM d, yyyy p", {
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
              <CardTitle>{t("common.notes", { defaultValue: "Notes" })}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--lux-text-secondary)]">
                {vendor.notes ||
                  t("vendors.noNotes", {
                    defaultValue: "No notes added yet.",
                  })}
              </p>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </ProtectedComponent>
  );
};

export default VendorDetailsPage;
