import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { PageContainer } from "@/components/layout/page-container";
import { QuotationDetailsWorkspace } from "./_components/QuotationDetailsWorkspace";

export default function QuotationDetailsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();

  return (
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

        <QuotationDetailsWorkspace
          quotationId={id}
          onOpenQuotationEdit={(quotationId) =>
            navigate(`/quotations/edit/${quotationId}`)
          }
          onOpenContractCreate={(quotationId) =>
            navigate(
              `/contracts/create?mode=from-quotation&quotationId=${quotationId}`,
            )
          }
          onOpenContract={(contractId) => navigate(`/contracts/${contractId}`)}
          onOpenEvent={(eventId) => navigate(`/events/${eventId}`)}
          onDeleteSuccess={() => navigate("/quotations")}
        />
      </div>
    </PageContainer>
  );
}
