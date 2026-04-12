import { FileText } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { PageContainer } from "@/components/layout/page-container";
import { ContractFormWorkspace } from "./_components/ContractFormWorkspace";

export default function ContractFormPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEditMode = Boolean(id);
  const requestedMode =
    searchParams.get("mode") === "from-quotation" ? "from_quotation" : "manual";
  const preselectedEventId = searchParams.get("eventId") ?? "";
  const preselectedQuotationId = searchParams.get("quotationId") ?? "";

  return (
    <PageContainer className="pb-4 pt-4 text-foreground">
      <div dir={i18n.dir()} className="mx-auto w-full max-w-6xl space-y-6">
        <button
          type="button"
          onClick={() =>
            navigate(isEditMode && id ? `/contracts/${id}` : "/contracts")
          }
          className="inline-flex items-center gap-2 text-sm text-[var(--lux-text-secondary)] transition-colors hover:text-[var(--lux-gold)]"
        >
          {"<-"}{" "}
          {isEditMode
            ? t("contracts.backToContract", {
                defaultValue: "Back to Contract",
              })
            : t("contracts.backToContracts", {
                defaultValue: "Back to Contracts",
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

            <div className="space-y-1">
              <h1 className="text-xl font-bold text-[var(--lux-heading)]">
                {isEditMode
                  ? t("contracts.editTitle", {
                      defaultValue: "Edit Contract",
                    })
                  : t("contracts.createTitle", {
                      defaultValue: "Create Contract",
                    })}
              </h1>
              <p className="text-sm text-[var(--lux-text-secondary)]">
                {isEditMode
                  ? t("contracts.editDescription", {
                      defaultValue:
                        "Update contract header details and revise the existing contract items.",
                    })
                  : t("contracts.createDescription", {
                      defaultValue:
                        "Create a manual contract or build one directly from a quotation.",
                    })}
              </p>
            </div>
          </div>
        </div>

        <ContractFormWorkspace
          contractId={id}
          initialMode={requestedMode}
          initialEventId={preselectedEventId}
          initialQuotationId={preselectedQuotationId}
          onCancel={() =>
            navigate(isEditMode && id ? `/contracts/${id}` : "/contracts")
          }
          onOpenContract={(contractId) => navigate(`/contracts/${contractId}`)}
        />
      </div>
    </PageContainer>
  );
}
