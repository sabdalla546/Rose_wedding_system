import { useMemo, useState } from "react";
import type { CheckedState } from "@radix-ui/react-checkbox";
import { Loader2 } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateEventVendor, useUpdateEventVendor } from "@/hooks/vendors/useEventVendorMutations";
import { useVendorPricingPlans } from "@/hooks/vendors/useVendorPricingPlans";
import { useVendorSubServices } from "@/hooks/vendors/useVendorSubServices";
import { useVendors } from "@/hooks/vendors/useVendors";
import { toNumberValue } from "@/pages/services/adapters";
import {
  EVENT_VENDOR_PROVIDED_BY_OPTIONS,
  EVENT_VENDOR_STATUS_OPTIONS,
  formatMoney,
  formatVendorType,
  getEventVendorDisplayName,
  VENDOR_TYPE_OPTIONS,
} from "@/pages/vendors/adapters";
import type {
  EventVendorLink,
  EventVendorProvidedBy,
  EventVendorStatus,
  EventVendorLinkFormData,
  VendorPricingPlan,
  VendorType,
} from "@/pages/vendors/types";

type EventVendorFormState = {
  vendorType: VendorType;
  providedBy: EventVendorProvidedBy;
  vendorId: string;
  companyNameSnapshot: string;
  selectedSubServiceIds: number[];
  agreedPrice: string;
  isPriceOverride: boolean;
  notes: string;
  status: EventVendorStatus;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: number;
  editingVendorLink?: EventVendorLink | null;
};

const textareaClassName =
  "min-h-[110px] w-full rounded-[22px] border px-4 py-3 text-sm text-[var(--lux-text)] placeholder:text-[var(--lux-text-muted)] outline-none transition-all focus:border-[var(--lux-gold-border)] focus:ring-2 focus:ring-[var(--lux-gold-glow)]";

const createDefaultEventVendorState = (): EventVendorFormState => ({
  vendorType: "dj",
  providedBy: "company",
  vendorId: "",
  companyNameSnapshot: "",
  selectedSubServiceIds: [],
  agreedPrice: "",
  isPriceOverride: false,
  notes: "",
  status: "pending",
});

const formatDecimalInput = (value?: number | string | null) => {
  const parsed = toNumberValue(value);

  if (parsed === null) {
    return "";
  }

  return parsed.toFixed(3);
};

const findMatchingVendorPricingPlan = (
  pricingPlans: VendorPricingPlan[],
  selectedSubServicesCount: number,
) => {
  if (selectedSubServicesCount <= 0) {
    return null;
  }

  return (
    [...pricingPlans]
      .sort((left, right) => {
        if (left.minSubServices !== right.minSubServices) {
          return right.minSubServices - left.minSubServices;
        }

        const leftMax =
          typeof left.maxSubServices === "number"
            ? left.maxSubServices
            : Number.MAX_SAFE_INTEGER;
        const rightMax =
          typeof right.maxSubServices === "number"
            ? right.maxSubServices
            : Number.MAX_SAFE_INTEGER;

        if (leftMax !== rightMax) {
          return leftMax - rightMax;
        }

        return left.id - right.id;
      })
      .find((plan) => {
        const matchesMin = plan.minSubServices <= selectedSubServicesCount;
        const matchesMax =
          plan.maxSubServices === null ||
          typeof plan.maxSubServices === "undefined" ||
          plan.maxSubServices >= selectedSubServicesCount;

        return matchesMin && matchesMax;
      }) ?? null
  );
};

const createStateFromVendorLink = (
  editingVendorLink?: EventVendorLink | null,
): EventVendorFormState => {
  if (!editingVendorLink) {
    return createDefaultEventVendorState();
  }

  return {
    vendorType: editingVendorLink.vendorType,
    providedBy: editingVendorLink.providedBy,
    vendorId: editingVendorLink.vendorId ? String(editingVendorLink.vendorId) : "",
    companyNameSnapshot:
      editingVendorLink.vendor?.name ||
      editingVendorLink.resolvedCompanyName ||
      editingVendorLink.companyNameSnapshot ||
      "",
    selectedSubServiceIds: (editingVendorLink.selectedSubServices ?? [])
      .map((item) => item.vendorSubServiceId)
      .filter((value): value is number => typeof value === "number"),
    agreedPrice: formatDecimalInput(editingVendorLink.agreedPrice),
    isPriceOverride: Boolean(editingVendorLink.hasManualPriceOverride),
    notes: editingVendorLink.notes || "",
    status: editingVendorLink.status,
  };
};

