import type { PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

type PageContainerProps = PropsWithChildren<{
  className?: string;
}>;

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div
      className={cn("w-full space-y-3.5 px-0 py-0.5 md:space-y-4", className)}
    >
      {children}
    </div>
  );
}
