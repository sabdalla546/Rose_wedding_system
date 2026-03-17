import { CalendarClock, FilePenLine, NotebookText, UsersRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { SectionCard } from '@/components/shared/section-card'
import { StatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { formatDateLabel, formatTimeLabel } from '@/lib/utils'
import type { CalendarEvent } from '@/types/calendar'

type QuickViewPanelProps = {
  event: CalendarEvent | null
  onView?: () => void
  onEdit?: () => void
}

export function QuickViewPanel({ event, onView, onEdit }: QuickViewPanelProps) {
  const { t } = useTranslation()

  if (!event) {
    return (
      <SectionCard className="h-full">
        <div className="flex h-full min-h-[340px] items-center justify-center rounded-[24px] border border-dashed border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] text-center">
          <div>
            <p className="text-lg font-semibold text-[var(--lux-text)]">{t('calendar.selectBooking')}</p>
            <p className="mt-2 text-sm text-[var(--lux-text-muted)]">
              {t('calendar.selectBookingDescription')}
            </p>
          </div>
        </div>
      </SectionCard>
    )
  }

  return (
    <SectionCard className="space-y-5">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--lux-text-muted)]">
              {t('calendar.quickView')}
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-[var(--lux-text)]">{event.title}</h3>
            <p className="mt-1 text-sm text-[var(--lux-text-secondary)]">
              {event.clientName} • {event.bookingNumber}
            </p>
          </div>
          <StatusBadge status={event.status} />
        </div>
        {event.conflict ? (
          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            {t('calendar.availabilityWarning')}
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <InfoBlock
          icon={CalendarClock}
          label={t('common.date')}
          value={formatDateLabel(event.startAt, 'EEEE, dd MMM yyyy')}
        />
        <InfoBlock
          icon={CalendarClock}
          label={t('common.time')}
          value={`${formatTimeLabel(event.startAt)} - ${formatTimeLabel(event.endAt)}`}
        />
        <InfoBlock icon={NotebookText} label={t('common.venue')} value={event.venue} />
        <InfoBlock
          icon={NotebookText}
          label={t('appointments.meetingType', { defaultValue: 'Meeting Type' })}
          value={
            event.meetingType
              ? t(`appointments.meetingTypeOptions.${event.meetingType}`, {
                  defaultValue: event.packageName,
                })
              : event.packageName
          }
        />
        <InfoBlock
          icon={UsersRound}
          label={t('appointments.assignedTo', { defaultValue: 'Assigned To' })}
          value={event.coordinator}
        />
        <InfoBlock
          icon={FilePenLine}
          label={t('appointments.guestCount', { defaultValue: 'Guest Count' })}
          value={event.guestCount ? String(event.guestCount) : '-'}
        />
      </div>

      <Separator />

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--lux-text-muted)]">
          {t('common.notes')}
        </p>
        <p className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm leading-6 text-[var(--lux-text-secondary)]">
          {event.notes || t('appointments.noNotes', { defaultValue: 'No notes added.' })}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Button className="w-full" onClick={onView}>
          {t('appointments.viewAppointment', { defaultValue: 'View Appointment' })}
        </Button>
        <Button className="w-full" variant="secondary" onClick={onEdit}>
          {t('common.edit')}
        </Button>
      </div>
    </SectionCard>
  )
}

type InfoBlockProps = {
  icon: typeof CalendarClock
  label: string
  value: string
}

function InfoBlock({ icon: Icon, label, value }: InfoBlockProps) {
  return (
    <div className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-4">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[rgba(212,175,55,0.08)] text-[var(--lux-gold)]">
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--lux-text-muted)]">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-[var(--lux-text)]">{value}</p>
    </div>
  )
}
