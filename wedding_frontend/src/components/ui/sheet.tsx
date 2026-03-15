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
    className={cn('fixed inset-0 z-50 bg-black/70 backdrop-blur-sm', className)}
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
        'fixed inset-y-0 z-50 flex h-full w-full max-w-[320px] flex-col p-6 shadow-luxe',
        side === 'left'
          ? 'left-0 border-r border-[var(--lux-gold-border)]'
          : 'right-0 border-l border-[var(--lux-gold-border)]',
        className,
      )}
      style={{
        background:
          'linear-gradient(180deg, color-mix(in srgb, var(--lux-sidebar) 96%, transparent), color-mix(in srgb, var(--lux-shell-surface) 98%, transparent))',
      }}
      ref={ref}
      {...props}
    >
      {children}
      <DialogPrimitive.Close
        className={cn(
          'absolute top-4 rounded-full border p-2 text-[var(--lux-text-muted)] transition hover:text-[var(--lux-text)]',
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
