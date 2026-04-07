import { useMemo } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";

import { appointmentsApi } from "@/lib/api/appointments";
import { contractsApi } from "@/lib/api/contracts";
import { eventsApi } from "@/lib/api/events";
import { executionBriefsApi } from "@/lib/api/execution-briefs";
import { quotationsApi } from "@/lib/api/quotations";
import { getInitialEventsBusinessFilters } from "@/pages/events/event-query-params";
import type { AppointmentStatus } from "@/pages/appointments/types";
import type { ContractStatus } from "@/pages/contracts/types";
import type { EventStatus } from "@/pages/events/types";
import type { ExecutionBriefStatus } from "@/pages/execution/types";
import type { QuotationStatus } from "@/pages/quotations/types";

const APPOINTMENT_STATUSES: AppointmentStatus[] = [
  "reserved",
  "attended",
  "converted",
  "cancelled",
  "no_show",
];

const EVENT_STATUSES: EventStatus[] = [
  "draft",
  "designing",
  "quotation_pending",
  "quoted",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
];

const QUOTATION_STATUSES: QuotationStatus[] = [
  "draft",
  "sent",
  "approved",
  "rejected",
  "expired",
  "superseded",
  "converted_to_contract",
];

const CONTRACT_STATUSES: ContractStatus[] = [
  "draft",
  "issued",
  "signed",
  "active",
  "completed",
  "cancelled",
  "terminated",
];

const EXECUTION_STATUSES: ExecutionBriefStatus[] = [
  "draft",
  "under_review",
  "approved",
  "handed_off",
  "handed_to_executor",
  "in_progress",
  "completed",
  "cancelled",
];

const countRecord = <T extends string>(
  statuses: readonly T[],
  counts: Array<number | undefined>,
) =>
  Object.fromEntries(
    statuses.map((status, index) => [status, counts[index] ?? 0]),
  ) as Record<T, number>;

export function useAppointmentWorkflowSummary() {
  const totalQuery = useQuery({
    queryKey: ["workflow-summary", "appointments", "total"],
    queryFn: async () =>
      (await appointmentsApi.list({ page: 1, limit: 1 })).meta.total,
    staleTime: 60_000,
  });

  const statusQueries = useQueries({
    queries: APPOINTMENT_STATUSES.map((status) => ({
      queryKey: ["workflow-summary", "appointments", status],
      queryFn: async () =>
        (await appointmentsApi.list({ page: 1, limit: 1, status })).meta.total,
      staleTime: 60_000,
    })),
  });

  return useMemo(() => {
    const statusCounts = countRecord(
      APPOINTMENT_STATUSES,
      statusQueries.map((query) => query.data),
    );

    return {
      total: totalQuery.data ?? 0,
      statusCounts,
      metrics: {
        upcoming: statusCounts.reserved,
        readyToConvert: statusCounts.attended,
        blocked: statusCounts.cancelled + statusCounts.no_show,
      },
      isLoading:
        totalQuery.isLoading || statusQueries.some((query) => query.isLoading),
    };
  }, [statusQueries, totalQuery.data, totalQuery.isLoading]);
}

export function useEventWorkflowSummary() {
  const totalQuery = useQuery({
    queryKey: ["workflow-summary", "events", "total"],
    queryFn: async () =>
      (
        await eventsApi.list({
          currentPage: 1,
          itemsPerPage: 1,
          filters: getInitialEventsBusinessFilters(),
        })
      ).meta.total,
    staleTime: 60_000,
  });

  const statusQueries = useQueries({
    queries: EVENT_STATUSES.map((status) => ({
      queryKey: ["workflow-summary", "events", status],
      queryFn: async () =>
        (
          await eventsApi.list({
            currentPage: 1,
            itemsPerPage: 1,
            filters: { ...getInitialEventsBusinessFilters(), status },
          })
        ).meta.total,
      staleTime: 60_000,
    })),
  });

  return useMemo(() => {
    const statusCounts = countRecord(
      EVENT_STATUSES,
      statusQueries.map((query) => query.data),
    );

    return {
      total: totalQuery.data ?? 0,
      statusCounts,
      metrics: {
        active:
          statusCounts.designing +
          statusCounts.quotation_pending +
          statusCounts.quoted +
          statusCounts.confirmed +
          statusCounts.in_progress,
        completed: statusCounts.completed,
        blocked: statusCounts.cancelled,
      },
      isLoading:
        totalQuery.isLoading || statusQueries.some((query) => query.isLoading),
    };
  }, [statusQueries, totalQuery.data, totalQuery.isLoading]);
}

