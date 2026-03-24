import type { PropsWithChildren } from "react";

import { PageContainer } from "@/components/layout/page-container";
import { cn } from "@/lib/utils";

type DashboardPageLayoutProps = PropsWithChildren<{
  className?: string;
}>;

export function DashboardPageLayout({
  children,
  className,
}: DashboardPageLayoutProps) {
  return <PageContainer className={cn("space-y-6", className)}>{children}</PageContainer>;
}
