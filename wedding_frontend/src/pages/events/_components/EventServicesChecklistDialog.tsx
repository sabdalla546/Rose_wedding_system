import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Search } from "lucide-react";

import {
  AppDialogBody,
  AppDialogFooter,
  AppDialogHeader,
  AppDialogShell,
} from "@/components/shared/app-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCreateEventService } from "@/hooks/services/useEventServiceMutations";
import { useServices } from "@/hooks/services/useServices";
import type {
  EventServiceItemFormData,
  Service,
  ServiceCategory,
} from "@/pages/services/types";
import { EventEmptyState, EventPanelCard } from "./EventDetailsPrimitives";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: number;
  existingServiceIds?: number[];
  onSelectService?: (service: Service) => void;
};

const STATUS_DEFAULT = "confirmed";

const formatCategoryLabel = (
  category: ServiceCategory,
  t: (key: string, options?: Record<string, unknown>) => string,
) =>
  t(`services.category.${category}`, {
    defaultValue: category.replace(/_/g, " "),
  });

export function EventServicesChecklistDialog({
  open,
  onOpenChange,
  eventId,
  existingServiceIds = [],
  onSelectService,
}: Props) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const createEventServiceMutation = useCreateEventService();

  const { data, isLoading } = useServices({
    currentPage: 1,
    itemsPerPage: 500,
    searchQuery,
    category: "all",
    isActive: "true",
  });

  const services = useMemo<Service[]>(() => data?.data ?? [], [data?.data]);
  const existingServiceIdSet = useMemo(
    () => new Set(existingServiceIds),
    [existingServiceIds],
  );

  const groupedServices = useMemo(
    () =>
      services.reduce<Record<string, Service[]>>((accumulator, service) => {
        const key = service.category;
        if (!accumulator[key]) accumulator[key] = [];
        accumulator[key].push(service);
        return accumulator;
      }, {}),
    [services],
  );

  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setSelectedServiceIds([]);
      setSubmitting(false);
    }
  }, [open]);

  const toggleService = (serviceId: number, checked: boolean) => {
    setSelectedServiceIds((current) =>
      onSelectService
        ? checked
          ? [serviceId]
          : []
        : checked
          ? [...current, serviceId]
          : current.filter((id) => id !== serviceId),
    );
  };

  const handleSubmit = async () => {
    if (!selectedServiceIds.length) return;

    const selectedServices = services.filter(
      (service) =>
        selectedServiceIds.includes(service.id) &&
        !existingServiceIdSet.has(service.id),
    );

    if (onSelectService) {
      const selectedService = selectedServices[0];

      if (!selectedService) {
        return;
      }

      onSelectService(selectedService);
      onOpenChange(false);
      return;
    }

    try {
      setSubmitting(true);

      await Promise.all(
        selectedServices.map((service, index) => {
          const payload: EventServiceItemFormData = {
            eventId,
            serviceId: String(service.id),
            serviceNameSnapshot: service.name,
            category: service.category,
            notes: "",
            status: STATUS_DEFAULT,
            sortOrder: String(index + 1),
          };

          return createEventServiceMutation.mutateAsync(payload);
        }),
      );

      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCount = selectedServiceIds.length;
  const categoryCount = Object.keys(groupedServices).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AppDialogShell
        size="lg"
        className="max-h-[92dvh] h-[min(92dvh,860px)] w-[min(96vw,980px)] max-w-[980px]"
      >
        <AppDialogHeader
          title={t("services.addEventServiceChecklist", {
            defaultValue: "Add Event Services",
          })}
          description={t("services.addEventServiceChecklistHint", {
            defaultValue:
              "Choose the services you want to add to this event. New items will be saved with the default confirmed status.",
          })}
        />

        <AppDialogBody className="min-h-0 flex flex-1 flex-col overflow-y-auto gap-0 px-0 py-0">
          <div className="shrink-0 border-b border-[var(--lux-gold-border)] px-4 py-4 sm:px-6">
            <div className="flex flex-col gap-3">
              <div className="relative w-full">
                <Search className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--lux-text-muted)]" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder={t("services.searchPlaceholder", {
                    defaultValue:
                      "Search by service name, code, or category...",
                  })}
                  className="h-10 rounded-2xl pr-10 text-sm"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="secondary"
                  className="rounded-full px-2.5 py-1 text-[10px] font-semibold"
                >
                  {t("services.defaultStatus", {
                    defaultValue: "Default Status",
                  })}
                  :{" "}
                  {t("services.status.confirmed", {
                    defaultValue: "Confirmed",
                  })}
                </Badge>
                <Badge
                  variant="outline"
                  className="rounded-full px-2.5 py-1 text-[10px] font-semibold"
                >
                  {t("services.availableCount", {
                    defaultValue: "Available",
                  })}
                  : {services.length}
                </Badge>
                <Badge
                  variant="outline"
                  className="rounded-full px-2.5 py-1 text-[10px] font-semibold"
                >
                  {t("services.selectedCount", {
                    defaultValue: "Selected",
                  })}
                  : {selectedCount}
                </Badge>
                <Badge
                  variant="outline"
                  className="rounded-full px-2.5 py-1 text-[10px] font-semibold"
                >
                  {t("services.categoryCount", {
                    defaultValue: "Categories",
                  })}
                  : {categoryCount}
                </Badge>
              </div>
            </div>
          </div>

          <div className="min-h-[320px] flex-1 px-4 pb-4 pt-3 sm:min-h-[420px] sm:px-6 sm:pb-6 sm:pt-4">
            {isLoading ? (
              <div className="flex min-h-[320px] items-center justify-center text-sm text-[var(--lux-text-secondary)] sm:min-h-[420px]">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("common.loading", { defaultValue: "Loading..." })}
              </div>
            ) : services.length === 0 ? (
              <EventEmptyState
                title={t("services.noAvailableServicesTitle", {
                  defaultValue: "No services available",
                })}
                description={t("services.noAvailableServices", {
                  defaultValue:
                    "No services are available. They might already be linked or no active services were found.",
                })}
                className="flex min-h-[320px] items-center justify-center sm:min-h-[420px]"
              />
            ) : (
              <div className="space-y-5">
                {Object.entries(groupedServices).map(([category, items]) => (
                  <EventPanelCard
                    key={category}
                    className="space-y-3 p-3.5 sm:p-4"
                  >
                    <div className="flex items-center justify-between gap-3 rounded-[16px] border border-[var(--lux-gold-border)] bg-[var(--lux-panel-surface)] px-4 py-2.5">
                      <h3 className="text-sm font-semibold text-[var(--lux-heading)] sm:text-base">
                        {formatCategoryLabel(category as ServiceCategory, t)}
                      </h3>
                      <Badge
                        variant="outline"
                        className="rounded-full px-3 py-1 text-[10px] font-semibold"
                      >
                        {items.length}
                      </Badge>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      {items.map((service) => {
                        const checked = selectedServiceIds.includes(service.id);
                        const alreadyAdded = existingServiceIdSet.has(
                          service.id,
                        );

                        return (
                          <label
                            key={service.id}
                            className={`flex min-h-[76px] min-w-0 items-start gap-3 rounded-[20px] border px-4 py-3 transition-all ${
                              alreadyAdded
                                ? "cursor-not-allowed opacity-70"
                                : "cursor-pointer"
                            } ${
                              checked
                                ? "border-[var(--lux-gold-border)] bg-[var(--lux-gold-glow)]/10 shadow-[0_0_0_1px_rgba(247,211,91,0.08)]"
                                : "border-[var(--lux-border)] bg-[var(--lux-card)] hover:border-[var(--lux-gold-border)] hover:bg-[var(--lux-control-hover)]"
                            }`}
                          >
                            <Checkbox
                              checked={alreadyAdded ? true : checked}
                              onCheckedChange={(value) =>
                                !alreadyAdded &&
                                toggleService(service.id, Boolean(value))
                              }
                              className="mt-0.5 shrink-0"
                              disabled={alreadyAdded}
                            />

                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="text-sm font-semibold leading-6 text-[var(--lux-heading)]">
                                  {service.name}
                                </div>
                                {alreadyAdded ? (
                                  <Badge
                                    variant="outline"
                                    className="rounded-full px-2.5 py-1 text-[10px] font-semibold"
                                  >
                                    {t("services.alreadyAdded", {
                                      defaultValue: "Added",
                                    })}
                                  </Badge>
                                ) : null}
                              </div>

                              <div className="text-xs leading-5 text-[var(--lux-text-secondary)]">
                                {formatCategoryLabel(service.category, t)}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </EventPanelCard>
                ))}
              </div>
            )}
          </div>
        </AppDialogBody>

        <AppDialogFooter className="border-[var(--lux-gold-border)] px-5 py-4 sm:px-6">
          <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-base text-[var(--lux-text-secondary)]">
              {t("services.selectedCount", { defaultValue: "Selected" })}:{" "}
              <span className="font-semibold text-[var(--lux-heading)]">
                {selectedCount}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-11 rounded-2xl px-6"
              >
                {t("common.cancel", { defaultValue: "Cancel" })}
              </Button>

              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!selectedCount || submitting}
                className="h-11 rounded-2xl px-6"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("common.saving", { defaultValue: "Saving..." })}
                  </>
                ) : (
                  onSelectService
                    ? t("services.continueToServiceEditor", {
                        defaultValue: "Continue",
                      })
                    : t("services.addSelectedServices", {
                        defaultValue: "Add Selected Services",
                      })
                )}
              </Button>
            </div>
          </div>
        </AppDialogFooter>
      </AppDialogShell>
    </Dialog>
  );
}
