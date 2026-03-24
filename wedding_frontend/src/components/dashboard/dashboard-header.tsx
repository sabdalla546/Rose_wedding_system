import type { ReactNode } from "react";

import { PageHeader } from "@/components/shared/page-header";

type DashboardHeaderProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  meta?: ReactNode;
};

export function DashboardHeader({
  eyebrow,
  title,
  description,
  actions,
  meta,
}: DashboardHeaderProps) {
  return (
    <PageHeader
      eyebrow={eyebrow}
      title={title}
      description={description}
      actions={actions}
      meta={meta}
    />
  );
}
