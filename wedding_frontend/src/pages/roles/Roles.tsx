import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ShieldCheck } from "lucide-react";
import { FaPlus } from "react-icons/fa";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import Pagination from "@/components/ui/pagination";
import ConfirmDialog from "@/components/ui/confirmDialog";
import TableHeader from "@/components/common/TableHeader";
import CompactHeader from "@/components/common/CompactHeader";
import { ProtectedComponent } from "@/components/routing/ProtectedComponent";

import { useRoles } from "@/hooks/roles/useRoles";
import { useDeleteRole } from "@/hooks/roles/useDeleteRole";
import { toTableRoles } from "./adapters";
import { useRolesColumns } from "./_components/rolesColumns";

const RolesPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [deleteCandidate, setDeleteCandidate] = useState<number | null>(null);

  const viewPermission = "roles.read";
  const createPermission = "roles.create";
  const editPermission = "roles.update";
  const deletePermission = "roles.delete";

  const { data: raw, isLoading } = useRoles();
  const adapted = toTableRoles(raw);
  const allRoles = adapted.data.roles;

  const filteredRoles = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return allRoles;
    }

    return allRoles.filter((role) => {
      const haystack = [
        role.name,
        role.description ?? "",
        ...role.permissions.map((permission) => permission.code),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [allRoles, searchQuery]);

  const totalItems = filteredRoles.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const rowNumberStart = (safeCurrentPage - 1) * itemsPerPage + 1;
  const paginatedRoles = filteredRoles.slice(
    (safeCurrentPage - 1) * itemsPerPage,
    safeCurrentPage * itemsPerPage,
  );

  const columns = useRolesColumns({
    onDelete: setDeleteCandidate,
    editPermission,
    deletePermission,
  });

  const deleteMutation = useDeleteRole();

  const handleSearchSubmit = () => {
    setSearchQuery(searchTerm);
    setCurrentPage(1);
  };

  const handleDeleteConfirm = () => {
    if (!deleteCandidate) {
      return;
    }

    deleteMutation.mutate(deleteCandidate, {
      onSettled: () => setDeleteCandidate(null),
    });
  };

  return (
    <ProtectedComponent permission={viewPermission}>
      <div className="min-h-screen space-y-4 bg-background p-4 text-foreground">
        <CompactHeader
          icon={<ShieldCheck className="h-5 w-5 text-primary" />}
          title={t("roles.title", { defaultValue: "Roles" })}
          totalText={
            <>
              {totalItems} {t("roles.totalRoles", { defaultValue: "total roles" })}
            </>
          }
          search={{
            placeholder: t("roles.searchPlaceholder", {
              defaultValue: "Search roles...",
            }),
            value: searchTerm,
            onChange: setSearchTerm,
            onSubmit: handleSearchSubmit,
          }}
          right={
            <ProtectedComponent permission={createPermission}>
              <Button
                size="sm"
                className="h-auto px-3 py-2 text-xs"
                onClick={() => navigate("/settings/team/roles/create")}
              >
                <FaPlus className="mr-1.5 h-3.5 w-3.5" />
                {t("roles.create", { defaultValue: "Create Role" })}
              </Button>
            </ProtectedComponent>
          }
        />

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <TableHeader
            title={t("roles.listTitle", { defaultValue: "Roles List" })}
            totalItems={totalItems}
            currentCount={paginatedRoles.length}
            entityName={t("roles.title", { defaultValue: "Roles" })}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setItemsPerPage}
            setCurrentPage={setCurrentPage}
          />

          <div className="overflow-hidden">
            <DataTable
              columns={columns}
              data={paginatedRoles}
              rowNumberStart={rowNumberStart}
              enableRowNumbers
              fileName="roles"
              isLoading={isLoading}
            />
          </div>

          {totalPages > 1 ? (
            <div className="border-t border-border bg-muted/40 px-6 py-4">
              <Pagination
                currentPage={safeCurrentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={(value) => {
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
          title={t("roles.deleteTitle", { defaultValue: "Delete Role" })}
          message={t("roles.deleteMessage", {
            defaultValue: "Are you sure you want to delete this role?",
          })}
          confirmLabel={t("common.delete", { defaultValue: "Delete" })}
          cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
          onConfirm={handleDeleteConfirm}
          isPending={deleteMutation.isPending}
        />
      </div>
    </ProtectedComponent>
  );
};

export default RolesPage;
