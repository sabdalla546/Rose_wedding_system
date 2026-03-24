import { useState } from "react";
import { Plus, Tags } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import CompactHeader from "@/components/common/CompactHeader";
import TableHeader from "@/components/common/TableHeader";
import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import Pagination from "@/components/ui/pagination";
import { useVendorPricingPlans } from "@/hooks/vendors/useVendorPricingPlans";
import { useVendors } from "@/hooks/vendors/useVendors";

import { toTableVendorPricingPlans, VENDOR_TYPE_OPTIONS } from "./adapters";
import { useVendorPricingPlansColumns } from "./_components/vendorPricingPlansColumns";
import type { VendorType } from "./types";

const VendorPricingPlansPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [vendorFilter, setVendorFilter] = useState("all");
  const [vendorTypeFilter, setVendorTypeFilter] = useState<"all" | VendorType>(
    "all",
  );
  const [isActiveFilter, setIsActiveFilter] = useState<
    "all" | "true" | "false"
  >("all");

  const viewPermission = "vendors.read";
  const createPermission = "vendors.create";
  const editPermission = "vendors.update";

  const { data: vendorsResponse } = useVendors({
    currentPage: 1,
    itemsPerPage: 200,
    searchQuery: "",
    type: vendorTypeFilter,
    isActive: "all",
  });

  const { data: raw, isLoading } = useVendorPricingPlans({
    currentPage,
    itemsPerPage,
    searchQuery,
    vendorId: vendorFilter === "all" ? undefined : Number(vendorFilter),
    vendorType: vendorTypeFilter,
    isActive: isActiveFilter,
  });

  const vendors = vendorsResponse?.data ?? [];

  const adapted = toTableVendorPricingPlans(raw);
  const pricingPlans = adapted.data.pricingPlans;
  const totalItems = adapted.total;
  const totalPages = adapted.totalPages;
  const rowNumberStart = (currentPage - 1) * itemsPerPage + 1;

  const columns = useVendorPricingPlansColumns({
    editPermission,
  });

  const handleSearchSubmit = () => {
    setSearchQuery(searchTerm.trim());
    setCurrentPage(1);
  };

  return (
    <ProtectedComponent permission={viewPermission}>
      <div className="min-h-screen space-y-4 bg-background p-4 text-foreground">
        <CompactHeader
          icon={<Tags className="h-5 w-5 text-primary" />}
          title={t("vendors.pricingPlans.title", {
            defaultValue: "Vendor Pricing Plans",
          })}
          subtitle={t("vendors.pricingPlans.description", {
            defaultValue:
              "Vendor-based pricing ranges based on the number of selected sub-services.",
          })}
          totalText={
            <>
              {totalItems}{" "}
              {t("vendors.pricingPlans.total", {
                defaultValue: "total pricing plans",
              })}
            </>
          }
          search={{
            placeholder: t("vendors.pricingPlans.searchPlaceholder", {
              defaultValue: "Search by plan name or notes...",
            }),
            value: searchTerm,
            onChange: setSearchTerm,
            onSubmit: handleSearchSubmit,
          }}
          right={
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/settings/vendors")}
              >
                {t("vendors.backToVendors", { defaultValue: "Back to Vendors" })}
              </Button>
              <ProtectedComponent permission={createPermission}>
                <Button
                  size="sm"
                  className="h-auto px-3 py-2 text-xs"
                  onClick={() =>
                    navigate("/settings/vendors/pricing-plans/create")
                  }
                >
                  <Plus className="h-3.5 w-3.5" />
                  {t("vendors.pricingPlans.create", {
                    defaultValue: "Create Pricing Plan",
                  })}
                </Button>
              </ProtectedComponent>
            </>
          }
        />

        <SectionCard className="space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <label className="min-w-[220px] space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--lux-text-muted)]">
                {t("vendors.vendorSelection", { defaultValue: "Vendor" })}
              </span>
              <select
                className="h-11 w-full rounded-2xl border px-4 text-sm text-[var(--lux-text)] outline-none transition focus:border-[var(--lux-gold-border)]"
                style={{
                  background: "var(--lux-control-surface)",
                  borderColor: "var(--lux-control-border)",
                }}
                value={vendorFilter}
                onChange={(event) => {
                  setVendorFilter(event.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="all">
                  {t("vendors.allVendors", { defaultValue: "All Vendors" })}
                </option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={String(vendor.id)}>
                    {vendor.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="min-w-[220px] space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--lux-text-muted)]">
                {t("vendors.typeLabel", { defaultValue: "Vendor Type" })}
              </span>
              <select
                className="h-11 w-full rounded-2xl border px-4 text-sm text-[var(--lux-text)] outline-none transition focus:border-[var(--lux-gold-border)]"
                style={{
                  background: "var(--lux-control-surface)",
                  borderColor: "var(--lux-control-border)",
                }}
                value={vendorTypeFilter}
                onChange={(event) => {
                  setVendorTypeFilter(event.target.value as "all" | VendorType);
                  setVendorFilter("all");
                  setCurrentPage(1);
                }}
              >
                <option value="all">
                  {t("vendors.allTypes", { defaultValue: "All Types" })}
                </option>
                {VENDOR_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(`vendors.type.${option.value}`, {
                      defaultValue: option.label,
                    })}
                  </option>
                ))}
              </select>
            </label>

            <label className="min-w-[220px] space-y-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--lux-text-muted)]">
                {t("vendors.statusFilter", { defaultValue: "Status Filter" })}
              </span>
              <select
                className="h-11 w-full rounded-2xl border px-4 text-sm text-[var(--lux-text)] outline-none transition focus:border-[var(--lux-gold-border)]"
                style={{
                  background: "var(--lux-control-surface)",
                  borderColor: "var(--lux-control-border)",
                }}
                value={isActiveFilter}
                onChange={(event) => {
                  setIsActiveFilter(
                    event.target.value as "all" | "true" | "false",
                  );
                  setCurrentPage(1);
                }}
              >
                <option value="all">
                  {t("vendors.allStatuses", { defaultValue: "All Records" })}
                </option>
                <option value="true">
                  {t("vendors.activeOnly", { defaultValue: "Active Only" })}
                </option>
                <option value="false">
                  {t("vendors.inactiveOnly", { defaultValue: "Inactive Only" })}
                </option>
              </select>
            </label>
          </div>
        </SectionCard>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <TableHeader
            title={t("vendors.pricingPlans.listTitle", {
              defaultValue: "Vendor Pricing Plans",
            })}
            totalItems={totalItems}
            currentCount={pricingPlans.length}
            entityName={t("vendors.pricingPlans.title", {
              defaultValue: "Vendor Pricing Plans",
            })}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setItemsPerPage}
            setCurrentPage={setCurrentPage}
          />

          <div className="overflow-hidden">
            <DataTable
              columns={columns}
              data={pricingPlans}
              rowNumberStart={rowNumberStart}
              enableRowNumbers
              fileName="vendor-pricing-plans"
              isLoading={isLoading}
            />
          </div>

          {totalPages > 1 ? (
            <div className="border-t border-border bg-muted/40 px-6 py-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={(value) => {
                  setItemsPerPage(value);
                  setCurrentPage(1);
                }}
              />
            </div>
          ) : null}
        </div>
      </div>
    </ProtectedComponent>
  );
};

export default VendorPricingPlansPage;
