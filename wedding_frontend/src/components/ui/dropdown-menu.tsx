import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import * as React from 'react'

import { cn } from '@/lib/utils'

const DropdownMenu = DropdownMenuPrimitive.Root
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger
const DropdownMenuGroup = DropdownMenuPrimitive.Group
const DropdownMenuPortal = DropdownMenuPrimitive.Portal

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 8, ...props }, ref) => (
  <DropdownMenuPortal>
    <DropdownMenuPrimitive.Content
      className={cn(
        'z-50 min-w-48 rounded-2xl border p-2 text-[var(--lux-text)] shadow-luxe backdrop-blur-xl',
        className,
      )}
      style={{
        borderColor: 'var(--lux-panel-border)',
        background: 'var(--lux-panel-surface)',
        boxShadow: 'var(--lux-panel-shadow)',
      }}
      ref={ref}
      sideOffset={sideOffset}
      {...props}
    />
  </DropdownMenuPortal>
))
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    className={cn(
      'relative flex cursor-default select-none items-center rounded-xl px-3 py-2 text-sm text-[var(--lux-text-secondary)] outline-none transition hover:bg-[var(--lux-control-hover)] hover:text-[var(--lux-text)] focus:bg-[var(--lux-control-hover)] focus:text-[var(--lux-text)]',
      className,
    )}
    ref={ref}
    {...props}
  />
))
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
}
