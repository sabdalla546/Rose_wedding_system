import type { ComponentProps, PropsWithChildren, ReactNode } from "react";
import { Filter } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { FormSection } from "@/components/shared/form-section";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { cn } from "@/lib/utils";

type CrudPageLayoutProps = PropsWithChildren<{
  className?: string;
}>;

type CrudPageHeaderProps = {
  backAction?: ReactNode;
  icon?: ReactNode;
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  search?: ComponentProps<typeof PageHeader>["search"];
  actions?: ReactNode;
  className?: string;
};

type CrudToolbarProps = PropsWithChildren<{
  title?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
  contentClassName?: string;
}>;

type CrudFormLayoutProps = PropsWithChildren<{
  backAction?: ReactNode;
  icon?: ReactNode;
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  maxWidthClassName?: string;
  className?: string;
}>;

type CrudSectionProps = PropsWithChildren<{
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
  contentClassName?: string;
}>;

type CrudFilterFieldProps = PropsWithChildren<{
  label: ReactNode;
  className?: string;
}>;

type CrudFilterPillProps = {
  label: ReactNode;
  className?: string;
};

export function CrudPageLayout({
  children,
  className,
}: CrudPageLayoutProps) {
  return <PageContainer className={className}>{children}</PageContainer>;
}

export function CrudPageHeader({
  backAction,
  className,
  ...props
}: CrudPageHeaderProps) {
  return (
    <div className={cn("crud-page-main", className)}>
      {backAction ? <div>{backAction}</div> : null}
      <PageHeader {...props} />
    </div>
  );
}

export function CrudToolbar({
  title,
  description,
  icon,
  actions,
  className,
  contentClassName,
  children,
}: CrudToolbarProps) {
  return (
    <SectionCard className={cn("crud-toolbar", className)}>
      {(title || description || actions) ? (
        <div className="crud-toolbar-header">
          <div className="flex items-start gap-3">
            {icon ? (
              <div className="app-icon-chip h-10 w-10 rounded-[var(--radius-md)]">
                {icon}
              </div>
            ) : null}
            <div className="space-y-1">
              {title ? <h2 className="section-title">{title}</h2> : null}
              {description ? (
                <p className="section-description">{description}</p>
              ) : null}
            </div>
          </div>

          {actions ? <div className="crud-toolbar-actions">{actions}</div> : null}
        </div>
      ) : null}

      <div className={cn("crud-filters-grid", contentClassName)}>{children}</div>
    </SectionCard>
  );
}

export function CrudFilters(props: Omit<CrudToolbarProps, "icon">) {
  return <CrudToolbar icon={<Filter className="h-4 w-4" />} {...props} />;
}

export function CrudContent({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return <SectionCard className={cn("crud-content", className)}>{children}</SectionCard>;
}

export function CrudFormLayout({
  backAction,
  icon,
  eyebrow,
  title,
  description,
  meta,
  maxWidthClassName = "max-w-5xl",
  className,
  children,
}: CrudFormLayoutProps) {
  return (
    <div className={cn("crud-page-main", maxWidthClassName, className)}>
      {backAction ? <div>{backAction}</div> : null}
      <PageHeader
        icon={icon}
        eyebrow={eyebrow}
        title={title}
        description={description}
        meta={meta}
      />
      <CrudContent>{children}</CrudContent>
    </div>
  );
}

export function CrudFormSection(props: CrudSectionProps) {
  return <FormSection {...props} />;
}

export function CrudDetailsSection({
  title,
  description,
  actions,
  className,
  contentClassName,
  children,
}: CrudSectionProps) {
  return (
    <SectionCard className={cn("space-y-4", className)}>
      <div className="section-divider flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1.5">
          <h2 className="section-title">{title}</h2>
          {description ? <p className="section-description">{description}</p> : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      <div className={contentClassName}>{children}</div>
    </SectionCard>
  );
}

export function CrudActionsBar({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return <div className={cn("crud-actions-bar", className)}>{children}</div>;
}

export function CrudFilterField({
  label,
  className,
  children,
}: CrudFilterFieldProps) {
  return (
    <label className={cn("crud-filter-field", className)}>
      <span className="crud-filter-label">{label}</span>
      {children}
    </label>
  );
}

export function CrudFilterPill({
  label,
  className,
}: CrudFilterPillProps) {
  return <span className={cn("crud-filter-pill", className)}>{label}</span>;
}
