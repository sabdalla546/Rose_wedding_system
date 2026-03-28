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
  actions?: React.ReactNode;
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
  actions,
}) => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";

  return (
    <div
      className="table-shell__header border-b px-6 py-4"
      style={{
        background: "var(--lux-panel-surface)",
        borderColor: "var(--lux-panel-border)",
      }}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-[var(--lux-heading)]">
            {title}
          </h3>
          {showMeta &&
            totalItems !== undefined &&
            currentCount !== undefined && (
              <p className="mt-1 text-sm text-[var(--lux-text-secondary)]">
                {t("common.showing", {
                  defaultValue: isArabic ? "عرض" : "Showing",
                })}{" "}
                {currentCount}{" "}
                {t("common.of", {
                  defaultValue: isArabic ? "من" : "of",
                })}{" "}
                {totalItems} {entityName}
              </p>
            )}
        </div>

        <div className="flex flex-col gap-3 md:items-end">
          {actions ? (
            <div className="flex flex-wrap items-center gap-2 md:justify-end">
              {actions}
            </div>
          ) : null}

          <div className="flex items-center gap-2">
            <label
              htmlFor="itemsPerPageTop"
              className="text-sm text-[var(--lux-text-secondary)]"
            >
              {t("common.itemsPerPage", {
                defaultValue: isArabic ? "العناصر لكل صفحة" : "Items per page",
              })}
              :
            </label>
            <select
              id="itemsPerPageTop"
              value={itemsPerPage}
              onChange={(e) => {
                const newSize = Number(e.target.value);
                setItemsPerPage(newSize);
                setCurrentPage(1);
              }}
              className="app-native-select h-10 w-[88px] rounded-[14px] px-3 py-1.5 text-sm"
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
    </div>
  );
};

export default TableHeader;
