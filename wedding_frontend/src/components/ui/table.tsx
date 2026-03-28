import * as React from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

const useTableDirection = () => {
  const { i18n } = useTranslation();
  return i18n.resolvedLanguage === "ar" ? "rtl" : "ltr";
};

function Table({ className, ...props }: React.ComponentProps<"table">) {
  const direction = useTableDirection();

  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
      dir={direction}
    >
      <table
        data-slot="table"
        className={cn("w-max min-w-full caption-bottom text-sm", className)}
        dir={direction}
        style={{ color: "var(--color-text)" }}
        {...props}
      />
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("table-grid__header [&_tr]:border-b", className)}
      style={{
        borderColor: "var(--color-border)",
      }}
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
        background: "var(--color-surface-2)",
        color: "var(--color-text)",
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
      style={{ borderColor: "var(--color-border)" }}
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
        "h-12 whitespace-nowrap px-4 py-3 align-middle text-xs font-semibold break-normal",
        direction === "rtl" ? "tracking-normal" : "uppercase tracking-[0.18em]",
        direction === "rtl" ? "text-right" : "text-left",
        className
      )}
      style={{
        color: "var(--color-text-muted)",
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
        "whitespace-nowrap break-normal px-4 py-4 align-middle text-sm leading-6",
        direction === "rtl" ? "text-right" : "text-left",
        className
      )}
      style={{
        color: "var(--color-text)",
        unicodeBidi: "plaintext",
      }}
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
      style={{ color: "var(--color-text-muted)" }}
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
