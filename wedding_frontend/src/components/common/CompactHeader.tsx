import React from "react";
import { useTranslation } from "react-i18next";

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
    <div
      className={["rounded-[24px] border p-3 sm:p-4", className].join(" ")}
      style={{
        background: "var(--lux-panel-surface)",
        borderColor: "var(--lux-panel-border)",
        boxShadow: "var(--lux-panel-shadow)",
      }}
    >
      {/* Top row: left + (desktop right) */}
      <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-4">
        {/* Left */}
        <div className="flex items-start gap-3 min-w-0">
          {icon ? (
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] border sm:h-10 sm:w-10"
              style={{
                background: "var(--lux-control-hover)",
                borderColor: "var(--lux-control-border)",
                color: "var(--lux-gold)",
              }}
            >
              {icon}
            </div>
          ) : null}

          <div className="min-w-0">
            <h1 className="break-words text-base font-bold text-[var(--lux-heading)] sm:text-lg">
              {title}
            </h1>

            {subtitle || totalText ? (
              <div className="mt-1 space-y-0.5">
                {subtitle ? (
                  <p className="break-words text-xs text-[var(--lux-text-secondary)]">
                    {subtitle}
                  </p>
                ) : null}

                {totalText ? (
                  <p className="break-words text-xs text-[var(--lux-text-secondary)]">
                    {totalText}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        {/* Right (desktop) */}
        {search || right ? (
          <div className="hidden md:flex items-center justify-end gap-2 flex-wrap">
            {search ? (
              <div className="flex items-center gap-2">
                <div className="relative w-full sm:w-56 lg:w-72">
                  <input
                    className="
                      w-full px-3 py-2 pl-9 text-xs rounded-lg 
                      border placeholder:text-[var(--lux-text-muted)]
                      focus:outline-none focus:ring-1 focus:ring-[var(--lux-gold-glow)]
                    "
                    style={{
                      background: "var(--lux-control-surface)",
                      borderColor: "var(--lux-control-border)",
                      color: "var(--lux-text)",
                    }}
                    placeholder={search.placeholder}
                    value={search.value}
                    onChange={(e) => search.onChange(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && search.onSubmit()}
                  />
                  <svg
                    className="
                      h-4 w-4 text-[var(--lux-text-muted)]
                      absolute left-3 top-1/2 -translate-y-1/2
                    "
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>

                <button
                  type="button"
                  onClick={search.onSubmit}
                  className="whitespace-nowrap rounded-md px-3 py-2 text-xs text-[var(--lux-primary-text)]"
                  style={{ background: "var(--lux-primary-surface)" }}
                >
                  {t("search") || "Search"}
                </button>
              </div>
            ) : null}

            {right ? (
              <div className="flex items-center gap-2 flex-wrap">{right}</div>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Mobile row: search + actions */}
      {search || right ? (
        <div className="mt-3 md:hidden space-y-2">
          {search ? (
            <div className="flex items-center gap-2">
              <div className="relative flex-1 min-w-0">
                <input
                  className="
                    w-full px-3 py-2 pl-9 text-xs rounded-lg 
                    border placeholder:text-[var(--lux-text-muted)]
                    focus:outline-none focus:ring-1 focus:ring-[var(--lux-gold-glow)]
                  "
                  style={{
                    background: "var(--lux-control-surface)",
                    borderColor: "var(--lux-control-border)",
                    color: "var(--lux-text)",
                  }}
                  placeholder={search.placeholder}
                  value={search.value}
                  onChange={(e) => search.onChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && search.onSubmit()}
                />
                <svg
                  className="
                    h-4 w-4 text-[var(--lux-text-muted)]
                    absolute left-3 top-1/2 -translate-y-1/2
                  "
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>

              <button
                type="button"
                onClick={search.onSubmit}
                className="whitespace-nowrap rounded-md px-3 py-2 text-xs text-[var(--lux-primary-text)]"
                style={{ background: "var(--lux-primary-surface)" }}
              >
                {t("search") || "Search"}
              </button>
            </div>
          ) : null}

          {right ? (
            <div className="flex items-center gap-2 flex-wrap">{right}</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default CompactHeader;
