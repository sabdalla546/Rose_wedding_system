import type { LucideIcon } from 'lucide-react'

type EmptyStateProps = {
  title: string
  description: string
  icon: LucideIcon
}

export function EmptyState({ title, description, icon: Icon }: EmptyStateProps) {
  return (
    <div
      className="flex min-h-56 flex-col items-center justify-center rounded-[24px] border border-dashed px-6 text-center"
      style={{
        background: 'var(--lux-row-surface)',
        borderColor: 'var(--lux-row-border)',
      }}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(212,175,55,0.08)] text-[var(--lux-gold)]">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-lg font-semibold text-[var(--lux-text)]">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-[var(--lux-text-muted)]">{description}</p>
    </div>
  )
}
