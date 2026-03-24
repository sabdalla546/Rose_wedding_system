import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground hover:opacity-95',
        destructive:
          'border text-[var(--lux-danger)] hover:opacity-95',
        secondary:
          'border text-[var(--lux-text)] hover:border-[var(--lux-gold-border)] hover:bg-[var(--lux-control-hover)]',
        ghost:
          'text-[var(--lux-text-secondary)] hover:bg-[var(--lux-control-hover)] hover:text-[var(--lux-text)]',
        outline:
          'border border-[var(--lux-gold-border)] bg-[var(--lux-control-hover)] text-[var(--lux-text)] hover:opacity-95',
        link: 'h-auto rounded-none px-0 text-[var(--lux-gold)] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 px-5',
        sm: 'h-9 rounded-xl px-4 text-xs',
        lg: 'h-12 rounded-2xl px-6',
        icon: 'h-10 w-10 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    const resolvedVariant = variant ?? 'default'
    const variantStyles =
      resolvedVariant === 'default'
        ? {
            background: 'var(--lux-primary-surface)',
            color: 'var(--lux-primary-text)',
            boxShadow: '0 16px 32px color-mix(in srgb, var(--lux-gold-glow) 70%, transparent)',
          }
        : resolvedVariant === 'destructive'
          ? {
              background: 'var(--lux-danger-soft)',
              borderColor: 'color-mix(in srgb, var(--lux-danger) 35%, transparent)',
              color: 'var(--lux-danger)',
            }
        : resolvedVariant === 'secondary'
          ? {
              background: 'var(--lux-control-surface)',
              borderColor: 'var(--lux-control-border)',
              color: 'var(--lux-text)',
            }
          : resolvedVariant === 'outline'
            ? {
                background: 'var(--lux-control-hover)',
                borderColor: 'var(--lux-gold-border)',
                color: 'var(--lux-text)',
              }
            : resolvedVariant === 'link'
              ? {
                  color: 'var(--lux-gold)',
                }
            : {
                color: 'var(--lux-text-secondary)',
              }

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        style={variantStyles}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

export { Button }
