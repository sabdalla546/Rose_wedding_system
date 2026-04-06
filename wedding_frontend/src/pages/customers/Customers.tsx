import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import CompactHeader from "@/components/common/CompactHeader";
import { CrudPageLayout } from "@/components/shared/crud-layout";
import { DataTableShell } from "@/components/shared/data-table-shell";
import { Button } from "@/components/ui/button";
import ConfirmDialog from "@/components/ui/confirmDialog";
import { DataTable } from "@/components/ui/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDeleteCustomer } from "@/hooks/customers/useDeleteCustomer";
import { useCustomers } from "@/hooks/customers/useCustomers";

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
      <CrudPageLayout className="bg-[var(--color-bg)] text-[var(--color-text)]  ">
        <CompactHeader
          title={t("customers.title", { defaultValue: "Customers" })}
          subtitle={t("customers.basicInformationHint", {
            defaultValue:
              "Customer master records only. Event details now live under events.",
          })}
          search={{
            placeholder: t("customers.searchPlaceholder", {
              defaultValue:
                "Search customers by name, mobile, email, national ID, or address",
            }),
            value: searchQuery,
            onChange: (value) => {
              setSearchQuery(value);
              setCurrentPage(1);
            },
            onSubmit: () => undefined,
          }}
          right={
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
              <div className="w-full sm:w-[220px]">
                <label className="sr-only" htmlFor="customers-status-filter">
                  {t("customers.status", { defaultValue: "Status" })}
                </label>
                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value as "all" | TableCustomer["status"]);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger
                    className="h-9 rounded-[14px] px-3 text-[13px]"
                    id="customers-status-filter"
                  >
                    <SelectValue
                      placeholder={t("customers.allStatuses", {
                        defaultValue: "All Statuses",
                      })}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {t("customers.allStatuses", {
                        defaultValue: "All Statuses",
                      })}
                    </SelectItem>
                    {CUSTOMER_STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {t(`customers.status.${status.value}`, {
                          defaultValue: status.label,
                        })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <ProtectedComponent permission="customers.create">
                <Button size="sm" onClick={() => navigate("/customers/create")}>
                  <Plus className="h-4 w-4" />
                  {t("customers.create", { defaultValue: "Create Customer" })}
                </Button>
              </ProtectedComponent>
            </div>
          }
        />

        <DataTableShell
          title={t("customers.listTitle", { defaultValue: "Customers List" })}
          totalItems={totalItems}
          currentCount={customers.length}
          entityName={t("customers.title", { defaultValue: "Customers" })}
          itemsPerPage={itemsPerPage}
          setItemsPerPage={setItemsPerPage}
          setCurrentPage={setCurrentPage}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(value: number) => {
            setItemsPerPage(value);
            setCurrentPage(1);
          }}
        >
          <DataTable
            columns={columns}
            data={customers}
            rowNumberStart={rowNumberStart}
            enableRowNumbers
            isLoading={isLoading}
            fileName="customers"
          />
        </DataTableShell>

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
      </CrudPageLayout>
    </ProtectedComponent>
  );
};

export default CustomersPage;
