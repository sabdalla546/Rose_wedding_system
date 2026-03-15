import { useTranslation } from 'react-i18next'

import type { CalendarView } from '@/types/calendar'
import { cn } from '@/lib/utils'

const views: CalendarView[] = ['month', 'week', 'day', 'agenda']

type ViewSwitcherProps = {
  value: CalendarView
  onChange: (view: CalendarView) => void
}

export function ViewSwitcher({ value, onChange }: ViewSwitcherProps) {
  const { t } = useTranslation()

  return (
    <div
      className="inline-flex rounded-2xl border p-1"
      style={{
        background: 'var(--lux-control-surface)',
        borderColor: 'var(--lux-control-border)',
      }}
    >
      {views.map((view) => (
        <button
          className={cn(
            'rounded-xl px-4 py-2 text-sm font-semibold capitalize text-[var(--lux-text-secondary)] transition',
            value === view && 'text-[var(--lux-text)]',
          )}
          style={value === view ? { background: 'var(--lux-control-hover)' } : undefined}
          key={view}
          type="button"
          onClick={() => onChange(view)}
        >
          {t(`common.${view}`)}
        </button>
      ))}
    </div>
  )
}
