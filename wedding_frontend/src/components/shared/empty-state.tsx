import type { LucideIcon } from 'lucide-react'

type EmptyStateProps = {
  title: string
  description: string
  icon: LucideIcon
}

export function EmptyState({ title, description, icon: Icon }: EmptyStateProps) {
  return (
    <div className="app-empty-state">
      <div className="app-icon-chip mb-4 h-12 w-12 rounded-full">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-lg font-semibold text-[var(--lux-text)]">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-[var(--lux-text-muted)]">{description}</p>
    </div>
  );
}
