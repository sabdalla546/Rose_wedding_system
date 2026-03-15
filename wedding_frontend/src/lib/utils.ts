import { clsx, type ClassValue } from 'clsx'
import { format } from 'date-fns'
import { twMerge } from 'tailwind-merge'

import { getDateLocale } from '@/lib/i18n/date'
import { i18n } from '@/lib/i18n'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat(i18n.resolvedLanguage === 'ar' ? 'ar-KW' : 'en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat(i18n.resolvedLanguage === 'ar' ? 'ar-KW' : 'en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

export function formatDateLabel(value: Date, pattern = 'dd MMM yyyy') {
  return format(value, pattern, { locale: getDateLocale() })
}

export function formatTimeLabel(value: Date) {
  return format(value, 'hh:mm a', { locale: getDateLocale() })
}

export function formatLocalized(value: Date, pattern: string) {
  return format(value, pattern, { locale: getDateLocale() })
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}
