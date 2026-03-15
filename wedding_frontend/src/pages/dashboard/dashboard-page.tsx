import { addMonths, isSameDay, subMonths } from 'date-fns'
import {
  ChevronLeft,
  ChevronRight,
  CircleChevronRight,
  Download,
  Package2,
  Plus,
  Search,
} from 'lucide-react'
import { type ComponentType, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { PageContainer } from '@/components/layout/page-container'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  bookingRingSummary,
  dashboardMetrics,
  inventoryAllocations,
  lowStockItems,
  paymentRows,
  quickActions,
  recentBookings,
  reportSeries,
  todaysSchedule,
} from '@/data/mock/dashboard'
import {
  buildMonthGrid,
  isCalendarDayMuted,
} from '@/features/calendar/calendar-helpers'
import { cn, formatCurrency, formatDateLabel, formatLocalized, getInitials } from '@/lib/utils'
import type { ScheduleItem } from '@/types/dashboard'
import type { StatusType } from '@/types/shared'

const dashboardMonth = new Date(2024, 6, 1)

const panelClass = 'lux-dashboard-panel rounded-[24px]'

const avatarTones = [
  'from-[#805f41] to-[#d7b386]',
  'from-[#7f4f4e] to-[#d99a83]',
  'from-[#68748c] to-[#c0d4ea]',
  'from-[#66755c] to-[#c5d9ab]',
]

const decorativeGlow = [
  'from-[#6f4b43]/55 via-[#3a2a2a]/18 to-transparent',
  'from-[#2f3350]/30 via-[#1e1f2d]/10 to-transparent',
  'from-[#4c3a25]/25 via-[#2a241e]/8 to-transparent',
  'from-[#6d4e28]/35 via-[#2f2419]/10 to-transparent',
]

const statusTone: Record<StatusType, string> = {
  Inquiry: 'bg-[#342c20] text-[#f0d9a5]',
  Tentative: 'bg-[#4a3822] text-[#efcf8b]',
  Confirmed: 'bg-[#5c4425] text-[#f2d49b]',
  Completed: 'bg-[#32302b] text-[#f2dfc1]',
  Cancelled: 'bg-[#4a2c2c] text-[#e9b7b7]',
  Draft: 'bg-[#2b2b2d] text-[#d8d8dc]',
  Sent: 'bg-[#2e3542] text-[#bccdf4]',
  Approved: 'bg-[#3d3644] text-[#d5c2f1]',
  Pending: 'bg-[#4a3822] text-[#efcf8b]',
  Overdue: 'bg-[#522f2f] text-[#f3b1b1]',
}

export function DashboardPage() {
  const { t } = useTranslation()
  const [currentMonth, setCurrentMonth] = useState(dashboardMonth)
  const weeks = useMemo(() => buildMonthGrid(currentMonth), [currentMonth])

  return (
    <PageContainer className="relative">
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[30px]">
        <div className="absolute inset-x-0 top-0 h-[300px] bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.1),transparent_28%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.035),transparent_24%)]" />
        <div className="absolute bottom-6 left-0 h-44 w-72 bg-[radial-gradient(circle_at_left_bottom,rgba(212,175,55,0.09),transparent_55%)]" />
        <div className="absolute bottom-0 right-14 h-40 w-56 bg-[radial-gradient(circle_at_bottom_right,rgba(212,175,55,0.08),transparent_60%)]" />
      </div>

      <section className="relative grid gap-4 xl:grid-cols-[minmax(0,1fr)_262px]">
        <div className="space-y-4">
          <div className="px-1 pt-1">
            <h1 className="text-[32px] font-medium tracking-tight text-[var(--lux-heading)] md:text-[34px]">
              {t('dashboard.welcome')}
            </h1>
            <p className="mt-2 text-[17px] text-[var(--lux-text-secondary)]">
              {t('dashboard.subtitle')}
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-4">
            {dashboardMetrics.map((metric, index) => (
              <MetricCard
                glowClass={decorativeGlow[index] ?? decorativeGlow[0]}
                index={index}
                key={metric.id}
                label={t(metric.labelKey)}
                value={metric.value}
                icon={metric.icon}
              />
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.28fr)_336px]">
            <TodayScheduleCard />
            <QuickActionsCard />
          </div>

          <RecentBookingsCard />

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_228px_308px]">
            <InventoryCard />
            <BookingsCard />
            <div className="space-y-4">
              <PaymentsCard />
              <ReportsCard />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <DashboardCalendarCard
            currentMonth={currentMonth}
            weeks={weeks}
            onNext={() => setCurrentMonth((value) => addMonths(value, 1))}
            onPrevious={() => setCurrentMonth((value) => subMonths(value, 1))}
          />
          <LowStockCard />
        </div>
      </section>
    </PageContainer>
  )
}

