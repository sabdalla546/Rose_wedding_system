import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import * as React from 'react'

import { cn } from '@/lib/utils'

const Sheet = DialogPrimitive.Root
const SheetTrigger = DialogPrimitive.Trigger
const SheetClose = DialogPrimitive.Close
const SheetPortal = DialogPrimitive.Portal

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    className={cn('fixed inset-0 z-50 backdrop-blur-sm', className)}
    style={{ background: 'var(--lux-overlay-strong)' }}
    ref={ref}
    {...props}
  />
))
SheetOverlay.displayName = DialogPrimitive.Overlay.displayName

const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    side?: 'left' | 'right'
  }
>(({ className, children, side = 'left', ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <DialogPrimitive.Content
      className={cn(
        'fixed inset-y-0 z-50 flex h-full w-full max-w-[320px] flex-col overflow-hidden border-t-[3px] p-6 shadow-luxe',
        side === 'left'
          ? 'left-0 rounded-r-[6px] border-r border-[var(--lux-gold-border)]'
          : 'right-0 rounded-l-[6px] border-l border-[var(--lux-gold-border)]',
        className,
      )}
      style={{
        background:
          'linear-gradient(180deg, color-mix(in srgb, var(--lux-shell-chrome-surface) 96%, var(--lux-gold) 4%), var(--lux-shell-chrome-surface))',
        borderTopColor: 'var(--lux-accent-border)',
      }}
      ref={ref}
      {...props}
    >
      {children}
      <DialogPrimitive.Close
        className={cn(
          'absolute top-4 rounded-[4px] border p-2 text-[var(--lux-text-muted)] transition hover:text-[var(--lux-text)]',
          side === 'left' ? 'right-4' : 'left-4',
        )}
        style={{
          borderColor: 'var(--lux-control-border)',
          background: 'var(--lux-control-surface)',
        }}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </SheetPortal>
))
SheetContent.displayName = DialogPrimitive.Content.displayName

export { Sheet, SheetClose, SheetContent, SheetOverlay, SheetTrigger }
