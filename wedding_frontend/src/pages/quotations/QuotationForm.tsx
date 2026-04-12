import { FileText } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { PageContainer } from "@/components/layout/page-container";
import { QuotationFormWorkspace } from "./_components/QuotationFormWorkspace";

export default function QuotationFormPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEditMode = Boolean(id);
  const requestedMode =
    searchParams.get("mode") === "from-event" ? "from_event" : "manual";
  const preselectedEventId = searchParams.get("eventId") ?? "";

  return (
    <PageContainer className="pb-4 pt-4 text-foreground">
      <div dir={i18n.dir()} className="mx-auto w-full max-w-7xl space-y-6">
        <button
          type="button"
          onClick={() =>
            navigate(isEditMode && id ? `/quotations/${id}` : "/quotations")
          }
          className="inline-flex items-center gap-2 text-sm text-[var(--lux-text-secondary)] transition-colors hover:text-[var(--lux-gold)]"
        >
          {"<-"}{" "}
          {isEditMode
            ? t("quotations.backToQuotation", {
                defaultValue: "Back to Quotation",
              })
            : t("quotations.backToQuotations", {
                defaultValue: "Back to Quotations",
              })}
        </button>

        <div
          className="overflow-hidden rounded-[4px] border p-4 shadow-luxe"
          style={{
            background: "var(--lux-panel-surface)",
            borderColor: "var(--lux-panel-border)",
          }}
        >
          <div className="flex items-start gap-4">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-[4px] border"
              style={{
                background: "var(--lux-control-hover)",
                borderColor: "var(--lux-control-border)",
                color: "var(--lux-gold)",
              }}
            >
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--lux-heading)]">
                {isEditMode
                  ? t("quotations.editTitle", {
                      defaultValue: "Edit Quotation",
                    })
                  : t("quotations.createTitle", {
                      defaultValue: "Create Quotation",
                    })}
              </h1>
              <p className="text-sm text-[var(--lux-text-secondary)]">
                {isEditMode
                  ? t("quotations.editDescription", {
                      defaultValue:
                        "Update quotation header details and revise the existing line items.",
                    })
                  : t("quotations.createDescription", {
                      defaultValue:
                        "Create one quotation with mixed service and vendor items, or build it directly from event selections.",
                    })}
              </p>
            </div>
          </div>
        </div>

        <QuotationFormWorkspace
          quotationId={id}
          initialMode={requestedMode}
          initialEventId={preselectedEventId}
          onCancel={() =>
            navigate(isEditMode && id ? `/quotations/${id}` : "/quotations")
          }
          onOpenQuotation={(quotationId) => navigate(`/quotations/${quotationId}`)}
        />
      </div>
    </PageContainer>
  );
}
