import type { PropsWithChildren, ReactNode } from "react";

import { SectionCard } from "@/components/shared/section-card";
import { cn } from "@/lib/utils";

type ChartCardProps = PropsWithChildren<{
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  className?: string;
  bodyClassName?: string;
}>;

export function ChartCard({
  title,
  description,
  actions,
  footer,
  className,
  bodyClassName,
  children,
}: ChartCardProps) {
  return (
    <SectionCard className={cn("dashboard-panel space-y-5", className)}>
      <div className="dashboard-panel__header flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1.5">
          <h2 className="section-title">{title}</h2>
          {description ? <p className="section-description">{description}</p> : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      <div className={bodyClassName}>{children}</div>
      {footer ? <div>{footer}</div> : null}
    </SectionCard>
  );
}
