import { CheckCircle2, GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
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
  EventEmptyState,
  EventInfoBlock,
  EventMetaChip,
  EventPanelCard,
} from "./EventDetailsPrimitives";
import { formatEventSectionType } from "../adapters";
import type { EventSection } from "../types";

function renderDataValue(value: unknown) {
  if (value === null || typeof value === "undefined" || value === "") {
    return "-";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (Array.isArray(value)) {
    return value.length ? value.join(", ") : "-";
  }

  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
}

type Props = {
  sections: EventSection[];
  t: TFunction;
  onAdd?: () => void;
  onEdit?: (section: EventSection) => void;
  onDelete?: (section: EventSection) => void;
};

export function EventSectionsPanel({
  sections,
  t,
  onAdd,
  onEdit,
  onDelete,
}: Props) {
  const hasActions = Boolean(onAdd || onEdit || onDelete);
  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1.5">
          <CardTitle>
            {t("events.sectionsTitle", { defaultValue: "Event Sections" })}
          </CardTitle>
          <CardDescription>
            {t("events.sectionsHint", {
              defaultValue: "Manage the ordered planning sections for this event.",
            })}
          </CardDescription>
        </div>
        {onAdd ? (
          <ProtectedComponent permission="events.update">
            <Button onClick={onAdd}>
              <Plus className="h-4 w-4" />
              {t("events.addSection", { defaultValue: "Add Section" })}
            </Button>
          </ProtectedComponent>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {sections.length ? (
          sections.map((section) => {
            const sectionTitle =
              section.title ||
              t(`events.sectionType.${section.sectionType}`, {
                defaultValue: formatEventSectionType(section.sectionType),
              });

            return (
              <EventPanelCard key={section.id} className="space-y-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <EventMetaChip
                        value={
                          <span className="inline-flex items-center gap-2">
                            <GripVertical className="h-3.5 w-3.5 text-[var(--lux-text-muted)]" />
                            {t(`events.sectionType.${section.sectionType}`, {
                              defaultValue: formatEventSectionType(section.sectionType),
                            })}
                          </span>
                        }
                      />
                      <EventMetaChip
                        label={t("events.sortOrder", {
                          defaultValue: "Sort Order",
                        })}
                        value={section.sortOrder}
                      />
                      {section.isCompleted ? (
                        <div className="inline-flex items-center gap-1.5 rounded-full border border-[color:color-mix(in_srgb,#059669_34%,transparent)] bg-[color:color-mix(in_srgb,#059669_14%,transparent)] px-3 py-1.5 text-xs font-medium text-[#34d399]">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {t("events.completed", { defaultValue: "Completed" })}
                        </div>
                      ) : null}
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-lg font-semibold leading-7 text-[var(--lux-heading)]">
                        {sectionTitle}
                      </h3>
                      <p className="text-sm leading-6 text-[var(--lux-text-secondary)]">
                        {t("events.sectionDataOverview", {
                          defaultValue:
                            "Operational details, structured values, and planning remarks for this section.",
                        })}
                      </p>
                    </div>
                  </div>

                  {hasActions ? (
                    <ProtectedComponent permission="events.update">
                      <div className="flex flex-wrap gap-2 xl:justify-end">
                        {onEdit ? (
                          <Button variant="outline" onClick={() => onEdit(section)}>
                            <Pencil className="h-4 w-4" />
                            {t("common.edit", { defaultValue: "Edit" })}
                          </Button>
                        ) : null}
                        {onDelete ? (
                          <Button variant="destructive" onClick={() => onDelete(section)}>
                            <Trash2 className="h-4 w-4" />
                            {t("common.delete", { defaultValue: "Delete" })}
                          </Button>
                        ) : null}
                      </div>
                    </ProtectedComponent>
                  ) : null}
                </div>

                {Object.keys(section.data ?? {}).length ? (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {Object.entries(section.data ?? {}).map(([key, value]) => (
                      <EventInfoBlock
                        key={key}
                        label={key.replace(/_/g, " ")}
                        value={renderDataValue(value)}
                      />
                    ))}
                  </div>
                ) : (
                  <EventEmptyState
                    title={t("events.emptySectionDataTitle", {
                      defaultValue: "No structured data yet",
                    })}
                    description={t("events.emptySectionData", {
                      defaultValue:
                        "No structured data has been added to this section yet.",
                    })}
                    className="py-7"
                  />
                )}

                {section.notes ? (
                  <div className="rounded-[20px] border border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)] px-4 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--lux-text-muted)]">
                      {t("common.notes", { defaultValue: "Notes" })}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--lux-text-secondary)]">
                      {section.notes}
                    </p>
                  </div>
                ) : null}
              </EventPanelCard>
            );
          })
        ) : (
          <EventEmptyState
            title={t("events.noSectionsTitle", {
              defaultValue: "No sections added yet",
            })}
            description={t("events.noSections", {
              defaultValue: "No sections have been added to this event yet.",
            })}
          />
        )}
      </CardContent>
    </Card>
  );
}
