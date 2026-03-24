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
        elevated ? 'surface-card-muted' : 'surface-card',
        'animate-fade-in p-card md:p-6',
        className,
      )}
      {...props}
    >
      {children}
    </section>
  )
}
