import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { Edit, ImageOff, Package2, Trash2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState } from "react";

import { PageContainer } from "@/components/layout/page-container";
import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import { CrudDetailsSection } from "@/components/shared/crud-layout";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ConfirmDialog from "@/components/ui/confirmDialog";
import { useInventoryItem } from "@/hooks/inventory/useInventory";
import { useDeleteInventoryItem } from "@/hooks/inventory/useInventoryMutations";

import { formatInventoryQuantity, getInventoryStockStatus } from "./adapters";
import { InventoryStockBadge } from "./_components/InventoryStockBadge";

function DetailItem({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
        {label}
      </p>
      <p className="text-sm text-[var(--lux-text)]">{value || "-"}</p>
    </div>
  );
}

const InventoryDetailsPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: item, isLoading } = useInventoryItem(id);
  const deleteMutation = useDeleteInventoryItem();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const dateLocale = i18n.language === "ar" ? ar : enUS;

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-sm text-[var(--lux-text-secondary)]">
          {t("common.loading", { defaultValue: "Loading..." })}
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-sm text-[var(--lux-text-secondary)]">
          {t("common.noResultsTitle", { defaultValue: "No results found" })}
        </div>
      </div>
    );
  }

  const stockStatus = getInventoryStockStatus(item.quantity);

  return (
    <ProtectedComponent permission="inventory.read">
      <PageContainer className="pb-4 pt-4 text-foreground">
        <div dir={i18n.dir()} className="mx-auto w-full max-w-6xl space-y-6">
          <button
            type="button"
            onClick={() => navigate("/inventory")}
            className="inline-flex items-center gap-2 text-sm text-[var(--lux-text-secondary)] transition-colors hover:text-[var(--lux-gold)]"
          >
            {"<-"}{" "}
            {t("inventory.backToInventory", {
              defaultValue: "Back to Inventory",
            })}
          </button>

          <SectionCard className="space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-[18px] border"
                  style={{
                    background: "var(--lux-control-hover)",
                    borderColor: "var(--lux-control-border)",
                    color: "var(--lux-gold)",
                  }}
                >
                  <Package2 className="h-6 w-6" />
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-bold text-[var(--lux-heading)]">
                      {item.name}
                    </h1>
                    <InventoryStockBadge
                      status={stockStatus}
                      quantity={item.quantity}
                    />
                  </div>
                  <p className="text-sm text-[var(--lux-text-secondary)]">
                    {t("inventory.currentQuantity", {
                      defaultValue: "Current quantity",
                    })}
                    {": "}
                    {formatInventoryQuantity(item.quantity)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <ProtectedComponent permission="inventory.update">
                  <Button onClick={() => navigate(`/inventory/edit/${item.id}`)}>
                    <Edit className="h-4 w-4" />
                    {t("common.edit", { defaultValue: "Edit" })}
                  </Button>
                </ProtectedComponent>
                <ProtectedComponent permission="inventory.delete">
                  <Button
                    variant="destructive"
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                    {t("common.delete", { defaultValue: "Delete" })}
                  </Button>
                </ProtectedComponent>
              </div>
            </div>
          </SectionCard>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>
                  {t("inventory.image", { defaultValue: "Image" })}
                </CardTitle>
                <CardDescription>
                  {t("inventory.imageSectionHint", {
                    defaultValue:
                      "Optional reference photo used by the team to identify this stock item.",
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {item.imageUrl ? (
                  <div className="overflow-hidden rounded-[22px] border border-[var(--lux-control-border)] bg-[var(--lux-control-hover)]">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-[320px] w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-[320px] flex-col items-center justify-center gap-3 rounded-[22px] border border-dashed border-[var(--lux-control-border)] bg-[var(--lux-control-hover)] px-6 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[var(--lux-control-border)] bg-[var(--lux-panel-surface)] text-[var(--lux-gold)]">
                      <ImageOff className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-[var(--lux-heading)]">
                        {t("inventory.noImage", {
                          defaultValue: "No image uploaded",
                        })}
                      </p>
                      <p className="text-xs text-[var(--lux-text-secondary)]">
                        {t("inventory.noImageHint", {
                          defaultValue:
                            "This item does not currently have a reference image.",
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {t("inventory.basicInformation", {
                      defaultValue: "Basic Information",
                    })}
                  </CardTitle>
                  <CardDescription>
                    {t("inventory.basicInformationHint", {
                      defaultValue:
                        "Core product information and current stock status for this independent catalog item.",
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <DetailItem
                    label={t("inventory.name", {
                      defaultValue: "Product Name",
                    })}
                    value={item.name}
                  />
                  <DetailItem
                    label={t("inventory.quantity", {
                      defaultValue: "Quantity",
                    })}
                    value={formatInventoryQuantity(item.quantity)}
                  />
                  <DetailItem
                    label={t("inventory.stockStatus", {
                      defaultValue: "Stock Status",
                    })}
                    value={
                      stockStatus === "in_stock"
                        ? t("inventory.status.inStock", {
                            defaultValue: "In Stock",
                          })
                        : t("inventory.status.outOfStock", {
                            defaultValue: "Out of Stock",
                          })
                    }
                  />
                  <DetailItem
                    label={t("inventory.imagePath", {
                      defaultValue: "Image Path",
                    })}
                    value={item.imagePath}
                  />
                </CardContent>
              </Card>

              <CrudDetailsSection
                title={t("inventory.auditTrail", {
                  defaultValue: "Audit Trail",
                })}
                description={t("inventory.auditTrailHint", {
                  defaultValue:
                    "Track who created the item and when the catalog record was updated.",
                })}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailItem
                    label={t("inventory.createdBy", {
                      defaultValue: "Created By",
                    })}
                    value={item.createdByUser?.fullName}
                  />
                  <DetailItem
                    label={t("inventory.updatedBy", {
                      defaultValue: "Updated By",
                    })}
                    value={item.updatedByUser?.fullName}
                  />
                  <DetailItem
                    label={t("inventory.createdAt", {
                      defaultValue: "Created At",
                    })}
                    value={
                      item.createdAt
                        ? format(new Date(item.createdAt), "MMM d, yyyy p", {
                            locale: dateLocale,
                          })
                        : "-"
                    }
                  />
                  <DetailItem
                    label={t("inventory.updatedAt", {
                      defaultValue: "Updated At",
                    })}
                    value={
                      item.updatedAt
                        ? format(new Date(item.updatedAt), "MMM d, yyyy p", {
                            locale: dateLocale,
                          })
                        : "-"
                    }
                  />
                </div>
              </CrudDetailsSection>
            </div>
          </div>

          <ConfirmDialog
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            title={t("inventory.deleteTitle", {
              defaultValue: "Delete Inventory Item",
            })}
            message={t("inventory.deleteMessage", {
              defaultValue:
                "Are you sure you want to delete this inventory item?",
            })}
            confirmLabel={t("common.delete", { defaultValue: "Delete" })}
            cancelLabel={t("common.cancel", { defaultValue: "Cancel" })}
            isPending={deleteMutation.isPending}
            onConfirm={() =>
              deleteMutation.mutate(item.id, {
                onSuccess: () => navigate("/inventory"),
                onSettled: () => setDeleteOpen(false),
              })
            }
          />
        </div>
      </PageContainer>
    </ProtectedComponent>
  );
};

export default InventoryDetailsPage;