export function useQuotationWorkflowSummary() {
  const totalQuery = useQuery({
    queryKey: ["workflow-summary", "quotations", "total"],
    queryFn: async () =>
      (
        await quotationsApi.list({
          currentPage: 1,
          itemsPerPage: 1,
          searchQuery: "",
          eventId: "",
          status: "all",
          issueDateFrom: "",
          issueDateTo: "",
        })
      ).meta.total,
    staleTime: 60_000,
  });

  const statusQueries = useQueries({
    queries: QUOTATION_STATUSES.map((status) => ({
      queryKey: ["workflow-summary", "quotations", status],
      queryFn: async () =>
        (
          await quotationsApi.list({
            currentPage: 1,
            itemsPerPage: 1,
            searchQuery: "",
            eventId: "",
            status,
            issueDateFrom: "",
            issueDateTo: "",
          })
        ).meta.total,
      staleTime: 60_000,
    })),
  });

  return useMemo(() => {
    const statusCounts = countRecord(
      QUOTATION_STATUSES,
      statusQueries.map((query) => query.data),
    );

    return {
      total: totalQuery.data ?? 0,
      statusCounts,
      metrics: {
        pending: statusCounts.draft + statusCounts.sent,
        approved: statusCounts.approved,
        blocked:
          statusCounts.rejected +
          statusCounts.expired +
          statusCounts.superseded,
      },
      isLoading:
        totalQuery.isLoading || statusQueries.some((query) => query.isLoading),
    };
  }, [statusQueries, totalQuery.data, totalQuery.isLoading]);
}

export function useContractWorkflowSummary() {
  const totalQuery = useQuery({
    queryKey: ["workflow-summary", "contracts", "total"],
    queryFn: async () =>
      (
        await contractsApi.list({
          currentPage: 1,
          itemsPerPage: 1,
          searchQuery: "",
          quotationId: "",
          eventId: "",
          status: "all",
          signedDateFrom: "",
          signedDateTo: "",
        })
      ).meta.total,
    staleTime: 60_000,
  });

  const statusQueries = useQueries({
    queries: CONTRACT_STATUSES.map((status) => ({
      queryKey: ["workflow-summary", "contracts", status],
      queryFn: async () =>
        (
          await contractsApi.list({
            currentPage: 1,
            itemsPerPage: 1,
            searchQuery: "",
            quotationId: "",
            eventId: "",
            status,
            signedDateFrom: "",
            signedDateTo: "",
          })
        ).meta.total,
      staleTime: 60_000,
    })),
  });

  return useMemo(() => {
    const statusCounts = countRecord(
      CONTRACT_STATUSES,
      statusQueries.map((query) => query.data),
    );

    return {
      total: totalQuery.data ?? 0,
      statusCounts,
      metrics: {
        active: statusCounts.issued + statusCounts.signed + statusCounts.active,
        completed: statusCounts.completed,
        blocked: statusCounts.cancelled + statusCounts.terminated,
      },
      isLoading:
        totalQuery.isLoading || statusQueries.some((query) => query.isLoading),
    };
  }, [statusQueries, totalQuery.data, totalQuery.isLoading]);
}

export function useExecutionWorkflowSummary() {
  const totalQuery = useQuery({
    queryKey: ["workflow-summary", "execution", "total"],
    queryFn: async () =>
      (await executionBriefsApi.list({ status: "all" })).data.length,
    staleTime: 60_000,
  });

  const statusQueries = useQueries({
    queries: EXECUTION_STATUSES.map((status) => ({
      queryKey: ["workflow-summary", "execution", status],
      queryFn: async () =>
        (await executionBriefsApi.list({ status })).data.length,
      staleTime: 60_000,
    })),
  });

  return useMemo(() => {
    const statusCounts = countRecord(
      EXECUTION_STATUSES,
      statusQueries.map((query) => query.data),
    );

    return {
      total: totalQuery.data ?? 0,
      statusCounts,
      metrics: {
        active:
          statusCounts.under_review +
          statusCounts.approved +
          statusCounts.handed_off +
          statusCounts.handed_to_executor +
          statusCounts.in_progress,
        completed: statusCounts.completed,
        blocked: statusCounts.cancelled,
      },
      isLoading:
        totalQuery.isLoading || statusQueries.some((query) => query.isLoading),
    };
  }, [statusQueries, totalQuery.data, totalQuery.isLoading]);
}
