import type { PropsWithChildren, ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

export type EventPanelViewMode = "table" | "grid";

type EventMetaChipProps = {
  label?: ReactNode;
  value: ReactNode;
  className?: string;
};

type EventMetricTileProps = {
  label: ReactNode;
  value: ReactNode;
  helper?: ReactNode;
  className?: string;
};

type EventInfoBlockProps = {
  label: ReactNode;
  value?: ReactNode;
  helper?: ReactNode;
  className?: string;
  compact?: boolean;
};

type EventEmptyStateProps = {
  title: ReactNode;
  description: ReactNode;
  action?: ReactNode;
  className?: string;
};

type EventViewToggleProps = {
  value: EventPanelViewMode;
  onChange: (nextValue: EventPanelViewMode) => void;
  tableLabel: ReactNode;
  gridLabel: ReactNode;
};

export function EventMetaChip({
  label,
  value,
  className,
}: EventMetaChipProps) {
  const { i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";

  return (
    <div
      className={cn(
        "inline-flex min-w-0 max-w-full items-center gap-2 rounded-full border border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)] px-3 py-1.5 text-xs text-[var(--lux-text-secondary)]",
        isRtl ? "flex-row-reverse text-right" : "text-left",
        className,
      )}
    >
      {label ? (
        <span
          className={cn(
            "text-[10px] font-semibold text-[var(--lux-text-muted)]",
            isRtl ? "tracking-normal" : "uppercase tracking-[0.14em]",
          )}
        >
          {label}
        </span>
      ) : null}
      <span className="max-w-full break-words font-medium text-[var(--lux-text)]">
        {value}
      </span>
    </div>
  );
}

export function EventMetricTile({
  label,
  value,
  helper,
  className,
}: EventMetricTileProps) {
  const { i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";

  return (
    <div
      className={cn(
        "flex h-full min-h-[132px] flex-col justify-between rounded-[22px] border border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)] px-4 py-3.5",
        className,
      )}
    >
      <p
        className={cn(
          "text-[11px] font-semibold text-[var(--lux-text-muted)]",
          isRtl ? "tracking-normal text-right" : "uppercase tracking-[0.16em] text-left",
        )}
      >
        {label}
      </p>
      <div className="mt-3 space-y-1">
        <p
          className={cn(
            "text-lg font-semibold leading-7 text-[var(--lux-heading)] sm:text-xl",
            isRtl ? "text-right" : "text-left",
          )}
        >
          {value}
        </p>
        {helper ? (
          <p
            className={cn(
              "text-xs leading-5 text-[var(--lux-text-secondary)]",
              isRtl ? "text-right" : "text-left",
            )}
          >
            {helper}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function EventInfoBlock({
  label,
  value,
  helper,
  className,
  compact = false,
}: EventInfoBlockProps) {
  const { i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";

  return (
    <div
      className={cn(
        "rounded-[20px] border border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)] px-4 py-3",
        compact ? "px-3.5 py-3" : "",
        className,
      )}
    >
      <p
        className={cn(
          "text-[11px] font-semibold text-[var(--lux-text-muted)]",
          isRtl ? "tracking-normal text-right" : "uppercase tracking-[0.16em] text-left",
        )}
      >
        {label}
      </p>
      <div
        className={cn(
          "mt-1.5 break-words text-sm font-medium leading-6 text-[var(--lux-text)]",
          isRtl ? "text-right" : "text-left",
        )}
      >
        {value || "-"}
      </div>
      {helper ? (
        <p
          className={cn(
            "mt-1 text-xs leading-5 text-[var(--lux-text-secondary)]",
            isRtl ? "text-right" : "text-left",
          )}
        >
          {helper}
        </p>
      ) : null}
    </div>
  );
}

export function EventPanelCard({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn(
        "rounded-[24px] border border-[var(--lux-row-border)] bg-[var(--lux-row-surface)] p-4 sm:p-5 lg:p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function EventEmptyState({
  title,
  description,
  action,
  className,
}: EventEmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-[24px] border border-dashed border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)] px-5 py-9 text-center",
        className,
      )}
    >
      <div className="mx-auto max-w-xl space-y-2">
        <p className="text-base font-semibold text-[var(--lux-heading)]">{title}</p>
        <p className="text-sm leading-6 text-[var(--lux-text-secondary)]">
          {description}
        </p>
      </div>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function EventViewToggle({
  value,
  onChange,
  tableLabel,
  gridLabel,
}: EventViewToggleProps) {
  return (
    <div
      className="inline-flex rounded-2xl border p-1"
      style={{
        background: "var(--lux-control-surface)",
        borderColor: "var(--lux-control-border)",
      }}
    >
      {(["table", "grid"] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          className="rounded-xl px-4 py-2 text-sm font-semibold transition"
          style={
            value === mode
              ? {
                  background: "var(--lux-primary-surface)",
                  color: "var(--lux-primary-text)",
                }
              : {
                  color: "var(--lux-text-secondary)",
                }
          }
          onClick={() => onChange(mode)}
        >
          {mode === "table" ? tableLabel : gridLabel}
        </button>
      ))}
    </div>
  );
}
