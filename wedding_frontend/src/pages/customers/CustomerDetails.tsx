import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { Edit, Link2, Phone, UsersRound } from "lucide-react";
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
import { useCustomer } from "@/hooks/customers/useCustomers";

import { CustomerStatusBadge } from "./_components/customerStatusBadge";

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

const CustomerDetailsPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: customer, isLoading } = useCustomer(id);
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

  if (!customer) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-sm text-[var(--lux-text-secondary)]">
          {t("common.noResultsTitle", { defaultValue: "No results found" })}
        </div>
      </div>
    );
  }

  return (
    <ProtectedComponent permission="customers.read">
      <PageContainer className="pb-4 pt-4 text-foreground">
        <div dir={i18n.dir()} className="mx-auto w-full max-w-6xl space-y-6">
          <button
            type="button"
            onClick={() => navigate("/customers")}
            className="inline-flex items-center gap-2 text-sm text-[var(--lux-text-secondary)] transition-colors hover:text-[var(--lux-gold)]"
          >
            {"<-"}{" "}
            {t("customers.backToCustomers", {
              defaultValue: "Back to Customers",
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
                  <UsersRound className="h-6 w-6" />
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-bold text-[var(--lux-heading)]">
                      {customer.fullName}
                    </h1>
                    <CustomerStatusBadge status={customer.status} />
                  </div>
                  <p className="text-sm text-[var(--lux-text-secondary)]">
                    {customer.email || customer.mobile}
                  </p>
                </div>
              </div>

              <ProtectedComponent permission="customers.update">
                <Button onClick={() => navigate(`/customers/edit/${customer.id}`)}>
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
                  {t("customers.contactDetails", {
                    defaultValue: "Contact Details",
                  })}
                </CardTitle>
                <CardDescription>
                  {t("customers.contactDetailsHint", {
                    defaultValue: "Primary contact data for this customer.",
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <DetailItem
                  label={t("customers.mobile", { defaultValue: "Primary Mobile" })}
                  value={customer.mobile}
                />
                <DetailItem
                  label={t("customers.mobile2", {
                    defaultValue: "Secondary Mobile",
                  })}
                  value={customer.mobile2}
                />
                <DetailItem
                  label={t("customers.email", { defaultValue: "Email" })}
                  value={customer.email}
                />
                <DetailItem
                  label={t("common.venue", { defaultValue: "Venue" })}
                  value={customer.venue?.name || customer.venueNameSnapshot}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  {t("customers.eventProfile", { defaultValue: "Event Profile" })}
                </CardTitle>
                <CardDescription>
                  {t("customers.eventProfileHint", {
                    defaultValue: "Wedding date, venue, and guest volume.",
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <DetailItem
                  label={t("customers.weddingDate", {
                    defaultValue: "Wedding Date",
                  })}
                  value={
                    customer.weddingDate
                      ? format(new Date(customer.weddingDate), "MMM d, yyyy", {
                          locale: dateLocale,
                        })
                      : "-"
                  }
                />
                <DetailItem
                  label={t("customers.groomName", { defaultValue: "Groom Name" })}
                  value={customer.groomName}
                />
                <DetailItem
                  label={t("customers.brideName", { defaultValue: "Bride Name" })}
                  value={customer.brideName}
                />
                <DetailItem
                  label={t("customers.guestCount", {
                    defaultValue: "Guest Count",
                  })}
                  value={customer.guestCount}
                />
                <DetailItem
                  label={t("customers.sourceLead", { defaultValue: "Source Lead" })}
                  value={customer.sourceLead?.fullName}
                />
                <DetailItem
                  label={t("customers.sourceLeadStatus", {
                    defaultValue: "Lead Status",
                  })}
                  value={customer.sourceLead?.status}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  {t("customers.auditTrail", { defaultValue: "Audit Trail" })}
                </CardTitle>
                <CardDescription>
                  {t("customers.auditTrailHint", {
                    defaultValue:
                      "Who created this customer and when it was last updated.",
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <DetailItem
                  label={t("customers.createdBy", { defaultValue: "Created By" })}
                  value={customer.createdByUser?.fullName}
                />
                <DetailItem
                  label={t("customers.updatedBy", { defaultValue: "Updated By" })}
                  value={customer.updatedByUser?.fullName}
                />
                <DetailItem
                  label={t("customers.createdAt", { defaultValue: "Created At" })}
                  value={
                    customer.createdAt
                      ? format(new Date(customer.createdAt), "MMM d, yyyy p", {
                          locale: dateLocale,
                        })
                      : "-"
                  }
                />
                <DetailItem
                  label={t("customers.updatedAt", { defaultValue: "Updated At" })}
                  value={
                    customer.updatedAt
                      ? format(new Date(customer.updatedAt), "MMM d, yyyy p", {
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
                {customer.notes ||
                  t("customers.noNotes", {
                    defaultValue: "No notes added yet.",
                  })}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                {t("customers.sourceLeadSection", {
                  defaultValue: "Source Lead",
                })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {customer.sourceLead ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <DetailItem
                      label={t("customers.sourceLeadName", {
                        defaultValue: "Lead Name",
                      })}
                      value={customer.sourceLead.fullName}
                    />
                    <DetailItem
                      label={t("customers.sourceLeadMobile", {
                        defaultValue: "Lead Mobile",
                      })}
                      value={customer.sourceLead.mobile}
                    />
                    <DetailItem
                      label={t("customers.sourceLeadWeddingDate", {
                        defaultValue: "Lead Wedding Date",
                      })}
                      value={customer.sourceLead.weddingDate}
                    />
                  </div>

                  <ProtectedComponent permission="leads.read">
                    <Button
                      variant="outline"
                      onClick={() =>
                        navigate(`/leads/${customer.sourceLead?.id}`)
                      }
                    >
                      <Link2 className="h-4 w-4" />
                      {t("customers.viewSourceLead", {
                        defaultValue: "View Source Lead",
                      })}
                    </Button>
                  </ProtectedComponent>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-[var(--lux-text-secondary)]">
                  <Phone className="h-4 w-4 text-[var(--lux-gold)]" />
                  {t("customers.noSourceLeadLinked", {
                    defaultValue: "This customer is not linked to a source lead.",
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </ProtectedComponent>
  );
};

export default CustomerDetailsPage;
