import React from "react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils";

type SearchProps = {
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
};

type CompactHeaderProps = {
  icon?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  totalText?: React.ReactNode;
  search?: SearchProps;
  right?: React.ReactNode;
  className?: string;
};

const CompactHeader: React.FC<CompactHeaderProps> = ({
  icon,
  title,
  subtitle,
  totalText,
  search,
  right,
  className,
}) => {
  const { t } = useTranslation("common");
  return (
    <PageHeader
      icon={icon}
      title={title}
      description={subtitle}
      meta={totalText}
      search={
        search
          ? {
              ...search,
              submitLabel: t("search") || "Search",
            }
          : undefined
      }
      actions={right}
      className={cn(
        // Make the shared `PageHeader` visually more compact in dense pages.
        "compact-header-shell !rounded-[6px] !p-3 md:!p-4",
        // Normalize control heights inside the header (search, selects, buttons).
        "[&_input]:!h-10",
        "[&_button]:!h-10",
        "[&_button]:!items-center [&_button]:!justify-center",
        "[&_button]:!px-4 [&_button]:!text-[13px]",
        // Let the header search area breathe on wide screens.
        // PageHeader wraps (search/actions) in `lg:w-auto lg:max-w-[36rem] lg:shrink-0`.
        // We override it so the search row can grow and take more horizontal space.
        "[&_.lg\\:max-w-\\[36rem\\]]:lg:!max-w-none",
        "[&_.lg\\:w-auto]:lg:!w-full",
        "[&_.lg\\:shrink-0]:lg:!shrink",
        "[&_.lg\\:items-end]:lg:!items-stretch",
        // Keep a compact but modern radius language across header surfaces.
        "[&_.app-icon-chip]:h-9 [&_.app-icon-chip]:w-9 [&_.app-icon-chip]:!rounded-[4px]",
        "[&_.app-icon-chip]:!border [&_.app-icon-chip]:!border-[var(--color-control-border)]",
        "[&_.app-icon-chip]:!bg-[var(--color-control-hover)]",
        "[&_.app-icon-chip]:!text-[var(--color-primary)]",
        "[&_.app-icon-chip]:!shadow-none",
        // Search input (SearchInput -> Input)
        "[&_input]:!rounded-[6px]",
        // Buttons used inside headers (shadcn Button base uses rounded-2xl/rounded-xl)
        "[&_.rounded-2xl]:!rounded-[6px]",
        "[&_.rounded-xl]:!rounded-[6px]",
        "[&_.rounded-lg]:!rounded-[4px]",
        "[&_.page-eyebrow]:text-[0.68rem] [&_.page-eyebrow]:tracking-[0.22em]",
        "[&_.page-title]:text-[1rem] md:[&_.page-title]:text-[1.14rem]",
        "[&_.page-subtitle]:text-[0.78rem]",
        className,
      )}
    />
  );
};

export default CompactHeader;
