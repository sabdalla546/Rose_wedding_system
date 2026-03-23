import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { useServices } from "@/hooks/services/useServices";
import { useCreateEventService } from "@/hooks/services/useEventServiceMutations";
import type {
  EventServiceItemFormData,
  Service,
  ServiceCategory,
} from "@/pages/services/types";
import { ScrollArea } from "@/components/ui/scroll-area";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: number;
  existingServiceIds?: number[];
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

  const services: Service[] = data?.data ?? [];

  const availableServices = useMemo(
    () => services.filter((item) => !existingServiceIds.includes(item.id)),
    [services, existingServiceIds],
  );

  const groupedServices = useMemo(() => {
    return availableServices.reduce<Record<string, Service[]>>(
      (acc, service) => {
        const key = service.category;
        if (!acc[key]) acc[key] = [];
        acc[key].push(service);
        return acc;
      },
      {},
    );
  }, [availableServices]);

  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setSelectedServiceIds([]);
      setSubmitting(false);
    }
  }, [open]);

  const toggleService = (serviceId: number, checked: boolean) => {
    setSelectedServiceIds((current) =>
      checked
        ? [...current, serviceId]
        : current.filter((id) => id !== serviceId),
    );
  };

  const handleSubmit = async () => {
    if (!selectedServiceIds.length) return;

    try {
      setSubmitting(true);

      const selectedServices = availableServices.filter((service) =>
        selectedServiceIds.includes(service.id),
      );

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-3xl flex-col overflow-hidden rounded-[28px] border border-[var(--lux-gold-border)] bg-[var(--lux-card)] p-0">
        {" "}
        <DialogHeader className="shrink-0 border-b border-[var(--lux-gold-border)] px-6 py-5">
          <DialogTitle className="text-right text-2xl font-semibold text-[var(--lux-heading)]">
            {t("services.addEventServiceChecklist", {
              defaultValue: "إضافة خدمات للحفل",
            })}
          </DialogTitle>
          <DialogDescription className="text-right text-sm text-[var(--lux-text-secondary)]">
            {t("services.addEventServiceChecklistHint", {
              defaultValue:
                "اختر الخدمات التي تريد إضافتها لهذا الحفل. سيتم حفظها بالحالة الافتراضية: معتمد.",
            })}
          </DialogDescription>
        </DialogHeader>
        <div className="flex min-h-0 flex-1 flex-col space-y-4 px-6 py-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--lux-text-muted)]" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("services.searchPlaceholder", {
                  defaultValue: "ابحث عن خدمة...",
                })}
                className="pr-10"
              />
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                {t("services.defaultStatus", {
                  defaultValue: "الحالة الافتراضية",
                })}
                :{" "}
                {t("services.status.confirmed", {
                  defaultValue: "معتمد",
                })}
              </Badge>

              <Badge variant="outline" className="rounded-full px-3 py-1">
                {t("services.selectedCount", {
                  defaultValue: "المحدد",
                })}
                : {selectedCount}
              </Badge>
            </div>
          </div>
          <Separator />
          <ScrollArea className="min-h-0 flex-1 pr-2">
            {" "}
            {isLoading ? (
              <div className="flex h-32 items-center justify-center text-sm text-[var(--lux-text-secondary)]">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("common.loading", { defaultValue: "Loading..." })}
              </div>
            ) : availableServices.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-sm text-[var(--lux-text-secondary)]">
                {t("services.noAvailableServices", {
                  defaultValue:
                    "لا توجد خدمات متاحة للإضافة. قد تكون كل الخدمات مضافة بالفعل أو لا توجد خدمات فعالة.",
                })}
              </div>
            ) : (
              <div className="space-y-5">
                {Object.entries(groupedServices).map(([category, items]) => (
                  <div key={category} className="space-y-3">
                    <div className="sticky top-0 z-10 rounded-xl bg-[var(--lux-card)]/95 py-1 text-sm font-semibold text-[var(--lux-heading)] backdrop-blur">
                      {formatCategoryLabel(category as ServiceCategory, t)}
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      {items.map((service) => {
                        const checked = selectedServiceIds.includes(service.id);

                        return (
                          <label
                            key={service.id}
                            className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-all ${
                              checked
                                ? "border-[var(--lux-gold-border)] bg-[var(--lux-gold-glow)]/10"
                                : "border-[var(--lux-border)] bg-[var(--lux-card)]"
                            }`}
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(value) =>
                                toggleService(service.id, Boolean(value))
                              }
                              className="mt-1"
                            />

                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-semibold text-[var(--lux-heading)]">
                                {service.name}
                              </div>

                              <div className="mt-1 text-xs text-[var(--lux-text-secondary)]">
                                {formatCategoryLabel(service.category, t)}
                              </div>

                              {service.description ? (
                                <div className="mt-2 text-xs text-[var(--lux-text-muted)]">
                                  {service.description}
                                </div>
                              ) : null}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
        <div className="shrink-0 border-t border-[var(--lux-gold-border)] px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-[var(--lux-text-secondary)]">
              {t("services.selectedCount", { defaultValue: "المحدد" })}:{" "}
              <span className="font-semibold text-[var(--lux-heading)]">
                {selectedCount}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t("common.cancel", { defaultValue: "Cancel" })}
              </Button>

              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!selectedCount || submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("common.saving", { defaultValue: "Saving..." })}
                  </>
                ) : (
                  t("services.addSelectedServices", {
                    defaultValue: "إضافة الخدمات المحددة",
                  })
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
