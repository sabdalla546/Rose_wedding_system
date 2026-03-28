import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Edit, UserRound } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
    <div className="rounded-2xl border px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
        {label}
      </p>
      <p className="mt-1 text-sm text-[var(--lux-text)]">{value || "-"}</p>
    </div>
  );
}

const CustomerDetailsPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: customer, isLoading } = useCustomer(id);

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
          {t("common.not_found", { defaultValue: "Not found" })}
        </div>
      </div>
    );
  }

  return (
    <ProtectedComponent permission="customers.read">
      <PageContainer className="pb-4 pt-4 text-foreground">
        <div dir={i18n.dir()} className="mx-auto w-full max-w-5xl space-y-6">
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

          <div
            className="overflow-hidden rounded-[24px] border p-4 shadow-luxe"
            style={{
              background: "var(--lux-panel-surface)",
              borderColor: "var(--lux-panel-border)",
            }}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-[18px] border"
                  style={{
                    background: "var(--lux-control-hover)",
                    borderColor: "var(--lux-control-border)",
                    color: "var(--lux-gold)",
                  }}
                >
                  <UserRound className="h-6 w-6" />
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
                <Button
                  onClick={() => navigate(`/customers/edit/${customer.id}`)}
                >
                  <Edit className="h-4 w-4" />
                  {t("common.edit", { defaultValue: "Edit" })}
                </Button>
              </ProtectedComponent>
            </div>
          </div>

          <Card className="rounded-[24px] p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <DetailItem
                label={t("customers.fullName", { defaultValue: "Full Name" })}
                value={customer.fullName}
              />
              <DetailItem
                label={t("customers.mobile", {
                  defaultValue: "Primary Mobile",
                })}
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
                label={t("customers.nationalId", { defaultValue: "National ID" })}
                value={customer.nationalId}
              />
              <DetailItem
                label={t("customers.statusLabel", { defaultValue: "Status" })}
                value={t(`customers.status.${customer.status}`, {
                  defaultValue: customer.status,
                })}
              />
              <DetailItem
                label={t("customers.createdBy", { defaultValue: "Created By" })}
                value={customer.createdByUser?.fullName}
              />
              <div className="md:col-span-2">
                <DetailItem
                  label={t("customers.address", { defaultValue: "Address" })}
                  value={customer.address}
                />
              </div>
              <div className="md:col-span-2">
                <DetailItem
                  label={t("common.notes", { defaultValue: "Notes" })}
                  value={customer.notes}
                />
              </div>
            </div>
          </Card>
        </div>
      </PageContainer>
    </ProtectedComponent>
  );
};

export default CustomerDetailsPage;
