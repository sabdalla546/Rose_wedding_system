import { Layers3 } from "lucide-react";
import { useMatches } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import { PageContainer } from "@/components/layout/page-container";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionCard } from "@/components/shared/section-card";

type ModulePageHandle = {
  titleKey?: string;
  title?: string;
  titleAr?: string;
  subtitle?: string;
  subtitleAr?: string;
  requiredPermission?: string;
};

export function ModulePlaceholderPage() {
  const { i18n, t } = useTranslation();
  const matches = useMatches();
  const currentHandle = (matches[matches.length - 1]?.handle ?? {}) as ModulePageHandle;
  const translatedTitle = currentHandle.titleKey ? t(currentHandle.titleKey) : "";
  const title =
    translatedTitle && translatedTitle !== currentHandle.titleKey
      ? translatedTitle
      : i18n.resolvedLanguage === "ar"
        ? currentHandle.titleAr ?? currentHandle.title ?? ""
        : currentHandle.title ?? currentHandle.titleAr ?? "";

  const subtitle =
    i18n.resolvedLanguage === "ar"
      ? currentHandle.subtitleAr ??
        "هذه مساحة عمل جاهزة للتوسع. ستتم إضافة التفاصيل وسير العمل في الخطوة التالية."
      : currentHandle.subtitle ??
        "This module workspace is ready for expansion. Detailed workflows will be added next.";

  return (
    <PageContainer>
      <section className="space-y-3">
        <h1 className="text-3xl font-semibold text-[var(--lux-heading)]">{title}</h1>
        <p className="max-w-3xl text-sm text-[var(--lux-text-secondary)]">{subtitle}</p>
      </section>

      <ProtectedComponent
        fallback={
          <SectionCard className="space-y-5">
            <EmptyState
              description="You do not have permission to view this module."
              icon={Layers3}
              title={title}
            />
          </SectionCard>
        }
        permission={currentHandle.requiredPermission}
      >
        <SectionCard className="space-y-5">
          <EmptyState
            description={subtitle}
            icon={Layers3}
            title={title}
          />
        </SectionCard>
      </ProtectedComponent>
    </PageContainer>
  );
}
