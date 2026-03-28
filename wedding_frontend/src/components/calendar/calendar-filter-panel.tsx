import type { ReactNode } from "react";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Filter,
  RotateCcw,
} from "lucide-react";

import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";

type CalendarFilterPanelProps = {
  title: ReactNode;
  description?: ReactNode;
  activeFiltersLabel: ReactNode;
  activeFiltersCount: number;
  clearLabel: ReactNode;
  onClear: () => void;
  showLabel: ReactNode;
  hideLabel: ReactNode;
  pills?: ReactNode;
  children: ReactNode;
};

export function CalendarFilterPanel({
  title,
  description,
  activeFiltersLabel,
  activeFiltersCount,
  clearLabel,
  onClear,
  showLabel,
  hideLabel,
  pills,
  children,
}: CalendarFilterPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <SectionCard className="overflow-hidden">
      <div className="space-y-3">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-[var(--lux-gold)]">
                <Filter className="h-3.5 w-3.5" />
                <p className="text-xs font-semibold uppercase tracking-[0.18em]">
                  {title}
                </p>
              </div>
              {description ? (
                <p className="max-w-2xl text-sm leading-6 text-[var(--lux-text-secondary)]">
                  {description}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2 md:justify-end">
              <span className="rounded-full border border-[var(--lux-row-border)] bg-[var(--lux-control-hover)] px-3 py-1.5 text-xs font-semibold text-[var(--lux-text)]">
                {activeFiltersLabel}
              </span>
              <Button
                size="sm"
                variant="secondary"
                className="h-10 rounded-xl px-3 text-sm"
                disabled={activeFiltersCount === 0}
                onClick={onClear}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {clearLabel}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-10 rounded-xl px-3 text-sm"
                onClick={() => setOpen((current) => !current)}
              >
                {open ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
                {open ? hideLabel : showLabel}
              </Button>
            </div>
          </div>
        </div>

        {pills ? (
          <div
            className="flex min-h-[28px] flex-wrap items-center gap-1.5 border-t pt-3"
            style={{ borderColor: "var(--lux-row-border)" }}
          >
            {pills}
          </div>
        ) : null}
      </div>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div
              className="mt-4 grid gap-3 border-t pt-4 xl:grid-cols-12"
              style={{ borderColor: "var(--lux-row-border)" }}
            >
              {children}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </SectionCard>
  );
}

export function CalendarFilterGroup({
  className = "",
  title,
  description,
  children,
}: {
  className?: string;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      className={`space-y-3 rounded-2xl border p-3 ${className}`}
      style={{
        borderColor: "var(--lux-row-border)",
        background: "var(--lux-control-hover)",
      }}
    >
      <div className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--lux-gold)]">
          {title}
        </p>
        {description ? (
          <p className="text-sm leading-6 text-[var(--lux-text-secondary)]">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export function CalendarFilterField({
  label,
  children,
}: {
  label: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="flex w-full flex-col gap-2">
      <span className="text-xs font-medium text-[var(--lux-text-muted)]">
        {label}
      </span>
      {children}
    </label>
  );
}

export function CalendarFilterPill({ label }: { label: ReactNode }) {
  return (
    <span className="rounded-full border border-[var(--lux-row-border)] bg-[var(--lux-panel)] px-3 py-1.5 text-xs text-[var(--lux-text-secondary)]">
      {label}
    </span>
  );
}
