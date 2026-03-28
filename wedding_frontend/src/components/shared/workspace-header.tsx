import type { ReactNode } from "react";

import { SectionCard } from "@/components/shared/section-card";
import { cn } from "@/lib/utils";

type WorkspaceHeaderStat = {
  label: ReactNode;
  value: ReactNode;
};

type WorkspaceHeaderProps = {
  icon?: ReactNode;
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  stats?: WorkspaceHeaderStat[];
  controls?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function WorkspaceHeader({
  icon,
  eyebrow,
  title,
  description,
  stats,
  controls,
  actions,
  className,
}: WorkspaceHeaderProps) {
  return (
    <SectionCard className={cn("workspace-hero overflow-hidden p-0", className)} elevated>
      <div className="workspace-hero__inner">
        <div className="workspace-hero__top">
          <div className="workspace-hero__content">
            {icon ? <div className="workspace-hero__icon">{icon}</div> : null}
            <div className="min-w-0 space-y-2">
              {eyebrow ? <p className="workspace-hero__eyebrow">{eyebrow}</p> : null}
              <div className="space-y-2">
                <h1 className="workspace-hero__title">{title}</h1>
                {description ? (
                  <p className="workspace-hero__description">{description}</p>
                ) : null}
              </div>
            </div>
          </div>

          {controls || actions ? (
            <div className="workspace-hero__controls">
              {controls}
              {actions ? (
                <div className="flex w-full flex-wrap items-center justify-end gap-2">
                  {actions}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {stats?.length ? (
          <div className="workspace-hero__stats">
            {stats.map((stat, index) => (
              <div key={index} className="workspace-hero__stat">
                <span className="workspace-hero__stat-value">{stat.value}</span>
                <span className="workspace-hero__stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </SectionCard>
  );
}
