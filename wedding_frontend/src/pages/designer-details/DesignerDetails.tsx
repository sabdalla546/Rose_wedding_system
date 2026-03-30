import {
  ArrowUpLeft,
  CalendarRange,
  Handshake,
  Layers3,
  PackageOpen,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { PageContainer } from "@/components/layout/page-container";
import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type HubCard = {
  id: string;
  title: string;
  description: string;
  cta: string;
  href?: string;
  icon: typeof CalendarRange;
  permission?: string;
  toneBackground: string;
};

const hubCards: HubCard[] = [
  {
    id: "event-management",
    title: "إدارة الحفل",
    description:
      "مساحة تشغيلية جاهزة للمرحلة القادمة لربط الحفل وإدارة بنوده، الشركات، والمتابعة التنفيذية من مكان واحد.",
    cta: "إدارة الحفل",
    href: "#event-workspace",
    icon: CalendarRange,
    permission: "events.read",
    toneBackground:
      "linear-gradient(90deg, color-mix(in srgb, var(--lux-gold) 24%, transparent), transparent)",
  },
  {
    id: "vendors",
    title: "الشركات",
    description:
      "الوصول السريع إلى الشركات، أنواعها، الخدمات الفرعية، وخطط التسعير من نفس module hub.",
    cta: "فتح الشركات",
    href: "/settings/vendors",
    icon: Handshake,
    permission: "vendors.read",
    toneBackground:
      "linear-gradient(90deg, color-mix(in srgb, var(--lux-primary-surface) 28%, transparent), transparent)",
  },
  {
    id: "services",
    title: "الخدمات",
    description:
      "إدارة كتالوج الخدمات وبنود الحفل الأساسية مع نقطة دخول واضحة للمرحلة التشغيلية التالية.",
    cta: "فتح الخدمات",
    href: "/settings/services",
    icon: PackageOpen,
    permission: "services.read",
    toneBackground:
      "linear-gradient(90deg, color-mix(in srgb, var(--lux-control-hover) 92%, transparent), transparent)",
  },
];

function HubCardAction({
  card,
}: {
  card: HubCard;
}) {
  const actionButton = card.href ? (
    <Button asChild variant={card.id === "event-management" ? "secondary" : "default"}>
      <Link to={card.href}>
        {card.cta}
        <ArrowUpLeft className="h-4 w-4" />
      </Link>
    </Button>
  ) : (
    <Button variant="secondary" disabled>
      {card.cta}
    </Button>
  );

  if (!card.permission) {
    return actionButton;
  }

  return (
    <ProtectedComponent
      permission={card.permission}
      fallback={
        <Button variant="outline" disabled>
          {card.cta}
        </Button>
      }
    >
      {actionButton}
    </ProtectedComponent>
  );
}

export default function DesignerDetailsPage() {
  const { i18n, t } = useTranslation();

  return (
    <ProtectedComponent anyOf={["events.read", "vendors.read", "services.read"]}>
      <PageContainer className="pb-4 pt-4 text-foreground">
        <div dir={i18n.dir()} className="mx-auto w-full max-w-6xl space-y-6">
          <SectionCard
            className="relative overflow-hidden border border-[var(--lux-row-border)]"
            style={{
              background:
                "radial-gradient(circle at top right, color-mix(in srgb, var(--lux-gold) 12%, transparent), transparent 42%), linear-gradient(135deg, color-mix(in srgb, var(--lux-panel-surface) 92%, black), color-mix(in srgb, var(--lux-control-hover) 52%, transparent))",
            }}
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--lux-gold-border)] bg-[var(--lux-control-hover)] px-4 py-2 text-xs font-semibold text-[var(--lux-gold)]">
                  <Sparkles className="h-4 w-4" />
                  {t("sidebar.nav.designerDetails", {
                    defaultValue: "تفاصيل المصمم",
                  })}
                </div>
                <div className="space-y-3">
                  <h1 className="text-3xl font-semibold text-[var(--lux-heading)]">
                    تفاصيل المصمم
                  </h1>
                  <p className="max-w-2xl text-sm leading-7 text-[var(--lux-text-secondary)]">
                    صفحة تشغيلية مركزية تربط إدارة الحفل، الشركات، والخدمات داخل
                    واجهة واحدة جاهزة للتوسع في المرحلة القادمة.
                  </p>
                </div>
              </div>

              <div className="flex h-20 w-20 items-center justify-center rounded-[28px] border border-[var(--lux-gold-border)] bg-[color-mix(in_srgb,var(--lux-gold)_10%,transparent)] text-[var(--lux-gold)] shadow-[0_20px_60px_color-mix(in_srgb,var(--lux-gold)_18%,transparent)]">
                <Layers3 className="h-9 w-9" />
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {[
                {
                  label: "إدارة الحفل",
                  value: "Workspace جاهز للربط",
                },
                {
                  label: "الشركات",
                  value: "إدارة الموردين والشركات",
                },
                {
                  label: "الخدمات",
                  value: "الكتالوج والبنود التشغيلية",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[22px] border border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)] px-4 py-4"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
                    {item.label}
                  </p>
                  <p className="mt-2 text-sm font-medium text-[var(--lux-text)]">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard className="space-y-3">
            <h2 className="text-xl font-semibold text-[var(--lux-heading)]">
              مركز العمل الرئيسي
            </h2>
            <p className="max-w-4xl text-sm leading-7 text-[var(--lux-text-secondary)]">
              هذه الصفحة أصبحت نقطة الدخول الرسمية لوحدة تفاصيل المصمم. من هنا
              يمكن التنقل مباشرة إلى إدارة الحفل، الشركات، والخدمات ضمن نفس
              الهيكل التشغيلي، مع إبقاء مساحة إدارة الحفل مرئية ومهيأة للمرحلة
              القادمة.
            </p>
          </SectionCard>

          <div className="grid gap-4 xl:grid-cols-3">
            {hubCards.map((card) => {
              const Icon = card.icon;

              return (
                <Card
                  key={card.id}
                  className="overflow-hidden border-[var(--lux-row-border)] bg-[var(--lux-row-surface)]"
                >
                  <div className="h-1.5 w-full" style={{ background: card.toneBackground }} />
                  <CardHeader className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2">
                        <CardTitle className="text-xl text-[var(--lux-heading)]">
                          {card.title}
                        </CardTitle>
                        <p className="text-sm leading-7 text-[var(--lux-text-secondary)]">
                          {card.description}
                        </p>
                      </div>
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] border border-[var(--lux-control-border)] bg-[var(--lux-panel-surface)] text-[var(--lux-gold)]">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-[var(--lux-text-muted)]">
                      {card.id === "event-management"
                        ? "جاهز للمرحلة القادمة"
                        : "نقطة دخول مباشرة"}
                    </span>
                    <HubCardAction card={card} />
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <SectionCard id="event-workspace" className="space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-[var(--lux-heading)]">
                  إدارة الحفل
                </h2>
                <p className="max-w-3xl text-sm leading-7 text-[var(--lux-text-secondary)]">
                  تم تجهيز هذه المساحة لتكون hub تشغيليًا مدمجًا لإدارة الحفل من
                  داخل تفاصيل المصمم. في المرحلة التالية سيتم تضمين event
                  management workspace هنا مباشرة دون تغيير بنية التنقل.
                </p>
              </div>
              <ProtectedComponent
                permission="events.read"
                fallback={
                  <Button variant="outline" disabled>
                    إدارة الحفل
                  </Button>
                }
              >
                <Button variant="secondary" asChild>
                  <Link to="/events">استعراض الحفلات الحالية</Link>
                </Button>
              </ProtectedComponent>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {[
                "ربط الحفل بالتصميم والعمليات",
                "عرض الشركات والخدمات ضمن نفس workspace",
                "تجهيز مساحة تنفيذية للحفل في المرحلة القادمة",
              ].map((line) => (
                <div
                  key={line}
                  className="rounded-[20px] border border-dashed border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)] px-4 py-4 text-sm text-[var(--lux-text-secondary)]"
                >
                  {line}
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </PageContainer>
    </ProtectedComponent>
  );
}
