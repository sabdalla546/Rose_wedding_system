/* eslint-disable @typescript-eslint/no-explicit-any */
import type { CheckedState } from "@radix-ui/react-checkbox";
import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Users } from "lucide-react";

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

import { useUser } from "@/hooks/users/useUsers";
import { useRoles, type RoleOption } from "@/hooks/roles/useRoles";
import { useCreateUser, useUpdateUser } from "@/hooks/users/useUserMutations";

const UserForm = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const baseSchema = useMemo(
    () =>
      z.object({
        fullName: z
          .string()
          .min(
            1,
            t("users.validation.fullNameRequired", {
              defaultValue: "Full name is required",
            }),
          ),
        email: z.string().email(
          t("users.validation.emailInvalid", {
            defaultValue: "Invalid email address",
          }),
        ),
        phone: z.string().optional(),
        roleIds: z.array(z.number()).min(
          1,
          t("users.validation.roleRequired", {
            defaultValue: "At least one role is required",
          }),
        ),
        isActive: z.boolean().default(true),
        password: z.string().optional(),
      }),
    [t],
  );

  type FormValues = z.infer<typeof baseSchema>;

  const createSchema = useMemo(
    () =>
      baseSchema.extend({
        password: z.string().min(
          6,
          t("users.validation.passwordMin", {
            defaultValue: "Password must be at least 6 characters",
          }),
        ),
      }),
    [baseSchema, t],
  );

  const editSchema = baseSchema;

  const { data: user, isLoading: userLoading } = useUser(id);
  const { data: rolesRes, isLoading: rolesLoading } = useRoles();
  const roles = rolesRes?.data ?? [];

  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser(id);

  const form = useForm<FormValues>({
    resolver: zodResolver(isEditMode ? editSchema : createSchema) as any,
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      roleIds: [],
      isActive: true,
      password: "",
    },
  });

  useEffect(() => {
    if (isEditMode && user) {
      form.reset({
        fullName: user.fullName,
        email: user.email,
        phone: user.phone ?? "",
        roleIds: (user.Roles ?? [])
          .map((role) => Number(role.id))
          .filter(Boolean),
        isActive: user.isActive,
        password: "",
      });
    }
  }, [form, isEditMode, user]);

  const onSubmit: SubmitHandler<FormValues> = (values) => {
    if (isEditMode) {
      updateMutation.mutate(values);
      return;
    }

    createMutation.mutate(values);
  };

  const isBusy =
    userLoading ||
    rolesLoading ||
    createMutation.isPending ||
    updateMutation.isPending;

  if (userLoading || rolesLoading) {
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
      permission={isEditMode ? "users.update" : "users.create"}
    >
      <CrudPageLayout>
        <div dir={i18n.dir()}>
          <CrudFormLayout
            icon={<Users className="h-5 w-5 text-primary" />}
            title={
              isEditMode
                ? t("users.editTitle", { defaultValue: "Edit User" })
                : t("users.createTitle", { defaultValue: "Create User" })
            }
            description={
              isEditMode
                ? t("users.editDescription", {
                    defaultValue: "Update user details, roles, and status.",
                  })
                : t("users.createDescription", {
                    defaultValue:
                      "Create a new system user and assign roles.",
                  })
            }
            backAction={
              <button
                type="button"
                onClick={() => navigate("/settings/team/users")}
                className="crud-header-back"
              >
                <span aria-hidden="true">{"<-"}</span>
                {t("users.backToUsers", { defaultValue: "Back to Users" })}
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
                    title={t("users.basicInformation", {
                      defaultValue: "Basic Information",
                    })}
                    description={t("users.basicInformationHint", {
                      defaultValue: "Enter the main user information.",
                    })}
                  >
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("users.fullName", {
                                defaultValue: "Full Name",
                              })}
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder={t("users.fullNamePlaceholder", {
                                  defaultValue: "Enter full name",
                                })}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("users.email", { defaultValue: "Email" })}
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                {...field}
                                placeholder={t("users.emailPlaceholder", {
                                  defaultValue: "user@example.com",
                                })}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("users.phone", { defaultValue: "Phone" })}
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder={t("users.phonePlaceholder", {
                                  defaultValue: "Enter phone number",
                                })}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {!isEditMode ? (
                        <FormField
                          control={form.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {t("users.password", {
                                  defaultValue: "Password",
                                })}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  {...field}
                                  placeholder={t("users.passwordPlaceholder", {
                                    defaultValue: "********",
                                  })}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ) : null}
                    </div>
                  </CrudFormSection>

                  <CrudFormSection
                    title={t("users.rolesSection", { defaultValue: "Roles" })}
                    description={t("users.rolesSectionHint", {
                      defaultValue: "Assign one or more roles to this user.",
                    })}
                  >
                    <FormField
                      control={form.control}
                      name="roleIds"
                      render={({ field }) => {
                        const selected = field.value || [];

                        const toggleRole = (roleId: number) => {
                          if (selected.includes(roleId)) {
                            field.onChange(
                              selected.filter((value) => value !== roleId),
                            );
                            return;
                          }

                          field.onChange([...selected, roleId]);
                        };

                        return (
                          <FormItem>
                            <div className="form-selection-panel">
                              {roles.length ? (
                                roles.map((role: RoleOption) => (
                                  <label
                                    key={role.id}
                                    className="form-selection-item"
                                  >
                                    <Checkbox
                                      checked={selected.includes(role.id)}
                                      onCheckedChange={() =>
                                        toggleRole(role.id)
                                      }
                                    />
                                    <div className="flex flex-col">
                                      <span className="font-medium text-[var(--lux-text)]">
                                        {role.name}
                                      </span>
                                      {role.description ? (
                                        <span className="text-xs text-[var(--lux-text-secondary)]">
                                          {role.description}
                                        </span>
                                      ) : null}
                                    </div>
                                  </label>
                                ))
                              ) : (
                                <p className="text-sm text-[var(--lux-text-secondary)]">
                                  {t("users.noRolesAvailable", {
                                    defaultValue: "No roles available",
                                  })}
                                </p>
                              )}
                            </div>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  </CrudFormSection>

                  <CrudFormSection
                    title={t("users.statusSection", { defaultValue: "Status" })}
                  >
                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem>
                          <div className="form-status-card">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={(checked: CheckedState) =>
                                  field.onChange(Boolean(checked))
                                }
                              />
                            </FormControl>
                            <FormLabel className="cursor-pointer text-[var(--lux-text)]">
                              {t("users.activeUser", {
                                defaultValue: "Active user",
                              })}
                            </FormLabel>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CrudFormSection>

                  <CrudActionsBar>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/settings/team/users")}
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

export default UserForm;
