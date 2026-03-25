import { Pencil, Plus, Trash2 } from "lucide-react";
import type { TFunction } from "i18next";

import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EventServiceStatusBadge } from "@/pages/services/_components/eventServiceStatusBadge";
import {
  formatServiceCategory,
  getEventServiceDisplayName,
} from "@/pages/services/adapters";
import type { EventServiceItem, ServiceCategory } from "@/pages/services/types";
import {
  EventEmptyState,
  EventInfoBlock,
  EventMetaChip,
  EventPanelCard,
  EventViewToggle,
  type EventPanelViewMode,
} from "./EventDetailsPrimitives";

type Props = {
  serviceItems: EventServiceItem[];
  loading: boolean;
  summary: { itemsCount: number };
  viewMode: EventPanelViewMode;
  t: TFunction;
  onViewModeChange: (nextValue: EventPanelViewMode) => void;
  onAdd: () => void;
  onEdit: (serviceItem: EventServiceItem) => void;
  onDelete: (serviceItem: EventServiceItem) => void;
};

export function EventServicesPanel({
  serviceItems,
  loading,
  summary,
  viewMode,
  t,
  onViewModeChange,
  onAdd,
  onEdit,
  onDelete,
}: Props) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1.5">
          <CardTitle>
            {t("services.eventServices", { defaultValue: "Event Services" })}
          </CardTitle>
          <CardDescription>
            {t("services.eventServicesHint", {
              defaultValue:
                "Track the selected services and operational line items for this event.",
            })}
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <EventViewToggle
            value={viewMode}
            onChange={onViewModeChange}
            tableLabel={t("events.tableView", { defaultValue: "Table" })}
            gridLabel={t("events.gridView", { defaultValue: "Grid" })}
          />
          <ProtectedComponent permission="events.update">
            <Button onClick={onAdd}>
              <Plus className="h-4 w-4" />
              {t("services.addEventService", { defaultValue: "Add Event Service" })}
            </Button>
          </ProtectedComponent>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <EventInfoBlock
            label={t("services.summaryItems", { defaultValue: "Items" })}
            value={summary.itemsCount}
            helper={t("services.summaryItemsHint", {
              defaultValue: "Linked service line items currently assigned to this event.",
            })}
          />
        </div>

        {loading ? (
          <EventEmptyState
            title={t("common.loading", { defaultValue: "Loading..." })}
            description={t("services.loadingEventServices", {
              defaultValue: "Loading service items for this event.",
            })}
          />
        ) : serviceItems.length ? (
          viewMode === "table" ? (
            <div className="overflow-hidden rounded-[24px] border border-[var(--lux-row-border)] bg-[var(--lux-row-surface)]">
              <div className="overflow-x-auto">
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow className="border-[var(--lux-row-border)]">
                      <TableHead>{t("services.service", { defaultValue: "Service" })}</TableHead>
                      <TableHead>{t("services.categoryLabel", { defaultValue: "Category" })}</TableHead>
                      <TableHead>{t("services.eventStatusLabel", { defaultValue: "Status" })}</TableHead>
                      <TableHead>{t("services.sortOrder", { defaultValue: "Order" })}</TableHead>
                      <TableHead>{t("common.notes", { defaultValue: "Notes" })}</TableHead>
                      <TableHead>{t("common.actions", { defaultValue: "Actions" })}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {serviceItems.map((serviceItem) => (
                      <TableRow key={serviceItem.id} className="border-[var(--lux-row-border)]">
                        <TableCell className="align-top">
                          <div className="space-y-1">
                            <div className="font-medium text-[var(--lux-heading)]">
                              {getEventServiceDisplayName(serviceItem)}
                            </div>
                            {serviceItem.service?.code ? (
                              <div className="text-xs text-[var(--lux-text-secondary)]">
                                {t("services.code", { defaultValue: "Code" })}: {serviceItem.service.code}
                              </div>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="align-top text-[var(--lux-text-secondary)]">
                          {t(`services.category.${serviceItem.category}`, {
                            defaultValue: formatServiceCategory(
                              serviceItem.category as ServiceCategory,
                            ),
                          })}
                        </TableCell>
                        <TableCell className="align-top">
                          <EventServiceStatusBadge status={serviceItem.status} />
                        </TableCell>
                        <TableCell className="align-top text-[var(--lux-text-secondary)]">
                          {serviceItem.sortOrder}
                        </TableCell>
                        <TableCell className="max-w-[320px] align-top text-[var(--lux-text-secondary)]">
                          {serviceItem.notes || "-"}
                        </TableCell>
                        <TableCell className="align-top">
                          <ProtectedComponent permission="events.update">
                            <div className="flex flex-wrap gap-2">
                              <Button variant="outline" size="sm" onClick={() => onEdit(serviceItem)}>
                                <Pencil className="h-4 w-4" />
                                {t("common.edit", { defaultValue: "Edit" })}
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => onDelete(serviceItem)}>
                                <Trash2 className="h-4 w-4" />
                                {t("common.delete", { defaultValue: "Delete" })}
                              </Button>
                            </div>
                          </ProtectedComponent>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {serviceItems.map((serviceItem) => (
              <EventPanelCard
                key={serviceItem.id}
                className="flex h-full flex-col justify-between gap-5"
              >
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)] px-3 py-1.5 text-xs text-[var(--lux-text-secondary)]">
                        {t(`services.category.${serviceItem.category}`, {
                          defaultValue: formatServiceCategory(
                            serviceItem.category as ServiceCategory,
                          ),
                        })}
                      </span>
                      <EventServiceStatusBadge status={serviceItem.status} />
                    </div>
                    <EventMetaChip
                      label={t("services.sortOrder", { defaultValue: "Order" })}
                      value={serviceItem.sortOrder}
                    />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold leading-8 text-[var(--lux-heading)]">
                      {getEventServiceDisplayName(serviceItem)}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <EventMetaChip
                        label={t("services.categoryLabel", {
                          defaultValue: "Category",
                        })}
                        value={t(`services.category.${serviceItem.category}`, {
                          defaultValue: formatServiceCategory(
                            serviceItem.category as ServiceCategory,
                          ),
                        })}
                      />
                      {serviceItem.service?.code ? (
                        <EventMetaChip
                          label={t("services.code", { defaultValue: "Code" })}
                          value={serviceItem.service.code}
                        />
                      ) : null}
                    </div>
                  </div>

                  {serviceItem.notes ? (
                    <div className="rounded-[18px] border border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)] px-4 py-3.5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
                        {t("common.notes", { defaultValue: "Notes" })}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[var(--lux-text-secondary)]">
                        {serviceItem.notes}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm leading-6 text-[var(--lux-text-secondary)]">
                      {t("services.noNotesHint", {
                        defaultValue: "No internal notes have been added to this service line yet.",
                      })}
                    </p>
                  )}
                </div>

                <ProtectedComponent permission="events.update">
                  <div className="flex flex-wrap gap-2 border-t border-[var(--lux-row-border)] pt-4">
                    <Button variant="outline" onClick={() => onEdit(serviceItem)}>
                      <Pencil className="h-4 w-4" />
                      {t("common.edit", { defaultValue: "Edit" })}
                    </Button>
                    <Button variant="destructive" onClick={() => onDelete(serviceItem)}>
                      <Trash2 className="h-4 w-4" />
                      {t("common.delete", { defaultValue: "Delete" })}
                    </Button>
                  </div>
                </ProtectedComponent>
              </EventPanelCard>
            ))}
          </div>
          )
        ) : (
          <EventEmptyState
            title={t("services.noEventServicesTitle", {
              defaultValue: "No service items yet",
            })}
            description={t("services.noEventServices", {
              defaultValue: "No service items have been added to this event yet.",
            })}
          />
        )}
      </CardContent>
    </Card>
  );
}
