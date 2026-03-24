import type { PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

type PageContainerProps = PropsWithChildren<{
  className?: string;
}>;

export function PageContainer({ children, className }: PageContainerProps) {
  return <div className={cn("app-page", className)}>{children}</div>;
}
