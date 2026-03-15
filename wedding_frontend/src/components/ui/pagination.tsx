import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (size: number) => void;
  pageSizeOptions?: number[];
  className?: string;
};

const buildPageNumbers = (currentPage: number, totalPages: number) => {
  const pages = new Set<number>([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);

  return [...pages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);
};

export default function Pagination({
  currentPage,
  totalPages,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  pageSizeOptions = [10, 20, 50],
  className,
}: PaginationProps) {
  const { i18n, t } = useTranslation();
  const isRtl = i18n.resolvedLanguage === "ar";
  const pages = buildPageNumbers(currentPage, totalPages);

  if (totalPages <= 1 && !onItemsPerPageChange) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-4 md:flex-row md:items-center md:justify-between",
        className
      )}
      dir={isRtl ? "rtl" : "ltr"}
    >
      {onItemsPerPageChange ? (
        <div className="flex items-center gap-3 text-sm">
          <span style={{ color: "var(--lux-text-secondary)" }}>
            {t("common.itemsPerPage", { defaultValue: "Items per page" })}
          </span>
          <select
            className="h-10 rounded-[14px] border px-3 text-sm outline-none"
            style={{
              background: "var(--lux-control-surface)",
              borderColor: "var(--lux-control-border)",
              color: "var(--lux-text)",
            }}
            value={itemsPerPage}
            onChange={(event) => onItemsPerPageChange(Number(event.target.value))}
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div />
      )}

      <div className="flex items-center gap-2 self-end md:self-auto">
        <Button
          disabled={currentPage <= 1}
          size="icon"
          type="button"
          variant="secondary"
          onClick={() => onPageChange(currentPage - 1)}
        >
          {isRtl ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>

        {pages.map((page) => (
          <Button
            className="min-w-10"
            key={page}
            size="sm"
            type="button"
            variant={page === currentPage ? "default" : "secondary"}
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        ))}

        <Button
          disabled={currentPage >= totalPages}
          size="icon"
          type="button"
          variant="secondary"
          onClick={() => onPageChange(currentPage + 1)}
        >
          {isRtl ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
