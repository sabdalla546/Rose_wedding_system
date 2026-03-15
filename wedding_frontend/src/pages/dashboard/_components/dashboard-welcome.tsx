import { CirclePlus, CreditCard, FileStack, UserPlus } from 'lucide-react'

import { Button } from '@/components/ui/button'

const actions = [
  { label: 'New Booking', icon: CirclePlus },
  { label: 'New Quotation', icon: FileStack },
  { label: 'Add Customer', icon: UserPlus },
  { label: 'Add Payment', icon: CreditCard },
]

export function DashboardWelcome() {
  return (
    <div className="lux-panel relative overflow-hidden p-6 md:p-7">
      <div className="absolute inset-y-0 right-0 hidden w-80 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.14),transparent_65%)] md:block" />
      <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--lux-gold)]">
            Welcome back
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Welcome back, Admin
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--lux-text-secondary)] md:text-base">
            Track ballroom bookings, quotation approvals, payment follow-ups, and live
            operations from one refined control room.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:w-[520px]">
          {actions.map((action, index) => (
            <Button
              className="justify-between px-4"
              key={action.label}
              variant={index === 0 ? 'default' : 'secondary'}
            >
              <span className="flex items-center gap-2">
                <action.icon className="h-4 w-4" />
                {action.label}
              </span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
