import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";

import { ChartCard } from "@/components/dashboard/chart-card";
import { cn } from "@/lib/utils";

type QuickActionItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  tone?: "primary" | "default";
  onClick?: () => void;
};

type QuickActionsCardProps = {
  title: string;
  description?: string;
  actions: QuickActionItem[];
};

export function QuickActionsCard({
  title,
  description,
  actions,
}: QuickActionsCardProps) {
  return (
    <ChartCard title={title} description={description}>
      <div className="space-y-3">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <button
              key={action.id}
              type="button"
              onClick={action.onClick}
              className={cn(
                "dashboard-quick-action flex w-full items-center justify-between rounded-[18px] border px-4 py-3 text-left transition",
                action.tone === "primary"
                  ? "text-[var(--lux-primary-text)]"
                  : "text-[var(--lux-text)] hover:text-[var(--lux-heading)]",
              )}
              style={
                action.tone === "primary"
                  ? {
                      background: "var(--lux-primary-surface)",
                      borderColor: "var(--lux-gold-border)",
                    }
                  : {
                      background: "var(--lux-row-surface)",
                      borderColor: "var(--lux-row-border)",
                    }
              }
            >
              <span className="flex items-center gap-3">
                <span className="app-icon-chip h-10 w-10 rounded-xl">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-[15px] font-medium">{action.label}</span>
              </span>
              <ChevronRight className="h-4 w-4" />
            </button>
          );
        })}
      </div>
    </ChartCard>
  );
}
