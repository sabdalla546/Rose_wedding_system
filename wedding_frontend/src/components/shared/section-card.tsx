import type { HTMLAttributes, PropsWithChildren } from 'react'

import { cn } from '@/lib/utils'

type SectionCardProps = PropsWithChildren<
  HTMLAttributes<HTMLDivElement> & {
    elevated?: boolean
  }
>

export function SectionCard({
  children,
  className,
  elevated = false,
  ...props
}: SectionCardProps) {
  return (
    <section
      className={cn(
        elevated ? 'lux-elevated' : 'lux-panel',
        'animate-fade-in p-5 md:p-6',
        className,
      )}
      {...props}
    >
      {children}
    </section>
  )
}
