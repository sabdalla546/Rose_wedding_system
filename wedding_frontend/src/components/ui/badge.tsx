import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-[4px] border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "",
        secondary: "",
        destructive: "",
        outline: "",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  const resolvedVariant = variant ?? "default"
  const style =
    resolvedVariant === "default"
      ? {
          background: "var(--lux-badge-surface)",
          borderColor: "color-mix(in srgb, var(--lux-gold) 42%, var(--lux-control-border))",
          color: "var(--lux-badge-text)",
          boxShadow: "inset 0 1px 0 color-mix(in srgb, var(--lux-gold) 18%, transparent)",
        }
      : resolvedVariant === "secondary"
        ? {
          background: "var(--lux-control-hover)",
          borderColor: "color-mix(in srgb, var(--lux-control-border) 88%, var(--lux-gold-border))",
          color: "var(--lux-text-secondary)",
          boxShadow: "inset 0 1px 0 color-mix(in srgb, var(--lux-text) 8%, transparent)",
        }
      : resolvedVariant === "destructive"
          ? {
              background: "var(--lux-danger-soft)",
              borderColor: "color-mix(in srgb, var(--lux-danger) 48%, var(--lux-control-border))",
              color: "var(--lux-danger)",
              boxShadow: "inset 0 1px 0 color-mix(in srgb, var(--lux-danger) 16%, transparent)",
            }
          : {
              background: "transparent",
              borderColor: "color-mix(in srgb, var(--lux-control-border) 90%, var(--lux-gold-border))",
              color: "var(--lux-text)",
              boxShadow: "inset 0 1px 0 color-mix(in srgb, var(--lux-text) 10%, transparent)",
            }

  return (
    <div
      className={cn(
        badgeVariants({ variant }),
        "border text-[11px] uppercase tracking-[0.12em]",
        className,
      )}
      style={style}
      {...props}
    />
  )
}

export { Badge }
