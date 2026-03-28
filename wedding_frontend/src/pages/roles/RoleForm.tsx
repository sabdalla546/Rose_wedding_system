import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { ShieldCheck } from "lucide-react";
import type { CheckedState } from "@radix-ui/react-checkbox";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import {
  CrudActionsBar,
  CrudFormLayout,
  CrudFormSection,
  CrudPageLayout,
} from "@/components/shared/crud-layout";

import { useRole } from "@/hooks/roles/useRoles";
import { usePermissions } from "@/hooks/permissions/usePermissions";
import { useCreateRole, useUpdateRole } from "@/hooks/roles/useRoleMutations";
import type { Permission } from "@/pages/roles/types";

type FormValues = {
  name: string;
  description?: string;
  permissionIds: number[];
};

const RoleFormPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const [permissionSearch, setPermissionSearch] = useState("");

  const roleSchema = useMemo(
    () =>
      z.object({
        name: z
          .string()
          .min(
            2,
            t("roles.validation.nameRequired", {
              defaultValue: "Role name is required",
            }),
          ),
        description: z.string().optional(),
        permissionIds: z.array(z.number()).min(
          1,
          t("roles.validation.permissionRequired", {
            defaultValue: "At least one permission is required",
          }),
        ),
      }),
    [t],
  );

  const { data: role, isLoading: roleLoading } = useRole(id);
  const { data: permissionsRes, isLoading: permissionsLoading } =
    usePermissions();
  const permissions = useMemo(
    () => permissionsRes?.data ?? [],
    [permissionsRes?.data],
  );

  const createMutation = useCreateRole();
  const updateMutation = useUpdateRole(id);

  const form = useForm<FormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
      description: "",
      permissionIds: [],
    },
  });

  useEffect(() => {
    if (isEditMode && role) {
      form.reset({
        name: role.name,
        description: role.description ?? "",
        permissionIds: (role.Permissions ?? []).map(
          (permission) => permission.id,
        ),
      });
    }
  }, [form, isEditMode, role]);

  const filteredPermissions = useMemo(() => {
    const normalizedSearch = permissionSearch.trim().toLowerCase();

    if (!normalizedSearch) {
      return permissions;
    }

    return permissions.filter((permission) =>
      [permission.code, permission.description ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [permissionSearch, permissions]);

  const onSubmit: SubmitHandler<FormValues> = (values) => {
    if (isEditMode) {
      updateMutation.mutate(values);
      return;
    }

    createMutation.mutate(values);
  };

  const isBusy =
    roleLoading ||
    permissionsLoading ||
    createMutation.isPending ||
    updateMutation.isPending;

  if (roleLoading || permissionsLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-sm text-[var(--lux-text-secondary)]">
          {t("common.loading", { defaultValue: "Loading..." })}
        </div>
      </div>
    );
  }

  return (
    <ProtectedComponent
      permission={isEditMode ? "roles.update" : "roles.create"}
    >
      <CrudPageLayout>
        <div dir={i18n.dir()}>
          <CrudFormLayout
            icon={<ShieldCheck className="h-5 w-5 text-primary" />}
            title={
              isEditMode
                ? t("roles.editTitle", { defaultValue: "Edit Role" })
                : t("roles.createTitle", { defaultValue: "Create Role" })
            }
            description={
              isEditMode
                ? t("roles.editDescription", {
                    defaultValue:
                      "Update role details and assigned permissions.",
                  })
                : t("roles.createDescription", {
                    defaultValue:
                      "Create a new role and assign permissions.",
                  })
            }
            backAction={
              <button
                type="button"
                onClick={() => navigate("/settings/team/roles")}
                className="crud-header-back"
              >
                <span aria-hidden="true">{"<-"}</span>
                {t("roles.backToRoles", { defaultValue: "Back to Roles" })}
              </button>
            }
          >
            <div className="p-6 md:p-8">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-8"
                >
                  <CrudFormSection
                    title={t("roles.basicInformation", {
                      defaultValue: "Basic Information",
                    })}
                    description={t("roles.basicInformationHint", {
                      defaultValue: "Enter the main role information.",
                    })}
                  >
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("roles.name", { defaultValue: "Name" })}
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder={t("roles.namePlaceholder", {
                                  defaultValue: "Enter role name",
                                })}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("roles.description", {
                                defaultValue: "Description",
                              })}
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder={t("roles.descriptionPlaceholder", {
                                  defaultValue: "Enter role description",
                                })}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CrudFormSection>

                  <CrudFormSection
                    title={t("roles.permissions", {
                      defaultValue: "Permissions",
                    })}
                    description={t("roles.permissionsHint", {
                      defaultValue:
                        "Assign one or more permissions to this role.",
                    })}
                  >
                    <FormField
                      control={form.control}
                      name="permissionIds"
                      render={({ field }) => {
                        const selected = field.value || [];

                        const togglePermission = (permissionId: number) => {
                          if (selected.includes(permissionId)) {
                            field.onChange(
                              selected.filter(
                                (value) => value !== permissionId,
                              ),
                            );
                            return;
                          }

                          field.onChange([...selected, permissionId]);
                        };

                        return (
                          <FormItem>
                            <div className="space-y-4">
                              <Input
                                value={permissionSearch}
                                onChange={(event) =>
                                  setPermissionSearch(event.target.value)
                                }
                                placeholder={t(
                                  "roles.permissionsSearchPlaceholder",
                                  {
                                    defaultValue: "Search permissions...",
                                  },
                                )}
                              />

                              <div className="form-selection-panel">
                                {filteredPermissions.length ? (
                                  filteredPermissions.map(
                                    (permission: Permission) => (
                                      <label
                                        key={permission.id}
                                        className="form-selection-item"
                                      >
                                        <Checkbox
                                          checked={selected.includes(
                                            permission.id,
                                          )}
                                          onCheckedChange={(
                                            checked: CheckedState,
                                          ) => {
                                            if (checked === "indeterminate") {
                                              return;
                                            }

                                            togglePermission(permission.id);
                                          }}
                                        />
                                        <div className="flex flex-col">
                                          <span className="font-medium text-[var(--lux-text)]">
                                            {permission.code}
                                          </span>
                                          {permission.description ? (
                                            <span className="text-xs text-[var(--lux-text-secondary)]">
                                              {permission.description}
                                            </span>
                                          ) : null}
                                        </div>
                                      </label>
                                    ),
                                  )
                                ) : (
                                  <p className="text-sm text-[var(--lux-text-secondary)]">
                                    {t("roles.noPermissionsAvailable", {
                                      defaultValue: "No permissions available",
                                    })}
                                  </p>
                                )}
                              </div>
                            </div>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  </CrudFormSection>

                  <CrudActionsBar>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/settings/team/roles")}
                      disabled={isBusy}
                    >
                      {t("common.cancel", { defaultValue: "Cancel" })}
                    </Button>

                    <Button type="submit" disabled={isBusy}>
                      {isBusy
                        ? t("common.processing", {
                            defaultValue: "Processing...",
                          })
                        : isEditMode
                          ? t("common.update", { defaultValue: "Update" })
                          : t("common.create", { defaultValue: "Create" })}
                    </Button>
                  </CrudActionsBar>
                </form>
              </Form>
            </div>
          </CrudFormLayout>
        </div>
      </CrudPageLayout>
    </ProtectedComponent>
  );
};

export default RoleFormPage;
