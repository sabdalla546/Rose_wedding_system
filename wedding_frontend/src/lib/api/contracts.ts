import api from "@/lib/axios";
import type {
  ContractResponse,
  ContractsResponse,
  ContractStatus,
} from "@/pages/contracts/types";

const normalizeContractsResponse = (
  payload: unknown,
  fallbackPage: number,
  fallbackLimit: number,
): ContractsResponse => {
  const source =
    payload &&
    typeof payload === "object" &&
    "data" in (payload as Record<string, unknown>) &&
    (payload as Record<string, unknown>).data &&
    typeof (payload as Record<string, unknown>).data === "object" &&
    Array.isArray(
      ((payload as Record<string, unknown>).data as Record<string, unknown>).data,
    )
      ? ((payload as Record<string, unknown>).data as Record<string, unknown>)
      : (payload as Record<string, unknown>);

  const rows = Array.isArray(source?.data)
    ? source.data
    : Array.isArray(source?.rows)
      ? source.rows
      : [];
  const metaSource =
    source?.meta && typeof source.meta === "object"
      ? (source.meta as Record<string, unknown>)
      : {};

  return {
    data: rows as ContractsResponse["data"],
    meta: {
      total:
        typeof metaSource.total === "number"
          ? metaSource.total
          : rows.length,
      page:
        typeof metaSource.page === "number"
          ? metaSource.page
          : fallbackPage,
      limit:
        typeof metaSource.limit === "number"
          ? metaSource.limit
          : fallbackLimit,
      pages:
        typeof metaSource.pages === "number"
          ? metaSource.pages
          : Math.max(1, Math.ceil(rows.length / fallbackLimit)),
    },
  };
};

export const contractsApi = {
  async list(params: {
    currentPage: number;
    itemsPerPage: number;
    searchQuery: string;
    quotationId: string;
    eventId: string;
    status: "all" | ContractStatus;
    signedDateFrom: string;
    signedDateTo: string;
  }) {
    const response = await api.get<ContractsResponse>("/contracts", {
      params: {
        page: params.currentPage,
        limit: params.itemsPerPage,
        search: params.searchQuery || undefined,
        quotationId: params.quotationId ? Number(params.quotationId) : undefined,
        eventId: params.eventId ? Number(params.eventId) : undefined,
        status: params.status === "all" ? undefined : params.status,
        signedDateFrom: params.signedDateFrom || undefined,
        signedDateTo: params.signedDateTo || undefined,
      },
    });

    return normalizeContractsResponse(
      response.data,
      params.currentPage,
      params.itemsPerPage,
    );
  },

  async get(id: string | number) {
    const response = await api.get<ContractResponse>(`/contracts/${id}`);
    return response.data.data;
  },

  updateWorkflowStatus(
    id: string | number,
    status: ContractStatus,
    notes?: string,
  ) {
    return api.put(`/contracts/${id}`, {
      status,
      notes: notes?.trim() ? notes.trim() : undefined,
    });
  },
};
