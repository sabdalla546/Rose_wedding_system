import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  CircleDollarSign,
  Download,
  Package2,
  Plus,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { AppCalendar } from "@/components/calendar/app-calendar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardPageLayout } from "@/components/dashboard/dashboard-page-layout";
import { QuickActionsCard } from "@/components/dashboard/quick-actions-card";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { MetricCard } from "@/components/shared/metric-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import type { AppCalendarEvent } from "@/components/calendar/types";
import {
  bookingRingSummary,
  dashboardMetrics,
  inventoryAllocations,
  lowStockItems,
  paymentRows,
  quickActions,
  recentActivity,
  recentBookings,
  reportSeries,
  todaysSchedule,
} from "@/data/mock/dashboard";
import { formatCurrency, formatDateLabel } from "@/lib/utils";

const metricTrends = {
  todayEvents: { value: "+12%", label: "vs last day", direction: "up" as const },
  upcoming: { value: "+6%", label: "next 7 days", direction: "up" as const },
  pendingQuotes: { value: "-4%", label: "follow-up load", direction: "down" as const },
  revenue: { value: "+18%", label: "month to date", direction: "up" as const },
};

export function DashboardPage() {
  const { t } = useTranslation();
  const [selectedBookingId, setSelectedBookingId] = useState<string>(
    recentBookings[0]?.id ?? "",
  );

  const dashboardCalendarEvents = useMemo<AppCalendarEvent[]>(
    () =>
      recentBookings.map((booking) => ({
        id: booking.id,
        title: booking.clientName,
        start: new Date(booking.eventDate),
        end: new Date(booking.eventDate),
        accent: (
          booking.status === "Confirmed"
            ? "emerald"
            : booking.status === "Completed"
              ? "blue"
              : booking.status === "Pending"
                ? "gold"
                : "rose"
        ) as AppCalendarEvent["accent"],
        statusLabel: booking.status,
        typeLabel: booking.venue,
        subtitle: booking.venue,
        description: `${booking.bookingNumber} • ${formatCurrency(booking.total)}`,
        raw: booking,
      })),
    [],
  );

  const selectedBooking =
    recentBookings.find((booking) => booking.id === selectedBookingId) ??
    recentBookings[0] ??
    null;

  return (
    <DashboardPageLayout>
      <DashboardHeader
        eyebrow={t("dashboard.operations", { defaultValue: "Daily Operations" })}
        title={t("dashboard.welcome")}
        description={t("dashboard.subtitle")}
        actions={
          <>
            <Button variant="outline">
              <Download className="h-4 w-4" />
              {t("dashboard.export", { defaultValue: "Export" })}
            </Button>
            <Button>
              <Plus className="h-4 w-4" />
              {t("dashboard.createAction", { defaultValue: "New Booking" })}
            </Button>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboardMetrics.map((metric) => (
          <MetricCard
            key={metric.id}
            label={t(metric.labelKey)}
            value={metric.value}
            meta={metric.meta}
            subtitle={t("dashboard.metricHint", {
              defaultValue: "Updated from the live planning board.",
            })}
            icon={metric.icon}
            trend={metricTrends[metric.id as keyof typeof metricTrends]}
          />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_380px]">
        <div className="space-y-4">
          <ChartCard
            title={t("dashboard.todaySchedule")}
            description={t("dashboard.todayScheduleHint", {
              defaultValue: "Operational handoff for the current day.",
            })}
            actions={
              <Button variant="outline">
                {t("dashboard.viewCalendar")}
              </Button>
            }
          >
            <div className="space-y-3">
              {todaysSchedule.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-4 rounded-[18px] border px-4 py-3"
                  style={{
                    background: "var(--lux-row-surface)",
                    borderColor: "var(--lux-row-border)",
                  }}
                >
                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--lux-gold)]" />
                  <div className="min-w-[82px] text-sm text-[var(--lux-text-secondary)]">
                    {item.time}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-[var(--lux-heading)]">
                        {item.clientName}
                      </p>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="text-sm text-[var(--lux-text-secondary)]">
                      {item.venue}
                    </p>
                    <p className="text-xs text-[var(--lux-text-muted)]">{item.focus}</p>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>

          <ChartCard
            title={t("dashboard.recentBookings")}
            description={t("dashboard.recentBookingsHint", {
              defaultValue: "Latest confirmed and pending bookings across the operation.",
            })}
          >
            <div className="space-y-3">
              {recentBookings.map((booking) => (
                <button
                  key={booking.id}
                  type="button"
                  className="grid w-full gap-3 rounded-[18px] border px-4 py-3 text-left transition hover:border-[var(--lux-gold-border)]"
                  style={{
                    background: "var(--lux-row-surface)",
                    borderColor:
                      selectedBookingId === booking.id
                        ? "var(--lux-gold-border)"
                        : "var(--lux-row-border)",
                  }}
                  onClick={() => setSelectedBookingId(booking.id)}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--lux-heading)]">
                        {booking.clientName}
                      </p>
                      <p className="text-xs text-[var(--lux-text-muted)]">
                        {booking.bookingNumber} • {booking.venue}
                      </p>
                    </div>
                    <StatusBadge status={booking.status} />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                    <span className="text-[var(--lux-text-secondary)]">
                      {formatDateLabel(booking.eventDate, "dd MMM yyyy")}
                    </span>
                    <span className="font-semibold text-[var(--lux-heading)]">
                      {formatCurrency(booking.total)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </ChartCard>

          <ChartCard
            title={t("dashboard.reports")}
            description={t("dashboard.reportsHint", {
              defaultValue: "Revenue trend snapshot across the current cycle.",
            })}
          >
            <div className="rounded-[18px] border p-4" style={{ background: "var(--lux-row-surface)", borderColor: "var(--lux-row-border)" }}>
              <svg className="h-[120px] w-full" preserveAspectRatio="none" viewBox="0 0 264 120">
                <defs>
                  <linearGradient id="dashboardReportLine" x1="0%" x2="100%" y1="0%" y2="0%">
                    <stop offset="0%" stopColor="var(--color-info)" />
                    <stop offset="100%" stopColor="var(--color-primary)" />
                  </linearGradient>
                </defs>
                <polyline
                  fill="none"
                  points={reportSeries
                    .map((value, index) => `${index * 24},${112 - value * 2}`)
                    .join(" ")}
                  stroke="url(#dashboardReportLine)"
                  strokeLinecap="round"
                  strokeWidth="4"
                />
              </svg>
              <div className="mt-4 flex items-center justify-between text-xs text-[var(--lux-text-muted)]">
                <span>Jan</span>
                <span>Mar</span>
                <span>May</span>
                <span>Jul</span>
                <span>Sep</span>
                <span>Nov</span>
              </div>
            </div>
          </ChartCard>
        </div>

        <div className="space-y-4">
          <QuickActionsCard
            title={t("dashboard.quickActions")}
            description={t("dashboard.quickActionsHint", {
              defaultValue: "Shortcuts for the most common daily tasks.",
            })}
            actions={quickActions.map((action, index) => ({
              id: action.id,
              label: t(action.labelKey),
              icon: action.icon,
              tone: index === 0 ? "primary" : "default",
            }))}
          />

          <SummaryCard
            label={t("dashboard.bookingSummary", { defaultValue: "Booking Summary" })}
            value={bookingRingSummary.totalItems}
            hint={t("dashboard.totalItems", { defaultValue: "Total items" })}
            accent={
              <div className="inline-flex items-center gap-1 rounded-full bg-[var(--color-success-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--color-success)]">
                <ArrowUpRight className="h-3.5 w-3.5" />
                76%
              </div>
            }
          >
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--lux-text-secondary)]">
                  {t("dashboard.paymentRows.paid")}
                </span>
                <span className="font-semibold text-[var(--lux-heading)]">
                  {formatCurrency(bookingRingSummary.paid)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--lux-text-secondary)]">
                  {t("dashboard.paymentRows.due")}
                </span>
                <span className="font-semibold text-[var(--lux-heading)]">
                  {formatCurrency(bookingRingSummary.due)}
                </span>
              </div>
            </div>
          </SummaryCard>

          <ChartCard
            title={t("dashboard.calendar", { defaultValue: "Calendar" })}
            description={t("dashboard.calendarHint", {
              defaultValue: "Monthly booking pulse using the shared calendar shell.",
            })}
          >
            <AppCalendar
              events={dashboardCalendarEvents}
              initialView="month"
              legends={[
                { id: "confirmed", label: "Confirmed", accent: "emerald" },
                { id: "pending", label: "Pending", accent: "gold" },
                { id: "completed", label: "Completed", accent: "blue" },
              ]}
              emptyTitle="No dashboard bookings"
              emptyDescription="Dashboard bookings will appear here as your schedule fills up."
              onEventSelect={(event) => setSelectedBookingId(event.id)}
            />
          </ChartCard>

          <ChartCard
            title={t("dashboard.inventory", { defaultValue: "Inventory" })}
            description={t("dashboard.inventoryHint", {
              defaultValue: "Reserved and prepared items for active bookings.",
            })}
          >
            <div className="space-y-3">
              {inventoryAllocations.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-[18px] border px-4 py-3"
                  style={{
                    background: "var(--lux-row-surface)",
                    borderColor: "var(--lux-row-border)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="app-icon-chip h-10 w-10 rounded-xl">
                      <Package2 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--lux-heading)]">
                        {item.itemName}
                      </p>
                      <p className="text-xs text-[var(--lux-text-muted)]">{item.status}</p>
                    </div>
                  </div>
                  <span className="crud-filter-pill">{item.quantity}</span>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <ChartCard
          title={t("dashboard.payments", { defaultValue: "Payments" })}
          description={t("dashboard.paymentsHint", {
            defaultValue: "Today’s financial snapshot across active accounts.",
          })}
          actions={
            <Button variant="outline">
              <CircleDollarSign className="h-4 w-4" />
              {t("dashboard.collect", { defaultValue: "Collect" })}
            </Button>
          }
        >
          <div className="grid gap-3 md:grid-cols-2">
            {paymentRows.map((row) => (
              <SummaryCard
                key={row.id}
                label={row.id === "pay-1" ? t("dashboard.paymentRows.paid") : t("dashboard.paymentRows.due")}
                value={formatCurrency(row.amount)}
                hint={t("dashboard.financeSummary", {
                  defaultValue: "Auto-calculated from active bookings.",
                })}
              />
            ))}
          </div>
        </ChartCard>

        <ChartCard
          title={t("dashboard.lowStockAlerts", { defaultValue: "Low Stock Alerts" })}
          description={t("dashboard.lowStockHint", {
            defaultValue: "Inventory items that need attention soon.",
          })}
        >
          <div className="space-y-3">
            {lowStockItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-[18px] border px-4 py-3"
                style={{
                  background: "var(--lux-row-surface)",
                  borderColor: "var(--lux-row-border)",
                }}
              >
                <div>
                  <p className="text-sm font-semibold text-[var(--lux-heading)]">
                    {item.itemName}
                  </p>
                  <p className="text-xs text-[var(--lux-text-muted)]">
                    Reorder level {item.reorderLevel}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[var(--lux-heading)]">
                    {item.availableQty}
                  </p>
                  <p className="text-xs text-[var(--color-danger)]">{item.status}</p>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <ChartCard
          title={t("dashboard.selectedBooking", { defaultValue: "Selected Booking" })}
          description={t("dashboard.selectedBookingHint", {
            defaultValue: "Use the list or calendar to inspect one booking at a time.",
          })}
        >
          {selectedBooking ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-[var(--lux-heading)]">
                    {selectedBooking.clientName}
                  </p>
                  <p className="text-sm text-[var(--lux-text-secondary)]">
                    {selectedBooking.bookingNumber} • {selectedBooking.venue}
                  </p>
                </div>
                <StatusBadge status={selectedBooking.status} />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <SummaryCard
                  label={t("common.date", { defaultValue: "Date" })}
                  value={formatDateLabel(selectedBooking.eventDate, "dd MMM yyyy")}
                  hint={t("dashboard.eventDate", { defaultValue: "Planned event date" })}
                />
                <SummaryCard
                  label={t("dashboard.amount", { defaultValue: "Amount" })}
                  value={formatCurrency(selectedBooking.total)}
                  hint={t("dashboard.balance", { defaultValue: "Current balance" }) + `: ${formatCurrency(selectedBooking.balance)}`}
                />
              </div>
            </div>
          ) : null}
        </ChartCard>

        <ChartCard
          title={t("dashboard.recentActivity", { defaultValue: "Recent Activity" })}
          description={t("dashboard.recentActivityHint", {
            defaultValue: "Latest actions from the planning team.",
          })}
        >
          <div className="space-y-3">
            {recentActivity.map((item) => (
              <div
                key={item.id}
                className="rounded-[18px] border px-4 py-3"
                style={{
                  background: "var(--lux-row-surface)",
                  borderColor: "var(--lux-row-border)",
                }}
              >
                <p className="text-sm font-semibold text-[var(--lux-heading)]">
                  {item.title}
                </p>
                <p className="mt-1 text-sm text-[var(--lux-text-secondary)]">
                  {item.description}
                </p>
                <p className="mt-2 text-xs text-[var(--lux-text-muted)]">
                  {item.timeLabel}
                </p>
              </div>
            ))}
          </div>
        </ChartCard>
      </section>
    </DashboardPageLayout>
  );
}
