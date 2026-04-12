import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { PageContainer } from "@/components/layout/page-container";
import { ContractDetailsWorkspace } from "./_components/ContractDetailsWorkspace";

export default function ContractDetailsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <PageContainer className="pb-4 pt-4 text-foreground">
      <div dir={i18n.dir()} className="mx-auto w-full max-w-6xl space-y-6">
        <button
          type="button"
          onClick={() => navigate("/contracts")}
          className="inline-flex items-center gap-2 text-sm text-[var(--lux-text-secondary)] transition-colors hover:text-[var(--lux-gold)]"
        >
          {"<-"}{" "}
          {t("contracts.backToContracts", {
            defaultValue: "Back to Contracts",
          })}
        </button>

        <ContractDetailsWorkspace
          contractId={id}
          onOpenContractEdit={(contractId) =>
            navigate(`/contracts/edit/${contractId}`)
          }
          onOpenQuotation={(quotationId) => navigate(`/quotations/${quotationId}`)}
          onOpenEvent={(eventId) => navigate(`/events/${eventId}`)}
          onDeleteSuccess={() => navigate("/contracts")}
        />
      </div>
    </PageContainer>
  );
}
