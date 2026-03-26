import type { PropsWithChildren, ReactNode } from "react";

import TableHeader from "@/components/common/TableHeader";
import Pagination from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

type DataTableShellProps = PropsWithChildren<{
  title: string;
  totalItems?: number;
  currentCount?: number;
  entityName?: string;
  itemsPerPage?: number;
  setItemsPerPage?: (size: number) => void;
  setCurrentPage?: (page: number) => void;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onItemsPerPageChange?: (size: number) => void;
  headerActions?: ReactNode;
  className?: string;
  bodyClassName?: string;
  footerClassName?: string;
  showMeta?: boolean;
}>;

export function DataTableShell({
  title,
  totalItems,
  currentCount,
  entityName,
  itemsPerPage,
  setItemsPerPage,
  setCurrentPage,
  currentPage,
  totalPages = 1,
  onPageChange,
  onItemsPerPageChange,
  headerActions,
  className,
  bodyClassName,
  footerClassName,
  showMeta = true,
  children,
}: DataTableShellProps) {
  const canPaginate = Boolean(
    totalPages > 1 &&
      currentPage !== undefined &&
      itemsPerPage !== undefined &&
      onPageChange &&
      onItemsPerPageChange,
  );

  return (
    <div className={cn("table-shell", className)} style={{ borderRadius: "4px" }}>
      <TableHeader
        title={title}
        totalItems={totalItems}
        currentCount={currentCount}
        entityName={entityName}
        itemsPerPage={itemsPerPage ?? 10}
        setItemsPerPage={setItemsPerPage ?? (() => undefined)}
        setCurrentPage={setCurrentPage ?? (() => undefined)}
        actions={headerActions}
        showMeta={showMeta}
      />

      <div className={cn("overflow-hidden", bodyClassName)}>{children}</div>

      {canPaginate ? (
        <div className={cn("table-shell-footer", footerClassName)}>
          <Pagination
            currentPage={currentPage!}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage!}
            onPageChange={onPageChange!}
            onItemsPerPageChange={onItemsPerPageChange!}
          />
        </div>
      ) : null}
    </div>
  );
}
