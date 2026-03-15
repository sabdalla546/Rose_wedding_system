import { ListFilter } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { SectionCard } from '@/components/shared/section-card'
import { SearchInput } from '@/components/shared/search-input'

type FilterOption = {
  label: string
  value: string
}

type FilterField = {
  key: string
  label: string
  value: string
  options: FilterOption[]
}

type FilterToolbarProps = {
  searchValue: string
  onSearchChange: (value: string) => void
  fields: FilterField[]
  onFieldChange: (key: string, value: string) => void
}

export function FilterToolbar({
  searchValue,
  onSearchChange,
  fields,
  onFieldChange,
}: FilterToolbarProps) {
  const { t } = useTranslation()

  return (
    <SectionCard className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(212,175,55,0.08)] text-[var(--lux-gold)]">
          <ListFilter className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[var(--lux-text)]">{t('common.filters')}</h3>
          <p className="text-sm text-[var(--lux-text-muted)]">
            {t('calendar.filterToolbarDescription')}
          </p>
        </div>
      </div>
      <div className="grid gap-3 xl:grid-cols-[1.2fr_repeat(5,minmax(0,1fr))]">
        <SearchInput
          className="xl:col-span-1"
          placeholder={t('common.searchCustomerOrBooking')}
          value={searchValue}
          onChange={onSearchChange}
        />
        {fields.map((field) => (
          <label className="space-y-2" key={field.key}>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--lux-text-muted)]">
              {field.label}
            </span>
            <select
              className="h-11 w-full rounded-2xl border px-4 text-sm text-[var(--lux-text)] outline-none transition focus:border-[var(--lux-gold-border)]"
              style={{
                background: 'var(--lux-control-surface)',
                borderColor: 'var(--lux-control-border)',
              }}
              value={field.value}
              onChange={(event) => onFieldChange(field.key, event.target.value)}
            >
              {field.options.map((option) => (
                <option
                  className="text-[var(--lux-text)]"
                  key={option.value}
                  style={{ background: 'var(--lux-card)' }}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    </SectionCard>
  )
}
