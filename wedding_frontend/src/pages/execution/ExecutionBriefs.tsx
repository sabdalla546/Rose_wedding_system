import { useMemo, useState } from "react";
import { ClipboardList } from "lucide-react";
import { useTranslation } from "react-i18next";

import CompactHeader from "@/components/common/CompactHeader";
import { ProtectedComponent } from "@/components/routing/ProtectedComponent";
import { DataTableShell } from "@/components/shared/data-table-shell";
import { WorkflowModuleDashboard } from "@/components/workflow/workflow-module-dashboard";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { useExecutionBriefs } from "@/hooks/execution/useExecutionBriefs";
import { useExecutionWorkflowSummary } from "@/hooks/workflow/useWorkflowSummaries";

import {
  EXECUTION_BRIEF_STATUS_OPTIONS,
  toTableExecutionBriefs,
} from "./adapters";
import { useExecutionColumns } from "./_components/executionColumns";
import type { ExecutionBriefStatus } from "./types";

const ExecutionBriefsPage = () => {
  const { t } = useTranslation();
  const workflowSummary = useExecutionWorkflowSummary();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ExecutionBriefStatus>(
    "all",
  );

  const { data, isLoading } = useExecutionBriefs({
    search: searchQuery,
    status: statusFilter,
  });
  const briefs = useMemo(
    () => toTableExecutionBriefs(data?.data),
    [data?.data],
  );
  const columns = useExecutionColumns();

  return (
    <ProtectedComponent permission="events.read">
      <div className="min-h-screen space-y-4 bg-background p-4 text-foreground">
        <CompactHeader
          icon={<ClipboardList className="h-5 w-5 text-primary" />}
          title={t("execution.title", { defaultValue: "Execution Briefs" })}
          totalText={`${briefs.length} ${t("execution.totalBriefs", {
            defaultValue: "execution briefs",
          })}`}
          search={{
            placeholder: t("execution.searchPlaceholder", {
              defaultValue:
                "Search execution briefs by id, event, notes, or linked commercial records...",
            }),
            value: searchTerm,
            onChange: setSearchTerm,
            onSubmit: () => setSearchQuery(searchTerm.trim()),
          }}
        />

        <WorkflowModuleDashboard
          title={t("execution.workflowDashboard", {
            defaultValue: "Execution Workflow Visibility",
          })}
          description={t("execution.workflowDashboardHint", {
            defaultValue:
              "Surface briefs waiting for review, handoff, or live execution so operations can act quickly.",
          })}
          metrics={[
            {
              id: "total",
              label: t("common.total", { defaultValue: "Total" }),
              value: workflowSummary.total,
              helper: t("execution.totalBriefs", {
                defaultValue: "execution briefs",
              }),
            },
            {
              id: "active",
              label: t("execution.activeQueue", {
                defaultValue: "Active Queue",
              }),
              value: workflowSummary.metrics.active,
              helper: t("execution.activeQueueHint", {
                defaultValue: "Review, approval, handoff, and live execution work.",
              }),
            },
            {
              id: "completed",
              label: t("execution.completedLabel", {
                defaultValue: "Completed",
              }),
              value: workflowSummary.metrics.completed,
              helper: t("execution.completedLabelHint", {
                defaultValue: "Execution briefs already completed.",
              }),
            },
            {
              id: "blocked",
              label: t("execution.blockedLabel", {
                defaultValue: "Blocked",
              }),
              value: workflowSummary.metrics.blocked,
              helper: t("execution.blockedLabelHint", {
                defaultValue: "Cancelled execution briefs are tracked separately.",
              }),
            },
          ]}
          statuses={[
            {
              key: "all",
              label: t("execution.allStatuses", { defaultValue: "All Statuses" }),
              count: workflowSummary.total,
              active: statusFilter === "all",
              onClick: () => setStatusFilter("all"),
            },
            {
              key: "draft",
              label: t("execution.briefStatusOptions.draft", { defaultValue: "Draft" }),
              count: workflowSummary.statusCounts.draft,
              active: statusFilter === "draft",
              onClick: () => setStatusFilter("draft"),
            },
            {
              key: "under_review",
              label: t("execution.briefStatusOptions.under_review", {
                defaultValue: "Under Review",
              }),
              count: workflowSummary.statusCounts.under_review,
              active: statusFilter === "under_review",
              onClick: () => setStatusFilter("under_review"),
            },
            {
              key: "approved",
              label: t("execution.briefStatusOptions.approved", {
                defaultValue: "Approved",
              }),
              count: workflowSummary.statusCounts.approved,
              active: statusFilter === "approved",
              onClick: () => setStatusFilter("approved"),
            },
            {
              key: "handed_off",
              label: t("execution.briefStatusOptions.handed_off", {
                defaultValue: "Handed Off",
              }),
              count: workflowSummary.statusCounts.handed_off,
              active: statusFilter === "handed_off",
              onClick: () => setStatusFilter("handed_off"),
            },
            {
              key: "in_progress",
              label: t("execution.briefStatusOptions.in_progress", {
                defaultValue: "In Progress",
              }),
              count: workflowSummary.statusCounts.in_progress,
              active: statusFilter === "in_progress",
              onClick: () => setStatusFilter("in_progress"),
            },
          ]}
          footer={
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setStatusFilter("approved")}
                className="inline-flex items-center rounded-[14px] border border-[var(--lux-row-border)] px-4 py-2 text-sm font-medium text-[var(--lux-text)] transition hover:border-[var(--lux-gold-border)] hover:text-[var(--lux-gold)]"
              >
                {t("execution.focusApprovedBriefs", {
                  defaultValue: "Focus approved briefs",
                })}
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className="inline-flex items-center rounded-[14px] border border-[var(--lux-row-border)] px-4 py-2 text-sm font-medium text-[var(--lux-text)] transition hover:border-[var(--lux-gold-border)] hover:text-[var(--lux-gold)]"
              >
                {t("execution.clearStatusFilter", {
                  defaultValue: "Clear status filter",
                })}
              </button>
            </div>
          }
          loading={workflowSummary.isLoading}
        />

        <div className="grid grid-cols-1 gap-3 rounded-[22px] border border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)] p-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-[var(--lux-text)]">
              {t("execution.statusLabel", { defaultValue: "Status" })}
            </span>
            <select
              className="h-10 rounded-xl border px-3 text-[13px] text-[var(--lux-text)] outline-none transition focus:border-[var(--lux-gold-border)]"
              style={{
                background: "var(--lux-control-surface)",
                borderColor: "var(--lux-control-border)",
              }}
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as "all" | ExecutionBriefStatus,
                )
              }
            >
              <option value="all">
                {t("execution.allStatuses", { defaultValue: "All Statuses" })}
              </option>
              {EXECUTION_BRIEF_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(`execution.briefStatusOptions.${option.value}`, {
                    defaultValue: option.label,
                  })}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-[var(--lux-text)]">
              {t("common.search", { defaultValue: "Search" })}
            </span>
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={t("execution.searchPlaceholder", {
                defaultValue: "Search execution briefs...",
              })}
            />
          </label>
        </div>

        <DataTableShell
          title={t("execution.listTitle", {
            defaultValue: "Execution Briefs List",
          })}
          totalItems={briefs.length}
          currentCount={briefs.length}
          entityName={t("execution.title", { defaultValue: "Execution Briefs" })}
          showMeta
        >
          <DataTable
            columns={columns}
            data={briefs}
            enableRowNumbers
            rowNumberStart={1}
            isLoading={isLoading}
            fileName="execution-briefs"
          />
        </DataTableShell>
      </div>
    </ProtectedComponent>
  );
};

export default ExecutionBriefsPage;
