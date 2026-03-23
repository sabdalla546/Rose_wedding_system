import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { Edit, FilePlus2, FileText, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
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
import ConfirmDialog from "@/components/ui/confirmDialog";
import { useDeleteQuotation } from "@/hooks/quotations/useDeleteQuotation";
import { useQuotation } from "@/hooks/quotations/useQuotations";
import { getEventDisplayTitle } from "@/pages/events/adapters";

import {
  formatMoney,
  formatQuotationItemCategory,
  getQuotationDisplayNumber,
  getQuotationItemDisplayName,
} from "./adapters";
import { QuotationStatusBadge } from "./_components/quotationStatusBadge";

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

const QuotationDetailsPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: quotation, isLoading } = useQuotation(id);
  const deleteMutation = useDeleteQuotation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
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

  if (!quotation) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-sm text-[var(--lux-text-secondary)]">
          {t("common.noResultsTitle", { defaultValue: "No results found" })}
        </div>
      </div>
    );
  }

  return (
    <ProtectedComponent permission="quotations.read">
      <PageContainer className="pb-4 pt-4 text-foreground">
        <div dir={i18n.dir()} className="mx-auto w-full max-w-6xl space-y-6">
          <button
            type="button"
            onClick={() => navigate("/quotations")}
            className="inline-flex items-center gap-2 text-sm text-[var(--lux-text-secondary)] transition-colors hover:text-[var(--lux-gold)]"
          >
            {"<-"}{" "}
            {t("quotations.backToQuotations", {
              defaultValue: "Back to Quotations",
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
                  <FileText className="h-6 w-6" />
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-bold text-[var(--lux-heading)]">
                      {getQuotationDisplayNumber(quotation)}
                    </h1>
                    <QuotationStatusBadge status={quotation.status} />
                  </div>
                  <p className="text-sm text-[var(--lux-text-secondary)]">
                    {quotation.event
                      ? getEventDisplayTitle(quotation.event)
                      : `${t("quotations.event", {
                          defaultValue: "Event",
                        })} #${quotation.eventId}`}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  onClick={() =>
                    navigate(
                      `/contracts/create?mode=from-quotation&quotationId=${quotation.id}`,
                    )
                  }
                >
                  <FilePlus2 className="h-4 w-4" />
                  {t("quotations.createContract", {
                    defaultValue: "Create Contract",
                  })}
                </Button>

                <ProtectedComponent permission="quotations.update">
                  <Button onClick={() => navigate(`/quotations/edit/${quotation.id}`)}>
                    <Edit className="h-4 w-4" />
                    {t("common.edit", { defaultValue: "Edit" })}
                  </Button>
                </ProtectedComponent>

                <ProtectedComponent permission="quotations.delete">
                  <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                    <Trash2 className="h-4 w-4" />
                    {t("common.delete", { defaultValue: "Delete" })}
                  </Button>
                </ProtectedComponent>
              </div>
            </div>
          </SectionCard>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>
                  {t("quotations.headerInformation", {
                    defaultValue: "Quotation Header",
                  })}
                </CardTitle>
                <CardDescription>
                  {t("quotations.headerInformationHint", {
                    defaultValue:
                      "Core quotation dates, reference number, and commercial status.",
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <DetailItem
                  label={t("quotations.quotationNumber", {
                    defaultValue: "Quotation Number",
                  })}
                  value={getQuotationDisplayNumber(quotation)}
                />
                <DetailItem
                  label={t("quotations.issueDate", {
                    defaultValue: "Issue Date",
                  })}
                  value={format(new Date(quotation.issueDate), "MMM d, yyyy", {
                    locale: dateLocale,
                  })}
                />
                <DetailItem
                  label={t("quotations.validUntil", {
                    defaultValue: "Valid Until",
                  })}
                  value={
                    quotation.validUntil
                      ? format(new Date(quotation.validUntil), "MMM d, yyyy", {
                          locale: dateLocale,
                        })
                      : "-"
                  }
                />
                <DetailItem
                  label={t("quotations.statusLabel", {
                    defaultValue: "Status",
                  })}
                  value={t(`quotations.status.${quotation.status}`, {
                    defaultValue: quotation.status,
                  })}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  {t("quotations.relatedRecords", {
                    defaultValue: "Related Records",
                  })}
                </CardTitle>
                <CardDescription>
                  {t("quotations.relatedRecordsHint", {
                    defaultValue:
                      "Linked event and customer information for this quotation.",
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <DetailItem
                  label={t("quotations.event", { defaultValue: "Event" })}
                  value={
                    quotation.event
                      ? getEventDisplayTitle(quotation.event)
                      : `Event #${quotation.eventId}`
                  }
                />
                <DetailItem
                  label={t("quotations.customer", { defaultValue: "Customer" })}
                  value={
                    quotation.event?.customer?.fullName ||
                    quotation.customer?.fullName
                  }
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  {t("quotations.totals", { defaultValue: "Totals" })}
                </CardTitle>
                <CardDescription>
                  {t("quotations.totalsHint", {
                    defaultValue:
                      "Commercial summary for the quotation document.",
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <DetailItem
                  label={t("quotations.subtotal", { defaultValue: "Subtotal" })}
                  value={formatMoney(quotation.subtotal)}
                />
                <DetailItem
                  label={t("quotations.discount", { defaultValue: "Discount" })}
                  value={formatMoney(quotation.discountAmount)}
                />
                <DetailItem
                  label={t("quotations.totalAmount", {
                    defaultValue: "Total Amount",
                  })}
                  value={formatMoney(quotation.totalAmount)}
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                {t("quotations.itemsTitle", {
                  defaultValue: "Quotation Items",
                })}
              </CardTitle>
              <CardDescription>
                {t("quotations.itemsHint", {
                  defaultValue:
                    "Commercial lines included in this quotation document.",
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--lux-row-border)] text-[var(--lux-text-muted)]">
                      <th className="px-3 py-3 text-start">#</th>
                      <th className="px-3 py-3 text-start">
                        {t("quotations.itemName", { defaultValue: "Item" })}
                      </th>
                      <th className="px-3 py-3 text-start">
                        {t("quotations.category", { defaultValue: "Category" })}
                      </th>
                      <th className="px-3 py-3 text-start">
                        {t("quotations.quantity", { defaultValue: "Quantity" })}
                      </th>
                      <th className="px-3 py-3 text-start">
                        {t("quotations.unitPrice", {
                          defaultValue: "Unit Price",
                        })}
                      </th>
                      <th className="px-3 py-3 text-start">
                        {t("quotations.totalPrice", {
                          defaultValue: "Total Price",
                        })}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(quotation.items ?? []).map((item, index) => (
                      <tr
                        key={item.id}
                        className="border-b border-[var(--lux-row-border)] align-top last:border-b-0"
                      >
                        <td className="px-3 py-3 text-[var(--lux-text-secondary)]">
                          {index + 1}
                        </td>
                        <td className="px-3 py-3">
                          <div className="font-medium text-[var(--lux-text)]">
                            {getQuotationItemDisplayName(item)}
                          </div>
                          {item.notes ? (
                            <div className="mt-1 text-xs text-[var(--lux-text-secondary)]">
                              {item.notes}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-3 py-3 text-[var(--lux-text-secondary)]">
                          {t(`services.category.${item.category}`, {
                            defaultValue: formatQuotationItemCategory(item.category),
                          })}
                        </td>
                        <td className="px-3 py-3 text-[var(--lux-text-secondary)]">
                          {item.quantity}
                        </td>
                        <td className="px-3 py-3 text-[var(--lux-text-secondary)]">
                          {formatMoney(item.unitPrice)}
                        </td>
                        <td className="px-3 py-3 font-semibold text-[var(--lux-text)]">
                          {formatMoney(item.totalPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 sm:max-w-sm sm:justify-self-end">
                <div className="flex items-center justify-between rounded-2xl border px-4 py-3">
                  <span className="text-sm text-[var(--lux-text-secondary)]">
                    {t("quotations.subtotal", { defaultValue: "Subtotal" })}
                  </span>
                  <span className="font-semibold text-[var(--lux-text)]">
                    {formatMoney(quotation.subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border px-4 py-3">
                  <span className="text-sm text-[var(--lux-text-secondary)]">
                    {t("quotations.discount", { defaultValue: "Discount" })}
                  </span>
                  <span className="font-semibold text-[var(--lux-text)]">
                    {formatMoney(quotation.discountAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border px-4 py-3">
                  <span className="text-sm text-[var(--lux-text-secondary)]">
                    {t("quotations.totalAmount", {
                      defaultValue: "Total Amount",
                    })}
                  </span>
                  <span className="font-semibold text-[var(--lux-heading)]">
                    {formatMoney(quotation.totalAmount)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("common.notes", { defaultValue: "Notes" })}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--lux-text-secondary)]">
                {quotation.notes ||
                  t("quotations.noNotes", {
                    defaultValue: "No notes added yet.",
                  })}
              </p>
            </CardContent>
          </Card>
        </div>
      </PageContainer>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={t("quotations.deleteTitle", {
          defaultValue: "Delete Quotation",
        })}
        message={t("quotations.deleteMessage", {
          defaultValue: "Are you sure you want to delete this quotation?",
        })}
        confirmLabel={t("common.delete", { defaultValue: "Delete" })}
        cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
        onConfirm={() =>
          deleteMutation.mutate({
            id: quotation.id,
            eventId: quotation.eventId,
            redirectToList: true,
          })
        }
        isPending={deleteMutation.isPending}
      />
    </ProtectedComponent>
  );
};

export default QuotationDetailsPage;
