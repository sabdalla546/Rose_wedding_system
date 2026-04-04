import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, style, ...props }, ref) => {
    return (
      <input
        className={cn(
          "flex h-12 w-full rounded-[4px] border px-4 py-2 text-sm text-[var(--lux-text)] placeholder:text-[var(--lux-text-muted)] outline-none transition-all focus:border-[var(--lux-gold-border)] focus:ring-2 focus:ring-[var(--lux-gold-glow)] disabled:cursor-not-allowed disabled:opacity-60 read-only:cursor-default read-only:border-dashed read-only:bg-[var(--lux-row-surface)] read-only:text-[var(--lux-text-secondary)] read-only:focus:border-[var(--lux-control-border)] read-only:focus:ring-0 bg-[var(--lux-control-surface)] border-[var(--lux-control-border)]",
          className,
        )}
        style={{
          boxShadow: "var(--lux-inset-highlight)",
          ...style,
        }}
        ref={ref}
        type={type}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";

export { Input };
