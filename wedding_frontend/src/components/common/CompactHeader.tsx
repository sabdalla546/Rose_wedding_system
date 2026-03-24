import React from "react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/shared/page-header";

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
  className = "",
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
      className={className}
    />
  );
};

export default CompactHeader;
