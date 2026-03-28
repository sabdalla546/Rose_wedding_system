import type { ReactNode } from "react";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  ListFilter,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";

import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type WorkspaceFilterBarProps = {
  title: ReactNode;
  description?: ReactNode;
  activeFiltersLabel: ReactNode;
  activeFiltersCount: number;
  clearLabel: ReactNode;
  onClear: () => void;
  showFiltersLabel?: ReactNode;
  hideFiltersLabel?: ReactNode;
  showAdvancedLabel?: ReactNode;
  hideAdvancedLabel?: ReactNode;
  quickFilters: ReactNode;
  advancedFilters?: ReactNode;
  pills?: ReactNode;
  className?: string;
  defaultOpen?: boolean;
  defaultExpanded?: boolean;
};

export function WorkspaceFilterBar({
  title,
  description,
  activeFiltersLabel,
  activeFiltersCount,
  clearLabel,
  onClear,
  showFiltersLabel,
  hideFiltersLabel,
  showAdvancedLabel,
  hideAdvancedLabel,
  quickFilters,
  advancedFilters,
  pills,
  className,
  defaultOpen = false,
  defaultExpanded = true,
}: WorkspaceFilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [advancedOpen, setAdvancedOpen] = useState(defaultOpen);

  return (
    <SectionCard
      className={cn(
        "workspace-filter space-y-4",
        !isExpanded && "workspace-filter--collapsed space-y-0",
        className,
      )}
      elevated
    >
      <div className="workspace-filter__header">
        <div className="space-y-1.5">
          <div className="workspace-filter__title-row">
            <div className="workspace-filter__title-icon">
              <ListFilter className="h-4 w-4" />
            </div>
            <p className="workspace-filter__eyebrow">{title}</p>
          </div>
          {description ? (
            <p className="workspace-filter__description">{description}</p>
          ) : null}
        </div>

        <div className="workspace-filter__actions">
          <span className="workspace-filter__count">{activeFiltersLabel}</span>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={onClear}
            disabled={activeFiltersCount === 0}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {clearLabel}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setIsExpanded((current) => !current)}
          >
            {isExpanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
            {isExpanded ? hideFiltersLabel : showFiltersLabel}
          </Button>
          {advancedFilters ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setAdvancedOpen((current) => !current)}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {advancedOpen ? hideAdvancedLabel : showAdvancedLabel}
            </Button>
          ) : null}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-4">
              <div className="workspace-filter__quick-grid">{quickFilters}</div>

              {pills ? <div className="workspace-filter__pills">{pills}</div> : null}

              {advancedFilters && advancedOpen ? (
                <div className="workspace-filter__advanced-grid">
                  {advancedFilters}
                </div>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

    </SectionCard>
  );
}

export function WorkspaceFilterGroup({
  title,
  description,
  className,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("workspace-filter-group", className)}>
      <div className="space-y-1">
        <p className="workspace-filter-group__title">{title}</p>
        {description ? (
          <p className="workspace-filter-group__description">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export function WorkspaceFilterField({
  label,
  className,
  children,
}: {
  label: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={cn("workspace-filter-field", className)}>
      <span className="workspace-filter-field__label">{label}</span>
      {children}
    </label>
  );
}

export function WorkspaceFilterPill({ label }: { label: ReactNode }) {
  return <span className="workspace-filter-pill">{label}</span>;
}
