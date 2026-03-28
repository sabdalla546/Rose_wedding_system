import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  SearchIcon,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Enhanced SearchableSelect component
interface SearchableSelectProps extends React.ComponentProps<
  typeof SelectPrimitive.Root
> {
  placeholder?: string;
  searchPlaceholder?: string;
  onSearch?: (searchTerm: string) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  triggerClassName?: string;
  size?: "sm" | "default";
  allowClear?: boolean;
  onClear?: () => void;
}

function SearchableSelect({
  placeholder,
  searchPlaceholder = "Search...",
  onSearch,
  isLoading = false,
  emptyMessage = "No results found",
  className,
  triggerClassName,
  size = "default",
  allowClear = false,
  onClear,
  children,
  ...props
}: SearchableSelectProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [, setIsOpen] = React.useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    onSearch?.(value);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      // Focus search input when dropdown opens
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 0);
    } else {
      // Clear search when dropdown closes
      setSearchTerm("");
      onSearch?.("");
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClear?.();
  };

  return (
    <SelectPrimitive.Root {...props} onOpenChange={handleOpenChange}>
      <SearchableSelectTrigger
        className={triggerClassName}
        size={size}
        allowClear={allowClear}
        onClear={handleClear}
        hasValue={Boolean(props.value)}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
      </SearchableSelectTrigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className={cn(
            "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-[var(--radius-xl)] border shadow-luxe",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
            className,
          )}
          style={{
            background: "var(--lux-panel-surface)",
            borderColor: "var(--lux-panel-border)",
            color: "var(--lux-text)",
          }}
          position="popper"
          sideOffset={4}
        >
          <SelectScrollUpButton />

          {/* Search Input */}
          <div
            className="sticky top-0 z-10 border-b p-3"
            style={{
              background: "var(--lux-control-surface)",
              borderColor: "var(--lux-row-border)",
            }}
          >
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--lux-text-muted)]" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full rounded-[var(--radius-lg)] border py-2 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-[var(--lux-text-muted)] focus:ring-2 focus:ring-[var(--lux-gold-glow)]"
                style={{
                  background: "var(--lux-control-surface)",
                  borderColor: "var(--lux-control-border)",
                  color: "var(--lux-text)",
                }}
                onKeyDown={(e) => {
                  // Prevent select from closing when typing
                  e.stopPropagation();
                  if (e.key === "Enter") e.preventDefault();
                }}
              />
              {isLoading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--lux-gold)] border-t-transparent" />
                </div>
              )}
            </div>
          </div>

          <SelectPrimitive.Viewport className="p-1 max-h-64 overflow-y-auto">
            {React.Children.count(children) === 0 ? (
              <div className="py-6 text-center text-sm text-[var(--lux-text-muted)]">
                {emptyMessage}
              </div>
            ) : (
              children
            )}
          </SelectPrimitive.Viewport>

          <SelectScrollDownButton />
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

// Enhanced Trigger with modern styling and clear button
interface SearchableSelectTriggerProps extends React.ComponentProps<
  typeof SelectPrimitive.Trigger
> {
  size?: "sm" | "default";
  allowClear?: boolean;
  onClear?: (e: React.MouseEvent) => void;
  hasValue?: boolean;
}

function SearchableSelectTrigger({
  className,
  size = "default",
  allowClear = false,
  onClear,
  hasValue = false,
  children,
  ...props
}: SearchableSelectTriggerProps) {
  return (
    <SelectPrimitive.Trigger
      type="button"
      className={cn(
        // Base styles
        "flex w-full items-center justify-between gap-2 rounded-[var(--radius-lg)] border px-3 py-2 text-sm",
        "transition-all duration-200 outline-none",

        // Border and focus states
        "hover:text-[var(--lux-text)]",
        "focus:ring-2 focus:ring-[var(--lux-gold-glow)]",
        "data-[state=open]:ring-2 data-[state=open]:ring-[var(--lux-gold-glow)]",

        // Disabled state
        "disabled:cursor-not-allowed disabled:opacity-50",

        // Placeholder styling
        "data-[placeholder]:text-[var(--lux-text-muted)]",

        // Size variants
        {
          "h-9": size === "default",
          "h-8 text-xs": size === "sm",
        },

        className,
      )}
      style={{
        background: "var(--lux-control-surface)",
        borderColor: "var(--lux-control-border)",
        color: "var(--lux-text)",
      }}
      {...props}
    >
      <div className="flex-1 text-left truncate">{children}</div>

      <div className="flex items-center gap-1">
        {allowClear && hasValue && (
          <button
            type="button"
            onClick={onClear}
            className="rounded-sm p-0.5 transition-colors"
            style={{ background: "transparent" }}
            tabIndex={-1}
          >
            <X className="h-3 w-3 text-[var(--lux-text-muted)] hover:text-[var(--lux-text)]" />
          </button>
        )}
        <SelectPrimitive.Icon asChild>
          <ChevronDownIcon className="h-4 w-4 text-[var(--lux-text-muted)] transition-transform data-[state=open]:rotate-180" />
        </SelectPrimitive.Icon>
      </div>
    </SelectPrimitive.Trigger>
  );
}

// Enhanced SelectItem with modern styling
function SearchableSelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      className={cn(
        "relative flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm",
        "hover:text-[var(--lux-text)] focus:text-[var(--lux-text)] focus:outline-none",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        "transition-colors duration-150",
        className,
      )}
      style={{ color: "var(--lux-text-secondary)" }}
      {...props}
    >
      <SelectPrimitive.ItemText className="flex-1 truncate">
        {children}
      </SelectPrimitive.ItemText>

      <SelectPrimitive.ItemIndicator className="flex items-center justify-center">
        <CheckIcon className="h-4 w-4 text-[var(--lux-gold)]" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

// Scroll buttons with modern styling
function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      className={cn(
        "flex cursor-default items-center justify-center border-b py-1",
        className,
      )}
      style={{
        background: "var(--lux-control-surface)",
        borderColor: "var(--lux-row-border)",
      }}
      {...props}
    >
      <ChevronUpIcon className="h-4 w-4 text-[var(--lux-text-muted)]" />
    </SelectPrimitive.ScrollUpButton>
  );
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      className={cn(
        "flex cursor-default items-center justify-center border-t py-1",
        className,
      )}
      style={{
        background: "var(--lux-control-surface)",
        borderColor: "var(--lux-row-border)",
      }}
      {...props}
    >
      <ChevronDownIcon className="h-4 w-4 text-[var(--lux-text-muted)]" />
    </SelectPrimitive.ScrollDownButton>
  );
}

// Loading skeleton for items
function SearchableSelectSkeleton({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-md py-2.5 px-3 animate-pulse"
        >
          <div
            className="h-4 flex-1 rounded"
            style={{ background: "var(--lux-control-hover)" }}
          />
        </div>
      ))}
    </>
  );
}

// Empty state component
function SearchableSelectEmpty({
  message = "No results found",
}: {
  message?: string;
}) {
  return (
    <div className="py-8 text-center text-sm text-[var(--lux-text-muted)]">
      <SearchIcon className="mx-auto mb-2 h-8 w-8 text-[var(--lux-text-muted)]" />
      <p>{message}</p>
    </div>
  );
}

export {
  SearchableSelect,
  SearchableSelectTrigger,
  SearchableSelectItem,
  SearchableSelectSkeleton,
  SearchableSelectEmpty,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