function MetricCard({
  label,
  value,
  icon: Icon,
  glowClass,
  index,
}: {
  label: string
  value: string
  icon: ComponentType<{ className?: string }>
  glowClass: string
  index: number
}) {
  return (
    <div className={cn(panelClass, 'relative min-h-[122px] overflow-hidden p-5')}>
      <div className={cn('absolute inset-0 bg-gradient-to-br opacity-90', glowClass)} />
      <div className="absolute inset-x-0 bottom-0 h-12 bg-[linear-gradient(180deg,transparent,rgba(255,177,116,0.06))]" />
      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[rgba(212,175,55,0.14)] bg-[rgba(212,175,55,0.05)] text-[#e7ba72]">
            <Icon className="h-4 w-4" />
          </div>
          {index >= 2 ? (
            <div className="rounded-[18px] bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.22),transparent_64%)] p-3 text-[#d7ae63] opacity-90">
              <Icon className="h-8 w-8" />
            </div>
          ) : null}
        </div>
        <div>
          <p className="text-[15px] text-[var(--lux-soft-text)]">{label}</p>
          <p className="mt-2 text-[24px] font-semibold text-[var(--lux-strong-text)]">{value}</p>
        </div>
      </div>
    </div>
  )
}

function TodayScheduleCard() {
  const { t } = useTranslation()

  return (
    <section className={cn(panelClass, 'min-h-[248px] p-4')}>
      <div className="mb-4 flex items-center justify-between gap-3 px-1">
        <h2 className="text-[20px] font-medium text-[var(--lux-heading)]">{t('dashboard.todaySchedule')}</h2>
        <button
          className="inline-flex items-center gap-2 rounded-[14px] border px-4 py-2 text-sm transition"
          style={{
            background: 'var(--lux-control-surface)',
            borderColor: 'var(--lux-control-border)',
            color: 'var(--lux-soft-text)',
          }}
        >
          {t('dashboard.viewCalendar')}
          <CircleChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-3">
        {todaysSchedule.map((item, index) => (
          <ScheduleRow index={index} item={item} key={item.id} />
        ))}
      </div>
    </section>
  )
}

function ScheduleRow({ item, index }: { item: ScheduleItem; index: number }) {
  return (
    <div
      className="flex items-center gap-4 rounded-[18px] border px-4 py-3"
      style={{
        background: 'var(--lux-row-surface)',
        borderColor: 'var(--lux-row-border)',
      }}
    >
      <div className="h-2.5 w-2.5 rounded-full bg-[#e8c48a]" />
      <div className="min-w-[74px] text-[15px] text-[var(--lux-soft-text)]">{item.time}</div>
      <Avatar className="h-12 w-12 border-[rgba(212,175,55,0.12)]">
        <AvatarFallback
          className={cn(
            'bg-gradient-to-br text-sm font-semibold text-white',
            avatarTones[index % avatarTones.length],
          )}
        >
          {getInitials(item.clientName)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[16px] font-medium text-[var(--lux-strong-text)]">{item.clientName}</p>
        <p className="truncate text-sm text-[var(--lux-text-muted)]">{item.venue}</p>
      </div>
      <div
        className="flex h-10 min-w-10 items-center justify-center rounded-full border px-3 text-sm font-semibold shadow-[0_8px_18px_rgba(119,77,31,0.2)]"
        style={{
          background: 'var(--lux-badge-surface)',
          borderColor: 'var(--lux-gold-border)',
          color: 'var(--lux-badge-text)',
        }}
      >
        {item.counter}
      </div>
    </div>
  )
}

function QuickActionsCard() {
  const { t } = useTranslation()

  return (
    <section className={cn(panelClass, 'min-h-[248px] p-4')}>
      <div className="mb-4 px-1">
        <h2 className="text-[20px] font-medium text-[var(--lux-heading)]">{t('dashboard.quickActions')}</h2>
      </div>
      <div className="space-y-3">
        {quickActions.map((action, index) => (
          <button
            className={cn(
              'flex h-[58px] w-full items-center justify-between rounded-[18px] border px-4 text-left transition',
              index === 0
                ? 'text-[var(--lux-primary-text)]'
                : 'text-[var(--lux-soft-text)]',
            )}
            key={action.id}
            style={
              index === 0
                ? {
                    background: 'var(--lux-primary-surface)',
                    borderColor: 'var(--lux-gold-border)',
                  }
                : {
                    background: 'var(--lux-row-surface)',
                    borderColor: 'var(--lux-row-border)',
                  }
            }
            type="button"
          >
            <span className="flex items-center gap-3">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl border"
                style={{
                  background: 'var(--lux-control-surface)',
                  borderColor: 'var(--lux-control-border)',
                }}
              >
                <action.icon className="h-4 w-4" />
              </span>
              <span className="text-[15px] font-medium">{t(action.labelKey)}</span>
            </span>
            <ChevronRight className="h-4 w-4" />
          </button>
        ))}
      </div>
    </section>
  )
}

function RecentBookingsCard() {
  const { t } = useTranslation()

  return (
    <section className={cn(panelClass, 'min-h-[236px] p-4')}>
      <div className="mb-4 px-1">
        <h2 className="text-[20px] font-medium text-[var(--lux-heading)]">{t('dashboard.recentBookings')}</h2>
      </div>
      <div
        className="overflow-hidden rounded-[18px] border"
        style={{
          background: 'var(--lux-row-surface)',
          borderColor: 'var(--lux-row-border)',
        }}
      >
        <div
          className="grid grid-cols-[1.45fr_0.9fr_0.85fr_0.8fr] gap-3 border-b px-4 py-3 text-sm text-[var(--lux-text-secondary)]"
          style={{ borderColor: 'var(--lux-row-border)' }}
        >
          <span>{t('dashboard.client')}</span>
          <span>{t('common.date')}</span>
          <span>{t('calendar.fields.status')}</span>
          <span className="text-right">{t('dashboard.amount')}</span>
        </div>
        <div>
          {recentBookings.map((booking, index) => (
            <div
              className="grid grid-cols-[1.45fr_0.9fr_0.85fr_0.8fr] gap-3 border-b px-4 py-3 last:border-b-0"
              style={{ borderColor: 'var(--lux-row-border)' }}
              key={booking.id}
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-[rgba(212,175,55,0.12)]">
                  <AvatarFallback
                    className={cn(
                      'bg-gradient-to-br text-xs font-semibold text-white',
                      avatarTones[index % avatarTones.length],
                    )}
                  >
                    {getInitials(booking.clientName)}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate text-[15px] text-[var(--lux-strong-text)]">{booking.clientName}</span>
              </div>
              <span className="text-[15px] text-[var(--lux-soft-text)]">
                {formatDateLabel(booking.eventDate, 'dd MMM yyyy')}
              </span>
              <span
                className={cn(
                  'inline-flex max-w-max items-center rounded-[10px] px-3 py-1 text-sm',
                  statusTone[booking.status],
                )}
              >
                {t(`status.${booking.status}`)}
              </span>
              <span className="text-right text-[15px] font-medium text-[var(--lux-strong-text)]">
                {formatCurrency(booking.total)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function InventoryCard() {
  const { t } = useTranslation()

  return (
    <section className={cn(panelClass, 'min-h-[206px] p-4')}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[20px] font-medium text-[var(--lux-heading)]">{t('dashboard.inventory')}</h2>
        <div className="flex items-center gap-2 text-[var(--lux-text-muted)]">
          <ChevronLeft className="h-4 w-4" />
          <ChevronRight className="h-4 w-4" />
        </div>
      </div>
      <div className="space-y-3">
        {inventoryAllocations.map((item) => (
          <div
            className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-[16px] border px-4 py-3"
            style={{
              background: 'var(--lux-row-surface)',
              borderColor: 'var(--lux-row-border)',
            }}
            key={item.id}
          >
            <div className="flex items-center gap-3">
              <Package2 className="h-4 w-4 text-[#c79d5a]" />
              <span className="truncate text-[15px] text-[var(--lux-soft-text)]">{item.itemName}</span>
            </div>
            <span className="rounded-[8px] bg-[rgba(212,175,55,0.08)] px-2.5 py-1 text-xs text-[#efd39e]">
              {item.status}
            </span>
            <span className="rounded-[8px] border border-[var(--lux-gold-border)] px-2.5 py-1 text-sm text-[var(--lux-strong-text)]">
              {item.quantity}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

function BookingsCard() {
  const { t } = useTranslation()
  const progress = Math.round(
    (bookingRingSummary.paid / (bookingRingSummary.paid + bookingRingSummary.due)) * 100,
  )

  return (
    <section className={cn(panelClass, 'min-h-[206px] p-4')}>
      <h2 className="text-[20px] font-medium text-[var(--lux-heading)]">{t('dashboard.bookings')}</h2>
      <div className="mt-4 flex items-center justify-center">
        <div
          className="relative flex h-36 w-36 items-center justify-center rounded-full"
          style={{
            background: `conic-gradient(#e8c278 ${progress}%, rgba(255,255,255,0.08) ${progress}% 100%)`,
          }}
        >
          <div
            className="flex h-[102px] w-[102px] flex-col items-center justify-center rounded-full shadow-[inset_0_0_20px_rgba(0,0,0,0.12)]"
            style={{ background: 'var(--lux-card)' }}
          >
            <p className="text-sm text-[var(--lux-text-secondary)]">{t('dashboard.totalItems')}</p>
            <p className="mt-1 text-[20px] font-semibold text-[var(--lux-strong-text)]">
              {bookingRingSummary.totalItems}
            </p>
          </div>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between text-[15px]">
          <span className="text-[var(--lux-text-secondary)]">{t('dashboard.paymentRows.paid')}</span>
          <span className="font-medium text-[var(--lux-strong-text)]">
            {formatCurrency(bookingRingSummary.paid)}
          </span>
        </div>
        <div className="flex items-center justify-between text-[15px]">
          <span className="text-[var(--lux-text-secondary)]">{t('dashboard.paymentRows.due')}</span>
          <span className="font-medium text-[var(--lux-strong-text)]">
            {formatCurrency(bookingRingSummary.due)}
          </span>
        </div>
      </div>
    </section>
  )
}

function PaymentsCard() {
  const { t } = useTranslation()

  return (
    <section className={cn(panelClass, 'min-h-[152px] p-4')}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[20px] font-medium text-[var(--lux-heading)]">{t('dashboard.payments')}</h2>
        <div className="flex items-center gap-2 text-[#d8bb83]">
          <Plus className="h-4 w-4" />
          <Search className="h-4 w-4" />
          <Download className="h-4 w-4" />
        </div>
      </div>
      <div className="space-y-3">
        {paymentRows.map((row) => (
          <div
            className="flex items-center justify-between rounded-[16px] border px-4 py-4"
            style={{
              background: 'var(--lux-row-surface)',
              borderColor: 'var(--lux-row-border)',
            }}
            key={row.id}
          >
            <span className="text-[15px] text-[var(--lux-soft-text)]">
              {t(row.id === 'pay-1' ? 'dashboard.paymentRows.paid' : 'dashboard.paymentRows.due')}
            </span>
            <span className="text-[17px] font-medium text-[var(--lux-gold)]">
              {formatCurrency(row.amount)}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

function ReportsCard() {
  const { t } = useTranslation()
  const points = reportSeries.map((value, index) => `${index * 24},${84 - value}`).join(' ')

  return (
    <section className={cn(panelClass, 'min-h-[152px] p-4')}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[20px] font-medium text-[var(--lux-heading)]">{t('dashboard.reports')}</h2>
        <div className="rounded-[10px] border border-[var(--lux-gold-border)] px-2 py-1 text-xs text-[var(--lux-gold)]">
          {t('dashboard.metric.revenue')}
        </div>
      </div>
      <div
        className="rounded-[16px] border p-4"
        style={{
          background: 'var(--lux-row-surface)',
          borderColor: 'var(--lux-row-border)',
        }}
      >
        <svg className="h-[84px] w-full" preserveAspectRatio="none" viewBox="0 0 264 84">
          <defs>
            <linearGradient id="reportLine" x1="0%" x2="100%" y1="0%" y2="0%">
              <stop offset="0%" stopColor="#a67839" />
              <stop offset="100%" stopColor="#f1d49f" />
            </linearGradient>
          </defs>
          <polyline
            fill="none"
            points={points}
            stroke="url(#reportLine)"
            strokeLinecap="round"
            strokeWidth="3"
          />
        </svg>
        <div className="mt-3 flex justify-between text-[11px] text-[var(--lux-text-muted)]">
          <span>Jan</span>
          <span>Mar</span>
          <span>May</span>
          <span>Jul</span>
          <span>Sep</span>
          <span>Nov</span>
        </div>
      </div>
    </section>
  )
}

function DashboardCalendarCard({
  currentMonth,
  weeks,
  onPrevious,
  onNext,
}: {
  currentMonth: Date
  weeks: Date[][]
  onPrevious: () => void
  onNext: () => void
}) {
  const { t } = useTranslation()
  const highlightDays = new Set([12, 14])
  const weekdayLabels = weeks[0] ?? []

  return (
    <section className={cn(panelClass, 'min-h-[344px] p-4')}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[20px] font-medium text-[var(--lux-heading)]">{t('dashboard.calendar')}</h2>
        <div className="flex items-center gap-3 text-[var(--lux-text-muted)]">
          <ChevronLeft className="h-4 w-4" />
          <ChevronRight className="h-4 w-4" />
        </div>
      </div>
      <div className="mb-4 flex items-center justify-between">
        <button className="text-[var(--lux-text-muted)]" type="button" onClick={onPrevious}>
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="text-[18px] font-medium text-[var(--lux-soft-text)]">
          {formatLocalized(currentMonth, 'MMMM yyyy')}
        </div>
        <button className="text-[var(--lux-text-muted)]" type="button" onClick={onNext}>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-2 text-center text-sm text-[var(--lux-text-secondary)]">
        {weekdayLabels.map((day) => (
          <span key={day.toISOString()}>{formatLocalized(day, 'EE')}</span>
        ))}
      </div>
      <div className="mt-3 space-y-1.5">
        {weeks.map((week) => (
          <div className="grid grid-cols-7 gap-1.5" key={week[0].toISOString()}>
            {week.map((day) => {
              const isHighlighted = highlightDays.has(day.getDate()) && day.getMonth() === 6

              return (
                <div
                  className={cn(
                    'flex aspect-square items-center justify-center rounded-full text-[15px] text-[var(--lux-soft-text)]',
                    isCalendarDayMuted(currentMonth, day) && 'text-[rgba(184,184,194,0.32)]',
                    isHighlighted && 'bg-[rgba(212,175,55,0.12)]',
                    isSameDay(day, new Date(2024, 6, 14)) &&
                      'border border-[rgba(212,175,55,0.18)] bg-[linear-gradient(180deg,#a97938,#7d5422)] text-[#fff3d8]',
                  )}
                  key={day.toISOString()}
                >
                  {formatLocalized(day, 'd')}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </section>
  )
}

function LowStockCard() {
  const { t } = useTranslation()

  return (
    <section className={cn(panelClass, 'min-h-[236px] p-4')}>
      <div className="mb-4">
        <h2 className="text-[20px] font-medium text-[var(--lux-heading)]">{t('dashboard.lowStockAlerts')}</h2>
      </div>
      <div className="space-y-3">
        {lowStockItems.map((item, index) => (
          <div
            className="flex items-center gap-3 rounded-[18px] border px-3 py-3"
            style={{
              background: 'var(--lux-row-surface)',
              borderColor: 'var(--lux-row-border)',
            }}
            key={item.id}
          >
            <Avatar className="h-12 w-12 border-[rgba(212,175,55,0.12)]">
              <AvatarFallback
                className={cn(
                  'bg-gradient-to-br text-xs font-semibold text-white',
                  avatarTones[index % avatarTones.length],
                )}
              >
                {getInitials(item.itemName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] text-[var(--lux-strong-text)]">{item.itemName}</p>
              <p className="mt-1 text-sm text-[#d09b56]">
                {item.availableQty} {t('common.remaining')}
              </p>
            </div>
            <div
              className="flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-sm font-medium"
              style={{
                background: 'var(--lux-badge-surface)',
                color: 'var(--lux-badge-text)',
              }}
            >
              {item.availableQty}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
