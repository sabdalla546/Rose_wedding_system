/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Users as UsersIcon } from "lucide-react";
import { FaPlus } from "react-icons/fa";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import ConfirmDialog from "@/components/ui/confirmDialog";

import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import { CrudPageLayout } from "@/components/shared/crud-layout";
import { DataTableShell } from "@/components/shared/data-table-shell";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/axios";

import { useUsers } from "@/hooks/users/useUsers";
import { useDeleteUser } from "@/hooks/users/useDeleteUser";
import { useRestoreUser } from "@/hooks/users/useRestoreUser";
import { toTableUsers } from "./adapters";
import { useUsersColumns } from "./_components/usersColumns";
import CompactHeader from "@/components/common/CompactHeader";

const Users = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [deleteCandidate, setDeleteCandidate] = useState<number | null>(null);
  const [restoreCandidate, setRestoreCandidate] = useState<number | null>(null);

  const rowNumberStart = (currentPage - 1) * itemsPerPage + 1;

  const viewPermission = "users.read";
  const createPermission = "users.create";
  const editPermission = "users.update";
  const deletePermission = "users.delete";
  const restorePermission = "users.update";

  const { data: raw, isLoading } = useUsers({
    currentPage,
    itemsPerPage,
    searchQuery,
  });

  const adapted = toTableUsers(raw as any);
  const users = adapted?.data?.users ?? [];
  const totalItems = adapted?.total ?? 0;
  const totalPages = adapted?.totalPages ?? 1;

  const columns = useUsersColumns({
    onDelete: setDeleteCandidate,
    onRestore: setRestoreCandidate,
    editPermission,
    deletePermission,
    restorePermission,
  });

  const deleteMutation = useDeleteUser();
  const restoreMutation = useRestoreUser();

  const handleSearchSubmit = () => {
    setSearchQuery(searchTerm);
    setCurrentPage(1);
  };

  const handleDeleteConfirm = () => {
    if (!deleteCandidate) return;
    deleteMutation.mutate(deleteCandidate, {
      onSettled: () => setDeleteCandidate(null),
    });
  };

  const handleRestoreConfirm = () => {
    if (!restoreCandidate) return;
    restoreMutation.mutate(restoreCandidate, {
      onSettled: () => setRestoreCandidate(null),
    });
  };

  const handleExport = async () => {
    try {
      const res = await api.get("/users/export", {
        params: { search: searchQuery },
        responseType: "blob",
      });

      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `users_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("users.exportSuccess", {
          defaultValue: "Users exported successfully",
        }),
      });
    } catch (error: any) {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description:
          error?.response?.data?.message ||
          t("users.exportFailed", {
            defaultValue: "Failed to export users",
          }),
      });
    }
  };

  return (
    <ProtectedComponent permission={viewPermission}>
      <CrudPageLayout>
        <CompactHeader
          icon={<UsersIcon className="h-5 w-5 text-primary" />}
          title={t("users.title", { defaultValue: "Users" })}
          totalText={
            <>
              {totalItems}{" "}
              {t("users.totalUsers", { defaultValue: "total users" })}
            </>
          }
          search={{
            placeholder: t("users.searchPlaceholder", {
              defaultValue: "Search users...",
            }),
            value: searchTerm,
            onChange: setSearchTerm,
            onSubmit: handleSearchSubmit,
          }}
          right={
            <>
              <Button
                size="sm"
                variant="outline"
                className="h-auto px-3 py-2 text-xs"
                onClick={handleExport}
              >
                {t("users.export", { defaultValue: "Export" })}
              </Button>

              <ProtectedComponent permission={createPermission}>
                <Button
                  size="sm"
                  className="h-auto px-3 py-2 text-xs"
                  onClick={() => navigate("/settings/team/users/create")}
                >
                  <FaPlus className="mr-1.5 h-3.5 w-3.5" />
                  {t("users.create", { defaultValue: "Create User" })}
                </Button>
              </ProtectedComponent>
            </>
          }
        />

        <DataTableShell
          title={t("users.listTitle", { defaultValue: "Users List" })}
          totalItems={totalItems}
          currentCount={users.length}
          entityName={t("users.title", { defaultValue: "Users" })}
          itemsPerPage={itemsPerPage}
          setItemsPerPage={setItemsPerPage}
          setCurrentPage={setCurrentPage}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(value) => {
            setItemsPerPage(value);
            setCurrentPage(1);
          }}
        >
          <DataTable
            columns={columns}
            data={users}
            rowNumberStart={rowNumberStart}
            enableRowNumbers
            showExportCSV
            showExportExcel
            showPrint
            fileName="users"
            isLoading={isLoading}
          />
        </DataTableShell>

        <ConfirmDialog
          open={deleteCandidate !== null}
          onOpenChange={(open) => !open && setDeleteCandidate(null)}
          title={t("users.deleteTitle", { defaultValue: "Delete User" })}
          message={t("users.deleteMessage", {
            defaultValue: "Are you sure you want to delete this user?",
          })}
          confirmLabel={t("common.delete", { defaultValue: "Delete" })}
          cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
          onConfirm={handleDeleteConfirm}
          isPending={deleteMutation.isPending}
        />

        <ConfirmDialog
          open={restoreCandidate !== null}
          onOpenChange={(open) => !open && setRestoreCandidate(null)}
          title={t("users.restoreTitle", { defaultValue: "Restore User" })}
          message={t("users.restoreMessage", {
            defaultValue: "Are you sure you want to restore this user?",
          })}
          confirmLabel={t("common.restore", { defaultValue: "Restore" })}
          cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
          onConfirm={handleRestoreConfirm}
          isPending={restoreMutation.isPending}
        />
      </CrudPageLayout>
    </ProtectedComponent>
  );
};

export default Users;
