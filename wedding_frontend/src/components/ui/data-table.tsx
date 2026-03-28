import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, Loader2, SearchX } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  enableRowNumbers?: boolean;
  rowNumberStart?: number;
  isLoading?: boolean;
  showExportCSV?: boolean;
  showExportExcel?: boolean;
  showPrint?: boolean;
  fileName?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  enableRowNumbers = false,
  rowNumberStart = 1,
  isLoading = false,
  emptyTitle,
  emptyDescription,
}: DataTableProps<TData, TValue>) {
  const { i18n, t } = useTranslation();
  const isRtl = i18n.resolvedLanguage === "ar";
  const [sorting, setSorting] = useState<SortingState>([]);

  const finalColumns: ColumnDef<TData, TValue>[] = enableRowNumbers
    ? ([
        {
          id: "rowNumber",
          header: "#",
          cell: ({ row }) => rowNumberStart + row.index,
        } as ColumnDef<TData, TValue>,
        ...columns,
      ] as ColumnDef<TData, TValue>[])
    : columns;

  const table = useReactTable({
    data,
    columns: finalColumns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="w-full overflow-x-auto">
      <Table className="table-grid min-w-full">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  className="group border-b border-[var(--color-border)] px-4 py-3"
                  key={header.id}
                >
                  {header.isPlaceholder ? null : (
                    <button
                      className={cn(
                        "flex w-full items-center gap-2 whitespace-nowrap rounded-lg px-1 py-0.5 transition-colors",
                        isRtl ? "flex-row-reverse justify-end" : "justify-start",
                        header.column.getCanSort()
                          ? "cursor-pointer select-none hover:text-[var(--color-heading)]"
                          : "cursor-default"
                      )}
                      disabled={!header.column.getCanSort()}
                      type="button"
                      onClick={header.column.getToggleSortingHandler()}
                  >
                      <span className="whitespace-nowrap" dir="auto">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </span>
                      {header.column.getCanSort() ? (
                        <ArrowUpDown
                          className={cn(
                            "h-4 w-4 transition-opacity",
                            header.column.getIsSorted()
                              ? "opacity-100 text-[var(--color-primary)]"
                              : "opacity-45 group-hover:opacity-100"
                          )}
                        />
                      ) : null}
                    </button>
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell className="py-12 text-center" colSpan={finalColumns.length}>
                <div className="table-state">
                  <div className="app-icon-chip h-12 w-12 rounded-[4px]">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    {t("common.loading", { defaultValue: "Loading..." })}
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ) : table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row, index) => (
              <TableRow
                key={row.id}
                className={cn(
                  "table-grid__row",
                  index % 2 !== 0 && "table-grid__row--alt",
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    <div
                      dir="auto"
                      className={cn(
                        "w-full min-w-max whitespace-nowrap",
                        isRtl ? "text-right" : "text-left"
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </div>
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell className="py-12 text-center" colSpan={finalColumns.length}>
                <div className="table-state">
                  <div className="app-icon-chip h-12 w-12 rounded-[4px]">
                    <SearchX className="h-5 w-5" />
                  </div>
                  <p
                    className="text-base font-semibold"
                    style={{ color: "var(--color-heading)" }}
                  >
                    {emptyTitle ??
                      t("common.noResultsTitle", {
                        defaultValue: "No results found",
                      })}
                  </p>
                  <p style={{ color: "var(--color-text-muted)" }}>
                    {emptyDescription ??
                      t("common.noResultsDescription", {
                        defaultValue:
                          "Try adjusting your search or filters to find what you need.",
                      })}
                  </p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
