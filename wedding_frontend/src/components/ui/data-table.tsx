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
import { ArrowUpDown } from "lucide-react";

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
}

export function DataTable<TData, TValue>({
  columns,
  data,
  enableRowNumbers = false,
  rowNumberStart = 1,
  isLoading = false,
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
    <div dir={isRtl ? "rtl" : "ltr"}>
      <Table className="min-w-full">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  className="group px-4 py-3"
                  key={header.id}
                >
                  {header.isPlaceholder ? null : (
                    <button
                      className={cn(
                        "flex w-full items-center gap-2",
                        isRtl ? "flex-row-reverse justify-end" : "justify-start",
                        header.column.getCanSort()
                          ? "cursor-pointer select-none"
                          : "cursor-default"
                      )}
                      disabled={!header.column.getCanSort()}
                      type="button"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <span className="truncate">
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
                              ? "opacity-100 text-[var(--lux-gold)]"
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
                <div className="flex flex-col items-center justify-center gap-2">
                  <div
                    className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
                    style={{
                      borderColor: "var(--lux-gold)",
                      borderTopColor: "transparent",
                    }}
                  />
                  <p className="text-sm text-[var(--lux-text-secondary)]">
                    {t("common.loading", { defaultValue: "Loading..." })}
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ) : table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row, index) => (
              <TableRow
                key={row.id}
                style={
                  index % 2 === 0
                    ? undefined
                    : {
                        background:
                          "color-mix(in srgb, var(--lux-control-hover) 70%, transparent)",
                      }
                }
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    <div
                      className={cn(
                        "flex",
                        isRtl ? "justify-end text-right" : "justify-start text-left"
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
                <div className="flex flex-col items-center justify-center gap-2">
                  <p
                    className="text-base font-semibold"
                    style={{ color: "var(--lux-heading)" }}
                  >
                    {t("common.noResultsTitle", { defaultValue: "No results found" })}
                  </p>
                  <p style={{ color: "var(--lux-text-muted)" }}>
                    {t("common.noResultsDescription", {
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