export function EventVendorAssignmentDialog({
  open,
  onOpenChange,
  eventId,
  editingVendorLink = null,
}: Props) {
  const [form, setForm] = useState<EventVendorFormState>(() =>
    createStateFromVendorLink(editingVendorLink),
  );
  const [error, setError] = useState("");

  const createEventVendorMutation = useCreateEventVendor(eventId);
  const updateEventVendorMutation = useUpdateEventVendor(eventId);

  const { data: vendorCatalogResponse } = useVendors({
    currentPage: 1,
    itemsPerPage: 200,
    searchQuery: "",
    type: "all",
    isActive: "all",
  });
  const vendorCatalog = useMemo(
    () => vendorCatalogResponse?.data ?? [],
    [vendorCatalogResponse?.data],
  );

  const filteredVendorCatalog = useMemo(
    () =>
      vendorCatalog.filter(
        (vendor) =>
          vendor.type === form.vendorType &&
          (vendor.isActive || String(vendor.id) === form.vendorId),
      ),
    [form.vendorId, form.vendorType, vendorCatalog],
  );

  const selectedVendor = useMemo(
    () =>
      filteredVendorCatalog.find((vendor) => String(vendor.id) === form.vendorId) ??
      null,
    [filteredVendorCatalog, form.vendorId],
  );

  const { data: vendorSubServicesResponse, isLoading: vendorSubServicesLoading } =
    useVendorSubServices({
      currentPage: 1,
      itemsPerPage: 200,
      searchQuery: "",
      vendorId: form.vendorId ? Number(form.vendorId) : undefined,
      vendorType: "all",
      isActive: "all",
      enabled: form.providedBy === "company" && Boolean(form.vendorId),
    });

  const { data: vendorPricingPlansResponse, isLoading: vendorPricingPlansLoading } =
    useVendorPricingPlans({
      currentPage: 1,
      itemsPerPage: 200,
      searchQuery: "",
      vendorId: form.vendorId ? Number(form.vendorId) : undefined,
      vendorType: "all",
      isActive: "true",
      enabled: form.providedBy === "company" && Boolean(form.vendorId),
    });

  const vendorSubServices = useMemo(
    () => vendorSubServicesResponse?.data ?? [],
    [vendorSubServicesResponse?.data],
  );
  const vendorPricingPlans = useMemo(
    () => vendorPricingPlansResponse?.data ?? [],
    [vendorPricingPlansResponse?.data],
  );
  const selectedPricingPlan = useMemo(
    () =>
      findMatchingVendorPricingPlan(
        vendorPricingPlans,
        form.selectedSubServiceIds.length,
      ),
    [form.selectedSubServiceIds.length, vendorPricingPlans],
  );
  const calculatedVendorPriceInput = useMemo(
    () => formatDecimalInput(selectedPricingPlan?.price),
    [selectedPricingPlan?.price],
  );
  const resolvedAgreedPrice = form.isPriceOverride
    ? form.agreedPrice
    : calculatedVendorPriceInput;
  const pending =
    createEventVendorMutation.isPending || updateEventVendorMutation.isPending;

  const handleSubmit = async () => {
    const manualCompanyNameSnapshot = form.companyNameSnapshot.trim();
    const resolvedCompanyNameSnapshot =
      form.providedBy === "company"
        ? selectedVendor?.name || manualCompanyNameSnapshot
        : manualCompanyNameSnapshot;

    if (form.providedBy === "company") {
      if (!form.vendorId && !resolvedCompanyNameSnapshot) {
        setError("اختر شركة أو اكتب اسم الشركة يدويًا.");
        return;
      }
    } else if (!resolvedCompanyNameSnapshot) {
      setError("اكتب اسم الشركة أو الجهة التي أحضرها العميل.");
      return;
    }

    if (!form.vendorId && form.selectedSubServiceIds.length > 0) {
      setError("لا يمكن اختيار خدمات فرعية قبل تحديد الشركة.");
      return;
    }

    if (
      form.agreedPrice.trim() &&
      (toNumberValue(form.agreedPrice) === null || Number(form.agreedPrice) < 0)
    ) {
      setError("أدخل تكلفة صحيحة أو اترك الحقل فارغًا.");
      return;
    }

    setError("");

    const payload: EventVendorLinkFormData = {
      eventId,
      vendorType: form.vendorType,
      providedBy: form.providedBy,
      vendorId: form.providedBy === "company" ? form.vendorId : "",
      companyNameSnapshot: resolvedCompanyNameSnapshot,
      selectedSubServiceIds:
        form.providedBy === "company" ? form.selectedSubServiceIds : [],
      agreedPrice: resolvedAgreedPrice,
      notes: form.notes,
      status: form.status,
    };

    if (editingVendorLink) {
      await updateEventVendorMutation.mutateAsync({
        id: editingVendorLink.id,
        values: payload,
      });
    } else {
      await createEventVendorMutation.mutateAsync(payload);
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AppDialogShell size="lg">
        <AppDialogHeader
          title={editingVendorLink ? "تعديل الشركة المرتبطة" : "إضافة شركة للحفل"}
          description="اربط الشركة والخدمات الفرعية والخطة السعرية داخل نفس مساحة إدارة الحفل."
        />

        <AppDialogBody className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm font-medium text-[var(--lux-text)]">نوع الشركة</p>
              <Select
                value={form.vendorType}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    vendorType: value,
                    vendorId: "",
                    companyNameSnapshot: "",
                    selectedSubServiceIds: [],
                    agreedPrice: "",
                    isPriceOverride: false,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر النوع" />
                </SelectTrigger>
                <SelectContent>
                  {VENDOR_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {formatVendorType(option.value)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-[var(--lux-text)]">الجهة المقدمة</p>
              <Select
                value={form.providedBy}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    providedBy: value as EventVendorProvidedBy,
                    vendorId: value === "client" ? "" : current.vendorId,
                    selectedSubServiceIds:
                      value === "client" ? [] : current.selectedSubServiceIds,
                    agreedPrice: value === "client" ? "" : current.agreedPrice,
                    isPriceOverride: value === "client" ? true : current.isPriceOverride,
                    companyNameSnapshot:
                      value === "client" ? current.companyNameSnapshot : "",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الجهة" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_VENDOR_PROVIDED_BY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.value === "company" ? "من الشركة" : "من العميل"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-[var(--lux-text)]">الحالة</p>
              <Select
                value={form.status}
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    status: value as EventVendorStatus,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_VENDOR_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.value === "pending"
                        ? "قيد الانتظار"
                        : option.value === "approved"
                          ? "معتمد"
                          : option.value === "confirmed"
                            ? "مؤكد"
                            : "ملغي"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-[24px] border border-[var(--lux-row-border)] bg-[var(--lux-row-surface)] p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                {form.providedBy === "company" ? "تشغيل داخلي" : "مورد من العميل"}
              </Badge>
              <Badge variant="outline">{formatVendorType(form.vendorType)}</Badge>
              {editingVendorLink ? (
                <Badge variant="outline">{getEventVendorDisplayName(editingVendorLink)}</Badge>
              ) : null}
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {form.providedBy === "company" ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-[var(--lux-text)]">اختيار الشركة</p>
                  <Select
                    value={form.vendorId || "none"}
                    onValueChange={(value) =>
                      setForm((current) => {
                        const nextVendor =
                          filteredVendorCatalog.find(
                            (vendor) => String(vendor.id) === value,
                          ) ?? null;

                        return {
                          ...current,
                          vendorId: value === "none" ? "" : value,
                          companyNameSnapshot:
                            nextVendor?.name ?? (value === "none" ? "" : current.companyNameSnapshot),
                          selectedSubServiceIds: [],
                          agreedPrice: current.isPriceOverride ? "" : current.agreedPrice,
                          isPriceOverride: false,
                        };
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الشركة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">بدون اختيار</SelectItem>
                      {filteredVendorCatalog.map((vendor) => (
                        <SelectItem key={vendor.id} value={String(vendor.id)}>
                          {vendor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs leading-5 text-[var(--lux-text-secondary)]">
                    يمكنك أيضًا ترك الشركة فارغة وكتابة الاسم يدويًا إذا لم تكن مسجلة بعد.
                  </p>
                </div>
              ) : null}

              <div className="space-y-2">
                <p className="text-sm font-medium text-[var(--lux-text)]">
                  {form.providedBy === "company" ? "اسم الشركة المعروض" : "اسم الشركة / الجهة"}
                </p>
                <Input
                  value={form.companyNameSnapshot}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      companyNameSnapshot: event.target.value,
                    }))
                  }
                  placeholder="اكتب الاسم الظاهر في ملف الحفل"
                />
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-[var(--lux-row-border)] bg-[var(--lux-row-surface)] p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-[var(--lux-text)]">
                  الخدمات الفرعية والخطة السعرية
                </h3>
                <p className="text-xs leading-5 text-[var(--lux-text-secondary)]">
                  اختر الخدمات الفرعية لاحتساب الخطة السعرية تلقائيًا عند توفرها.
                </p>
              </div>
              <Badge variant="outline">{form.selectedSubServiceIds.length} خدمة</Badge>
            </div>

            {form.providedBy !== "company" ? (
              <div className="mt-4 rounded-[18px] border border-dashed border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)] p-4 text-sm text-[var(--lux-text-secondary)]">
                الخدمات الفرعية متاحة فقط عند اختيار شركة من قاعدة البيانات.
              </div>
            ) : !form.vendorId ? (
              <div className="mt-4 rounded-[18px] border border-dashed border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)] p-4 text-sm text-[var(--lux-text-secondary)]">
                اختر الشركة أولًا لإظهار خدماتها الفرعية وخططها السعرية.
              </div>
            ) : vendorSubServicesLoading ? (
              <div className="mt-4 flex items-center justify-center rounded-[18px] border border-dashed border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)] p-6 text-sm text-[var(--lux-text-secondary)]">
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري تحميل الخدمات الفرعية...
              </div>
            ) : vendorSubServices.length === 0 ? (
              <div className="mt-4 rounded-[18px] border border-dashed border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)] p-4 text-sm text-[var(--lux-text-secondary)]">
                لا توجد خدمات فرعية مفعلة لهذه الشركة حاليًا.
              </div>
            ) : (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {vendorSubServices.map((subService) => {
                  const checked = form.selectedSubServiceIds.includes(subService.id);

                  return (
                    <label
                      key={subService.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-[18px] border px-4 py-3 transition-all ${
                        checked
                          ? "border-[var(--lux-gold-border)] bg-[var(--lux-gold-glow)]/10"
                          : "border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)] hover:border-[var(--lux-gold-border)]"
                      }`}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value: CheckedState) =>
                          setForm((current) => ({
                            ...current,
                            selectedSubServiceIds: value
                              ? [...current.selectedSubServiceIds, subService.id]
                              : current.selectedSubServiceIds.filter(
                                  (itemId) => itemId !== subService.id,
                                ),
                          }))
                        }
                        className="mt-0.5 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[var(--lux-heading)]">
                          {subService.name}
                        </p>
                        <p className="text-xs leading-5 text-[var(--lux-text-secondary)]">
                          {subService.code || "بدون كود"}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            <div className="mt-4 rounded-[18px] border border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-[var(--lux-text)]">الخطة السعرية المقترحة</p>
                  <p className="text-xs leading-5 text-[var(--lux-text-secondary)]">
                    {vendorPricingPlansLoading
                      ? "جاري احتساب الخطة الأنسب..."
                      : selectedPricingPlan
                        ? selectedPricingPlan.name
                        : "لا توجد خطة مطابقة لعدد الخدمات المختارة."}
                  </p>
                </div>
                <Badge variant="secondary">
                  {selectedPricingPlan ? formatMoney(selectedPricingPlan.price) : "-"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] border border-[var(--lux-row-border)] bg-[var(--lux-row-surface)] p-4 sm:p-5">
              <div className="flex items-center gap-3 rounded-[18px] border border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)] p-4">
                <Checkbox
                  checked={form.isPriceOverride}
                  onCheckedChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      isPriceOverride: !!value,
                      agreedPrice: value
                        ? current.agreedPrice
                        : calculatedVendorPriceInput,
                    }))
                  }
                />
                <div>
                  <p className="text-sm font-medium text-[var(--lux-text)]">تعديل السعر يدويًا</p>
                  <p className="text-xs leading-5 text-[var(--lux-text-secondary)]">
                    عطّل التسعير التلقائي إذا كان هناك اتفاق خاص مع المورد.
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-[var(--lux-text)]">التكلفة المتفق عليها</p>
                <Input
                  value={resolvedAgreedPrice}
                  disabled={!form.isPriceOverride}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      agreedPrice: event.target.value,
                    }))
                  }
                  placeholder="0.000"
                />
              </div>
            </div>

            <div className="rounded-[24px] border border-[var(--lux-row-border)] bg-[var(--lux-row-surface)] p-4 sm:p-5">
              <div className="space-y-2">
                <p className="text-sm font-medium text-[var(--lux-text)]">ملاحظات التشغيل</p>
                <textarea
                  className={textareaClassName}
                  value={form.notes}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  placeholder="أضف تفاصيل التنسيق أو شروط الشركة إن وجدت"
                />
              </div>
            </div>
          </div>

          {error ? (
            <div className="rounded-[18px] border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}
        </AppDialogBody>

        <AppDialogFooter>
          <div className="flex w-full items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={pending}>
              {pending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جارٍ الحفظ...
                </>
              ) : editingVendorLink ? (
                "حفظ التعديلات"
              ) : (
                "إضافة الشركة"
              )}
            </Button>
          </div>
        </AppDialogFooter>
      </AppDialogShell>
    </Dialog>
  );
}
