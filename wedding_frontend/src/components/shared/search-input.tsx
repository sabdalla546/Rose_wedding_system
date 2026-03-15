import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type SearchInputProps = {
  placeholder?: string
  className?: string
  value?: string
  onChange?: (value: string) => void
}

export function SearchInput({
  placeholder,
  className,
  value,
  onChange,
}: SearchInputProps) {
  const { t } = useTranslation()

  return (
    <div className={cn('relative w-full', className)}>
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--lux-text-muted)]" />
      <Input
        className="pl-11"
        placeholder={placeholder ?? t('common.searchAnything')}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
      />
    </div>
  )
}
