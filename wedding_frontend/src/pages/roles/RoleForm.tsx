import type { CheckedState } from "@radix-ui/react-checkbox";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { ShieldCheck } from "lucide-react";

import { Card } from "@/components/ui/card";
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
import { PageContainer } from "@/components/layout/page-container";

import { useRole } from "@/hooks/roles/useRoles";
import { usePermissions } from "@/hooks/permissions/usePermissions";
import { useCreateRole, useUpdateRole } from "@/hooks/roles/useRoleMutations";
import type { Permission } from "@/pages/roles/types";

const roleSchema = z.object({
  name: z.string().min(2, "Role name is required"),
  description: z.string().optional(),
  permissionIds: z
    .array(z.number())
    .min(1, "At least one permission is required"),
});

type FormValues = z.infer<typeof roleSchema>;

const sectionTitleClass = "text-lg font-semibold text-[var(--lux-heading)]";
const sectionHintClass = "text-sm text-[var(--lux-text-secondary)]";

const RoleFormPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const [permissionSearch, setPermissionSearch] = useState("");

  const { data: role, isLoading: roleLoading } = useRole(id);
  const { data: permissionsRes, isLoading: permissionsLoading } =
    usePermissions();
  const permissions = permissionsRes?.data ?? [];

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
      <PageContainer className="pb-4 pt-4 text-foreground">
        <div dir={i18n.dir()} className="mx-auto w-full max-w-5xl space-y-6">
          <button
            type="button"
            onClick={() => navigate("/settings/team/roles")}
            className="inline-flex items-center gap-2 text-sm text-[var(--lux-text-secondary)] transition-colors hover:text-[var(--lux-gold)]"
          >
            {"<-"} {t("roles.backToRoles", { defaultValue: "Back to Roles" })}
          </button>

          <div
            className="overflow-hidden rounded-[24px] border p-4 shadow-luxe"
            style={{
              background: "var(--lux-panel-surface)",
              borderColor: "var(--lux-panel-border)",
            }}
          >
            <div className="flex items-start gap-4">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-[18px] border"
                style={{
                  background: "var(--lux-control-hover)",
                  borderColor: "var(--lux-control-border)",
                  color: "var(--lux-gold)",
                }}
              >
                <ShieldCheck className="h-6 w-6" />
              </div>

              <div className="space-y-1">
                <h1 className="text-xl font-bold text-[var(--lux-heading)]">
                  {isEditMode
                    ? t("roles.editTitle", { defaultValue: "Edit Role" })
                    : t("roles.createTitle", { defaultValue: "Create Role" })}
                </h1>
                <p className="text-sm text-[var(--lux-text-secondary)]">
                  {isEditMode
                    ? t("roles.editDescription", {
                        defaultValue:
                          "Update role details and assigned permissions.",
                      })
                    : t("roles.createDescription", {
                        defaultValue:
                          "Create a new role and assign permissions.",
                      })}
                </p>
              </div>
            </div>
          </div>

          <Card className="overflow-hidden rounded-[24px]">
            <div className="p-6 md:p-8">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-8"
                >
                  <section className="space-y-4">
                    <div
                      className="border-b pb-3"
                      style={{ borderColor: "var(--lux-row-border)" }}
                    >
                      <h2 className={sectionTitleClass}>
                        {t("roles.basicInformation", {
                          defaultValue: "Basic Information",
                        })}
                      </h2>
                      <p className={sectionHintClass}>
                        {t("roles.basicInformationHint", {
                          defaultValue: "Enter the main role information.",
                        })}
                      </p>
                    </div>

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
                  </section>

                  <section className="space-y-4">
                    <div
                      className="border-b pb-3"
                      style={{ borderColor: "var(--lux-row-border)" }}
                    >
                      <h2 className={sectionTitleClass}>
                        {t("roles.permissions", {
                          defaultValue: "Permissions",
                        })}
                      </h2>
                      <p className={sectionHintClass}>
                        {t("roles.permissionsHint", {
                          defaultValue:
                            "Assign one or more permissions to this role.",
                        })}
                      </p>
                    </div>

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

                              <div
                                className="space-y-3 rounded-[20px] border p-4"
                                style={{
                                  background: "var(--lux-control-hover)",
                                  borderColor: "var(--lux-row-border)",
                                }}
                              >
                                {filteredPermissions.length ? (
                                  filteredPermissions.map(
                                    (permission: Permission) => (
                                      <label
                                        key={permission.id}
                                        className="flex cursor-pointer items-center gap-3 rounded-[16px] border px-3 py-3 transition-colors"
                                        style={{
                                          background: "var(--lux-row-surface)",
                                          borderColor: "var(--lux-row-border)",
                                        }}
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
                  </section>

                  <div
                    className="flex flex-col justify-end gap-3 pt-6 sm:flex-row"
                    style={{ borderTop: "1px solid var(--lux-row-border)" }}
                  >
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
                  </div>
                </form>
              </Form>
            </div>
          </Card>
        </div>
      </PageContainer>
    </ProtectedComponent>
  );
};

export default RoleFormPage;
