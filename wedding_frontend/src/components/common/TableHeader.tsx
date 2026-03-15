import React from "react";
import { useTranslation } from "react-i18next";

interface TableHeaderProps {
  title: string;
  totalItems?: number;
  currentCount?: number;
  entityName?: string;
  itemsPerPage: number;
  setItemsPerPage: (size: number) => void;
  setCurrentPage: (page: number) => void;
  showMeta?: boolean;
}

const TableHeader: React.FC<TableHeaderProps> = ({
  title,
  totalItems,
  currentCount,
  entityName,
  itemsPerPage,
  setItemsPerPage,
  setCurrentPage,
  showMeta = true,
}) => {
  const { t } = useTranslation("common");

  return (
    <div
      className="border-b px-6 py-4"
      style={{
        background:
          "linear-gradient(180deg, color-mix(in srgb, var(--lux-control-hover) 65%, transparent), transparent)",
        borderColor: "var(--lux-row-border)",
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[var(--lux-heading)]">
            {title}
          </h3>
          {showMeta &&
            totalItems !== undefined &&
            currentCount !== undefined && (
              <p className="mt-1 text-sm text-[var(--lux-text-secondary)]">
                {t("users.showing")} {currentCount} {t("users.of")} {totalItems}{" "}
                {entityName}
              </p>
            )}
        </div>

        {/* Items per page selector */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="itemsPerPageTop"
            className="text-sm text-[var(--lux-text-secondary)]"
          >
            {t("users.items_per_page")}:
          </label>
          <select
            id="itemsPerPageTop"
            value={itemsPerPage}
            onChange={(e) => {
              const newSize = Number(e.target.value);
              setItemsPerPage(newSize);
              setCurrentPage(1);
            }}
            className="rounded-[14px] border px-3 py-1.5 text-sm outline-none transition-all focus:ring-2 focus:ring-[var(--lux-gold-glow)]"
            style={{
              background: "var(--lux-control-surface)",
              borderColor: "var(--lux-control-border)",
              color: "var(--lux-text)",
            }}
          >
            {[1, 5, 10, 20, 50, 100, 200, 300].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default TableHeader;
