import type { PropsWithChildren, ReactNode } from "react";

import { cn } from "@/lib/utils";

type FormSectionProps = PropsWithChildren<{
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
  contentClassName?: string;
}>;

export function FormSection({
  title,
  description,
  actions,
  className,
  contentClassName,
  children,
}: FormSectionProps) {
  return (
    <section className={cn("form-section", className)}>
      <div className="section-divider flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1.5">
          <h2 className="section-title">{title}</h2>
          {description ? <p className="section-description">{description}</p> : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      <div className={cn("space-y-4", contentClassName)}>{children}</div>
    </section>
  );
}
