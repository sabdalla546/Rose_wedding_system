/* eslint-disable @typescript-eslint/no-explicit-any */
import type { CheckedState } from "@radix-ui/react-checkbox";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Users } from "lucide-react";

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

import { useUser } from "@/hooks/users/useUsers";
import { useRoles, type RoleOption } from "@/hooks/roles/useRoles";
import { useCreateUser, useUpdateUser } from "@/hooks/users/useUserMutations";

const baseSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  roleIds: z.array(z.number()).min(1, "At least one role is required"),
  isActive: z.boolean().default(true),
  password: z.string().optional(),
});

const createSchema = baseSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const editSchema = baseSchema;

type FormValues = z.infer<typeof baseSchema>;

const sectionTitleClass = "text-lg font-semibold text-[var(--lux-heading)]";
const sectionHintClass = "text-sm text-[var(--lux-text-secondary)]";

const UserForm = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

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
        roleIds: (user.Roles ?? []).map((role) => Number(role.id)).filter(Boolean),
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
      <PageContainer
        className="pb-4 pt-4 text-foreground"
      >
        <div
          dir={i18n.dir()}
          className="mx-auto w-full max-w-5xl space-y-6"
        >
          <button
            type="button"
            onClick={() => navigate("/settings/team/users")}
            className="inline-flex items-center gap-2 text-sm text-[var(--lux-text-secondary)] transition-colors hover:text-[var(--lux-gold)]"
          >
            {"<-"} {t("users.backToUsers", { defaultValue: "Back to Users" })}
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
                <Users className="h-6 w-6" />
              </div>

              <div className="space-y-1">
                <h1 className="text-xl font-bold text-[var(--lux-heading)]">
                  {isEditMode
                    ? t("users.editTitle", { defaultValue: "Edit User" })
                    : t("users.createTitle", { defaultValue: "Create User" })}
                </h1>
                <p className="text-sm text-[var(--lux-text-secondary)]">
                  {isEditMode
                    ? t("users.editDescription", {
                        defaultValue: "Update user details, roles, and status.",
                      })
                    : t("users.createDescription", {
                        defaultValue:
                          "Create a new system user and assign roles.",
                      })}
                </p>
              </div>
            </div>
          </div>

          <Card className="flex min-h-[calc(100dvh-23rem)] flex-col overflow-hidden rounded-[24px]">
            <div className="flex flex-1 flex-col p-6 md:p-8">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="flex flex-1 flex-col"
                >
                  <div className="space-y-8">
                    <section className="space-y-4">
                      <div
                        className="border-b pb-3"
                        style={{ borderColor: "var(--lux-row-border)" }}
                      >
                        <h2 className={sectionTitleClass}>
                          {t("users.basicInformation", {
                            defaultValue: "Basic Information",
                          })}
                        </h2>
                        <p className={sectionHintClass}>
                          {t("users.basicInformationHint", {
                            defaultValue: "Enter the main user information.",
                          })}
                        </p>
                      </div>

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
                                  placeholder="user@example.com"
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
                                    placeholder="********"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ) : null}
                      </div>
                    </section>

                    <section className="space-y-4">
                      <div
                        className="border-b pb-3"
                        style={{ borderColor: "var(--lux-row-border)" }}
                      >
                        <h2 className={sectionTitleClass}>
                          {t("users.rolesSection", { defaultValue: "Roles" })}
                        </h2>
                        <p className={sectionHintClass}>
                          {t("users.rolesSectionHint", {
                            defaultValue:
                              "Assign one or more roles to this user.",
                          })}
                        </p>
                      </div>

                      <FormField
                        control={form.control}
                        name="roleIds"
                        render={({ field }) => {
                          const selected = field.value || [];

                          const toggleRole = (roleId: number) => {
                            if (selected.includes(roleId)) {
                              field.onChange(selected.filter((value) => value !== roleId));
                              return;
                            }

                            field.onChange([...selected, roleId]);
                          };

                          return (
                            <FormItem>
                              <div
                                className="space-y-3 rounded-[20px] border p-4"
                                style={{
                                  background: "var(--lux-control-hover)",
                                  borderColor: "var(--lux-row-border)",
                                }}
                              >
                                {roles.length ? (
                                  roles.map((role: RoleOption) => (
                                    <label
                                      key={role.id}
                                      className="flex cursor-pointer items-center gap-3 rounded-[16px] border px-3 py-3 transition-colors"
                                      style={{
                                        background: "var(--lux-row-surface)",
                                        borderColor: "var(--lux-row-border)",
                                      }}
                                    >
                                      <Checkbox
                                        checked={selected.includes(role.id)}
                                        onCheckedChange={() => toggleRole(role.id)}
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
                    </section>

                    <section className="space-y-4">
                      <div
                        className="border-b pb-3"
                        style={{ borderColor: "var(--lux-row-border)" }}
                      >
                        <h2 className={sectionTitleClass}>
                          {t("users.statusSection", { defaultValue: "Status" })}
                        </h2>
                      </div>

                      <FormField
                        control={form.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem>
                            <div
                              className="flex items-center gap-3 rounded-[20px] border p-4"
                              style={{
                                background: "var(--lux-control-hover)",
                                borderColor: "var(--lux-row-border)",
                              }}
                            >
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
                    </section>
                  </div>

                  <div
                    className="mt-auto flex flex-col justify-end gap-3 pt-6 sm:flex-row"
                    style={{ borderTop: "1px solid var(--lux-row-border)" }}
                  >
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

export default UserForm;
