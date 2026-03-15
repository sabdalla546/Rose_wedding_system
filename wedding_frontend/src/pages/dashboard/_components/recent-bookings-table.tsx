import { Eye } from 'lucide-react'

import { ActionMenu } from '@/components/shared/action-menu'
import { SectionCard } from '@/components/shared/section-card'
import { StatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDateLabel } from '@/lib/utils'
import type { RecentBooking } from '@/types/dashboard'

type RecentBookingsTableProps = {
  bookings: RecentBooking[]
}

export function RecentBookingsTable({ bookings }: RecentBookingsTableProps) {
  return (
    <SectionCard className="space-y-5">
      <div>
        <h3 className="text-xl font-semibold text-white">Recent Bookings</h3>
        <p className="mt-1 text-sm text-[var(--lux-text-muted)]">
          Premium clients and booking balances requiring attention.
        </p>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-[rgba(255,255,255,0.06)]">
        <div className="hidden grid-cols-[1.1fr_1fr_1fr_0.9fr_0.9fr_68px] gap-4 bg-[rgba(255,255,255,0.03)] px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--lux-text-muted)] md:grid">
          <span>Booking / Client</span>
          <span>Event Date</span>
          <span>Venue</span>
          <span>Status</span>
          <span>Balance</span>
          <span />
        </div>
        <div className="divide-y divide-[rgba(255,255,255,0.06)]">
          {bookings.map((booking) => (
            <div
              className="grid gap-4 px-5 py-4 md:grid-cols-[1.1fr_1fr_1fr_0.9fr_0.9fr_68px] md:items-center"
              key={booking.id}
            >
              <div>
                <p className="text-sm font-semibold text-white">{booking.bookingNumber}</p>
                <p className="mt-1 text-sm text-[var(--lux-text-secondary)]">{booking.clientName}</p>
              </div>
              <p className="text-sm text-[var(--lux-text-secondary)]">
                {formatDateLabel(booking.eventDate)}
              </p>
              <p className="text-sm text-[var(--lux-text-secondary)]">{booking.venue}</p>
              <div>
                <StatusBadge status={booking.status} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{formatCurrency(booking.total)}</p>
                <p className="mt-1 text-xs text-[var(--lux-text-muted)]">
                  Balance {formatCurrency(booking.balance)}
                </p>
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button size="icon" variant="ghost">
                  <Eye className="h-4 w-4" />
                </Button>
                <ActionMenu items={['View booking', 'Edit invoice', 'Share summary']} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  )
}
