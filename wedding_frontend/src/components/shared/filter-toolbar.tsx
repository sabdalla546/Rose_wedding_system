import type { PropsWithChildren, ReactNode } from "react";
import { ListFilter } from "lucide-react";

import { SectionCard } from "@/components/shared/section-card";
import { cn } from "@/lib/utils";

type FilterToolbarProps = PropsWithChildren<{
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
  contentClassName?: string;
  icon?: ReactNode;
}>;

export function FilterToolbar({
  title,
  description,
  actions,
  className,
  contentClassName,
  icon,
  children,
}: FilterToolbarProps) {
  return (
    <SectionCard className={cn("space-y-4", className)}>
      {(title || description || actions) ? (
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-3">
            <div className="app-icon-chip h-10 w-10 rounded-[var(--radius-md)]">
              {icon ?? <ListFilter className="h-4 w-4" />}
            </div>
            <div className="space-y-1">
              {title ? <h3 className="section-title">{title}</h3> : null}
              {description ? (
                <p className="section-description">{description}</p>
              ) : null}
            </div>
          </div>
          {actions ? (
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          ) : null}
        </div>
      ) : null}

      <div className={cn("grid gap-3", contentClassName)}>{children}</div>
    </SectionCard>
  );
}
