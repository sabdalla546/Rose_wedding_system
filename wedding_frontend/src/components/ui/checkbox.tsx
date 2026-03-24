import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "grid h-5 w-5 shrink-0 place-content-center rounded-[7px] border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lux-gold-glow)] disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:text-[var(--lux-badge-text)]",
      className,
    )}
    style={{
      background: "var(--lux-control-surface)",
      borderColor: "var(--lux-control-border)",
      boxShadow: "var(--lux-inset-highlight)",
    }}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("grid place-content-center text-current")}
      style={{ background: "var(--lux-badge-surface)", borderRadius: "6px" }}
    >
      <Check className="h-3.5 w-3.5" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
