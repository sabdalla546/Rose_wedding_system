import type { ReactNode } from "react";

import { CrudFilters } from "@/components/shared/crud-layout";

type CalendarFilterBarProps = {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function CalendarFilterBar({
  title,
  description,
  actions,
  children,
  className,
}: CalendarFilterBarProps) {
  return (
    <CrudFilters
      title={title}
      description={description}
      actions={actions}
      contentClassName="grid-cols-1"
      className={className}
    >
      {children}
    </CrudFilters>
  );
}
