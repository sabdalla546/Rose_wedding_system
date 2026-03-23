import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PageContainer } from "@/components/layout/page-container";
import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import ConfirmDialog from "@/components/ui/confirmDialog";
import TableHeader from "@/components/common/TableHeader";
import Pagination from "@/components/ui/pagination";
import { useCustomers } from "@/hooks/customers/useCustomers";
import { useDeleteCustomer } from "@/hooks/customers/useDeleteCustomer";
import {
  CUSTOMER_STATUS_OPTIONS,
  toTableCustomers,
  type TableCustomer,
} from "./adapters";
import { useCustomersColumns } from "./_components/customersColumns";

const CustomersPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isArabic = i18n.language === "ar";

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | TableCustomer["status"]
  >("all");
  const [deleteCandidate, setDeleteCandidate] = useState<TableCustomer | null>(
    null,
  );

  const { data, isLoading } = useCustomers({
    currentPage,
    itemsPerPage,
    searchQuery,
    status: statusFilter,
  });

  const deleteMutation = useDeleteCustomer();
  const adapted = useMemo(() => toTableCustomers(data), [data]);
  const customers = adapted.data.customers;
  const totalItems = adapted.total;
  const totalPages = adapted.totalPages;
  const rowNumberStart = (currentPage - 1) * itemsPerPage + 1;

  const columns = useCustomersColumns({
    onDelete: setDeleteCandidate,
    editPermission: "customers.update",
    deletePermission: "customers.delete",
  });

  return (
    <ProtectedComponent permission="customers.read">
      <PageContainer className="space-y-6 pb-4 pt-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--lux-heading)]">
              {t("customers.title", { defaultValue: "Customers" })}
            </h1>
            <p className="text-sm text-[var(--lux-text-secondary)]">
              {t("customers.basicInformationHint", {
                defaultValue:
                  "Customer master records only. Event details now live under events.",
              })}
            </p>
          </div>

          <ProtectedComponent permission="customers.create">
            <Button onClick={() => navigate("/customers/create")}>
              <Plus className="h-4 w-4" />
              {t("customers.create", { defaultValue: "Create Customer" })}
            </Button>
          </ProtectedComponent>
        </div>

        <div className="grid gap-4 rounded-[24px] border p-4 md:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--lux-text-muted)]" />
            <Input
              className="pl-10"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setCurrentPage(1);
              }}
              placeholder={t("customers.searchPlaceholder", {
                defaultValue: "Search customers by name, mobile, or email",
              })}
            />
          </div>

          <select
            className="h-10 rounded-xl border px-3 text-sm"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(
                event.target.value as "all" | TableCustomer["status"],
              );
              setCurrentPage(1);
            }}
          >
            <option value="all">
              {t("customers.allStatuses", { defaultValue: "All Statuses" })}
            </option>
            {CUSTOMER_STATUS_OPTIONS.map((status) => (
              <option key={status.value} value={status.value}>
                {t(`customers.status.${status.value}`, {
                  defaultValue: status.label,
                })}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <TableHeader
            title={t("customers.listTitle", { defaultValue: "Customers List" })}
            totalItems={totalItems}
            currentCount={customers.length}
            entityName={t("customers.title", { defaultValue: "Customers" })}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setItemsPerPage}
            setCurrentPage={setCurrentPage}
          />

          <DataTable
            columns={columns}
            data={customers}
            rowNumberStart={rowNumberStart}
            enableRowNumbers
            isLoading={isLoading}
            fileName="customers"
          />

          {totalPages > 1 ? (
            <div className="border-t border-border bg-muted/40 px-6 py-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={(value: number) => {
                  setItemsPerPage(value);
                  setCurrentPage(1);
                }}
              />
            </div>
          ) : null}
        </div>

        <ConfirmDialog
          open={deleteCandidate !== null}
          onOpenChange={(open) => !open && setDeleteCandidate(null)}
          title={t("customers.deleteTitle", {
            defaultValue: "Delete Customer",
          })}
          message={t("customers.deleteMessage", {
            defaultValue: isArabic
              ? "هل أنت متأكد من حذف هذا العميل؟"
              : "Are you sure you want to delete this customer?",
          })}
          confirmLabel={t("common.delete", { defaultValue: "Delete" })}
          cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
          onConfirm={() => {
            if (!deleteCandidate) {
              return;
            }

            deleteMutation.mutate(deleteCandidate.id, {
              onSettled: () => setDeleteCandidate(null),
            });
          }}
          isPending={deleteMutation.isPending}
        />
      </PageContainer>
    </ProtectedComponent>
  );
};

export default CustomersPage;
