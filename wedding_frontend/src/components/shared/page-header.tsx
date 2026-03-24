import type { ReactNode } from "react";

import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SearchConfig = {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  submitLabel?: string;
};

type PageHeaderProps = {
  icon?: ReactNode;
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  search?: SearchConfig;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({
  icon,
  eyebrow,
  title,
  description,
  meta,
  search,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <section className={cn("page-header p-4 md:p-5", className)}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          {icon ? (
            <div className="app-icon-chip h-11 w-11 shrink-0 rounded-[var(--radius-md)]">
              {icon}
            </div>
          ) : null}

          <div className="min-w-0 flex-1 space-y-1">
            {eyebrow ? <p className="page-eyebrow">{eyebrow}</p> : null}
            <h1 className="page-title break-words">
              {title}
            </h1>
            {description ? (
              <p className="page-subtitle">{description}</p>
            ) : null}
            {meta ? (
              <div className="text-sm text-[var(--lux-text-secondary)]">
                {meta}
              </div>
            ) : null}
          </div>
        </div>

        {search || actions ? (
          <div className="flex w-full flex-col gap-3 lg:w-auto lg:max-w-[36rem] lg:shrink-0 lg:items-end">
            <div className="flex w-full flex-col gap-2 md:flex-row md:items-center md:justify-end">
              {search ? (
                <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                  <SearchInput
                    className="w-full min-w-0"
                    placeholder={search.placeholder}
                    value={search.value}
                    onChange={search.onChange}
                  />
                  <Button
                    className="w-full shrink-0 sm:w-auto"
                    size="default"
                    onClick={search.onSubmit}
                    type="button"
                  >
                    {search.submitLabel ?? "Search"}
                  </Button>
                </div>
              ) : null}
              {actions ? (
                <div className="flex w-full flex-wrap items-stretch gap-2 sm:items-center md:w-auto md:flex-nowrap md:justify-end">
                  {actions}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
