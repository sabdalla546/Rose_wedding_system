import * as React from 'react'

import { cn } from '@/lib/utils'

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        className={cn(
          'flex h-12 w-full rounded-[22px] border px-4 py-2 text-sm text-[var(--lux-text)] placeholder:text-[var(--lux-text-muted)] outline-none transition-all focus:border-[var(--lux-gold-border)] focus:ring-2 focus:ring-[var(--lux-gold-glow)] disabled:cursor-not-allowed disabled:opacity-60',
          className,
        )}
        style={{
          background: 'var(--lux-control-surface)',
          borderColor: 'var(--lux-control-border)',
          boxShadow: 'var(--lux-inset-highlight)',
        }}
        ref={ref}
        type={type}
        {...props}
      />
    )
  },
)
Input.displayName = 'Input'

export { Input }
