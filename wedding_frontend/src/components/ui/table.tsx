import * as React from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

const useTableDirection = () => {
  const { i18n } = useTranslation();
  return i18n.resolvedLanguage === "ar" ? "rtl" : "ltr";
};

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto rounded-[22px] border"
      style={{
        background: "var(--lux-panel-surface)",
        borderColor: "var(--lux-panel-border)",
        boxShadow: "var(--lux-panel-shadow)",
      }}
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      style={{ borderColor: "var(--lux-row-border)" }}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  );
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn("font-medium [&>tr]:last:border-b-0", className)}
      style={{
        background: "var(--lux-control-hover)",
        color: "var(--lux-text)",
      }}
      {...props}
    />
  );
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn("border-b transition-colors duration-200", className)}
      style={{ borderColor: "var(--lux-row-border)" }}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  const direction = useTableDirection();

  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-12 px-4 align-middle text-xs font-semibold uppercase tracking-[0.18em]",
        direction === "rtl" ? "text-right" : "text-left",
        className
      )}
      style={{
        color: "var(--lux-text-secondary)",
        background: "color-mix(in srgb, var(--lux-control-hover) 80%, transparent)",
      }}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  const direction = useTableDirection();

  return (
    <td
      data-slot="table-cell"
      className={cn(
        "px-4 py-4 align-middle text-sm",
        direction === "rtl" ? "text-right" : "text-left",
        className
      )}
      style={{ color: "var(--lux-text)" }}
      {...props}
    />
  );
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  const direction = useTableDirection();

  return (
    <caption
      data-slot="table-caption"
      className={cn(
        "mt-4 text-sm",
        direction === "rtl" ? "text-right" : "text-left",
        className
      )}
      style={{ color: "var(--lux-text-muted)" }}
      {...props}
    />
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
